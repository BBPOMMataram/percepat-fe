"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function NavbarETamu() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true); // Tandai bahwa komponen sudah di-render di client
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Hindari hydration error: Jika belum di-mount (masih di server), kembalikan waktu kosong
    const timeString = isMounted ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--";
    const dateString = isMounted ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : "Memuat tanggal...";

    // Fungsi untuk mengecek apakah rute sedang aktif
    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="bg-slate-100 p-2 rounded-lg">
                    <Image src="/assets/images/bpomri_without_label.png" alt="logo" width={24} height={24} className="object-contain" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-800 leading-none flex items-center gap-2">
                        E-TAMU 
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">Balai Besar Pengawas Obat dan Makanan di Mataram</p>
                </div>
            </div>

            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-500">
                <Link href="/e-tamu" 
                      className={`flex items-center gap-1.5 pb-1 pt-1 transition-colors cursor-pointer ${isActive('/e-tamu') ? 'text-emerald-600 border-b-2 border-emerald-600' : 'hover:text-slate-800'}`}>
                     Buku Tamu
                </Link>
                
                <Link href="/e-tamu/dashboard" 
                      className={`flex items-center gap-1.5 pb-1 pt-1 transition-colors cursor-pointer ${isActive('/e-tamu/dashboard') ? 'text-emerald-600 border-b-2 border-emerald-600' : 'hover:text-slate-800'}`}>
                     Dashboard
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-[11px] text-slate-500">{dateString}</p>
                    <p className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">schedule</span>
                        {timeString} WITA
                    </p>
                </div>
            </div>
        </nav>
    );
}