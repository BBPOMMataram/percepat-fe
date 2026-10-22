"use client";

import React from "react";

interface PengujianHeaderProps {
    totalOverall: number;
    loading: boolean;
    onClearAll: () => void;
}

export default function PengujianHeader({
    totalOverall,
    loading,
    onClearAll,
}: PengujianHeaderProps) {
    const handleReset = () => {
        if (confirm("Kosongkan semua riwayat pengujian?")) {
            onClearAll();
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                    <img
                        src="/assets/images/bpomri_without_label.png"
                        alt="Logo BBPOM"
                        className="h-11 w-auto object-contain shrink-0"
                    />
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            Laboratorium Pengujian BBPOM di Mataram
                        </h1>
                        <p className="text-xs text-slate-500">
                            Sistem Pengolahan Dokumen &amp; Generator QR Code Laporan Pengujian
                        </p>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                    {totalOverall > 0 && (
                        <>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                                title="Kosongkan Semua Data"
                            >
                                <span>Reset Data</span>
                            </button>
                            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-medium border border-slate-200">
                                Total <strong>{totalOverall.toLocaleString("id-ID")}</strong> Sampel
                            </span>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
