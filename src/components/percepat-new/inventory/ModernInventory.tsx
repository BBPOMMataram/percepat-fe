"use client";

import React, { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

export type CategoryKey =
    | "reagen"
    | "bakuPembanding"
    | "atk"
    | "sukuCadang"
    | "perlengkapan"
    | "reagenExpiring"
    | "bakuPembandingExpiring";

interface ModernInventoryProps {
    activeCategory: CategoryKey;
    onCategoryChange: (cat: CategoryKey) => void;
}

interface CategoryConfig {
    key: CategoryKey;
    label: string;
    url: string;
    description: string;
    icon: string;
    isExpiring?: boolean;
}

const CATEGORY_CONFIGS: Record<CategoryKey, CategoryConfig> = {
    reagen: {
        key: "reagen",
        label: "Reagen",
        url: "api/v1/barang/reagen?has_stock=1",
        description: "Bahan kimia, reagen analisis laboratorium, dan media mikrobiologi.",
        icon: "biotech",
    },
    bakuPembanding: {
        key: "bakuPembanding",
        label: "Baku Pembanding",
        url: "api/v1/barang/baku-pembanding?has_stock=1",
        description: "Senyawa referensi terkalibrasi dan baku mutu pengujian resmi.",
        icon: "scale",
    },
    atk: {
        key: "atk",
        label: "ATK",
        url: "api/v1/barang/atk?has_stock=1",
        description: "Kertas, formulir pengujian, dan perlengkapan administrasi perkantoran.",
        icon: "edit_note",
    },
    sukuCadang: {
        key: "sukuCadang",
        label: "Suku Cadang",
        url: "api/v1/barang/suku-cadang?has_stock=1",
        description: "Komponen pengganti dan suku cadang instrumen uji laboratorium.",
        icon: "settings_input_component",
    },
    perlengkapan: {
        key: "perlengkapan",
        label: "Perlengkapan",
        url: "api/v1/barang/perlengkapan?has_stock=1",
        description: "Pembersih kaca, desinfektan, sabun laboratorium, dan sanitasi lab.",
        icon: "cleaning_services",
    },
    reagenExpiring: {
        key: "reagenExpiring",
        label: "Reagen Kadaluarsa",
        url: "api/v1/barang/reagen?expiring_months=3&has_stock=1",
        description: "Reagen yang akan kedaluwarsa dalam 3 bulan ke depan dan stok fisik masih tersedia.",
        icon: "hourglass_bottom",
        isExpiring: true,
    },
    bakuPembandingExpiring: {
        key: "bakuPembandingExpiring",
        label: "Baku Pembanding Kadaluarsa",
        url: "api/v1/barang/baku-pembanding?expiring_months=3&has_stock=1",
        description: "Baku Pembanding yang akan kedaluwarsa dalam 3 bulan ke depan dan stok fisik masih tersedia.",
        icon: "hourglass_bottom",
        isExpiring: true,
    },
};

export default function ModernInventory({ activeCategory, onCategoryChange }: ModernInventoryProps) {
    const config = CATEGORY_CONFIGS[activeCategory] || CATEGORY_CONFIGS.reagen;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [valuePerPage, setValuePerPage] = useState("10");
    const [nameToSearch, setNameToSearch] = useState("");
    const [page, setPage] = useState(1);

    const isBakuPembanding = activeCategory === "bakuPembanding" || activeCategory === "bakuPembandingExpiring";
    const isReagen = activeCategory === "reagen" || activeCategory === "reagenExpiring";

    // Reset data and pagination when category changes
    useEffect(() => {
        setData(null);
        setPage(1);
        setNameToSearch("");
    }, [activeCategory]);

    const fetchData = useCallback(async (targetPage = page, search = nameToSearch, perPage = valuePerPage) => {
        setLoading(true);
        try {
            const separator = config.url.includes("?") ? "&" : "?";
            const url = `${config.url}${separator}value_per_page=${perPage}&name=${encodeURIComponent(search)}&page=${targetPage}`;
            const res = await api.get(url);
            setData(res.data);
        } catch (err) {
            console.error("Gagal memuat inventaris:", err);
            setData({ data: [], total: 0 });
        } finally {
            setLoading(false);
        }
    }, [config.url, page, nameToSearch, valuePerPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(1, nameToSearch, valuePerPage);
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nameToSearch, valuePerPage, config.url]);

    const handlePageChange = (targetPage: number) => {
        setPage(targetPage);
        fetchData(targetPage, nameToSearch, valuePerPage);
    };

    const getRowNumber = (index: number) => {
        if (!data || !data.current_page) return index + 1;
        return (data.current_page - 1) * parseInt(valuePerPage) + index + 1;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    const renderStockBadge = (stock: number | string) => {
        const num = Number(stock);
        if (isNaN(num) || num <= 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>0</span>
                </span>
            );
        }
        if (num <= 5) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{num}</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{num}</span>
            </span>
        );
    };

    return (
        <section id="inventory" className="py-12 sm:py-16 bg-slate-50/50 scroll-mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Title with Subtitle */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                Daftar Inventaris Terpadu
                            </h2>
                            {config.isExpiring && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    Filter Kadaluarsa ≤ 3 Bulan
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            {config.description}
                        </p>
                    </div>

                    {/* Total Count Badge */}
                    {data?.total !== undefined && (
                        <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
                            Total: <span className="font-semibold text-slate-900">{data.total}</span> barang
                        </div>
                    )}
                </div>

                {/* Animated Segmented Category Tabs with High Contrast Active State */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 border border-slate-300/70 rounded-2xl mb-6 overflow-x-auto">
                    {/* Standar Kategori */}
                    {(["reagen", "bakuPembanding", "atk", "sukuCadang", "perlengkapan"] as CategoryKey[]).map(key => {
                        const cat = CATEGORY_CONFIGS[key];
                        const isActive = activeCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => onCategoryChange(cat.key)}
                                className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-700/50 scale-[1.02]"
                                        : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium"
                                }`}
                            >
                                <span className={`material-symbols-outlined text-base transition-transform ${isActive ? "scale-110" : ""}`}>
                                    {cat.icon}
                                </span>
                                <span>{cat.label}</span>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse ml-0.5" />
                                )}
                            </button>
                        );
                    })}

                    {/* Divider Pemisah */}
                    <div className="h-6 w-px bg-slate-300 mx-1 shrink-0" />

                    {/* Kategori Khusus Segera Kadaluarsa di Paling Kanan */}
                    {(["reagenExpiring", "bakuPembandingExpiring"] as CategoryKey[]).map(key => {
                        const cat = CATEGORY_CONFIGS[key];
                        const isActive = activeCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => onCategoryChange(cat.key)}
                                className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-700/50 scale-[1.02]"
                                        : "bg-amber-50/90 text-amber-900 hover:bg-amber-100 border border-amber-300/80 font-semibold"
                                }`}
                                title={cat.description}
                            >
                                <span className={`material-symbols-outlined text-base transition-transform ${isActive ? "scale-110" : "text-amber-600"}`}>
                                    {cat.icon}
                                </span>
                                <span>{cat.label}</span>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse ml-0.5" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search & Rows Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-72">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder={`Cari di ${config.label}...`}
                                value={nameToSearch}
                                onChange={e => setNameToSearch(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 transition-all"
                            />
                            {nameToSearch && (
                                <button
                                    type="button"
                                    onClick={() => setNameToSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
                            <span>Tampilkan:</span>
                            <select
                                value={valuePerPage}
                                onChange={e => {
                                    setValuePerPage(e.target.value);
                                    setPage(1);
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="10">10 baris</option>
                                <option value="25">25 baris</option>
                                <option value="50">50 baris</option>
                                <option value="100">100 baris</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] tracking-wide uppercase">
                                    <th className="py-3 px-4 w-12 text-center">No</th>

                                    {isBakuPembanding && (
                                        <>
                                            <th className="py-3 px-4 w-32">Kode Baru</th>
                                            <th className="py-3 px-4">Nama Baku Pembanding</th>
                                            <th className="py-3 px-4 w-28">Letak</th>
                                        </>
                                    )}

                                    {isReagen && (
                                        <th className="py-3 px-4">Nama Reagen</th>
                                    )}

                                    {!isBakuPembanding && !isReagen && (
                                        <th className="py-3 px-4">Nama Barang</th>
                                    )}

                                    <th className="py-3 px-4 w-28">Satuan</th>

                                    {(isReagen || isBakuPembanding) && (
                                        <th className="py-3 px-4 w-36">Kedaluwarsa</th>
                                    )}

                                    <th className="py-3 px-4 w-28">Stok</th>

                                    {!isBakuPembanding && !isReagen && (
                                        <th className="py-3 px-4">Keterangan</th>
                                    )}

                                    {(isReagen || isBakuPembanding) && (
                                        <th className="py-3 px-4 w-20 text-center">MSDS</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-3 px-4 text-center"><div className="h-4 w-4 bg-slate-200 rounded mx-auto" /></td>
                                            <td className="py-3 px-4"><div className="h-4 w-2/3 bg-slate-200 rounded" /></td>
                                            <td className="py-3 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                                            <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                                            <td className="py-3 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                                            <td className="py-3 px-4 text-center"><div className="h-4 w-6 bg-slate-200 rounded mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : (() => {
                                    const validStockItems = (data?.data || []).filter((item: any) => {
                                        const stockVal = Number(item?.stock);
                                        return !isNaN(stockVal) && stockVal > 0;
                                    });

                                    if (validStockItems.length === 0) {
                                        return (
                                            <tr>
                                                <td
                                                    colSpan={isBakuPembanding ? 8 : (isReagen ? 6 : 5)}
                                                    className="py-12 px-4 text-center text-slate-500"
                                                >
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">
                                                            inventory
                                                        </span>
                                                        <div className="font-semibold text-slate-700 text-sm">Tidak ada data ditemukan</div>
                                                        <div className="text-xs text-slate-400 mt-0.5">
                                                            {config.isExpiring
                                                                ? "Tidak ada barang yang akan kedaluwarsa dalam 3 bulan ke depan dengan stok tersedia."
                                                                : "Tidak ada barang dengan stok tersedia saat ini."}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <AnimatePresence mode="popLayout">
                                            {validStockItems.map((item: any, idx: number) => (
                                            <motion.tr
                                                key={item.id || idx}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="hover:bg-slate-50/70 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                                                    {getRowNumber(idx)}
                                                </td>

                                                {/* Baku Pembanding special columns */}
                                                {isBakuPembanding && (
                                                    <>
                                                        <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                                                            {item.kode_baru || "-"}
                                                        </td>
                                                        <td className="py-3 px-4 font-medium text-slate-900">
                                                            {item.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs text-slate-600">
                                                            {item.letak ? (
                                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                                    {item.letak}
                                                                </span>
                                                            ) : "-"}
                                                        </td>
                                                    </>
                                                )}

                                                {/* Other Categories name */}
                                                {!isBakuPembanding && (
                                                    <td className="py-3 px-4 font-medium text-slate-900">
                                                        {item.name}
                                                    </td>
                                                )}

                                                <td className="py-3 px-4 text-xs text-slate-600">
                                                    {item.satuan || "-"}
                                                </td>

                                                {/* Expired date */}
                                                {(isReagen || isBakuPembanding) && (
                                                    <td className="py-3 px-4 text-xs font-medium">
                                                        {item.expired ? (
                                                            <span className={config.isExpiring ? "text-amber-700 font-bold" : "text-slate-600"}>
                                                                {formatDate(item.expired)}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                )}

                                                {/* Stock badge */}
                                                <td className="py-3 px-4">
                                                    {renderStockBadge(item.stock)}
                                                </td>

                                                {/* Keterangan */}
                                                {!isBakuPembanding && !isReagen && (
                                                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                                                        {item.description || item.keterangan || "-"}
                                                    </td>
                                                )}

                                                {/* MSDS link */}
                                                {(isReagen || isBakuPembanding) && (
                                                    <td className="py-3 px-4 text-center">
                                                        {item.msds ? (
                                                            <a
                                                                href={item.msds}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                                title="Buka MSDS"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">link</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                )}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                );
                            })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer with Simple Pagination */}
                    {data && data.total > 0 && (
                        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                            <div>
                                Menampilkan{" "}
                                <span className="font-semibold text-slate-800">
                                    {(data.current_page - 1) * parseInt(valuePerPage) + 1}
                                </span>{" "}
                                -{" "}
                                <span className="font-semibold text-slate-800">
                                    {Math.min(data.current_page * parseInt(valuePerPage), data.total)}
                                </span>{" "}
                                dari <span className="font-semibold text-slate-800">{data.total}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                                >
                                    « Prev
                                </button>

                                <span className="px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-700">
                                    {data.current_page} / {data.last_page || 1}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(Math.min(data.last_page || 1, page + 1))}
                                    disabled={page >= (data.last_page || 1)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                                >
                                    Next »
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
