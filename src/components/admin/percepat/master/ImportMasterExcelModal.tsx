"use client";

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "@/utils/api";
import { useDispatch } from "react-redux";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import {
    UploadCloud,
    FileSpreadsheet,
    FileText,
    Download,
    CheckCircle2,
    AlertTriangle,
    X,
    Loader2,
    RefreshCw,
    Trash2,
    Settings2,
    Plus,
    Layers,
    Calendar,
    Package
} from "lucide-react";
import dayjs from "dayjs";

export interface ImportMasterExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: "reagen" | "baku-pembanding";
}

export interface StagingItem {
    id: string;
    selected: boolean;
    name: string;
    code?: string;
    kode_baru?: string;
    satuan: string;
    stock: number;
    expired?: string;
    letak?: string;
    noKontrol?: string;
    isExisting: boolean;
    existingStock?: number;
    status: "new" | "update";
    isValid: boolean;
    errorMsg?: string;
}

export default function ImportMasterExcelModal({
    isOpen,
    onClose,
    onSuccess,
    category,
}: ImportMasterExcelModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Active upload mode: 'excel' or 'pdf'
    const [importMode, setImportMode] = useState<"excel" | "pdf">("excel");
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<string>("");
    const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);
    const [availableSheets, setAvailableSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");

    // Existing master items map for smart matching (PDF & Excel)
    const [existingMasterMap, setExistingMasterMap] = useState<Record<string, any>>({});
    const [isFetchingMaster, setIsFetchingMaster] = useState(false);

    // Staging / parsed data state
    const [stagingData, setStagingData] = useState<StagingItem[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Stock operation mode: 'add' (tambah stok) or 'replace' (timpa stok)
    const [stockMode, setStockMode] = useState<"add" | "replace">("add");

    // Mass edit values
    const [massSatuan, setMassSatuan] = useState<string>("");
    const [massExpired, setMassExpired] = useState<string>("");
    const [massLetak, setMassLetak] = useState<string>("");

    const categoryLabel = category === "baku-pembanding" ? "Baku Pembanding" : "Reagen";
    const defaultSatuan = category === "baku-pembanding" ? "Vial" : "Botol";
    const defaultExpired = "2028-12-31"; // Default 2-3 tahun ke depan untuk data awal

    // Fetch master items when modal opens to allow smart matching
    useEffect(() => {
        if (!isOpen) return;

        const fetchMaster = async () => {
            setIsFetchingMaster(true);
            try {
                const endpoint = category === "baku-pembanding"
                    ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/baku-pembanding?per_page=99999`
                    : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-reagen-all`;
                const res = await api.get(endpoint);
                const items: any[] = res.data?.data || res.data || [];
                const map: Record<string, any> = {};
                items.forEach(it => {
                    if (it.name) {
                        const cleanKey = it.name.toLowerCase().trim().replace(/\s+/g, " ");
                        map[cleanKey] = it;
                    }
                });
                setExistingMasterMap(map);
            } catch (err) {
                console.error("Gagal mengambil master data pembanding:", err);
            } finally {
                setIsFetchingMaster(false);
            }
        };

        fetchMaster();
        // Reset state
        setFileName("");
        setStagingData([]);
        setWorkbookRef(null);
        setAvailableSheets([]);
        setSelectedSheet("");
        setStockMode(importMode === "excel" ? "replace" : "add");
    }, [isOpen, category, importMode]);

    if (!isOpen) return null;

    // Handle template download
    const handleDownloadTemplate = () => {
        const headers = category === "baku-pembanding"
            ? [
                {
                    "Kode Baru": "A1",
                    "Nama Baku Pembanding": "2- Amino-4-Nitrofenol",
                    "Lokasi": "Suhu ruang",
                    "Satuan": "Vial",
                    "stok tgl 15 oktober 26": 1,
                    "Kedaluwarsa": "2028-12-31",
                },
                {
                    "Kode Baru": "T17",
                    "Nama Baku Pembanding": "2-2 trichloroetanol",
                    "Lokasi": "Kulkas",
                    "Satuan": "Vial",
                    "stok tgl 15 oktober 26": 3,
                    "Kedaluwarsa": "2028-12-31",
                }
            ]
            : [
                {
                    "Nama Reagen": "Methanol HPLC Grade 2.5L",
                    "Satuan": "Botol",
                    "Stok": 12,
                    "Kedaluwarsa": "2027-06-30",
                },
                {
                    "Nama Reagen": "Acetonitrile LC-MS 4L",
                    "Satuan": "Botol",
                    "Stok": 8,
                    "Kedaluwarsa": "2026-11-20",
                }
            ];

        const worksheet = XLSX.utils.json_to_sheet(headers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Template_${categoryLabel}`);
        XLSX.writeFile(workbook, `Template_Import_${categoryLabel}.xlsx`);
    };

    // -------------------------------------------------------------
    // EXCEL PARSER
    // -------------------------------------------------------------
    const parseExcelSheet = (wb: XLSX.WorkBook, sheetName: string) => {
        const worksheet = wb.Sheets[sheetName];
        if (!worksheet) return;

        // Convert to array of arrays to find header row dynamically
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        if (!rawRows || rawRows.length === 0) {
            dispatch(showAlert({
                type: "error",
                message: "Sheet Kosong",
                description: `Sheet "${sheetName}" tidak memiliki baris data.`,
            }));
            return;
        }

        // Cari baris header yang mengandung kata 'nama' atau 'barang'
        let headerRowIdx = 0;
        let colIdxMap: Record<string, number> = {};

        for (let i = 0; i < Math.min(10, rawRows.length); i++) {
            const row = rawRows[i] || [];
            const hasNama = row.some(cell => String(cell).toLowerCase().includes("nama"));
            if (hasNama) {
                headerRowIdx = i;
                row.forEach((colName, cIdx) => {
                    const clean = String(colName).toLowerCase().trim().replace(/[^a-z0-9]/g, "");
                    if (clean) colIdxMap[clean] = cIdx;
                });
                break;
            }
        }

        const findColIdx = (keywords: string[]) => {
            const keys = Object.keys(colIdxMap);
            for (const kw of keywords) {
                const found = keys.find(k => k.includes(kw));
                if (found !== undefined) return colIdxMap[found];
            }
            return -1;
        };

        const namaIdx = findColIdx(["namabaku", "namabarang", "nama", "item", "uraian"]);
        const kodeBaruIdx = findColIdx(["kodebaru", "kode"]);
        const kodeLamaIdx = findColIdx(["kodelama", "code"]);
        const lokasiIdx = findColIdx(["lokasi", "letak", "tempatsimpan", "ruang"]);
        const satuanIdx = findColIdx(["satuan", "unit", "kemasan"]);
        
        // Prioritaskan kolom 'stok tgl 15 oktober' seperti yang diminta user!
        let stokIdx = findColIdx(["15oktober", "15okt", "stoktgl15oktober26"]);
        if (stokIdx === -1) {
            stokIdx = findColIdx(["hasilakhir2026", "stok", "jumlahakhir", "jumlah", "stock", "qty"]);
        }

        const expIdx = findColIdx(["kedaluwarsa", "kadaluarsa", "expired", "ed"]);

        const items: StagingItem[] = [];

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            const name = namaIdx !== -1 ? String(row[namaIdx] || "").trim() : "";
            if (!name) continue;

            const kodeBaru = kodeBaruIdx !== -1 ? String(row[kodeBaruIdx] || "").trim() : "";
            const kodeLama = kodeLamaIdx !== -1 ? String(row[kodeLamaIdx] || "").trim() : "";
            const lokasi = lokasiIdx !== -1 ? String(row[lokasiIdx] || "").trim() : "";
            const rawSatuan = satuanIdx !== -1 ? String(row[satuanIdx] || "").trim() : "";
            const satuan = rawSatuan || defaultSatuan;

            // Stok parsing
            let stockNum = 0;
            if (stokIdx !== -1 && row[stokIdx] !== undefined && row[stokIdx] !== "") {
                const parsed = parseInt(String(row[stokIdx]).replace(/[^0-9]/g, ""), 10);
                if (!isNaN(parsed)) stockNum = parsed;
            }

            // Expired parsing
            let expiredFormatted = defaultExpired;
            if (expIdx !== -1 && row[expIdx]) {
                const expVal = String(row[expIdx]).trim();
                const d = dayjs(expVal);
                if (d.isValid() && expVal.length >= 8) {
                    expiredFormatted = d.format("YYYY-MM-DD");
                }
            }

            // Check if item already exists in database
            const cleanKey = name.toLowerCase().trim().replace(/\s+/g, " ");
            const existing = existingMasterMap[cleanKey];

            items.push({
                id: `excel-${r}-${Date.now()}`,
                selected: true,
                name,
                kode_baru: kodeBaru || (existing?.kode_baru || ""),
                code: kodeLama || kodeBaru,
                satuan: existing?.satuan || satuan,
                stock: stockNum,
                expired: expiredFormatted,
                letak: lokasi || existing?.letak || "Suhu ruang",
                isExisting: !!existing,
                existingStock: existing ? Number(existing.stock) : 0,
                status: existing ? "update" : "new",
                isValid: name.length > 0,
            });
        }

        setStagingData(items);
        dispatch(showAlert({
            type: "success",
            message: "Excel Berhasil Dibaca",
            description: `Ditemukan ${items.length} baris data dari sheet "${sheetName}".`,
        }));
    };

    // Helper to dynamically load client-side PDF.js without Turbopack/Canvas bundling issues
    const getPdfJs = async (): Promise<any> => {
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

    // -------------------------------------------------------------
    // PDF PARSER (Surat BAST / Pengiriman Baku Pembanding dari Pusat)
    // -------------------------------------------------------------
    const parsePdfFile = async (file: File) => {
        setIsParsing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);

            // Load browser-safe PDF.js
            const pdfjsLib = await getPdfJs();
            if (!pdfjsLib) {
                throw new Error("Gagal menginisialisasi modul PDF.js.");
            }

            const doc = await pdfjsLib.getDocument({ data }).promise;
            const extractedRows: { no: number; name: string; noKontrol: string; qty: number }[] = [];

            for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
                const page = await doc.getPage(pageNum);
                const content = await page.getTextContent();

                const items = content.items
                    .map((it: any) => ({
                        str: String(it.str || "").trim(),
                        x: it.transform[4],
                        y: it.transform[5],
                    }))
                    .filter((it: any) => it.str.length > 0)
                    .sort((a: any, b: any) => b.y - a.y || a.x - b.x);

                const headerIdx = items.findIndex(
                    (it: any) => it.str === "No." || (it.str === "No" && it.x < 70)
                );
                if (headerIdx === -1) continue;

                const tableItems: any[] = [];
                for (let i = headerIdx + 1; i < items.length; i++) {
                    const it = items[i];
                    if (it.str === "Jumlah" && it.x > 100) break;
                    if (it.str.includes("PIHAK KEDUA") || it.str.includes("Dokumen ini")) break;
                    tableItems.push(it);
                }

                const rowStarts: { no: number; y: number }[] = [];
                for (let i = 0; i < tableItems.length; i++) {
                    const it = tableItems[i];
                    if (it.x >= 50 && it.x <= 75 && it.str.match(/^\d{1,2}$/)) {
                        rowStarts.push({ no: parseInt(it.str, 10), y: it.y });
                    }
                }

                for (let r = 0; r < rowStarts.length; r++) {
                    const current = rowStarts[r];
                    const prevY = r > 0 ? rowStarts[r - 1].y : current.y + 25;
                    const nextY = r < rowStarts.length - 1 ? rowStarts[r + 1].y : current.y - 30;

                    const topY = (prevY + current.y) / 2;
                    const bottomY = (current.y + nextY) / 2;

                    const rowTokens = tableItems.filter((it: any) => it.y <= topY && it.y > bottomY);

                    const nameParts = rowTokens
                        .filter((it: any) => it.x >= 75 && it.x < 210)
                        .sort((a: any, b: any) => b.y - a.y || a.x - b.x)
                        .map((it: any) => it.str);

                    const kontrolParts = rowTokens
                        .filter((it: any) => it.x >= 210 && it.x < 280)
                        .map((it: any) => it.str);

                    const qtyParts = rowTokens
                        .filter((it: any) => it.x >= 280 && it.x < 330)
                        .map((it: any) => it.str);

                    let rawName = nameParts.join(" ");
                    // Clean multi-word split like "Mekobalamin/Metilkobal amin" -> "Mekobalamin/Metilkobalamin"
                    rawName = rawName.replace(/(\w+)\s+(amin\b)/gi, "$1$2");
                    
                    const noKontrol = kontrolParts.join("");
                    const qty = parseInt(qtyParts.join(""), 10) || 1;

                    if (rawName) {
                        extractedRows.push({
                            no: current.no,
                            name: rawName,
                            noKontrol,
                            qty,
                        });
                    }
                }
            }

            if (extractedRows.length === 0) {
                dispatch(showAlert({
                    type: "error",
                    message: "Tabel Surat Tidak Terdeteksi",
                    description: "Pastikan file PDF berupa surat BAST / Pengiriman resmi dengan tabel spesifikasi barang.",
                }));
                return;
            }

            // Match with existing master data
            const items: StagingItem[] = extractedRows.map((row, idx) => {
                const cleanKey = row.name.toLowerCase().trim().replace(/\s+/g, " ");
                const existing = existingMasterMap[cleanKey];

                return {
                    id: `pdf-${idx}-${Date.now()}`,
                    selected: true,
                    name: row.name,
                    code: row.noKontrol,
                    noKontrol: row.noKontrol,
                    // If existing in master, reuse its kode_baru, letak, satuan, expired!
                    kode_baru: existing ? existing.kode_baru : (row.noKontrol || ""),
                    satuan: existing ? (existing.satuan || defaultSatuan) : defaultSatuan,
                    stock: row.qty,
                    expired: existing?.expired ? dayjs(existing.expired).format("YYYY-MM-DD") : defaultExpired,
                    letak: existing ? (existing.letak || "Suhu ruang") : "Suhu ruang",
                    isExisting: !!existing,
                    existingStock: existing ? Number(existing.stock) : 0,
                    status: existing ? "update" : "new",
                    isValid: row.name.length > 0,
                };
            });

            setStagingData(items);
            setStockMode("add"); // Untuk surat masuk, default selalu tambah stok (+)
            dispatch(showAlert({
                type: "success",
                message: "PDF Berhasil Diekstrak",
                description: `Berhasil mengekstrak ${items.length} barang dari surat serah terima Pusat.`,
            }));
        } catch (err: any) {
            console.error("Error parsing PDF:", err);
            dispatch(showAlert({
                type: "error",
                message: "Gagal Membaca PDF",
                description: err.message || "Terjadi kesalahan saat memproses file PDF.",
            }));
        } finally {
            setIsParsing(false);
        }
    };

    // Generic file upload router
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setFileSize((file.size / 1024).toFixed(1) + " KB");

        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "pdf") {
            setImportMode("pdf");
            parsePdfFile(file);
        } else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
            setImportMode("excel");
            setIsParsing(true);
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
                    setWorkbookRef(wb);
                    setAvailableSheets(wb.SheetNames);

                    // Auto-select sheet '2026 new' if present, otherwise sheet[0]
                    const targetSheet = wb.SheetNames.includes("2026 new")
                        ? "2026 new"
                        : wb.SheetNames[0];

                    setSelectedSheet(targetSheet);
                    parseExcelSheet(wb, targetSheet);
                } catch (err: any) {
                    console.error("Error loading Excel:", err);
                    dispatch(showAlert({
                        type: "error",
                        message: "Gagal Membaca Excel",
                        description: "Pastikan format file berupa spreadsheet yang valid.",
                    }));
                } finally {
                    setIsParsing(false);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            dispatch(showAlert({
                type: "error",
                message: "Format File Tidak Didukung",
                description: "Silakan pilih file Excel (.xlsx/.xls/.csv) atau surat PDF (.pdf).",
            }));
        }
    };

    // Row inline updater
    const handleUpdateRow = (id: string, field: keyof StagingItem, value: any) => {
        setStagingData(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    if (field === "name") {
                        updated.isValid = String(value).trim().length > 0;
                    }
                    return updated;
                }
                return item;
            })
        );
    };

    // Delete row
    const handleDeleteRow = (id: string) => {
        setStagingData(prev => prev.filter(item => item.id !== id));
    };

    // Toggle row selection
    const handleToggleSelect = (id: string) => {
        setStagingData(prev =>
            prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
        );
    };

    // Select/deselect all
    const handleToggleSelectAll = (checked: boolean) => {
        setStagingData(prev => prev.map(item => ({ ...item, selected: checked })));
    };

    // Mass apply controls
    const handleApplyMassSatuan = () => {
        if (!massSatuan) return;
        setStagingData(prev =>
            prev.map(it => (it.selected ? { ...it, satuan: massSatuan } : it))
        );
        dispatch(showAlert({ type: "success", message: "Satuan Diperbarui", description: `Satuan diubah ke "${massSatuan}" untuk semua baris terpilih.` }));
    };

    const handleApplyMassExpired = () => {
        if (!massExpired) return;
        setStagingData(prev =>
            prev.map(it => (it.selected ? { ...it, expired: massExpired } : it))
        );
        dispatch(showAlert({ type: "success", message: "Kedaluwarsa Diperbarui", description: `Expired diubah ke ${massExpired} untuk semua baris terpilih.` }));
    };

    const handleApplyMassLetak = () => {
        if (!massLetak) return;
        setStagingData(prev =>
            prev.map(it => (it.selected ? { ...it, letak: massLetak } : it))
        );
        dispatch(showAlert({ type: "success", message: "Lokasi Diperbarui", description: `Lokasi diubah ke "${massLetak}" untuk semua baris terpilih.` }));
    };

    // Submit items to backend
    const handleSubmit = async () => {
        const selectedItems = stagingData.filter(item => item.selected && item.isValid);
        if (selectedItems.length === 0) {
            dispatch(showAlert({
                type: "error",
                message: "Tidak Ada Data Terpilih",
                description: "Silakan pilih setidaknya 1 baris barang yang valid untuk disimpan.",
            }));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post("/api/v1/master/import-items", {
                barang_type: category,
                stock_mode: stockMode,
                items: selectedItems.map(item => ({
                    name: item.name,
                    code: item.code,
                    kode_baru: item.kode_baru,
                    satuan: item.satuan,
                    stock: item.stock,
                    expired: item.expired,
                    letak: item.letak,
                    lokasi: item.letak,
                    no_kontrol: item.noKontrol,
                })),
            });

            dispatch(showAlert({
                type: "success",
                message: "Import Berhasil!",
                description: res.data?.message || `${selectedItems.length} barang berhasil disimpan ke data master.`,
            }));

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error importing items:", err);
            dispatch(showAlert({
                type: "error",
                message: "Gagal Menyimpan Data",
                description: err.response?.data?.message || "Terjadi kesalahan saat menyimpan ke database.",
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSelected = stagingData.filter(i => i.selected).length;
    const countNew = stagingData.filter(i => i.selected && !i.isExisting).length;
    const countUpdate = stagingData.filter(i => i.selected && i.isExisting).length;
    const totalQty = stagingData
        .filter(i => i.selected)
        .reduce((sum, i) => sum + (Number(i.stock) || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                            <UploadCloud size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 text-base">
                                    Import Master Data & Barang Masuk
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                    {categoryLabel}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Unggah file Excel (Data Awal / Massal) atau PDF (Surat Serah Terima / BAST Pusat). Data dapat diperiksa dan diedit sebelum disimpan.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        title="Tutup Modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto space-y-5">
                    {/* Source Selector & Upload Box */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Option 1: Template & Info */}
                        <div className="md:col-span-4 border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Settings2 size={14} className="text-blue-600" />
                                    Pilihan Jenis Sumber Data
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className={`p-2.5 rounded-lg border transition-all cursor-pointer ${importMode === "excel" ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`} onClick={() => setImportMode("excel")}>
                                        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                                            <FileSpreadsheet size={15} />
                                            File Excel (.xlsx / .xls)
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Untuk data awal dari sheet master (contoh: sheet <em>2026 new</em>) dengan kolom stok, lokasi, dan kode.
                                        </p>
                                    </div>

                                    <div className={`p-2.5 rounded-lg border transition-all cursor-pointer ${importMode === "pdf" ? "bg-rose-50 border-rose-300 text-rose-950 shadow-2xs" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`} onClick={() => setImportMode("pdf")}>
                                        <div className="font-bold flex items-center gap-1.5 text-rose-800">
                                            <FileText size={15} />
                                            File PDF Surat / BAST Pusat
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Membaca otomatis daftar barang masuk, No. Kontrol, & Jumlah Vial dari surat serah terima BMN Pusat.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                            >
                                <Download size={13} />
                                Unduh Template Excel Standar
                            </button>
                        </div>

                        {/* Option 2: Upload Dropzone */}
                        <div className="md:col-span-8 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 rounded-xl p-5 text-center flex flex-col items-center justify-center transition-colors">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls, .csv, .pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
                                {importMode === "pdf" ? <FileText size={24} className="text-rose-600" /> : <UploadCloud size={24} />}
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                                {fileName ? fileName : `Unggah File ${importMode === "pdf" ? "Surat PDF BAST" : "Excel Inventaris"}`}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 mb-3">
                                {fileName ? `Ukuran: ${fileSize}` : "Klik tombol di bawah atau drag & drop file ke area ini (Maksimal 10MB)"}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isParsing}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    {isParsing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                    {fileName ? "Ganti / Unggah Ulang File" : "Pilih File dari Komputer"}
                                </button>

                                {/* Sheet Selector Dropdown if Excel has multiple sheets */}
                                {availableSheets.length > 1 && (
                                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs shadow-2xs">
                                        <Layers size={13} className="text-slate-500" />
                                        <span className="font-semibold text-slate-600">Sheet:</span>
                                        <select
                                            value={selectedSheet}
                                            onChange={(e) => {
                                                const newSheet = e.target.value;
                                                setSelectedSheet(newSheet);
                                                if (workbookRef) {
                                                    parseExcelSheet(workbookRef, newSheet);
                                                }
                                            }}
                                            className="font-bold text-blue-700 bg-transparent focus:outline-none cursor-pointer"
                                        >
                                            {availableSheets.map(s => (
                                                <option key={s} value={s}>
                                                    {s} {s === "2026 new" ? "(Rekomendasi 2026)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Staging Data Section */}
                    {stagingData.length > 0 && (
                        <div className="space-y-3 pt-2">
                            {/* Summary & Toolbar Controls */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-slate-100/80 rounded-xl border border-slate-200">
                                {/* Stats Badges */}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-bold text-slate-800">
                                        Pratinjau ({stagingData.length} baris):
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md font-semibold bg-white border border-slate-300 text-slate-700">
                                        Terpilih: <b>{totalSelected}</b>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-50 border border-emerald-300 text-emerald-800">
                                        Barang Baru: <b>{countNew}</b>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md font-semibold bg-blue-50 border border-blue-300 text-blue-800">
                                        Update / Tambah Stok: <b>{countUpdate}</b>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 border border-amber-300 text-amber-900">
                                        Total Kuantitas: <b>{totalQty} {defaultSatuan}</b>
                                    </span>
                                </div>

                                {/* Stock Mode Choice */}
                                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                                    <span className="text-[11px] font-bold text-slate-500 px-1.5">
                                        Operasi Stok:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setStockMode("add")}
                                        className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${stockMode === "add" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                        title="Menambahkan stok barang yang masuk ke stok yang sudah ada"
                                    >
                                        + Tambah ke Stok
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStockMode("replace")}
                                        className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${stockMode === "replace" ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                        title="Menggantikan / menimpa stok dengan angka di file (cocok untuk data awal)"
                                    >
                                        = Timpa Stok
                                    </button>
                                </div>
                            </div>

                            {/* Batch Set Controls */}
                            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-blue-50/40 rounded-xl border border-blue-100 text-xs">
                                <span className="font-bold text-blue-900 text-[11px] shrink-0">
                                    Set Nilai Massal (Baris Terpilih):
                                </span>
                                
                                {/* Mass Satuan */}
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        placeholder="Satuan (Vial/Botol)"
                                        value={massSatuan}
                                        onChange={e => setMassSatuan(e.target.value)}
                                        className="px-2 py-1 bg-white border border-slate-300 rounded text-xs w-28 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyMassSatuan}
                                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold cursor-pointer"
                                    >
                                        Terapkan
                                    </button>
                                </div>

                                {/* Mass Expired */}
                                <div className="flex items-center gap-1">
                                    <input
                                        type="date"
                                        value={massExpired}
                                        onChange={e => setMassExpired(e.target.value)}
                                        className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyMassExpired}
                                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold cursor-pointer"
                                    >
                                        Terapkan
                                    </button>
                                </div>

                                {/* Mass Letak */}
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        placeholder="Lokasi (Kulkas/Suhu ruang)"
                                        value={massLetak}
                                        onChange={e => setMassLetak(e.target.value)}
                                        className="px-2 py-1 bg-white border border-slate-300 rounded text-xs w-36 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyMassLetak}
                                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold cursor-pointer"
                                    >
                                        Terapkan
                                    </button>
                                </div>
                            </div>

                            {/* Editable Staging Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto shadow-xs">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10 uppercase text-[10px] tracking-wide">
                                        <tr>
                                            <th className="py-2.5 px-3 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={stagingData.length > 0 && stagingData.every(i => i.selected)}
                                                    onChange={e => handleToggleSelectAll(e.target.checked)}
                                                    className="checkbox checkbox-xs"
                                                />
                                            </th>
                                            <th className="py-2.5 px-2 w-10 text-center">No</th>
                                            {category === "baku-pembanding" && (
                                                <th className="py-2.5 px-3 w-28">Kode Baru</th>
                                            )}
                                            <th className="py-2.5 px-3">Nama {categoryLabel}</th>
                                            {category === "baku-pembanding" && (
                                                <th className="py-2.5 px-3 w-32">Lokasi / Letak</th>
                                            )}
                                            <th className="py-2.5 px-3 w-24">Satuan</th>
                                            <th className="py-2.5 px-3 w-20 text-center">Stok / Qty</th>
                                            <th className="py-2.5 px-3 w-32 text-center">Kedaluwarsa</th>
                                            <th className="py-2.5 px-3 w-28 text-center">Status</th>
                                            <th className="py-2.5 px-2 w-10 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {stagingData.map((item, idx) => (
                                            <tr
                                                key={item.id}
                                                className={`transition-colors ${!item.selected ? "opacity-40 bg-slate-50" : item.isExisting ? "bg-blue-50/20 hover:bg-blue-50/40" : "hover:bg-slate-50/80"}`}
                                            >
                                                {/* Checkbox */}
                                                <td className="py-2 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.selected}
                                                        onChange={() => handleToggleSelect(item.id)}
                                                        className="checkbox checkbox-xs"
                                                    />
                                                </td>

                                                {/* No */}
                                                <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">
                                                    {idx + 1}
                                                </td>

                                                {/* Kode Baru (Editable) */}
                                                {category === "baku-pembanding" && (
                                                    <td className="py-1 px-2">
                                                        <input
                                                            type="text"
                                                            value={item.kode_baru || ""}
                                                            onChange={e => handleUpdateRow(item.id, "kode_baru", e.target.value)}
                                                            placeholder="Kode Baru"
                                                            className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                                                        />
                                                    </td>
                                                )}

                                                {/* Nama (Editable) */}
                                                <td className="py-1 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={e => handleUpdateRow(item.id, "name", e.target.value)}
                                                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                                                    />
                                                </td>

                                                {/* Lokasi / Letak (Editable) */}
                                                {category === "baku-pembanding" && (
                                                    <td className="py-1 px-2">
                                                        <input
                                                            type="text"
                                                            value={item.letak || ""}
                                                            onChange={e => handleUpdateRow(item.id, "letak", e.target.value)}
                                                            placeholder="Suhu ruang / Kulkas"
                                                            className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                                                        />
                                                    </td>
                                                )}

                                                {/* Satuan (Editable) */}
                                                <td className="py-1 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.satuan}
                                                        onChange={e => handleUpdateRow(item.id, "satuan", e.target.value)}
                                                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                                                    />
                                                </td>

                                                {/* Stok / Qty (Editable) */}
                                                <td className="py-1 px-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.stock}
                                                        onChange={e => handleUpdateRow(item.id, "stock", parseInt(e.target.value, 10) || 0)}
                                                        className="w-16 px-1.5 py-1 text-center rounded bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                                                    />
                                                </td>

                                                {/* Kedaluwarsa (Editable) */}
                                                <td className="py-1 px-2 text-center">
                                                    <input
                                                        type="date"
                                                        value={item.expired || ""}
                                                        onChange={e => handleUpdateRow(item.id, "expired", e.target.value)}
                                                        className="px-1.5 py-1 rounded bg-white border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-500"
                                                    />
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-2 px-3 text-center">
                                                    {item.isExisting ? (
                                                        <span
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800"
                                                            title={`Barang sudah ada di master. Stok sistem saat ini: ${item.existingStock}`}
                                                        >
                                                            {stockMode === "add" ? `+${item.stock} Stok` : "Timpa Stok"}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            Baru
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Remove row */}
                                                <td className="py-2 px-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRow(item.id)}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                        title="Hapus baris ini dari pratinjau"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
                    <div className="text-xs text-slate-500">
                        {stagingData.length > 0 ? (
                            <span>
                                Total <b>{totalSelected}</b> dari <b>{stagingData.length}</b> barang terpilih siap disimpan ke Master {categoryLabel}.
                            </span>
                        ) : (
                            <span>Silakan unggah file Excel atau PDF di atas untuk melihat tabel pratinjau.</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={totalSelected === 0 || isSubmitting}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Menyimpan ke Database...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={14} />
                                    Konfirmasi Simpan ke Master ({totalSelected})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
