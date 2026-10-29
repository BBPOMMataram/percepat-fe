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
    const yearDropdownRef = useRef<HTMLDivElement>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const currentYearNum = new Date().getFullYear();
    const currentYearStr = currentYearNum.toString();
    const currentMonthStr = (new Date().getMonth() + 1).toString();

    const [filterYear, setFilterYear] = useState<string>(currentYearStr);
    const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);
    const [chartYears, setChartYears] = useState<number[]>([currentYearNum]);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState<boolean>(false);
    const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
    const [hiddenServices, setHiddenServices] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
    const [isDownloadingExcel, setIsDownloadingExcel] = useState<boolean>(false);
    const [dashboardData, setDashboardData] = useState<any>({
        total_guests: 0,
        today_guests: 0,
        services_stats: [],
        chart_data: null,
        selected_chart_years: [currentYearNum],
        table_data: [],
        available_years: [],
        pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
            from: 0,
            to: 0,
        }
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
                setIsYearDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchDashboardData = async (
        page: number = currentPage,
        isPageOnly: boolean = false,
        customChartYears?: number[],
        isChartOnly: boolean = false
    ) => {
        if (!user) return;
        if (isChartOnly) {
            setIsChartLoading(true);
        } else if (isPageOnly) {
            setIsTableLoading(true);
        } else {
            setIsLoading(true);
        }
        try {
            const yearsToSend = customChartYears !== undefined ? customChartYears : chartYears;
            const res = await api.get(`${baseURL}/api/e-tamu/dashboard`, {
                params: {
                    year: filterYear,
                    month: filterMonth,
                    chart_years: yearsToSend.length > 0 ? yearsToSend.join(',') : undefined,
                    page: page,
                    per_page: 10,
                }
            });
            setDashboardData(res.data);
            if (Array.isArray(res.data?.selected_chart_years) && res.data.selected_chart_years.length > 0) {
                setChartYears(res.data.selected_chart_years.map((y: any) => Number(y)));
            }
        } catch (error) {
            console.error("Gagal mengambil data dashboard E-Tamu", error);
        } finally {
            setIsLoading(false);
            setIsTableLoading(false);
            setIsChartLoading(false);
        }
    };

    const availableYears: number[] = dashboardData.available_years && dashboardData.available_years.length > 0
        ? dashboardData.available_years
        : [currentYearNum];

    const activeChartYears: number[] = chartYears.length > 0 ? chartYears : [availableYears[availableYears.length - 1]];
    const isAllYearsSelected = availableYears.length > 0 && availableYears.every((yr) => activeChartYears.includes(yr));

    const handleToggleChartYear = (yr: number) => {
        const exists = activeChartYears.includes(yr);
        let updated: number[];
        if (exists) {
            if (activeChartYears.length <= 1) return; // Minimal 1 tahun tetap terpilih
            updated = activeChartYears.filter((y) => y !== yr);
        } else {
            updated = [...activeChartYears, yr].sort((a, b) => a - b);
        }
        setChartYears(updated);
        fetchDashboardData(currentPage, false, updated, true);
    };

    const handleToggleAllYears = () => {
        let updated: number[];
        if (isAllYearsSelected) {
            const defaultYr = availableYears.includes(currentYearNum)
                ? currentYearNum
                : availableYears[availableYears.length - 1];
            updated = [defaultYr];
        } else {
            updated = [...availableYears].sort((a, b) => a - b);
        }
        setChartYears(updated);
        fetchDashboardData(currentPage, false, updated, true);
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchDashboardData(1, false);
    }, [user, filterYear, filterMonth]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        const lastPage = dashboardData.pagination?.last_page || 1;
        if (newPage > lastPage) return;
        setCurrentPage(newPage);
        fetchDashboardData(newPage, true);
    };

    const generatePaginationPages = (current: number, total: number) => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 3) {
            return [1, 2, 3, 4, '...', total];
        }
        if (current >= total - 2) {
            return [1, '...', total - 3, total - 2, total - 1, total];
        }
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const handleDownloadExcel = async () => {
        try {
            setIsDownloadingExcel(true);
            const params: any = {};
            if (filterYear) params.year = filterYear;
            if (filterMonth) params.month = filterMonth;

            const response = await api.get(`${baseURL}/api/e-tamu/download-excel`, {
                params,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `data-tamu${filterYear ? `-${filterYear}` : ''}${filterMonth ? `-bulan-${filterMonth}` : ''}.xlsx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Gagal mendownload data tamu Excel", error);
            const queryParams = new URLSearchParams();
            if (filterYear) queryParams.set('year', filterYear);
            if (filterMonth) queryParams.set('month', filterMonth);
            window.open(`${baseURL}/api/e-tamu/download-excel?${queryParams.toString()}`, '_blank');
        } finally {
            setIsDownloadingExcel(false);
        }
    };

    const handleDownloadChart = () => {
        if (chartRef.current) {
            const url = chartRef.current.toBase64Image();
            const link = document.createElement('a');
            link.download = 'statistik-tamu.png';
            link.href = url;
            link.click();
        }
    };

    const isComparisonChart = Boolean(dashboardData.chart_data?.is_comparison);
    const serviceLegend: { name: string; color: string }[] = dashboardData.chart_data?.service_legend || [];

    // Jika mode perbandingan (2+ tahun) dan ada service di legend yang di-hide, nilai datanya dijadikan null
    const processedChartData = (() => {
        const raw = dashboardData.chart_data;
        if (!raw) return null;
        if (!raw.is_comparison) return raw;
        return {
            ...raw,
            datasets: raw.datasets.map((ds: any) => ({
                ...ds,
                data: ds.data.map((val: number, idx: number) =>
                    hiddenServices.includes(idx) ? null : val
                ),
            })),
        };
    })();

    // Plugin untuk menampilkan label tahun tepat di bawah/atas tiap batang saat membandingkan >1 tahun
    const comparisonYearPlugin = {
        id: "comparisonYearPlugin",
        afterDatasetsDraw(chart: any) {
            if (!chart?.data?.is_comparison) return;
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            ctx.save();
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#475569";

            chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (meta.hidden) return;
                const yearLabel = dataset.year || dataset.label?.replace("Tahun ", "") || "";
                meta.data.forEach((bar: any, index: number) => {
                    if (dataset.data[index] === null || dataset.data[index] === undefined) return;
                    // Gambar tahun tepat di bawah batang pada area sumbu X
                    ctx.fillText(yearLabel, bar.x, chartArea.bottom + 6);
                });
            });
            ctx.restore();
        },
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
                            {availableYears.map((yr: number) => (
                                <option key={yr} value={yr.toString()}>{yr}</option>
                            ))}
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
                        <button 
                            onClick={() => {
                                setCurrentPage(1);
                                fetchDashboardData(1, false);
                            }} 
                            className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                        >
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
                {/* Checkbox Dropdown Pilihan Tahun */}
                <div className="flex justify-end mb-4">
                    <div className="relative" ref={yearDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                            className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm flex items-center justify-between gap-3 min-w-[200px] cursor-pointer transition-colors"
                        >
                            <span className="truncate">
                                {isAllYearsSelected && availableYears.length > 1
                                    ? `Semua Tahun (${activeChartYears.join(", ")})`
                                    : `Tahun: ${activeChartYears.join(", ")}`}
                            </span>
                            <span className="material-symbols-outlined text-[18px] text-slate-500">
                                {isYearDropdownOpen ? "expand_less" : "expand_more"}
                            </span>
                        </button>

                        {isYearDropdownOpen && (
                            <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-30">
                                <label
                                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold border-b border-slate-100"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isAllYearsSelected}
                                        onChange={handleToggleAllYears}
                                        disabled={isChartLoading}
                                        className="w-4 h-4 rounded accent-[#0284c7] cursor-pointer"
                                    />
                                    <span>Semua Tahun</span>
                                </label>

                                <div className="max-h-56 overflow-y-auto py-1">
                                    {availableYears.map((yr: number) => {
                                        const isChecked = activeChartYears.includes(yr);
                                        return (
                                            <label
                                                key={yr}
                                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleChartYear(yr)}
                                                    disabled={isChartLoading}
                                                    className="w-4 h-4 rounded accent-[#0284c7] cursor-pointer"
                                                />
                                                <span>{yr}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative h-[400px] w-full flex justify-center items-center">
                    {isLoading || isChartLoading ? (
                        <span className="loading loading-spinner loading-md text-slate-800"></span>
                    ) : processedChartData ? (
                        <Bar 
                            key={`bar-${activeChartYears.join('-')}-${isComparisonChart ? 'cmp' : 'single'}`}
                            ref={chartRef}
                            data={processedChartData}
                            plugins={[comparisonYearPlugin]}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                layout: {
                                    padding: {
                                        bottom: isComparisonChart ? 18 : 0,
                                    },
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: isComparisonChart
                                            ? {
                                                generateLabels: () =>
                                                    serviceLegend.map((srv, idx) => ({
                                                        text: srv.name,
                                                        fillStyle: srv.color,
                                                        strokeStyle: srv.color,
                                                        lineWidth: 0,
                                                        hidden: hiddenServices.includes(idx),
                                                        index: idx,
                                                    })),
                                            }
                                            : undefined,
                                        onClick: isComparisonChart
                                            ? (_e: any, legendItem: any) => {
                                                const idx = legendItem.index;
                                                if (typeof idx !== 'number') return;
                                                setHiddenServices((prev) =>
                                                    prev.includes(idx)
                                                        ? prev.filter((i) => i !== idx)
                                                        : [...prev, idx]
                                                );
                                            }
                                            : undefined,
                                    },
                                    tooltip: isComparisonChart
                                        ? {
                                            callbacks: {
                                                title: (items: any[]) => {
                                                    if (!items.length) return '';
                                                    const dataIdx = items[0].dataIndex;
                                                    return serviceLegend[dataIdx]?.name || items[0].label || '';
                                                },
                                                label: (ctx: any) => {
                                                    const yr = ctx.dataset.year || ctx.dataset.label || '';
                                                    return ` ${yr}: ${ctx.parsed.y}`;
                                                },
                                            },
                                        }
                                        : undefined,
                                },
                                scales: {
                                    x: {
                                        stacked: false,
                                        ticks: isComparisonChart
                                            ? {
                                                display: false,
                                            }
                                            : undefined,
                                    },
                                    y: {
                                        stacked: false,
                                        beginAtZero: true,
                                        ticks: { stepSize: 1 },
                                    },
                                },
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
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button 
                        type="button"
                        onClick={handleDownloadExcel}
                        disabled={isDownloadingExcel}
                        className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium py-2 px-5 rounded-lg shadow-sm transition-colors text-sm inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {isDownloadingExcel ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                <span>Mendownload...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">description</span>
                                <span>Download xlsx</span>
                            </>
                        )}
                    </button>

                    {dashboardData.pagination && dashboardData.pagination.total > 0 && (
                        <div className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg">
                            Menampilkan <span className="font-bold text-slate-700">{dashboardData.pagination.from || 0}</span> - <span className="font-bold text-slate-700">{dashboardData.pagination.to || 0}</span> dari <span className="font-bold text-slate-700">{dashboardData.pagination.total}</span> data tamu
                        </div>
                    )}
                </div>
                
                <div className="overflow-x-auto relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                                <th className="px-6 py-4">Nama</th>
                                <th className="px-6 py-4">HP</th>
                                <th className="px-6 py-4">Instansi</th>
                                <th className="px-6 py-4">Keperluan</th>
                                <th className="px-6 py-4">Waktu Datang</th>
                                <th className="px-6 py-4">Foto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {isLoading || isTableLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="loading loading-spinner loading-md text-[#0284c7]"></span>
                                            <span className="text-xs text-slate-500">Memuat data tamu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : dashboardData.table_data?.length > 0 ? (
                                dashboardData.table_data.map((guest: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">{guest.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{guest.hp}</td>
                                        <td className="px-6 py-4 text-slate-600">{guest.company || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">{guest.service_name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
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
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">Belum ada data tamu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                {dashboardData.pagination && dashboardData.pagination.total > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
                            Halaman <span className="font-bold text-slate-700">{dashboardData.pagination.current_page}</span> dari <span className="font-bold text-slate-700">{dashboardData.pagination.last_page}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1 || isTableLoading}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 shadow-sm"
                                title="Halaman Sebelumnya"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                <span className="hidden sm:inline">Sebelumnya</span>
                            </button>

                            <div className="flex items-center gap-1">
                                {generatePaginationPages(currentPage, dashboardData.pagination.last_page || 1).map((p, idx) => {
                                    if (p === '...') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs">
                                                ...
                                            </span>
                                        );
                                    }
                                    const pageNum = Number(p);
                                    const isActive = pageNum === currentPage;
                                    return (
                                        <button
                                            key={`page-${pageNum}`}
                                            type="button"
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={isTableLoading}
                                            className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${
                                                isActive
                                                    ? "bg-[#0284c7] text-white shadow-sky-500/20"
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= (dashboardData.pagination.last_page || 1) || isTableLoading}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 shadow-sm"
                                title="Halaman Selanjutnya"
                            >
                                <span className="hidden sm:inline">Selanjutnya</span>
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* POPUP ZOOM GAMBAR TAMU */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-300 p-4 md:p-8"
                    onClick={() => setSelectedImage(null)}
                >
                    <div 
                        className="relative max-w-2xl max-h-[90vh] flex flex-col items-center justify-center" 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center gap-1.5 font-medium transition-colors bg-slate-800/70 hover:bg-slate-800 px-4 py-1.5 rounded-full backdrop-blur-md shadow-md text-sm cursor-pointer z-10"
                        >
                            Tutup <span className="text-xl leading-none">&times;</span>
                        </button>
                        <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-950 flex items-center justify-center max-h-[82vh]">
                            <img 
                                src={selectedImage} 
                                alt="Zoomed Selfie" 
                                className="max-w-full max-h-[80vh] w-auto h-auto object-contain block"
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
