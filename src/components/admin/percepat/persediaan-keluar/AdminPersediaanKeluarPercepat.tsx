"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useDispatch } from "react-redux";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import {
    PackageMinus,
    Camera,
    Search,
    AlertTriangle,
    Clock,
    Save,
    RotateCcw,
    FileSpreadsheet,
    Download,
    Package,
    MapPin,
    Calendar,
    Loader2,
    History,
    Edit3,
    Trash2,
    X,
    CheckCircle2,
    ArrowDownRight,
} from "lucide-react";
import PercepatQRScannerModal from "@/components/percepat-new/stok-opname/PercepatQRScannerModal";
import { exportJsonToExcel } from "@/utils/excelExport";

dayjs.locale("id");

type BarangType = "reagen" | "baku-pembanding" | "atk" | "perlengkapan" | "suku-cadang";

interface MasterItem {
    barang_type: BarangType;
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

interface PersediaanKeluarHistoryItem {
    id: number;
    barang_type: BarangType;
    barang_id: number;
    kode_barang?: string;
    nama_barang: string;
    satuan?: string;
    lokasi?: string;
    kategori_keluar: "usang" | "rusak";
    jumlah: number;
    stok_awal: number;
    stok_sisa: number;
    keterangan?: string;
    petugas_name?: string;
    tanggal_keluar: string;
}

const CATEGORY_ENDPOINT_MAP: Record<BarangType, { endpoint: string; label: string; defaultSatuan: string }> = {
    reagen: { endpoint: "/api/v1/reagen", label: "Reagen", defaultSatuan: "Botol" },
    "baku-pembanding": { endpoint: "/api/v1/baku-pembanding", label: "Baku Pembanding", defaultSatuan: "Vial" },
    atk: { endpoint: "/api/v1/atk", label: "ATK", defaultSatuan: "Pcs" },
    perlengkapan: { endpoint: "/api/v1/perlengkapan-kebersihan", label: "Perlengkapan Kebersihan", defaultSatuan: "Pcs" },
    "suku-cadang": { endpoint: "/api/v1/suku-cadang", label: "Suku Cadang", defaultSatuan: "Unit" },
};

const KARTU_STOK_URL_MAP: Record<BarangType, (id: number) => string> = {
    reagen: (id) => `/api/v1/kartu-stok/reagen/${id}`,
    "baku-pembanding": (id) => `/api/v1/kartu-stok/baku-pembanding/${id}`,
    atk: (id) => `/api/v1/kartu-stok/atk/${id}`,
    perlengkapan: (id) => `/api/v1/download-perlengkapan/${id}`,
    "suku-cadang": (id) => `/api/v1/kartu-stok/suku-cadang/${id}`,
};

export default function AdminPersediaanKeluarPercepat() {
    const dispatch = useDispatch<AppDispatch>();

    // Left Panel: Master Catalog & Lookup State
    const [scannerOpen, setScannerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<BarangType>("reagen");
    const [masterSearch, setMasterSearch] = useState("");
    const [debouncedMasterSearch, setDebouncedMasterSearch] = useState("");
    const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
    const [masterLoading, setMasterLoading] = useState(false);
    const [masterPage, setMasterPage] = useState(1);
    const [masterLastPage, setMasterLastPage] = useState(1);
    const [masterTotal, setMasterTotal] = useState(0);

    // Right Panel: Form Persediaan Keluar State
    const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);
    const [kategoriKeluar, setKategoriKeluar] = useState<"usang" | "rusak">("usang");
    const [jumlahKeluarInput, setJumlahKeluarInput] = useState<string>("1");
    const [tanggalKeluar, setTanggalKeluar] = useState<string>(dayjs().format("YYYY-MM-DD"));
    const [keteranganInput, setKeteranganInput] = useState<string>("Barang Usang / Kedaluwarsa");
    const [isSaving, setIsSaving] = useState(false);

    // History Table State
    const [historyData, setHistoryData] = useState<PersediaanKeluarHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historySearch, setHistorySearch] = useState("");
    const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | BarangType>("all");
    const [historyKategoriFilter, setHistoryKategoriFilter] = useState<"all" | "usang" | "rusak">("all");
    const [isExporting, setIsExporting] = useState(false);

    // Edit History Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<PersediaanKeluarHistoryItem | null>(null);
    const [editKategori, setEditKategori] = useState<"usang" | "rusak">("usang");
    const [editJumlah, setEditJumlah] = useState<string>("1");
    const [editTanggal, setEditTanggal] = useState<string>("");
    const [editKeterangan, setEditKeterangan] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState(false);

    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMasterSearchChange = (val: string) => {
        setMasterSearch(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedMasterSearch(val);
            setMasterPage(1);
        }, 350);
    };

    // Load Master Items for Left Panel Selection
    const loadMasterItems = useCallback(async () => {
        setMasterLoading(true);
        try {
            const meta = CATEGORY_ENDPOINT_MAP[activeCategory];
            const res = await api.get(meta.endpoint, {
                params: {
                    per_page: 10,
                    page: masterPage,
                    name: debouncedMasterSearch,
                    search: debouncedMasterSearch,
                },
            });

            const rawList = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                ? res.data
                : [];

            const mapped: MasterItem[] = rawList.map((row: any) => ({
                barang_type: activeCategory,
                barang_type_label: meta.label,
                id: row.id,
                name: row.name || row.nama_barang || "-",
                code: row.code || row.kode_barang || null,
                kode_baru: row.kode_baru || null,
                satuan: row.satuan || meta.defaultSatuan,
                lokasi: row.lokasi || row.letak || null,
                expired: row.expired || null,
                stock: Number(row.stock ?? row.stok ?? 0),
            }));

            setMasterItems(mapped);
            setMasterTotal(res.data?.total || mapped.length);
            setMasterLastPage(res.data?.last_page || 1);
        } catch (err) {
            console.error("Failed to load master items:", err);
            setMasterItems([]);
        } finally {
            setMasterLoading(false);
        }
    }, [activeCategory, masterPage, debouncedMasterSearch]);

    useEffect(() => {
        loadMasterItems();
    }, [loadMasterItems]);

    // Load History Persediaan Keluar
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(historyPage),
                per_page: "15",
                ...(historySearch && { search: historySearch }),
                ...(historyTypeFilter !== "all" && { type: historyTypeFilter }),
                ...(historyKategoriFilter !== "all" && { kategori_keluar: historyKategoriFilter }),
            });
            const res = await api.get(`/api/v1/persediaan-keluar?${params}`);
            setHistoryData(res.data?.data || []);
            setHistoryTotal(res.data?.total || 0);
        } catch (err) {
            console.error("Failed to load persediaan keluar history:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [historyPage, historySearch, historyTypeFilter, historyKategoriFilter]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Handle QR Scan Lookup
    const handleBarcodeLookup = async (codeText: string) => {
        const trimmed = codeText.trim();
        if (!trimmed) return;
        try {
            const res = await api.get(`/api/v1/stok-opname/lookup`, {
                params: { query: trimmed, type: "all" },
            });
            const found: MasterItem[] = res.data?.data || [];
            if (found.length > 0) {
                handleSelectItem(found[0]);
                setActiveCategory(found[0].barang_type);
            } else {
                dispatch(showAlert({
                    type: "error",
                    message: "Barang Tidak Ditemukan",
                    description: `Tidak ditemukan barang master dengan kode/nama "${trimmed}".`,
                }));
            }
        } catch (err: any) {
            dispatch(showAlert({
                type: "error",
                message: "Gagal Mencari Barang",
                description: err.response?.data?.message || "Terjadi kesalahan saat mencari barang.",
            }));
        }
    };

    const handleSelectItem = (item: MasterItem) => {
        setSelectedItem(item);
        setJumlahKeluarInput(item.stock > 0 ? "1" : "0");
        if (kategoriKeluar === "usang") {
            setKeteranganInput("Barang Usang / Kedaluwarsa");
        } else {
            setKeteranganInput("Barang Rusak / Tidak Layak Pakai");
        }
    };

    const handleKategoriKeluarChange = (kat: "usang" | "rusak") => {
        setKategoriKeluar(kat);
        if (
            !keteranganInput ||
            keteranganInput === "Barang Usang / Kedaluwarsa" ||
            keteranganInput === "Barang Rusak / Tidak Layak Pakai"
        ) {
            setKeteranganInput(
                kat === "usang" ? "Barang Usang / Kedaluwarsa" : "Barang Rusak / Tidak Layak Pakai"
            );
        }
    };

    const stokTersedia = selectedItem ? selectedItem.stock : 0;
    const parsedJumlah = parseInt(jumlahKeluarInput, 10);
    const jumlahKeluar = isNaN(parsedJumlah) ? 0 : Math.max(0, parsedJumlah);
    const sisaStok = Math.max(0, stokTersedia - jumlahKeluar);

    // Simpan Persediaan Keluar
    const handleSavePersediaanKeluar = async () => {
        if (!selectedItem) return;
        if (jumlahKeluar <= 0) {
            dispatch(showAlert({
                type: "error",
                message: "Jumlah Tidak Valid",
                description: "Masukkan jumlah barang keluar minimal 1.",
            }));
            return;
        }
        if (jumlahKeluar > stokTersedia) {
            dispatch(showAlert({
                type: "error",
                message: "Stok Tidak Mencukupi",
                description: `Jumlah keluar (${jumlahKeluar}) melebihi stok master yang tersedia (${stokTersedia} ${selectedItem.satuan || "Unit"}).`,
            }));
            return;
        }

        setIsSaving(true);
        try {
            const res = await api.post(`/api/v1/persediaan-keluar`, {
                barang_type: selectedItem.barang_type,
                barang_id: selectedItem.id,
                kategori_keluar: kategoriKeluar,
                jumlah: jumlahKeluar,
                keterangan: keteranganInput.trim() || (kategoriKeluar === "usang" ? "Barang Usang" : "Barang Rusak"),
                tanggal_keluar: tanggalKeluar,
                petugas_name: "Admin Gudang BPOM",
            });

            dispatch(showAlert({
                type: "success",
                message: "Persediaan Keluar Tercatat!",
                description: res.data?.message || `${jumlahKeluar} ${selectedItem.satuan || "Unit"} ${selectedItem.name} berhasil dicatat sebagai barang ${kategoriKeluar.toUpperCase()} dan tercatat di Kartu Stok.`,
            }));

            // Update stok di state aktif & refresh tabel
            const newStock = Math.max(0, stokTersedia - jumlahKeluar);
            setSelectedItem((prev) => (prev ? { ...prev, stock: newStock } : null));
            setJumlahKeluarInput(newStock > 0 ? "1" : "0");
            loadMasterItems();
            loadHistory();
        } catch (err: any) {
            dispatch(showAlert({
                type: "error",
                message: "Gagal Menyimpan",
                description: err.response?.data?.message || "Terjadi kesalahan saat menyimpan data persediaan keluar.",
            }));
        } finally {
            setIsSaving(false);
        }
    };

    // Download Kartu Stok PDF langsung untuk barang tertentu
    const handleDownloadKartuStok = async (type: BarangType, id: number, name: string) => {
        try {
            const urlBuilder = KARTU_STOK_URL_MAP[type];
            const res = await api.get(urlBuilder(id), { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute("download", `Kartu-Stok-${type}-${name.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            dispatch(showAlert({
                type: "success",
                message: "Kartu Stok Diunduh",
                description: `Kartu Stok untuk ${name} berhasil diunduh.`,
            }));
        } catch (err) {
            console.error("Failed to download kartu stok:", err);
            dispatch(showAlert({
                type: "error",
                message: "Gagal Mengunduh Kartu Stok",
                description: "Terjadi kesalahan saat mengunduh PDF Kartu Stok.",
            }));
        }
    };

    // Edit Riwayat
    const handleOpenEdit = (row: PersediaanKeluarHistoryItem) => {
        setEditingRow(row);
        setEditKategori(row.kategori_keluar);
        setEditJumlah(String(row.jumlah));
        setEditTanggal(dayjs(row.tanggal_keluar).format("YYYY-MM-DD"));
        setEditKeterangan(row.keterangan || "");
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingRow) return;
        setIsUpdating(true);
        try {
            await api.put(`/api/v1/persediaan-keluar/${editingRow.id}`, {
                kategori_keluar: editKategori,
                jumlah: Number(editJumlah),
                tanggal_keluar: editTanggal,
                keterangan: editKeterangan,
            });
            dispatch(showAlert({
                type: "success",
                message: "Riwayat Diperbarui",
                description: "Data persediaan keluar dan stok master berhasil disesuaikan.",
            }));
            setEditModalOpen(false);
            loadMasterItems();
            loadHistory();
        } catch (err: any) {
            dispatch(showAlert({
                type: "error",
                message: "Gagal Memperbarui",
                description: err.response?.data?.message || "Gagal memperbarui catatan persediaan keluar.",
            }));
        } finally {
            setIsUpdating(false);
        }
    };

    // Hapus Riwayat
    const handleDeleteHistory = async (row: PersediaanKeluarHistoryItem) => {
        if (!confirm(`Hapus catatan keluar "${row.nama_barang}" (${row.jumlah} ${row.satuan || "Unit"}) dan kembalikan stok ke Master?`)) {
            return;
        }
        try {
            await api.delete(`/api/v1/persediaan-keluar/${row.id}`);
            dispatch(showAlert({
                type: "success",
                message: "Catatan Dihapus",
                description: "Catatan persediaan keluar dihapus dan stok telah dikembalikan ke Master.",
            }));
            loadMasterItems();
            loadHistory();
        } catch (err: any) {
            dispatch(showAlert({
                type: "error",
                message: "Gagal Menghapus",
                description: err.response?.data?.message || "Gagal menghapus catatan persediaan keluar.",
            }));
        }
    };

    // Export Excel
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const res = await api.get(`/api/v1/persediaan-keluar?per_page=99999`);
            const allItems: PersediaanKeluarHistoryItem[] = res.data?.data || [];

            exportJsonToExcel({
                data: allItems,
                columns: [
                    { header: "No", key: "id", formatter: (_, __, idx) => idx + 1, width: 6 },
                    { header: "Tanggal Keluar", key: "tanggal_keluar", formatter: (val) => dayjs(val).format("YYYY-MM-DD HH:mm"), width: 18 },
                    { header: "Kategori Barang", key: "barang_type", formatter: (val: BarangType) => CATEGORY_ENDPOINT_MAP[val]?.label || val, width: 20 },
                    { header: "Kode Barang", key: "kode_barang", formatter: (val) => val || "-", width: 15 },
                    { header: "Nama Barang", key: "nama_barang", width: 35 },
                    { header: "Kategori Keluar", key: "kategori_keluar", formatter: (val) => String(val || "").toUpperCase(), width: 15 },
                    { header: "Jumlah Keluar", key: "jumlah", width: 14 },
                    { header: "Satuan", key: "satuan", formatter: (val) => val || "Unit", width: 10 },
                    { header: "Stok Awal", key: "stok_awal", width: 12 },
                    { header: "Stok Sisa", key: "stok_sisa", width: 12 },
                    { header: "Keterangan", key: "keterangan", formatter: (val) => val || "-", width: 30 },
                    { header: "Petugas", key: "petugas_name", formatter: (val) => val || "Admin Gudang", width: 20 },
                ],
                fileName: `Laporan_Persediaan_Keluar_Usang_Rusak_${dayjs().format("YYYYMMDD_HHmm")}`,
            });
        } catch (err) {
            dispatch(showAlert({
                type: "error",
                message: "Gagal Export Excel",
                description: "Terjadi kesalahan saat mengunduh laporan persediaan keluar.",
            }));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Top Header */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
                        <PackageMinus size={22} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
                            Menu Persediaan Keluar (Barang Usang & Rusak)
                        </h1>
                        <p className="text-[11px] sm:text-xs text-slate-500">
                            Pilih barang dari Master untuk dikategorikan sebagai Usang atau Rusak. Otomatis mengurangi stok Master & tercatat di Kartu Stok.
                        </p>
                    </div>
                </div>

                <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                        {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                        Export Rekap Excel
                    </button>
                </div>
            </div>

            {/* Main Grid: Pilih Barang Master (Left) & Form Kategorisasi Usang/Rusak (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {/* Left Card: Pilih Barang dari Master */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Package size={16} className="text-rose-600" />
                            Pilih Barang dari Master
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">Step 1</span>
                    </div>

                    {/* Scan Barcode Button */}
                    <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                    >
                        <Camera size={16} />
                        Scan QR / Barcode Barang Master
                    </button>

                    {/* Category Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                        {(Object.keys(CATEGORY_ENDPOINT_MAP) as BarangType[]).map((catKey) => (
                            <button
                                key={catKey}
                                type="button"
                                onClick={() => {
                                    setActiveCategory(catKey);
                                    setMasterPage(1);
                                }}
                                className={`py-1.5 px-2 rounded-lg transition-all text-center truncate ${
                                    activeCategory === catKey
                                        ? "bg-white text-rose-700 shadow-xs font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {CATEGORY_ENDPOINT_MAP[catKey].label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={masterSearch}
                            onChange={(e) => handleMasterSearchChange(e.target.value)}
                            placeholder={`Cari nama / kode di Master ${CATEGORY_ENDPOINT_MAP[activeCategory].label}...`}
                            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
                        />
                        {masterSearch && (
                            <button
                                type="button"
                                onClick={() => handleMasterSearchChange("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Master Item List */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>Daftar Master {CATEGORY_ENDPOINT_MAP[activeCategory].label}</span>
                            <span>{masterTotal} Barang</span>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {masterLoading ? (
                                <div className="py-8 text-center text-slate-400 text-xs">
                                    <Loader2 size={20} className="animate-spin mx-auto mb-1 text-rose-600" />
                                    Memuat data master...
                                </div>
                            ) : masterItems.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs px-4">
                                    Tidak ada barang ditemukan pada kategori ini.
                                </div>
                            ) : (
                                masterItems.map((item) => {
                                    const isSelected =
                                        selectedItem?.id === item.id && selectedItem?.barang_type === item.barang_type;
                                    return (
                                        <button
                                            key={`${item.barang_type}-${item.id}`}
                                            type="button"
                                            onClick={() => handleSelectItem(item)}
                                            className={`w-full text-left px-3.5 py-2.5 transition-all flex items-center justify-between gap-2 ${
                                                isSelected
                                                    ? "bg-rose-50/80 border-l-4 border-l-rose-600"
                                                    : "hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs text-slate-800 truncate">
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                                                    {(item.kode_baru || item.code) && (
                                                        <span className="font-mono">
                                                            Kode: {item.kode_baru || item.code}
                                                        </span>
                                                    )}
                                                    {item.expired && (
                                                        <span>Exp: {dayjs(item.expired).format("DD MMM YYYY")}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                        item.stock <= 0
                                                            ? "bg-rose-100 text-rose-700"
                                                            : "bg-emerald-100 text-emerald-800"
                                                    }`}
                                                >
                                                    Stok: {item.stock} {item.satuan}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        {masterLastPage > 1 && (
                            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                                <button
                                    type="button"
                                    disabled={masterPage <= 1}
                                    onClick={() => setMasterPage((p) => Math.max(1, p - 1))}
                                    className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold"
                                >
                                    Prev
                                </button>
                                <span>
                                    Hal {masterPage} / {masterLastPage}
                                </span>
                                <button
                                    type="button"
                                    disabled={masterPage >= masterLastPage}
                                    onClick={() => setMasterPage((p) => Math.min(masterLastPage, p + 1))}
                                    className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Card: Form Kategorisasi Barang Usang / Rusak */}
                <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} className="text-rose-600" />
                                Kategorisasi Persediaan Keluar (Usang / Rusak)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">Step 2</span>
                        </div>

                        {selectedItem ? (
                            <div className="space-y-4">
                                {/* Selected Item Header Card */}
                                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                                {selectedItem.barang_type_label}
                                            </span>
                                            <span className="text-xs font-mono font-semibold text-slate-500">
                                                {selectedItem.kode_baru || selectedItem.code || `ID #${selectedItem.id}`}
                                            </span>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                                            {selectedItem.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
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

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDownloadKartuStok(
                                                selectedItem.barang_type,
                                                selectedItem.id,
                                                selectedItem.name
                                            )
                                        }
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors shrink-0"
                                    >
                                        <Download size={14} />
                                        Cek Kartu Stok PDF
                                    </button>
                                </div>

                                {/* Pilih Kategori Keluar: USANG vs RUSAK */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        Pilih Kategori Persediaan Keluar
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleKategoriKeluarChange("usang")}
                                            className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                                                kategoriKeluar === "usang"
                                                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            }`}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                    kategoriKeluar === "usang"
                                                        ? "bg-amber-500 text-white"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                                                    Barang Usang
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                                    Kedaluwarsa, melewati masa pakai, atau usang penyimpanan.
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleKategoriKeluarChange("rusak")}
                                            className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                                                kategoriKeluar === "rusak"
                                                    ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            }`}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                    kategoriKeluar === "rusak"
                                                        ? "bg-rose-600 text-white"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                <AlertTriangle size={18} />
                                            </div>
                                            <div>
                                                <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                                                    Barang Rusak
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                                    Kemasan bocor, pecah, terkontaminasi, atau rusak fisik.
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Stock Calculation Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center flex flex-col justify-center">
                                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                                            Stok Master Saat Ini
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                                            {stokTersedia}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {selectedItem.satuan || "Unit"}
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl border-2 border-rose-500 bg-rose-50/30 text-center flex flex-col justify-center">
                                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                                            Jumlah Dikeluarkan ({kategoriKeluar.toUpperCase()})
                                        </span>
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setJumlahKeluarInput(
                                                        String(Math.max(1, (Number(jumlahKeluarInput) || 1) - 1))
                                                    )
                                                }
                                                className="w-8 h-8 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-base flex items-center justify-center"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max={stokTersedia}
                                                value={jumlahKeluarInput}
                                                onChange={(e) => setJumlahKeluarInput(e.target.value)}
                                                className="w-16 sm:w-20 text-lg sm:text-2xl font-black text-center text-rose-900 bg-white rounded-lg border border-rose-300 py-0.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setJumlahKeluarInput(
                                                        String(
                                                            Math.min(
                                                                Math.max(1, stokTersedia),
                                                                (Number(jumlahKeluarInput) || 0) + 1
                                                            )
                                                        )
                                                    )
                                                }
                                                className="w-8 h-8 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-base flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
                                            Dicatat di Kolom KELUAR
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-center flex flex-col justify-center">
                                        <span className="text-[10px] font-bold uppercase tracking-wider block">
                                            Sisa Stok Master
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-1 mt-0.5">
                                            <ArrowDownRight size={18} className="text-emerald-600" />
                                            <span>{sisaStok}</span>
                                        </div>
                                        <span className="text-[10px] font-semibold">
                                            {selectedItem.satuan || "Unit"} Tersisa
                                        </span>
                                    </div>
                                </div>

                                {/* Tanggal Keluar */}
                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                                            <Calendar size={15} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-800 block">
                                                Tanggal Pengeluaran Barang
                                            </label>
                                            <span className="text-[10px] text-slate-500">
                                                Tanggal ini akan tercatat pada kolom TANGGAL di Kartu Stok
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={tanggalKeluar}
                                            onChange={(e) => setTanggalKeluar(e.target.value)}
                                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setTanggalKeluar(dayjs().format("YYYY-MM-DD"))}
                                            className="text-[11px] font-bold text-rose-700 bg-rose-100/70 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200"
                                        >
                                            Hari Ini
                                        </button>
                                    </div>
                                </div>

                                {/* Keterangan */}
                                <div className="space-y-1.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                        <label className="text-xs font-semibold text-slate-700">
                                            Keterangan / Alasan di Kartu Stok
                                        </label>
                                        <div className="flex flex-wrap gap-1">
                                            {[
                                                "Barang Usang / Kedaluwarsa",
                                                "Barang Rusak / Tidak Layak Pakai",
                                                "Kemasan Bocor / Pecah",
                                                "Kontaminasi Fisik",
                                            ].map((chip) => (
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
                                        placeholder="Tuliskan keterangan untuk Kartu Stok..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center p-6 text-slate-400">
                                <PackageMinus size={38} className="stroke-1 mb-2 text-slate-300" />
                                <div className="text-sm font-semibold text-slate-600">
                                    Belum Ada Barang Master Dipilih
                                </div>
                                <p className="text-xs max-w-sm mt-1 leading-relaxed">
                                    Klik salah satu barang dari daftar Master di sebelah kiri atau scan QR/Barcode untuk mencatat barang Usang atau Rusak.
                                </p>
                            </div>
                        )}
                    </div>

                    {selectedItem && (
                        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5"
                            >
                                <RotateCcw size={14} />
                                Batal / Pilih Barang Lain
                            </button>

                            <button
                                type="button"
                                onClick={handleSavePersediaanKeluar}
                                disabled={isSaving || stokTersedia <= 0}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        Simpan Persediaan Keluar ({kategoriKeluar.toUpperCase()})
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* History Table Section */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                            <History size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                                Riwayat Persediaan Keluar (Barang Usang & Rusak)
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-500">
                                Seluruh daftar di bawah ini otomatis tercatat pada kolom KELUAR di PDF Kartu Stok masing-masing barang.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={historyTypeFilter}
                            onChange={(e) => {
                                setHistoryTypeFilter(e.target.value as any);
                                setHistoryPage(1);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                        >
                            <option value="all">Semua Kategori Barang</option>
                            <option value="reagen">Reagen</option>
                            <option value="baku-pembanding">Baku Pembanding</option>
                            <option value="atk">ATK</option>
                            <option value="perlengkapan">Perlengkapan Kebersihan</option>
                            <option value="suku-cadang">Suku Cadang</option>
                        </select>

                        <select
                            value={historyKategoriFilter}
                            onChange={(e) => {
                                setHistoryKategoriFilter(e.target.value as any);
                                setHistoryPage(1);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                        >
                            <option value="all">Semua Status (Usang & Rusak)</option>
                            <option value="usang">Barang Usang</option>
                            <option value="rusak">Barang Rusak</option>
                        </select>

                        <div className="relative flex-1 sm:w-56">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={historySearch}
                                onChange={(e) => {
                                    setHistorySearch(e.target.value);
                                    setHistoryPage(1);
                                }}
                                placeholder="Cari nama / keterangan..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={loadHistory}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Refresh"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-3.5 w-10 text-center">No</th>
                                    <th className="py-3 px-3.5 w-32">Tanggal</th>
                                    <th className="py-3 px-3.5 w-32">Kategori Barang</th>
                                    <th className="py-3 px-3.5">Nama & Kode Barang</th>
                                    <th className="py-3 px-3.5 w-28 text-center">Status Keluar</th>
                                    <th className="py-3 px-3.5 w-24 text-center">Jumlah Keluar</th>
                                    <th className="py-3 px-3.5 w-28 text-center">Stok Awal → Sisa</th>
                                    <th className="py-3 px-3.5">Keterangan</th>
                                    <th className="py-3 px-3.5 w-40 text-center">Aksi & Kartu Stok</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {historyLoading ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-400">
                                            <Loader2 size={24} className="animate-spin mx-auto mb-1 text-rose-600" />
                                            Memuat riwayat persediaan keluar...
                                        </td>
                                    </tr>
                                ) : historyData.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-400">
                                            Belum ada catatan persediaan keluar (barang usang / rusak).
                                        </td>
                                    </tr>
                                ) : (
                                    historyData.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                                                {(historyPage - 1) * 15 + idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600">
                                                {dayjs(row.tanggal_keluar).format("DD MMM YYYY")}
                                            </td>
                                            <td className="py-2.5 px-3.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                    {CATEGORY_ENDPOINT_MAP[row.barang_type]?.label || row.barang_type}
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
                                            <td className="py-2.5 px-3.5 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                        row.kategori_keluar === "usang"
                                                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                            : "bg-rose-100 text-rose-800 border border-rose-200"
                                                    }`}
                                                >
                                                    {row.kategori_keluar}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3.5 text-center font-mono font-black text-rose-700">
                                                -{row.jumlah} {row.satuan}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-slate-600">
                                                {row.stok_awal} → <span className="font-bold text-slate-900">{row.stok_sisa}</span>
                                            </td>
                                            <td className="py-2.5 px-3.5 text-slate-600">
                                                {row.keterangan || "-"}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDownloadKartuStok(
                                                                row.barang_type,
                                                                row.barang_id,
                                                                row.nama_barang
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-colors"
                                                        title="Download PDF Kartu Stok Barang Ini"
                                                    >
                                                        <Download size={11} />
                                                        Kartu Stok
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(row)}
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                                                        title="Edit Catatan"
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteHistory(row)}
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors"
                                                        title="Hapus & Kembalikan Stok"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {historyTotal > 15 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
                        <div>
                            Menampilkan {(historyPage - 1) * 15 + 1} - {Math.min(historyPage * 15, historyTotal)} dari {historyTotal} data
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={historyPage <= 1}
                                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>
                            <span className="px-2 font-semibold">
                                Hal {historyPage} / {Math.ceil(historyTotal / 15)}
                            </span>
                            <button
                                type="button"
                                disabled={historyPage >= Math.ceil(historyTotal / 15)}
                                onClick={() => setHistoryPage((p) => p + 1)}
                                className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal */}
            <PercepatQRScannerModal
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={(val) => {
                    setScannerOpen(false);
                    handleBarcodeLookup(val);
                }}
            />

            {/* Edit Modal */}
            {editModalOpen && editingRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-800">Edit Catatan Persediaan Keluar</h3>
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-xs font-bold text-slate-800">{editingRow.nama_barang}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                                Kategori: {CATEGORY_ENDPOINT_MAP[editingRow.barang_type]?.label || editingRow.barang_type}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Status Kategori Keluar</label>
                                <select
                                    value={editKategori}
                                    onChange={(e) => setEditKategori(e.target.value as "usang" | "rusak")}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold"
                                >
                                    <option value="usang">Barang Usang</option>
                                    <option value="rusak">Barang Rusak</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Jumlah Keluar</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editJumlah}
                                    onChange={(e) => setEditJumlah(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Keluar</label>
                                <input
                                    type="date"
                                    value={editTanggal}
                                    onChange={(e) => setEditTanggal(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Keterangan</label>
                                <input
                                    type="text"
                                    value={editKeterangan}
                                    onChange={(e) => setEditKeterangan(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                            >
                                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

