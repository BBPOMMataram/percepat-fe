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
import { Icon } from "@iconify/react";

export default function DashboardPaulaAdmin() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState<'aula' | 'mobil'>('aula');
    const [isLoading, setIsLoading] = useState(true);

    // Filter & Search states (UX Enhancement)
    const [searchAula, setSearchAula] = useState("");
    const [filterAulaType, setFilterAulaType] = useState<'all' | 'besar' | 'kecil'>('all');
    const [searchMobil, setSearchMobil] = useState("");

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
    const [mobilActiveSubTab, setMobilActiveSubTab] = useState<'pengajuan' | 'master' | 'security' | 'servis'>('pengajuan');

    // STATE SECURITY USERS DARI AUTH BPOM & SERVIS
    const [securityUsers, setSecurityUsers] = useState<any[]>([]);
    const [allUsersList, setAllUsersList] = useState<any[]>([]);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [authBpomEmployees, setAuthBpomEmployees] = useState<any[]>([]);
    const [isLoadingAuthEmployees, setIsLoadingAuthEmployees] = useState(false);
    const [authSearch, setAuthSearch] = useState('');
    const [selectedAuthEmployee, setSelectedAuthEmployee] = useState<any>(null);
    const [isSubmittingSecurity, setIsSubmittingSecurity] = useState(false);

    // Monitoring Servis & Kerusakan
    const [serviceMonitoringList, setServiceMonitoringList] = useState<any[]>([]);
    const [kerusakanAlerts, setKerusakanAlerts] = useState<any[]>([]);
    const [formMobil, setFormMobil] = useState({ id: null, nama: "", plat_nomor: "", kapasitas: "", status: "tersedia" });

    // STATE UMUM (REJECT & DETAIL)
    const [rejectModal, setRejectModal] = useState<{ id: number, type: 'pengajuan' | 'edit' | 'pengajuan_mobil' } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [detailPengajuanModal, setDetailPengajuanModal] = useState<any | null>(null);
    const [detailMobilModal, setDetailMobilModal] = useState<any | null>(null);

    // STATE EDIT AULA MODAL (ADMIN)
    const [editAulaModal, setEditAulaModal] = useState<any | null>(null);
    const [editFormData, setEditFormData] = useState({
        nama_kegiatan: "",
        tanggal_pinjam: "",
        aula: "besar",
        waktu_mulai: "",
        waktu_selesai: "",
        pilihan: "Internal",
        peserta: "",
        jumlah_peserta: "",
        penanggung_jawab: "",
    });
    const [editSarana, setEditSarana] = useState<string[]>([]);
    const [editCustomSarana, setEditCustomSarana] = useState("");
    const [editTimeConflict, setEditTimeConflict] = useState(false);
    const [editConflictMessage, setEditConflictMessage] = useState("");
    const [isSavingAula, setIsSavingAula] = useState(false);
    const opsiSarana = ["Proyektor", "Kamera", "Zoom Meeting", "Sound System"];

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

            // Ambil Data Security & Status Servis
            api.get(`${baseURL}/api/paula/admin/security-users`)
                .then((res) => {
                    setSecurityUsers(res.data?.security_users || []);
                    setAllUsersList(res.data?.all_users || []);
                })
                .catch(() => {});

            api.get(`${baseURL}/api/paula/admin/mobil/service-status`)
                .then((res) => {
                    setServiceMonitoringList(res.data?.mobils || res.data || []);
                })
                .catch(() => {});

            api.get(`${baseURL}/api/paula/admin/mobil/kerusakan`)
                .then((res) => {
                    setKerusakanAlerts(res.data?.laporans || res.data || []);
                })
                .catch(() => {});
            
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

    const handleOpenEditAula = (p: any) => {
        let parsedSarana: string[] = [];
        try {
            parsedSarana = typeof p.sarana_prasarana === 'string' ? JSON.parse(p.sarana_prasarana) : (p.sarana_prasarana || []);
        } catch (e) {
            parsedSarana = [];
        }
        setEditAulaModal(p);
        setEditFormData({
            nama_kegiatan: p.nama_kegiatan || "",
            tanggal_pinjam: p.tanggal_pinjam ? p.tanggal_pinjam.split('T')[0] : "",
            aula: p.aula || "besar",
            waktu_mulai: p.waktu_mulai ? p.waktu_mulai.slice(0, 5) : "",
            waktu_selesai: p.waktu_selesai ? p.waktu_selesai.slice(0, 5) : "",
            pilihan: p.pilihan || "Internal",
            peserta: p.peserta || "",
            jumlah_peserta: p.jumlah_peserta ? String(p.jumlah_peserta) : "",
            penanggung_jawab: p.penanggung_jawab || "",
        });
        setEditSarana(parsedSarana);
        setEditCustomSarana("");
        setEditTimeConflict(false);
        setEditConflictMessage("");
    };

    const handleAddEditCustomSarana = () => {
        if (editCustomSarana.trim() && !editSarana.includes(editCustomSarana.trim())) {
            setEditSarana([...editSarana, editCustomSarana.trim()]);
            setEditCustomSarana("");
        }
    };

    const checkEditTimeAvailability = async (mulai: string, selesai: string, tanggal: string, aula: string, excludeId?: number) => {
        if (!mulai || !selesai || !tanggal || !aula) return;
        if (selesai <= mulai) {
            setEditTimeConflict(true);
            setEditConflictMessage("Waktu selesai harus setelah waktu mulai.");
            return;
        }
        try {
            const res = await api.get(`${baseURL}/api/paula/check-time`, {
                params: { tanggal, waktu_mulai: mulai, waktu_selesai: selesai, aula, exclude_id: excludeId }
            });
            if (!res.data.valid) {
                setEditTimeConflict(true);
                setEditConflictMessage(res.data.message);
            } else {
                setEditTimeConflict(false);
                setEditConflictMessage("");
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (editAulaModal && editFormData.waktu_selesai && editFormData.waktu_mulai && editFormData.tanggal_pinjam && editFormData.aula) {
            checkEditTimeAvailability(
                editFormData.waktu_mulai,
                editFormData.waktu_selesai,
                editFormData.tanggal_pinjam,
                editFormData.aula,
                editAulaModal.id
            );
        } else {
            setEditTimeConflict(false);
            setEditConflictMessage("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editFormData.waktu_selesai, editFormData.waktu_mulai, editFormData.tanggal_pinjam, editFormData.aula, editAulaModal]);

    const handleSaveEditAula = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAulaModal) return;
        if (editTimeConflict) {
            return toast.error("Waktu dan tempat bertabrakan dengan pemesanan lain!");
        }
        const maxAllowed = editFormData.aula === 'besar' ? settings.max_peserta_besar : settings.max_peserta_kecil;
        if (parseInt(editFormData.jumlah_peserta) > maxAllowed) {
            return toast.error(`Kapasitas maksimal aula ${editFormData.aula} adalah ${maxAllowed} orang!`);
        }

        setIsSavingAula(true);
        try {
            const payload = {
                ...editFormData,
                sarana_prasarana: editSarana,
            };
            await api.put(`${baseURL}/api/paula/admin/pengajuan/${editAulaModal.id}`, payload);
            toast.success("Pengajuan berhasil diperbarui oleh admin");
            setEditAulaModal(null);
            fetchData();
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Gagal memperbarui pengajuan";
            toast.error(errMsg);
        } finally {
            setIsSavingAula(false);
        }
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

    
    // ================== LOGIKA SECURITY & SERVIS (AUTH BPOM) ==================
    const openAddSecurityModal = async () => {
        setShowSecurityModal(true);
        setSelectedAuthEmployee(null);
        setAuthSearch('');
        setIsLoadingAuthEmployees(true);
        try {
            const authURL = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || 'http://localhost:8000';
            const res = await api.get(`${authURL}/api/get-all-users`);
            setAuthBpomEmployees(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Gagal load data karyawan dari Auth BPOM:", err);
            setAuthBpomEmployees(allUsersList || []);
        } finally {
            setIsLoadingAuthEmployees(false);
        }
    };

    const handleAddSecurityUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAuthEmployee) {
            toast.warning("Silakan pilih data pegawai dari daftar Auth BPOM");
            return;
        }
        setIsSubmittingSecurity(true);
        try {
            const res = await api.post(`${baseURL}/api/paula/admin/security-users`, {
                user_id: selectedAuthEmployee.id,
                name: selectedAuthEmployee.name,
                email: selectedAuthEmployee.email,
                username: selectedAuthEmployee.username || (selectedAuthEmployee.email ? selectedAuthEmployee.email.split('@')[0] : selectedAuthEmployee.name.toLowerCase().replace(/\s+/g, '.')),
            });
            toast.success(res.data.message || `Pegawai ${selectedAuthEmployee.name} berhasil dijadikan Security Pos Jaga!`);
            setShowSecurityModal(false);
            setSelectedAuthEmployee(null);
            
            // Refresh daftar security
            const resSec = await api.get(`${baseURL}/api/paula/admin/security-users`);
            setSecurityUsers(resSec.data?.security_users || []);
            setAllUsersList(resSec.data?.all_users || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal menetapkan akun security");
        } finally {
            setIsSubmittingSecurity(false);
        }
    };

    const handleRemoveSecurity = async (id: string, name: string) => {
        if (!confirm(`Cabut peran Security Pos Jaga dari ${name}?`)) return;
        try {
            await api.delete(`${baseURL}/api/paula/admin/security-users/${id}`);
            toast.success(`Akses security untuk ${name} berhasil dicabut`);
            const resSec = await api.get(`${baseURL}/api/paula/admin/security-users`);
            setSecurityUsers(resSec.data?.security_users || []);
            setAllUsersList(resSec.data?.all_users || []);
        } catch (err: any) {
            toast.error("Gagal mencabut status security");
        }
    };

    const handleResolveKerusakan = async (id: number) => {
        try {
            await api.patch(`${baseURL}/api/paula/admin/mobil/kerusakan/${id}/resolve`);
            toast.success("Laporan kerusakan berhasil ditandai selesai/diperbaiki");
            const resKerusakan = await api.get(`${baseURL}/api/paula/admin/mobil/kerusakan`);
            setKerusakanAlerts(resKerusakan.data?.laporans || resKerusakan.data || []);
            const resServ = await api.get(`${baseURL}/api/paula/admin/mobil/service-status`);
            setServiceMonitoringList(resServ.data?.mobils || resServ.data || []);
        } catch (err: any) {
            toast.error("Gagal memperbarui status laporan kerusakan");
        }
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


    // Data terfilter untuk pencarian & filtering instan
    const filteredPengajuans = pengajuans.filter((p) => {
        const matchSearch =
            !searchAula.trim() ||
            p.nama_kegiatan?.toLowerCase().includes(searchAula.toLowerCase()) ||
            p.fungsi_pengusul?.toLowerCase().includes(searchAula.toLowerCase()) ||
            p.penanggung_jawab?.toLowerCase().includes(searchAula.toLowerCase()) ||
            p.user?.name?.toLowerCase().includes(searchAula.toLowerCase());
        const matchType = filterAulaType === 'all' || p.aula?.toLowerCase() === filterAulaType;
        return matchSearch && matchType;
    });

    const filteredMobilPengajuans = mobilPengajuans.filter((p) => {
        if (!searchMobil.trim()) return true;
        const q = searchMobil.toLowerCase();
        return (
            p.tujuan_dinas?.toLowerCase().includes(q) ||
            p.tujuan_lokasi?.toLowerCase().includes(q) ||
            p.fungsi_pengusul?.toLowerCase().includes(q) ||
            p.kendaraan?.toLowerCase().includes(q) ||
            p.driver?.toLowerCase().includes(q) ||
            p.user?.name?.toLowerCase().includes(q)
        );
    });

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center mt-5">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    return (
        <div className="max-w-screen-2xl mx-auto animate-in fade-in duration-500 pb-16 px-4 md:px-8">
            {/* HERO HEADER ADMIN MODERN */}
            <div className="mt-4 mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-32 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-blue-200">
                            <Icon icon="solar:shield-check-bold" width={16} />
                            <span>Portal Administrator PAULA</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-white/70 font-normal">BBPOM di Mataram</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            Dashboard Admin PAULA
                        </h1>
                        <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
                            Kelola persetujuan reservasi aula rapat, peminjaman mobil dinas, perawatan armada, dan akun operasional dalam satu kendali terpadu.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={fetchData}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition shadow-sm cursor-pointer"
                            title="Segarkan data terbaru"
                        >
                            <Icon icon="solar:refresh-linear" width={16} />
                            <span>Segarkan Data</span>
                        </button>
                        <Link
                            href="/paula"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/30"
                        >
                            <Icon icon="solar:home-smile-angle-bold" width={16} />
                            <span>Beranda Layanan PAULA</span>
                        </Link>
                    </div>
                </div>

                {/* 4 Stat Overview Quick Cards */}
                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
                    <div 
                        onClick={() => setActiveTab('aula')}
                        className={`p-3.5 rounded-2xl transition cursor-pointer border ${
                            activeTab === 'aula' 
                                ? 'bg-white/15 border-blue-400/50 ring-1 ring-blue-400/30' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300">Kegiatan Aula</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl font-black text-white">{pengajuans.length}</span>
                            <span className="text-[10px] text-slate-300">Disetujui</span>
                        </div>
                        {(pendingRequests.length + editRequests.length) > 0 ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md">
                                {pendingRequests.length + editRequests.length} butuh tindakan
                            </span>
                        ) : (
                            <span className="text-[10px] text-emerald-400 mt-1 block">Semua tertangani</span>
                        )}
                    </div>

                    <div 
                        onClick={() => { setActiveTab('mobil'); setMobilActiveSubTab('pengajuan'); }}
                        className={`p-3.5 rounded-2xl transition cursor-pointer border ${
                            activeTab === 'mobil' && mobilActiveSubTab === 'pengajuan'
                                ? 'bg-white/15 border-indigo-400/50 ring-1 ring-indigo-400/30' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300">Peminjaman Mobil</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl font-black text-white">{mobilPengajuans.length}</span>
                            <span className="text-[10px] text-slate-300">Disetujui</span>
                        </div>
                        {mobilPending.length > 0 ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-rose-300 bg-rose-400/10 px-2 py-0.5 rounded-md">
                                {mobilPending.length} menunggu izin
                            </span>
                        ) : (
                            <span className="text-[10px] text-emerald-400 mt-1 block">Tidak ada antrean</span>
                        )}
                    </div>

                    <div 
                        onClick={() => { setActiveTab('mobil'); setMobilActiveSubTab('master'); }}
                        className={`p-3.5 rounded-2xl transition cursor-pointer border ${
                            activeTab === 'mobil' && mobilActiveSubTab === 'master'
                                ? 'bg-white/15 border-indigo-400/50 ring-1 ring-indigo-400/30' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300">Armada Mobil</span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">commute</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl font-black text-white">{masterMobils.length}</span>
                            <span className="text-[10px] text-slate-300">Unit Terdaftar</span>
                        </div>
                        <span className="text-[10px] text-emerald-300 mt-1 block">
                            {masterMobils.filter(m => m.status === 'tersedia').length} unit siap jalan
                        </span>
                    </div>

                    <div 
                        onClick={() => { setActiveTab('mobil'); setMobilActiveSubTab(kerusakanAlerts.length > 0 ? 'servis' : 'security'); }}
                        className={`p-3.5 rounded-2xl transition cursor-pointer border ${
                            activeTab === 'mobil' && (mobilActiveSubTab === 'servis' || mobilActiveSubTab === 'security')
                                ? 'bg-white/15 border-indigo-400/50 ring-1 ring-indigo-400/30' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300">Servis & Security</span>
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">build</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl font-black text-white">{kerusakanAlerts.length}</span>
                            <span className="text-[10px] text-slate-300">Laporan Rusak</span>
                        </div>
                        <span className="text-[10px] text-slate-300 mt-1 block">
                            {securityUsers.length} Personil Pos Jaga
                        </span>
                    </div>
                </div>
            </div>

            {/* SWITCH TAB AULA / MOBIL (SEGMENTED PILL) */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 max-w-xl mb-6 border border-slate-200/80 shadow-2xs">
                <button 
                    type="button"
                    onClick={() => setActiveTab('aula')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-extrabold text-xs md:text-sm transition-all cursor-pointer ${
                        activeTab === 'aula' 
                        ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                    <span>Peminjaman Aula</span>
                    {(pendingRequests.length > 0 || editRequests.length > 0) && (
                        <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                            {pendingRequests.length + editRequests.length}
                        </span>
                    )}
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('mobil')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-extrabold text-xs md:text-sm transition-all cursor-pointer ${
                        activeTab === 'mobil' 
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">directions_car</span>
                    <span>Peminjaman Mobil Dinas</span>
                    {(mobilPending.length > 0 || kerusakanAlerts.length > 0) && (
                        <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                            {mobilPending.length + kerusakanAlerts.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ======================================================== */}
            {/* KONTEN TAB AULA                                           */}
            {/* ======================================================== */}
            {activeTab === 'aula' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* ACTION ALERTS: PENDING REQUESTS AULA */}
                    {pendingRequests.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                                    Permohonan Peminjaman Aula Baru ({pendingRequests.length})
                                </h2>
                                <span className="text-[11px] text-slate-500 font-semibold">Menunggu persetujuan admin</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {pendingRequests.map(req => (
                                    <div key={req.id} className="bg-white border-l-4 border-l-blue-600 border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    req.aula === 'besar' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    Aula {req.aula}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-500">
                                                    Diajukan: {new Date(req.tanggal_pengajuan || req.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{req.nama_kegiatan}</h4>
                                            <p className="text-xs text-slate-600 font-medium">
                                                Pengusul: <strong className="text-slate-800">{req.user?.name || req.fungsi_pengusul}</strong> • Pelaksanaan: <span className="font-bold text-blue-700">{new Date(req.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ({req.waktu_mulai?.slice(0,5)} - {req.waktu_selesai?.slice(0,5)} WITA)</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                            <button 
                                                type="button" 
                                                onClick={() => setDetailPengajuanModal(req)} 
                                                className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                Rincian
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleApprovePengajuan(req.id)} 
                                                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">check</span>
                                                Setujui
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setRejectModal({ id: req.id, type: 'pengajuan' })} 
                                                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                Tolak
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ACTION ALERTS: PERMINTAAN EDIT AULA */}
                    {editRequests.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                    Permintaan Izin Edit Data Kegiatan ({editRequests.length})
                                </h2>
                                <span className="text-[11px] text-slate-500 font-semibold">User meminta izin edit jadwal/detail</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {editRequests.map(req => (
                                    <div key={req.id} className="bg-white border-l-4 border-l-amber-500 border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                                                    Izin Edit
                                                </span>
                                                <span className="text-xs font-semibold text-slate-500">
                                                    Aula {req.aula}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{req.nama_kegiatan}</h4>
                                            <p className="text-xs text-slate-600 font-medium">
                                                User <strong className="text-amber-950">{req.user?.name}</strong> mengajukan izin untuk mengubah detail kegiatan.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                            <button 
                                                type="button" 
                                                onClick={() => setDetailPengajuanModal(req)} 
                                                className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                Rincian
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleApproveEdit(req.id)} 
                                                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">check</span>
                                                Izinkan Edit
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setRejectModal({ id: req.id, type: 'edit' })} 
                                                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                Tolak
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DAFTAR JADWAL AULA DISETUJUI & KONTROL PENCARIAN */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
                        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-slate-900 text-base md:text-lg">Daftar Jadwal & Pengajuan Disetujui</h3>
                                    <span className="bg-blue-50 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                                        {filteredPengajuans.length} dari {pengajuans.length} Kegiatan
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Daftar reservasi resmi aula yang telah disetujui untuk kegiatan operasional.</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Search Input */}
                                <div className="relative flex-1 sm:w-64">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                    <input
                                        type="text"
                                        value={searchAula}
                                        onChange={(e) => setSearchAula(e.target.value)}
                                        placeholder="Cari kegiatan, pengusul..."
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                                    />
                                    {searchAula && (
                                        <button 
                                            type="button"
                                            onClick={() => setSearchAula("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Filter Aula Type */}
                                <select
                                    value={filterAulaType}
                                    onChange={(e: any) => setFilterAulaType(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="all">Semua Aula</option>
                                    <option value="besar">Aula Besar</option>
                                    <option value="kecil">Aula Kecil</option>
                                </select>

                                {/* Settings Button */}
                                <button 
                                    type="button"
                                    onClick={() => setShowSettingsModal(true)} 
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">settings</span>
                                    <span>Pengaturan Sistem</span>
                                </button>
                            </div>
                        </div>

                        {/* Table Aula */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm min-w-[950px]">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200/80">
                                        <th className="px-5 py-3.5">Tgl Pengajuan</th>
                                        <th className="px-5 py-3.5">Nama Kegiatan</th>
                                        <th className="px-5 py-3.5">Pengusul & PJ</th>
                                        <th className="px-5 py-3.5">Pelaksanaan</th>
                                        <th className="px-5 py-3.5">Aula</th>
                                        <th className="px-5 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                    {filteredPengajuans.map((p) => (
                                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                                                {new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-extrabold text-slate-900 leading-snug">{p.nama_kegiatan}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <span>{p.pilihan || 'Internal'}</span>
                                                    <span>•</span>
                                                    <span>{p.jumlah_peserta ? `${p.jumlah_peserta} Peserta` : 'Peserta -'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-800">{p.fungsi_pengusul || p.user?.name || '-'}</div>
                                                {p.penanggung_jawab && (
                                                    <div className="text-[11px] text-slate-500 mt-0.5">PJ: {p.penanggung_jawab}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[15px] text-blue-600">calendar_today</span>
                                                    {new Date(p.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-[11px] text-blue-600 font-bold mt-0.5 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                    {p.waktu_mulai.slice(0,5)} - {p.waktu_selesai.slice(0,5)} WITA
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    p.aula === 'besar' 
                                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                }`}>
                                                    Aula {p.aula}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleOpenEditAula(p)} 
                                                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition flex items-center justify-center shadow-2xs cursor-pointer" 
                                                        title="Edit Pengajuan"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDelete(p.id)} 
                                                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition flex items-center justify-center shadow-2xs cursor-pointer"
                                                        title="Hapus Pengajuan"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPengajuans.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                                                    <span className="material-symbols-outlined text-[24px]">event_busy</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">Tidak ada data kegiatan ditemukan</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {searchAula ? `Tidak ada kegiatan yang sesuai kata kunci "${searchAula}"` : 'Belum ada data pengajuan aula yang disetujui.'}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* KONTEN TAB MOBIL DINAS                                    */}
            {/* ======================================================== */}
            {activeTab === 'mobil' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* SUB-NAVIGASI TAB MOBIL */}
                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setMobilActiveSubTab('pengajuan')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    mobilActiveSubTab === 'pengajuan'
                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">assignment</span>
                                <span>Pengajuan & Persetujuan</span>
                                {mobilPending.length > 0 && (
                                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                                        {mobilPending.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setMobilActiveSubTab('master')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    mobilActiveSubTab === 'master'
                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                                <span>Master Armada ({masterMobils.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMobilActiveSubTab('servis')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    mobilActiveSubTab === 'servis'
                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">build_circle</span>
                                <span>Status & Servis Rutin</span>
                                {kerusakanAlerts.length > 0 && (
                                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                                        {kerusakanAlerts.length} Rusak
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setMobilActiveSubTab('security')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    mobilActiveSubTab === 'security'
                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                                <span>Akun Security Pos Jaga ({securityUsers.length})</span>
                            </button>
                        </div>

                        {/* Quick links ke halaman operasional */}
                        <div className="flex items-center gap-2">
                            <Link
                                href="/paula/mobil/security"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 transition shadow-2xs"
                                title="Buka Formulir Gate In / Gate Out Pos Jaga"
                            >
                                <span className="material-symbols-outlined text-[16px] text-blue-700">shield</span>
                                <span>Pos Security (Gate)</span>
                            </Link>

                            <Link
                                href="/paula/mobil/servis"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition shadow-2xs"
                                title="Buka Monitoring Jadwal Servis & Laporan Kerusakan Lengkap"
                            >
                                <span className="material-symbols-outlined text-[16px] text-amber-700">car_repair</span>
                                <span>Jadwal Servis</span>
                            </Link>
                        </div>
                    </div>

                    {/* SUBTAB 1: PENGAJUAN & PERSETUJUAN MOBIL */}
                    {mobilActiveSubTab === 'pengajuan' && (
                        <div className="space-y-6">
                            {/* NOTIFIKASI PENGAJUAN MOBIL BARU */}
                            {mobilPending.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                                            Permohonan Mobil Menunggu Persetujuan ({mobilPending.length})
                                        </h2>
                                        <span className="text-[11px] text-slate-500 font-semibold">Memerlukan disposisi admin</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {mobilPending.map(req => (
                                            <div key={req.id} className="bg-white border-l-4 border-l-indigo-600 border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                                                            {req.kendaraan || 'Kendaraan Dinas'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-500">
                                                            Tgl Pinjam: {new Date(req.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{req.tujuan_dinas}</h4>
                                                    <p className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-2">
                                                        <span>Pemohon: <strong className="text-slate-800">{req.user?.name || req.fungsi_pengusul}</strong></span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-0.5 text-indigo-700 font-semibold">
                                                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                                                            {req.tujuan_lokasi || 'Dalam Kota'}
                                                        </span>
                                                        {req.driver && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Driver: <strong className="text-slate-700">{req.driver}</strong></span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setDetailMobilModal(req)} 
                                                        className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                        Rincian
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleApproveMobil(req.id)} 
                                                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                                        Setujui
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setRejectModal({ id: req.id, type: 'pengajuan_mobil' })} 
                                                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                        Tolak
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                    <span>Tidak ada permohonan peminjaman mobil yang menunggu persetujuan. Semua permohonan telah ditangani.</span>
                                </div>
                            )}

                            {/* TABEL PENGAJUAN MOBIL DISETUJUI */}
                            <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
                                <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-slate-900 text-base md:text-lg">Daftar Peminjaman Mobil Disetujui</h3>
                                            <span className="bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                                                {filteredMobilPengajuans.length} dari {mobilPengajuans.length} Kendaraan
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">Daftar peminjaman armada dinas operasional yang telah disetujui.</p>
                                    </div>

                                    {/* Search Input Mobil */}
                                    <div className="relative w-full sm:w-72">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                        <input
                                            type="text"
                                            value={searchMobil}
                                            onChange={(e) => setSearchMobil(e.target.value)}
                                            placeholder="Cari tujuan, kendaraan, driver..."
                                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                                        />
                                        {searchMobil && (
                                            <button 
                                                type="button"
                                                onClick={() => setSearchMobil("")}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-sm min-w-[950px]">
                                        <thead>
                                            <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200/80">
                                                <th className="px-5 py-3.5">Tgl Pengajuan</th>
                                                <th className="px-5 py-3.5">Tujuan & Lokasi</th>
                                                <th className="px-5 py-3.5">Pengusul</th>
                                                <th className="px-5 py-3.5">Waktu Peminjaman</th>
                                                <th className="px-5 py-3.5">Mobil & Driver</th>
                                                <th className="px-5 py-3.5 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                            {filteredMobilPengajuans.map((p) => (
                                                <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                                                        {new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-extrabold text-slate-900 leading-snug">{p.tujuan_dinas}</div>
                                                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <span className="material-symbols-outlined text-[13px] text-indigo-600">location_on</span>
                                                            <span>{p.tujuan_lokasi || 'Dalam Kota'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-slate-800">{p.fungsi_pengusul || p.user?.name || '-'}</div>
                                                        {p.penanggung_jawab && (
                                                            <div className="text-[11px] text-slate-500 mt-0.5">PJ: {p.penanggung_jawab}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px] text-indigo-600">calendar_today</span>
                                                            {new Date(p.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[11px] text-indigo-600 font-bold mt-0.5 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                            {p.waktu_mulai?.slice(0,5)} {p.waktu_selesai ? `- ${p.waktu_selesai?.slice(0,5)} WITA` : 'WITA'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-slate-900">{p.kendaraan}</div>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                                Driver: {p.driver || 'Mandiri'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteMobil(p.id)} 
                                                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition flex items-center justify-center shadow-2xs mx-auto cursor-pointer" 
                                                            title="Hapus Pengajuan Mobil"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredMobilPengajuans.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                                                            <span className="material-symbols-outlined text-[24px]">directions_car</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-700">Tidak ada peminjaman mobil ditemukan</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            {searchMobil ? `Tidak ada riwayat yang sesuai kata kunci "${searchMobil}"` : 'Belum ada data peminjaman mobil yang disetujui.'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBTAB 2: MASTER KENDARAAN (ARMADA) */}
                    {mobilActiveSubTab === 'master' && (
                        <div className="space-y-5">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                                <div>
                                    <h3 className="font-black text-slate-900 text-base md:text-lg">Daftar Master Kendaraan Dinas</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Kelola data seluruh kendaraan operasional BBPOM di Mataram.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setFormMobil({ id: null, nama: "", plat_nomor: "", kapasitas: "", status: "tersedia" });
                                        setShowMobilModal(true);
                                    }} 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all cursor-pointer shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    <span>Tambah Kendaraan Baru</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {masterMobils.map(mobil => (
                                    <div key={mobil.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="bg-slate-900 text-white text-xs font-mono font-black px-2.5 py-1 rounded-xl tracking-wider uppercase shadow-2xs">
                                                    {mobil.plat_nomor}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setFormMobil(mobil); setShowMobilModal(true); }} 
                                                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center cursor-pointer"
                                                        title="Edit Mobil"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => deleteMasterMobil(mobil.id)} 
                                                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center cursor-pointer"
                                                        title="Hapus Mobil"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="font-extrabold text-slate-900 text-sm leading-snug mb-1">
                                                {mobil.nama}
                                            </h3>
                                        </div>

                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-4 pt-3 border-t border-slate-100">
                                            <span className="flex items-center gap-1 font-bold text-slate-700">
                                                <span className="material-symbols-outlined text-[16px] text-indigo-600">group</span>
                                                <span>{mobil.kapasitas} Kursi</span>
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                mobil.status === 'tersedia' 
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                            }`}>
                                                {mobil.status === 'tersedia' ? 'Tersedia' : 'Perbaikan'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SUBTAB 3: STATUS KENDARAAN & SERVIS RUTIN */}
                    {mobilActiveSubTab === 'servis' && (
                        <div className="space-y-6">
                            {/* Alert Kerusakan Masuk */}
                            {kerusakanAlerts.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[18px]">warning</span>
                                            Laporan Kerusakan Masuk dari Security ({kerusakanAlerts.length})
                                        </h3>
                                        <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Perlu Tindak Lanjut</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {kerusakanAlerts.map((k) => (
                                            <div key={k.id} className="bg-white border-l-4 border-l-rose-600 border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="bg-rose-600 text-white text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                                                            {k.mobil?.plat_nomor || 'MOBIL'}
                                                        </span>
                                                        <h4 className="font-extrabold text-slate-900 text-sm mt-1.5">{k.mobil?.nama || 'Kendaraan Dinas'}</h4>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 font-medium">
                                                        {new Date(k.created_at).toLocaleDateString('id-ID')}
                                                    </span>
                                                </div>
                                                <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/60 text-xs text-rose-950">
                                                    <span className="font-extrabold block mb-0.5">Catatan Kerusakan dari Security:</span>
                                                    <p className="leading-relaxed">{k.catatan_kerusakan}</p>
                                                    <p className="text-[11px] text-slate-500 mt-1.5 italic">Pelapor: {k.pelapor_security}</p>
                                                </div>
                                                <div className="flex justify-end pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResolveKerusakan(k.id)}
                                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                        Tandai Selesai / Diperbaiki
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cards Status Odometer & Servis Realtime */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div>
                                        <h3 className="font-black text-slate-900 text-base md:text-lg">Monitoring Odometer & Servis Armada</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Perhitungan otomatis batas servis berdasarkan ambang batas KM atau interval 3 bulan.</p>
                                    </div>
                                    <Link
                                        href="/paula/mobil/servis"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition shadow-xs shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">settings</span>
                                        <span>Pengaturan & Riwayat Lengkap</span>
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {serviceMonitoringList.map((m) => {
                                        const metrics = m.service_metrics || {};
                                        const isDue = metrics.is_due_service;
                                        const isUrgent = m.status_servis === 'wajib_servis' || m.kondisi_fisik === 'rusak';

                                        return (
                                            <div 
                                                key={m.id} 
                                                className={`p-5 rounded-3xl border transition shadow-2xs space-y-3 ${
                                                    isUrgent || isDue
                                                        ? 'bg-rose-50/50 border-rose-300'
                                                        : 'bg-white border-slate-200'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                                            {m.plat_nomor}
                                                        </span>
                                                        <h4 className="font-extrabold text-slate-900 text-sm mt-1.5">{m.nama}</h4>
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                                        isUrgent || isDue
                                                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                    }`}>
                                                        {isUrgent || isDue ? 'Wajib Servis' : 'Kondisi Prima'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <span className="text-[10px] text-slate-400 block font-semibold">Odometer Saat Ini</span>
                                                        <span className="font-black text-slate-800 text-sm">{m.odometer_saat_ini?.toLocaleString('id-ID') || 0} KM</span>
                                                    </div>
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <span className="text-[10px] text-slate-400 block font-semibold">Servis Terakhir</span>
                                                        <span className="font-semibold text-slate-700">{m.terakhir_service_km ? `${m.terakhir_service_km.toLocaleString('id-ID')} KM` : '-'}</span>
                                                    </div>
                                                </div>

                                                <div className="text-[11px] text-slate-600 bg-slate-100/70 p-2.5 rounded-xl space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Interval Servis:</span>
                                                        <span className="font-bold">{m.interval_km_service?.toLocaleString('id-ID') || 5000} KM / {m.interval_bulan_service || 3} Bln</span>
                                                    </div>
                                                    {metrics.km_until_service !== undefined && (
                                                        <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-indigo-700">
                                                            <span>Sisa Interval KM:</span>
                                                            <span>{metrics.km_until_service} KM</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBTAB 4: KELOLA AKUN SECURITY POS JAGA */}
                    {mobilActiveSubTab === 'security' && (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs mb-2">
                                        <span className="material-symbols-outlined text-[16px]">shield_person</span>
                                        <span>Personil Pos Jaga Terdaftar</span>
                                    </div>
                                    <h3 className="font-black text-slate-900 text-base md:text-lg">Kelola Akun Security (Gate Pass)</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Pegawai yang terdaftar sebagai Security akan memiliki akses untuk mencatat checklist mobil keluar & masuk.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={openAddSecurityModal}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                                    <span>Tambah Akun Security</span>
                                </button>
                            </div>

                            {/* Tabel Petugas Security */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200/80">
                                            <th className="px-5 py-3.5">Nama Petugas</th>
                                            <th className="px-5 py-3.5">Username</th>
                                            <th className="px-5 py-3.5">Email</th>
                                            <th className="px-5 py-3.5">Peran Sistem</th>
                                            <th className="px-5 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                        {securityUsers.map((sec) => (
                                            <tr key={sec.id} className="hover:bg-blue-50/30 transition">
                                                <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs shrink-0">
                                                        {sec.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span>{sec.name}</span>
                                                </td>
                                                <td className="px-5 py-4 font-mono text-xs text-slate-600">{sec.username || '-'}</td>
                                                <td className="px-5 py-4 text-xs text-slate-500">{sec.email}</td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                                        <span className="material-symbols-outlined text-[13px]">shield</span>
                                                        Security Pos Jaga
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSecurity(sec.id, sec.name)}
                                                        className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition shadow-2xs cursor-pointer"
                                                        title="Cabut status security"
                                                    >
                                                        Cabut Akses
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {securityUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic text-xs">
                                                    Belum ada personil Security yang terdaftar. Klik tombol "Tambah Akun Security" untuk menambahkan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
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

            {/* MODAL EDIT PENGAJUAN AULA (ADMIN) */}
            {editAulaModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Edit Pengajuan Aula</h3>
                                <p className="text-slate-500 text-xs font-medium">Ubah rincian kegiatan aula yang telah disetujui.</p>
                            </div>
                            <button 
                                onClick={() => setEditAulaModal(null)} 
                                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>

                        {editTimeConflict && (
                            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {editConflictMessage}
                            </div>
                        )}

                        <form onSubmit={handleSaveEditAula} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Kegiatan</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editFormData.nama_kegiatan} 
                                    onChange={e => setEditFormData({ ...editFormData, nama_kegiatan: e.target.value })} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800" 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Tanggal Pelaksanaan</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={editFormData.tanggal_pinjam} 
                                        onChange={e => setEditFormData({ ...editFormData, tanggal_pinjam: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Pilihan Aula</label>
                                    <select 
                                        required 
                                        value={editFormData.aula} 
                                        onChange={e => setEditFormData({ ...editFormData, aula: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                                    >
                                        <option value="besar">Aula Besar (Maks. {settings.max_peserta_besar} orang)</option>
                                        <option value="kecil">Aula Kecil (Maks. {settings.max_peserta_kecil} orang)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Waktu Mulai</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={editFormData.waktu_mulai} 
                                        onChange={e => setEditFormData({ ...editFormData, waktu_mulai: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Waktu Selesai</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={editFormData.waktu_selesai} 
                                        onChange={e => setEditFormData({ ...editFormData, waktu_selesai: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Narasumber</label>
                                    <select 
                                        required 
                                        value={editFormData.pilihan} 
                                        onChange={e => setEditFormData({ ...editFormData, pilihan: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                                    >
                                        <option value="Internal">Internal</option>
                                        <option value="Eksternal">Eksternal</option>
                                        <option value="Internal & Eksternal">Internal & Eksternal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Asal Peserta</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editFormData.peserta} 
                                        onChange={e => setEditFormData({ ...editFormData, peserta: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800" 
                                        placeholder="Instansi/Asal Peserta..." 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Jumlah Peserta</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required 
                                        value={editFormData.jumlah_peserta} 
                                        onChange={e => setEditFormData({ ...editFormData, jumlah_peserta: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Penanggung Jawab</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editFormData.penanggung_jawab} 
                                        onChange={e => setEditFormData({ ...editFormData, penanggung_jawab: e.target.value })} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Sarana & Prasarana</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {opsiSarana.map(item => (
                                        <label 
                                            key={item} 
                                            className={`px-3 py-1.5 border rounded-full text-xs font-bold cursor-pointer transition ${editSarana.includes(item) ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={editSarana.includes(item)} 
                                                onChange={() => setEditSarana(p => p.includes(item) ? p.filter(i => i !== item) : [...p, item])} 
                                            />
                                            {item}
                                        </label>
                                    ))}
                                    {editSarana.filter(s => !opsiSarana.includes(s)).map(customItem => (
                                        <span 
                                            key={customItem} 
                                            className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5"
                                        >
                                            {customItem}
                                            <button 
                                                type="button" 
                                                onClick={() => setEditSarana(editSarana.filter(s => s !== customItem))}
                                                className="hover:text-rose-600 font-bold"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Tambah sarana lainnya..." 
                                        value={editCustomSarana} 
                                        onChange={e => setEditCustomSarana(e.target.value)} 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddEditCustomSarana} 
                                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        Tambah
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setEditAulaModal(null)} 
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSavingAula || editTimeConflict} 
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer text-sm flex items-center gap-2"
                                >
                                    {isSavingAula ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span> Menyimpan...
                                        </>
                                    ) : (
                                        "Simpan Perubahan"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL LIHAT DETAIL PENGAJUAN AULA */}
            {detailPengajuanModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 ${
                                    detailPengajuanModal.aula === 'besar' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'
                                }`}>
                                    Aula {detailPengajuanModal.aula}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 leading-snug">
                                    {detailPengajuanModal.nama_kegiatan}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Diajukan oleh <strong className="text-slate-800">{detailPengajuanModal.user?.name}</strong> ({detailPengajuanModal.user?.email || detailPengajuanModal.fungsi_pengusul || '-'})
                                </p>
                            </div>
                            <button 
                                onClick={() => setDetailPengajuanModal(null)} 
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[22px]">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Tanggal Pelaksanaan</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-blue-600">event</span>
                                    {new Date(detailPengajuanModal.tanggal_pinjam).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Waktu Pelaksanaan</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-blue-600">schedule</span>
                                    {detailPengajuanModal.waktu_mulai?.slice(0,5)} - {detailPengajuanModal.waktu_selesai?.slice(0,5)} WITA
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Fungsi / Unit Pengusul</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-blue-600">domain</span>
                                    {detailPengajuanModal.fungsi_pengusul || '-'}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sifat & Jumlah Peserta</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-blue-600">groups</span>
                                    {detailPengajuanModal.pilihan || 'Internal'} • {detailPengajuanModal.jumlah_peserta ? `${detailPengajuanModal.jumlah_peserta} Orang` : '-'}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Penanggung Jawab Kegiatan</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-blue-600">person</span>
                                    {detailPengajuanModal.penanggung_jawab || '-'}
                                    {detailPengajuanModal.kontak_pj ? ` (${detailPengajuanModal.kontak_pj})` : ''}
                                </span>
                            </div>

                            {detailPengajuanModal.peserta && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sasaran / Peserta</span>
                                    <p className="text-slate-700 whitespace-pre-line text-xs font-medium">{detailPengajuanModal.peserta}</p>
                                </div>
                            )}

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Sarana & Prasarana Dibutuhkan</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                        let saranaList: string[] = [];
                                        try {
                                            saranaList = typeof detailPengajuanModal.sarana_prasarana === 'string'
                                                ? JSON.parse(detailPengajuanModal.sarana_prasarana)
                                                : (detailPengajuanModal.sarana_prasarana || []);
                                        } catch {
                                            saranaList = detailPengajuanModal.sarana_prasarana ? [detailPengajuanModal.sarana_prasarana] : [];
                                        }
                                        if (!saranaList || saranaList.length === 0) {
                                            return <span className="text-slate-400 text-xs italic">Tidak ada sarana khusus diminta</span>;
                                        }
                                        return saranaList.map((item: string, idx: number) => (
                                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                                                {item}
                                            </span>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {detailPengajuanModal.keterangan && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Catatan Tambahan / Keterangan</span>
                                    <p className="text-slate-700 text-xs font-medium">{detailPengajuanModal.keterangan}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
                            <button 
                                type="button" 
                                onClick={() => setDetailPengajuanModal(null)} 
                                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
                            >
                                Tutup
                            </button>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const id = detailPengajuanModal.id;
                                        const type = detailPengajuanModal.is_edit_requested ? 'edit' : 'pengajuan';
                                        setDetailPengajuanModal(null);
                                        setRejectModal({ id, type });
                                    }} 
                                    className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
                                >
                                    Tolak Pengajuan
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const id = detailPengajuanModal.id;
                                        setDetailPengajuanModal(null);
                                        if (detailPengajuanModal.is_edit_requested) {
                                            handleApproveEdit(id);
                                        } else {
                                            handleApprovePengajuan(id);
                                        }
                                    }} 
                                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                                >
                                    Izinkan / Setujui
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL LIHAT DETAIL PENGAJUAN MOBIL */}
            {detailMobilModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 bg-indigo-100 text-indigo-700">
                                    {detailMobilModal.kendaraan || 'Kendaraan Dinas'}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 leading-snug">
                                    {detailMobilModal.tujuan_dinas}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Diajukan oleh <strong className="text-slate-800">{detailMobilModal.user?.name}</strong> ({detailMobilModal.user?.email || detailMobilModal.fungsi_pengusul || '-'})
                                </p>
                            </div>
                            <button 
                                onClick={() => setDetailMobilModal(null)} 
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[22px]">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Tanggal Peminjaman</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-600">event</span>
                                    {new Date(detailMobilModal.tanggal_pinjam).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Waktu Peminjaman</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-600">schedule</span>
                                    {detailMobilModal.waktu_mulai?.slice(0,5)} {detailMobilModal.waktu_selesai ? `- ${detailMobilModal.waktu_selesai?.slice(0,5)}` : ''} WITA
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Lokasi Tujuan</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-600">location_on</span>
                                    {detailMobilModal.tujuan_lokasi || '-'}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Driver & Kapasitas</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-600">directions_car</span>
                                    {detailMobilModal.driver || 'Mandiri'} {detailMobilModal.jumlah_peserta ? `• ${detailMobilModal.jumlah_peserta} Orang` : ''}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Penanggung Jawab</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-600">person</span>
                                    {detailMobilModal.penanggung_jawab || '-'}
                                </span>
                            </div>

                            {detailMobilModal.keterangan && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Keterangan / Catatan</span>
                                    <p className="text-slate-700 text-xs font-medium">{detailMobilModal.keterangan}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
                            <button 
                                type="button" 
                                onClick={() => setDetailMobilModal(null)} 
                                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
                            >
                                Tutup
                            </button>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const id = detailMobilModal.id;
                                        setDetailMobilModal(null);
                                        setRejectModal({ id, type: 'pengajuan_mobil' });
                                    }} 
                                    className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
                                >
                                    Tolak Permohonan
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const id = detailMobilModal.id;
                                        setDetailMobilModal(null);
                                        handleApproveMobil(id);
                                    }} 
                                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                                >
                                    Izinkan / Setujui
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        
            {/* MODAL TAMBAH AKUN SECURITY DARI AUTH BPOM */}
            {showSecurityModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        
                        {/* Header Modal */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-1.5 bg-blue-100 text-blue-700">
                                    <span className="material-symbols-outlined text-[15px]">verified_user</span>
                                    Data Auth BPOM
                                </div>
                                <h3 className="text-xl font-black text-slate-900 leading-snug">
                                    Tambah Akun Security Pos Jaga
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Pilih pegawai dari database central <strong>Auth BPOM</strong> untuk diberikan hak akses sebagai Petugas Security.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowSecurityModal(false)} 
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[22px]">close</span>
                            </button>
                        </div>

                        {/* Search Bar Input */}
                        <div className="relative shrink-0">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                value={authSearch}
                                onChange={(e) => setAuthSearch(e.target.value)}
                                placeholder="Cari nama pegawai, NIP, fungsi, atau email..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition"
                                autoFocus
                            />
                        </div>

                        {/* List Pegawai dari Auth BPOM */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                            {isLoadingAuthEmployees ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                                    <p className="text-xs font-semibold">Memuat daftar pegawai dari Auth BPOM...</p>
                                </div>
                            ) : (
                                <>
                                    {authBpomEmployees
                                        .filter((emp: any) => {
                                            const isAlreadySecurity = securityUsers.some((sec) => sec.id === emp.id || sec.email === emp.email);
                                            if (isAlreadySecurity) return false;

                                            if (!authSearch.trim()) return true;
                                            const s = authSearch.toLowerCase();
                                            const matchName = String(emp.name || '').toLowerCase().includes(s);
                                            const matchEmail = String(emp.email || '').toLowerCase().includes(s);
                                            const matchNip = String(emp.employee?.nip || '').toLowerCase().includes(s);
                                            const matchFungsi = String(emp.employee?.fungsi?.name || '').toLowerCase().includes(s);
                                            return matchName || matchEmail || matchNip || matchFungsi;
                                        })
                                        .slice(0, 30)
                                        .map((emp: any) => {
                                            const isSelected = selectedAuthEmployee?.id === emp.id;
                                            return (
                                                <div
                                                    key={emp.id}
                                                    onClick={() => setSelectedAuthEmployee(emp)}
                                                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                                                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {emp.name?.charAt(0) || 'P'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-slate-900 text-xs">{emp.name}</h4>
                                                                {emp.employee?.fungsi?.name && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                                        {emp.employee.fungsi.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                                                <span>{emp.email}</span>
                                                                {emp.employee?.nip && <span>• NIP: {emp.employee.nip}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                                                        }`}>
                                                            {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {authBpomEmployees.filter((emp: any) => {
                                        const isAlreadySecurity = securityUsers.some((sec) => sec.id === emp.id || sec.email === emp.email);
                                        if (isAlreadySecurity) return false;
                                        if (!authSearch.trim()) return true;
                                        const s = authSearch.toLowerCase();
                                        return String(emp.name || '').toLowerCase().includes(s) || String(emp.email || '').toLowerCase().includes(s);
                                    }).length === 0 && (
                                        <div className="text-center py-8 text-xs text-slate-400 italic">
                                            Tidak ditemukan pegawai yang cocok dengan kata kunci "{authSearch}".
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Selected Preview & Submit */}
                        <div className="pt-3 border-t border-slate-100 shrink-0 space-y-3">
                            {selectedAuthEmployee ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-950">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                        <span>Pegawai Terpilih: <strong>{selectedAuthEmployee.name}</strong> ({selectedAuthEmployee.email})</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">Siap Ditugaskan</span>
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-400 italic">
                                    * Silakan klik salah satu nama pegawai di atas untuk menetapkannya sebagai Security.
                                </p>
                            )}

                            <div className="flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowSecurityModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddSecurityUser}
                                    disabled={!selectedAuthEmployee || isSubmittingSecurity}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[16px]">shield</span>
                                    {isSubmittingSecurity ? "Menyimpan..." : "Tetapkan Sebagai Security"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
