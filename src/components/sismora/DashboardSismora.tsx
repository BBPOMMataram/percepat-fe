"use client";

import api from "@/utils/api";
import { useEffect, useState } from "react";

interface WarningItem {
    id: number;
    tanggal: string;
    jam: string;
    value: number;
    min: number;
    max: number;
    room_name: string;
    room_type_name: string;
}

export default function DashboardSismora() {
    const [tempWarnings, setTempWarnings] = useState<WarningItem[]>([]);
    const [humWarnings, setHumWarnings] = useState<WarningItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mutationsRes, roomsRes, roomTypesRes] = await Promise.all([
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations`),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms?per_page=1000`),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/room-types?per_page=1000`),
                ]);

                const mutations = Array.isArray(mutationsRes.data) ? mutationsRes.data : mutationsRes.data?.data || [];
                const rooms = Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data?.data || [];
                const roomTypes = Array.isArray(roomTypesRes.data) ? roomTypesRes.data : roomTypesRes.data?.data || [];

                const roomMap = new Map<number, any>();
                rooms.forEach((r: any) => roomMap.set(r.id, r));

                const roomTypeMap = new Map<number, any>();
                roomTypes.forEach((rt: any) => roomTypeMap.set(rt.id, rt));

                const tempResult: WarningItem[] = [];
                const humResult: WarningItem[] = [];

                for (const m of mutations) {
                    const fullRoom = roomMap.get(Number(m.room_id));
                    const roomName = m.room?.nama || fullRoom?.nama;
                    if (!fullRoom) continue;

                    const roomType = fullRoom.room_type || roomTypeMap.get(Number(fullRoom.room_type_id));
                    if (!roomType) continue;

                    const tempMin = parseFloat(roomType.temp_min);
                    const tempMax = parseFloat(roomType.temp_max);
                    const humMin = parseFloat(roomType.hum_min);
                    const humMax = parseFloat(roomType.hum_max);
                    const temp = parseFloat(m.temperature);
                    const hum = parseFloat(m.humidity);

                    if (!isNaN(temp) && !isNaN(tempMin) && !isNaN(tempMax) && (temp < tempMin || temp > tempMax)) {
                        tempResult.push({
                            id: m.id,
                            tanggal: m.tanggal,
                            jam: m.jam,
                            value: temp,
                            min: tempMin,
                            max: tempMax,
                            room_name: roomName || "-",
                            room_type_name: roomType.nama,
                        });
                    }

                    if (roomType.is_humidity && !isNaN(hum) && !isNaN(humMin) && !isNaN(humMax) && (hum < humMin || hum > humMax)) {
                        humResult.push({
                            id: m.id,
                            tanggal: m.tanggal,
                            jam: m.jam,
                            value: hum,
                            min: humMin,
                            max: humMax,
                            room_name: roomName || "-",
                            room_type_name: roomType.nama,
                        });
                    }
                }

                setTempWarnings(tempResult);
                setHumWarnings(humResult);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <>
                <div className="bg-white rounded-2xl shadow px-8 py-4 flex items-center">
                    <h2 className="text-xl font-semibold text-gray-800 uppercase">Dashboard Sismora</h2>
                </div>
                <div className="flex justify-center py-16">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 flex items-center">
                <h2 className="text-xl font-semibold text-gray-800 uppercase">Dashboard Sismora</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                {/* Temperature Warning */}
                <div className="bg-white rounded-2xl shadow px-6 py-5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-orange-500 text-3xl">thermostat</span>
                        <h3 className="text-lg font-bold text-gray-800">Temperature Warning</h3>
                        <span className={`badge badge-sm text-white ${tempWarnings.length > 0 ? "badge-warning" : "badge-success"}`}>
                            {tempWarnings.length}
                        </span>
                    </div>

                    {tempWarnings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <span className="material-symbols-outlined text-5xl mb-2">check_circle</span>
                            <p className="text-sm font-medium">Temperature dalam range normal</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="table table-zebra text-sm">
                                <thead className="bg-orange-500 text-white uppercase text-xs">
                                    <tr>
                                        <th className="px-3 py-2 text-left">#</th>
                                        <th className="px-3 py-2 text-left">Ruangan</th>
                                        <th className="px-3 py-2 text-left">Tanggal</th>
                                        <th className="px-3 py-2 text-left">Jam</th>
                                        <th className="px-3 py-2 text-left">Suhu</th>
                                        <th className="px-3 py-2 text-left">Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tempWarnings.map((item, idx) => (
                                        <tr key={item.id} className="border-t hover bg-orange-50">
                                            <td className="px-3 py-2 font-medium">{idx + 1}</td>
                                            <td className="px-3 py-2">
                                                <span className="font-semibold">{item.room_name}</span>
                                                <br />
                                                <span className="text-xs text-gray-500">{item.room_type_name}</span>
                                            </td>
                                            <td className="px-3 py-2">{item.tanggal}</td>
                                            <td className="px-3 py-2">{item.jam}</td>
                                            <td className="px-3 py-2">
                                                <span className="font-bold text-orange-600">{item.value}°C</span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-500">{item.min} ~ {item.max}°C</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Humidity Warning */}
                <div className="bg-white rounded-2xl shadow px-6 py-5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-blue-500 text-3xl">humidity_percentage</span>
                        <h3 className="text-lg font-bold text-gray-800">Humidity Warning</h3>
                        <span className={`badge badge-sm text-white ${humWarnings.length > 0 ? "badge-info" : "badge-success"}`}>
                            {humWarnings.length}
                        </span>
                    </div>

                    {humWarnings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <span className="material-symbols-outlined text-5xl mb-2">check_circle</span>
                            <p className="text-sm font-medium">Kelembaban dalam range normal</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="table table-zebra text-sm">
                                <thead className="bg-blue-500 text-white uppercase text-xs">
                                    <tr>
                                        <th className="px-3 py-2 text-left">#</th>
                                        <th className="px-3 py-2 text-left">Ruangan</th>
                                        <th className="px-3 py-2 text-left">Tanggal</th>
                                        <th className="px-3 py-2 text-left">Jam</th>
                                        <th className="px-3 py-2 text-left">Kelembaban</th>
                                        <th className="px-3 py-2 text-left">Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {humWarnings.map((item, idx) => (
                                        <tr key={item.id} className="border-t hover bg-blue-50">
                                            <td className="px-3 py-2 font-medium">{idx + 1}</td>
                                            <td className="px-3 py-2">
                                                <span className="font-semibold">{item.room_name}</span>
                                                <br />
                                                <span className="text-xs text-gray-500">{item.room_type_name}</span>
                                            </td>
                                            <td className="px-3 py-2">{item.tanggal}</td>
                                            <td className="px-3 py-2">{item.jam}</td>
                                            <td className="px-3 py-2">
                                                <span className="font-bold text-blue-600">{item.value}%</span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-500">{item.min} ~ {item.max}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
