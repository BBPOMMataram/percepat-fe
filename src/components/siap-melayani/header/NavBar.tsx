"use client";

import { getUser, logout } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function NavBarSiapMelayani() {
    const dispatch = useDispatch<AppDispatch>()
    const { user, loading } = useSelector((state: RootState) => state.auth)
    const pathname = usePathname();

    console.log('uss', user);


    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    return (
        <div className="navbar bg-base-100 shadow-md px-6">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-fit p-2 shadow">
                        <li>
                            <a>PKL</a>
                            <ul className="p-2">
                                <li><Link href={'/siap-melayani/tata-tertib-pkl'}>Tata Tertib PKL</Link></li>
                                <li><a href="https://docs.google.com/document/d/1V4NLEWwBvLvM7H6BbvT0YdQTg3ieuBRl/edit?usp=sharing&ouid=115845788467615630346&rtpof=true&sd=true"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="whitespace-nowrap">Download Form Pakta Integritas</a></li>
                                <li><a>Pengajuan PKL</a></li>
                            </ul>
                        </li>
                        <li><a>Kunjungan</a></li>
                        <li><a>Narasumber</a></li>
                        <li>
                            <a>E-Learning</a>
                            <ul className="p-2">
                                <li><a>Pengujian</a></li>
                                <li><a>Sertifikasi</a></li>
                                <li><a>Informasi & Komunikasi</a></li>
                                <li><a>Umum</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <Image src="/assets/images/bpom_without_label.webp" alt="Logo BBPOM" width={40} height={40} />
                <a href="/siap-melayani"
                    className="text-xl ml-3 font-serif">SIAP MELAYANI</a>
            </div>
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <div className="dropdown dropdown-bottom">
                            <div tabIndex={0} className="flex items-center gap-1">
                                <span>PKL</span>
                                <span className="material-symbols-outlined">
                                    arrow_drop_down
                                </span>
                            </div>

                            <ul
                                tabIndex={0}
                                className="menu dropdown-content shadow bg-base-100 rounded-box w-fit"
                            >
                                <li><Link href={'/siap-melayani/tata-tertib-pkl'}>Tata Tertib PKL</Link></li>
                                <li><a href="https://docs.google.com/document/d/1V4NLEWwBvLvM7H6BbvT0YdQTg3ieuBRl/edit?usp=sharing&ouid=115845788467615630346&rtpof=true&sd=true"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="whitespace-nowrap">Download Form Pakta Integritas</a></li>
                                <li><a>Pengajuan PKL</a></li>
                            </ul>
                        </div>
                    </li>

                    <li><a>Kunjungan</a></li>
                    <li><a>Narasumber</a></li>
                    <li>
                        <div className="dropdown dropdown-bottom">
                            <div tabIndex={0} className="flex items-center gap-1">
                                <span>E-Learning</span>
                                <span className="material-symbols-outlined">
                                    arrow_drop_down
                                </span>
                            </div>
                            <ul tabIndex={0} className="menu dropdown-content shadow bg-base-100 rounded-box w-fit">
                                <li><a>Pengujian</a></li>
                                <li><a>Sertifikasi</a></li>
                                <li><a className="whitespace-nowrap">Informasi & Komunikasi</a></li>
                                <li><a>Umum</a></li>
                            </ul>
                        </div>
                    </li>
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
                                    <li><a>Presensi</a></li>
                                    <li><a>Profile</a></li>
                                    <li className="mt-2 text-slate-700">
                                        <button onClick={() => dispatch(logout())}>Logout</button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Link href={`/login?redirectUrl=${pathname}`} className="underline">Masuk</Link>
                        <Link href="/siap-melayani/register" className="btn bg-bpom-blue text-white">Daftar</Link>
                    </>
                )}
            </div>
        </div>
    )
}
