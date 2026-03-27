"use client";

import api from '@/utils/api';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface IzinKeluar {
    id: number;
    pegawai_name?: string;
    katim_name?: string;
    keperluan: string;
    waktu_keluar: string;
    waktu_kembali: string;
    status?: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function SimakoDashboard() {
    const [data, setData] = useState<IzinKeluar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State Filter & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [totalToday, setTotalToday] = useState(0); // Untuk Card Statistik
    const [lastPage, setLastPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = useCallback(async (page: number, search: string) => {
        try {
            setLoading(true);
            let userIds: number[] = [];

            // 1. Search Nama di Auth jika ada input
            if (search.trim().length > 1) {
                try {
                    const authSearch = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/search-user-ids?name=${search}`);
                    userIds = authSearch.data || [];
                } catch (e) { console.error(e); }
            }

            // 2. Fetch data dari Simako (Server-Side Paginate)
            const params = new URLSearchParams({
                page: page.toString(),
                search: search,
                user_ids: JSON.stringify(userIds),
                limit: itemsPerPage.toString()
            });

            const response = await api(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMAKO}/api/izin-keluar?${params}`);
            const izinData = response.data?.data || [];

            // Simpan Meta Data
            setTotalData(response.data?.total || 0);
            setLastPage(response.data?.last_page || 1);
            // Pastikan backend mengirimkan field 'total_today' atau hitung manual jika data kecil
            setTotalToday(response.data?.total_today || 0);

            if (izinData.length === 0) {
                setData([]);
                return;
            }

            // 3. Batch Fetch Nama Pegawai & Katim (Hanya data yang tampil)
            const uniqueIds = new Set<number>();
            izinData.forEach((item: any) => {
                if (item.external_user_id) uniqueIds.add(item.external_user_id);
                if (item.katim_id) uniqueIds.add(item.katim_id);
            });

            const userResponse = await api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, {
                ids: Array.from(uniqueIds)
            });

            const userMap = new Map();
            (userResponse.data || []).forEach((u: any) => userMap.set(u.id, u.name));

            const mappedData = izinData.map((item: any) => ({
                ...item,
                pegawai_name: userMap.get(item.external_user_id) || 'Unknown User',
                katim_name: userMap.get(item.katim_id) || 'Unknown Katim',
            }));

            setData(mappedData);
        } catch (err: any) {
            setError('Gagal sinkronisasi data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce Search Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(currentPage, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, fetchData]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 relative overflow-hidden font-sans pb-20">
            <div className="relative z-10 py-12 px-4 max-w-7xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <Image src="/assets/images/bpom.webp" alt="Logo" width={75} height={75} className="mx-auto mb-4 drop-shadow-lg" />
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2 drop-shadow-md">Dashboard Izin Keluar</h1>
                </motion.div>

                {/* Stats Section - DIKEMBALIKAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 lg:grid">
                    <motion.div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-3xl font-black text-white mb-2">{totalToday}</p>
                        <p className="text-white/80 font-medium">Pengajuan Hari ini</p>
                    </motion.div>
                    <motion.div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <p className="text-3xl font-black text-white mb-2">{totalData}</p>
                        <p className="text-white/80 font-medium">Total Pengajuan (Semua)</p>
                    </motion.div>
                </div>

                {/* Search & Actions */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center border border-white/20 shadow-xl">
                    <div className="flex gap-2 w-full lg:w-auto">
                        <Link href="/simako" className="btn btn-ghost text-white border-white/20">Kembali</Link>
                        <button onClick={() => fetchData(currentPage, searchTerm)} className="btn btn-square btn-ghost text-white border-white/20"><span className="material-symbols-outlined">refresh</span></button>
                    </div>
                    <div className="relative flex-1 w-full">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Cari pegawai, katim, atau keperluan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white text-slate-800 outline-none focus:ring-4 focus:ring-rose-500/20 text-lg"
                        />
                    </div>
                    <Link href="/simako/form-keluar" className="btn btn-primary px-8">Tambah Data</Link>
                </div>

                {/* Table Section */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="table w-full border-collapse">
                            <thead className="bg-white/10 text-white">
                                <tr>
                                    <th className="py-6 px-6 text-lg font-bold">#</th>
                                    <th className="py-6 px-6 text-lg font-bold">Pegawai</th>
                                    <th className="py-6 px-6 text-lg font-bold">Katim</th>
                                    <th className="py-6 px-6 text-lg font-bold">Keperluan</th>
                                    <th className="py-6 px-6 text-lg font-bold">Keluar</th>
                                    <th className="py-6 px-6 text-lg font-bold">Kembali</th>
                                    <th className="py-6 px-6 text-lg font-bold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/90">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-20"><span className="loading loading-spinner loading-lg"></span></td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-20 opacity-50 italic text-xl font-medium">Data tidak ditemukan</td></tr>
                                ) : (
                                    data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-white/10 border-b border-white/10 transition-colors">
                                            {/* NOMOR URUT BERDASARKAN PAGINATION */}
                                            <td className="py-4 px-6 font-bold text-white/50">
                                                {((currentPage - 1) * itemsPerPage) + (index + 1)}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-lg">{item.pegawai_name}</td>
                                            <td className="py-4 px-6 text-white/70">{item.katim_name}</td>
                                            <td className="py-4 px-6"><div className="line-clamp-2 w-48">{item.keperluan || '-'}</div></td>
                                            <td className="py-4 px-6 font-mono text-sm">
                                                {item.waktu_keluar && dayjs(item.waktu_keluar).isValid() ? dayjs(item.waktu_keluar).format("HH:mm") : '-'}
                                            </td>
                                            <td className="py-4 px-6 font-mono text-sm">
                                                {item.waktu_kembali && dayjs(item.waktu_kembali).isValid() ? dayjs(item.waktu_kembali).format("HH:mm") : <span className="text-rose-300 italic">Belum</span>}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button className="btn btn-circle btn-xs btn-ghost text-white"><span className="material-symbols-outlined text-sm">edit</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination UI Server-Side */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-black/20 text-white">
                        <span className="text-sm opacity-60">Page {currentPage} of {lastPage} (Total: {totalData} data)</span>
                        <div className="join">
                            <button className="join-item btn btn-sm bg-white/10 text-white" disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => p - 1)}>« Prev</button>
                            <button className="join-item btn btn-sm bg-white/10 text-white" disabled={currentPage === lastPage || loading} onClick={() => setCurrentPage(p => p + 1)}>Next »</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}