/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import api from "@/utils/axios";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";

interface MobilItem {
    id: number;
    nama: string;
    plat_nomor: string;
    kapasitas: number;
    status: string;
    odometer_saat_ini: number;
    terakhir_service_km: number;
    terakhir_service_tanggal: string | null;
    interval_km_service: number;
    interval_bulan_service: number;
    status_servis: "aman" | "wajib_servis";
    kondisi_fisik: "baik" | "rusak" | "dalam_perbaikan";
    service_metrics: {
        km_sejak_servis: number;
        km_sisa: number;
        is_km_due: boolean;
        bulan_sejak_servis: number;
        is_month_due: boolean;
        is_service_due: boolean;
        alasan: string;
    };
}

interface LaporanKerusakanItem {
    id: number;
    pengajuan_mobil_id: number;
    mobil_nama: string;
    plat_nomor: string;
    peminjam_nama: string;
    tujuan_dinas: string;
    petugas_security: string;
    catatan_kerusakan: string;
    foto_kerusakan_path: string | null;
    status: "baru" | "ditindaklanjuti" | "selesai";
    created_at: string;
}

export default function MobilServis() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || "http://localhost:8000";

    const [mobils, setMobils] = useState<MobilItem[]>([]);
    const [notifikasi, setNotifikasi] = useState<LaporanKerusakanItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Modal Edit Setting Servis
    const [settingModalMobil, setSettingModalMobil] = useState<MobilItem | null>(null);
    const [intervalKm, setIntervalKm] = useState<number>(10000);
    const [intervalBulan, setIntervalBulan] = useState<number>(3);
    const [isSavingSetting, setIsSavingSetting] = useState(false);

    // Modal Konfirmasi Servis Selesai
    const [serviceDoneMobil, setServiceDoneMobil] = useState<MobilItem | null>(null);
    const [odoServis, setOdoServis] = useState<number | "">("");
    const [tglServis, setTglServis] = useState<string>("");
    const [isSavingServiceDone, setIsSavingServiceDone] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resService, resKerusakan] = await Promise.all([
                api.get(`${backendUrl}/api/paula/admin/mobil/service-status`),
                api.get(`${backendUrl}/api/paula/admin/mobil/kerusakan`),
            ]);
            setMobils(resService.data.mobils || []);
            setNotifikasi(resKerusakan.data.notifikasi || []);
            setUnreadCount(resKerusakan.data.unread_count || 0);
        } catch (error) {
            console.error("Gagal memuat status servis:", error);
            toast.error("Gagal memuat data servis dan kerusakan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Simpan Pengaturan Servis
    const handleSaveSetting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settingModalMobil) return;
        setIsSavingSetting(true);
        try {
            await api.put(`${backendUrl}/api/paula/admin/mobil/${settingModalMobil.id}/service-settings`, {
                interval_km_service: intervalKm,
                interval_bulan_service: intervalBulan,
            });
            toast.success("Batas servis berkala berhasil diperbarui!");
            setSettingModalMobil(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal menyimpan pengaturan");
        } finally {
            setIsSavingSetting(false);
        }
    };

    // Konfirmasi Servis Telah Selesai
    const handleConfirmServiceDone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serviceDoneMobil) return;
        setIsSavingServiceDone(true);
        try {
            await api.post(`${backendUrl}/api/paula/admin/mobil/${serviceDoneMobil.id}/record-service`, {
                odometer_service: odoServis !== "" ? Number(odoServis) : undefined,
                tanggal_service: tglServis || undefined,
            });
            toast.success(`Servis mobil ${serviceDoneMobil.nama} berhasil dicatat! Status mobil kembali prima.`);
            setServiceDoneMobil(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal mencatat servis selesai");
        } finally {
            setIsSavingServiceDone(false);
        }
    };

    // Tindak Lanjuti Laporan Kerusakan
    const handleResolveKerusakan = async (id: number, status: "ditindaklanjuti" | "selesai") => {
        try {
            await api.patch(`${backendUrl}/api/paula/admin/mobil/kerusakan/${id}/resolve`, { status });
            toast.success(`Laporan kerusakan berhasil ditandai ${status}`);
            fetchData();
        } catch (err: any) {
            toast.error("Gagal memperbarui status kerusakan");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
                        <Icon icon="solar:wrench-bold" width={16} />
                        Pemeliharaan Armada & Notifikasi Insiden
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Monitoring Servis Rutin & Laporan Kerusakan
                    </h1>
                    <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                        Pantau jadwal servis berkala otomatis berdasarkan batas Odometer atau interval 3 bulan, serta tindak lanjuti laporan kerusakan dari pos Security.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 z-10">
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition border border-white/10 cursor-pointer"
                    >
                        <Icon icon="solar:refresh-linear" width={16} />
                        Segarkan Data
                    </button>
                </div>
            </div>

            {/* SECTION 1: ALERT NOTIFIKASI KERUSAKAN (KA BALAI & KA TU) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                            <Icon icon="solar:bell-bing-bold" width={16} />
                        </div>
                        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                            Laporan Kerusakan Kendaraan (Notifikasi Masuk)
                        </h2>
                    </div>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold animate-pulse">
                            {unreadCount} Laporan Baru
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat laporan kerusakan...</div>
                ) : notifikasi.length === 0 ? (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs text-slate-500 shadow-sm">
                        <Icon icon="solar:check-circle-bold" width={22} className="text-emerald-500 shrink-0" />
                        <span>Tidak ada laporan kerusakan kendaraan aktif. Semua armada dalam kondisi baik.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notifikasi.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-5 rounded-2xl border transition shadow-sm flex flex-col justify-between space-y-3 ${
                                    notif.status === "baru"
                                        ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20"
                                        : "bg-white border-slate-200"
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-extrabold text-sm text-slate-900">{notif.mobil_nama}</h3>
                                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                                                {notif.plat_nomor || "Plat Dinas BPOM"}
                                            </span>
                                        </div>
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                notif.status === "baru"
                                                    ? "bg-rose-600 text-white shadow-sm"
                                                    : notif.status === "ditindaklanjuti"
                                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                            }`}
                                        >
                                            {notif.status}
                                        </span>
                                    </div>

                                    <div className="bg-white/80 p-3 rounded-xl border border-rose-100 text-xs text-slate-700 space-y-1">
                                        <p className="font-semibold text-rose-900">{notif.catatan_kerusakan}</p>
                                        <p className="text-[11px] text-slate-500">
                                            Peminjam: <strong>{notif.peminjam_nama}</strong> • Security: <strong>{notif.petugas_security}</strong>
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            Tujuan: {notif.tujuan_dinas} • Dilaporkan: {new Date(notif.created_at).toLocaleString("id-ID")}
                                        </p>
                                    </div>

                                    {notif.foto_kerusakan_path && (
                                        <div>
                                            <a
                                                href={`${backendUrl}${notif.foto_kerusakan_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-xs font-bold"
                                            >
                                                <Icon icon="solar:gallery-bold" width={14} />
                                                <span>Lihat Foto Bukti Kerusakan</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                    {notif.status === "baru" && (
                                        <button
                                            onClick={() => handleResolveKerusakan(notif.id, "ditindaklanjuti")}
                                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                                        >
                                            Tandai Ditindaklanjuti
                                        </button>
                                    )}
                                    {notif.status !== "selesai" && (
                                        <button
                                            onClick={() => handleResolveKerusakan(notif.id, "selesai")}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                                        >
                                            Tandai Selesai Diperbaiki
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 2: JADWAL & MONITORING SERVIS BERKALA MOBIL */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <Icon icon="solar:speedometer-bold" width={16} />
                        </div>
                        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                            Status Servis Berkala Armada Kendaraan Dinas
                        </h2>
                    </div>
                    <span className="text-xs text-slate-400">
                        Otomatis Wajib Servis jika $\ge$ Batas KM atau $\ge$ 3 Bulan
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">Memuat status armada...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {mobils.map((m) => {
                            const currentKm = m.odometer_saat_ini || 0;
                            const lastKm = m.terakhir_service_km || 0;
                            const intervalKmVal = m.interval_km_service || 10000;
                            const intervalBulanVal = m.interval_bulan_service || 3;
                            const kmSince = m.service_metrics?.km_sejak_servis || 0;
                            const monthsSince = m.service_metrics?.bulan_sejak_servis || 0;
                            const isDue = m.service_metrics?.is_service_due || m.status_servis === "wajib_servis";

                            const progressPercent = Math.min(100, Math.round((kmSince / intervalKmVal) * 100));

                            return (
                                <div
                                    key={m.id}
                                    className={`bg-white rounded-3xl p-6 border transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 ${
                                        isDue
                                            ? "border-amber-400 ring-2 ring-amber-500/10"
                                            : "border-slate-200"
                                    }`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-extrabold text-base text-slate-900">{m.nama}</h3>
                                                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200">
                                                    {m.plat_nomor} • Kapasitas {m.kapasitas} Kursi
                                                </span>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                                                    isDue
                                                        ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                                                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                }`}
                                            >
                                                <Icon icon={isDue ? "solar:danger-triangle-bold" : "solar:check-circle-bold"} width={15} />
                                                {isDue ? "Wajib Servis" : "Kondisi Prima"}
                                            </span>
                                        </div>

                                        {/* Status Message */}
                                        <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${isDue ? "bg-amber-50 border border-amber-200 text-amber-900" : "bg-slate-50 border border-slate-100 text-slate-600"}`}>
                                            <Icon icon="solar:info-circle-bold" width={16} className={isDue ? "text-amber-600 shrink-0" : "text-slate-400 shrink-0"} />
                                            <span>{m.service_metrics?.alasan || "Servis rutin terjadwal secara berkala"}</span>
                                        </div>

                                        {/* Metrik Odometer & Waktu */}
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-[11px] text-slate-400 font-medium block">Odometer Sekarang:</span>
                                                <span className="text-base font-black text-slate-900">{currentKm.toLocaleString("id-ID")} KM</span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">Servis terakhir: {lastKm.toLocaleString("id-ID")} KM</span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-[11px] text-slate-400 font-medium block">Usia Sejak Servis:</span>
                                                <span className="text-base font-black text-slate-900">{monthsSince} Bulan</span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">Batas waktu: {intervalBulanVal} Bulan</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar KM Servis */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-600">Jarak Sejak Servis Terakhir:</span>
                                                <span className="font-bold text-slate-800">
                                                    {kmSince.toLocaleString("id-ID")} / {intervalKmVal.toLocaleString("id-ID")} KM ({progressPercent}%)
                                                </span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${
                                                        progressPercent >= 100
                                                            ? "bg-rose-600"
                                                            : progressPercent >= 75
                                                            ? "bg-amber-500"
                                                            : "bg-emerald-500"
                                                    }`}
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                                setSettingModalMobil(m);
                                                setIntervalKm(m.interval_km_service || 10000);
                                                setIntervalBulan(m.interval_bulan_service || 3);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                                        >
                                            <Icon icon="solar:settings-bold" width={14} />
                                            <span>Atur Batas</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setServiceDoneMobil(m);
                                                setOdoServis(m.odometer_saat_ini || 0);
                                                setTglServis(new Date().toISOString().split("T")[0]);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                                        >
                                            <Icon icon="solar:wrench-bold" width={15} />
                                            <span>Konfirmasi Telah Diservis</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL PENGATURAN BATAS SERVIS */}
            {settingModalMobil && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                            <h3 className="font-bold text-sm">Pengaturan Batas Servis: {settingModalMobil.nama}</h3>
                            <button onClick={() => setSettingModalMobil(null)} className="text-slate-400 hover:text-white">
                                <Icon icon="solar:close-circle-bold" width={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSetting} className="p-6 space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Interval Jarak Odometer (KM):</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1000}
                                        step={500}
                                        required
                                        value={intervalKm}
                                        onChange={(e) => setIntervalKm(Number(e.target.value))}
                                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-bold focus:border-indigo-600 focus:outline-none"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
                                </div>
                                <p className="text-[11px] text-slate-400">Standar operasional: 5.000 KM atau 10.000 KM.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Interval Waktu Servis (Bulan):</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        required
                                        value={intervalBulan}
                                        onChange={(e) => setIntervalBulan(Number(e.target.value))}
                                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-bold focus:border-indigo-600 focus:outline-none"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Bulan</span>
                                </div>
                                <p className="text-[11px] text-slate-400">Sesuai ketentuan, jika sudah mencapai 3 bulan maka mobil wajib servis.</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSettingModalMobil(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingSetting}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md disabled:opacity-50 transition"
                                >
                                    <span>{isSavingSetting ? "Menyimpan..." : "Simpan Pengaturan"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI TELAH DISERVIS */}
            {serviceDoneMobil && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:wrench-bold" width={20} />
                                <h3 className="font-bold text-sm">Konfirmasi Servis Berkala</h3>
                            </div>
                            <button onClick={() => setServiceDoneMobil(null)} className="text-emerald-200 hover:text-white">
                                <Icon icon="solar:close-circle-bold" width={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmServiceDone} className="p-6 space-y-4 text-xs">
                            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 space-y-0.5">
                                <p className="font-bold text-emerald-950 text-sm">{serviceDoneMobil.nama}</p>
                                <p className="text-emerald-700 text-[11px]">{serviceDoneMobil.plat_nomor}</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Angka Odometer Saat Selesai Servis (KM) *</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    value={odoServis}
                                    onChange={(e) => setOdoServis(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-black focus:border-emerald-600 focus:outline-none"
                                    placeholder="Contoh: 68500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Tanggal Servis Selesai *</label>
                                <input
                                    type="date"
                                    required
                                    value={tglServis}
                                    onChange={(e) => setTglServis(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-bold focus:border-emerald-600 focus:outline-none"
                                />
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Setelah dikonfirmasi, sistem otomatis mereset siklus servis dan mengembalikan status mobil menjadi <strong>Kondisi Prima & Tersedia</strong>.
                            </p>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setServiceDoneMobil(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingServiceDone}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
                                >
                                    <Icon icon="solar:check-circle-bold" width={16} />
                                    <span>{isSavingServiceDone ? "Menyimpan..." : "Simpan & Reset Servis"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

