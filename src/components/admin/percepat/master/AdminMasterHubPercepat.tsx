"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";
import { useDispatch } from "react-redux";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import {
    Database,
    FileSpreadsheet,
    FileText,
    UploadCloud,
    Trash2,
    Plus,
    Search,
    RotateCcw,
    FlaskConical,
    Scale,
    PenTool,
    Wrench,
    Sparkles,
    QrCode,
    Edit3,
    Loader2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Calendar,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { exportJsonToExcel } from "@/utils/excelExport";

// Form modals per category
import AdminMasterFormReagenPercepat from "./reagen/AdminMasterFormReagenPercepat";
import AdminMasterFormBakuPembandingPercepat from "./baku-pembanding/AdminMasterFormBakuPembandingPercepat";
import AdminMasterFormAtkPercepat from "./atk/AdminMasterFormAtkPercepat";
import AdminMasterFormSukuCadangPercepat from "./suku-cadang/AdminMasterFormSukuCadangPercepat";
import AdminMasterFormPerlengkapanPercepat from "./perlengkapan/AdminMasterFormPerlengkapanPercepat";

// Import & Action Modals
import ImportMasterExcelModal from "./ImportMasterExcelModal";
import ImportBeritaAcaraPdfModal from "../stok-opname/ImportBeritaAcaraPdfModal";
import PemusnahanMasterModal from "./PemusnahanMasterModal";
import LabelStikerModal, { LabelStikerItem } from "@/components/percepat-new/label/LabelStikerModal";

dayjs.locale("id");

export type MasterCategoryKey = "reagen" | "baku-pembanding" | "atk" | "suku-cadang" | "perlengkapan";

interface CategoryMeta {
    id: MasterCategoryKey;
    label: string;
    icon: any;
    apiEndpoint: string;
    hasLabel: boolean;
    hasExpired: boolean;
    defaultSatuan: string;
}

const CATEGORY_DEFINITIONS: Record<MasterCategoryKey, CategoryMeta> = {
    reagen: {
        id: "reagen",
        label: "Reagen",
        icon: FlaskConical,
        apiEndpoint: "/api/v1/reagen",
        hasLabel: true,
        hasExpired: true,
        defaultSatuan: "Botol",
    },
    "baku-pembanding": {
        id: "baku-pembanding",
        label: "Baku Pembanding",
        icon: Scale,
        apiEndpoint: "/api/v1/baku-pembanding",
        hasLabel: true,
        hasExpired: true,
        defaultSatuan: "Vial",
    },
    atk: {
        id: "atk",
        label: "ATK",
        icon: PenTool,
        apiEndpoint: "/api/v1/atk",
        hasLabel: true,
        hasExpired: false,
        defaultSatuan: "Pcs",
    },
    "suku-cadang": {
        id: "suku-cadang",
        label: "Suku Cadang",
        icon: Wrench,
        apiEndpoint: "/api/v1/suku-cadang",
        hasLabel: true,
        hasExpired: false,
        defaultSatuan: "Unit",
    },
    perlengkapan: {
        id: "perlengkapan",
        label: "Perlengkapan Kebersihan",
        icon: Sparkles,
        apiEndpoint: "/api/v1/perlengkapan-kebersihan",
        hasLabel: false,
        hasExpired: false,
        defaultSatuan: "Pcs",
    },
};

export default function AdminMasterHubPercepat() {
    const dispatch = useDispatch<AppDispatch>();

    // Active Category state
    const [activeCategory, setActiveCategory] = useState<MasterCategoryKey>("reagen");
    const activeMeta = CATEGORY_DEFINITIONS[activeCategory];

    // Data table state
    const [dataItems, setDataItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Form Add / Edit State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    // Import Modals State
    const [importExcelOpen, setImportExcelOpen] = useState(false);
    const [importPdfOpen, setImportPdfOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Pemusnahan Modal State
    const [pemusnahanOpen, setPemusnahanOpen] = useState(false);

    // Label Stiker Modal State
    const [labelModalOpen, setLabelModalOpen] = useState(false);
    const [labelItem, setLabelItem] = useState<LabelStikerItem | null>(null);

    // Debounce search
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(val);
            setCurrentPage(1);
        }, 400);
    };

    // Load Category Data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const endpoint = activeMeta.apiEndpoint;
            const res = await api.get(endpoint, {
                params: {
                    per_page: perPage,
                    page: currentPage,
                    name: debouncedSearch,
                    search: debouncedSearch,
                },
            });

            const resData = res.data?.data;
            if (Array.isArray(resData)) {
                setDataItems(resData);
                setTotalItems(res.data?.total || resData.length);
                setCurrentPage(res.data?.current_page || 1);
                setLastPage(res.data?.last_page || 1);
            } else if (Array.isArray(res.data)) {
                setDataItems(res.data);
                setTotalItems(res.data.length);
                setCurrentPage(1);
                setLastPage(1);
            } else {
                setDataItems([]);
                setTotalItems(0);
            }
        } catch (err: any) {
            console.error("Gagal memuat master:", err);
            setDataItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeMeta.apiEndpoint, currentPage, perPage, debouncedSearch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle Category Tab Change
    const handleCategoryChange = (key: MasterCategoryKey) => {
        setActiveCategory(key);
        setCurrentPage(1);
        setSearchQuery("");
        setDebouncedSearch("");
    };

    // Handle Delete Single Item
    const handleDeleteItem = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus barang ini dari database master?")) return;
        try {
            const endpoint = `${activeMeta.apiEndpoint}/${id}`;
            const res = await api.delete(endpoint);
            dispatch(showAlert({
                type: "success",
                message: "Berhasil Menghapus",
                description: res.data?.message || "Data barang berhasil dihapus.",
            }));
            loadData();
        } catch (err: any) {
            dispatch(showAlert({
                type: "error",
                message: "Gagal Menghapus",
                description: err.response?.data?.message || err.message || "Terjadi kesalahan saat menghapus data.",
            }));
        }
    };

    // Handle Cetak Label Barcode
    const handlePrintLabel = (item: any) => {
        setLabelItem({
            id: item.id,
            name: item.name || item.nama_barang,
            code: item.code || item.kode_barang || undefined,
            kode_baru: item.kode_baru || undefined,
            satuan: item.satuan,
            expired: item.expired || undefined,
            letak: item.lokasi || item.letak || undefined,
            category: activeCategory as any,
            isFromMaster: true,
        });
        setLabelModalOpen(true);
    };

    // Handle Export Excel for Current Category
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const res = await api.get(activeMeta.apiEndpoint, {
                params: { per_page: 99999 },
            });
            const allItems = res.data?.data || res.data || [];

            exportJsonToExcel({
                data: allItems,
                fileName: `Data_Master_${activeMeta.label.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmm")}`,
                sheetName: activeMeta.label,
                columns: [
                    { header: "No", key: "id", width: 6, formatter: (_v, _row, index) => index + 1 },
                    { header: "Kode Barang", key: "code", width: 18, formatter: (v, row) => row.kode_baru || v || row.kode_barang || "-" },
                    { header: "Nama Barang", key: "name", width: 45, formatter: (v, row) => v || row.nama_barang || "-" },
                    { header: "Stok", key: "stock", width: 12, formatter: (v, row) => Number(v ?? row.stok ?? 0) },
                    { header: "Satuan", key: "satuan", width: 14, formatter: (v) => v || activeMeta.defaultSatuan },
                    { header: "Lokasi Gudang", key: "lokasi", width: 18, formatter: (v, row) => v || row.letak || "-" },
                    ...(activeMeta.hasExpired ? [{
                        header: "Kedaluwarsa (Expired)",
                        key: "expired",
                        width: 20,
                        formatter: (v: any) => v ? dayjs(v).format("DD MMM YYYY") : "-",
                    }] : []),
                ],
            });

            dispatch(showAlert({
                type: "success",
                message: "Export Berhasil",
                description: `Berhasil mengekspor ${allItems.length} baris data ${activeMeta.label} ke Excel.`,
            }));
        } catch (err: any) {
            console.error(err);
            dispatch(showAlert({
                type: "error",
                message: "Gagal Export",
                description: err.message || "Terjadi kesalahan saat mengekspor data ke Excel.",
            }));
        } finally {
            setIsExporting(false);
        }
    };

    // Helper row numbering
    const getRowNumber = (idx: number) => (currentPage - 1) * perPage + idx + 1;

    // Render stock indicator badge
    const renderStockBadge = (val: any) => {
        const num = Number(val || 0);
        if (num <= 0) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    0
                </span>
            );
        }
        if (num <= 5) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {num}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {num}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Minimalist Top Header */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Database size={18} />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                            Master Data Inventaris Gudang
                        </h1>
                        <p className="text-xs text-slate-500">
                            Pusat kendali dan pengelolaan katalog barang seluruh kategori.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={() => setImportPdfOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                        title="Import Berita Acara Stok Opname dari PDF multi-kategori"
                    >
                        <FileText size={14} />
                        Import Berita Acara (PDF)
                    </button>

                    <button
                        type="button"
                        onClick={loadData}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                        title="Segarkan Data"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Segmented Category Buttons (Mirip Tampilan Inventory Beranda) */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 border border-slate-300/70 rounded-2xl overflow-x-auto">
                {(Object.keys(CATEGORY_DEFINITIONS) as MasterCategoryKey[]).map((key) => {
                    const cat = CATEGORY_DEFINITIONS[key];
                    const Icon = cat.icon;
                    const isActive = activeCategory === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleCategoryChange(key)}
                            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-700/50 scale-[1.01]"
                                    : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium"
                            }`}
                        >
                            <Icon size={16} />
                            <span>{cat.label}</span>
                            {isActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Box: Action Toolbar + Table Data */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-4">
                
                {/* Action Toolbar di Atas Tabel Data */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    
                    {/* Left: Action Buttons Per Category */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEditItem(null);
                                setIsFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                            <Plus size={14} />
                            Add New
                        </button>

                        <button
                            type="button"
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                            Export Excel
                        </button>

                        <button
                            type="button"
                            onClick={() => setImportExcelOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                            <UploadCloud size={14} />
                            Import Data (Excel & PDF)
                        </button>

                        <button
                            type="button"
                            onClick={() => setPemusnahanOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                        >
                            <Trash2 size={14} />
                            Hapus Semua (Pemusnahan)
                        </button>
                    </div>

                    {/* Right: Controls (Entries per page & Search) */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                            <span>Tampilkan:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder={`Cari di ${activeMeta.label}...`}
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-3.5 w-12 text-center">No</th>
                                    <th className="py-3 px-3.5">Nama {activeMeta.label}</th>
                                    <th className="py-3 px-3.5 w-24 text-center">Stock</th>
                                    <th className="py-3 px-3.5 w-24">Satuan</th>
                                    {activeMeta.hasExpired && (
                                        <th className="py-3 px-3.5 w-28">Expired</th>
                                    )}
                                    <th className="py-3 px-3.5 w-32">Lokasi Gudang</th>
                                    <th className="py-3 px-3.5 w-36 text-center">##</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={activeMeta.hasExpired ? 7 : 6} className="py-12 text-center text-slate-400">
                                            <Loader2 size={24} className="animate-spin mx-auto mb-1.5 text-blue-600" />
                                            Memuat data {activeMeta.label}...
                                        </td>
                                    </tr>
                                ) : dataItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeMeta.hasExpired ? 7 : 6} className="py-12 text-center text-slate-400">
                                            Belum ada data barang pada kategori {activeMeta.label}.
                                        </td>
                                    </tr>
                                ) : (
                                    dataItems.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                                                {getRowNumber(idx)}
                                            </td>

                                            <td className="py-2.5 px-3.5">
                                                <div className="font-bold text-slate-800 leading-snug">
                                                    {row.name || row.nama_barang || "-"}
                                                </div>
                                                {(row.kode_baru || row.code || row.kode_barang) && (
                                                    <div className="text-[10px] font-mono text-slate-400">
                                                        Kode: {row.kode_baru || row.code || row.kode_barang}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-3.5 text-center">
                                                {renderStockBadge(row.stock ?? row.stok)}
                                            </td>

                                            <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                                                {row.satuan || activeMeta.defaultSatuan}
                                            </td>

                                            {activeMeta.hasExpired && (
                                                <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px]">
                                                    {row.expired ? dayjs(row.expired).format("DD MMM YYYY") : "-"}
                                                </td>
                                            )}

                                            <td className="py-2.5 px-3.5 text-slate-600">
                                                {row.lokasi || row.letak || "-"}
                                            </td>

                                            <td className="py-2.5 px-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditItem(row);
                                                            setIsFormOpen(true);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                                                        title="Edit Data"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(row.id)}
                                                        className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                                                        title="Hapus Data"
                                                    >
                                                        Delete
                                                    </button>

                                                    {activeMeta.hasLabel && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePrintLabel(row)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-colors"
                                                            title="Cetak Barcode Label Gudang"
                                                        >
                                                            <QrCode size={11} />
                                                            Label
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                        <div>
                            Menampilkan <span className="font-semibold text-slate-700">{(currentPage - 1) * perPage + 1}</span> -{" "}
                            <span className="font-semibold text-slate-700">{Math.min(currentPage * perPage, totalItems)}</span> dari{" "}
                            <span className="font-bold text-slate-800">{totalItems}</span> barang {activeMeta.label}
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || isLoading}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-medium"
                            >
                                <ChevronLeft size={14} className="inline mr-0.5" />
                                Sebelumnya
                            </button>
                            <span className="px-2.5 py-1 font-semibold text-slate-700">
                                Hal {currentPage} / {lastPage}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= lastPage || isLoading}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-medium"
                            >
                                Selanjutnya
                                <ChevronRight size={14} className="inline ml-0.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dynamic Form Modal (Per Kategori yang sedang aktif) */}
            {activeCategory === "reagen" && (
                <AdminMasterFormReagenPercepat
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={editItem}
                    onSuccess={loadData}
                />
            )}

            {activeCategory === "baku-pembanding" && (
                <AdminMasterFormBakuPembandingPercepat
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={editItem}
                    onSuccess={loadData}
                />
            )}

            {activeCategory === "atk" && (
                <AdminMasterFormAtkPercepat
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={editItem}
                    onSuccess={loadData}
                />
            )}

            {activeCategory === "suku-cadang" && (
                <AdminMasterFormSukuCadangPercepat
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={editItem}
                    onSuccess={loadData}
                />
            )}

            {activeCategory === "perlengkapan" && (
                <AdminMasterFormPerlengkapanPercepat
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={editItem}
                    onSuccess={loadData}
                />
            )}

            {/* Import Data Modal (Excel & PDF BAST / BA SO per kategori aktif) */}
            <ImportMasterExcelModal
                isOpen={importExcelOpen}
                onClose={() => setImportExcelOpen(false)}
                onSuccess={loadData}
                category={activeCategory}
            />

            {/* Import Berita Acara PDF Multi-Kategori Modal */}
            <ImportBeritaAcaraPdfModal
                isOpen={importPdfOpen}
                onClose={() => setImportPdfOpen(false)}
                onSuccess={loadData}
            />

            {/* Pemusnahan Modal */}
            <PemusnahanMasterModal
                isOpen={pemusnahanOpen}
                onClose={() => setPemusnahanOpen(false)}
                onSuccess={loadData}
                category={activeCategory}
                categoryLabel={activeMeta.label}
                totalItems={totalItems}
            />

            {/* Label Stiker Modal Barcode */}
            <LabelStikerModal
                isOpen={labelModalOpen}
                onClose={() => setLabelModalOpen(false)}
                item={labelItem}
            />
        </div>
    );
}
