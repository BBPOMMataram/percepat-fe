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

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || "http://localhost:8000";

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
                    <p className="text-xs font-semibold text-slate-500">Memeriksa hak akses PAULA...</p>
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
        <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans selection:bg-blue-200 p-4 sm:p-8">
            <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side - Brand & Info */}
                <div className="md:w-5/12 bg-slate-900 p-10 md:p-14 flex flex-col justify-center relative overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute bottom-[-10%] right-[-20%] w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    
                    <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                        {/* Logo BPOM */}
                        <div className="bg-white p-3 rounded-2xl mb-8 shadow-sm">
                            <img 
                                src="/assets/images/paula/logo_bpom_no_label.webp" 
                                alt="Logo BPOM" 
                                className="w-12 h-12 object-contain" 
                            />
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-5">
                            Peminjaman <br className="hidden md:block"/>Aula & Mobil
                        </h1>
                        <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-sm">
                            Fasilitas BBPOM di Mataram untuk kelancaran kegiatan operasional dan kedinasan.
                        </p>

                        {/* Profil login singkat */}
                        {user && (
                            <div className="mt-8 pt-6 border-t border-slate-800 w-full flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-xs text-slate-400">Masuk sebagai:</p>
                                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{user.name}</p>
                                </div>
                                <Link 
                                    href="/logout" 
                                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                                >
                                    Keluar
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Actions */}
                <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-slate-50/50">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pilih Layanan</h2>
                        <p className="text-sm text-slate-500 mt-1">Silakan pilih fasilitas yang ingin Anda pinjam.</p>
                    </div>

                    {/* Banner Khusus Admin / PIC */}
                    {isAdmin && (
                        <div className="mb-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-indigo-700/30">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-bold">
                                    <Icon icon="solar:shield-star-bold" width={13} />
                                    Akses Admin & PIC PAULA
                                </div>
                                <p className="text-xs text-indigo-100/90 mt-1 font-medium">
                                    Kelola persetujuan aula/mobil, akun security, dan servis armada.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Link
                                    href="/admin/paula"
                                    className="flex-1 sm:flex-none text-center px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-xs transition"
                                >
                                    Dashboard Admin
                                </Link>
                                <Link
                                    href="/paula/mobil/security"
                                    className="flex-1 sm:flex-none text-center px-3 py-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold text-xs border border-indigo-400/30 transition"
                                    title="Buka Pos Security Gate Pass"
                                >
                                    Pos Security
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                        {/* Aula Option */}
                        <Link 
                            href="/paula/aula" 
                            className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                        >
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                <img 
                                    src="/assets/images/paula/aula.webp" 
                                    alt="Aula" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">Peminjaman Aula</h3>
                                <p className="text-sm text-slate-500">Reservasi ruang rapat dan aula.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mr-2">
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </div>
                        </Link>

                        {/* Mobil Option */}
                        <Link 
                            href="/paula/mobil" 
                            className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-5 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
                        >
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                <img 
                                    src="/assets/images/paula/cars.webp" 
                                    alt="Mobil" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">Peminjaman Mobil</h3>
                                <p className="text-sm text-slate-500">Pengajuan kendaraan operasional.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors mr-2">
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </div>
                        </Link>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
