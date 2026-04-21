"use client";

import LogoutBtn from "@/components/main/LogoutBtn";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavBarSiapMelayani() {
    const { user, loading, pathname } = useRequireAuth()

    const [pemeliharaanOpen, setPermintaanOpen] = useState(false);

    const togglePemeliharaan = () => setPermintaanOpen(v => !v);

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
                        <li><Link href={'/simpel-bmn/list-barang'}>Daftar Barang</Link></li>
                        <li>
                            <button onClick={togglePemeliharaan} className="flex w-full justify-between items-center">Pemeliharaan
                                <svg className={`transition-transform ml-2 ${pemeliharaanOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            {pemeliharaanOpen && (
                                <ul className="p-2">
                                    <li><Link href={'/simpel-bmn/pemeliharaan'} onClick={() => setPermintaanOpen(false)}>Semua Pemeliharaan</Link></li>
                                    <li><Link href={'/simpel-bmn/pemeliharaan-anda'} onClick={() => setPermintaanOpen(false)}>Pemeliharaan Anda</Link></li>
                                    <li><Link href={'/simpel-bmn/disposisi'} onClick={() => setPermintaanOpen(false)}>Disposisi</Link></li>
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>

                <Link href="/" className="tooltip tooltip-right" data-tip="Go to SiMandalika">
                    <Image src="/assets/images/bpom_without_label.webp" alt="Logo BBPOM" width={40} height={40} />
                </Link>

                <Link href="/simpel-bmn" className="text-xl ml-3 font-serif tooltip tooltip-bottom" data-tip="Beranda SIMPEL BMN">SIMPEL BMN</Link>
            </div>
            <div className="navbar-center hidden md:flex">
                <ul className="menu menu-horizontal px-1">
                    <li className="relative z-50">
                        <button onClick={togglePemeliharaan} className="flex items-center gap-2">Pemeliharaan
                            <svg className={`transition-transform ${pemeliharaanOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        {pemeliharaanOpen && (
                            <ul className="p-2 bg-base-100 rounded-box absolute top-full left-0 mt-2 shadow">
                                <li><Link href={'/simpel-bmn/pemeliharaan'} onClick={() => setPermintaanOpen(false)}>Semua Pemeliharaan</Link></li>
                                <li><Link href={'/simpel-bmn/pemeliharaan-anda'} onClick={() => setPermintaanOpen(false)}>Pemeliharaan Anda</Link></li>
                                <li><Link href={'/simpel-bmn/disposisi'} onClick={() => setPermintaanOpen(false)}>Disposisi</Link></li>
                            </ul>
                        )}
                    </li>
                    <li><Link href={'/simpel-bmn/list-barang'}>Daftar Barang</Link></li>
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
