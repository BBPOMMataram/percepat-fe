"use client";

import { showAlert } from '@/features/alertSlice';
import { getUser, logout } from '@/features/authSlice';
import { AppDispatch } from '@/redux/store';
import api from '@/utils/api';
import dayjs from 'dayjs';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface IzinKeluar {
    id: number;
    id_pegawai: number;
    created_by: number;
    katim_id: number;
    pegawai_name?: string;
    katim_name?: string;
    keperluan: string;
    waktu_keluar: string | null;
    waktu_kembali: string | null;
    created_at: string;
}

export default function SimakoDashboard() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { user } = useSelector((state: any) => state.auth);
    const [data, setData] = useState<IzinKeluar[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [totalToday, setTotalToday] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const itemsPerPage = 10;
    const [filterToday, setFilterToday] = useState(false);

    // State untuk Modal Hari Ini
    const [showTodayModal, setShowTodayModal] = useState(false);
    const [todayList, setTodayList] = useState<IzinKeluar[]>([]);
    const [loadingToday, setLoadingToday] = useState(false);

    // State untuk Modal Update Manual
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [updateType, setUpdateType] = useState<'keluar' | 'kembali' | 'edit' | null>(null);
    const [editKeperluan, setEditKeperluan] = useState("");
    const [editWaktuKeluar, setEditWaktuKeluar] = useState("");
    const [editWaktuKembali, setEditWaktuKembali] = useState("");

    const fetchData = useCallback(async (page: number, search: string) => {
        try {
            setLoading(true);
            let userIds: number[] = [];
            if (search.trim().length > 1) {
                const authSearch = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/search-user-ids?name=${search}`);
                userIds = authSearch.data || [];
            }

            const params = new URLSearchParams({
                page: page.toString(),
                search: search,
                user_ids: JSON.stringify(userIds),
                limit: itemsPerPage.toString(),
                today: filterToday ? '1' : '0'
            });

            const response = await api(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMAKO}/api/izin-keluar?${params}`);
            const izinData = response.data?.data || [];

            setTotalData(response.data?.total || 0);
            setLastPage(response.data?.last_page || 1);
            setTotalToday(response.data?.total_today || 0);

            const uniqueIds = new Set<number>();
            izinData.forEach((item: any) => {
                if (item.external_user_id) uniqueIds.add(item.external_user_id);
                if (item.created_by) uniqueIds.add(item.created_by);
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterToday]);

    const fetchTodayList = async () => {
        try {
            setLoadingToday(true);
            setShowTodayModal(true);

            const params = new URLSearchParams({
                today: '1',
                limit: '100' // Ambil semua yang keluar hari ini
            });

            const response = await api(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMAKO}/api/izin-keluar?${params}`);

            // Filter manual: Menampilkan semua data HARI INI (baik yang sudah kembali maupun belum)
            const rawData = response.data?.data || [];
            const izinData = rawData.filter((item: any) => {
                return dayjs(item.created_at).isSame(dayjs(), 'day') ||
                    (item.waktu_keluar && dayjs(item.waktu_keluar).isSame(dayjs(), 'day'));
            });

            // Batch Fetch Nama Pegawai
            const uniqueIds = new Set<number>();
            izinData.forEach((item: any) => {
                if (item.external_user_id) uniqueIds.add(item.external_user_id);
                if (item.created_by) uniqueIds.add(item.created_by);
                if (item.katim_id) uniqueIds.add(item.katim_id);
            });

            if (uniqueIds.size > 0) {
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
                setTodayList(mappedData);
            } else {
                setTodayList([]);
            }
        } catch (err) {
            console.error(err);
            setTodayList([]);
        } finally {
            setLoadingToday(false);
        }
    };

    const openModal = (item: IzinKeluar, type: 'keluar' | 'kembali' | 'edit') => {
        setSelectedId(item.id);
        setUpdateType(type);
        setEditKeperluan(item.keperluan || "");
        setEditWaktuKeluar(item.waktu_keluar ? dayjs(item.waktu_keluar).format("YYYY-MM-DDTHH:mm") : "");
        setEditWaktuKembali(item.waktu_kembali ? dayjs(item.waktu_kembali).format("YYYY-MM-DDTHH:mm") : "");

        // Otomatis set waktu sekarang jika tombol "Set Keluar/Kembali" diklik pada data yang masih kosong
        if (type === 'keluar' && !item.waktu_keluar) {
            setEditWaktuKeluar(dayjs().format("YYYY-MM-DDTHH:mm"));
        } else if (type === 'kembali' && !item.waktu_kembali) {
            setEditWaktuKembali(dayjs().format("YYYY-MM-DDTHH:mm"));
        }
    };

    const handleSaveManual = async () => {
        if (!selectedId) return;

        try {
            const payload = {
                keperluan: editKeperluan,
                waktu_keluar: editWaktuKeluar ? dayjs(editWaktuKeluar).format("YYYY-MM-DD HH:mm:ss") : null,
                waktu_kembali: editWaktuKembali ? dayjs(editWaktuKembali).format("YYYY-MM-DD HH:mm:ss") : null,
            };

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

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data pengajuan ini?")) return;

        try {
            await api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMAKO}/api/izin-keluar/${id}`);
            fetchData(currentPage, searchTerm);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menghapus data");
        }
    };

    useEffect(() => {
        dispatch(getUser() as any);
    }, [dispatch]);

    useEffect(() => {
        const timer = setTimeout(() => fetchData(currentPage, searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, filterToday, fetchData]);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(showAlert({
            type: 'success',
            message: 'You have been logged out',
            description: 'logout success'
        }));
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 pb-20 px-4 font-sans">
            {/* Floating Logout Button */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={handleLogout}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-all duration-300 shadow-xl group"
                    title="Logout"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                        logout
                    </span>
                </button>
            </div>

            <div className="max-w-7xl mx-auto py-12">

                {/* Header & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div
                        onClick={fetchTodayList}
                        className="cursor-pointer transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] active:scale-95 shadow-xl bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl p-6 text-center text-white"
                    >
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
                                            {item.waktu_keluar ? (
                                                dayjs(item.waktu_keluar).format("DD/MM/YYYY HH:mm")
                                            ) : (user?.employee?.is_security) ? (
                                                <button
                                                    onClick={() => openModal(item, 'keluar')}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-emerald-500/40 font-bold text-[10px] uppercase tracking-wider group shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">logout</span>
                                                    Set Keluar
                                                </button>
                                            ) : (
                                                <span className="opacity-30 italic">Belum diset</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-sm">
                                            {item.waktu_kembali ? (
                                                dayjs(item.waktu_kembali).format("DD/MM/YYYY HH:mm")
                                            ) : (user?.employee?.is_security) && item.waktu_keluar ? (
                                                <button
                                                    onClick={() => openModal(item, 'kembali')}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-white transition-all duration-300 border border-sky-500/40 font-bold text-[10px] uppercase tracking-wider group shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:-translate-x-1">login</span>
                                                    Set Kembali
                                                </button>
                                            ) : (
                                                <span className="opacity-30 italic">{item.waktu_keluar ? 'Belum Kembali' : 'Belum diset'}</span>
                                            )}
                                        </td>

                                        <td className="p-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                {/* Tombol Ubah: Hanya bisa diakses oleh Security */}
                                                {user?.employee?.is_security && (
                                                    <button
                                                        onClick={() => openModal(item, 'edit')}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-sky-500/50 text-sky-400 hover:bg-sky-500 hover:text-white transition-all duration-300 border border-sky-500/40 group shadow-sm"
                                                        title="Edit Waktu"
                                                    >
                                                        <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:rotate-12">edit</span>
                                                    </button>
                                                )}

                                                {/* Tombol Hapus: Hanya jika pemilik data DAN belum set waktu keluar */}
                                                {(item.created_by === user?.id && !item.waktu_keluar) && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-rose-500/40 group shadow-sm"
                                                        title="Hapus Data"
                                                    >
                                                        <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:scale-110">delete</span>
                                                    </button>
                                                )}

                                                {/* Status Selesai: Tampilkan jika data lengkap dan user tidak punya akses edit */}
                                                {item.waktu_keluar && item.waktu_kembali && !user?.employee?.is_security && (
                                                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-tighter">
                                                        <span className="material-symbols-outlined text-sm">verified</span> Selesai
                                                    </div>
                                                )}

                                                {/* Fallback jika tidak ada aksi yang tersedia */}
                                                {!user?.employee?.is_security && !(item.created_by === user?.id && !item.waktu_keluar) && (!item.waktu_keluar || !item.waktu_kembali) && (
                                                    <span className="text-[10px] opacity-20 italic">No Action</span>
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

            {/* MODAL LIST PEGAWAI HARI INI */}
            <AnimatePresence>
                {showTodayModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Pengajuan Hari Ini</h3>
                                    <p className="text-sm text-slate-500 font-medium">Menampilkan {todayList.length} pengajuan untuk hari ini</p>
                                </div>
                                <button
                                    onClick={() => setShowTodayModal(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 flex-1">
                                {loadingToday ? (
                                    <div className="py-20 text-center"><span className="loading loading-spinner loading-lg text-rose-500"></span></div>
                                ) : todayList.length === 0 ? (
                                    <div className="py-20 text-center opacity-40 italic font-medium">Tidak ada data untuk hari ini</div>
                                ) : (
                                    <div className="space-y-3">
                                        {todayList.map((item) => (
                                            <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-rose-200 hover:bg-rose-50/30 transition-all">
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-800">{item.pegawai_name}</div>
                                                    <div className="text-xs text-slate-500 line-clamp-1">{item.keperluan}</div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-600 shadow-sm">
                                                        <span className="material-symbols-outlined text-sm text-emerald-500">logout</span>
                                                        {item.waktu_keluar ? dayjs(item.waktu_keluar).format("HH:mm") : '--:--'}
                                                    </div>
                                                    {item.waktu_kembali ? (
                                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-600 shadow-sm">
                                                            <span className="material-symbols-outlined text-sm text-sky-500">login</span>
                                                            {dayjs(item.waktu_kembali).format("HH:mm")}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter mr-2 animate-pulse">Belum Kembali</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                                <button
                                    onClick={() => setShowTodayModal(false)}
                                    className="btn btn-ghost btn-sm text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                                >Tutup Jendela</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                <span className="material-symbols-outlined">{updateType === 'keluar' ? 'logout' : updateType === 'kembali' ? 'login' : 'edit_note'}</span>
                            </div>
                            <h3 className="text-2xl font-black mb-1 uppercase tracking-tight">
                                {updateType === 'edit' ? 'Edit Data Izin' : `Update ${updateType}`}
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Sesuaikan detail data pengajuan izin keluar.</p>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label text-xs font-bold text-slate-400 uppercase">Keperluan</label>
                                    <textarea
                                        className="textarea textarea-bordered w-full bg-slate-50 focus:ring-2 focus:ring-rose-500 border-slate-200 rounded-2xl min-h-[80px]"
                                        value={editKeperluan}
                                        onChange={(e) => setEditKeperluan(e.target.value)}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label text-xs font-bold text-slate-400 uppercase">Waktu Keluar</label>
                                    <input
                                        type="datetime-local"
                                        className="input input-bordered w-full bg-slate-50 focus:ring-2 focus:ring-rose-500 border-slate-200 rounded-2xl"
                                        value={editWaktuKeluar}
                                        onChange={(e) => setEditWaktuKeluar(e.target.value)}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label text-xs font-bold text-slate-400 uppercase">Waktu Kembali</label>
                                    <input
                                        type="datetime-local"
                                        className="input input-bordered w-full bg-slate-50 focus:ring-2 focus:ring-rose-500 border-slate-200 rounded-2xl"
                                        value={editWaktuKembali}
                                        onChange={(e) => setEditWaktuKembali(e.target.value)}
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