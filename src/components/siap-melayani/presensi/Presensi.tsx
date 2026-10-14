<<<<<<< HEAD
=======
"use client";

import { showAlert } from "@/features/alertSlice";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "@/utils/dayjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PresensiCard from "./PresensiCard";
import PresensiTableSiapMelayani from "./PresensiTable";

export default function PresensiSiapMelayani() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);

    const [loadingStage, setLoadingStage] = useState<boolean>(true);
    const [stage, setStage] = useState<
        "unauthenticated" | "bukan_mahasiswa" | "belum_mengajukan" | "diproses" | "ditolak" | "belum_peserta" | "diterima"
    >("unauthenticated");
    const [pengajuanInfo, setPengajuanInfo] = useState<any>(null);
    const [dataPresensi, setDataPresensi] = useState<any>(null);

    // Ambil data status pengajuan dan data presensi
    const checkStatusAndFetchData = useCallback(async () => {
        setLoadingStage(true);

        try {
            // Cek data pengajuan PKL user
            const pengajuanRes = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl`);
            const submissions = pengajuanRes?.data?.data || [];

            if (submissions.length === 0) {
                setStage("belum_mengajukan");
                setLoadingStage(false);
                return;
            }

            const latest = submissions[0];
            setPengajuanInfo(latest);

            if (latest.status === "diproses") {
                setStage("diproses");
                setLoadingStage(false);
                return;
            }

            if (latest.status === "ditolak") {
                setStage("ditolak");
                setLoadingStage(false);
                return;
            }

            if (latest.status === "diterima") {
                // Pengajuan diterima, sekarang panggil API presensi
                try {
                    const presensiRes = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/presensi-pkl`);
                    setDataPresensi(presensiRes.data);
                    setStage("diterima");
                } catch (presensiErr: any) {
                    if (presensiErr?.response?.data?.stage === "belum_peserta") {
                        setStage("belum_peserta");
                    } else if (presensiErr?.response?.data?.stage) {
                        setStage(presensiErr.response.data.stage);
                    } else {
                        // Jika 403 karena peserta belum disetup
                        setStage("belum_peserta");
                    }
                }
            } else {
                setStage("belum_mengajukan");
            }
        } catch (err: any) {
            // Jika error 403 atau lainnya
            const backendStage = err?.response?.data?.stage;
            if (backendStage === "belum_mengajukan") {
                setStage("belum_mengajukan");
            } else if (backendStage === "diproses") {
                setStage("diproses");
            } else if (backendStage === "ditolak") {
                setStage("ditolak");
            } else if (backendStage === "belum_peserta") {
                setStage("belum_peserta");
            }
        } finally {
            setLoadingStage(false);
        }
    }, []);

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                setStage("unauthenticated");
                setLoadingStage(false);
            } else if (!user.student) {
                setStage("bukan_mahasiswa");
                setLoadingStage(false);
            } else {
                checkStatusAndFetchData();
            }
        }
    }, [user, authLoading, checkStatusAndFetchData]);

    // Callback untuk refresh data presensi setelah check-in / check-out
    const handlePresensiUpdated = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/presensi-pkl`)
            .then((res) => {
                setDataPresensi(res.data);
            })
            .catch(() => {});
    };

    // 1. Loading State
    if (authLoading || loadingStage) {
        return (
            <div className="max-w-xl mx-auto my-16 bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
                <span className="material-symbols-outlined animate-spin text-bpom-blue !text-4xl">
                    progress_activity
                </span>
                <h3 className="font-bold text-slate-800 text-lg mt-4">Memeriksa Status Akses</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Sedang memverifikasi status pengajuan PKL dan profil peserta Anda di sistem BBPOM di Mataram...
                </p>
            </div>
        );
    }

    // 2. Belum Login
    if (stage === "unauthenticated") {
        return (
            <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-bpom-blue flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined !text-[32px]">lock</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-bpom-blue bg-blue-50 px-3 py-1 rounded-full">
                    Akses Diperlukan
                </span>
                <h2 className="text-2xl font-bold font-serif text-slate-800 mt-3 mb-2">
                    Silakan Masuk Terlebih Dahulu
                </h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Halaman Presensi Mahasiswa PKL memerlukan autentikasi. Silakan masuk terlebih dahulu dengan akun mahasiswa yang telah terdaftar.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/login?redirectUrl=/siap-melayani/presensi"
                        className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
                    >
                        Masuk ke Akun
                    </Link>
                    <Link
                        href="/register?redirectUrl=/siap-melayani/presensi"
                        className="px-6 py-2.5 rounded-xl bg-bpom-blue text-white font-semibold text-sm hover:bg-bpom-blue/90 shadow-xs transition-all"
                    >
                        Daftar Akun Baru
                    </Link>
                </div>
            </div>
        );
    }

    // 3. Akun Bukan Mahasiswa
    if (stage === "bukan_mahasiswa") {
        return (
            <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined !text-[32px]">school</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
                    Akses Khusus Mahasiswa PKL
                </span>
                <h2 className="text-2xl font-bold font-serif text-slate-800 mt-3 mb-2">
                    Akses Tidak Diizinkan
                </h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Layanan pencatatan presensi kehadiran ini hanya diperuntukkan bagi mahasiswa aktif yang terdaftar dalam program PKL di Balai Besar POM di Mataram.
                </p>
                <Link
                    href="/siap-melayani"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-900 shadow-xs transition-all"
                >
                    <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                    <span>Kembali ke Beranda</span>
                </Link>
            </div>
        );
    }

    // 4. Belum Mengajukan PKL
    if (stage === "belum_mengajukan") {
        return (
            <div className="max-w-2xl mx-auto my-8 space-y-6">
                {/* Stepper Progres */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold mb-4 px-2">
                        <span className="text-bpom-blue">Tahapan Progres PKL</span>
                        <span className="text-slate-400">Langkah 1 dari 3</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                            <span className="w-6 h-6 rounded-full bg-bpom-blue text-white flex items-center justify-center text-xs mx-auto mb-1.5 font-bold">1</span>
                            <span className="text-xs font-semibold text-bpom-blue block">Pengajuan PKL</span>
                            <span className="text-[10px] text-blue-600 font-medium">Belum Dilakukan</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center opacity-60">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs mx-auto mb-1.5 font-bold">2</span>
                            <span className="text-xs font-semibold text-slate-700 block">Verifikasi BBPOM</span>
                            <span className="text-[10px] text-slate-400">Menunggu</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center opacity-60">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs mx-auto mb-1.5 font-bold">3</span>
                            <span className="text-xs font-semibold text-slate-700 block">Presensi Harian</span>
                            <span className="text-[10px] text-slate-400">Terkunci 🔒</span>
                        </div>
                    </div>
                </div>

                {/* Warning Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
                        <span className="material-symbols-outlined !text-[34px]">assignment_late</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
                        Tahap 1: Pengajuan Belum Dibuat
                    </span>
                    <h2 className="text-2xl font-bold font-serif text-slate-800 mt-3 mb-2">
                        Anda Belum Mengajukan PKL
                    </h2>
                    <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                        Fitur pencatatan presensi kehadiran hanya dapat digunakan setelah pengajuan Praktik Kerja Lapangan Anda diajukan dan disetujui (DITERIMA) oleh pihak BBPOM di Mataram.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/siap-melayani/tata-tertib-pkl"
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors text-center"
                        >
                            Baca Tata Tertib
                        </Link>
                        <Link
                            href="/siap-melayani/pengajuan-pkl/form"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-bpom-blue text-white font-semibold text-sm hover:bg-bpom-blue/90 shadow-md shadow-blue-500/20 transition-all text-center"
                        >
                            <span className="material-symbols-outlined !text-[18px]">add_circle</span>
                            <span>Ajukan PKL Sekarang</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 5. Pengajuan Sedang Diproses
    if (stage === "diproses") {
        return (
            <div className="max-w-2xl mx-auto my-8 space-y-6">
                {/* Stepper Progres */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold mb-4 px-2">
                        <span className="text-amber-600">Tahapan Progres PKL</span>
                        <span className="text-slate-400">Langkah 2 dari 3</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs mx-auto mb-1.5 font-bold">✓</span>
                            <span className="text-xs font-semibold text-emerald-800 block">Pengajuan PKL</span>
                            <span className="text-[10px] text-emerald-600 font-medium">Selesai Dikirim</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-center shadow-xs">
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs mx-auto mb-1.5 font-bold animate-pulse">2</span>
                            <span className="text-xs font-semibold text-amber-800 block">Verifikasi BBPOM</span>
                            <span className="text-[10px] text-amber-700 font-medium">Sedang Berjalan ⏳</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center opacity-60">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs mx-auto mb-1.5 font-bold">3</span>
                            <span className="text-xs font-semibold text-slate-700 block">Presensi Harian</span>
                            <span className="text-[10px] text-slate-400">Terkunci 🔒</span>
                        </div>
                    </div>
                </div>

                {/* Warning Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
                        <span className="material-symbols-outlined !text-[34px]">hourglass_top</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
                        Tahap 2: Menunggu Verifikasi BBPOM
                    </span>
                    <h2 className="text-2xl font-bold font-serif text-slate-800 mt-3 mb-2">
                        Pengajuan PKL Sedang Diverifikasi
                    </h2>
                    <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                        Berkas dan permohonan PKL Anda telah kami terima dan saat ini sedang ditinjau oleh tim BBPOM di Mataram. Fitur presensi akan otomatis aktif setelah pengajuan Anda dinyatakan <strong>DITERIMA</strong>.
                    </p>

                    {/* Ringkasan Pengajuan */}
                    {pengajuanInfo && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-left max-w-md mx-auto mb-8 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Penempatan</span>
                                <span className="font-semibold text-slate-800">{pengajuanInfo?.position?.name || "Belum ditentukan"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Periode Kegiatan</span>
                                <span className="font-semibold text-slate-800">
                                    {dayjs(pengajuanInfo?.period_start).format("DD MMM YYYY")} - {dayjs(pengajuanInfo?.period_end).format("DD MMM YYYY")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Status</span>
                                <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Sedang Ditinjau
                                </span>
                            </div>
                        </div>
                    )}

                    <Link
                        href="/siap-melayani/pengajuan-pkl"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-bpom-blue text-white font-semibold text-sm hover:bg-bpom-blue/90 shadow-md shadow-blue-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined !text-[18px]">visibility</span>
                        <span>Cek Status Pengajuan PKL</span>
                    </Link>
                </div>
            </div>
        );
    }

    // 6. Pengajuan Ditolak
    if (stage === "ditolak") {
        return (
            <div className="max-w-2xl mx-auto my-8 space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200/60">
                        <span className="material-symbols-outlined !text-[34px]">cancel</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60">
                        Status: Belum Dapat Diterima
                    </span>
                    <h2 className="text-2xl font-bold font-serif text-slate-800 mt-3 mb-2">
                        Pengajuan PKL Belum Diterima
                    </h2>
                    <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                        Mohon maaf, permohonan Praktik Kerja Lapangan Anda belum dapat disetujui oleh pihak BBPOM di Mataram. Karena itu, akses presensi tidak dapat diaktifkan.
                    </p>

                    {pengajuanInfo?.catatan && (
                        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-left max-w-md mx-auto mb-8 text-xs">
                            <span className="font-semibold text-rose-800 block mb-1">Catatan Penolakan:</span>
                            <p className="text-rose-700">{pengajuanInfo.catatan}</p>
                        </div>
                    )}

                    <Link
                        href="/siap-melayani/pengajuan-pkl"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-900 shadow-xs transition-all"
                    >
                        <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                        <span>Kembali ke Halaman Pengajuan</span>
                    </Link>
                </div>
            </div>
        );
    }

    // 7. Pengajuan Diterima Tapi Belum Diaktifkan Peserta
    if (stage === "belum_peserta") {
        return (
            <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-bpom-blue flex items-center justify-center mx-auto mb-4 border border-blue-200/60">
                    <span className="material-symbols-outlined !text-[34px]">manage_accounts</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                    Pengajuan Diterima ✓
                </span>
                <h2 className="text-2xl font-bold font-serif text-slate-800 mt-3 mb-2">
                    Menunggu Aktivasi Akun Peserta
                </h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Selamat, pengajuan PKL Anda telah diterima oleh BBPOM di Mataram! Saat ini akun peserta Anda sedang dalam proses konfigurasi oleh administrator untuk memulai pencatatan presensi.
                </p>
                <Link
                    href="/siap-melayani/pengajuan-pkl"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-bpom-blue text-white font-semibold text-sm hover:bg-bpom-blue/90 shadow-md transition-all"
                >
                    <span className="material-symbols-outlined !text-[18px]">assignment</span>
                    <span>Lihat Berkas Pengajuan</span>
                </Link>
            </div>
        );
    }

    // 8. Pengajuan Diterima & Peserta Aktif: RENDER PRESENSI
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-3xl px-6 py-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[22px]">how_to_reg</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold font-serif text-slate-800">
                                Portal Presensi Mahasiswa
                            </h1>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Peserta Aktif
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {pengajuanInfo?.position?.name ? `Penempatan: ${pengajuanInfo.position.name}` : 'BBPOM di Mataram'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Link
                        href="/siap-melayani/pengajuan-pkl"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                        <span className="material-symbols-outlined !text-[16px]">folder_shared</span>
                        <span>Berkas PKL</span>
                    </Link>
                </div>
            </div>

            {/* Presensi Cards (Check In & Check Out) */}
            <PresensiCard
                checkInTime={dataPresensi?.check_in_time}
                checkOutTime={dataPresensi?.check_out_time}
                userName={user?.name || ""}
                onPresensiUpdated={handlePresensiUpdated}
            />

            {/* Presensi Table */}
            <PresensiTableSiapMelayani
                data={dataPresensi?.data_presensi?.data || []}
            />
        </div>
    );
}
>>>>>>> 51c15b5ae5503b85174c5e32672c39c7ee27f21f
