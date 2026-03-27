"use client";

import api from '@/utils/api';
import dayjs from 'dayjs';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface IzinKeluar {
    id: number;
    external_user_id: number;
    katim_id: number;
    pegawai_name?: string;
    katim_name?: string;
    keperluan: string;
    waktu_keluar: string | null;
    waktu_kembali: string | null;
    created_at: string;
}

export default function SimakoDashboard() {
    const [data, setData] = useState<IzinKeluar[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [totalToday, setTotalToday] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const itemsPerPage = 10;

    // State untuk Modal Update Manual
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [updateType, setUpdateType] = useState<'keluar' | 'kembali' | null>(null);
    const [manualDateTime, setManualDateTime] = useState("");

    const fetchData = useCallback(async (page: number, search: string) => {
        try {
            setLoading(true);
            let userIds: number[] = [];
            if (search.trim().length > 1) {
                const authSearch = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/users/search-ids?name=${search}`);
                userIds = authSearch.data || [];
            }

            const params = new URLSearchParams({
                page: page.toString(),
                search: search,
                user_ids: JSON.stringify(userIds),
                limit: itemsPerPage.toString()
            });

            const response = await api(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMAKO}/api/izin-keluar?${params}`);
            const izinData = response.data?.data || [];

            setTotalData(response.data?.total || 0);
            setLastPage(response.data?.last_page || 1);
            setTotalToday(response.data?.total_today || 0);

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
            console.log(mappedData);

            setData(mappedData);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const openModal = (id: number, type: 'keluar' | 'kembali') => {
        setSelectedId(id);
        setUpdateType(type);
        // Set default ke waktu sekarang dengan format yang dimengerti input datetime-local
        setManualDateTime(dayjs().format("YYYY-MM-DDTHH:mm"));
    };

    const handleSaveManual = async () => {
        if (!selectedId || !updateType || !manualDateTime) return;

        try {
            const currentItem = data.find(item => item.id === selectedId);

            // 1. Bersihkan manualDateTime dari huruf 'T' menjadi spasi
            // Hasil: "2026-03-27 16:43:00"
            const formattedTime = manualDateTime.replace('T', ' ') + ":00";

            let payload: any = {};

            if (updateType === 'keluar') {
                payload = { waktu_keluar: formattedTime };
            } else {
                // 2. PENTING: Bersihkan juga waktu_keluar yang lama dari database
                // Jika dari BE ada huruf 'T', 'Z', atau '.000000Z', kita bersihkan total
                const cleanWaktuKeluar = currentItem?.waktu_keluar
                    ? dayjs(currentItem.waktu_keluar).format("YYYY-MM-DD HH:mm:ss")
                    : null;

                payload = {
                    waktu_keluar: cleanWaktuKeluar,
                    waktu_kembali: formattedTime
                };
            }

            console.log("Payload yang dikirim ke BE:", payload); // Cek di console F12

            await api.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMAKO}/api/izin-keluar/${selectedId}`, payload);

            setSelectedId(null);
            fetchData(currentPage, searchTerm);

        } catch (err: any) {
            // Tampilkan pesan error detail dari Laravel jika ada
            const msg = err.response?.data?.message || "Gagal update data";
            const errors = err.response?.data?.errors;

            console.error("Detail Error:", errors);
            alert(`${msg} ${errors?.waktu_kembali ? '- ' + errors.waktu_kembali[0] : ''}`);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchData(currentPage, searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, fetchData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 pb-20 px-4 font-sans">
            <div className="max-w-7xl mx-auto py-12">

                {/* Header & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center text-white">
                        <p className="text-4xl font-black">{totalToday}</p>
                        <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Pengajuan Hari Ini</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center text-white">
                        <p className="text-4xl font-black">{totalData}</p>
                        <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Total Keseluruhan</p>
                    </div>
                </div>

                {/* Search Action Bar */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center border border-white/20 shadow-xl">
                    <Link href="/simako" className="btn btn-ghost text-white">Kembali</Link>
                    <div className="relative flex-1 w-full">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Cari pegawai atau keperluan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white text-slate-800 outline-none focus:ring-4 focus:ring-rose-500/20"
                        />
                    </div>
                    <Link href="/simako/form-keluar" className="btn btn-primary px-8 rounded-2xl">Tambah Data</Link>
                </div>

                {/* Table */}
                <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="table w-full text-white">
                            <thead className="bg-white/10 text-white border-b border-white/10">
                                <tr>
                                    {/* TAMBAHKAN HEADER NOMOR */}
                                    <th className="p-6 text-sm uppercase w-16">#</th>
                                    <th className="p-6 text-sm uppercase">Pegawai</th>
                                    <th className="p-6 text-sm uppercase">Keperluan</th>
                                    <th className="p-6 text-sm uppercase">Waktu Keluar</th>
                                    <th className="p-6 text-sm uppercase">Waktu Kembali</th>
                                    <th className="p-6 text-sm uppercase text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-20"><span className="loading loading-spinner loading-lg"></span></td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-20 opacity-50 italic">Tidak ada data ditemukan</td></tr>
                                ) : data.map((item, index) => (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        {/* KOLOM NUMBERING DENGAN LOGIKA PAGINATION */}
                                        <td className="p-6 font-bold opacity-50">
                                            {((currentPage - 1) * itemsPerPage) + (index + 1)}
                                        </td>

                                        <td className="p-4">
                                            <div className="font-bold text-lg">{item.pegawai_name}</div>
                                            <div className="text-xs opacity-50">Katim: {item.katim_name}</div>
                                        </td>
                                        <td className="p-4"><p className="line-clamp-2 w-48 text-sm opacity-80">{item.keperluan || '-'}</p></td>

                                        {/* TAMPILAN TANGGAL & JAM (SUDAH FIX WITA) */}
                                        <td className="p-4 font-mono text-sm">
                                            {item.waktu_keluar ? dayjs(item.waktu_keluar).format("DD/MM/YYYY HH:mm") : <span className="opacity-30 italic">Belum Set</span>}
                                        </td>
                                        <td className="p-4 font-mono text-sm">
                                            {item.waktu_kembali ? dayjs(item.waktu_kembali).format("DD/MM/YYYY HH:mm") : <span className="opacity-30 italic">Belum Kembali</span>}
                                        </td>

                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {!item.waktu_keluar && (
                                                    <button onClick={() => openModal(item.id, 'keluar')} className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 border-none text-white px-4">Set Keluar</button>
                                                )}
                                                {item.waktu_keluar && !item.waktu_kembali && (
                                                    <button onClick={() => openModal(item.id, 'kembali')} className="btn btn-xs bg-sky-500 hover:bg-sky-600 border-none text-white px-4">Set Kembali</button>
                                                )}
                                                {item.waktu_keluar && item.waktu_kembali && (
                                                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-tighter">
                                                        <span className="material-symbols-outlined text-sm">verified</span> Selesai
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center p-6 bg-black/20 text-white">
                        <span className="text-xs opacity-60">Halaman {currentPage} dari {lastPage}</span>
                        <div className="join">
                            <button className="join-item btn btn-xs bg-white/10 text-white" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>« Prev</button>
                            <button className="join-item btn btn-xs bg-white/10 text-white" disabled={currentPage === lastPage} onClick={() => setCurrentPage(p => p + 1)}>Next »</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL UPDATE MANUAL */}
            <AnimatePresence>
                {selectedId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-slate-800"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${updateType === 'keluar' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                                <span className="material-symbols-outlined">{updateType === 'keluar' ? 'logout' : 'login'}</span>
                            </div>
                            <h3 className="text-2xl font-black mb-1 uppercase tracking-tight">
                                Update {updateType}
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Pilih tanggal dan jam pengajuan secara manual.</p>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label text-xs font-bold text-slate-400 uppercase">Input Tanggal & Waktu</label>
                                    <input
                                        type="datetime-local"
                                        className="input input-bordered w-full bg-slate-50 focus:ring-2 focus:ring-rose-500 border-slate-200 text-lg rounded-2xl"
                                        value={manualDateTime}
                                        onChange={(e) => setManualDateTime(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setSelectedId(null)}
                                        className="btn flex-1 rounded-2xl bg-slate-100 hover:bg-slate-200 border-none text-slate-500 font-bold"
                                    >Batal</button>
                                    <button
                                        onClick={handleSaveManual}
                                        className="btn flex-1 rounded-2xl bg-rose-500 hover:bg-rose-600 border-none text-white font-bold"
                                    >Simpan Data</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}