"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import CountUp from "react-countup";

import { AppDispatch, RootState } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/api";

import HeaderUserArea from "@/components/main/user-area/Header";
import FooterUserArea from "@/components/main/user-area/Footer";
import SidebarAdminESapa from "./sidebar/SidebarAdminESapa";

import MasterKegiatan from "./master/kegiatan/MasterKegiatan";
import MasterPetugas from "./master/petugas/MasterPetugas";
import MasterWilayah from "./master/wilayah/MasterWilayah";

// SUB-COMPONENT: DASHBOARD OVERVIEW ADMIN E-SAPA
function DashboardOverview() {
    const [counts, setCounts] = useState({
        kegiatan: 0,
        petugas: 0,
        wilayah: 0,
        suratTugas: 0
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setIsLoading(true);
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA;

        Promise.all([
            api.get(`${baseURL}/api/kegiatan?limit=1`).catch(() => ({ data: { total: 0 } })),
            api.get(`${baseURL}/api/petugas?limit=1`).catch(() => ({ data: { total: 0 } })),
            api.get(`${baseURL}/api/wilayah?limit=1`).catch(() => ({ data: { total: 0 } })),
            api.get(`${baseURL}/api/st?limit=1`).catch(() => ({ data: { total: 0 } }))
        ])
            .then(([resK, resP, resW, resST]) => {
                const getCount = (res: any) => {
                    const d = res.data;
                    if (d?.meta?.total !== undefined) return d.meta.total;
                    if (d?.total !== undefined) return d.total;
                    if (Array.isArray(d?.data)) return d.data.length;
                    if (Array.isArray(d)) return d.length;
                    return 0;
                };

                setCounts({
                    kegiatan: getCount(resK),
                    petugas: getCount(resP),
                    wilayah: getCount(resW),
                    suratTugas: getCount(resST)
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* HEADER RINGKASAN */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Control Panel E-SAPA</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Pusat pengelolaan master data dan konfigurasi oleh PIC E-SAPA BBPOM di Mataram
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/e-sapa/dashboard"
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        Buka Halaman E-SAPA
                    </Link>
                </div>
            </div>

            {/* KARTU STATISTIK MASTER DATA */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse min-h-[140px] flex flex-col justify-between">
                            <div className="h-3.5 bg-slate-100 rounded w-1/2"></div>
                            <div className="h-10 bg-slate-100 rounded w-1/3 my-2"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. MASTER KEGIATAN */}
                    <Link
                        href="/admin/e-sapa/kegiatan"
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Master Kegiatan
                            </span>
                            <span className="material-symbols-outlined text-teal-600 group-hover:translate-x-1 transition-transform">
                                arrow_forward
                            </span>
                        </div>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none group-hover:text-teal-600 transition-colors">
                                <CountUp end={counts.kegiatan} duration={1.2} separator="." />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Kegiatan operasional & MAK
                        </span>
                    </Link>

                    {/* 2. MASTER PETUGAS */}
                    <Link
                        href="/admin/e-sapa/petugas"
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Master Petugas
                            </span>
                            <span className="material-symbols-outlined text-teal-600 group-hover:translate-x-1 transition-transform">
                                arrow_forward
                            </span>
                        </div>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none group-hover:text-teal-600 transition-colors">
                                <CountUp end={counts.petugas} duration={1.2} separator="." />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Personil & pegawai terdaftar
                        </span>
                    </Link>

                    {/* 3. MASTER WILAYAH */}
                    <Link
                        href="/admin/e-sapa/wilayah"
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Master Wilayah
                            </span>
                            <span className="material-symbols-outlined text-teal-600 group-hover:translate-x-1 transition-transform">
                                arrow_forward
                            </span>
                        </div>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none group-hover:text-teal-600 transition-colors">
                                <CountUp end={counts.wilayah} duration={1.2} separator="." />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Lokasi tujuan tugas
                        </span>
                    </Link>

                    {/* 4. TOTAL SURAT TUGAS */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total Surat Tugas
                        </span>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none">
                                <CountUp end={counts.suratTugas} duration={1.2} separator="." />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Berkas ST diterbitkan
                        </span>
                    </div>
                </div>
            )}

            {/* AKSI CEPAT DAN INFORMASI PIC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 mb-1">Panduan Pengelolaan Master Data</h3>
                    <p className="text-xs text-slate-500 mb-6">
                        Menu ini dikhususkan bagi PIC (Penanggung Jawab) E-SAPA untuk mengatur data referensi yang digunakan oleh seluruh pegawai saat membuat Surat Tugas dan Perjalanan Dinas.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link 
                            href="/admin/e-sapa/kegiatan" 
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/50 hover:border-teal-300 transition-all flex flex-col"
                        >
                            <span className="material-symbols-outlined text-teal-600 mb-2">event_note</span>
                            <span className="font-bold text-sm text-slate-800">Master Kegiatan</span>
                            <span className="text-[11px] text-slate-500 mt-1">Tambah/edit kegiatan & nomor MAK</span>
                        </Link>

                        <Link 
                            href="/admin/e-sapa/petugas" 
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/50 hover:border-teal-300 transition-all flex flex-col"
                        >
                            <span className="material-symbols-outlined text-teal-600 mb-2">badge</span>
                            <span className="font-bold text-sm text-slate-800">Master Petugas</span>
                            <span className="text-[11px] text-slate-500 mt-1">Kelola data personil pelaksana dinas</span>
                        </Link>

                        <Link 
                            href="/admin/e-sapa/wilayah" 
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/50 hover:border-teal-300 transition-all flex flex-col"
                        >
                            <span className="material-symbols-outlined text-teal-600 mb-2">location_on</span>
                            <span className="font-bold text-sm text-slate-800">Master Wilayah</span>
                            <span className="text-[11px] text-slate-500 mt-1">Kelola daerah & kota tujuan dinas</span>
                        </Link>
                    </div>
                </div>

                <div className="bg-teal-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
                            <span className="material-symbols-outlined text-[16px]">verified_user</span>
                            Akses Khusus PIC
                        </div>
                        <h3 className="text-lg font-bold leading-snug">Sistem Terintegrasi E-SAPA</h3>
                        <p className="text-xs text-teal-100/80 mt-2 leading-relaxed">
                            Setiap perubahan data kegiatan, MAK, personil, atau wilayah akan langsung tersinkronisasi otomatis saat user memilih pada form Surat Tugas dan Perjalanan Dinas.
                        </p>
                    </div>
                    <div className="pt-6 border-t border-teal-800/80 mt-4">
                        <Link 
                            href="/e-sapa/dashboard"
                            className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Ke Halaman Pegawai</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// MAIN COMPONENT: ADMIN AREA & SHELL E-SAPA
export default function AdminESapa() {
    const [callName, setCallName] = useState<string>("");

    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setCallName(user.call_name || "");
            const isSuperadmin = user.role?.level === "superadmin";
            const isSiteAdmin = Array.isArray(user.sites) && user.sites.some((s: any) => 
                s?.name?.toLowerCase()?.includes("e-sapa") || 
                s?.name?.toLowerCase()?.includes("sapa") || 
                s?.url?.toLowerCase()?.includes("e-sapa")
            );
            const isAdmin = user.role?.level === "admin";
            // Allow superadmin, role admin, or site-assigned admin
            if (!isSuperadmin && !isAdmin && !isSiteAdmin) {
                router.replace("/unauthorized");
            }
        }
    }, [user, router]);

    if (authLoading || !user) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-screen bg-gray-100">
                <span className="loading loading-spinner loading-lg text-slate-800"></span>
            </div>
        );
    }

    return (
        <main className="flex h-screen bg-gray-100 w-full overflow-hidden">
            <SidebarAdminESapa />
            <div className="flex-1 flex flex-col w-[calc(100%-4rem)] lg:w-[calc(100%-15rem)] overflow-hidden">
                <HeaderUserArea user={user} callName={callName} />
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {/* DASHBOARD VIEW */}
                    {pathname === "/admin/e-sapa" && <DashboardOverview />}

                    {/* MASTER PAGES */}
                    {(pathname === "/admin/e-sapa/kegiatan" || pathname === "/admin/e-sapa/master/kegiatan") && (
                        <MasterKegiatan />
                    )}
                    {(pathname === "/admin/e-sapa/petugas" || pathname === "/admin/e-sapa/master/petugas") && (
                        <MasterPetugas />
                    )}
                    {(pathname === "/admin/e-sapa/wilayah" || pathname === "/admin/e-sapa/master/wilayah") && (
                        <MasterWilayah />
                    )}

                    <FooterUserArea />
                </div>
            </div>
        </main>
    );
}
