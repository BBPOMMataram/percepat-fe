"use client";

import React, { useState, useRef, useEffect } from "react";
import { pengujianService } from "../pengujianService";

interface PengujianHeaderProps {
    totalOverall: number;
    loading: boolean;
    onLoadSample: (type: "2col" | "full" | "pdf") => void;
    onClearAll: () => void;
}

export default function PengujianHeader({
    totalOverall,
    loading,
    onLoadSample,
    onClearAll,
}: PengujianHeaderProps) {
    const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setTemplateMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleReset = () => {
        if (confirm("Yakin ingin mengosongkan semua data pengujian?")) {
            onClearAll();
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Brand / Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-xs shrink-0">
                        <img
                            src="/assets/images/bpom_without_label.webp"
                            alt="Logo BBPOM"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            Laboratorium Pengujian BBPOM di Mataram
                        </h1>
                        <p className="text-xs text-slate-500">
                            Unggah Excel &bull; Otomatis Generate QR Code &bull; Pop-up Detail &bull; Export PDF Per Baris
                        </p>
                    </div>
                </div>

                {/* Header Quick Actions */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Dropdown Download Template */}
                    <div className="relative inline-block text-left" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[17px]">download</span>
                            <span>Download Template</span>
                            <span className="material-symbols-outlined text-[14px]">
                                {templateMenuOpen ? "expand_less" : "expand_more"}
                            </span>
                        </button>

                        {templateMenuOpen && (
                            <div className="absolute right-0 mt-1 w-64 rounded-xl bg-white shadow-lg border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                                <a
                                    href={pengujianService.getTemplateDownloadUrl("2col")}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setTemplateMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                                        table_rows
                                    </span>
                                    <div>
                                        <p className="font-bold">Template 2 Kolom</p>
                                        <p className="text-[10px] text-slate-500">
                                            1 Kolom Data &amp; 1 Kolom Kosong QR Code
                                        </p>
                                    </div>
                                </a>

                                <div className="border-t border-slate-100 my-1" />

                                <a
                                    href={pengujianService.getTemplateDownloadUrl("full")}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setTemplateMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-blue-600 text-[18px]">
                                        view_column
                                    </span>
                                    <div>
                                        <p className="font-bold">Template Multi-Kolom</p>
                                        <p className="text-[10px] text-slate-500">
                                            Format lengkap sampel laboratorium
                                        </p>
                                    </div>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Quick Load Sample 2-Kolom */}
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => onLoadSample("2col")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-[#005baa] border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                        title="Muat contoh format 1 kolom data & 1 kolom kosong"
                    >
                        <span className="material-symbols-outlined text-[17px]">science</span>
                        <span>Contoh 2-Kolom</span>
                    </button>

                    {/* Quick Load Sample Multi-Kolom */}
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => onLoadSample("full")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                        title="Muat data contoh laboratorium lengkap"
                    >
                        <span className="material-symbols-outlined text-[17px]">lab_research</span>
                        <span>Contoh Lengkap</span>
                    </button>

                    {/* Quick Load Sample PDF SPU */}
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => onLoadSample("pdf")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                        title="Muat contoh ekstraksi dari Dokumen PDF Surat Permintaan Uji (SPU)"
                    >
                        <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
                        <span>Contoh SPU (PDF)</span>
                    </button>

                    {/* Reset Button */}
                    {totalOverall > 0 && (
                        <>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleReset}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors cursor-pointer"
                                title="Kosongkan Semua Data"
                            >
                                <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
                                <span className="hidden md:inline">Reset</span>
                            </button>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium ml-1">
                                Total <strong>{totalOverall.toLocaleString("id-ID")}</strong> Data
                            </span>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
