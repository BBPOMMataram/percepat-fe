"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useDispatch } from "react-redux";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import {
    QrCode,
    Camera,
    Search,
    CheckCircle2,
    AlertTriangle,
    Save,
    RotateCcw,
    FileSpreadsheet,
    Printer,
    Package,
    Building2,
    MapPin,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Loader2,
    History,
    Sparkles,
    X,
} from "lucide-react";
import PercepatQRScannerModal from "@/components/percepat-new/stok-opname/PercepatQRScannerModal";
import LabelStikerModal, { LabelStikerItem } from "@/components/percepat-new/label/LabelStikerModal";
import { exportJsonToExcel } from "@/utils/excelExport";

dayjs.locale("id");

interface ActiveItem {
    barang_type: "reagen" | "baku-pembanding";
    barang_type_label: string;
    id: number;
    name: string;
    code?: string | null;
    kode_baru?: string | null;
    satuan?: string;
    lokasi?: string | null;
    expired?: string | null;
    stock: number;
}

interface OpnameHistoryItem {
    id: number;
    barang_type: string;
    barang_id: number;
    kode_barang?: string;
    nama_barang: string;
    satuan?: string;
    lokasi?: string;
    stok_sistem: number;
    stok_fisik: number;
    selisih: number;
    keterangan?: string;
    petugas_name?: string;
    tanggal_opname: string;
}

export default function AdminStokOpnamePercepat() {
    const dispatch = useDispatch<AppDispatch>();

    // Scanner & Lookup State
    const [scannerOpen, setScannerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<"all" | "baku-pembanding" | "reagen">("all");
    const [isSearching, setIsSearching] = useState(false);
    const [lookupResults, setLookupResults] = useState<ActiveItem[]>([]);

    // Active Item for Adjustment
    const [selectedItem, setSelectedItem] = useState<ActiveItem | null>(null);
    const [stokFisikInput, setStokFisikInput] = useState<string>("");
    const [keteranganInput, setKeteranganInput] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Label Stiker Modal State
    const [labelModalOpen, setLabelModalOpen] = useState(false);
    const [labelItem, setLabelItem] = useState<LabelStikerItem | null>(null);

    // History Table State
    const [historyData, setHistoryData] = useState<OpnameHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historySearch, setHistorySearch] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const lookupAbortControllerRef = useRef<AbortController | null>(null);

    // Load History
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(historyPage),
                per_page: "15",
                ...(historySearch && { search: historySearch }),
                ...(categoryFilter !== "all" && { type: categoryFilter }),
            });
            const res = await api.get(`/api/v1/stok-opname?${params}`);
            setHistoryData(res.data?.data || []);
            setHistoryTotal(res.data?.total || 0);
        } catch (err) {
            console.error("Failed to load opname history", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [historyPage, historySearch, categoryFilter]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Handle Search / Barcode Scan Lookup
    const handlePerformLookup = async (queryVal: string) => {
        const trimmed = queryVal.trim();
        if (!trimmed) {
            setLookupResults([]);
            return;
        }

        // Batalkan request yang sedang aktif sebelumnya
        if (lookupAbortControllerRef.current) {
            lookupAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        lookupAbortControllerRef.current = controller;

        setIsSearching(true);
        try {
            const res = await api.get(`/api/v1/stok-opname/lookup`, {
                params: {
                    query: trimmed,
                    type: categoryFilter,
                },
                signal: controller.signal,
            });

            const data: ActiveItem[] = res.data?.data || [];
            setLookupResults(data);

            // Jika hasil pencarian tepat 1 barang, langsung pilih barang tersebut
            if (data.length === 1) {
                handleSelectItem(data[0]);
            } else if (data.length === 0) {
                dispatch(showAlert({
                    type: "error",
                    message: "Barang Tidak Ditemukan",
                    description: `Tidak ditemukan barang dengan kata kunci/barcode: "${trimmed}".`,
                }));
            }
        } catch (err: any) {
            if (axios.isCancel(err) || err?.name === "CanceledError" || err?.name === "AbortError") {
                return; // Request dibatalkan oleh pencarian baru
            }
            console.error("Lookup error:", err);
            dispatch(showAlert({
                type: "error",
                message: "Gagal Mencari Barang",
                description: err.response?.data?.message || "Terjadi kesalahan saat mencari data.",
            }));
        } finally {
            if (lookupAbortControllerRef.current === controller) {
                setIsSearching(false);
            }
        }
    };

    // Saat memilih barang untuk di-opname
    const handleSelectItem = (item: ActiveItem) => {
        setSelectedItem(item);
        setStokFisikInput(String(item.stock));
        setKeteranganInput("Stok Sesuai");
        setLookupResults([]);
        setSearchQuery("");
        setIsSearching(false);
        if (lookupAbortControllerRef.current) {
            lookupAbortControllerRef.current.abort();
            lookupAbortControllerRef.current = null;
        }
    };

    // Hitung selisih real-time
    const stokSistem = selectedItem ? selectedItem.stock : 0;
    const parsedFisik = parseInt(stokFisikInput, 10);
    const stokFisik = isNaN(parsedFisik) ? 0 : Math.max(0, parsedFisik);
    const selisih = stokFisik - stokSistem;

    // Simpan Opname
    const handleSaveOpname = async () => {
        if (!selectedItem) return;

        setIsSaving(true);
        try {
            const res = await api.post(`/api/v1/stok-opname`, {
                barang_type: selectedItem.barang_type,
                barang_id: selectedItem.id,
                stok_fisik: stokFisik,
                keterangan: keteranganInput.trim() || (selisih === 0 ? "Stok Sesuai" : "Penyesuaian Fisik"),
                petugas_name: "Admin Gudang BPOM",
            });

            dispatch(showAlert({
                type: "success",
                message: "Stok Opname Berhasil Disimpan!",
                description: `Stok ${selectedItem.name} berhasil diperbarui dari ${stokSistem} menjadi ${stokFisik} ${selectedItem.satuan || "Botol"}.`,
            }));

            // Perbarui item yang aktif
            setSelectedItem((prev) => prev ? { ...prev, stock: stokFisik } : null);

            // Refresh tabel riwayat
            loadHistory();
        } catch (err: any) {
            console.error("Failed to save opname:", err);
            dispatch(showAlert({
                type: "error",
                message: "Gagal Menyimpan Opname",
                description: err.response?.data?.message || "Terjadi kesalahan saat menyimpan ke database.",
            }));
        } finally {
            setIsSaving(false);
        }
    };

    // Cetak Label untuk item yang sedang dipilih
    const handleOpenLabel = (item: ActiveItem) => {
        setLabelItem({
            id: item.id,
            name: item.name,
            code: item.code || undefined,
            kode_baru: item.kode_baru || undefined,
            expired: item.expired || undefined,
            letak: item.lokasi || undefined,
            category: item.barang_type,
            isFromMaster: true,
        });
        setLabelModalOpen(true);
    };

    // Export Riwayat ke Excel
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const res = await api.get(`/api/v1/stok-opname?per_page=99999`);
            const allItems: OpnameHistoryItem[] = res.data?.data || [];

            exportJsonToExcel({
                data: allItems,
                columns: [
                    { header: "No", key: "id", formatter: (_, __, idx) => idx + 1, width: 6 },
                    { header: "Tanggal Opname", key: "tanggal_opname", formatter: (val) => dayjs(val).format("YYYY-MM-DD HH:mm"), width: 18 },
                    { header: "Kategori", key: "barang_type", formatter: (val) => val === "baku-pembanding" ? "Baku Pembanding" : "Reagen", width: 16 },
                    { header: "Kode Barang", key: "kode_barang", formatter: (val) => val || "-", width: 15 },
                    { header: "Nama Barang", key: "nama_barang", width: 35 },
                    { header: "Lokasi", key: "lokasi", formatter: (val) => val || "-", width: 14 },
                    { header: "Satuan", key: "satuan", formatter: (val) => val || "Botol", width: 10 },
                    { header: "Stok Sistem (Awal)", key: "stok_sistem", width: 14 },
                    { header: "Stok Fisik (Hasil Hitung)", key: "stok_fisik", width: 14 },
                    { header: "Selisih", key: "selisih", formatter: (val) => val > 0 ? `+${val}` : `${val}`, width: 10 },
                    { header: "Keterangan / Alasan", key: "keterangan", formatter: (val) => val || "-", width: 25 },
                    { header: "Petugas", key: "petugas_name", formatter: (val) => val || "Admin Gudang", width: 20 },
                ],
                fileName: `Berita_Acara_Stok_Opname_${dayjs().format("YYYYMMDD_HHmm")}`,
            });
        } catch (err) {
            console.error("Export error", err);
            dispatch(showAlert({
                type: "error",
                message: "Gagal Export Excel",
                description: "Terjadi kesalahan saat mengunduh data riwayat.",
            }));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Title */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                        <QrCode size={20} className="sm:hidden" />
                        <QrCode size={22} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
                            Menu Stok Opname Gudang
                        </h1>
                        <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
                            Pemindaian barcode/QR botol untuk pencocokan berkala stok fisik & sistem.
                        </p>
                    </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-end shrink-0">
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                        {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                        Export Berita Acara Excel
                    </button>
                </div>
            </div>

            {/* Section: Scan Barcode & Pencarian Barang */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {/* Left Card: Input & Scanner */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Camera size={16} className="text-blue-600" />
                            Pemindaian Barcode / QR
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">Step 1</span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                        Arahkan kamera ke stiker label botol, atau gunakan barcode scanner gun USB, atau ketik nama/kode barang.
                    </p>

                    {/* Quick Action: Buka Kamera Scanner */}
                    <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                        <Camera size={18} />
                        Buka Kamera Scanner QR / Barcode
                    </button>

                    <div className="relative flex py-0.5 items-center">
                        <div className="grow border-t border-slate-200"></div>
                        <span className="shrink mx-2 text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                            Atau Cari Manual
                        </span>
                        <div className="grow border-t border-slate-200"></div>
                    </div>

                    {/* Category Filter */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setCategoryFilter("all")}
                            className={`py-1.5 rounded-lg transition-all text-center ${
                                categoryFilter === "all" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter("baku-pembanding")}
                            className={`py-1.5 rounded-lg transition-all text-center truncate px-1 ${
                                categoryFilter === "baku-pembanding" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Baku Pembanding
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter("reagen")}
                            className={`py-1.5 rounded-lg transition-all text-center ${
                                categoryFilter === "reagen" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Reagen
                        </button>
                    </div>

                    {/* Search Field */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Kode / Nama / Barcode Text</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (!isSearching && searchQuery.trim()) {
                                                handlePerformLookup(searchQuery);
                                            }
                                        }
                                    }}
                                    placeholder="Scan barcode atau ketik nama..."
                                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setLookupResults([]);
                                            setIsSearching(false);
                                            if (searchInputRef.current) searchInputRef.current.focus();
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                                        title="Hapus pencarian"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handlePerformLookup(searchQuery)}
                                disabled={isSearching || !searchQuery.trim()}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors disabled:opacity-40 shrink-0"
                            >
                                {isSearching ? <Loader2 size={15} className="animate-spin" /> : "Cari"}
                            </button>
                        </div>
                    </div>

                    {/* Multi Lookup Results Preview */}
                    {lookupResults.length > 1 && (
                        <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/40 space-y-2">
                            <div className="text-xs font-bold text-blue-900">
                                Ditemukan {lookupResults.length} barang cocok, pilih salah satu:
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {lookupResults.map((item) => (
                                    <button
                                        key={`${item.barang_type}-${item.id}`}
                                        type="button"
                                        onClick={() => handleSelectItem(item)}
                                        className="w-full text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-xs text-slate-800">{item.name}</div>
                                            <div className="text-[11px] text-slate-500 font-mono">
                                                {item.kode_baru || item.code || `ID #${item.id}`} • {item.barang_type_label}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-800">{item.stock}</span>
                                            <span className="text-[10px] text-slate-500 ml-1">{item.satuan}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Card: Detail Barang & Form Penyesuaian Fisik */}
                <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Package size={16} className="text-indigo-600" />
                                Detail & Penyesuaian Stok Fisik
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">Step 2</span>
                        </div>

                        {selectedItem ? (
                            <div className="space-y-4 sm:space-y-5">
                                {/* Item Header Pill */}
                                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                                selectedItem.barang_type === "baku-pembanding"
                                                    ? "bg-indigo-100 text-indigo-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}>
                                                {selectedItem.barang_type_label}
                                            </span>
                                            <span className="text-xs font-mono font-semibold text-slate-500">
                                                {selectedItem.kode_baru || selectedItem.code || `ID #${selectedItem.id}`}
                                            </span>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                                            {selectedItem.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs text-slate-500">
                                            {selectedItem.lokasi && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    Lokasi: <span className="font-medium text-slate-700">{selectedItem.lokasi}</span>
                                                </span>
                                            )}
                                            {selectedItem.expired && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    Exp: <span className="font-medium text-slate-700">{dayjs(selectedItem.expired).format("DD MMM YYYY")}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button to print label for this bottle */}
                                    <button
                                        type="button"
                                        onClick={() => handleOpenLabel(selectedItem)}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors shrink-0"
                                    >
                                        <Printer size={14} />
                                        Cetak Ulang Label
                                    </button>
                                </div>

                                {/* Comparison Grid: Stok Sistem vs Stok Fisik vs Selisih */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    {/* Stok Sistem */}
                                    <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-center flex flex-col justify-center">
                                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                            Stok di Sistem
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">
                                            {selectedItem.stock}
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                                            {selectedItem.satuan || "Botol"}
                                        </span>
                                    </div>

                                    {/* Input Stok Fisik with Stepper */}
                                    <div className="p-3 sm:p-3.5 rounded-xl border-2 border-blue-500 bg-blue-50/30 text-center flex flex-col justify-center">
                                        <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                                            Stok Fisik Gudang
                                        </span>
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => setStokFisikInput(String(Math.max(0, (Number(stokFisikInput) || 0) - 1)))}
                                                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-800 font-black text-base flex items-center justify-center transition-colors active:scale-95"
                                                title="Kurangi 1"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                value={stokFisikInput}
                                                onChange={(e) => setStokFisikInput(e.target.value)}
                                                className="w-16 sm:w-20 text-lg sm:text-2xl font-black text-center text-blue-900 bg-white rounded-lg border border-blue-300 py-0.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setStokFisikInput(String((Number(stokFisikInput) || 0) + 1))}
                                                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-800 font-black text-base flex items-center justify-center transition-colors active:scale-95"
                                                title="Tambah 1"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] text-blue-700 font-semibold block mt-0.5">
                                            Hasil Hitung Petugas
                                        </span>
                                    </div>

                                    {/* Selisih Indicator */}
                                    <div className={`p-3 sm:p-3.5 rounded-xl border text-center flex flex-col justify-center ${
                                        selisih === 0
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                            : selisih < 0
                                            ? "border-rose-300 bg-rose-50 text-rose-800"
                                            : "border-amber-300 bg-amber-50 text-amber-800"
                                    }`}>
                                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block">
                                            Status Selisih
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-1 mt-0.5 sm:mt-1">
                                            {selisih === 0 ? (
                                                <>
                                                    <CheckCircle2 size={20} className="text-emerald-600" />
                                                    <span>0</span>
                                                </>
                                            ) : selisih < 0 ? (
                                                <>
                                                    <ArrowDownRight size={20} className="text-rose-600" />
                                                    <span>{selisih}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowUpRight size={20} className="text-amber-600" />
                                                    <span>+{selisih}</span>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] font-semibold">
                                            {selisih === 0 ? "Stok Cocok" : selisih < 0 ? "Kurang / Defisit" : "Lebih / Surplus"}
                                        </span>
                                    </div>
                                </div>

                                {/* Keterangan / Alasan Penyesuaian */}
                                <div className="space-y-1.5 sm:space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                        <label className="text-xs font-semibold text-slate-700">
                                            Catatan / Alasan Penyesuaian
                                        </label>
                                        <div className="flex flex-wrap gap-1">
                                            {["Stok Sesuai", "Barang Rusak/Bocor", "Kedaluwarsa", "Koreksi Catatan"].map((chip) => (
                                                <button
                                                    key={chip}
                                                    type="button"
                                                    onClick={() => setKeteranganInput(chip)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                                        keteranganInput === chip
                                                            ? "bg-slate-800 text-white border-slate-800"
                                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={keteranganInput}
                                        onChange={(e) => setKeteranganInput(e.target.value)}
                                        placeholder="Tuliskan keterangan detail jika ada selisih..."
                                        className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-56 sm:h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center p-4 sm:p-6 text-slate-400">
                                <Package size={36} className="stroke-1 mb-2 text-slate-300" />
                                <div className="text-xs sm:text-sm font-semibold text-slate-600">Belum Ada Barang Dipilih</div>
                                <p className="text-[11px] sm:text-xs max-w-sm mt-1 leading-relaxed">
                                    Scan QR code pada botol menggunakan tombol kamera di samping, atau cari nama/kode barang untuk mulai melakukan pencocokan stok fisik.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Buttons */}
                    {selectedItem && (
                        <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedItem(null);
                                    setStokFisikInput("");
                                    setKeteranganInput("");
                                }}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                            >
                                <RotateCcw size={14} />
                                Reset / Cari Lain
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveOpname}
                                disabled={isSaving}
                                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        Simpan Penyesuaian Stok
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Riwayat / Berita Acara Stok Opname */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <History size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                                Log Riwayat & Berita Acara Stok Opname
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-500">
                                Rekap catatan seluruh kegiatan pencocokan stok fisik di gudang BPOM.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                placeholder="Cari di riwayat..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => loadHistory()}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                            title="Refresh"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Mobile Cards (Visible on screens < md) */}
                <div className="block md:hidden space-y-3">
                    {historyLoading ? (
                        <div className="py-8 text-center text-slate-400">
                            <Loader2 size={24} className="animate-spin mx-auto mb-1 text-blue-600" />
                            <span className="text-xs">Memuat riwayat opname...</span>
                        </div>
                    ) : historyData.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                            Belum ada riwayat stok opname. Mulai scan barang untuk melakukan opname pertama.
                        </div>
                    ) : (
                        historyData.map((row) => (
                            <div key={row.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            row.barang_type === "baku-pembanding"
                                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                : "bg-blue-50 text-blue-700 border border-blue-200"
                                        }`}>
                                            {row.barang_type === "baku-pembanding" ? "BP" : "Reagen"}
                                        </span>
                                        <span className="font-mono text-[11px] text-slate-500">
                                            {dayjs(row.tanggal_opname).format("DD/MM/YY HH:mm")}
                                        </span>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                                        row.selisih === 0
                                            ? "bg-emerald-100 text-emerald-800"
                                            : row.selisih < 0
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-amber-100 text-amber-800"
                                    }`}>
                                        {row.selisih === 0 ? "Cocok (0)" : row.selisih > 0 ? `+${row.selisih} (Lebih)` : `${row.selisih} (Kurang)`}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{row.nama_barang}</h4>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                                        {row.kode_barang && <span className="font-mono">Kd: {row.kode_barang}</span>}
                                        {row.lokasi && (
                                            <span className="flex items-center gap-0.5">
                                                <MapPin size={11} className="text-slate-400" />
                                                {row.lokasi}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-center text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block font-medium">Stok Sistem</span>
                                        <span className="font-mono font-bold text-slate-700">{row.stok_sistem} {row.satuan}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-blue-600 block font-bold">Stok Fisik</span>
                                        <span className="font-mono font-black text-blue-900">{row.stok_fisik} {row.satuan}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-slate-500">
                                    <span className="truncate italic">
                                        {row.keterangan || "-"}
                                    </span>
                                    <span className="font-medium text-slate-700 shrink-0">
                                        {row.petugas_name || "Admin"}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table (Hidden on screens < md) */}
                <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-3.5 w-10 text-center">No</th>
                                    <th className="py-3 px-3.5 w-36">Waktu Opname</th>
                                    <th className="py-3 px-3.5 w-28">Kategori</th>
                                    <th className="py-3 px-3.5">Nama & Kode Barang</th>
                                    <th className="py-3 px-3.5 w-28">Lokasi Rak</th>
                                    <th className="py-3 px-3.5 w-24 text-center">Stok Sistem</th>
                                    <th className="py-3 px-3.5 w-24 text-center">Stok Fisik</th>
                                    <th className="py-3 px-3.5 w-24 text-center">Selisih</th>
                                    <th className="py-3 px-3.5">Keterangan / Alasan</th>
                                    <th className="py-3 px-3.5 w-32">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {historyLoading ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-slate-400">
                                            <Loader2 size={24} className="animate-spin mx-auto mb-1 text-blue-600" />
                                            Memuat riwayat opname...
                                        </td>
                                    </tr>
                                ) : historyData.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-slate-400">
                                            Belum ada riwayat stok opname. Mulai scan barang untuk melakukan opname pertama.
                                        </td>
                                    </tr>
                                ) : (
                                    historyData.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                                                {(historyPage - 1) * 15 + idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600">
                                                {dayjs(row.tanggal_opname).format("DD/MM/YYYY HH:mm")}
                                            </td>
                                            <td className="py-2.5 px-3.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    row.barang_type === "baku-pembanding"
                                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                                }`}>
                                                    {row.barang_type === "baku-pembanding" ? "Baku Pembanding" : "Reagen"}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3.5">
                                                <div className="font-bold text-slate-800">{row.nama_barang}</div>
                                                {row.kode_barang && (
                                                    <div className="text-[10px] font-mono text-slate-500">
                                                        Kode: {row.kode_barang}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-slate-600">
                                                {row.lokasi || "-"}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-center font-mono font-medium text-slate-600">
                                                {row.stok_sistem} {row.satuan}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-900">
                                                {row.stok_fisik} {row.satuan}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                                                    row.selisih === 0
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : row.selisih < 0
                                                        ? "bg-rose-100 text-rose-800"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}>
                                                    {row.selisih > 0 ? `+${row.selisih}` : row.selisih}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3.5 text-slate-600">
                                                {row.keterangan || "-"}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-slate-700 font-medium text-[11px]">
                                                {row.petugas_name || "Admin Gudang"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* QR Scanner Camera Modal */}
            <PercepatQRScannerModal
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={(val) => {
                    setScannerOpen(false);
                    setSearchQuery(val);
                    handlePerformLookup(val);
                }}
            />

            {/* Label Stiker Modal */}
            <LabelStikerModal
                isOpen={labelModalOpen}
                onClose={() => setLabelModalOpen(false)}
                item={labelItem}
            />
        </div>
    );
}
