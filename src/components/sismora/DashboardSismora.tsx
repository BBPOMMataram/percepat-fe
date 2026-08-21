"use client";

import api from "@/utils/api";
import { useEffect, useState } from "react";
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface MutationRow {
    id: number;
    tanggal: string;
    jam: string;
    label: string;
    temperature: number | null;
    humidity: number | null;
    temp_min: number | null;
    temp_max: number | null;
    hum_min: number | null;
    hum_max: number | null;
    is_humidity: boolean;
}

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
    const [allData, setAllData] = useState<MutationRow[]>([]);
    const [tempWarnings, setTempWarnings] = useState<WarningItem[]>([]);
    const [humWarnings, setHumWarnings] = useState<WarningItem[]>([]);
    const [totalRooms, setTotalRooms] = useState(0);
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
                const chartData: MutationRow[] = [];

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

                    const row: MutationRow = {
                        id: m.id,
                        tanggal: m.tanggal,
                        jam: m.jam,
                        label: `${roomName} ${m.jam}`,
                        temperature: isNaN(temp) ? null : temp,
                        humidity: isNaN(hum) ? null : hum,
                        temp_min: isNaN(tempMin) ? null : tempMin,
                        temp_max: isNaN(tempMax) ? null : tempMax,
                        hum_min: isNaN(humMin) ? null : humMin,
                        hum_max: isNaN(humMax) ? null : humMax,
                        is_humidity: !!roomType.is_humidity,
                    };
                    chartData.push(row);

                    if (!isNaN(temp) && !isNaN(tempMin) && !isNaN(tempMax) && (temp < tempMin || temp > tempMax)) {
                        tempResult.push({
                            id: m.id, tanggal: m.tanggal, jam: m.jam,
                            value: temp, min: tempMin, max: tempMax,
                            room_name: roomName || "-", room_type_name: roomType.nama,
                        });
                    }

                    if (roomType.is_humidity && !isNaN(hum) && !isNaN(humMin) && !isNaN(humMax) && (hum < humMin || hum > humMax)) {
                        humResult.push({
                            id: m.id, tanggal: m.tanggal, jam: m.jam,
                            value: hum, min: humMin, max: humMax,
                            room_name: roomName || "-", room_type_name: roomType.nama,
                        });
                    }
                }

                setAllData(chartData);
                setTempWarnings(tempResult);
                setHumWarnings(humResult);
                setTotalRooms(rooms.length);
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-white rounded-2xl shadow px-5 py-4 flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary text-4xl">data_table</span>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Total Mutasi</p>
                        <p className="text-2xl font-bold text-gray-800">{allData.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow px-5 py-4 flex items-center gap-4">
                    <span className="material-symbols-outlined text-orange-500 text-4xl">thermostat</span>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Temp Warning</p>
                        <p className="text-2xl font-bold text-orange-600">{tempWarnings.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow px-5 py-4 flex items-center gap-4">
                    <span className="material-symbols-outlined text-blue-500 text-4xl">humidity_percentage</span>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Humidity Warning</p>
                        <p className="text-2xl font-bold text-blue-600">{humWarnings.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow px-5 py-4 flex items-center gap-4">
                    <span className="material-symbols-outlined text-purple-500 text-4xl">meeting_room</span>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Total Ruangan</p>
                        <p className="text-2xl font-bold text-gray-800">{totalRooms}</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            {allData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* Temperature Chart */}
                    <div className="bg-white rounded-2xl shadow px-6 py-5">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-orange-500 text-2xl">thermostat</span>
                            <h3 className="text-lg font-bold text-gray-800">Grafik Temperature</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={allData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="temperature" name="Suhu (°C)" fill="#f97316" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="temp_max" name="Max" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                <Line type="monotone" dataKey="temp_min" name="Min" stroke="#22c55e" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Humidity Chart */}
                    <div className="bg-white rounded-2xl shadow px-6 py-5">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-blue-500 text-2xl">humidity_percentage</span>
                            <h3 className="text-lg font-bold text-gray-800">Grafik Kelembaban</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={allData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="humidity" name="Kelembaban (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="hum_max" name="Max" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                <Line type="monotone" dataKey="hum_min" name="Min" stroke="#22c55e" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Warning Tables */}
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
