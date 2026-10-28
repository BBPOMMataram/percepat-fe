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
                            Kategori Komoditi:
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory("ALL")}
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
                                onClick={() => setSelectedCategory(cat.name)}
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Pilihan Batch:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {filteredBatches.length === 0 ? (
                                <span className="text-xs text-slate-400 italic">
                                    Tidak ada file dalam kategori ini
                                </span>
                            ) : (
                                filteredBatches.map((b) => {
                                    const isSelected = selectedBatchId === b.batch_id;
                                    return (
                                        <button
                                            key={b.batch_id}
                                            type="button"
                                            onClick={() => onSelectBatch(b.batch_id)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                                isSelected
                                                    ? "bg-[#005baa] text-white border-[#005baa] shadow-2xs font-semibold"
                                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                        >
                                            <span>{b.filename || b.batch_id}</span>
                                            {b.komoditi && selectedCategory === "ALL" && (
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                                        isSelected
                                                            ? "bg-white/20 text-white"
                                                            : "bg-blue-50 text-blue-700 border border-blue-200/60"
                                                    }`}
                                                >
                                                    {b.komoditi}
                                                </span>
                                            )}
                                            {b.sheet_name && b.sheet_name !== "Sheet1" && (
                                                <span className="opacity-80">[{b.sheet_name}]</span>
                                            )}
                                            <span className="font-semibold">({b.total_items})</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                {/* Batch Export and Delete Actions */}
                <div className="flex items-center gap-2 flex-wrap">
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
