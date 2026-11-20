"use client";

import React from "react";
import Link from "next/link";

interface PengujianHeaderProps {
    totalOverall: number;
    loading: boolean;
    canReset: boolean;
    onClearAll: () => void;
}

export default function PengujianHeader({
    totalOverall,
    loading,
    canReset,
    onClearAll,
}: PengujianHeaderProps) {
    const handleReset = () => {
        if (!canReset) return;
        const confirmText = window.prompt(
            "PERINGATAN: Tindakan ini akan mengosongkan SELURUH riwayat pengujian.\nKetik RESET untuk melanjutkan:"
        );
        if (confirmText && confirmText.trim().toUpperCase() === "RESET") {
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
                    <Link
                        href="/pengujian/pengendalian-mutu"
                        className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#005baa] transition hover:bg-blue-100"
                    >
                        Pengendalian Mutu
                    </Link>
                    {totalOverall > 0 && (
                        <>
                            {canReset && (
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                                    title="Kosongkan Semua Data (Khusus Superadmin)"
                                >
                                    <span>Reset Data</span>
                                </button>
                            )}
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
