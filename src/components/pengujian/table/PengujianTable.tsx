"use client";

import React, { useState, useMemo } from "react";
import { BatchItem, PengujianItem, pengujianService } from "../pengujianService";
import { QrModalData } from "../types";

const IGNORED_COLS = [
    "manager_administrasi",
    "nip_manager_administrasi",
    "kepala_balai",
    "nip_kepala_balai",
    "petugas_penerima",
    "nip_petugas_penerima",
    "tanggal_spu",
    "no_spu",
    "nomor spu",
    "nomor_spu",
    "_meta",
];

interface PengujianTableProps {
    items: PengujianItem[];
    headers: string[];
    currentBatch: BatchItem | null;
    loading: boolean;
    onOpenQrModal: (data: QrModalData) => void;
}

export default function PengujianTable({
    items,
    headers,
    currentBatch,
    loading,
    onOpenQrModal,
}: PengujianTableProps) {
    // Search & Pagination States
    const [tableSearch, setTableSearch] = useState("");
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Filter out internal metadata and QR columns (case-insensitive) as QR is rendered in its own dedicated column
    const displayHeaders = useMemo(
        () =>
            headers.filter((h) => {
                const hLower = h.toLowerCase().trim();
                if (hLower.includes("qr")) return false;
                if (h.startsWith("_")) return false;
                if (IGNORED_COLS.includes(hLower)) return false;
                return true;
            }),
        [headers]
    );

    // Filter items based on tableSearch
    const filteredItems = useMemo(() => {
        if (!tableSearch.trim()) return items;
        const q = tableSearch.toLowerCase().trim();
        return items.filter((item) => {
            if (item.display_title?.toLowerCase().includes(q)) return true;
            if (item.code?.toLowerCase().includes(q)) return true;
            if (item.qr_content?.toLowerCase().includes(q)) return true;
            if (item.data && typeof item.data === "object") {
                const values = Object.values(item.data);
                for (const val of values) {
                    if (val !== null && val !== undefined && String(val).toLowerCase().includes(q)) {
                        return true;
                    }
                }
            }
            return false;
        });
    }, [items, tableSearch]);

    // Pagination calculations
    const totalItems = filteredItems.length;
    const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
    const totalPages = Math.max(1, Math.ceil(totalItems / (effectivePageSize || 1)));
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (validCurrentPage - 1) * effectivePageSize;
    const endIndex = Math.min(startIndex + effectivePageSize, totalItems);

    const paginatedItems = useMemo(() => {
        if (pageSize === 0) return filteredItems;
        return filteredItems.slice(startIndex, endIndex);
    }, [filteredItems, pageSize, startIndex, endIndex]);

    const handleRowQrClick = (item: PengujianItem) => {
        const targetUrl = item.target_url || pengujianService.getScanUrl(item.qr_token);
        const pdfUrl = pengujianService.getItemPdfUrl(item.id);
        const fpdfUrl = pengujianService.getItemFpdfUrl(item.id);
        const rawInfo = item.qr_content || item.code || "-";

        onOpenQrModal({
            isOpen: true,
            qrToken: item.qr_token,
            title: item.display_title || `Sampel #${item.row_number}`,
            code: item.code || `SMP-${String(item.row_number).padStart(4, "0")}`,
            info: rawInfo,
            targetUrl,
            pdfUrl,
            fpdfUrl,
            qrBase64: item.qr_base64,
        });
    };

    const renderCellContent = (val: any) => {
        if (val === null || val === undefined || val === "") {
            return "-";
        }

        if (typeof val === "object") {
            return JSON.stringify(val);
        }

        const valStr = String(val);
        const lower = valStr.toLowerCase();

        if (lower.includes("memenuhi syarat") || lower === "ms") {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    {valStr}
                </span>
            );
        }

        if (
            lower.includes("tidak memenuhi") ||
            lower === "tms" ||
            lower.includes("tms")
        ) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                    {valStr}
                </span>
            );
        }

        return valStr;
    };

    // Generate pagination numbered buttons
    const renderPaginationButtons = () => {
        if (totalPages <= 1) return null;

        const buttons = [];
        let startPage = Math.max(1, validCurrentPage - 2);
        let endPage = Math.min(totalPages, validCurrentPage + 2);

        // Previous Button
        buttons.push(
            <button
                key="prev"
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs cursor-pointer"
            >
                Sebelumnya
            </button>
        );

        // Numbered Buttons
        for (let p = startPage; p <= endPage; p++) {
            const isCurrent = p === validCurrentPage;
            buttons.push(
                <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        isCurrent
                            ? "bg-[#005baa] text-white border-[#005baa]"
                            : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                    {p}
                </button>
            );
        }

        // Next Button
        buttons.push(
            <button
                key="next"
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs cursor-pointer"
            >
                Selanjutnya
            </button>
        );

        return buttons;
    };

    return (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Table Header Controls: Search & Page Size */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>Tabel Data Sampel Pengujian</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#005baa]">
                            {items.length} Data
                        </span>
                    </h3>
                    {currentBatch && (
                        <p className="text-xs text-slate-500 mt-0.5">
                            Sumber: <strong className="text-slate-700">{currentBatch.filename || currentBatch.batch_id}</strong>
                            {currentBatch.sheet_name && currentBatch.sheet_name !== "Sheet1" && (
                                <>
                                    {" "}&bull; Tab:{" "}
                                    <span className="text-[#005baa] font-semibold">
                                        {currentBatch.sheet_name}
                                    </span>
                                </>
                            )}
                        </p>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={tableSearch}
                                onChange={(e) => {
                                    setTableSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Cari data di tabel..."
                                className="w-48 sm:w-64 pl-3 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#005baa] focus:ring-1 focus:ring-[#005baa] transition bg-white"
                            />
                            {tableSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTableSearch("");
                                        setCurrentPage(1);
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* Page Size Selector */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>Tampilkan:</span>
                            <select
                                value={pageSize === 0 ? "all" : String(pageSize)}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPageSize(val === "all" ? 0 : Number(val));
                                    setCurrentPage(1);
                                }}
                                className="py-1.5 px-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#005baa] bg-white cursor-pointer"
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="all">Semua</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {items.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-sm font-semibold text-slate-700">Belum ada data pengujian yang dimuat</p>
                    <p className="text-xs text-slate-400 mt-1">Silakan unggah file Excel, CSV, atau Dokumen PDF pada formulir di atas.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                                    <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-center w-12">
                                        No
                                    </th>

                                    {/* Dynamic Headers from Excel */}
                                    {displayHeaders.map((h, i) => {
                                        if (h.includes(" - ")) {
                                            const [mainH, subH] = h.split(" - ");
                                            return (
                                                <th
                                                    key={i}
                                                    className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-800 min-w-[180px]"
                                                >
                                                    <div className="text-[10px] text-slate-400 font-semibold normal-case tracking-normal">
                                                        {mainH.replace(/_/g, " ")}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-800">
                                                        {subH.replace(/_/g, " ")}
                                                    </div>
                                                </th>
                                            );
                                        }
                                        return (
                                            <th
                                                key={i}
                                                className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-800 min-w-[180px]"
                                            >
                                                {h.replace(/_/g, " ")}
                                            </th>
                                        );
                                    })}

                                    {/* Generated QR Code Column */}
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center bg-blue-50/70 text-[#005baa] border-l border-blue-100 min-w-[120px]">
                                        QR Code Ter-generate
                                    </th>

                                    {/* Action Column (Sticky Right) */}
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center bg-slate-50 text-slate-700 border-l border-slate-200 min-w-[160px] sticky right-0 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.03)]">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {paginatedItems.map((item, index) => {
                                    const actualRowNumber = startIndex + index + 1;
                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-blue-50/20 transition-colors"
                                        >
                                            <td className="py-3 px-3.5 text-center text-slate-400 font-mono font-medium">
                                                {actualRowNumber}
                                            </td>

                                            {/* Dynamic Data Cells */}
                                            {displayHeaders.map((h, i) => (
                                                <td
                                                    key={i}
                                                    className="py-3 px-3.5 text-slate-900 font-medium max-w-sm"
                                                >
                                                    {renderCellContent(item.data?.[h])}
                                                </td>
                                            ))}

                                            {/* QR Code Column */}
                                            <td className="py-2.5 px-4 bg-blue-50/20 border-l border-blue-100 text-center">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRowQrClick(item)}
                                                        className="p-1 bg-white rounded-xl border border-slate-200 hover:border-[#005baa] hover:shadow-md transition-all shrink-0 cursor-pointer"
                                                        title="Klik untuk melihat Pop-up QR Code"
                                                    >
                                                        <div className="w-14 h-14 flex items-center justify-center p-0.5">
                                                            {item.qr_svg_small ? (
                                                                <div
                                                                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                                                    dangerouslySetInnerHTML={{ __html: item.qr_svg_small }}
                                                                />
                                                            ) : item.qr_base64 ? (
                                                                <img
                                                                    src={`data:image/svg+xml;base64,${item.qr_base64}`}
                                                                    alt="QR Code"
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            ) : item.qr_token ? (
                                                                <img
                                                                    src={pengujianService.getQrImageUrl(item.qr_token)}
                                                                    alt="QR Code"
                                                                    loading="lazy"
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            ) : (
                                                                <span className="text-slate-400 text-xs font-mono">QR</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Action Column (Sticky Right) */}
                                            <td className="py-2.5 px-4 bg-white border-l border-slate-200 sticky right-0 z-10 hover:bg-blue-50/30 transition-colors">
                                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRowQrClick(item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#005baa] hover:bg-[#004887] text-white shadow-2xs transition-colors cursor-pointer"
                                                        title="Buka pop-up QR Code besar"
                                                    >
                                                        <span>Pop-up QR</span>
                                                    </button>

                                                    <a
                                                        href={pengujianService.getItemPdfUrl(item.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs transition-colors"
                                                        title="Export dokumen PDF baris data ini"
                                                    >
                                                        <span>Export PDF</span>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* DATATABLE PAGINATION BAR */}
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
                        <div>
                            {totalItems === 0 ? (
                                <span>Menampilkan 0 data</span>
                            ) : (
                                <span>
                                    Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> sampai{" "}
                                    <span className="font-bold text-slate-800">{endIndex}</span> dari{" "}
                                    <span className="font-bold text-slate-800">{totalItems}</span> data
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {renderPaginationButtons()}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
