"use client";

import dayjs from "@/utils/dayjs";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Link from "next/link";

export default function DashboardESapa() {
    const { user } = useSelector((state: RootState) => state.auth);

    const [dashboardData, setDashboardData] = useState({
        countStToday: 0,
        countStThisMonth: 0,
        countStThisYear: 0,
        countPetugas: 0
    });

    const [recentST, setRecentST] = useState<any[]>([]);
    const [recentPerjadin, setRecentPerjadin] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
                
                const [dashRes, stRes, perjadinRes] = await Promise.all([
                    api.get(`${baseURL}/api/dashboard`),
                    api.get(`${baseURL}/api/st?limit=5`),
                    api.get(`${baseURL}/api/perjadin?limit=5`).catch(() => ({ data: { data: [] } }))
                ]);

                if (dashRes.data && dashRes.data.data) {
                    setDashboardData(dashRes.data.data);
                }
                
                setRecentST(stRes.data?.data || stRes.data || []);
                setRecentPerjadin(perjadinRes.data?.data || perjadinRes.data || []);
            } catch (err) {
                console.error("Gagal mengambil data dashboard:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="py-8 px-4 sm:px-8 w-full max-w-full overflow-hidden">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                            <span className="bg-slate-200/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                {dayjs().format('dddd, DD MMMM YYYY')}
                            </span>
                            <span className="bg-slate-200/60 px-3 py-1 rounded-full">T.A. {dayjs().format('YYYY')}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-normal text-slate-800">
                            Selamat Datang kembali, <span className="font-bold text-teal-700">{user?.name || 'Pengguna'}</span>.
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-b-[5px] border-b-[#003366] overflow-hidden flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Surat Tugas Hari Ini</p>
                            <h2 className="text-4xl font-bold text-slate-800">{dashboardData.countStToday}</h2>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-b-[5px] border-b-[#003366] overflow-hidden flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Surat Tugas Bulan Ini</p>
                            <h2 className="text-4xl font-bold text-slate-800">{dashboardData.countStThisMonth}</h2>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-b-[5px] border-b-[#003366] overflow-hidden flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Surat Tugas Tahun Ini</p>
                            <h2 className="text-4xl font-bold text-slate-800">{dashboardData.countStThisYear}</h2>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-b-[5px] border-b-[#003366] overflow-hidden flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Petugas Terdaftar</p>
                            <h2 className="text-4xl font-bold text-slate-800">{dashboardData.countPetugas}</h2>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Daftar Surat Tugas Terbaru</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Berkas penugasan dinas yang terakhir kali ditambahkan</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">No. Surat Tugas</th>
                                            <th className="px-6 py-4 font-semibold">Tujuan & Kegiatan</th>
                                            <th className="px-6 py-4 font-semibold">Tgl Pelaksanaan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                                    <span className="loading loading-spinner loading-md"></span>
                                                </td>
                                            </tr>
                                        ) : recentST.length > 0 ? (
                                            recentST.slice(0, 5).map((item: any) => {
                                                const tglDari = dayjs(item.tanggal_dari).format('DD MMM YYYY');
                                                const tglSampai = dayjs(item.tanggal_sampai).format('DD MMM YYYY');
                                                const tglTugas = tglDari === tglSampai ? tglDari : `${tglDari} - ${tglSampai}`;

                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-800">{item.nomor_surat}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">MAK: {item.mak_kegiatan || '-'}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-slate-700 max-w-[250px] truncate" title={item.nama_kegiatan}>
                                                                {item.nama_kegiatan}
                                                            </div>
                                                            <div className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                                {item.wilayah_tugas}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600">{tglTugas}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-6 text-center text-slate-400 italic">Belum ada data Surat Tugas</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-slate-100 flex justify-end items-center bg-slate-50/50 mt-auto">
                                <Link href="/e-sapa/surat-tugas" className="text-teal-600 font-medium text-sm flex items-center gap-1 hover:text-teal-700">
                                    Lihat Seluruh Surat Tugas <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mb-8">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Daftar Perjalanan Dinas Terbaru</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Monitoring status laporan perjalanan dinas</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Tujuan</th>
                                            <th className="px-6 py-4 font-semibold">Kegiatan Terkait</th>
                                            <th className="px-6 py-4 font-semibold">Petugas Utama</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                                    <span className="loading loading-spinner loading-md"></span>
                                                </td>
                                            </tr>
                                        ) : recentPerjadin.length > 0 ? (
                                            recentPerjadin.slice(0, 5).map((item: any, idx: number) => {
                                                const suratTugas = item.list_petugas?.surat_tugas;
                                                const petugas = item.list_petugas?.petugas;
                                                
                                                const wilayah = suratTugas?.wilayah_tugas || "Lokasi belum ditentukan";
                                                const kegiatan = suratTugas?.nama_kegiatan || "Tidak ada kegiatan";
                                                const namaPetugas = petugas?.nm_petugas || "Petugas Tidak Diketahui";
                                                
                                                let tglPelaksanaan = "Menunggu Jadwal";
                                                if (suratTugas?.tanggal_dari && suratTugas?.tanggal_sampai) {
                                                    const tDari = dayjs(suratTugas.tanggal_dari).format('DD MMM YYYY');
                                                    const tSampai = dayjs(suratTugas.tanggal_sampai).format('DD MMM YYYY');
                                                    tglPelaksanaan = tDari === tSampai ? tDari : `${tDari} - ${tSampai}`;
                                                }

                                                return (
                                                    <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-800">{wilayah}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{tglPelaksanaan}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-700 max-w-[250px] truncate" title={kegiatan}>
                                                            {kegiatan}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-indigo-50 text-indigo-700 text-[12px] font-semibold px-2.5 py-1 rounded-md border border-indigo-100">
                                                                {namaPetugas}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-6 text-center text-slate-400 italic">Belum ada data Perjalanan Dinas</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-slate-100 flex justify-end items-center bg-slate-50/50 mt-auto">
                                <Link href="/e-sapa/perjadin" className="text-indigo-600 font-medium text-sm flex items-center gap-1 hover:text-indigo-700">
                                    Lihat Seluruh Perjalanan Dinas <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </Link>
                            </div>
                        </div>

                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-fit">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Aksi Cepat</h3>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-2">
                            <Link href="/e-sapa/surat-tugas" className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 hover:border-slate-300 border-l-[5px] border-l-[#003366] transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold shrink-0">1</div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800">Buat Surat Tugas Baru</h4>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors">chevron_right</span>
                            </Link>

                            <Link href="/e-sapa/kwitansi" className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 hover:border-slate-300 border-l-[5px] border-l-[#003366] transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800">Kwitansi</h4>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors">chevron_right</span>
                            </Link>

                            <Link href="/e-sapa/spd" className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 hover:border-slate-300 border-l-[5px] border-l-[#003366] transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">3</div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800">SPD</h4>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors">chevron_right</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}