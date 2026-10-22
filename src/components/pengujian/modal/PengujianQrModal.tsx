"use client";

import React, { useState, useEffect } from "react";
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

    const qrImageSrc = data.qrBase64
        ? `data:image/svg+xml;base64,${data.qrBase64}`
        : data.targetUrl;

    const downloadFileName = `QR-${(data.code || "code").replace(/[^a-z0-9]/gi, "_")}.svg`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#005baa] via-blue-700 to-indigo-700 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-xs">
                            <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-base leading-tight">Pop-up QR Code Sampel</h3>
                            <p className="text-xs text-blue-100 mt-0.5">
                                Pindai QR untuk langsung membuka Laporan Dokumen PDF baris ini
                            </p>
                        </div>
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
                <div className="p-6 text-center space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
                    {/* Sample Code & Title */}
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-[#005baa] tracking-wide font-mono">
                            {data.code || "SMP"}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                            {data.title || "Nama Sampel Pengujian"}
                        </h4>
                    </div>

                    {/* Big QR Code Container */}
                    <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-blue-200 inline-block shadow-inner">
                        <div className="w-56 h-56 mx-auto flex items-center justify-center bg-white p-2 rounded-xl shadow-xs">
                            {data.qrBase64 ? (
                                <img
                                    src={qrImageSrc}
                                    alt="QR Code"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center">
                                    <span className="material-symbols-outlined text-5xl">qr_code_2</span>
                                    <span className="text-xs mt-1">QR Code SVG</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">
                                smartphone
                            </span>
                            <span>Pindai dengan kamera HP untuk membuka Laporan PDF</span>
                        </p>
                    </div>

                    {/* Target PDF Link Card */}
                    <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-left space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#005baa] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">link</span>
                                Link Target QR Code (File Export PDF):
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyUrl}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005baa] hover:underline cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {copiedUrl ? "check" : "content_copy"}
                                </span>
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

                    {/* Sample Details Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-emerald-600 text-[16px]">
                                    fact_check
                                </span>
                                Rincian Data Sampel:
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyInfo}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#005baa] cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {copiedInfo ? "check" : "content_copy"}
                                </span>
                                <span>{copiedInfo ? "Tersalin!" : "Salin Rincian"}</span>
                            </button>
                        </div>
                        <div className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 break-words whitespace-pre-line select-all font-medium leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                            {data.info || "-"}
                        </div>
                    </div>

                    {/* Action Buttons in Modal */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <a
                            href={qrImageSrc}
                            download={downloadFileName}
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                            <span>Unduh QR (SVG)</span>
                        </a>

                        <a
                            href={data.pdfUrl || data.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#005baa] hover:bg-[#004887] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            <span>Buka PDF Baris Ini</span>
                        </a>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px]">Dapat dipindai langsung menggunakan kamera smartphone</span>
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
