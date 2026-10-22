"use client";

import React, { useState, useEffect } from "react";
import { BatchItem, pengujianService } from "../pengujianService";

interface PengujianBatchSelectorProps {
    batches: BatchItem[];
    selectedBatchId: string | null;
    currentBatch: BatchItem | null;
    siblingSheets: BatchItem[];
    hasItems: boolean;
    searchQuery: string;
    onSelectBatch: (batchId: string) => void;
    onSearch: (q: string) => void;
    onDeleteBatch: (batchId: string) => void;
}

export default function PengujianBatchSelector({
    batches,
    selectedBatchId,
    currentBatch,
    siblingSheets,
    hasItems,
    searchQuery,
    onSelectBatch,
    onSearch,
    onDeleteBatch,
}: PengujianBatchSelectorProps) {
    const [localQuery, setLocalQuery] = useState(searchQuery);

    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(localQuery.trim());
    };

    const handleResetSearch = () => {
        setLocalQuery("");
        onSearch("");
    };

    const handleDelete = () => {
        if (!selectedBatchId) return;
        if (confirm("Hapus file / batch ini beserta seluruh datanya?")) {
            onDeleteBatch(selectedBatchId);
        }
    };

    if (batches.length === 0) return null;

    return (
        <div className="space-y-3">
            {/* Main Batch Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                {/* Batch Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Pilih File/Batch:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {batches.map((b) => {
                            const isSelected = selectedBatchId === b.batch_id;
                            return (
                                <button
                                    key={b.batch_id}
                                    type="button"
                                    onClick={() => onSelectBatch(b.batch_id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                        isSelected
                                            ? "bg-[#005baa] text-white border-[#005baa] shadow-2xs font-semibold"
                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    <span>{b.filename || b.batch_id}</span>
                                    {b.sheet_name && b.sheet_name !== "Sheet1" && (
                                        <span className="opacity-80 ml-1">[{b.sheet_name}]</span>
                                    )}
                                    <span className="ml-1 opacity-90">({b.total_items} data)</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search & Batch Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedBatchId && hasItems && (
                        <>
                            {/* Export PDF Tabular */}
                            <a
                                href={pengujianService.getBatchPdfUrl(selectedBatchId)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition shadow-2xs"
                                title="Unduh seluruh data baris dalam tab ini ke dokumen PDF (otomatis Landscape jika kolom banyak)"
                            >
                                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                <span>Export PDF Tabular</span>
                            </a>

                            {/* Delete Batch Button */}
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                                title="Hapus Batch Ini"
                            >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                <span>Hapus</span>
                            </button>
                        </>
                    )}

                    {/* Search Field */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                placeholder="Cari data/informasi..."
                                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#005baa] focus:ring-1 focus:ring-[#005baa] w-48 sm:w-60 bg-white"
                            />
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                                search
                            </span>
                        </div>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleResetSearch}
                                className="text-xs text-rose-600 hover:underline cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Sibling Sheets Sub-Bar (Multi-tab Excel) */}
            {siblingSheets.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/80 border border-blue-200 p-3 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[17px] text-[#005baa]">tab</span>
                            Tab Dalam File Ini:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {siblingSheets.map((sheet) => {
                                const isSelected = selectedBatchId === sheet.batch_id;
                                return (
                                    <button
                                        key={sheet.batch_id}
                                        type="button"
                                        onClick={() => onSelectBatch(sheet.batch_id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-[#005baa] text-white border-[#005baa] shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        <span>{sheet.sheet_name || "Tab"}</span>
                                        <span className="ml-1 opacity-90">({sheet.total_items} data)</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Button Export Merged PDF All Tabs */}
                    {currentBatch && currentBatch.file_group_id && (
                        <a
                            href={pengujianService.getFileGroupPdfUrl(currentBatch.file_group_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition shrink-0"
                            title="Unduh satu laporan PDF gabungan yang menyatukan seluruh tab dari file ini"
                        >
                            <span className="material-symbols-outlined text-[16px]">merge</span>
                            <span>Export Gabungan (Semua Tab ke 1 PDF)</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
