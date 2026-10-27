"use client";

import api from "@/utils/api";
import { useEffect, useState } from "react";
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import ExportPdfF63Modal from "./export/ExportPdfF63Modal";

interface MutationRow {
    id: number;
    tanggal: string;
    jam: string;
    room_name: string;
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

const getCurrentMonth = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

const getMonthDateRange = (monthStr: string) => {
    if (!monthStr || !monthStr.includes("-")) return null;
    const [yStr, mStr] = monthStr.split("-");
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const startDate = `${yStr}-${mStr.padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yStr}-${mStr.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { startDate, endDate };
};

// Custom Tooltip for Temperature with Tanggal, Ruangan, Jam, Suhu, Max, Min
const CustomTooltipTemperature = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as MutationRow;
        const temp = data.temperature;
        const isOutOfRange = (data.temp_min != null && temp != null && temp < data.temp_min) ||
                             (data.temp_max != null && temp != null && temp > data.temp_max);

        return (
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-2xl border border-gray-100 text-xs space-y-1.5 min-w-[210px]">
                <div className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate max-w-[150px]">{data.room_name}</span>
                    {isOutOfRange && (
                        <span className="badge badge-error badge-xs text-white uppercase font-bold text-[9px] px-1.5 py-0.5">
                            Di Luar Batas
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center text-gray-600">
                    <span className="text-gray-400">Tanggal:</span>
                    <span className="font-semibold text-gray-800">{data.tanggal || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                    <span className="text-gray-400">Jam:</span>
                    <span className="font-semibold text-gray-800">{data.jam ? `${data.jam} WITA` : "-"}</span>
                </div>
                <div className="flex justify-between items-center text-orange-600 font-bold text-sm pt-1 border-t border-gray-100">
                    <span>Suhu (°C):</span>
                    <span className="text-base">{temp != null ? `${temp}°C` : "-"}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span className="text-gray-400">Rentang Standar:</span>
                    <span className="font-medium text-gray-700">
                        {data.temp_min ?? "-"} ~ {data.temp_max ?? "-"} °C
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Humidity with Tanggal, Ruangan, Jam, Kelembaban, Max, Min
const CustomTooltipHumidity = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as MutationRow;
        const hum = data.humidity;
        const isOutOfRange = data.is_humidity &&
                             ((data.hum_min != null && hum != null && hum < data.hum_min) ||
                              (data.hum_max != null && hum != null && hum > data.hum_max));

        return (
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-2xl border border-gray-100 text-xs space-y-1.5 min-w-[210px]">
                <div className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate max-w-[150px]">{data.room_name}</span>
                    {isOutOfRange && (
                        <span className="badge badge-info badge-xs text-white uppercase font-bold text-[9px] px-1.5 py-0.5">
                            Di Luar Batas
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center text-gray-600">
                    <span className="text-gray-400">Tanggal:</span>
                    <span className="font-semibold text-gray-800">{data.tanggal || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                    <span className="text-gray-400">Jam:</span>
                    <span className="font-semibold text-gray-800">{data.jam ? `${data.jam} WITA` : "-"}</span>
                </div>
                <div className="flex justify-between items-center text-blue-600 font-bold text-sm pt-1 border-t border-gray-100">
                    <span>Kelembaban (%):</span>
                    <span className="text-base">{hum != null ? `${hum}%` : "-"}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span className="text-gray-400">Rentang Standar:</span>
                    <span className="font-medium text-gray-700">
                        {data.hum_min ?? "-"} ~ {data.hum_max ?? "-"} %
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function DashboardSismora() {
    const [allData, setAllData] = useState<MutationRow[]>([]);
    const [tempWarnings, setTempWarnings] = useState<WarningItem[]>([]);
    const [humWarnings, setHumWarnings] = useState<WarningItem[]>([]);
    const [totalRooms, setTotalRooms] = useState(0);
    const [roomsList, setRoomsList] = useState<any[]>([]);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
    const [initialLoading, setInitialLoading] = useState(true);
    const [exportModalOpen, setExportModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams();
                params.append("per_page", "1000");
                if (selectedRoom) params.append("room_id", selectedRoom);
                if (selectedMonth) {
                    params.append("month", selectedMonth);
                    const range = getMonthDateRange(selectedMonth);
                    if (range) {
                        params.append("start_date", range.startDate);
                        params.append("end_date", range.endDate);
                    }
                }

                const [mutationsRes, roomsRes, roomTypesRes] = await Promise.all([
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations?${params.toString()}`),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms?per_page=1000`),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/room-types?per_page=1000`),
                ]);

                const rawMutations = Array.isArray(mutationsRes.data) ? mutationsRes.data : mutationsRes.data?.data || [];
                // Proteksi ganda di frontend jika respon backend masih mengembalikan record di luar bulan yang dipilih
                const mutations = selectedMonth
                    ? rawMutations.filter((m: any) => !m.tanggal || m.tanggal.startsWith(selectedMonth))
                    : rawMutations;

                const rooms = Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data?.data || [];
                const roomTypes = Array.isArray(roomTypesRes.data) ? roomTypesRes.data : roomTypesRes.data?.data || [];

                setRoomsList(rooms);

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
                        room_name: roomName || "-",
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
                setTotalRooms(selectedRoom ? 1 : rooms.length);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [selectedRoom, selectedMonth]);

    if (initialLoading) {
        return (
            <>
                <div className="bg-white rounded-2xl shadow px-4 sm:px-8 py-3 sm:py-4 flex items-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 uppercase">Dashboard Sismora</h2>
                </div>
                <div className="flex justify-center py-16">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </>
        );
    }

    const isFilteredFromDefault = selectedRoom !== "" || selectedMonth !== getCurrentMonth();

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 uppercase">Dashboard Sismora</h2>
                
                {/* Filter Ruangan, Bulan, dan Tombol Ekspor PDF */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="select select-bordered select-sm flex-1 sm:flex-initial sm:w-52"
                    >
                        <option value="">Semua Ruangan</option>
                        {roomsList.map((room) => (
                            <option key={room.id} value={room.id}>
                                {room.nama} {room.room_type?.nama ? `(${room.room_type.nama})` : ""}
                            </option>
                        ))}
                    </select>

                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="input input-bordered select-sm flex-1 sm:flex-initial sm:w-44"
                        title="Filter Bulan"
                    />

                    {isFilteredFromDefault && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedRoom("");
                                setSelectedMonth(getCurrentMonth());
                            }}
                            className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-800"
                            title="Reset ke Bulan Saat Ini"
                        >
                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                            Reset
                        </button>
                    )}

                    {/* Tombol Ekspor PDF (F-6.3) */}
                    <button
                        type="button"
                        onClick={() => setExportModalOpen(true)}
                        className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm text-white"
                        title="Ekspor Form Pemantauan Suhu & Kelembaban (F-6.3)"
                    >
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        <span className="font-medium">Ekspor PDF (F-6.3)</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                <div className="bg-white rounded-2xl shadow p-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4">
                    <span className="material-symbols-outlined text-primary text-3xl sm:text-4xl">data_table</span>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Total Mutasi</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800">{allData.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4">
                    <span className="material-symbols-outlined text-orange-500 text-3xl sm:text-4xl">thermostat</span>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Temp Warning</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">{tempWarnings.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4">
                    <span className="material-symbols-outlined text-blue-500 text-3xl sm:text-4xl">humidity_percentage</span>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Humidity Warning</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{humWarnings.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4">
                    <span className="material-symbols-outlined text-purple-500 text-3xl sm:text-4xl">meeting_room</span>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Total Ruangan</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800">{totalRooms}</p>
                    </div>
                </div>
            </div>

            {/* Charts - Line Charts with Min/Max Threshold & Detailed Tooltip */}
            {allData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* Temperature Chart */}
                    <div className="bg-white rounded-2xl shadow p-4 sm:px-6 sm:py-5">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4">
                            <span className="material-symbols-outlined text-orange-500 text-xl sm:text-2xl">thermostat</span>
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">Grafik Temperature</h3>
                        </div>
                        <div className="w-full h-[260px] sm:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={allData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltipTemperature />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="temperature"
                                        name="Suhu (°C)"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#f97316", stroke: "#ffffff", strokeWidth: 1.5 }}
                                        activeDot={{ r: 7, fill: "#ea580c", stroke: "#ffffff", strokeWidth: 2 }}
                                        connectNulls
                                    />
                                    <Line type="monotone" dataKey="temp_max" name="Max" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                    <Line type="monotone" dataKey="temp_min" name="Min" stroke="#22c55e" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Humidity Chart */}
                    <div className="bg-white rounded-2xl shadow p-4 sm:px-6 sm:py-5">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4">
                            <span className="material-symbols-outlined text-blue-500 text-xl sm:text-2xl">humidity_percentage</span>
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">Grafik Kelembaban</h3>
                        </div>
                        <div className="w-full h-[260px] sm:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={allData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltipHumidity />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="humidity"
                                        name="Kelembaban (%)"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 1.5 }}
                                        activeDot={{ r: 7, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                                        connectNulls
                                    />
                                    <Line type="monotone" dataKey="hum_max" name="Max" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                    <Line type="monotone" dataKey="hum_min" name="Min" stroke="#22c55e" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow px-6 py-12 text-center text-gray-400 mt-4">
                    <span className="material-symbols-outlined text-5xl mb-2">query_stats</span>
                    <p className="text-sm font-medium">Tidak ada data grafik untuk filter yang dipilih</p>
                </div>
            )}

            {/* Warning Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                {/* Temperature Warning */}
                <div className="bg-white rounded-2xl shadow p-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                        <span className="material-symbols-outlined text-orange-500 text-2xl sm:text-3xl">thermostat</span>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Temperature Warning</h3>
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
                            <table className="table table-zebra text-sm min-w-[480px]">
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
                <div className="bg-white rounded-2xl shadow p-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                        <span className="material-symbols-outlined text-blue-500 text-2xl sm:text-3xl">humidity_percentage</span>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Humidity Warning</h3>
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
                            <table className="table table-zebra text-sm min-w-[480px]">
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

            {/* Export PDF F-6.3 Modal */}
            <ExportPdfF63Modal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                initialRoomId={selectedRoom}
                initialMonth={selectedMonth}
                roomsList={roomsList}
            />
        </>
    );
}
