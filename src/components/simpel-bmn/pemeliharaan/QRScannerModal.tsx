"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import type { Result } from "@zxing/library";

interface QRScannerModalProps {
    open: boolean;
    onClose: () => void;
    onScan: (value: string) => void;
}

export default function QRScannerModal({
    open,
    onClose,
    onScan,
}: QRScannerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [reader] = useState(new BrowserMultiFormatReader());
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const controlsRef = useRef<IScannerControls | null>(null);

    const stopCamera = useCallback(() => {
        controlsRef.current?.stop();
        controlsRef.current = null;

        const stream = videoRef.current?.srcObject as MediaStream | null;
        stream?.getTracks().forEach((track) => track.stop());
    }, []);

    const handleClose = useCallback(() => {
        stopCamera();
        onClose();
    }, [stopCamera, onClose]);

    useEffect(() => {
        if (!open) return;

        (async () => {
            const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            setDevices(videoDevices);

            const backCamera = videoDevices.find((d) =>
                d.label.toLowerCase().includes("back")
            );

            const deviceId = backCamera?.deviceId ?? videoDevices[0]?.deviceId;
            setSelectedDeviceId(deviceId);

            const ctrl = await reader.decodeFromVideoDevice(
                deviceId,
                videoRef.current!,
                (result: Result | undefined) => {
                    if (result) {
                        onScan(result.getText());
                        handleClose();
                    }
                }
            );

            controlsRef.current = ctrl;
        })();

        return stopCamera;
    }, [open, reader, handleClose, onScan, stopCamera]);

    const handleChangeCamera = async (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        stopCamera();
        const ctrl = await reader.decodeFromVideoDevice(
            deviceId,
            videoRef.current!,
            (result: Result | undefined) => {
                if (result) {
                    onScan(result.getText());
                    handleClose();
                }
            }
        );
        controlsRef.current = ctrl;
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const imgUrl = URL.createObjectURL(file);

        try {
            const result = await reader.decodeFromImageUrl(imgUrl);
            onScan(result.getText());
            handleClose();
        } catch {
            alert("QR tidak terbaca dari gambar.");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-85 shadow-lg">
                <h2 className="text-lg font-semibold mb-3">Scan QR Code BMN</h2>

                {devices.length > 1 && (
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => handleChangeCamera(e.target.value)}
                        className="select select-bordered w-full mb-3"
                    >
                        {devices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                                {d.label || "Kamera"}
                            </option>
                        ))}
                    </select>
                )}

                <video ref={videoRef} className="w-full rounded-lg mb-3" />

                <label className="btn btn-outline w-full mb-3 cursor-pointer">
                    Upload Gambar QR
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>

                <button onClick={handleClose} className="btn btn-error w-full">
                    Tutup
                </button>
            </div>
        </div>
    );
}
