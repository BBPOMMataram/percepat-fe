"use client";

import dayjs from "@/utils/dayjs";
import Image from "next/image";

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
    baseUrl?: string; // opsional, kalau kamu mau gabungkan path selfie
}

export default function PresensiTableSiapMelayani({ data, baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI }: TablePresensiProps) {
    return (
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
            <table className="table table-zebra">
                <thead className="bg-primary text-primary-content uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Mode</th>
                        <th className="px-4 py-3 text-left">Selfie</th>
                        <th className="px-4 py-3 text-left">Keterangan</th>
                        <th className="px-4 py-3 text-center">Koordinat</th>
                        <th className="px-4 py-3 text-center">Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-6 text-gray-500">
                                Tidak ada data presensi.
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => (
                            <tr
                                key={item.id}
                                className={`border-t ${item.mode === "check-in" ? "bg-green-50" : "bg-red-50"
                                    } hover:bg-gray-300 transition`}
                            >
                                <td className="px-4 py-3 font-medium">{index + 1}</td>
                                <td className="px-4 py-3 font-semibold capitalize">
                                    {item.mode === "check-in" ? "CI" : "CO"}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="w-16 h-16 relative">
                                        <Image
                                            src={item.selfie}
                                            alt="Selfie"
                                            fill
                                            className="object-cover rounded-md border"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3">{item.keterangan}</td>
                                <td className="px-4 py-3 text-xs text-center">
                                    <a
                                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        <span className="material-symbols-outlined">
                                            location_on
                                        </span>
                                    </a>
                                    <div className="text-gray-500 text-[11px] mt-1">
                                        Lat: {item.latitude} <br /> Lng: {item.longitude}
                                    </div>
                                </td>

                                <td className="px-4 py-3 text-sm text-center">
                                    {dayjs(item.created_at).format("DD MMM YYYY")}
                                    <br />
                                    {dayjs(item.created_at).format("HH:mm:ss")}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
