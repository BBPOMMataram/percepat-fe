/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/axios";
import Link from "next/link";
import { Icon } from "@iconify/react";

export default function PaulaHome() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();

    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [paulaUser, setPaulaUser] = useState<any>(null);

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA;

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirectUrl=/paula");
        } else if (user) {
            // Cek role user spesifik di PAULA (terutama is_security & is_admin)
            api.get(`${baseURL}/api/paula/user/me`)
                .then((res) => {
                    const pUser = res.data?.user;
                    setPaulaUser(pUser);
                    if (pUser?.is_security) {
                        // Jika akun adalah Security, langsung alihkan ke halaman Pos Security
                        router.replace("/paula/mobil/security");
                    } else {
                        setIsCheckingRole(false);
                    }
                })
                .catch(() => {
                    // Fallback jika API gagal atau dev offline
                    setIsCheckingRole(false);
                });
        }
    }, [user, authLoading, router, baseURL]);

    if (authLoading || isCheckingRole) {
        return (
            <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                        <img 
                            src="/assets/images/paula/logo_bpom_no_label.webp" 
                            alt="Logo BPOM" 
                            className="w-8 h-8 object-contain" 
                        />
                    </div>
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                </div>
            </div>
        );
    }

    const isAdmin = Boolean(
        paulaUser?.is_admin ||
        user?.role?.level === "superadmin" ||
        user?.role?.level === "admin" ||
        (user?.role as any) === "superadmin" ||
        (user?.role as any) === "admin"
    );

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col justify-between font-sans selection:bg-blue-200">
            {/* NAVBAR ATAS */}
            <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* BRAND */}
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-2">
                            <img 
                                src="/assets/images/paula/logo_bpom_no_label.webp" 
                                alt="Logo BBPOM" 
                                className="w-full h-full object-contain" 
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-xl tracking-wider text-slate-900">PAULA</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">Peminjaman Aula & Armada Mobil Dinas</p>
                        </div>
                    </div>

                    {/* USER PROFILE & LOGOUT */}
                    {user && (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                    {user.name ? user.name.slice(0, 2).toUpperCase() : "BP"}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[160px]">{user.name}</p>
                                    <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
                                        {user?.employee?.fungsi?.name  || "User"}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/logout"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 transition"
                                title="Keluar dari Akun"
                            >
                                <span className="material-symbols-outlined text-[16px]">logout</span>
                                <span className="hidden sm:inline">Keluar</span>
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex flex-col justify-center">
                {/* HERO SECTION */}
                <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Pilih Layanan Peminjaman
                    </h1>
                </div>

                {/* ADMIN QUICK ACCESS PANEL (Jika Admin / PIC) */}
                {isAdmin && (
                    <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-bold border border-indigo-400/20">
                                <Icon icon="solar:shield-star-bold" width={14} />
                                Akses Khusus Admin & PIC PAULA
                            </div>
                            <h2 className="text-lg font-bold text-white">Panel Pengelolaan Fasilitas & Keamanan</h2>
                            <p className="text-xs text-indigo-200/80 max-w-xl leading-relaxed">
                                Kelola persetujuan aula/mobil, master data armada, akun security, serta pemantauan pos jaga dan servis rutin.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                            <Link
                                href="/admin/paula"
                                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition"
                            >
                                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                                <span>Dashboard Admin</span>
                            </Link>
                            <Link
                                href="/paula/mobil/security"
                                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md border border-indigo-400/30 transition"
                            >
                                <span className="material-symbols-outlined text-[16px]">shield</span>
                                <span>Pos Jaga & Servis</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* 2 MAIN SERVICE CARDS (AULA & MOBIL) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10">
                    {/* KARTU AULA */}
                    <Link
                        href="/paula/aula"
                        className="group relative bg-white border border-slate-200/90 rounded-[28px] overflow-hidden shadow-sm hover:shadow-2xl hover:border-blue-500/80 transition-all duration-300 flex flex-col justify-between"
                    >
                        <div>
                            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                                <img 
                                    src="/assets/images/paula/aula.webp" 
                                    alt="Fasilitas Aula" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-extrabold shadow-sm">
                                        Ruang Pertemuan & Rapat
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-blue-300 transition-colors">
                                        Peminjaman Aula
                                    </h3>
                                    <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                                        Reservasi ruang rapat internal & aula pertemuan dinas
                                    </p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-extrabold shadow-sm">
                                        Ruang Pertemuan & Rapat
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-blue-300 transition-colors">
                                        Peminjaman Aula
                                    </h3>
                                    <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                                        Reservasi ruang rapat internal & aula pertemuan dinas
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="material-symbols-outlined text-[16px] text-blue-600">calendar_month</span>
                                        <span>Jadwal Real-time</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="material-symbols-outlined text-[16px] text-blue-600">groups</span>
                                        <span>Kapasitas Fleksibel</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0">
                            <div className="w-full py-3.5 px-5 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md group-hover:shadow-blue-500/20">
                                <span>Masuk ke Layanan Aula</span>
                                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </div>
                    </Link>

                    {/* KARTU MOBIL */}
                    <Link
                        href="/paula/mobil"
                        className="group relative bg-white border border-slate-200/90 rounded-[28px] overflow-hidden shadow-sm hover:shadow-2xl hover:border-emerald-500/80 transition-all duration-300 flex flex-col justify-between"
                    >
                        <div>
                            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                                <img 
                                    src="/assets/images/paula/cars.webp" 
                                    alt="Armada Mobil Dinas" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-extrabold shadow-sm">
                                        Armada Operasional Kedinasan
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                                        Peminjaman Mobil
                                    </h3>
                                    <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                                        Pengajuan kendaraan operasional & perjalanan dinas lapangan
                                    </p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-extrabold shadow-sm">
                                        Armada Operasional Kedinasan
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                                        Peminjaman Mobil
                                    </h3>
                                    <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                                        Pengajuan kendaraan operasional & perjalanan dinas lapangan
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="material-symbols-outlined text-[16px] text-emerald-600">shield_lock</span>
                                        <span>Gate Pass Security</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="material-symbols-outlined text-[16px] text-emerald-600">speed</span>
                                        <span>Odometer & BBM</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0">
                            <div className="w-full py-3.5 px-5 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md group-hover:shadow-emerald-500/20">
                                <span>Masuk ke Layanan Mobil</span>
                                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* ALUR SOP SINGKAT */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs max-w-4xl mx-auto w-full">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 text-center mb-4">
                        Alur Standar Operasional Peminjaman (SOP)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs inline-flex items-center justify-center">1</span>
                            <p className="text-xs font-bold text-slate-800">Isi Pengajuan</p>
                            <p className="text-[11px] text-slate-500">Pilih fasilitas dan tentukan jadwal permohonan</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center justify-center">2</span>
                            <p className="text-xs font-bold text-slate-800">Persetujuan PIC</p>
                            <p className="text-[11px] text-slate-500">Verifikasi oleh pengelola fasilitas atau Kasubbag TU</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs inline-flex items-center justify-center">3</span>
                            <p className="text-xs font-bold text-slate-800">Gate Pass & Kegiatan</p>
                            <p className="text-[11px] text-slate-500">Verifikasi pos security & pelaksanaan kegiatan</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="w-full border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
                <p>© 2026 Balai Besar Pengawas Obat dan Makanan di Mataram • Sistem PAULA</p>
            </footer>
        </div>
    );
}
