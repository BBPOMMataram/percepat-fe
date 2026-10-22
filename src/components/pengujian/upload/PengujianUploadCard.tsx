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
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 sm:p-7">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#005baa]">upload_file</span>
                            Unggah Dokumen Data Pengujian (Excel / CSV / PDF)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Unggah file <strong>Excel (.xlsx, .xls)</strong>, <strong>CSV</strong>, atau dokumen{" "}
                            <strong>PDF (Surat Permintaan Uji / SPU)</strong>. Sistem otomatis mengekstrak seluruh data sampel ke dalam tabel dan menghasilkan <strong>QR Code tepat di kolom sampingnya</strong>.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
                        <span className="material-symbols-outlined text-[#005baa] text-[18px]">info</span>
                        <span>Mendukung: <strong>.xlsx, .xls, .csv, .pdf</strong></span>
                    </div>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="mt-5">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer group ${
                            dragActive
                                ? "border-[#005baa] bg-blue-50/40"
                                : "border-slate-300 hover:border-[#005baa] bg-slate-50/50 hover:bg-blue-50/20"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv,.pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100/70 text-[#005baa] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                        </div>

                        {!selectedFile ? (
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-700">
                                    Klik untuk memilih file Excel, CSV, atau Dokumen PDF atau seret &amp; letakkan ke sini
                                </p>
                                <p className="text-xs text-slate-400">
                                    Mendukung Excel (1 kolom data &amp; 1 kolom kosong / multi-kolom) serta Dokumen PDF resmi BBPOM (Surat Permintaan Uji / SPU)
                                </p>
                            </div>
                        ) : (
                            <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 text-[#005baa] font-semibold text-xs sm:text-sm border border-blue-200 shadow-2xs">
                                <span className="material-symbols-outlined text-base">description</span>
                                <span>
                                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </span>
                                <button
                                    type="button"
                                    onClick={handleClearFile}
                                    className="ml-1 w-5 h-5 rounded-full hover:bg-blue-200 flex items-center justify-center text-slate-600 hover:text-rose-600 transition"
                                    title="Batalkan pilihan file"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                            <span>QR Code otomatis berisikan informasi teks kolom sebelahnya &amp; dapat diekspor ke PDF per baris.</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedFile}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#005baa] hover:bg-[#004887] active:scale-98 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[19px]">qr_code_scanner</span>
                                    <span>Proses &amp; Generate QR Code</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
