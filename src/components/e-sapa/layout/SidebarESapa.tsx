"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function SidebarESapa({ isSidebarOpen }: { isSidebarOpen: boolean }) {
    const pathname = usePathname();
    const [isMasterOpen, setIsMasterOpen] = useState(false);

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <div
            className={`fixed inset-y-0 left-0 w-64 bg-base-200 transition-transform duration-300 ease-in-out z-50 border-r border-base-300 flex flex-col ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            <div className="flex items-center justify-center h-20 bg-base-300 px-4">
                <Link href="/e-sapa/dashboard" className="cursor-pointer">
                    <Image
                        src="/assets/images/e-sapa-logo.png"
                        alt="logo e-sapa"
                        width={140}
                        height={45}
                        className="object-contain"
                        priority
                    />
                </Link>
            </div>

            <nav className="mt-2 tracking-wide flex-1 overflow-y-auto [&_a]:transition-colors">
                <Link
                    href="/e-sapa/dashboard"
                    className={`block px-4 py-3 mt-0 text-sm ${isActive('/e-sapa/dashboard') ? 'bg-primary text-primary-content' : 'hover:bg-primary/20'}`}
                >
                    Dashboard
                </Link>

                <div className="relative">
                    <button
                        onClick={() => setIsMasterOpen(!isMasterOpen)}
                        className="flex w-full items-center justify-between px-4 py-3 mt-0 text-sm hover:bg-base-300 transition"
                    >
                        <span>Master</span>
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isMasterOpen || isActive('/e-sapa/kegiatan') || isActive('/e-sapa/petugas') || isActive('/e-sapa/wilayah') ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {(isMasterOpen || isActive('/e-sapa/kegiatan') || isActive('/e-sapa/petugas') || isActive('/e-sapa/wilayah')) && (
                        <div className="bg-base-100 shadow-inner">
                            <Link href="/e-sapa/kegiatan" className={`block px-4 py-3 pl-8 text-sm ${isActive('/e-sapa/kegiatan') ? 'bg-primary text-primary-content' : 'hover:bg-primary hover:text-primary-content'}`}>Kegiatan</Link>
                            <Link href="/e-sapa/petugas" className={`block px-4 py-3 pl-8 text-sm ${isActive('/e-sapa/petugas') ? 'bg-primary text-primary-content' : 'hover:bg-primary hover:text-primary-content'}`}>Petugas</Link>
                            <Link href="/e-sapa/wilayah" className={`block px-4 py-3 pl-8 text-sm ${isActive('/e-sapa/wilayah') ? 'bg-primary text-primary-content' : 'hover:bg-primary hover:text-primary-content'}`}>Wilayah</Link>
                        </div>
                    )}
                </div>

                <Link href="/e-sapa/surat-tugas" className={`block px-4 py-3 mt-0 text-sm ${isActive('/e-sapa/surat-tugas') ? 'bg-primary text-primary-content' : 'hover:bg-primary/20'}`}>Surat Tugas</Link>
                <Link href="/e-sapa/perjadin" className={`block px-4 py-3 mt-0 text-sm ${isActive('/e-sapa/perjadin') ? 'bg-primary text-primary-content' : 'hover:bg-primary/20'}`}>Perjadin</Link>
                <Link href="/e-sapa/kwitansi" className={`block px-4 py-3 mt-0 text-sm ${isActive('/e-sapa/kwitansi') ? 'bg-primary text-primary-content' : 'hover:bg-primary/20'}`}>Kwitansi</Link>
                <Link href="/e-sapa/spd" className={`block px-4 py-3 mt-0 text-sm ${isActive('/e-sapa/spd') ? 'bg-primary text-primary-content' : 'hover:bg-primary/20'}`}>SPD</Link>
            </nav>
        </div>
    );
}