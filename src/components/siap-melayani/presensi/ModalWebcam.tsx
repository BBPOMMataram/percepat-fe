<<<<<<< HEAD
=======
"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Webcam from "react-webcam";

interface PresensiModalProps {
    show: boolean;
    onClose: () => void;
    url: string;
    title: string;
    userName: string;
    onPresensiUpdated?: () => void;
}

export default function ModalWebcamSiapMelayani({
    show,
    onClose,
    url,
    title,
    userName,
    onPresensiUpdated
}: PresensiModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const webcamRef = useRef<Webcam>(null);

    const [latitude, setLatitude] = useState<string>("");
    const [longitude, setLongitude] = useState<string>("");
    const [gpsLoading, setGpsLoading] = useState<boolean>(true);
    const [gpsError, setGpsError] = useState<string | null>(null);

    const [selfie, setSelfie] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    // Ambil daftar kamera perangkat
    useEffect(() => {
        if (!show) return;
        navigator.mediaDevices?.enumerateDevices().then((mediaDevices) => {
            const videoDevices = mediaDevices.filter((d) => d.kind === "videoinput");
            setDevices(videoDevices);

            if (videoDevices.length > 0 && !deviceId) {
                const userCamera = videoDevices.find((d) =>
                    d.label.toLowerCase().includes("front") || d.label.toLowerCase().includes("user")
                );
                setDeviceId(userCamera ? userCamera.deviceId : videoDevices[0].deviceId);
            }
        }).catch(() => {});
    }, [show, deviceId]);

    // Ambil koordinat GPS perangkat
    useEffect(() => {
        if (!show) return;
        setGpsLoading(true);
        setGpsError(null);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLatitude(pos.coords.latitude.toString());
                    setLongitude(pos.coords.longitude.toString());
                    setGpsLoading(false);
                },
                (err) => {
                    setGpsLoading(false);
                    setGpsError(err.message || "Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setGpsLoading(false);
            setGpsError("Peramban Anda tidak mendukung penentuan lokasi GPS.");
        }
    }, [show]);

    const takeSnapshot = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setSelfie(imageSrc);
        }
    };

    const resetSnapshot = () => {
        setSelfie("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selfie) {
            dispatch(showAlert({
                type: "error",
                message: "Foto Selfie Diperlukan",
                description: "Silakan ambil foto selfie wajah Anda terlebih dahulu sebelum mengirim."
            }));
            return;
        }

        if (!latitude || !longitude) {
            if (!confirm("Koordinat lokasi GPS belum terdeteksi. Apakah Anda tetap ingin melanjutkan?")) {
                return;
            }
        }

        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.append("latitude", latitude || "0");
        formData.append("longitude", longitude || "0");
        formData.append("selfie", selfie);

        try {
            const res = await api.post(url, formData);

            if (res.status === 200) {
                dispatch(showAlert({
                    type: "success",
                    message: "Presensi Berhasil!",
                    description: res.data?.message || "Data presensi Anda telah tercatat di sistem."
                }));
                onClose();
                setSelfie("");
                if (onPresensiUpdated) onPresensiUpdated();
            }
        } catch (error: any) {
            dispatch(showAlert({
                type: "error",
                message: error?.response?.data?.message || "Presensi Gagal",
                description: error?.response?.data?.message || "Terjadi kesalahan saat memproses presensi."
            }));
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    const isCheckIn = title.toLowerCase().includes("in");

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${
                    isCheckIn ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                            <span className="material-symbols-outlined !text-[22px]">
                                {isCheckIn ? 'login' : 'logout'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-base leading-tight">Presensi {title}</h3>
                            <p className="text-xs text-white/80 mt-0.5">{userName}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined !text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Status Lokasi GPS */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-500 !text-[18px]">
                                {gpsLoading ? 'progress_activity' : gpsError ? 'location_off' : 'location_on'}
                            </span>
                            <span className="text-slate-600">
                                {gpsLoading ? (
                                    <span className="animate-pulse">Mendeteksi lokasi GPS...</span>
                                ) : gpsError ? (
                                    <span className="text-amber-600 font-medium">GPS: Izin akses lokasi tidak aktif</span>
                                ) : (
                                    <span>
                                        GPS Terkunci: <span className="font-mono text-slate-800 font-semibold">{parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}</span>
                                    </span>
                                )}
                            </span>
                        </div>
                        {!gpsLoading && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                gpsError ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${gpsError ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                                {gpsError ? 'Perkiraan' : 'Akurat'}
                            </span>
                        )}
                    </div>

                    {/* Kamera Viewfinder / Preview Selfie */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-[4/3] flex items-center justify-center shadow-inner">
                        {!selfie ? (
                            <>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover"
                                    videoConstraints={
                                        deviceId
                                            ? { deviceId: { exact: deviceId } }
                                            : { facingMode: "user" }
                                    }
                                />
                                {/* Face Oval Outline Guide */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-48 h-56 border-2 border-white/40 border-dashed rounded-[50%] flex items-center justify-center">
                                        <span className="text-white/40 text-[11px] font-medium tracking-wide">Posisikan Wajah</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="relative w-full h-full">
                                <Image
                                    src={selfie}
                                    alt="Selfie Preview"
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                                <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                    <span className="material-symbols-outlined !text-[14px]">check_circle</span>
                                    <span>Foto Tersimpan</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Camera Switcher & Shutter Actions */}
                    <div className="flex flex-col gap-2">
                        {!selfie ? (
                            <div className="flex items-center gap-2">
                                {devices.length > 1 && (
                                    <select
                                        value={deviceId || ""}
                                        onChange={(e) => setDeviceId(e.target.value)}
                                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:border-bpom-blue"
                                    >
                                        {devices.map((device, index) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                Kamera {index + 1}: {device.label || `Device ${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    type="button"
                                    onClick={takeSnapshot}
                                    className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-md transition-all active:scale-[0.98] ${
                                        isCheckIn 
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' 
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                    }`}
                                >
                                    <span className="material-symbols-outlined !text-[20px]">photo_camera</span>
                                    <span>Ambil Foto Selfie</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={resetSnapshot}
                                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                            >
                                <span className="material-symbols-outlined !text-[16px]">refresh</span>
                                <span>Ambil Ulang Foto</span>
                            </button>
                        )}
                    </div>

                    {/* Keterangan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Keterangan (Opsional)
                        </label>
                        <input
                            type="text"
                            name="keterangan"
                            placeholder="Contoh: Hadir tepat waktu, Senyum :)"
                            defaultValue="Hadir tepat waktu"
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-bpom-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={!selfie || submitting}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                isCheckIn
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-bpom-blue hover:bg-bpom-blue/90'
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin !text-[18px]">progress_activity</span>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined !text-[18px]">send</span>
                                    <span>Kirim Presensi {title}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
>>>>>>> 51c15b5ae5503b85174c5e32672c39c7ee27f21f
