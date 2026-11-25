import type ExcelJS from "exceljs";
import {
    CHECKLIST_SECTIONS,
    getSignatureUrl,
    type PengendalianMutuRecord,
} from "./data";

const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF64748B" } },
    left: { style: "thin", color: { argb: "FF64748B" } },
    bottom: { style: "thin", color: { argb: "FF64748B" } },
    right: { style: "thin", color: { argb: "FF64748B" } },
};

async function loadSignature(signaturePath?: string | null): Promise<{ base64: string; extension: "png" | "jpeg" } | null> {
    if (!signaturePath) return null;
    const trimmed = signaturePath.trim();
    if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") return null;

    if (trimmed.startsWith("data:image/")) {
        const isJpeg = trimmed.startsWith("data:image/jpeg") || trimmed.startsWith("data:image/jpg");
        return {
            base64: trimmed,
            extension: isJpeg ? "jpeg" : "png",
        };
    }

    try {
        const proxyUrl = `/api/proxy/signature?path=${encodeURIComponent(trimmed)}`;
        let response = await fetch(proxyUrl);

        if (!response.ok) {
            const directUrl = getSignatureUrl(trimmed);
            if (directUrl && directUrl !== proxyUrl) {
                response = await fetch(directUrl);
            }
        }

        if (!response.ok) {
            console.warn(`File tanda tangan tidak dapat diunduh (HTTP ${response.status}) pada path: ${trimmed}`);
            return null;
        }

        const mimeType = response.headers.get("content-type")?.split(";")[0].toLowerCase();
        const extension = mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpeg" : "png";

        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length === 0) return null;

        let binary = "";
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });

        return {
            base64: `data:${mimeType || "image/png"};base64,${window.btoa(binary)}`,
            extension,
        };
    } catch (error) {
        console.warn("Gagal memuat gambar tanda tangan, ekspor tetap dilanjutkan:", error);
        return null;
    }
}

function styleCell(cell: ExcelJS.Cell, options: { bold?: boolean; fill?: string; align?: ExcelJS.Alignment["horizontal"]; size?: number; underline?: boolean } = {}) {
    cell.font = { name: "Arial", size: options.size ?? 9, bold: options.bold ?? false, underline: options.underline ?? false };
    cell.alignment = { vertical: "middle", horizontal: options.align ?? "left", wrapText: true };
    cell.border = thinBorder;
    if (options.fill) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: options.fill } };
    }
}

function setMergedValue(
    worksheet: ExcelJS.Worksheet,
    row: number,
    startColumn: number,
    endColumn: number,
    value: string,
    options: { bold?: boolean; fill?: string; align?: ExcelJS.Alignment["horizontal"]; size?: number; underline?: boolean } = {}
) {
    worksheet.mergeCells(row, startColumn, row, endColumn);
    const cell = worksheet.getCell(row, startColumn);
    cell.value = value;
    styleCell(cell, options);
    for (let column = startColumn; column <= endColumn; column += 1) {
        worksheet.getCell(row, column).border = thinBorder;
    }
}

export async function exportPengendalianMutuToExcel(record: PengendalianMutuRecord): Promise<void> {
    // @ts-ignore
    const ExcelJSModule = await import("exceljs/dist/exceljs.min.js");
    const ExcelJSConstructor = (ExcelJSModule.default || ExcelJSModule) as unknown as typeof import("exceljs");

    const [signature, penyeliaSignature, katimSignature] = await Promise.all([
        loadSignature(record.pengujiSignaturePath),
        record.penyeliaVerifiedAt ? loadSignature(record.penyeliaSignaturePath) : Promise.resolve(null),
        record.katimVerifiedAt ? loadSignature(record.katimSignaturePath) : Promise.resolve(null),
    ]);

    const workbook = new ExcelJSConstructor.Workbook();
    workbook.creator = record.pengujiNama || "BBPOM di Mataram";
    workbook.created = new Date();
    workbook.subject = "Checklist pengendalian mutu pengujian mikrobiologi pangan";
    const worksheet = workbook.addWorksheet("Checklist Pengendalian Mutu", {
        pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    worksheet.columns = [
        { width: 6.8 },
        { width: 17.0 },
        { width: 4.0 },
        { width: 48.0 },
        { width: 6.5 },
        { width: 6.5 },
        { width: 6.5 },
        { width: 28.0 },
        { width: 16.0 },
    ];
    worksheet.pageSetup.margins = { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };
    worksheet.properties.defaultRowHeight = 22;

    setMergedValue(worksheet, 1, 1, 9, "LEMBAR CHECKLIST PENGENDALIAN MUTU PENGUJIAN MIKROBIOLOGI PANGAN", { bold: true, size: 11, align: "center" });
    worksheet.getRow(1).height = 24;
    setMergedValue(worksheet, 2, 1, 9, "BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI MATARAM", { bold: true, size: 10, align: "center" });
    worksheet.getRow(2).height = 20;

    setMergedValue(worksheet, 4, 1, 9, "INFORMASI PENGUJIAN", { bold: true, fill: "FFE2E8F0" });
    worksheet.getRow(4).height = 21;

    const formattedDate = record.tanggalPengujian
        ? new Date(`${record.tanggalPengujian}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "-";
    setMergedValue(worksheet, 5, 1, 2, "Tanggal Pengujian", { bold: true });
    worksheet.getCell(5, 3).value = ":";
    styleCell(worksheet.getCell(5, 3), { align: "center" });
    setMergedValue(worksheet, 5, 4, 9, formattedDate);
    worksheet.getRow(5).height = 20;

    const sampleBoxPangan = record.jenisSampel.includes("Pangan") ? "[ ✓ ]" : "[   ]";
    const sampleBoxKosmetika = record.jenisSampel.includes("Kosmetika") ? "[ ✓ ]" : "[   ]";
    const sampleBoxObat = record.jenisSampel.includes("Obat") ? "[ ✓ ]" : "[   ]";
    const sampleBoxObatBahanPangan = record.jenisSampel.includes("Obat Bahan Pangan") ? "[ ✓ ]" : "[   ]";
    const jenisSampelText = `${sampleBoxPangan} Pangan            ${sampleBoxKosmetika} Kosmetika             ${sampleBoxObat} Obat             ${sampleBoxObatBahanPangan} Obat Bahan Pangan`;

    setMergedValue(worksheet, 6, 1, 2, "Jenis Sampel", { bold: true });
    worksheet.getCell(6, 3).value = ":";
    styleCell(worksheet.getCell(6, 3), { align: "center" });
    setMergedValue(worksheet, 6, 4, 9, jenisSampelText);
    worksheet.getRow(6).height = 20;

    setMergedValue(worksheet, 7, 1, 2, "Parameter Pengujian", { bold: true });
    worksheet.getCell(7, 3).value = ":";
    styleCell(worksheet.getCell(7, 3), { align: "center" });
    setMergedValue(worksheet, 7, 4, 9, record.parameterPengujian);
    worksheet.getRow(7).height = 20;

    const metodeMolekulerBox = record.metodePengujian === "molekuler" ? "[ ✓ ]" : "[   ]";
    const metodeKulturBox = record.metodePengujian === "kultur" ? "[ ✓ ]" : "[   ]";
    setMergedValue(worksheet, 8, 1, 2, "Metode Pengujian", { bold: true });
    worksheet.getCell(8, 3).value = ":";
    styleCell(worksheet.getCell(8, 3), { align: "center" });
    setMergedValue(worksheet, 8, 4, 5, `${metodeMolekulerBox} Molekuler (RTi-PCR)`);
    setMergedValue(worksheet, 8, 6, 9, `${metodeKulturBox} Kultur / Konvensional`);
    worksheet.getRow(8).height = 20;

    const statusValidBox = record.statusAkhir === "valid" ? "[ ✓ ]" : "[   ]";
    const statusInvalidBox = record.statusAkhir === "invalid" ? "[ ✓ ]" : "[   ]";
    setMergedValue(worksheet, 9, 1, 2, "Status Akhir", { bold: true });
    worksheet.getCell(9, 3).value = ":";
    styleCell(worksheet.getCell(9, 3), { align: "center" });
    setMergedValue(worksheet, 9, 4, 5, `${statusValidBox} VALID`, { bold: record.statusAkhir === "valid" });
    setMergedValue(worksheet, 9, 6, 9, `${statusInvalidBox} INVALID / RE-TEST`, { bold: record.statusAkhir === "invalid" });
    worksheet.getRow(9).height = 20;

    const headerRow = 11;
    const headers = [
        "NO",
        "TAHAPAN & TITIK KRITIS PENGUJIAN",
        "",
        "KRITERIA KESESUAIAN",
        "YA",
        "TIDAK",
        "N/A",
        "CATATAN / TINDAKAN KETIDAKSESUAIAN",
        "PARAF PENGUJI",
    ];
    headers.forEach((header, index) => {
        const cell = worksheet.getCell(headerRow, index + 1);
        cell.value = header;
        styleCell(cell, { bold: true, fill: "FFE2E8F0", align: "center" });
    });
    worksheet.mergeCells(headerRow, 2, headerRow, 3);
    worksheet.getRow(headerRow).height = 30;

    const signatureImageId = signature
        ? workbook.addImage({
              base64: signature.base64,
              extension: signature.extension,
          })
        : null;

    let rowIndex = headerRow + 1;
    let sectionNumber = 0;
    let itemNumber = 0;

    for (const section of CHECKLIST_SECTIONS) {
        sectionNumber += 1;
        worksheet.getCell(rowIndex, 1).value = sectionNumber;
        styleCell(worksheet.getCell(rowIndex, 1), { bold: true, fill: "FFDCEBFA", align: "center" });
        setMergedValue(worksheet, rowIndex, 2, 9, section.title.toUpperCase(), { bold: true, fill: "FFDCEBFA" });
        worksheet.getRow(rowIndex).height = 22;
        rowIndex += 1;

        for (const item of section.items) {
            itemNumber += 1;
            const answer = record.checklist ? record.checklist[item.key] : undefined;
            const row = worksheet.getRow(rowIndex);
            row.height = 36;

            worksheet.getCell(rowIndex, 1).value = itemNumber;
            styleCell(worksheet.getCell(rowIndex, 1), { align: "center" });

            worksheet.mergeCells(rowIndex, 2, rowIndex, 3);
            worksheet.getCell(rowIndex, 2).value = item.name;
            styleCell(worksheet.getCell(rowIndex, 2), { bold: true });
            worksheet.getCell(rowIndex, 3).border = thinBorder;

            worksheet.getCell(rowIndex, 4).value = item.criteria;
            styleCell(worksheet.getCell(rowIndex, 4));

            worksheet.getCell(rowIndex, 5).value = answer?.status === "ya" ? "✓" : "";
            worksheet.getCell(rowIndex, 6).value = answer?.status === "tidak" ? "✓" : "";
            worksheet.getCell(rowIndex, 7).value = answer?.status === "na" ? "✓" : "";
            [5, 6, 7].forEach((column) => styleCell(worksheet.getCell(rowIndex, column), { align: "center", bold: true }));

            worksheet.getCell(rowIndex, 8).value = answer?.note ?? item.note ?? "";
            styleCell(worksheet.getCell(rowIndex, 8));

            styleCell(worksheet.getCell(rowIndex, 9), { align: "center" });
            if (signatureImageId !== null) {
                worksheet.addImage(signatureImageId, {
                    tl: { col: 8.1, row: rowIndex - 1 + 0.1 } as any,
                    br: { col: 8.9, row: rowIndex - 0.1 } as any,
                });
            }

            rowIndex += 1;
        }
    }

    rowIndex += 1;

    setMergedValue(worksheet, rowIndex, 1, 9, "VERIFIKASI & TANDA TANGAN", { bold: true, fill: "FFE2E8F0" });
    worksheet.getRow(rowIndex).height = 22;
    rowIndex += 1;

    const catatanText = `Catatan Evaluasi / Rekomendasi: ${record.catatanEvaluasi || "-"}`;
    setMergedValue(worksheet, rowIndex, 1, 9, catatanText);
    worksheet.getRow(rowIndex).height = 40;
    rowIndex += 2;

    const ttdHeaderRow = rowIndex;
    setMergedValue(worksheet, ttdHeaderRow, 1, 4, "Mengetahui,\nKetua Tim Mikrobiologi", { bold: true, align: "center" });
    setMergedValue(worksheet, ttdHeaderRow, 6, 9, "Diverifikasi oleh Penyelia,", { bold: true, align: "center" });
    worksheet.getRow(ttdHeaderRow).height = 30;

    for (let r = ttdHeaderRow + 1; r <= ttdHeaderRow + 3; r += 1) {
        worksheet.getRow(r).height = 20;
    }

    if (katimSignature) {
        const katimImageId = workbook.addImage({
            base64: katimSignature.base64,
            extension: katimSignature.extension,
        });
        worksheet.addImage(katimImageId, {
            tl: { col: 2.5, row: ttdHeaderRow + 0.15 } as any,
            br: { col: 3.45, row: ttdHeaderRow + 2.85 } as any,
        });
    }

    if (penyeliaSignature) {
        const penyeliaImageId = workbook.addImage({
            base64: penyeliaSignature.base64,
            extension: penyeliaSignature.extension,
        });
        worksheet.addImage(penyeliaImageId, {
            tl: { col: 7.1, row: ttdHeaderRow + 0.15 } as any,
            br: { col: 7.95, row: ttdHeaderRow + 2.85 } as any,
        });
    }

    rowIndex = ttdHeaderRow + 4;

    setMergedValue(worksheet, rowIndex, 1, 4, record.katimNama || "-", { bold: true, align: "center", underline: true });
    setMergedValue(worksheet, rowIndex, 6, 9, record.penyelia || "-", { bold: true, align: "center", underline: true });
    worksheet.getRow(rowIndex).height = 20;

    worksheet.views = [{ state: "frozen", ySplit: headerRow }];
    worksheet.pageSetup.printArea = `A1:I${rowIndex}`;
    worksheet.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;

    const fileDate = record.tanggalPengujian.replaceAll("-", "");
    const buffer = await workbook.xlsx.writeBuffer();
    const file = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Checklist_Pengendalian_Mutu_${fileDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}