"use client";

import React, { useState, useEffect, useRef } from "react";
import { PhotoModalData } from "../types";
import { PENGUJIAN_BASE_URL } from "../pengujianService";

interface PengujianPhotoModalProps {
    data: PhotoModalData;
    onClose: () => void;
}

interface PhotoItem {
    file: File;
    previewUrl: string;
    caption: string;
}

const DEFAULT_CAPTIONS = [
    "Dokumentasi Tampak Depan Sampel",
    "Dokumentasi Label & No. Batch",
    "Dokumentasi Bentuk Sediaan",
    "Dokumentasi Hasil Pengujian / Reaksi",
];

export default function PengujianPhotoModal({
    data,
    onClose,
}: PengujianPhotoModalProps) {
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Reset when modal opens or closes
    useEffect(() => {
        if (!data.isOpen) {
            setPhotos([]);
            setOrientation("landscape");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [data.isOpen]);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && data.isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [data.isOpen, onClose]);

    if (!data.isOpen) return null;

    const processFiles = (fileList: FileList | File[]) => {
        const validFiles = Array.from(fileList)
            .filter((f) => f.type.startsWith("image/"))
            .slice(0, 4);

        if (validFiles.length === 0) return;

        const newItems: PhotoItem[] = [];
        let loadedCount = 0;

        validFiles.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newItems.push({
                    file,
                    previewUrl: (e.target?.result as string) || "",
                    caption: DEFAULT_CAPTIONS[idx] || `Dokumentasi Foto ${idx + 1}`,
                });
                loadedCount++;
                if (loadedCount === validFiles.length) {
                    setPhotos(newItems);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
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
            processFiles(e.dataTransfer.files);
        }
    };

    const handleCaptionChange = (index: number, newCaption: string) => {
        setPhotos((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, caption: newCaption } : item))
        );
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        if (photos.length === 0) {
            e.preventDefault();
            alert("Silakan pilih minimal 1 foto dokumentasi terlebih dahulu.");
            return;
        }
        // Native form submission will POST to the target in a new window/tab
    };

    const actionUrl = `${PENGUJIAN_BASE_URL}/item/${data.itemId}/pdf`;

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Export Laporan + Lampiran Foto
                            </h3>
                            <p className="text-xs text-slate-500 font-mono">
                                {data.code} &bull; {data.title}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {/* Form */}
                <form
                    ref={formRef}
                    action={actionUrl}
                    method="POST"
                    encType="multipart/form-data"
                    target="_blank"
                    onSubmit={handleFormSubmit}
                    className="p-6 space-y-4"
                >
                    {/* File Upload / Drag Zone */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Pilih File Foto Lampiran (1 s.d. 4 Foto)
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-xl p-5 text-center cursor-pointer transition ${
                                dragActive ? "border-emerald-600 bg-emerald-50/50" : ""
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="photos[]"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-emerald-600">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800">
                                Klik atau seret file foto ke sini
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Format: JPG, PNG, WEBP. Ukuran gambar otomatis diselaraskan proporsional agar kertas terisi rapi &amp; eye comforting.
                            </p>
                        </div>
                    </div>

                    {/* Live Preview List */}
                    {photos.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                                Preview &amp; Keterangan Foto ({photos.length} Foto):
                            </label>
                            <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                {photos.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col gap-1.5"
                                    >
                                        <div className="h-24 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                                            <img
                                                src={item.previewUrl}
                                                alt={`Preview Foto ${idx + 1}`}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            name="captions[]"
                                            value={item.caption}
                                            onChange={(e) => handleCaptionChange(idx, e.target.value)}
                                            placeholder={`Keterangan Foto ${idx + 1}`}
                                            className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Orientation Option */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <label className="font-bold text-slate-700">Orientasi Kertas:</label>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="orientation"
                                    value="landscape"
                                    checked={orientation === "landscape"}
                                    onChange={() => setOrientation("landscape")}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-semibold text-slate-700">
                                    Landscape (Standar SPU)
                                </span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="orientation"
                                    value="portrait"
                                    checked={orientation === "portrait"}
                                    onChange={() => setOrientation("portrait")}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-semibold text-slate-700">Portrait</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Footer */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>Download PDF Berlampiran Foto</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
