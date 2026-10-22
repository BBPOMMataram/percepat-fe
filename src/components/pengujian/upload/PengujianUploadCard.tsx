"use client";

import React, { useState, useRef } from "react";

interface PengujianUploadCardProps {
    loading: boolean;
    onUpload: (file: File) => void;
}

export default function PengujianUploadCard({
    loading,
    onUpload,
}: PengujianUploadCardProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave" || e.type === "drop") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const ext = file.name.split(".").pop()?.toLowerCase();
            if (ext && ["xlsx", "xls", "csv", "pdf"].includes(ext)) {
                setSelectedFile(file);
            } else {
                alert("Format file tidak didukung. Harap unggah file .xlsx, .xls, .csv, atau .pdf.");
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            alert("Silakan pilih file Excel, CSV, atau PDF terlebih dahulu.");
            return;
        }
        onUpload(selectedFile);
    };

    const handleClearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
            <div className="border-b border-slate-100 pb-3.5 mb-4">
                <h2 className="text-base font-bold text-slate-900">
                    Unggah Dokumen Pengujian (Excel / CSV / PDF)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Mendukung file Excel (.xlsx, .xls), CSV, atau PDF Surat Permintaan Uji (SPU). Sistem otomatis memproses data dan menghasilkan QR Code untuk verifikasi.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* HALO ANIMATED DROPZONE CONTAINER */}
                <div className="halo-container">
                    {/* Rotating Glowing Conic Trail in BBPOM Colors */}
                    <div className="halo-trail"></div>
                    {/* Blurred Glowing Blobs */}
                    <div className="halo-blob-1"></div>
                    <div className="halo-blob-2"></div>

                    {/* Inner Frosted Glass Card */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`halo-inner p-6 sm:p-8 text-center transition-all ${
                            dragActive ? "dragover" : ""
                        }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx,.xls,.csv,.pdf"
                            className="hidden"
                        />

                        {/* IDLE STATE: ICONS & PROMPT */}
                        {!selectedFile ? (
                            <div className="space-y-3">
                                {/* File Type Glyphs (Excel, PDF, CSV) */}
                                <div className="flex items-center justify-center gap-3">
                                    {/* Excel Glyph */}
                                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                            <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l3 3m0-3l-3 3m5-3h4m-4 3h4"></path>
                                        </svg>
                                    </div>
                                    {/* PDF Glyph */}
                                    <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                            <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 11h6"></path>
                                        </svg>
                                    </div>
                                    {/* CSV Glyph */}
                                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#005baa] shadow-2xs">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        Pilih atau seret file ke area ini
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Format didukung: <strong>.xlsx, .xls, .csv, atau .pdf</strong> (Maksimal 25 MB)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* SELECTED STATE: FILE DETAILS & REMOVE BUTTON */
                            <div className="py-1">
                                <div className="inline-flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#005baa] flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    </div>
                                    <div className="text-left pr-2">
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearFile}
                                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition cursor-pointer"
                                        title="Batalkan pilihan file"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                        File yang diunggah akan langsung dipetakan ke tabel di bawah ini.
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#005baa] hover:bg-[#004887] text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        <span>{loading ? "Memproses..." : "Proses & Generate QR Code"}</span>
                    </button>
                </div>
            </form>
        </section>
    );
}
