"use client";

import dayjs from "@/utils/dayjs";
import Image from "next/image";
import { useState } from "react";

interface Presensi {
    id: number;
    peserta_id: number;
    type: string;
    mode: string;
    selfie: string;
    keterangan: string;
    latitude: string;
    longitude: string;
    distance: number | null;
    created_at: string;
    updated_at: string;
}

interface TablePresensiProps {
    data: Presensi[];
    baseUrl?: string;
}

export default function PresensiTableSiapMelayani({
    data,
    baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI || ""
}: TablePresensiProps) {
    const [selectedSelfie, setSelectedSelfie] = useState<{ url: string; mode: string; date: string } | null>(null);

    const getSelfieUrl = (path: string) => {
        if (!path) return "/assets/images/noimage.svg";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs max-w-4xl mx-auto my-6 space-y-4">
            {/* Table Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <span className="material-symbols-outlined text-bpom-blue !text-[20px]">calendar_month</span>
                        <span>Riwayat Presensi</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Log lengkap presensi masuk dan pulang selama masa PKL
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                        Total {data.length} Catatan
                    </span>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
                <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/70 uppercase tracking-wider text-[11px]">
                        <tr>
                            <th className="px-4 py-3.5 text-center w-12">#</th>
                            <th className="px-4 py-3.5">Tipe Presensi</th>
                            <th className="px-4 py-3.5">Foto Selfie</th>
                            <th className="px-4 py-3.5">Keterangan</th>
                            <th className="px-4 py-3.5 text-center">Lokasi (GPS)</th>
                            <th className="px-4 py-3.5 text-center">Waktu Presensi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                                        <span className="material-symbols-outlined !text-[26px]">event_busy</span>
                                    </div>
                                    <p className="font-medium text-slate-600 text-sm">Belum Ada Riwayat Presensi</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Catatan kehadiran Anda akan otomatis tampil di sini setelah melakukan check in.</p>
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => {
                                const isCheckIn = item.mode === "check-in";
                                const selfieUrl = getSelfieUrl(item.selfie);

                                return (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/70 transition-colors"
                                    >
                                        <td className="px-4 py-3.5 text-center font-medium text-slate-400">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-[11px] ${
                                                isCheckIn
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                                            }`}>
                                                <span className="material-symbols-outlined !text-[14px]">
                                                    {isCheckIn ? 'login' : 'logout'}
                                                </span>
                                                <span>{isCheckIn ? 'Check In (Masuk)' : 'Check Out (Pulang)'}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSelfie({
                                                    url: selfieUrl,
                                                    mode: item.mode,
                                                    date: dayjs(item.created_at).format("DD MMMM YYYY, HH:mm:ss")
                                                })}
                                                className="group relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:border-bpom-blue transition-all cursor-pointer block"
                                            >
                                                <Image
                                                    src={selfieUrl}
                                                    alt="Selfie Presensi"
                                                    fill
                                                    unoptimized
                                                    className="object-cover group-hover:scale-110 transition-transform duration-200"
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                    <span className="material-symbols-outlined !text-[16px]">zoom_in</span>
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5 max-w-[200px]">
                                            <span className="text-slate-700 font-medium block truncate" title={item.keterangan || "-"}>
                                                {item.keterangan || "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {item.latitude && item.longitude && item.latitude !== "0" ? (
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <a
                                                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-bpom-blue font-semibold text-[11px] transition-colors"
                                                        title="Buka lokasi di Google Maps"
                                                    >
                                                        <span className="material-symbols-outlined !text-[14px]">location_on</span>
                                                        <span>Buka Maps</span>
                                                    </a>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {parseFloat(item.latitude).toFixed(3)}, {parseFloat(item.longitude).toFixed(3)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="font-medium text-slate-800">
                                                {dayjs(item.created_at).format("DD MMM YYYY")}
                                            </div>
                                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                                {dayjs(item.created_at).format("HH:mm:ss")} WITA
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Selfie Preview Modal */}
            {selectedSelfie && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedSelfie(null)}
                >
                    <div
                        className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm capitalize">
                                    Foto {selectedSelfie.mode}
                                </h4>
                                <p className="text-[11px] text-slate-500">{selectedSelfie.date}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSelfie(null)}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <span className="material-symbols-outlined !text-[16px]">close</span>
                            </button>
                        </div>
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                            <Image
                                src={selectedSelfie.url}
                                alt="Selfie Fullsize"
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
