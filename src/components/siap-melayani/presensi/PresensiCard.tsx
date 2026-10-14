"use client";

import { useEffect, useState } from "react";
import ModalWebcamSiapMelayani from "./ModalWebcam";
import dayjs from "@/utils/dayjs";

interface PresensiCardProps {
    checkInTime?: string | null;
    checkOutTime?: string | null;
    userName: string;
    onPresensiUpdated?: () => void;
}

export default function PresensiCardSiapMelayani({
    checkInTime,
    checkOutTime,
    userName,
    onPresensiUpdated
}: PresensiCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState<string>("");
    const [url, setUrl] = useState<string>("");

    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");

    // Jam Real-time
    useEffect(() => {
        const updateClock = () => {
            const now = dayjs();
            setCurrentTime(now.format("HH:mm:ss"));
            setCurrentDate(now.format("dddd, DD MMMM YYYY"));
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const openModal = (type: "in" | "out") => {
        if (type === "in") {
            setUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/check-in`);
            setTitle("Check In");
        } else {
            setUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/check-out`);
            setTitle("Check Out");
        }
        setShowModal(true);
    };

    const hasCheckedIn = Boolean(checkInTime);
    const hasCheckedOut = Boolean(checkOutTime);

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs max-w-4xl mx-auto my-6 space-y-6">
            {/* Header / Jam Real-time */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-bpom-blue bg-blue-50 px-3 py-1 rounded-full">
                        Presensi Harian
                    </span>
                    <h2 className="text-xl font-bold font-serif text-slate-800 mt-2">
                        Pencatatan Kehadiran Mahasiswa
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Halo, <span className="font-semibold text-slate-700">{userName}</span>. Silakan lakukan pencatatan kehadiran sesuai jam operasional.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl px-5 py-3 shadow-md text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                    <span className="text-xs text-slate-300 font-medium">{currentDate || "Memuat tanggal..."}</span>
                    <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-emerald-400">
                        {currentTime || "--:--:--"}
                    </span>
                </div>
            </div>

            {/* Dua Kartu Presensi: Check-In & Check-Out */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Check In Card */}
                <div className={`p-6 rounded-2xl border transition-all ${
                    hasCheckedIn
                        ? 'bg-emerald-50/60 border-emerald-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                            <span className="material-symbols-outlined !text-[26px]">login</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            hasCheckedIn
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                            {hasCheckedIn ? '✓ Sudah Check In' : 'Belum Check In'}
                        </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800">Presensi Masuk (Check In)</h3>
                    <p className="text-xs text-slate-500 mt-1">Pencatatan kehadiran saat memulai kegiatan PKL harian.</p>

                    <div className="mt-5 p-4 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Waktu Tercatat</span>
                        <span className={`text-base font-mono font-bold ${hasCheckedIn ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {checkInTime ? `${checkInTime} WITA` : '--:--:--'}
                        </span>
                    </div>

                    <div className="mt-5">
                        {hasCheckedIn ? (
                            <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined !text-[18px]">verified</span>
                                <span>Check In Selesai Hari Ini</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => openModal("in")}
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined !text-[20px]">photo_camera</span>
                                <span>Ambil Presensi Check In</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Check Out Card */}
                <div className={`p-6 rounded-2xl border transition-all ${
                    hasCheckedOut
                        ? 'bg-blue-50/60 border-blue-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-bpom-blue flex items-center justify-center shadow-xs">
                            <span className="material-symbols-outlined !text-[26px]">logout</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            hasCheckedOut
                                ? 'bg-bpom-blue text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                            {hasCheckedOut ? '✓ Sudah Check Out' : 'Belum Check Out'}
                        </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800">Presensi Pulang (Check Out)</h3>
                    <p className="text-xs text-slate-500 mt-1">Pencatatan kepulangan setelah menyelesaikan jam kegiatan PKL.</p>

                    <div className="mt-5 p-4 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Waktu Tercatat</span>
                        <span className={`text-base font-mono font-bold ${hasCheckedOut ? 'text-bpom-blue' : 'text-slate-400'}`}>
                            {checkOutTime ? `${checkOutTime} WITA` : '--:--:--'}
                        </span>
                    </div>

                    <div className="mt-5">
                        {hasCheckedOut ? (
                            <div className="w-full py-2.5 px-4 rounded-xl bg-blue-100/80 text-bpom-blue text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined !text-[18px]">verified</span>
                                <span>Check Out Selesai Hari Ini</span>
                            </div>
                        ) : !hasCheckedIn ? (
                            <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                                <span className="material-symbols-outlined !text-[18px]">lock</span>
                                <span>Lakukan Check In Terlebih Dahulu</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => openModal("out")}
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined !text-[20px]">photo_camera</span>
                                <span>Ambil Presensi Check Out</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Petunjuk Presensi */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
                <span className="material-symbols-outlined text-bpom-blue !text-[20px] shrink-0 mt-0.5">info</span>
                <div>
                    <span className="font-semibold text-slate-700">Ketentuan Presensi:</span> Presensi dilakukan secara mandiri menggunakan kamera perangkat dan sensor GPS. Pastikan izin kamera serta akses lokasi selalu diaktifkan pada browser Anda.
                </div>
            </div>

            {/* Webcam Modal */}
            <ModalWebcamSiapMelayani
                show={showModal}
                onClose={() => setShowModal(false)}
                url={url}
                title={title}
                userName={userName}
                onPresensiUpdated={onPresensiUpdated}
            />
        </div>
    );
}
