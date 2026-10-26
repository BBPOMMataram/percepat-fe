"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import type { Result } from "@zxing/library";
import { Camera, X, RefreshCw, AlertCircle } from "lucide-react";

interface PercepatQRScannerModalProps {
    open: boolean;
    onClose: () => void;
    onScan: (value: string) => void;
    title?: string;
}

export default function PercepatQRScannerModal({
    open,
    onClose,
    onScan,
    title = "Scan Barcode / QR Label Barang",
}: PercepatQRScannerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [reader] = useState(new BrowserMultiFormatReader());
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const hasScannedRef = useRef(false);

    const stopCamera = useCallback(() => {
        try {
            controlsRef.current?.stop();
        } catch (e) {
            // ignore
        }
        controlsRef.current = null;

        const stream = videoRef.current?.srcObject as MediaStream | null;
        if (stream) {
            stream.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch (e) {}
            });
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const handleClose = useCallback(() => {
        stopCamera();
        setErrorMsg(null);
        hasScannedRef.current = false;
        onClose();
    }, [stopCamera, onClose]);

    const startScanning = useCallback(async (deviceId?: string) => {
        if (!videoRef.current) return;
        setErrorMsg(null);
        hasScannedRef.current = false;

        try {
            stopCamera();

            const ctrl = await reader.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                (result: Result | undefined) => {
                    if (result && !hasScannedRef.current) {
                        const text = result.getText();
                        if (text && text.trim()) {
                            hasScannedRef.current = true;
                            try {
                                ctrl?.stop();
                            } catch (e) {}
                            stopCamera();
                            onScan(text.trim());
                            onClose();
                        }
                    }
                }
            );

            controlsRef.current = ctrl;
            if (hasScannedRef.current) {
                try {
                    ctrl?.stop();
                } catch (e) {}
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            setErrorMsg("Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser.");
        }
    }, [reader, onScan, onClose, stopCamera]);

    useEffect(() => {
        if (!open) {
            stopCamera();
            hasScannedRef.current = false;
            return;
        }
        hasScannedRef.current = false;

        (async () => {
            try {
                const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
                setDevices(videoDevices);

                // Prioritaskan kamera belakang jika ada (untuk HP / Tablet)
                const backCamera = videoDevices.find((d) =>
                    d.label.toLowerCase().includes("back") ||
                    d.label.toLowerCase().includes("belakang") ||
                    d.label.toLowerCase().includes("rear") ||
                    d.label.toLowerCase().includes("environment")
                );

                const deviceId = backCamera?.deviceId ?? videoDevices[0]?.deviceId;
                setSelectedDeviceId(deviceId);

                await startScanning(deviceId);
            } catch (err) {
                console.error("Error enumerating devices:", err);
                setErrorMsg("Tidak ada perangkat kamera yang terdeteksi.");
            }
        })();

        return () => {
            stopCamera();
        };
    }, [open, startScanning, stopCamera]);

    if (!open) return null;

    const handleSwitchCamera = () => {
        if (devices.length <= 1) return;
        const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        const nextDeviceId = devices[nextIndex]?.deviceId;
        setSelectedDeviceId(nextDeviceId);
        startScanning(nextDeviceId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                            <Camera size={18} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm truncate">{title}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Video Area */}
                <div className="relative bg-black aspect-4/3 max-h-[55vh] flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                    />

                    {/* Viewfinder Target Box Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-52 h-52 sm:w-60 sm:h-60 border-2 border-sky-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                            {/* Corner Accents */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-500 rounded-tl-lg" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-500 rounded-tr-lg" />
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-500 rounded-bl-lg" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-500 rounded-br-lg" />

                            {/* Red laser scanning animation line */}
                            <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Error Overlay */}
                    {errorMsg && (
                        <div className="absolute inset-0 bg-slate-900/90 text-white p-6 flex flex-col items-center justify-center text-center">
                            <AlertCircle size={36} className="text-rose-400 mb-2" />
                            <p className="text-xs text-rose-200 font-medium leading-relaxed max-w-xs">{errorMsg}</p>
                            <button
                                onClick={() => startScanning(selectedDeviceId)}
                                className="mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-3 sm:p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 text-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        Arahkan kamera ke QR / Barcode botol
                    </span>

                    {devices.length > 1 && (
                        <button
                            type="button"
                            onClick={handleSwitchCamera}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                            <RefreshCw size={13} />
                            Ganti Kamera
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
