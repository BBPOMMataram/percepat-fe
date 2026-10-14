"use client";

import LogoutBtn from "@/components/main/LogoutBtn";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function NavBarSiapMelayani() {
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>()
    const { user, loading } = useSelector((state: RootState) => state.auth)

    const [formPaktaIntegritas, setFormPaktaIntegritas] = useState<any>({ link: '' });
    const [isPklAccepted, setIsPklAccepted] = useState(false);

    const loadData = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/links/form_pakta_integritas`)
            .then(res => {
                setFormPaktaIntegritas(res.data)
            })
            .catch(() => {})
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (user) {
            api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl`)
                .then(res => {
                    const latest = res?.data?.data?.[0];
                    setIsPklAccepted(latest?.status === 'diterima');
                })
                .catch(() => {
                    setIsPklAccepted(false);
                });
        } else {
            setIsPklAccepted(false);
        }
    }, [user])

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    return (
        <div className="navbar bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-xs px-4 md:px-8">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm md:hidden mr-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-white rounded-2xl z-50 mt-3 w-60 p-2.5 shadow-lg border border-slate-100">
                        <li>
                            <Link 
                                href={'/siap-melayani/pengajuan-pkl'}
                                className={pathname === '/siap-melayani/pengajuan-pkl' ? 'bg-blue-50 text-bpom-blue font-semibold' : 'text-slate-700'}
                            >
                                Pengajuan PKL
                            </Link>
                        </li>
                        <li>
                            <Link 
                                href={'/siap-melayani/tata-tertib-pkl'}
                                className={pathname === '/siap-melayani/tata-tertib-pkl' ? 'bg-blue-50 text-bpom-blue font-semibold' : 'text-slate-700'}
                            >
                                Tata Tertib PKL
                            </Link>
                        </li>
                        {formPaktaIntegritas?.link && (
                            <li>
                                <a 
                                    href={formPaktaIntegritas?.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-700"
                                >
                                    Pakta Integritas
                                </a>
                            </li>
                        )}
                        {isPklAccepted && (
                            <li>
                                <Link 
                                    href={'/siap-melayani/presensi'}
                                    className={pathname === '/siap-melayani/presensi' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700'}
                                >
                                    Presensi
                                </Link>
                            </li>
                        )}
                        <li>
                            <details>
                                <summary className={pathname.startsWith('/siap-melayani/e-learning') ? 'bg-blue-50 text-bpom-blue font-semibold' : 'text-slate-700'}>
                                    E-Learning
                                </summary>
                                <ul className="p-2 space-y-1">
                                    <li><Link href={'/siap-melayani/e-learning/pengujian'}>Pengujian</Link></li>
                                    <li><Link href={'/siap-melayani/e-learning/sertifikasi'}>Sertifikasi</Link></li>
                                    <li><Link href={'/siap-melayani/e-learning/infokom'} className="whitespace-nowrap">Informasi & Komunikasi</Link></li>
                                    <li><Link href={'/siap-melayani/e-learning/umum'}>Umum</Link></li>
                                </ul>
                            </details>
                        </li>
                    </ul>
                </div>

                <Link href="/siap-melayani" className="tooltip tooltip-bottom flex items-center gap-2.5" data-tip="Kembali ke Beranda">
                    <Image src="/assets/images/bpom_without_label.webp" alt="Logo BBPOM" width={34} height={34} priority />
                    <span className="text-base md:text-lg font-bold text-slate-800 tracking-tight hover:text-bpom-blue transition-colors font-serif">
                        SIAP MELAYANI
                    </span>
                </Link>
            </div>
            <div className="navbar-center hidden md:flex">
                <ul className="flex items-center gap-1 text-sm font-medium text-slate-600">
                    <li>
                        <Link 
                            href={'/siap-melayani/pengajuan-pkl'} 
                            className={`px-3.5 py-2 rounded-xl transition-colors ${
                                pathname === '/siap-melayani/pengajuan-pkl'
                                    ? 'bg-blue-50 text-bpom-blue font-semibold'
                                    : 'hover:text-bpom-blue hover:bg-slate-50'
                            }`}
                        >
                            Pengajuan PKL
                        </Link>
                    </li>
                    <li>
                        <Link 
                            href={'/siap-melayani/tata-tertib-pkl'} 
                            className={`px-3.5 py-2 rounded-xl transition-colors ${
                                pathname === '/siap-melayani/tata-tertib-pkl'
                                    ? 'bg-blue-50 text-bpom-blue font-semibold'
                                    : 'hover:text-bpom-blue hover:bg-slate-50'
                            }`}
                        >
                            Tata Tertib PKL
                        </Link>
                    </li>
                    {formPaktaIntegritas?.link && (
                        <li>
                            <a 
                                href={formPaktaIntegritas?.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl hover:text-bpom-blue hover:bg-slate-50 transition-colors"
                            >
                                Pakta Integritas
                            </a>
                        </li>
                    )}
                    <li>
                        <div className="dropdown dropdown-bottom">
                            <div 
                                tabIndex={0} 
                                role="button" 
                                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                                    pathname.startsWith('/siap-melayani/e-learning')
                                        ? 'bg-blue-50 text-bpom-blue font-semibold'
                                        : 'hover:text-bpom-blue hover:bg-slate-50'
                                }`}
                            >
                                <span>E-Learning</span>
                                <span className="material-symbols-outlined !text-[18px]">
                                    arrow_drop_down
                                </span>
                            </div>
                            <ul tabIndex={0} className="menu dropdown-content shadow-lg bg-white rounded-2xl w-52 border border-slate-100 p-2 z-50 mt-1">
                                <li><Link href={'/siap-melayani/e-learning/pengujian'} className="py-2 rounded-xl">Pengujian</Link></li>
                                <li><Link href={'/siap-melayani/e-learning/sertifikasi'} className="py-2 rounded-xl">Sertifikasi</Link></li>
                                <li><Link href={'/siap-melayani/e-learning/infokom'} className="py-2 rounded-xl whitespace-nowrap">Informasi & Komunikasi</Link></li>
                                <li><Link href={'/siap-melayani/e-learning/umum'} className="py-2 rounded-xl">Umum</Link></li>
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>

            <div className="navbar-end flex items-center gap-3">
                {loading ? (
                    <span className="text-xs text-slate-400">Loading...</span>
                ) : user ? (
                    <div className="flex items-center gap-3">
                        {/* Tombol Presensi di samping profil: hanya tampil jika pengajuan diterima */}
                        {isPklAccepted && (
                            <Link
                                href="/siap-melayani/presensi"
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                                    pathname === '/siap-melayani/presensi'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
                                }`}
                            >
                                <span className="material-symbols-outlined !text-[17px]">how_to_reg</span>
                                <span>Presensi</span>
                            </Link>
                        )}

                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring-1 ring-slate-200">
                                <div className="w-9 h-9 relative">
                                    <Image fill priority
                                        className="rounded-full object-cover"
                                        alt="User's profile picture"
                                        src={user.photo_path || '/assets/images/noimage.svg'} />
                                </div>
                            </div>
                            <ul
                                tabIndex={0}
                                className="menu dropdown-content bg-white rounded-2xl z-50 mt-3 min-w-56 p-3 shadow-lg border border-slate-100 space-y-1">
                                <li className="px-2 py-1.5 border-b border-slate-100 mb-1">
                                    <div className="flex flex-col gap-0.5 p-0 hover:bg-transparent">
                                        <span className="font-semibold text-slate-800 text-sm">{`${user.employee?.gelar_depan || ""} ${user.name} ${user.employee?.gelar_belakang || ""}`}</span>
                                        {user.student ? (<span className="text-[11px] text-slate-500">NIM: {user.student.nim}</span>) : null}
                                        {user.student ? (<span className="text-[11px] text-slate-500">{user.student.university}</span>) : null}
                                        {user.employee ? (<span className="text-[11px] text-slate-500">NIP: {user.employee.nip}</span>) : null}
                                        {user.employee ? (<span className="text-[11px] text-slate-500">{user.employee.unit_kerja}</span>) : null}
                                    </div>
                                </li>
                                <li>
                                    <Link href={'/profile'} className="rounded-xl py-2 text-sm text-slate-700">Profile</Link>
                                </li>
                                <li className="pt-1 border-t border-slate-100">
                                    <LogoutBtn />
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/login?redirectUrl=${pathname}`} 
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-bpom-blue transition-colors"
                        >
                            Masuk
                        </Link>
                        <Link 
                            href={`/register?redirectUrl=${pathname}`} 
                            className="px-4 py-2 rounded-xl bg-bpom-blue text-white text-sm font-medium hover:bg-bpom-blue/90 shadow-xs transition-all"
                        >
                            Daftar
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
