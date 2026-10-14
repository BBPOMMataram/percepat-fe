<<<<<<< HEAD
=======
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
import SidebarAdminSiapMelayani from "./sidebar/SidebarAdminSiapMelayani";

import AdminPesertaSiapMelayani from "./peserta/AdminPesertaSiapMelayani";
import AdminPresensiSiapMelayani from "./presensi/AdminPresensiSiapMelayani";
import AdminPenempatanSiapMelayani from "./penempatan/AdminPenempatanSiapMelayani";
import AdminPengajuanSiapMelayani from "./pengajuan/AdminPengajuanSiapMelayani";
import AdminTataTertibSiapMelayani from "./tata-tertib/AdminTataTertibSiapMelayani";
import AdminElearningSiapMelayani from "./e-learning/AdminElearningSiapMelayani";
import AdminPaktaIntegritasSiapMelayani from "./pakta-integritas/AdminPaktaIntegritasSiapMelayani";
import AdminSettingsSiapMelayani from "./settings/AdminSettingsSiapMelayani";

// SUB-COMPONENT: MODERN & SIMPLE DASHBOARD VIEW
function DashboardOverview() {
    const [dataDashboard, setDataDashboard] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setIsLoading(true);
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/dashboard`)
            .then(res => {
                setDataDashboard(res.data);
            })
            .catch(err => {
                console.error("Gagal mengambil data dashboard Siap Melayani", err);
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Siap Melayani</h1>
                    <p className="text-xs text-slate-500 mt-1">Ringkasan data operasional dan presensi PKL BBPOM di Mataram</p>
                </div>
            </div>

            {/* KARTU STATISTIK: MODERN, SIMPEL, MONOKROMATIK, TANPA ICON */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-pulse min-h-[140px] flex flex-col justify-between">
                            <div className="h-3.5 bg-slate-100 rounded w-1/2"></div>
                            <div className="h-10 bg-slate-100 rounded w-1/3 my-2"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. TOTAL PESERTA PKL */}
                    <Link
                        href="/admin/siap-melayani/peserta"
                        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total Peserta PKL
                        </span>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none group-hover:text-bpom-blue transition-colors">
                                <CountUp
                                    end={dataDashboard?.totalPeserta || 0}
                                    duration={1.2}
                                    separator="."
                                />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Peserta terdaftar
                        </span>
                    </Link>

                    {/* 2. PRESENSI HARI INI */}
                    <Link
                        href="/admin/siap-melayani/presensi"
                        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Presensi Hari Ini
                        </span>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none group-hover:text-bpom-blue transition-colors">
                                <CountUp
                                    end={dataDashboard?.totalPresensiToday || 0}
                                    duration={1.2}
                                    separator="."
                                />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Kehadiran hari ini
                        </span>
                    </Link>

                    {/* 3. TOTAL PENGAJUAN */}
                    <Link
                        href="/admin/siap-melayani/pengajuan"
                        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total Pengajuan
                        </span>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none group-hover:text-bpom-blue transition-colors">
                                <CountUp
                                    end={dataDashboard?.totalPengajuan || 0}
                                    duration={1.2}
                                    separator="."
                                />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Pengajuan masuk
                        </span>
                    </Link>

                    {/* 4. KUOTA PKL TERSEDIA */}
                    <Link
                        href="/admin/siap-melayani/penempatan"
                        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Kuota PKL Tersedia
                        </span>
                        <div className="my-4">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 leading-none group-hover:text-bpom-blue transition-colors">
                                <CountUp
                                    end={dataDashboard?.totalKuota || 0}
                                    duration={1.2}
                                    separator="."
                                />
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Sisa kuota penempatan
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}

// MAIN COMPONENT: ADMIN AREA & SHELL SIAP MELAYANI
export default function AdminSiapMelayani() {
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
            const isSuperadmin = user.role?.level === 'superadmin';
            // admin jika role level admin DAN memiliki salah satu site dengan id = 10 (site siap melayani)
            const isAdminThisSite = Array.isArray(user.sites) && user.sites.some((s: any) => Number(s?.id) === 10);
            const isAdmin = user.role?.level === 'admin' && isAdminThisSite;
            if (!isAdmin && !isSuperadmin) {
                router.replace('/unauthorized');
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
            <SidebarAdminSiapMelayani />
            <div className="flex-1 flex flex-col w-[calc(100%-4rem)] lg:w-[calc(100%-14rem)] overflow-hidden">
                <HeaderUserArea user={user} callName={callName} />
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {/* ADMIN DASHBOARD PANEL */}
                    {pathname === '/admin/siap-melayani' && <DashboardOverview />}

                    {/* SUB-PAGES */}
                    {pathname === '/admin/siap-melayani/peserta' && <AdminPesertaSiapMelayani />}
                    {pathname === '/admin/siap-melayani/presensi' && <AdminPresensiSiapMelayani />}
                    {pathname === '/admin/siap-melayani/penempatan' && <AdminPenempatanSiapMelayani />}
                    {pathname === '/admin/siap-melayani/pengajuan' && <AdminPengajuanSiapMelayani />}
                    {pathname === '/admin/siap-melayani/tata-tertib' && <AdminTataTertibSiapMelayani />}
                    {pathname === '/admin/siap-melayani/e-learning' && <AdminElearningSiapMelayani />}
                    {pathname === '/admin/siap-melayani/pakta-integritas' && <AdminPaktaIntegritasSiapMelayani />}
                    {pathname === '/admin/siap-melayani/settings' && <AdminSettingsSiapMelayani user={user} />}

                    <FooterUserArea />
                </div>
            </div>
        </main>
    );
}
>>>>>>> 51c15b5ae5503b85174c5e32672c39c7ee27f21f
