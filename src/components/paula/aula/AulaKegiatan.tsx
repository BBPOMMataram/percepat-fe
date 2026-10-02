/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function AulaKegiatan() {
    const [kegiatans, setKegiatans] = useState<any[]>([]);
    const [sort, setSort] = useState("tanggal_pengajuan");
    const [direction, setDirection] = useState("desc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || 'http://localhost:8004';

    const fetchKegiatans = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`${baseURL}/api/paula/kegiatan`, {
                params: { sort, direction, page }
            });
            // Respons dari Laravel paginate() memiliki data di dalam property 'data'
            setKegiatans(res.data.data);
            setTotalPages(res.data.last_page);
        } catch (error) {
            console.error("Gagal mengambil daftar kegiatan", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKegiatans();
    }, [sort, direction, page]);

    const toggleDirection = () => {
        setDirection(prev => prev === "desc" ? "asc" : "desc");
    };

    // Fungsi format tanggal ke bahasa Indonesia
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }).format(date);
    };

    return (
        <div className="max-w-screen-xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Daftar Kegiatan Aula</h1>
                <p className="text-slate-500 mt-1 font-medium">Seluruh kegiatan peminjaman aula BBPOM Mataram yang telah disetujui.</p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                
                {/* TOOLBAR SORTING */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider hidden sm:block">Urutkan:</label>
                        <select 
                            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium shadow-sm flex-1 sm:flex-none cursor-pointer"
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value);
                                setPage(1); // Reset ke halaman 1 jika filter diubah
                            }}
                        >
                            <option value="tanggal_pengajuan">Tanggal Pengajuan</option>
                            <option value="tanggal_pinjam">Tanggal Pelaksanaan</option>
                        </select>
                        <button 
                            onClick={toggleDirection}
                            className="bg-white border border-slate-200 text-slate-700 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                            title={direction === "desc" ? "Menurun (Terbaru)" : "Menaik (Terlama)"}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {direction === "desc" ? "arrow_downward" : "arrow_upward"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* TABEL KEGIATAN */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                                <th className="px-6 py-4">Tgl Pengajuan</th>
                                <th className="px-6 py-4">Pelaksanaan</th>
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Nama Kegiatan</th>
                                <th className="px-6 py-4">Peserta</th>
                                <th className="px-6 py-4 text-center">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                                        <p className="text-slate-400 mt-3 font-medium">Memuat data kegiatan...</p>
                                    </td>
                                </tr>
                            ) : kegiatans.length > 0 ? (
                                kegiatans.map((keg: any) => (
                                    <tr key={keg.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {formatDate(keg.tanggal_pengajuan)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">
                                            {formatDate(keg.tanggal_pinjam)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold bg-blue-50/30">
                                            {keg.waktu_mulai?.slice(0,5)} - {keg.waktu_selesai?.slice(0,5)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {keg.nama_kegiatan}
                                            {keg.aula === 'besar' ? (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">Aula Besar</span>
                                            ) : (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700 uppercase">Aula Kecil</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{keg.peserta}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                                            <div className="bg-slate-100 px-3 py-1 rounded-full inline-block group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-colors">
                                                {keg.jumlah_peserta}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                                        Belum ada jadwal kegiatan yang disetujui.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!isLoading && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            Sebelumnya
                        </button>
                        <span className="text-sm font-medium text-slate-500">
                            Halaman <strong className="text-slate-800">{page}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
                        </span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            Selanjutnya
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}