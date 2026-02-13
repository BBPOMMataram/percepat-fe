"use client";

import LogoutBtn from "@/components/main/LogoutBtn";
import { showAlert } from "@/features/alertSlice";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function NavBarSiapMelayani() {
    const [permintaanOpen, setPermintaanOpen] = useState(false);
    const togglePermintaan = () => setPermintaanOpen(v => !v);
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>()
    const { user, loading } = useSelector((state: RootState) => state.auth)
    const router = useRouter()

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (loading) return

        if (!user) {
            dispatch(showAlert({ type: 'error', message: 'You are not logged in', description: 'Please login first' }))
            router.push(`/login?redirectUrl=${pathname}`)
        }
    }, [user, loading, router, pathname, dispatch])

    useEffect(() => {
        // close permintaan submenu on route change
        setPermintaanOpen(false);
    }, [pathname]);

    return (
        <div className="navbar bg-base-100 shadow-md px-6">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-fit p-2 shadow">
                        <li>
                            <button onClick={togglePermintaan} className="flex w-full justify-between items-center">Permintaan
                                <svg className={`transition-transform ml-2 ${permintaanOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            {permintaanOpen && (
                                <ul className="p-2">
                                    <li><Link href={'/percepat-new/permintaan/reagen'} onClick={() => setPermintaanOpen(false)}>Reagen</Link></li>
                                    <li><Link href={'/percepat-new/permintaan/atk'} onClick={() => setPermintaanOpen(false)}>ATK</Link></li>
                                    <li><Link href={'/percepat-new/permintaan/perlengkapan-kebersihan'} onClick={() => setPermintaanOpen(false)}>Perlengkapan Kebersihan</Link></li>
                                </ul>
                            )}
                        </li>
                        <li><Link href={'/percepat-new/verifikasi'}>Verifikasi</Link></li>
                    </ul>
                </div>

                <Link href="/" className="tooltip tooltip-right" data-tip="Go to SiMandalika">
                    <Image src="/assets/images/bpom_without_label.webp" alt="Logo BBPOM" width={40} height={40} />
                </Link>

                <Link href="/percepat-new" className="text-xl ml-3 font-serif tooltip tooltip-bottom" data-tip="Beranda PERCEPAT">PERCEPAT</Link>
            </div>
            <div className="navbar-center hidden md:flex">
                <ul className="menu menu-horizontal px-1">
                    <li className="relative">
                        <button onClick={togglePermintaan} className="flex items-center gap-2">Permintaan
                            <svg className={`transition-transform ${permintaanOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        {permintaanOpen && (
                            <ul className="p-2 bg-base-100 rounded-box absolute top-full left-0 mt-2 shadow">
                                <li><Link href={'/percepat-new/permintaan/reagen'} onClick={() => setPermintaanOpen(false)}>Reagen</Link></li>
                                <li><Link href={'/percepat-new/permintaan/atk'} onClick={() => setPermintaanOpen(false)}>ATK</Link></li>
                                <li><Link href={'/percepat-new/permintaan/perlengkapan-kebersihan'} onClick={() => setPermintaanOpen(false)}>Perlengkapan Kebersihan</Link></li>
                            </ul>
                        )}
                    </li>
                    <li><Link href={'/percepat-new/verifikasi'}>Verifikasi</Link></li>
                </ul>
            </div>

            <div className="navbar-end flex gap-4">
                {loading ? (
                    <span>Loading...</span>
                ) : user ? (
                    <>
                        <div className="flex gap-2">
                            <div className="dropdown dropdown-end">
                                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                                    <div className="w-10">
                                        <Image fill priority
                                            className="rounded-full"
                                            alt="User's profile picture"
                                            src={user.photo_path || '/assets/images/noimage.svg'} />
                                    </div>
                                </div>
                                <ul
                                    tabIndex={0}
                                    className="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 max-w-fit p-2 shadow">
                                    <li>
                                        <a className="whitespace-nowrap font-semibold flex flex-col gap-0 items-start">
                                            <span>{`${user.employee?.gelar_depan || ""} ${user.name} ${user.employee?.gelar_belakang || ""}`}</span>
                                            {/* if student */}
                                            {user.student ? (<span className="whitespace-nowrap text-[.6rem] text-gray-500">NIM: {user.student.nim} </span>) : null}
                                            {user.student ? (<span className="whitespace-nowrap text-[.6rem] text-gray-500">{user.student.university} </span>) : null}
                                            {/* if employee */}
                                            {user.employee ? (<span className="whitespace-nowrap text-[.6rem] text-gray-500">NIP: {user.employee.nip} </span>) : null}
                                            {user.employee ? (<span className="whitespace-nowrap text-[.6rem] text-gray-500">{user.employee.unit_kerja} </span>) : null}
                                        </a>
                                    </li>
                                    <li>
                                        <Link href={'/profile'}>Profile</Link>
                                    </li>
                                    <li className="mt-2 w-fit">
                                        <LogoutBtn />
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Link href={`/login?redirectUrl=${pathname}`} className="underline">Masuk</Link>
                        <Link href={`/register?redirectUrl=${pathname}`} className="btn bg-bpom-blue text-white">Daftar</Link>
                    </>
                )}
            </div>
        </div>
    )
}
