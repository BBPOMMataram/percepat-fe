"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarAdminESapa() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/admin/e-sapa") {
            return pathname === path
                ? "bg-teal-600 text-white shadow-sm font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
        }
        return pathname.startsWith(path)
            ? "bg-teal-600 text-white shadow-sm font-semibold"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
    };

    return (
        <aside className="w-16 lg:w-60 bg-white flex flex-col py-4 px-2 shadow-md shrink-0 h-full border-r border-slate-100 overflow-hidden select-none">
            {/* LOGO */}
            <div className="flex flex-col items-center pb-3 border-b border-slate-100 shrink-0">
                <Link href="/admin/e-sapa" className="flex items-center gap-2">
                    <Image 
                        src="/assets/images/bpom.webp" 
                        alt="Logo BPOM" 
                        width={40} 
                        height={40} 
                        priority 
                        className="w-10 h-auto" 
                    />
                    <div className="hidden lg:flex flex-col">
                        <span className="font-black text-sm tracking-wide text-slate-800">ADMIN E-SAPA</span>
                        <span className="text-[10px] text-teal-600 font-semibold -mt-0.5">PIC Control Panel</span>
                    </div>
                </Link>
            </div>

            {/* NAV ITEMS */}
            <nav className="flex flex-col gap-1.5 w-full flex-1 py-4 overflow-y-auto justify-start">
                <div className="hidden lg:block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Utama
                </div>

                <Link 
                    href="/admin/e-sapa" 
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive('/admin/e-sapa')}`}
                    title="Dashboard"
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">dashboard</span>
                    <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
                </Link>

                <div className="hidden lg:block px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Master Data (PIC)
                </div>

                <Link 
                    href="/admin/e-sapa/kegiatan" 
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive('/admin/e-sapa/kegiatan')}`}
                    title="Master Kegiatan"
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">event_note</span>
                    <span className="hidden lg:block whitespace-nowrap">Master Kegiatan</span>
                </Link>

                <Link 
                    href="/admin/e-sapa/petugas" 
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive('/admin/e-sapa/petugas')}`}
                    title="Master Petugas"
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">badge</span>
                    <span className="hidden lg:block whitespace-nowrap">Master Petugas</span>
                </Link>

                <Link 
                    href="/admin/e-sapa/wilayah" 
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive('/admin/e-sapa/wilayah')}`}
                    title="Master Wilayah"
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">location_on</span>
                    <span className="hidden lg:block whitespace-nowrap">Master Wilayah</span>
                </Link>
            </nav>

            {/* RETURN TO USER APP AT BOTTOM */}
            <div className="pt-3 border-t border-slate-100 shrink-0 mt-auto">
                <Link 
                    href="/e-sapa/dashboard" 
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    title="Ke Halaman E-SAPA"
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0 text-teal-600">arrow_back</span>
                    <span className="hidden lg:block whitespace-nowrap font-medium text-xs">Kembali ke E-SAPA</span>
                </Link>
            </div>
        </aside>
    );
}
