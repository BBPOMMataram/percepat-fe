/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/axios"; // Pastikan menggunakan utils/axios yang baru
import { toast } from "react-toastify";
import Link from "next/link";

export default function DashboardPaulaAdmin() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState<'aula' | 'mobil'>('aula');
    const [isLoading, setIsLoading] = useState(true);

    // STATE AULA
    const [pengajuans, setPengajuans] = useState<any[]>([]);
    const [editRequests, setEditRequests] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [settings, setSettings] = useState({ max_booking_days: 7, max_peserta_besar: 100, max_peserta_kecil: 50 });
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // STATE MOBIL
    const [mobilPengajuans, setMobilPengajuans] = useState<any[]>([]);
    const [mobilPending, setMobilPending] = useState<any[]>([]);
    const [masterMobils, setMasterMobils] = useState<any[]>([]);
    const [showMobilModal, setShowMobilModal] = useState(false);
    const [formMobil, setFormMobil] = useState({ id: null, nama: "", plat_nomor: "", kapasitas: "", status: "tersedia" });

    // STATE UMUM (REJECT)
    const [rejectModal, setRejectModal] = useState<{ id: number, type: 'pengajuan' | 'edit' | 'pengajuan_mobil' } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA;

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (authLoading === false && !user) {
            router.push(`/login?redirectUrl=${pathname}`);
        }
    }, [user, authLoading, router, pathname]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Ambil Data Aula
            const resAula = await api.get(`${baseURL}/api/paula/admin/dashboard`);
            setPengajuans(resAula.data.pengajuans || []);
            setEditRequests(resAula.data.pengajuanEditRequests || []);
            setPendingRequests(resAula.data.pendingPengajuan || []);
            
            // Ambil Data Mobil
            const resMobil = await api.get(`${baseURL}/api/paula/admin/mobil/dashboard`);
            setMobilPengajuans(resMobil.data.pengajuans || []);
            setMobilPending(resMobil.data.pendingPengajuan || []);

            const resMaster = await api.get(`${baseURL}/api/paula/mobils`);
            setMasterMobils(resMaster.data.data || resMaster.data || []);
            
            // Pengaturan
            const resSet = await api.get(`${baseURL}/api/paula/settings`);
            setSettings(resSet.data);
            
        } catch (error) {
            toast.error("Gagal mengambil data dashboard admin");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const isSuperadmin = user.role?.level === 'superadmin';
            const isAdmin = user.role?.level === 'admin'; 

            if (!isAdmin && !isSuperadmin) {
                router.replace('/unauthorized');
            } else {
                fetchData();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, router]);

    // ================== LOGIKA AULA ==================
    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`${baseURL}/api/paula/admin/settings`, settings);
            toast.success("Pengaturan sistem aula berhasil disimpan");
            setShowSettingsModal(false);
        } catch (error) { toast.error("Gagal menyimpan pengaturan"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus pengajuan ini secara permanen?")) return;
        try {
            await api.delete(`${baseURL}/api/paula/admin/pengajuan/${id}`);
            toast.success("Pengajuan berhasil dihapus");
            fetchData();
        } catch (error) { toast.error("Gagal menghapus pengajuan"); }
    };

    const handleApprovePengajuan = async (id: number) => {
        try {
            await api.patch(`${baseURL}/api/paula/admin/approve-pengajuan/${id}`);
            toast.success("Pengajuan disetujui");
            fetchData();
        } catch (error) { toast.error("Gagal menyetujui pengajuan"); }
    };

    const handleApproveEdit = async (id: number) => {
        try {
            await api.patch(`${baseURL}/api/paula/admin/approve-edit/${id}`, { approval: true });
            toast.success("Izin edit diberikan kepada user");
            fetchData();
        } catch (error) { toast.error("Gagal memberikan izin edit"); }
    };

    const handleApproveMobil = async (id: number) => {
        try {
            await api.patch(`${baseURL}/api/paula/admin/mobil/approve-pengajuan/${id}`);
            toast.success("Peminjaman Mobil disetujui");
            fetchData();
        } catch (error) { toast.error("Gagal menyetujui pengajuan"); }
    };

    const handleDeleteMobil = async (id: number) => {
        if (!confirm("Hapus pengajuan mobil ini?")) return;
        try {
            await api.delete(`${baseURL}/api/paula/admin/mobil/pengajuan/${id}`);
            toast.success("Pengajuan berhasil dihapus");
            fetchData();
        } catch (error) { toast.error("Gagal menghapus pengajuan"); }
    };

    const saveMasterMobil = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formMobil.id) {
                await api.put(`${baseURL}/api/paula/admin/mobil/${formMobil.id}`, formMobil);
                toast.success("Data mobil diperbarui");
            } else {
                await api.post(`${baseURL}/api/paula/admin/mobil`, formMobil);
                toast.success("Mobil baru ditambahkan");
            }
            setShowMobilModal(false);
            fetchData();
        } catch (error) { toast.error("Gagal menyimpan data mobil"); }
    };

    const deleteMasterMobil = async (id: number) => {
        if (!confirm("Hapus mobil ini dari daftar master?")) return;
        try {
            await api.delete(`${baseURL}/api/paula/admin/mobil/${id}`);
            toast.success("Mobil dihapus");
            fetchData();
        } catch (error) { toast.error("Gagal menghapus mobil"); }
    };

    const submitReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectModal || !rejectReason) return;

        try {
            let url = "";
            if (rejectModal.type === 'pengajuan') url = `${baseURL}/api/paula/admin/reject-pengajuan/${rejectModal.id}`;
            else if (rejectModal.type === 'edit') url = `${baseURL}/api/paula/admin/reject-edit/${rejectModal.id}`;
            else if (rejectModal.type === 'pengajuan_mobil') url = `${baseURL}/api/paula/admin/mobil/reject-pengajuan/${rejectModal.id}`;
            
            await api.patch(url, { edit_reject_reason: rejectReason });
            toast.success("Penolakan berhasil dikirim");
            setRejectModal(null);
            setRejectReason("");
            fetchData();
        } catch (error) {
            toast.error("Gagal memproses penolakan");
        }
    };


    if (authLoading || isLoading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center mt-5">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    return (
        <div className="max-w-screen-2xl mx-auto animate-in fade-in duration-500 pb-16 px-4 md:px-8">
            
            <div className="mt-5 mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Dashboard Admin</h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">Kelola persetujuan, jadwal, dan konfigurasi layanan PAULA.</p>
            </div>

            {/* SWITCH TAB AULA / MOBIL */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                <button 
                    onClick={() => setActiveTab('aula')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                        activeTab === 'aula' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                    Peminjaman Aula
                    {(pendingRequests.length > 0 || editRequests.length > 0) && (
                        <span className="bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{pendingRequests.length + editRequests.length}</span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('mobil')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                        activeTab === 'mobil' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">directions_car</span>
                    Peminjaman Mobil Dinas
                    {mobilPending.length > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{mobilPending.length}</span>
                    )}
                </button>
            </div>


            {/* KONTEN TAB AULA */}
            {activeTab === 'aula' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setShowSettingsModal(true)} 
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md shadow-slate-900/10 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">settings</span> Pengaturan Sistem Aula
                        </button>
                    </div>

                    {pendingRequests.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Menunggu Persetujuan Baru (Dari User Biasa)</h2>
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-blue-50/70 border border-blue-200 text-blue-900 px-6 py-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                                    <p className="font-medium text-sm">Pengajuan baru dari <strong className="text-blue-950">{req.user?.name}</strong> untuk kegiatan "{req.nama_kegiatan}"</p>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button onClick={() => handleApprovePengajuan(req.id)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">Izinkan</button>
                                        <button onClick={() => setRejectModal({ id: req.id, type: 'pengajuan' })} className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">Tolak</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {editRequests.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Permintaan Edit Pengajuan</h2>
                            {editRequests.map(req => (
                                <div key={req.id} className="bg-amber-50/70 border border-amber-200 text-amber-900 px-6 py-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                                    <p className="font-medium text-sm">User <strong className="text-amber-950">{req.user?.name}</strong> meminta izin edit data kegiatan "{req.nama_kegiatan}"</p>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button onClick={() => handleApproveEdit(req.id)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">Izinkan</button>
                                        <button onClick={() => setRejectModal({ id: req.id, type: 'edit' })} className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">Tolak</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-800 text-lg">Daftar Jadwal & Pengajuan Disetujui</h3>
                            <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">{pengajuans.length} Kegiatan</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm min-w-[1100px]">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                                        <th className="px-6 py-4">Tgl Pengajuan</th>
                                        <th className="px-6 py-4">Nama Kegiatan</th>
                                        <th className="px-6 py-4">Pengusul</th>
                                        <th className="px-6 py-4">Pelaksanaan</th>
                                        <th className="px-6 py-4">Aula</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {pengajuans.map((p) => {
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900">{p.nama_kegiatan}</td>
                                                <td className="px-6 py-4 font-medium">{p.fungsi_pengusul}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-slate-800">{new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</div>
                                                    <div className="text-xs text-blue-600 font-bold mt-0.5">{p.waktu_mulai.slice(0,5)} - {p.waktu_selesai.slice(0,5)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${p.aula === 'besar' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                                                        {p.aula}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link href={`/paula/admin/pengajuan/${p.id}/edit`} className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center w-8 h-8 shadow-sm">
                                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        </Link>
                                                        <button onClick={() => handleDelete(p.id)} className="bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center w-8 h-8 shadow-sm">
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {pengajuans.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium">Belum ada data pengajuan aula yang disetujui.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* KONTEN TAB MOBIL DINAS */}
            {activeTab === 'mobil' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => {
                                setFormMobil({ id: null, nama: "", plat_nomor: "", kapasitas: "", status: "tersedia" });
                                setShowMobilModal(true);
                            }} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span> Tambah Master Kendaraan
                        </button>
                    </div>

                    {/* DAFTAR MASTER KENDARAAN (KHUSUS ADMIN) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {masterMobils.map(mobil => (
                            <div key={mobil.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-slate-100 text-slate-700 text-xs font-black px-2 py-1 rounded tracking-widest uppercase border border-slate-300">{mobil.plat_nomor}</div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setFormMobil(mobil); setShowMobilModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                        <button onClick={() => deleteMasterMobil(mobil.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-3">{mobil.nama}</h3>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-auto">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span> {mobil.kapasitas} Org</span>
                                    <span className={`px-2 py-0.5 rounded ${mobil.status === 'tersedia' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{mobil.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* NOTIFIKASI PENGAJUAN MOBIL BARU */}
                    {mobilPending.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Permohonan Mobil (Menunggu Persetujuan)</h2>
                            {mobilPending.map(req => (
                                <div key={req.id} className="bg-indigo-50/70 border border-indigo-200 text-indigo-900 px-6 py-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">User <strong className="text-indigo-950">{req.user?.name}</strong> mengajukan <strong className="text-indigo-700">{req.kendaraan}</strong></p>
                                        <p className="text-xs mt-1 text-indigo-800 font-medium">{req.tujuan_dinas} ({new Date(req.tanggal_pinjam).toLocaleDateString('id-ID')})</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button onClick={() => handleApproveMobil(req.id)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">Izinkan</button>
                                        <button onClick={() => setRejectModal({ id: req.id, type: 'pengajuan_mobil' })} className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">Tolak</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TABEL PENGAJUAN MOBIL DISETUJUI */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-800 text-lg">Daftar Peminjaman Mobil Disetujui</h3>
                            <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs">{mobilPengajuans.length} Kendaraan</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm min-w-[1100px]">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                                        <th className="px-6 py-4">Tgl Pengajuan</th>
                                        <th className="px-6 py-4">Tujuan</th>
                                        <th className="px-6 py-4">Pengusul</th>
                                        <th className="px-6 py-4">Waktu Peminjaman</th>
                                        <th className="px-6 py-4">Mobil & Driver</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {mobilPengajuans.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{p.tujuan_dinas}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[12px]">location_on</span> {p.tujuan_lokasi}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{p.fungsi_pengusul}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-slate-800">{new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</div>
                                                <div className="text-xs text-indigo-600 font-bold mt-0.5">{p.waktu_mulai?.slice(0,5)} {p.waktu_selesai ? `- ${p.waktu_selesai?.slice(0,5)}` : ''}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold">{p.kendaraan}</div>
                                                {p.driver && <div className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded inline-block">Driver: {p.driver}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => handleDeleteMobil(p.id)} className="bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center w-8 h-8 shadow-sm mx-auto" title="Hapus">
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {mobilPengajuans.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium">Belum ada data peminjaman mobil yang disetujui.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PENOLAKAN (GLOBAL AULA & MOBIL) */}
            {rejectModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black text-slate-800">Alasan Penolakan</h3>
                            <button onClick={() => setRejectModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={submitReject}>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 min-h-[120px] resize-none font-medium text-sm"
                                placeholder="Tuliskan alasan penolakan di sini..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                required
                            />
                            <div className="flex justify-end gap-3 mt-5">
                                <button type="button" onClick={() => setRejectModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm">Batal</button>
                                <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition flex items-center gap-2 cursor-pointer text-sm">
                                    <span className="material-symbols-outlined text-[18px]">send</span> Kirim Penolakan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL MASTER KENDARAAN (MOBIL) */}
            {showMobilModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-slate-800 mb-6">{formMobil.id ? 'Edit' : 'Tambah'} Master Kendaraan</h3>
                        
                        <form onSubmit={saveMasterMobil} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Nama Mobil (Merk & Warna)</label>
                                <input type="text" required value={formMobil.nama} onChange={e => setFormMobil({...formMobil, nama: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Plat Nomor</label>
                                    <input type="text" required value={formMobil.plat_nomor} onChange={e => setFormMobil({...formMobil, plat_nomor: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm uppercase" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Kapasitas (Orang)</label>
                                    <input type="number" min="1" required value={formMobil.kapasitas} onChange={e => setFormMobil({...formMobil, kapasitas: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Status Kendaraan</label>
                                <select required value={formMobil.status} onChange={e => setFormMobil({...formMobil, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm">
                                    <option value="tersedia">Tersedia</option>
                                    <option value="perbaikan">Sedang Diperbaiki</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setShowMobilModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm">Batal</button>
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition cursor-pointer text-sm">Simpan Mobil</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PENGATURAN SISTEM AULA (SEBELUMNYA) */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-slate-800 mb-1">Pengaturan Sistem Aula</h3>
                        <p className="text-slate-500 text-xs mb-6 font-medium">Atur batas waktu pemesanan dan kapasitas maksimal aula.</p>
                        
                        <form onSubmit={saveSettings} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Batas Hari Peminjaman (H+)</label>
                                <input type="number" min="1" required value={settings.max_booking_days} onChange={e => setSettings({...settings, max_booking_days: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Maks. Peserta Aula Besar</label>
                                <input type="number" min="1" required value={settings.max_peserta_besar} onChange={e => setSettings({...settings, max_peserta_besar: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Maks. Peserta Aula Kecil</label>
                                <input type="number" min="1" required value={settings.max_peserta_kecil} onChange={e => setSettings({...settings, max_peserta_kecil: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setShowSettingsModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm">Batal</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer text-sm">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}