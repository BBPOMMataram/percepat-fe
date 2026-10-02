/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import api from "@/utils/axios";
import { toast } from "react-toastify";
import Link from "next/link";

export default function MobilUserDashboard() {
    const [pengajuans, setPengajuans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA;

    const fetchUserPengajuan = async () => {
        setIsLoading(true);
        try {
            // Asumsi API endpoint untuk mengambil riwayat mobil user
            const res = await api.get(`${baseURL}/api/paula/user/mobil`);
            setPengajuans(res.data.data || res.data || []);
        } catch (error) {
            toast.error("Gagal mengambil riwayat pengajuan mobil");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserPengajuan();
    }, [baseURL]);

    const handleDelete = async (id: number) => {
        if (!confirm("Batalkan/hapus pengajuan peminjaman mobil ini?")) return;
        try {
            await api.delete(`${baseURL}/api/paula/user/mobil/${id}`);
            toast.success("Pengajuan dihapus");
            fetchUserPengajuan();
        } catch (error) {
            toast.error("Gagal menghapus pengajuan");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-indigo-600"></span>
            </div>
        );
    }

    return (
        <div className="max-w-screen-xl mx-auto animate-in fade-in duration-500 pb-16 px-4 md:px-8">
            <div className="mb-8 mt-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Riwayat Pengajuan Mobil</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Kelola dan pantau status peminjaman kendaraan dinas yang Anda ajukan.</p>
                </div>
                <Link href="/paula/mobil/pengajuan" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span> Buat Pengajuan Baru
                </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                                <th className="px-6 py-4">Tgl Pengajuan</th>
                                <th className="px-6 py-4">Tujuan Dinas</th>
                                <th className="px-6 py-4">Waktu Peminjaman</th>
                                <th className="px-6 py-4">Mobil & Driver</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {pengajuans.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                        {new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{p.tujuan_dinas}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                                            {p.tujuan_lokasi}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-slate-800">
                                            {new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}
                                            {p.tanggal_kembali && p.tanggal_kembali !== p.tanggal_pinjam && ` - ${new Date(p.tanggal_kembali).toLocaleDateString('id-ID')}`}
                                        </div>
                                        <div className="text-xs text-indigo-600 font-bold mt-0.5">
                                            {p.waktu_mulai?.slice(0,5)} {p.waktu_selesai ? `- ${p.waktu_selesai?.slice(0,5)}` : ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{p.kendaraan || 'Belum di-assign'}</div>
                                        {p.driver && <div className="text-xs text-slate-500">Driver: {p.driver}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.is_approved ? (
                                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Disetujui</span>
                                        ) : p.status === 'ditolak' ? (
                                            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Ditolak</span>
                                        ) : (
                                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold inline-block">Menunggu Persetujuan</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {!p.is_approved && p.status !== 'ditolak' && (
                                            <button onClick={() => handleDelete(p.id)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold transition flex justify-center w-full shadow-sm cursor-pointer">
                                                Batalkan
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {pengajuans.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium">Anda belum memiliki riwayat pengajuan peminjaman mobil.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}