"use client";

import React, { useState, useEffect, useRef } from "react";
import { QrModalData } from "../types";

interface PengujianQrModalProps {
    data: QrModalData;
    onClose: () => void;
}

export default function PengujianQrModal({
    data,
    onClose,
}: PengujianQrModalProps) {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedInfo, setCopiedInfo] = useState(false);
    const qrImgRef = useRef<HTMLImageElement>(null);

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

    const handleCopyUrl = () => {
        if (!data.targetUrl) return;
        navigator.clipboard.writeText(data.targetUrl).then(() => {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        });
    };

    const handleCopyInfo = () => {
        if (!data.info) return;
        navigator.clipboard.writeText(data.info).then(() => {
            setCopiedInfo(true);
            setTimeout(() => setCopiedInfo(false), 2000);
        });
    };

    // Unduh QR Code dalam format PNG resolusi tinggi 800x800 dengan background putih solid (siap cetak)
    const downloadQrPng = () => {
        const sampleCode = (data.code || "QR_Code").trim();
        const cleanFilename = "QR-" + sampleCode.replace(/[^a-z0-9\.\-_]/gi, "_") + ".png";

        const qrSrc = data.qrBase64
            ? `data:image/svg+xml;base64,${data.qrBase64}`
            : data.targetUrl;

        const canvas = document.createElement("canvas");
        const size = 800;
        const padding = 40;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Background putih solid
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

            try {
                canvas.toBlob(function (blob) {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = cleanFilename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    } else {
                        const dataUrl = canvas.toDataURL("image/png");
                        const a = document.createElement("a");
                        a.href = dataUrl;
                        a.download = cleanFilename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }
                }, "image/png", 1.0);
            } catch (e) {
                const dataUrl = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = cleanFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        };
        img.src = qrSrc;
    };

    const qrImageSrc = data.qrBase64
        ? `data:image/svg+xml;base64,${data.qrBase64}`
        : data.targetUrl;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all text-slate-800">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#005baa] to-blue-700 p-5 text-white flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-base leading-tight">Pop-up QR Code Sampel</h3>
                        <p className="text-xs text-blue-100 mt-0.5">
                            Pindai QR untuk langsung membuka Laporan Dokumen PDF baris ini
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-lg font-bold cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 text-center space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-[#005baa] tracking-wide font-mono">
                            {data.code || "SMP-0001"}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                            {data.title || "Nama Sampel Pengujian"}
                        </h4>
                    </div>

                    {/* Big QR Code Container */}
                    <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-blue-200 inline-block shadow-inner">
                        <div className="w-56 h-56 mx-auto flex items-center justify-center bg-white p-2 rounded-xl shadow-xs">
                            <img
                                ref={qrImgRef}
                                src={qrImageSrc}
                                alt="QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-2">
                            Pindai dengan kamera smartphone untuk membuka Laporan PDF
                        </p>
                    </div>

                    {/* Card: Link Target Dokumen PDF */}
                    <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-left space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                                Link Target QR Code (File Export PDF):
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyUrl}
                                className="text-[11px] font-bold text-[#005baa] hover:underline cursor-pointer"
                            >
                                <span>{copiedUrl ? "Tersalin!" : "Salin Link"}</span>
                            </button>
                        </div>
                        <a
                            href={data.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-blue-700 hover:underline break-all block font-semibold bg-white p-2 rounded-lg border border-blue-100"
                        >
                            {data.targetUrl || "-"}
                        </a>
                    </div>

                    {/* Card: Rincian Data Sampel Pengujian */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Rincian Data Sampel:
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyInfo}
                                className="text-[11px] font-bold text-slate-600 hover:text-[#005baa] cursor-pointer"
                            >
                                <span>{copiedInfo ? "Tersalin!" : "Salin Rincian"}</span>
                            </button>
                        </div>
                        <div className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 break-words whitespace-pre-line select-all font-medium leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                            {data.info || "-"}
                        </div>
                    </div>

                    {/* Action Buttons in Modal */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={downloadQrPng}
                            className="inline-flex items-center justify-center py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200 cursor-pointer"
                            title="Unduh gambar QR Code berformat PNG siap cetak / print"
                        >
                            <span>Unduh QR (PNG)</span>
                        </button>

                        <a
                            href={data.pdfUrl || data.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center py-2.5 px-3 rounded-xl bg-[#005baa] hover:bg-[#004887] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        >
                            <span>Buka PDF Baris Ini</span>
                        </a>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px]">Dapat dipindai langsung dengan kamera smartphone</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
