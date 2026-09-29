"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/api";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title as ChartTitle,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const gradients = [
    "from-indigo-500 to-purple-600",
    "from-emerald-400 to-emerald-600",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-rose-600",
    "from-blue-500 to-indigo-600",
    "from-sky-400 to-blue-600",
    "from-teal-400 to-teal-600",
    "from-lime-400 to-green-500",
];

export default function DashboardETamu() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    const [isLoading, setIsLoading] = useState(true);
    const chartRef = useRef<any>(null);

    const [filterYear, setFilterYear] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [dashboardData, setDashboardData] = useState<any>({
        total_guests: 0,
        today_guests: 0,
        services_stats: [],
        chart_data: null,
        table_data: []
    });

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ETAMU || 'http://localhost:8002';

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (authLoading === false && !user) {
            router.push(`/login?redirectUrl=${pathname}`);
        }
    }, [user, authLoading, router, pathname]);

    const fetchDashboardData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await api.get(`${baseURL}/api/e-tamu/dashboard`, {
                params: { year: filterYear, month: filterMonth }
            });
            setDashboardData(res.data);
        } catch (error) {
            console.error("Gagal mengambil data dashboard E-Tamu", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user, filterYear, filterMonth]);

    const handleDownloadChart = () => {
        if (chartRef.current) {
            const url = chartRef.current.toBase64Image();
            const link = document.createElement('a');
            link.download = 'statistik-tamu.png';
            link.href = url;
            link.click();
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-emerald-600"></span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
            
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Dashboard
                    </h1>
                </div>
                <div className="text-emerald-600 font-bold text-xl flex items-center gap-1.5">
                    {dashboardData.total_guests} <span className="text-sm font-medium text-slate-500">Total Tamu</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-lime-500 to-green-500 shadow-md rounded-2xl p-6 text-center text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <span className="material-symbols-outlined text-[100px]">today</span>
                    </div>
                    <h2 className="text-lg font-bold uppercase tracking-wider mb-2 relative z-10">Tamu Hari Ini</h2>
                    <p className="text-5xl font-black relative z-10">{dashboardData.today_guests}</p>
                    <p className="text-sm text-green-100 font-medium relative z-10 mt-1">Pengunjung</p>
                </div>

                <div className="md:col-span-2 bg-gradient-to-br from-blue-500 to-emerald-500 shadow-md rounded-2xl p-6 text-center text-white flex flex-col justify-center">
                    <h2 className="text-xl font-bold uppercase tracking-wider mb-4">Selamat Datang di Balai Besar POM di Mataram</h2>
                    <div className="flex justify-center gap-3">
                        <select 
                            className="bg-white/20 border border-white/30 text-white placeholder-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm [&>option]:text-slate-800"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <option value="">Pilih Tahun</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                        <select 
                            className="bg-white/20 border border-white/30 text-white placeholder-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm [&>option]:text-slate-800"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">Pilih Bulan</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                            ))}
                        </select>
                        <button onClick={fetchDashboardData} className="bg-white text-emerald-600 hover:bg-slate-50 font-bold px-6 py-2 rounded-xl shadow-sm transition-colors">
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 text-center shadow-sm mt-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Total Tamu Berdasarkan Keperluan</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-10 text-center text-slate-400 flex flex-col items-center">
                        <span className="loading loading-spinner loading-md mb-2"></span> Memuat Data...
                    </div>
                ) : (
                    dashboardData.services_stats?.map((srv: any, idx: number) => (
                        <div key={srv.id} className={`bg-gradient-to-br ${gradients[idx % gradients.length]} shadow-lg shadow-slate-200 rounded-2xl p-6 text-center text-white relative overflow-hidden transition-transform hover:-translate-y-1`}>
                            <h2 className="text-base font-bold mb-3 min-h-[48px] flex items-center justify-center leading-tight">
                                {srv.name}
                            </h2>
                            <p className="text-4xl font-black">{srv.count}</p>
                            <p className="text-xs font-medium text-white/80 mt-1 uppercase tracking-wider">Tamu</p>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-slate-800 rounded-xl p-4 text-center shadow-sm mt-4">
                <h2 className="text-lg font-bold text-white tracking-wide">Statistik Tamu Per Tahun</h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="relative h-[400px] w-full flex justify-center items-center">
                    {isLoading ? (
                        <span className="loading loading-spinner loading-md text-emerald-600"></span>
                    ) : dashboardData.chart_data ? (
                        <Bar 
                            ref={chartRef}
                            data={dashboardData.chart_data} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom' } },
                                scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true, ticks: { stepSize: 1 } } }
                            }} 
                        />
                    ) : (
                        <p className="text-slate-400">Tidak ada data untuk ditampilkan</p>
                    )}
                </div>
                <div className="mt-6 text-center">
                    <button onClick={handleDownloadChart} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors text-sm">
                        Download Gambar Bagan
                    </button>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 text-center shadow-sm mt-4">
                <h2 className="text-lg font-bold text-white tracking-wide">Tabel Data Tamu</h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <a href={`${baseURL}/security/guest-download`} target="_blank" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg shadow-sm transition-colors text-sm inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">download</span> Download xlsx
                    </a>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                                <th className="px-6 py-4">Nama</th>
                                <th className="px-6 py-4">HP</th>
                                <th className="px-6 py-4">Instansi</th>
                                <th className="px-6 py-4">Keperluan</th>
                                <th className="px-6 py-4">Waktu Datang</th>
                                <th className="px-6 py-4">Foto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        <span className="loading loading-spinner loading-md"></span>
                                    </td>
                                </tr>
                            ) : dashboardData.table_data?.length > 0 ? (
                                dashboardData.table_data.map((guest: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{guest.name}</td>
                                        <td className="px-6 py-4">{guest.hp}</td>
                                        <td className="px-6 py-4">{guest.company || '-'}</td>
                                        <td className="px-6 py-4">{guest.service_name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {guest.date}<br/>
                                            <span className="text-xs text-slate-400 font-mono">{guest.time}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {guest.selfie ? (
                                                <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                                    {/* URL ditambahkan /storage/ di sini */}
                                                    <img src={`${baseURL}/storage/${guest.selfie}`} alt="Foto" className="w-full h-full object-cover" />
                                                </div>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">Belum ada data tamu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}