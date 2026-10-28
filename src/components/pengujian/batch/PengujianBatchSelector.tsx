"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BatchItem, pengujianService } from "../pengujianService";

interface PengujianBatchSelectorProps {
    batches: BatchItem[];
    selectedBatchId: string | null;
    currentBatch: BatchItem | null;
    siblingSheets: BatchItem[];
    hasItems: boolean;
    onSelectBatch: (batchId: string) => void;
    onDeleteBatch: (batchId: string) => void;
}

export default function PengujianBatchSelector({
    batches,
    selectedBatchId,
    currentBatch,
    siblingSheets,
    hasItems,
    onSelectBatch,
    onDeleteBatch,
}: PengujianBatchSelectorProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    // Ekstraksi daftar komoditi unik dari batches
    const categories = useMemo(() => {
        const map = new Map<string, number>();
        batches.forEach((b) => {
            const cat = b.komoditi || "Lainnya";
            map.set(cat, (map.get(cat) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, count]) => ({
            name,
            count,
        }));
    }, [batches]);

    // Sinkronisasi kategori aktif jika daftar batch berubah
    useEffect(() => {
        if (selectedCategory !== "ALL" && !categories.some((c) => c.name === selectedCategory)) {
            setSelectedCategory("ALL");
        }
    }, [categories, selectedCategory]);

    const filteredBatches = useMemo(() => {
        if (selectedCategory === "ALL") return batches;
        return batches.filter((b) => (b.komoditi || "Lainnya") === selectedCategory);
    }, [batches, selectedCategory]);

    const handleCategoryClick = (catName: string) => {
        setSelectedCategory(catName);
        const matches = catName === "ALL" ? batches : batches.filter((b) => (b.komoditi || "Lainnya") === catName);
        if (matches.length > 0 && (!selectedBatchId || !matches.some((b) => b.batch_id === selectedBatchId))) {
            onSelectBatch(matches[0].batch_id);
        }
    };

    if (batches.length === 0) return null;

    const handleDelete = () => {
        if (!selectedBatchId) return;
        if (confirm("Hapus batch ini?")) {
            onDeleteBatch(selectedBatchId);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                {/* BARIS KATEGORI KOMODITI */}
                {categories.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pb-2.5 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                            Kategori:
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCategoryClick("ALL")}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                selectedCategory === "ALL"
                                    ? "bg-[#005baa] text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Semua ({batches.length})
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                type="button"
                                onClick={() => handleCategoryClick(cat.name)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    selectedCategory === cat.name
                                        ? "bg-[#005baa] text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {cat.name} ({cat.count})
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
                        <label htmlFor="batch-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                            Pilihan Batch:
                        </label>
                        {filteredBatches.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">
                                Tidak ada file dalam kategori ini
                            </span>
                        ) : (
                            <div className="relative flex-1 max-w-md sm:max-w-lg">
                                <select
                                    id="batch-select"
                                    value={selectedBatchId || (filteredBatches[0]?.batch_id ?? "")}
                                    onChange={(e) => onSelectBatch(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-2xs focus:outline-none focus:border-[#005baa] focus:ring-1 focus:ring-[#005baa] transition cursor-pointer truncate"
                                >
                                    {filteredBatches.map((b) => {
                                        const sheetLabel = b.sheet_name && b.sheet_name !== "Sheet1" ? ` [${b.sheet_name}]` : "";
                                        const komoditiLabel = b.komoditi ? ` • ${b.komoditi}` : "";
                                        const itemsLabel = ` (${b.total_items} data)`;
                                        return (
                                            <option key={b.batch_id} value={b.batch_id}>
                                                {(b.filename || b.batch_id) + sheetLabel + komoditiLabel + itemsLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Batch Export and Delete Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {selectedBatchId && hasItems && (
                            <>
                                <a
                                    href={pengujianService.getBatchPdfUrl(selectedBatchId)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition shadow-2xs"
                                    title="Unduh seluruh data dalam format Surat Permintaan Uji PDF"
                                >
                                    <span>Export PDF Tabular</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                                >
                                    <span>Hapus</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* SUB-BAR JIKA FILE MEMILIKI BEBERAPA TAB / SHEETS */}
            {siblingSheets && siblingSheets.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/80 border border-blue-200 p-3 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-900">
                            Tab File Ini:
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
                                                ? "bg-[#005baa] text-white border-[#005baa]"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {sheet.sheet_name || "Tab"} ({sheet.total_items})
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {currentBatch && currentBatch.file_group_id && (
                        <a
                            href={pengujianService.getFileGroupMergedPdfUrl(currentBatch.file_group_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#005baa] hover:bg-[#004887] text-white shadow-xs transition shrink-0"
                        >
                            <span>Export Gabungan (Semua Tab ke 1 PDF)</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
