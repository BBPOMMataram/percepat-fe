/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
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

export default function DashboardETamu() {
    const [callName, setCallName] = useState<string>("");
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    const [isLoading, setIsLoading] = useState(true);
    const chartRef = useRef<any>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    useEffect(() => {
        if (user) {
            setCallName(user.call_name || "");
            const isSuperadmin = user.role?.level === 'superadmin';
            const isAdminThisSite = Array.isArray(user.sites) && user.sites.some((s: any) => Number(s?.id) === 2);
            const isAdmin = user.role?.level === 'admin' && isAdminThisSite;
            if (!isAdmin && !isSuperadmin) {
                router.replace('/unauthorized');
            }
        }
    }, [user, router]);

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
                <span className="loading loading-spinner loading-lg text-slate-800"></span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10 relative text-slate-800">
            
            <div className="flex justify-between items-center pb-2">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-base">{dashboardData.total_guests}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total Tamu</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border-t-[4px] border-[#1e293b] shadow-sm rounded-xl p-6 text-center flex flex-col justify-center">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Tamu Hari Ini</h2>
                    <p className="text-5xl font-black text-slate-900">{dashboardData.today_guests}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-3">Pengunjung</p>
                </div>

                <div className="md:col-span-2 bg-white border-t-[4px] border-[#1e293b] shadow-sm rounded-xl p-6 flex flex-col justify-center">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider mb-4">
                        Selamat Datang di Balai Besar POM di Mataram
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <select 
                            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1 sm:flex-none min-w-[150px]"
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
                            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1 sm:flex-none min-w-[150px]"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">Pilih Bulan</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                            ))}
                        </select>
                        <button onClick={fetchDashboardData} className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition-colors text-sm">
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[#1e293b] rounded-lg p-3.5 text-center shadow-sm mt-2">
                <h2 className="text-sm font-bold text-white tracking-wide">Total Tamu Berdasarkan Keperluan</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-10 text-center text-slate-400 flex flex-col items-center">
                        <span className="loading loading-spinner loading-md mb-2"></span> Memuat Data...
                    </div>
                ) : (
                    dashboardData.services_stats?.map((srv: any) => (
                        <div key={srv.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col justify-between min-h-[120px] transition-transform hover:-translate-y-1">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left line-clamp-2">
                                {srv.name}
                            </h2>
                            <div className="flex justify-between items-end mt-4">
                                <p className="text-3xl font-black text-slate-900 leading-none">{srv.count}</p>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamu</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-[#1e293b] rounded-lg p-3.5 text-center shadow-sm mt-4">
                <h2 className="text-sm font-bold text-white tracking-wide">Statistik Tamu Per Tahun</h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="relative h-[400px] w-full flex justify-center items-center">
                    {isLoading ? (
                        <span className="loading loading-spinner loading-md text-slate-800"></span>
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
                    <button onClick={handleDownloadChart} className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors text-sm inline-flex items-center gap-2 mx-auto">
                        <span className="material-symbols-outlined text-[18px]">download</span> Download Gambar Bagan
                    </button>
                </div>
            </div>

            <div className="bg-[#1e293b] rounded-lg p-3.5 text-center shadow-sm mt-4">
                <h2 className="text-sm font-bold text-white tracking-wide">Tabel Data Tamu</h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <a href={`${baseURL}/security/guest-download`} target="_blank" className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium py-2 px-5 rounded-lg shadow-sm transition-colors text-sm inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">description</span> Download xlsx
                    </a>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
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
                                        <td className="px-6 py-4">{guest.name}</td>
                                        <td className="px-6 py-4">{guest.hp}</td>
                                        <td className="px-6 py-4">{guest.company || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{guest.service_name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {guest.date}, {guest.time} WITA
                                        </td>
                                        <td className="px-6 py-4">
                                            {guest.selfie ? (
                                                <div 
                                                    className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm cursor-pointer group relative"
                                                    onClick={() => setSelectedImage(`${baseURL}/storage/${guest.selfie}`)}
                                                    title="Klik untuk memperbesar gambar"
                                                >
                                                    <img 
                                                        src={`${baseURL}/storage/${guest.selfie}`} 
                                                        alt="Foto" 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white text-[16px] opacity-0 group-hover:opacity-100 drop-shadow-md">zoom_in</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-200">
                                                    AF
                                                </div>
                                            )}
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

            {/* POPUP ZOOM GAMBAR TAMU DIPERBAIKI */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-300 p-4 lg:p-10"
                    onClick={() => setSelectedImage(null)}
                >
                    <div 
                        // Lebar kontainer diperbesar (max-w-4xl) dan di-set w-full
                        className="relative w-full max-w-3xl flex flex-col items-center" 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-1 font-medium transition-colors bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-full backdrop-blur-md"
                        >
                            Tutup <span className="text-xl leading-none">&times;</span>
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="Zoomed Selfie" 
                            // Diubah menjadi w-full agar gambar dipaksa meregang mengikuti ukuran container
                            className="w-full h-auto max-h-[85vh] rounded-2xl shadow-2xl object-cover border-4 border-white"
                        />
                    </div>
                </div>
            )}

        </div>
    );
}