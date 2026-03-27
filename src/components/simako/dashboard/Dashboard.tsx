"use client";

import api from '@/utils/api';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface IzinKeluar {
    id: number;
    pegawai_name?: string;
    katim_name?: string;
    keperluan: string;
    waktu_keluar: string;
    waktu_kembali: string;
    status?: 'pending' | 'approved' | 'rejected';
    created_at?: string;
}

export default function SimakoDashboard() {
    const [data, setData] = useState<IzinKeluar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMAKO}/api/izin-keluar`);
            setData(response.data || []);
            console.log(response.data);

            setError(null);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError('Gagal memuat data izin keluar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = Array.isArray(data)
        ? data.filter(item => {
            const search = searchTerm.toLowerCase();

            // Safety check dengan Optional Chaining dan Fallback String
            const name = item?.pegawai_name?.toLowerCase() ?? '';
            const katim = item?.katim_name?.toLowerCase() ?? '';
            const need = item?.keperluan?.toLowerCase() ?? '';

            return name.includes(search) ||
                katim.includes(search) ||
                need.includes(search);
        })
        : [];

    const formatDateTime = (datetime: string) => {
        return new Date(datetime).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500/90 text-white';
            case 'rejected': return 'bg-red-500/90 text-white';
            default: return 'bg-amber-500/90 text-white';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 flex items-center justify-center font-sans">
                <div className="text-white text-center">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xl font-medium">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 relative overflow-hidden font-sans">
            {/* Background particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white/30 rounded-full"
                        style={{ left: `${20 + i * 15}%`, top: `${10 + i * 20}%` }}
                        animate={{ y: [0, -30, 0], scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 4 + i, repeat: Infinity, repeatType: "reverse" }}
                    />
                ))}
            </div>

            <div className="relative z-10 py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <Image
                            src="/assets/images/bpom.webp"
                            alt="BPOM Logo"
                            width={80}
                            height={80}
                            className="mx-auto mb-6 opacity-90 drop-shadow-lg"
                        />
                        <h1 className="text-4xl lg:text-6xl font-black text-white mb-4 drop-shadow-md bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent">
                            Dashboard Izin Keluar
                        </h1>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                            Daftar seluruh pengajuan izin keluar pegawai
                        </p>
                    </motion.div>

                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between"
                    >
                        <Link href="/simako" className="btn btn-ghost text-white border-white/30 hover:bg-white/20">
                            <span className="material-symbols-outlined mr-2">arrow_back</span>
                            Kembali ke Simako
                        </Link>
                        <div className="flex-1 lg:flex-none lg:w-80">
                            <input
                                type="text"
                                placeholder="Cari pegawai, katim, atau keperluan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-6 py-3 rounded-2xl bg-white/90 text-slate-800 border border-white/30 focus:bg-white focus:ring-4 focus:ring-rose-500/30 focus:border-transparent outline-none text-lg"
                            />
                        </div>
                        <button
                            onClick={fetchData}
                            className="btn bg-gradient-to-r from-emerald-500 to-teal-600 border-none hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-xl"
                            disabled={loading}
                        >
                            <span className="material-symbols-outlined mr-2">refresh</span>
                            Refresh
                        </button>
                    </motion.div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-500/20 border border-red-500/50 text-red-100 p-6 rounded-3xl backdrop-blur-xl text-center mb-8 max-w-2xl mx-auto"
                            >
                                <span className="material-symbols-outlined text-4xl mb-4 block">error</span>
                                <p className="text-xl font-bold mb-2">{error}</p>
                                <button onClick={fetchData} className="btn btn-ghost text-red-100 border-red-100/50 hover:bg-red-500/20">
                                    Coba Lagi
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 hidden lg:grid">
                        <motion.div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <p className="text-3xl font-black text-white mb-2">
                                {Array.isArray(data) ? data.length : 0}
                            </p>
                            <p className="text-white/80 font-medium">Total Pengajuan</p>
                        </motion.div>

                        <motion.div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <p className="text-3xl font-black text-emerald-400 mb-2">
                                {Array.isArray(data) ? data.filter(d => d?.status === 'approved').length : 0}
                            </p>
                            <p className="text-white/80 font-medium">Disetujui</p>
                        </motion.div>

                        <motion.div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <p className="text-3xl font-black text-amber-400 mb-2">
                                {Array.isArray(data) ? data.filter(d => d?.status === 'pending').length : 0}
                            </p>
                            <p className="text-white/80 font-medium">Pending</p>
                        </motion.div>
                    </div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl"
                    >
                        <div className="overflow-x-auto">
                            <table className="table w-full border-collapse">
                                <thead className="bg-white/20 sticky top-0 backdrop-blur-xl z-10">
                                    <tr>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8">#</th>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8">Pegawai</th>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8">Katim</th>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8">Keperluan</th>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8">Keluar</th>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8">Kembali</th>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8">Status</th>
                                        <th className="bg-transparent text-white/95 font-bold text-lg py-6 px-4 lg:px-8 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-20">
                                                <span className="material-symbols-outlined text-6xl text-white/50 mb-4 block">visibility_off</span>
                                                <p className="text-2xl text-white/70 font-medium mb-2">Tidak ada data</p>
                                                <p className="text-white/50">{searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada pengajuan izin keluar'}</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/10 transition-colors duration-200 border-b border-white/10">
                                                <td className="font-bold text-white/90 py-6 px-4 lg:px-8">#{item.id}</td>
                                                <td className="font-semibold text-white/95 py-4 px-4 lg:px-8 max-w-md truncate">{item.pegawai_name || 'N/A'}</td>
                                                <td className="font-semibold text-white/90 py-4 px-4 lg:px-8">{item.katim_name || 'N/A'}</td>
                                                <td className="max-w-lg py-4 px-4 lg:px-8" title={item.keperluan}>
                                                    <div className="line-clamp-2 text-white/90">{item.keperluan}</div>
                                                </td>
                                                <td className="text-white/90 py-4 px-4 lg:px-8 whitespace-nowrap font-mono text-sm">{formatDateTime(item.waktu_keluar)}</td>
                                                <td className="text-white/90 py-4 px-4 lg:px-8 whitespace-nowrap font-mono text-sm">{formatDateTime(item.waktu_kembali)}</td>
                                                <td className="py-4 px-4 lg:px-8">
                                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(item.status)} shadow-lg`}>
                                                        {item.status?.toUpperCase() || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 lg:px-8 whitespace-nowrap">
                                                    <div className="flex gap-2 justify-center">
                                                        <button className="btn btn-xs btn-info text-white border-white/50 hover:bg-info/40">
                                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                                        </button>
                                                        <button className="btn btn-xs btn-warning text-white border-white/50 hover:bg-warning/40">
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Info */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-center text-white/70 text-sm mt-8 py-6 bg-white/5 rounded-2xl border border-white/10"
                    >
                        Klik Refresh untuk update data terbaru • Data diurutkan terbaru
                    </motion.p>
                </div>
            </div>
        </div>
    );
}