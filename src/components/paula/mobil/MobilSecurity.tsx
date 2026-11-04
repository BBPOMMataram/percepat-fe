/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import api from "@/utils/axios";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobilServis from "./MobilServis";

interface PengajuanMobilItem {
    id: number;
    tujuan_dinas: string;
    tujuan_lokasi: string;
    tanggal_pinjam: string;
    tanggal_kembali: string | null;
    waktu_mulai: string;
    waktu_selesai: string | null;
    kendaraan: string;
    driver: string;
    penanggung_jawab: string;
    jumlah_penumpang: number;
    odometer_keluar?: number;
    waktu_realisasi_keluar?: string;
    petugas_security_keluar?: string;
    odometer_kembali?: number;
    jarak_tempuh_km?: number;
    waktu_realisasi_kembali?: string;
    petugas_security_kembali?: string;
    kondisi_kendaraan?: "baik" | "rusak";
    catatan_kerusakan?: string;
    foto_kerusakan_path?: string;
    bbm_nominal?: number;
    bbm_liter?: number;
    bbm_struk_path?: string;
    indikator_bbm?: string;
    kelengkapan_stnk?: boolean;
    kelengkapan_kunci?: boolean;
    kelengkapan_ban_serep?: boolean;
    kelengkapan_dongkrak?: boolean;
    kelengkapan_kebersihan?: string;
    estimasi_odometer_awal?: number;
    mobil_data?: {
        id: number;
        nama: string;
        plat_nomor: string;
        odometer_saat_ini: number;
        status_servis: string;
        kondisi_fisik: string;
    };
}

interface MobilSecurityProps {
    initialTab?: "gate" | "servis";
}

export default function MobilSecurity({ initialTab = "gate" }: MobilSecurityProps) {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA;

    const [mainTab, setMainTab] = useState<"gate" | "servis">(initialTab);
    const [wajibServisCount, setWajibServisCount] = useState(0);
    const [unreadKerusakanCount, setUnreadKerusakanCount] = useState(0);

    const [activeTab, setActiveTab] = useState<"ready" | "outside" | "history">("ready");
    const [readyList, setReadyList] = useState<PengajuanMobilItem[]>([]);
    const [outsideList, setOutsideList] = useState<PengajuanMobilItem[]>([]);
    const [historyList, setHistoryList] = useState<PengajuanMobilItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [paulaUser, setPaulaUser] = useState<any>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Modal Gate Out
    const [gateOutItem, setGateOutItem] = useState<PengajuanMobilItem | null>(null);
    const [odometerKeluar, setOdometerKeluar] = useState<number | "">("");
    const [petugasKeluar, setPetugasKeluar] = useState("");
    const [catatanKeluar, setCatatanKeluar] = useState("");
    const [isSubmittingOut, setIsSubmittingOut] = useState(false);

    // Modal Gate In
    const [gateInItem, setGateInItem] = useState<PengajuanMobilItem | null>(null);
    const [odometerKembali, setOdometerKembali] = useState<number | "">("");
    const [petugasKembali, setPetugasKembali] = useState("");
    const [kondisiKendaraan, setKondisiKendaraan] = useState<"baik" | "rusak">("baik");
    const [kelSTNK, setKelSTNK] = useState(true);
    const [kelKunci, setKelKunci] = useState(true);
    const [kelBanSerep, setKelBanSerep] = useState(true);
    const [kelDongkrak, setKelDongkrak] = useState(true);
    const [kelKebersihan, setKelKebersihan] = useState<"bersih" | "kotor">("bersih");
    const [indikatorBbm, setIndikatorBbm] = useState("3/4");
    const [bbmNominal, setBbmNominal] = useState<number | "">("");
    const [bbmLiter, setBbmLiter] = useState<number | "">("");
    const [bbmStrukFile, setBbmStrukFile] = useState<File | null>(null);
    const [catatanKerusakan, setCatatanKerusakan] = useState("");
    const [fotoKerusakanFile, setFotoKerusakanFile] = useState<File | null>(null);
    const [isSubmittingIn, setIsSubmittingIn] = useState(false);

    const fetchSummaryCounts = async () => {
        try {
            const [resService, resKerusakan] = await Promise.all([
                api.get(`${backendUrl}/api/paula/admin/mobil/service-status`),
                api.get(`${backendUrl}/api/paula/admin/mobil/kerusakan`),
            ]);
            setWajibServisCount(resService.data?.wajib_servis_count || 0);
            setUnreadKerusakanCount(resKerusakan.data?.unread_count || 0);
        } catch {
            // silent fallback
        }
    };

    const fetchSecurityData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`${backendUrl}/api/paula/security/mobil/list`);
            setReadyList(res.data.readyToLeave || []);
            setOutsideList(res.data.currentlyOutside || []);
            setHistoryList(res.data.recentReturns || []);
        } catch (error: any) {
            console.error("Gagal memuat data pos security:", error);
            toast.error("Gagal memuat data pos security");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshAll = () => {
        fetchSecurityData();
        fetchSummaryCounts();
    };

    const handleSwitchMainTab = (tab: "gate" | "servis") => {
        setMainTab(tab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            window.history.replaceState(null, "", url.toString());
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get("tab");
            if (tabParam === "servis" || tabParam === "gate") {
                setMainTab(tabParam);
            } else if (initialTab) {
                setMainTab(initialTab);
            }
        }
    }, [initialTab]);

    useEffect(() => {
        fetchSecurityData();
        fetchSummaryCounts();
        api.get(`${backendUrl}/api/paula/user/me`)
            .then((res) => {
                setPaulaUser(res.data?.user || null);
            })
            .catch(() => {})
            .finally(() => {
                setIsCheckingAuth(false);
            });
    }, []);

    // Buka Modal Gate Out
    const handleOpenGateOut = (item: PengajuanMobilItem) => {
        setGateOutItem(item);
        setOdometerKeluar(item.estimasi_odometer_awal || item.mobil_data?.odometer_saat_ini || 0);
        setPetugasKeluar(paulaUser?.name || user?.name ? `${paulaUser?.name || user?.name} (Security)` : "Petugas Pos Jaga");
        setCatatanKeluar("Kunci dan STNK diserahkan, kondisi fisik siap dinas.");
    };

    // Submit Gate Out
    const handleSubmitGateOut = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gateOutItem) return;
        if (odometerKeluar === "" || Number(odometerKeluar) < 0) {
            toast.warning("Silakan masukkan angka odometer awal yang valid");
            return;
        }

        setIsSubmittingOut(true);
        try {
            await api.post(`${backendUrl}/api/paula/security/mobil/checkout/${gateOutItem.id}`, {
                odometer_keluar: Number(odometerKeluar),
                petugas_security_keluar: petugasKeluar,
                catatan_keluar: catatanKeluar,
            });
            toast.success("Mobil dinas berhasil dicatat keluar gerbang!");
            setGateOutItem(null);
            fetchSecurityData();
        } catch (err: any) {
            console.error("Error gate out:", err);
            toast.error(err.response?.data?.message || "Gagal mencatat keberangkatan mobil");
        } finally {
            setIsSubmittingOut(false);
        }
    };

    // Buka Modal Gate In
    const handleOpenGateIn = (item: PengajuanMobilItem) => {
        setGateInItem(item);
        const keluarOdo = item.odometer_keluar || item.mobil_data?.odometer_saat_ini || 0;
        setOdometerKembali(keluarOdo + 10); // default estimasi
        setPetugasKembali(paulaUser?.name || user?.name ? `${paulaUser?.name || user?.name} (Security)` : "Petugas Pos Jaga");
        setKondisiKendaraan("baik");
        setKelSTNK(true);
        setKelKunci(true);
        setKelBanSerep(true);
        setKelDongkrak(true);
        setKelKebersihan("bersih");
        setIndikatorBbm("1/2");
        setBbmNominal("");
        setBbmLiter("");
        setBbmStrukFile(null);
        setCatatanKerusakan("");
        setFotoKerusakanFile(null);
    };

    // Submit Gate In
    const handleSubmitGateIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gateInItem) return;

        const keluarOdo = gateInItem.odometer_keluar || 0;
        if (odometerKembali === "" || Number(odometerKembali) < keluarOdo) {
            toast.warning(`Odometer akhir (${odometerKembali}) tidak boleh lebih kecil dari Odometer awal (${keluarOdo} KM)`);
            return;
        }

        if (kondisiKendaraan === "rusak" && !catatanKerusakan.trim()) {
            toast.warning("Wajib melengkapi catatan kerusakan jika kendaraan dilaporkan rusak!");
            return;
        }

        setIsSubmittingIn(true);
        try {
            const formData = new FormData();
            formData.append("odometer_kembali", String(odometerKembali));
            formData.append("petugas_security_kembali", petugasKembali);
            formData.append("kondisi_kendaraan", kondisiKendaraan);
            formData.append("kelengkapan_stnk", kelSTNK ? "1" : "0");
            formData.append("kelengkapan_kunci", kelKunci ? "1" : "0");
            formData.append("kelengkapan_ban_serep", kelBanSerep ? "1" : "0");
            formData.append("kelengkapan_dongkrak", kelDongkrak ? "1" : "0");
            formData.append("kelengkapan_kebersihan", kelKebersihan);
            formData.append("indikator_bbm", indikatorBbm);

            if (bbmNominal !== "") formData.append("bbm_nominal", String(bbmNominal));
            if (bbmLiter !== "") formData.append("bbm_liter", String(bbmLiter));
            if (bbmStrukFile) formData.append("bbm_struk", bbmStrukFile);

            if (catatanKerusakan.trim()) formData.append("catatan_kerusakan", catatanKerusakan);
            if (fotoKerusakanFile) formData.append("foto_kerusakan", fotoKerusakanFile);

            const res = await api.post(
                `${backendUrl}/api/paula/security/mobil/checkin/${gateInItem.id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (kondisiKendaraan === "rusak") {
                toast.error("Pemeriksaan selesai. Laporan kerusakan telah dikirim otomatis ke Ka Balai & Ka TU!");
            } else {
                toast.success(`Mobil dinas berhasil dicatat kembali! Jarak tempuh: ${res.data.jarak_tempuh_km} KM.`);
            }

            setGateInItem(null);
            fetchSecurityData();
        } catch (err: any) {
            console.error("Error gate in:", err);
            toast.error(err.response?.data?.message || "Gagal mencatat kepulangan mobil");
        } finally {
            setIsSubmittingIn(false);
        }
    };

    const calculatedDistance =
        gateInItem && odometerKembali !== ""
            ? Math.max(0, Number(odometerKembali) - (gateInItem.odometer_keluar || 0))
            : 0;

    const isAuthorized = Boolean(
        paulaUser?.is_security ||
        paulaUser?.is_admin ||
        user?.role?.level === "superadmin" ||
        user?.role?.level === "admin" ||
        (user?.role as any) === "superadmin" ||
        (user?.role as any) === "admin"
    );

    useEffect(() => {
        if (!isCheckingAuth && user && !isAuthorized) {
            toast.warning("Halaman Pos Security hanya dapat diakses oleh Petugas Security!");
            router.replace("/paula/mobil");
        }
    }, [isCheckingAuth, user, isAuthorized, router]);

    if (!isCheckingAuth && user && !isAuthorized) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
            {/* Header Pos Jaga */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold">
                        <Icon icon="solar:shield-check-bold" width={16} />
                        Pos Jaga Security & Kontrol Armada
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Pemeriksaan Kendaraan & Pemantauan Servis
                    </h1>
                    <p className="text-blue-200/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                        Pusat kontrol pos jaga untuk pencatatan keluar & masuk (Gate Pass Odometer & BBM), serta pemantauan kondisi fisik dan status servis berkala armada dinas.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 z-10">
                    <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left">
                        <p className="text-[10px] text-blue-200">Petugas Jaga</p>
                        <p className="text-xs font-bold text-white truncate max-w-[140px]">
                            {paulaUser?.name || user?.name || "Security"}
                        </p>
                    </div>

                    <button
                        onClick={handleRefreshAll}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition border border-white/10 shadow-2xs cursor-pointer"
                        title="Segarkan Semua Data"
                    >
                        <Icon icon="solar:refresh-linear" width={15} />
                        <span>Segarkan</span>
                    </button>
                </div>
            </div>

            {/* NAVIGASI TAB UTAMA: GATE PASS vs MONITORING SERVIS */}
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
                <button
                    type="button"
                    onClick={() => handleSwitchMainTab("gate")}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                        mainTab === "gate"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <Icon icon="solar:shield-check-bold" width={18} />
                    <span>Pemeriksaan Keluar & Masuk (Gate Pass)</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                        mainTab === "gate" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                        {readyList.length + outsideList.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSwitchMainTab("servis")}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                        mainTab === "servis"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <Icon icon="solar:wrench-bold" width={18} />
                    <span>Status Servis & Kerusakan Armada</span>
                    {(unreadKerusakanCount > 0 || wajibServisCount > 0) ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                            mainTab === "servis" ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700"
                        }`}>
                            {unreadKerusakanCount + wajibServisCount} Perhatian
                        </span>
                    ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                            mainTab === "servis" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                        }`}>
                            Prima
                        </span>
                    )}
                </button>
            </div>

            {/* TAB CONTENT: MONITORING SERVIS */}
            {mainTab === "servis" && (
                <div className="animate-in fade-in duration-200">
                    <MobilServis hideHeader={true} />
                </div>
            )}

            {/* TAB CONTENT: GATE PASS */}
            {mainTab === "gate" && (
                <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    onClick={() => setActiveTab("ready")}
                    className={`p-5 rounded-2xl border transition cursor-pointer shadow-sm ${
                        activeTab === "ready"
                            ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20"
                            : "bg-white border-slate-200 hover:border-amber-200"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Siap Berangkat (Gate Out)</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <Icon icon="solar:logout-2-bold" width={18} />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-800 mt-2">{readyList.length}</p>
                    <p className="text-[11px] text-amber-700 font-medium mt-1">Mobil menunggu dicatat keluar</p>
                </div>

                <div
                    onClick={() => setActiveTab("outside")}
                    className={`p-5 rounded-2xl border transition cursor-pointer shadow-sm ${
                        activeTab === "outside"
                            ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                            : "bg-white border-slate-200 hover:border-blue-200"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Sedang Keluar (Gate In)</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            <Icon icon="solar:login-2-bold" width={18} />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-800 mt-2">{outsideList.length}</p>
                    <p className="text-[11px] text-blue-700 font-medium mt-1">Mobil sedang dinas di jalan</p>
                </div>

                <div
                    onClick={() => setActiveTab("history")}
                    className={`p-5 rounded-2xl border transition cursor-pointer shadow-sm ${
                        activeTab === "history"
                            ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20"
                            : "bg-white border-slate-200 hover:border-emerald-200"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Riwayat Kepulangan</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <Icon icon="solar:history-bold" width={18} />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-800 mt-2">{historyList.length}</p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">Pengembalian tercatat selesai</p>
                </div>
            </div>

            {/* Tab Navigasi */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab("ready")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === "ready"
                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <Icon icon="solar:logout-2-bold" width={15} />
                    <span>Mobil Siap Keluar ({readyList.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab("outside")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === "outside"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <Icon icon="solar:login-2-bold" width={15} />
                    <span>Sedang di Jalan ({outsideList.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === "history"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <Icon icon="solar:checklist-minimalistic-bold" width={15} />
                    <span>Riwayat Masuk ({historyList.length})</span>
                </button>
            </div>

            {/* Konten Tab 1: Siap Keluar */}
            {activeTab === "ready" && (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-16 text-center text-xs text-slate-400">Memuat data mobil siap keluar...</div>
                    ) : readyList.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
                            <Icon icon="solar:check-circle-bold" width={48} className="mx-auto text-emerald-500 mb-3" />
                            <h3 className="font-bold text-slate-800 text-base">Semua Mobil Sudah Dicatat Keluar</h3>
                            <p className="text-xs text-slate-400 mt-1">Tidak ada jadwal peminjaman yang menunggu pencatatan keluar gerbang saat ini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {readyList.map((item) => (
                                <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-extrabold text-base text-slate-900">{item.kendaraan}</h3>
                                                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200">
                                                    {item.mobil_data?.plat_nomor || "Plat Dinas BPOM"}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shrink-0">
                                                <Icon icon="solar:clock-circle-bold" width={14} />
                                                Siap Keluar
                                            </span>
                                        </div>

                                        <div className="bg-slate-50/70 p-3.5 rounded-2xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                                            <p className="font-bold text-slate-900 line-clamp-1">{item.tujuan_dinas}</p>
                                            <p className="flex items-center gap-1.5 text-slate-500">
                                                <Icon icon="solar:map-point-bold" width={14} className="text-rose-500 shrink-0" />
                                                <span>{item.tujuan_lokasi}</span>
                                            </p>
                                            <p className="flex items-center gap-1.5 text-slate-500">
                                                <Icon icon="solar:user-bold" width={14} className="text-blue-500 shrink-0" />
                                                <span>Driver: <strong className="text-slate-700">{item.driver || "Tidak Ada"}</strong></span>
                                            </p>
                                            <p className="flex items-center gap-1.5 text-slate-500">
                                                <Icon icon="solar:calendar-bold" width={14} className="text-emerald-500 shrink-0" />
                                                <span>Rencana: {item.tanggal_pinjam} ({item.waktu_mulai.substring(0, 5)})</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-[11px] text-slate-400">
                                            Odometer Terkini: <strong className="text-slate-700">{item.estimasi_odometer_awal || item.mobil_data?.odometer_saat_ini || 0} KM</strong>
                                        </div>
                                        <button
                                            onClick={() => handleOpenGateOut(item)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
                                        >
                                            <Icon icon="solar:key-bold" width={15} />
                                            <span>Catat Keluar (Gate Out)</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Konten Tab 2: Sedang Keluar / Menunggu Gate In */}
            {activeTab === "outside" && (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-16 text-center text-xs text-slate-400">Memuat data mobil di luar...</div>
                    ) : outsideList.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
                            <Icon icon="solar:shield-check-bold" width={48} className="mx-auto text-blue-500 mb-3" />
                            <h3 className="font-bold text-slate-800 text-base">Semua Kendaraan Berada di Pool Kantor</h3>
                            <p className="text-xs text-slate-400 mt-1">Tidak ada mobil dinas yang sedang beroperasi di luar saat ini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {outsideList.map((item) => (
                                <div key={item.id} className="bg-white rounded-3xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0"></div>
                                    <div className="space-y-3 z-10">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-extrabold text-base text-slate-900">{item.kendaraan}</h3>
                                                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-[11px] font-bold text-blue-800 border border-blue-200">
                                                    {item.mobil_data?.plat_nomor || "Plat Dinas BPOM"}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shrink-0 animate-pulse">
                                                <Icon icon="solar:route-bold" width={14} />
                                                Sedang di Jalan
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                                            <p className="font-bold text-slate-900 line-clamp-1">{item.tujuan_dinas}</p>
                                            <p className="flex items-center gap-1.5 text-slate-500">
                                                <Icon icon="solar:map-point-bold" width={14} className="text-rose-500 shrink-0" />
                                                <span>{item.tujuan_lokasi}</span>
                                            </p>
                                            <p className="flex items-center gap-1.5 text-slate-500">
                                                <Icon icon="solar:speedometer-bold" width={14} className="text-indigo-500 shrink-0" />
                                                <span>Odometer Awal: <strong className="text-slate-800">{item.odometer_keluar || 0} KM</strong></span>
                                            </p>
                                            <p className="flex items-center gap-1.5 text-slate-500">
                                                <Icon icon="solar:clock-circle-bold" width={14} className="text-blue-500 shrink-0" />
                                                <span>Keluar: {item.waktu_realisasi_keluar ? new Date(item.waktu_realisasi_keluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"} (Oleh: {item.petugas_security_keluar || "Security"})</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between z-10">
                                        <div className="text-[11px] text-slate-400">
                                            Peminjam: <strong className="text-slate-700">{item.penanggung_jawab}</strong>
                                        </div>
                                        <button
                                            onClick={() => handleOpenGateIn(item)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
                                        >
                                            <Icon icon="solar:shield-check-bold" width={16} />
                                            <span>Pemeriksaan Kembali (Gate In)</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Konten Tab 3: Riwayat Kepulangan */}
            {activeTab === "history" && (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm">Riwayat Pemeriksaan & Pengembalian Kendaraan</h3>
                        <span className="text-xs text-slate-400">10 data pemeriksaan terakhir</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                                    <th className="px-5 py-3">Mobil & Peminjam</th>
                                    <th className="px-5 py-3">Waktu Keluar / Masuk</th>
                                    <th className="px-5 py-3">Odometer & Jarak</th>
                                    <th className="px-5 py-3">BBM & Struk</th>
                                    <th className="px-5 py-3">Kondisi & Kelengkapan</th>
                                    <th className="px-5 py-3">Petugas Security</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {historyList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-400">Belum ada riwayat kepulangan tercatat.</td>
                                    </tr>
                                ) : (
                                    historyList.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                            <td className="px-5 py-3.5">
                                                <p className="font-bold text-slate-900">{item.kendaraan}</p>
                                                <p className="text-[11px] text-slate-500">{item.penanggung_jawab} • {item.tujuan_dinas}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-slate-800">
                                                    Keluar: {item.waktu_realisasi_keluar ? new Date(item.waktu_realisasi_keluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                                                </p>
                                                <p className="text-slate-500">
                                                    Kembali: {item.waktu_realisasi_kembali ? new Date(item.waktu_realisasi_kembali).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-bold text-slate-800">{item.odometer_keluar || 0} ➔ {item.odometer_kembali || 0} KM</p>
                                                <p className="text-[11px] font-semibold text-emerald-700">
                                                    Jarak Tempuh: {item.jarak_tempuh_km || 0} KM
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {item.bbm_nominal ? (
                                                    <div>
                                                        <p className="font-bold text-slate-800">Rp {Number(item.bbm_nominal).toLocaleString("id-ID")}</p>
                                                        <p className="text-[11px] text-slate-500">{item.bbm_liter || "-"} Liter {item.indikator_bbm ? `(Sisa: ${item.indikator_bbm})` : ""}</p>
                                                        {item.bbm_struk_path && (
                                                            <a href={`${backendUrl}${item.bbm_struk_path}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-[11px] font-bold">
                                                                Lihat Struk
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">Tidak ada pengisian</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-1">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                            item.kondisi_kendaraan === "rusak"
                                                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                                                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                        }`}
                                                    >
                                                        {item.kondisi_kendaraan === "rusak" ? "Ada Kerusakan" : "Kondisi Baik"}
                                                    </span>
                                                    {item.catatan_kerusakan && (
                                                        <p className="text-[11px] text-rose-700 line-clamp-1 italic">{item.catatan_kerusakan}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">
                                                <p className="font-medium">{item.petugas_security_kembali || item.petugas_security_keluar || "-"}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </div>
            )}

            {/* MODAL GATE OUT */}
            {gateOutItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                    <Icon icon="solar:key-bold" width={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Pencatatan Keberangkatan (Gate Out)</h3>
                                    <p className="text-[11px] text-slate-300">{gateOutItem.kendaraan}</p>
                                </div>
                            </div>
                            <button onClick={() => setGateOutItem(null)} className="text-slate-400 hover:text-white">
                                <Icon icon="solar:close-circle-bold" width={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitGateOut} className="p-6 space-y-4 text-xs">
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                                <p className="font-bold text-slate-800 text-sm">{gateOutItem.kendaraan} ({gateOutItem.mobil_data?.plat_nomor})</p>
                                <p className="text-slate-500">Tujuan: <strong>{gateOutItem.tujuan_dinas}</strong> ({gateOutItem.tujuan_lokasi})</p>
                                <p className="text-slate-500">Driver: <strong>{gateOutItem.driver || "Tidak Ada"}</strong> • Peminjam: <strong>{gateOutItem.penanggung_jawab}</strong></p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Odometer Sebelum Keluar (KM) *</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={odometerKeluar}
                                        onChange={(e) => setOdometerKeluar(e.target.value === "" ? "" : Number(e.target.value))}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-black text-slate-800 focus:border-indigo-600 focus:outline-none"
                                        placeholder="Misal: 45200"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
                                </div>
                                <p className="text-[11px] text-slate-400">Pastikan angka odometer sesuai dengan display speedometer di dashboard mobil.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Petugas Security yang Menyerahkan Kunci *</label>
                                <input
                                    type="text"
                                    required
                                    value={petugasKeluar}
                                    onChange={(e) => setPetugasKeluar(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                                    placeholder="Nama Security bertugas..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Catatan Kondisi Awal (Opsional)</label>
                                <textarea
                                    rows={2}
                                    value={catatanKeluar}
                                    onChange={(e) => setCatatanKeluar(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                                    placeholder="Misal: STNK dan kunci kontak diserahkan lengkap, bodi bersih."
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setGateOutItem(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingOut}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md disabled:opacity-50 transition"
                                >
                                    <Icon icon="solar:check-circle-bold" width={16} />
                                    <span>{isSubmittingOut ? "Memproses..." : "Konfirmasi Mobil Keluar"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL GATE IN (Pemeriksaan Kepulangan & Kondisi) */}
            {gateInItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
                        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                                    <Icon icon="solar:shield-check-bold" width={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Pemeriksaan Kepulangan Kendaraan (Gate In)</h3>
                                    <p className="text-[11px] text-blue-200">{gateInItem.kendaraan} ({gateInItem.mobil_data?.plat_nomor})</p>
                                </div>
                            </div>
                            <button onClick={() => setGateInItem(null)} className="text-slate-400 hover:text-white">
                                <Icon icon="solar:close-circle-bold" width={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitGateIn} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
                            {/* Bagian 1: Odometer & Jarak Tempuh */}
                            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3">
                                <h4 className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                                    <Icon icon="solar:speedometer-bold" width={16} className="text-blue-700" />
                                    1. Pencatatan Odometer & Jarak Tempuh
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <span className="text-[11px] text-slate-400 font-semibold block">Odometer Awal Saat Keluar:</span>
                                        <span className="text-base font-black text-slate-800">{gateInItem.odometer_keluar || 0} KM</span>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">Odometer Akhir Setelah Kembali (KM) *</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min={gateInItem.odometer_keluar || 0}
                                                value={odometerKembali}
                                                onChange={(e) => setOdometerKembali(e.target.value === "" ? "" : Number(e.target.value))}
                                                className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm font-black text-slate-800 focus:border-blue-600 focus:outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-blue-100 text-[11px]">
                                    <span className="text-slate-500 font-medium">Jarak Tempuh Dinas:</span>
                                    <span className="font-black text-emerald-700 text-sm">{calculatedDistance} KM</span>
                                </div>
                            </div>

                            {/* Bagian 2: Checklist Kelengkapan & BBM */}
                            <div className="space-y-3">
                                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                                    <Icon icon="solar:checklist-minimalistic-bold" width={16} className="text-indigo-600" />
                                    2. Checklist Kelengkapan & Sisa BBM
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${kelSTNK ? "bg-emerald-50/70 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-600"}`}>
                                        <input type="checkbox" checked={kelSTNK} onChange={(e) => setKelSTNK(e.target.checked)} className="rounded text-emerald-600" />
                                        <span className="text-xs font-bold">STNK Asli</span>
                                    </label>
                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${kelKunci ? "bg-emerald-50/70 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-600"}`}>
                                        <input type="checkbox" checked={kelKunci} onChange={(e) => setKelKunci(e.target.checked)} className="rounded text-emerald-600" />
                                        <span className="text-xs font-bold">Kunci Kontak</span>
                                    </label>
                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${kelBanSerep ? "bg-emerald-50/70 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-600"}`}>
                                        <input type="checkbox" checked={kelBanSerep} onChange={(e) => setKelBanSerep(e.target.checked)} className="rounded text-emerald-600" />
                                        <span className="text-xs font-bold">Ban Serep</span>
                                    </label>
                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${kelDongkrak ? "bg-emerald-50/70 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-600"}`}>
                                        <input type="checkbox" checked={kelDongkrak} onChange={(e) => setKelDongkrak(e.target.checked)} className="rounded text-emerald-600" />
                                        <span className="text-xs font-bold">Dongkrak</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Indikator Sisa BBM:</label>
                                        <select
                                            value={indikatorBbm}
                                            onChange={(e) => setIndikatorBbm(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                                        >
                                            <option value="F">Penuh (Full / F)</option>
                                            <option value="3/4">3/4 Tangki</option>
                                            <option value="1/2">1/2 Tangki</option>
                                            <option value="1/4">1/4 Tangki</option>
                                            <option value="E">Hampir Habis (Empty / E)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Kebersihan Kabin:</label>
                                        <select
                                            value={kelKebersihan}
                                            onChange={(e) => setKelKebersihan(e.target.value as any)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                                        >
                                            <option value="bersih">Bersih & Rapi</option>
                                            <option value="kotor">Kotor (Perlu Cuci)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Bagian 3: Struk BBM (Jika ada) */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                                    <Icon icon="solar:gas-station-bold" width={16} className="text-amber-600" />
                                    3. Pembelian BBM Selama Dinas (Opsional)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600">Nominal Pembelian (Rp):</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={bbmNominal}
                                            onChange={(e) => setBbmNominal(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="Contoh: 250000"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600">Volume BBM (Liter):</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            value={bbmLiter}
                                            onChange={(e) => setBbmLiter(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="Contoh: 25.5"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 mt-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Upload Foto Struk BBM:</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setBbmStrukFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Bagian 4: Kondisi Fisik & Laporan Kerusakan */}
                            <div className="space-y-3">
                                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                                    <Icon icon="solar:danger-triangle-bold" width={16} className="text-rose-600" />
                                    4. Pemeriksaan Keadaan Fisik Kendaraan
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition ${kondisiKendaraan === "baik" ? "bg-emerald-50 border-emerald-400 text-emerald-900" : "bg-white border-slate-200"}`}>
                                        <input type="radio" name="kondisi" value="baik" checked={kondisiKendaraan === "baik"} onChange={() => setKondisiKendaraan("baik")} className="text-emerald-600" />
                                        <div>
                                            <p className="font-bold text-xs">Kondisi Baik / Normal</p>
                                            <p className="text-[10px] text-slate-400">Tidak ada kerusakan baru</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition ${kondisiKendaraan === "rusak" ? "bg-rose-50 border-rose-400 text-rose-900" : "bg-white border-slate-200"}`}>
                                        <input type="radio" name="kondisi" value="rusak" checked={kondisiKendaraan === "rusak"} onChange={() => setKondisiKendaraan("rusak")} className="text-rose-600" />
                                        <div>
                                            <p className="font-bold text-xs text-rose-700">Ada Kerusakan / Keluhan</p>
                                            <p className="text-[10px] text-rose-500">Notifikasi ke Ka Balai & Ka TU</p>
                                        </div>
                                    </label>
                                </div>

                                {kondisiKendaraan === "rusak" && (
                                    <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/70 space-y-3 animate-in fade-in duration-200">
                                        <div className="flex items-start gap-2 text-rose-800 text-[11px]">
                                            <Icon icon="solar:info-circle-bold" width={16} className="text-rose-600 shrink-0 mt-0.5" />
                                            <p>
                                                Laporan ini akan secara <strong>otomatis dikirimkan ke Kepala Balai dan Kasubbag TU</strong> untuk segera ditindaklanjuti dan dijadwalkan perbaikan di bengkel.
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="font-bold text-rose-900 text-xs">Uraian Kerusakan / Kendala Fisik *</label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={catatanKerusakan}
                                                onChange={(e) => setCatatanKerusakan(e.target.value)}
                                                className="w-full rounded-xl border border-rose-300 bg-white p-2.5 text-xs text-slate-800 focus:border-rose-600 focus:outline-none"
                                                placeholder="Jelaskan bagian mana yang rusak/baret/penyok, suara aneh, atau keluhan ban/rem..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="font-bold text-rose-900 text-xs">Foto Bukti Kerusakan</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setFotoKerusakanFile(e.target.files?.[0] || null)}
                                                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                <label className="font-bold text-slate-700">Nama Petugas Security Pemeriksa *</label>
                                <input
                                    type="text"
                                    required
                                    value={petugasKembali}
                                    onChange={(e) => setPetugasKembali(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                                    placeholder="Nama Security pemeriksa..."
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setGateInItem(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingIn}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
                                >
                                    <Icon icon="solar:diskette-bold" width={16} />
                                    <span>{isSubmittingIn ? "Menyimpan Pemeriksaan..." : "Simpan Pemeriksaan & Selesai"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

