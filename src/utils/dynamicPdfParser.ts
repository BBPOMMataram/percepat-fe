import dayjs from "dayjs";

export interface ParsedItemResult {
    id: string;
    no: string;
    code: string;
    name: string;
    stock: number;
    satuan: string;
    expired: string | null;
    lokasi: string;
    barang_type: "reagen" | "baku-pembanding" | "atk" | "suku-cadang" | "perlengkapan";
    subKelompokAsal?: string;
    noKontrol?: string;
}

export interface DynamicParseResult {
    docType: "ba_stok_opname" | "bast_surat" | "generic_table";
    nomorDokumen?: string;
    tanggalDokumen?: string;
    totalPages: number;
    totalItems: number;
    items: ParsedItemResult[];
}

/**
 * Mengonversi tanggal bahasa Indonesia ('31 Desember 2025' atau '31/12/2025') ke format ISO YYYY-MM-DD
 */
export function parseIndoDateToIso(str?: string): string {
    if (!str) return dayjs().format("YYYY-MM-DD");
    const trimmed = str.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const monthMap: Record<string, string> = {
        januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
        juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
        jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', agu: '08', agt: '08', sep: '09', okt: '10', nov: '11', des: '12'
    };

    const parts = trimmed.split(/[\s\/-]+/);
    if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let monthStr = parts[1].toLowerCase();
        let year = parts[2];

        if (parts[0].length === 4) {
            year = parts[0];
            monthStr = parts[1].toLowerCase();
            day = parts[2].padStart(2, '0');
        }

        const monthNum = monthMap[monthStr] || (monthStr.length <= 2 ? monthStr.padStart(2, '0') : '01');
        if (year.length === 4) {
            return `${year}-${monthNum}-${day}`;
        }
    }

    return dayjs().format("YYYY-MM-DD");
}

export interface PdfToken {
    str: string;
    x: number;
    y: number;
    width: number;
}

function parseQuantityToken(tok: PdfToken | undefined): number {
    if (!tok) return 0;
    const clean = tok.str.replace(/\./g, "").replace(/,/g, ".");
    return Math.max(0, parseInt(clean, 10) || 0);
}

// Client-side loader for PDF.js without Turbopack canvas bundle issue
export const getSafePdfJs = async (): Promise<any> => {
    if (typeof window === "undefined") return null;
    if ((window as any).pdfjsLib) {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        return lib;
    }

    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src="/pdf.min.js"]');
        if (existingScript) {
            const checkInterval = setInterval(() => {
                const lib = (window as any).pdfjsLib;
                if (lib) {
                    clearInterval(checkInterval);
                    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
                    resolve(lib);
                }
            }, 50);
            setTimeout(() => {
                clearInterval(checkInterval);
                const lib = (window as any).pdfjsLib;
                if (lib) resolve(lib);
                else reject(new Error("Timeout memuat PDF.js"));
            }, 5000);
            return;
        }

        const script = document.createElement("script");
        script.src = "/pdf.min.js";
        script.async = true;
        script.onload = () => {
            const lib = (window as any).pdfjsLib;
            if (lib) {
                lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
                resolve(lib);
            } else {
                reject(new Error("PDF.js library tidak ditemukan di window"));
            }
        };
        script.onerror = () => reject(new Error("Gagal memuat script /pdf.min.js"));
        document.head.appendChild(script);
    });
};

/**
 * Super dynamic PDF table parser that adapts to various PDF layouts:
 * 1. Berita Acara Stok Opname (e.g. 09_BA SO.pdf)
 * 2. BAST Surat Penyerahan Barang Masuk Pusat
 * 3. Generic Multi-Column Inventory Tables
 */
export async function parsePdfDocumentDynamic(
    file: File,
    onProgress?: (current: number, total: number) => void
): Promise<DynamicParseResult> {
    const pdfjsLib = await getSafePdfJs();
    if (!pdfjsLib) {
        throw new Error("Modul pembaca PDF tidak tersedia di browser.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const numPages = doc.numPages;

    let detectedNomor = "";
    let detectedTanggal = "";
    let currentSubKelompok = "";
    let isBastSuratFormat = false;

    const extractedItems: ParsedItemResult[] = [];
    const defaultExpired = dayjs().add(1, "year").format("YYYY-MM-DD");

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (onProgress) onProgress(pageNum, numPages);

        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();

        const rawItems: PdfToken[] = (textContent.items as any[])
            .map((it: any): PdfToken => ({
                str: String(it.str || "").trim(),
                x: Math.round(it.transform?.[4] || 0),
                y: Math.round(it.transform?.[5] || 0),
                width: Math.round(it.width || 0),
            }))
            .filter((it: PdfToken) => it.str.length > 0);

        if (rawItems.length === 0) continue;

        // Group tokens into lines by Y coordinate (tolerance 3.5px)
        const linesMap = new Map<number, PdfToken[]>();
        for (const item of rawItems) {
            let matchedY: number | undefined;
            for (const existingY of linesMap.keys()) {
                if (Math.abs(existingY - item.y) <= 3.5) {
                    matchedY = existingY;
                    break;
                }
            }
            const targetY = matchedY !== undefined ? matchedY : item.y;
            if (!linesMap.has(targetY)) {
                linesMap.set(targetY, []);
            }
            linesMap.get(targetY)!.push(item);
        }

        const sortedYs = Array.from(linesMap.keys()).sort((a: number, b: number) => b - a);

        // Dynamic Column Position Detector for this page
        let detectedHeader = {
            hasHeader: false,
            noX: -1,
            kodeX: -1,
            namaX: -1,
            satuanX: -1,
            fisikX: -1,
            ketX: -1,
        };

        // Pass 1: Detect Metadata & Column Header positions
        for (const y of sortedYs) {
            const lineTokens = linesMap.get(y)!.sort((a: PdfToken, b: PdfToken) => a.x - b.x);
            const lineText = lineTokens.map((t: PdfToken) => t.str).join(" ");
            const lineUpper = lineText.toUpperCase();

            // Detect Document Type
            if (lineUpper.includes("SERAH TERIMA") || lineUpper.includes("BAST") || lineUpper.includes("NO KONTROL")) {
                isBastSuratFormat = true;
            }

            // Detect Document Number & Date
            if (!detectedNomor && (lineUpper.includes("NOMOR") || lineUpper.includes("NO.")) && lineText.includes(":")) {
                const parts = lineText.split(":");
                if (parts[1]) detectedNomor = parts[1].trim();
            }
            if (!detectedTanggal && lineUpper.includes("TANGGAL") && lineText.includes(":")) {
                const parts = lineText.split(":");
                if (parts[1]) detectedTanggal = parseIndoDateToIso(parts[1].trim());
            }

            // Note: Sub Kelompok is tracked sequentially in Pass 2 to maintain correct line order
            // Check if this line is a table header
            const hasNoWord = lineTokens.some((t: PdfToken) => /^NO\.?$/i.test(t.str) && t.x < 100);
            const hasKodeWord = lineTokens.some((t: PdfToken) => /KODE/i.test(t.str));
            const hasNamaWord = lineTokens.some((t: PdfToken) => /URAIAN|NAMA|BARANG/i.test(t.str));

            if (hasNoWord && (hasKodeWord || hasNamaWord)) {
                detectedHeader.hasHeader = true;
                const noToken = lineTokens.find((t: PdfToken) => /^NO\.?$/i.test(t.str) && t.x < 100);
                if (noToken) detectedHeader.noX = noToken.x;

                const kodeToken = lineTokens.find((t: PdfToken) => /KODE/i.test(t.str));
                if (kodeToken) detectedHeader.kodeX = kodeToken.x;

                const namaToken = lineTokens.find((t: PdfToken) => /URAIAN|NAMA/i.test(t.str));
                if (namaToken) detectedHeader.namaX = namaToken.x;

                const satuanToken = lineTokens.find((t: PdfToken) => /SATUAN/i.test(t.str));
                if (satuanToken) detectedHeader.satuanX = satuanToken.x;

                const fisikToken = lineTokens.find((t: PdfToken) => /FISIK|TOTAL|JUMLAH|INVENTARISASI|SALDO/i.test(t.str) && t.x > 300);
                if (fisikToken) detectedHeader.fisikX = fisikToken.x;
            }
        }

        // Pass 2: Extract Inventory Items from Table Rows
        for (let i = 0; i < sortedYs.length; i++) {
            const y = sortedYs[i];
            const lineTokens = linesMap.get(y)!.sort((a: PdfToken, b: PdfToken) => a.x - b.x);
            if (lineTokens.length === 0) continue;

            const firstToken = lineTokens[0];
            const lineText = lineTokens.map((t: PdfToken) => t.str).join(" ");
            const lineUpper = lineText.toUpperCase();

            // Detect and track Sub Kelompok hierarchy sequentially
            if (lineUpper.includes("SUB KELOMPOK")) {
                const afterSub = lineText.substring(lineUpper.indexOf("SUB KELOMPOK") + "SUB KELOMPOK".length);
                const cleanSub = afterSub.replace(/^[\s:]+/, "").split(/\s+\d/)[0].trim();
                if (cleanSub) {
                    currentSubKelompok = cleanSub;
                }
                continue;
            }

            // Skip page headers, footers, and summary banners
            if (
                lineUpper.includes("BERITA ACARA") ||
                lineUpper.includes("INVENTARISASI FISIK") ||
                lineUpper.includes("JUMLAH BAHAN") ||
                lineUpper.includes("HALAMAN ") ||
                lineUpper.includes("HAL ") ||
                lineUpper.includes("TIM INVENTARISASI") ||
                lineUpper.includes("TANDA TANGAN") ||
                lineUpper.includes("LOKASI/TEMPAT") ||
                lineUpper.includes("KODE BARANG")
            ) {
                continue;
            }

            // Determine if this row is a valid item row:
            // Case A: Starts with numeric No (1, 2, 3...) at x < 90
            const isNoMatch = /^\d{1,4}$/.test(firstToken.str) && firstToken.x <= 90;
            
            // Case B: Starts with code-like pattern (e.g. 1.01.03... or 10+ digits)
            const isDirectCodeMatch = /^(\d{1,2}\.|\d{9,})/.test(firstToken.str) && firstToken.x <= 130;

            if (isNoMatch || isDirectCodeMatch) {
                let noVal = isNoMatch ? firstToken.str : String(extractedItems.length + 1);
                
                // Find Kode Barang
                let kodeVal = "";
                let nameStartIndex = isNoMatch ? 1 : 0;

                // Look for code token in next 1-2 tokens
                for (let k = nameStartIndex; k < Math.min(lineTokens.length, nameStartIndex + 3); k++) {
                    const tok = lineTokens[k];
                    // Kode BMN pattern e.g. 1.01.03.01.001 or 1170101001 or 5+ digits
                    if (/^[\d.]{5,}$/.test(tok.str) && tok.x <= 150) {
                        kodeVal = tok.str;
                        nameStartIndex = k + 1;
                        break;
                    }
                }

                // If not found, check if token exists near detectedHeader.kodeX
                if (!kodeVal && detectedHeader.kodeX > 0) {
                    const match = lineTokens.find((t: PdfToken) => Math.abs(t.x - detectedHeader.kodeX) <= 25);
                    if (match && match !== firstToken) {
                        kodeVal = match.str;
                    }
                }

                // Filter out category group summary headers (e.g. "Bahan Kimia Cair", "Alat Tulis")
                if (!kodeVal) {
                    const isGroupSummary = lineTokens.some((t: PdfToken) =>
                        /Bahan Kimia|Alat Tulis|Suku Cadang/i.test(t.str) && t.x < 200
                    );
                    if (isGroupSummary) continue;
                }

                // Separate Name and Numbers
                // Numbers usually appear at x > 330
                const nameTokens = lineTokens.filter(
                    (t: PdfToken) => t !== firstToken && (!kodeVal || t.str !== kodeVal) && t.x < 330
                );
                let nameVal = nameTokens.map((t: PdfToken) => t.str).join(" ").trim();

                // Check if next row is a multi-line continuation of name (no digits at start)
                if (i + 1 < sortedYs.length) {
                    const nextY = sortedYs[i + 1];
                    const nextTokens = linesMap.get(nextY)!.sort((a: PdfToken, b: PdfToken) => a.x - b.x);
                    const nextFirst = nextTokens[0];
                    if (
                        nextFirst &&
                        !/^\d+$/.test(nextFirst.str) &&
                        nextFirst.x >= 90 &&
                        nextFirst.x < 330 &&
                        !nextTokens.some((t: PdfToken) => t.x >= 340)
                    ) {
                        nameVal += " " + nextTokens.map((t: PdfToken) => t.str).join(" ");
                    }
                }

                // Skip rows where name is too short or invalid
                if (!nameVal || nameVal.length < 2) continue;

                // Spatial column quantities (09_BA SO layout)
                // Col 5: Gudang Reagen (335-365)
                // Col 6: Gudang ATK (370-400)
                // Col 7: Lab Terana / BP (405-440)
                // Col 8: Lab Mikro (445-475)
                // Col 9: Infokom / Pemeliharaan (480-535)
                // Col 10: Total Fisik (540-585)
                const c5Tok = lineTokens.find((t: PdfToken) => t.x >= 335 && t.x <= 365 && t.str !== "-");
                const c6Tok = lineTokens.find((t: PdfToken) => t.x >= 370 && t.x <= 400 && t.str !== "-");
                const c7Tok = lineTokens.find((t: PdfToken) => t.x >= 405 && t.x <= 440 && t.str !== "-");
                const c8Tok = lineTokens.find((t: PdfToken) => t.x >= 445 && t.x <= 475 && t.str !== "-");
                const c9Tok = lineTokens.find((t: PdfToken) => t.x >= 480 && t.x <= 535 && t.str !== "-");
                const c10Tok = lineTokens.find((t: PdfToken) => t.x >= 540 && t.x <= 585 && t.str !== "-");

                const qtyC5 = parseQuantityToken(c5Tok);
                const qtyC6 = parseQuantityToken(c6Tok);
                const qtyC7 = parseQuantityToken(c7Tok);
                const qtyC8 = parseQuantityToken(c8Tok);
                const qtyC9 = parseQuantityToken(c9Tok);
                let stockNumber = parseQuantityToken(c10Tok);

                // Fallback for non-BA SO or when Col 10 is missing
                if (stockNumber === 0) {
                    const sumSpatial = qtyC5 + qtyC6 + qtyC7 + qtyC8 + qtyC9;
                    if (sumSpatial > 0) {
                        stockNumber = sumSpatial;
                    } else if (detectedHeader.fisikX > 0) {
                        const fisikTok = lineTokens.find((t: PdfToken) => Math.abs(t.x - detectedHeader.fisikX) <= 35);
                        if (fisikTok && fisikTok.str !== "-") {
                            stockNumber = parseQuantityToken(fisikTok);
                        }
                    } else {
                        const numTokens = lineTokens.filter(
                            (t: PdfToken) => t.x >= 330 && /^[-+]?[\d.,]+$/.test(t.str)
                        );
                        if (numTokens.length > 0) {
                            stockNumber = parseQuantityToken(numTokens[numTokens.length - 1]);
                        }
                    }
                }

                // Document Hierarchy & Spatial Classification
                const nameUpper = nameVal.toUpperCase();
                const subUpper = (currentSubKelompok || "").toUpperCase();

                let cat: ParsedItemResult["barang_type"] = "reagen";

                if (subUpper.includes("KONSUMSI") || subUpper.includes("ATK")) {
                    cat = "atk";
                } else if (subUpper.includes("SUKU CADANG") || subUpper.includes("PEMELIHARAAN") || subUpper.includes("SPARE PART")) {
                    cat = "suku-cadang";
                } else if (subUpper.includes("KEBERSIHAN")) {
                    cat = "perlengkapan";
                } else if (subUpper.includes("BAHAN BAKU") || subUpper.includes("BAHAN KIMIA")) {
                    if (
                        nameUpper.includes("BAKU PEMBANDING") ||
                        nameUpper.includes("BAKU PEMABDING") ||
                        nameUpper.includes("( BP )") ||
                        nameUpper.includes("(BP)") ||
                        nameUpper.includes("P3OMN")
                    ) {
                        cat = "baku-pembanding";
                    } else {
                        cat = "reagen";
                    }
                } else {
                    if (
                        nameUpper.includes("BAKU PEMBANDING") ||
                        nameUpper.includes("BAKU PEMABDING") ||
                        nameUpper.includes("( BP )") ||
                        nameUpper.includes("(BP)")
                    ) {
                        cat = "baku-pembanding";
                    } else if (
                        nameUpper.includes("FLASH DISK") ||
                        nameUpper.includes("KERTAS") ||
                        nameUpper.includes("PULPEN") ||
                        nameUpper.includes("SPIDOL")
                    ) {
                        cat = "atk";
                    } else if (
                        nameUpper.includes("FILTER") ||
                        nameUpper.includes("LAMP") ||
                        nameUpper.includes("SEAL")
                    ) {
                        cat = "suku-cadang";
                    } else {
                        cat = "reagen";
                    }
                }

                // Spatial Location Determination
                const activeLocs: string[] = [];
                if (qtyC5 > 0) activeLocs.push("Gudang Reagen");
                if (qtyC6 > 0) activeLocs.push("Gudang ATK");
                if (qtyC7 > 0) {
                    activeLocs.push(cat === "baku-pembanding" ? "Lab Terana / Kulkas BP" : "Lab Terana");
                }
                if (qtyC8 > 0) activeLocs.push("Lab Mikro");
                if (qtyC9 > 0) activeLocs.push("Infokom / Pemeliharaan");

                const defaultLokasiMap: Record<string, string> = {
                    reagen: "Gudang Reagen",
                    "baku-pembanding": "Lab Terana / Kulkas BP",
                    atk: "Gudang ATK",
                    "suku-cadang": "Gudang Suku Cadang",
                    perlengkapan: "Gudang Perlengkapan",
                };

                const lokasiFinal = activeLocs.length > 0 ? activeLocs.join(", ") : (defaultLokasiMap[cat] || "Gudang BPOM");

                const defaultSatuanMap: Record<string, string> = {
                    reagen: "Botol",
                    "baku-pembanding": "Vial",
                    atk: "Pcs",
                    "suku-cadang": "Unit",
                    perlengkapan: "Pcs",
                };

                extractedItems.push({
                    id: `${pageNum}-${noVal}-${kodeVal || Math.random().toString(36).substring(7)}`,
                    no: noVal,
                    code: kodeVal || `ITEM-${pageNum}-${noVal}`,
                    name: nameVal,
                    stock: stockNumber,
                    satuan: defaultSatuanMap[cat] || "Unit",
                    expired: cat === "reagen" || cat === "baku-pembanding" ? defaultExpired : null,
                    lokasi: lokasiFinal,
                    barang_type: cat,
                    subKelompokAsal: currentSubKelompok || "Persediaan",
                });
            }
        }
    }

    return {
        docType: isBastSuratFormat ? "bast_surat" : "ba_stok_opname",
        nomorDokumen: detectedNomor,
        tanggalDokumen: detectedTanggal,
        totalPages: numPages,
        totalItems: extractedItems.length,
        items: extractedItems,
    };
}
