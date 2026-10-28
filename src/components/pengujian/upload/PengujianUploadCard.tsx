"use client";

import React, { useState, useRef, useMemo } from "react";

interface PengujianUploadCardProps {
    loading: boolean;
    onUpload: (files: File[]) => void;
}

export default function PengujianUploadCard({
    loading,
    onUpload,
}: PengujianUploadCardProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles((prev) => {
                const combined = [...prev, ...newFiles];
                return combined.filter(
                    (file, idx, arr) =>
                        arr.findIndex(
                            (f) => f.name === file.name && f.size === file.size
                        ) === idx
                );
            });
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

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const dropped = Array.from(e.dataTransfer.files);
            const validFiles = dropped.filter((f) => {
                const ext = f.name.split(".").pop()?.toLowerCase();
                return ext && ["xlsx", "xls", "csv", "pdf"].includes(ext);
            });

            if (validFiles.length < dropped.length) {
                alert(
                    "Beberapa file diabaikan karena bukan berformat .xlsx, .xls, .csv, atau .pdf."
                );
            }

            if (validFiles.length > 0) {
                setSelectedFiles((prev) => {
                    const combined = [...prev, ...validFiles];
                    return combined.filter(
                        (file, idx, arr) =>
                            arr.findIndex(
                                (f) => f.name === file.name && f.size === file.size
                            ) === idx
                    );
                });
            }
        }
    };

    const handleRemoveFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            alert("Silakan pilih setidaknya satu file Excel, CSV, atau PDF terlebih dahulu.");
            return;
        }
        onUpload(selectedFiles);
    };

    // Calculate total size
    const totalSizeFormatted = useMemo(() => {
        const bytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }, [selectedFiles]);

    const getFileIcon = (filename: string) => {
        const ext = filename.split(".").pop()?.toLowerCase();
        if (ext === "pdf") {
            return (
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                        <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 11h6"></path>
                    </svg>
                </div>
            );
        }
        if (ext === "csv") {
            return (
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#005baa] border border-blue-200 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l3 3m0-3l-3 3m5-3h4m-4 3h4"></path>
                </svg>
            </div>
        );
    };

    return (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
            <div className="border-b border-slate-100 pb-3.5 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            Unggah Dokumen Pengujian (Excel / CSV / PDF)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Mendukung unggah satu atau <strong>beberapa file sekaligus</strong> (.xlsx, .xls, .csv, atau PDF SPU). Sistem otomatis memproses data dan menghasilkan QR Code untuk verifikasi.
                        </p>
                    </div>
                    {selectedFiles.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#005baa] border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-[#005baa] animate-pulse"></span>
                            {selectedFiles.length} file dipilih ({totalSizeFormatted})
                        </span>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* HALO ANIMATED DROPZONE CONTAINER */}
                <div className="halo-container">
                    <div className="halo-trail"></div>
                    <div className="halo-blob-1"></div>
                    <div className="halo-blob-2"></div>

                    {/* Inner Frosted Glass Card */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`halo-inner p-5 sm:p-7 text-center transition-all ${
                            dragActive ? "dragover" : ""
                        }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx,.xls,.csv,.pdf"
                            multiple
                            className="hidden"
                        />

                        {/* IDLE STATE: ICONS & PROMPT */}
                        {selectedFiles.length === 0 ? (
                            <div className="space-y-3">
                                {/* File Type Glyphs (Excel, PDF, CSV) */}
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                            <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l3 3m0-3l-3 3m5-3h4m-4 3h4"></path>
                                        </svg>
                                    </div>
                                    <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                            <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 11h6"></path>
                                        </svg>
                                    </div>
                                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#005baa] shadow-2xs">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        Pilih atau seret satu atau beberapa file ke area ini
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Bisa memilih lebih dari 1 file sekaligus &bull; Format didukung: <strong>.xlsx, .xls, .csv, .pdf</strong> (Maks 25 MB/file)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* SELECTED STATE: FILE LIST & MANAGEMENT */
                            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-1">
                                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <span>Daftar file yang akan diunggah:</span>
                                        <span className="text-[#005baa]">({selectedFiles.length} file)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs font-medium text-[#005baa] hover:underline cursor-pointer"
                                        >
                                            + Tambah File
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
                                        >
                                            Hapus Semua
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {selectedFiles.map((file, idx) => (
                                        <div
                                            key={`${file.name}-${idx}`}
                                            className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-200 transition"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {getFileIcon(file.name)}
                                                <div className="text-left truncate">
                                                    <p className="text-xs font-semibold text-slate-800 truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => handleRemoveFile(idx, e)}
                                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center text-sm font-bold transition cursor-pointer shrink-0"
                                                title="Hapus file ini"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                        {selectedFiles.length > 1
                            ? `Semua ${selectedFiles.length} file akan diproses menjadi batch terpisah yang dapat dipilih pada filter batch.`
                            : "File yang diunggah akan langsung dipetakan ke tabel di bawah ini."}
                    </div>
                    <button
                        type="submit"
                        disabled={loading || selectedFiles.length === 0}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#005baa] hover:bg-[#004887] text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        <span>
                            {loading
                                ? "Memproses..."
                                : selectedFiles.length > 1
                                ? `Unggah ${selectedFiles.length} File & Proses Data`
                                : "Proses & Generate QR Code"}
                        </span>
                    </button>
                </div>
            </form>
        </section>
    );
}
