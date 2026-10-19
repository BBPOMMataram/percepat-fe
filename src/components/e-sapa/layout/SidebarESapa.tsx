"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function SidebarESapa({ isSidebarOpen }: { isSidebarOpen: boolean }) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <div
            className={`fixed inset-y-0 left-0 w-64 bg-white transition-transform duration-300 ease-in-out z-50 border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            <div className="flex items-center h-20 px-6 border-b border-slate-100">
                <Link href="/e-sapa/dashboard" className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                        <Image src="/assets/images/bpomri_without_label.png" alt="logo" width={24} height={24} className="object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-[15px] tracking-wide text-slate-800">E-SAPA</span>
                        <span className="text-[11px] text-slate-500 -mt-0.5">BBPOM di Mataram</span>
                    </div>
                </Link>
            </div>

            <nav className="mt-4 px-3 flex-1 overflow-y-auto space-y-1">
                <Link
                    href="/e-sapa/dashboard"
                    className={`flex items-center px-3 py-3 text-sm font-medium transition-colors ${
                        isActive('/e-sapa/dashboard') 
                            ? 'bg-[#0f172a] text-white rounded-lg shadow-md shadow-slate-200' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg'
                    }`}
                >
                    Dashboard
                </Link>

                <Link href="/e-sapa/surat-tugas" className={`flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/e-sapa/surat-tugas') ? 'bg-[#0f172a] text-white shadow-md shadow-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <div className="flex items-center">
                        Surat Tugas 
                    </div>
                </Link>

                <Link href="/e-sapa/perjadin" className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/e-sapa/perjadin') ? 'bg-[#0f172a] text-white shadow-md shadow-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    Perjadin
                </Link>

                {/* Kwitansi - Belum dikerjakan (Redup/Disabled) */}
                <div 
                    className="flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg text-slate-400 opacity-40 cursor-not-allowed select-none"
                    title="Menu Kwitansi sedang dalam pengembangan"
                >
                    <span>Kwitansi</span>
                    <span className="text-[10px] font-normal bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full border border-slate-200">Segera Hadir</span>
                </div>

                {/* SPD - Belum dikerjakan (Redup/Disabled) */}
                <div 
                    className="flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg text-slate-400 opacity-40 cursor-not-allowed select-none"
                    title="Menu SPD sedang dalam pengembangan"
                >
                    <span>SPD</span>
                    <span className="text-[10px] font-normal bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full border border-slate-200">Segera Hadir</span>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50 m-3 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span className="text-xs font-bold text-slate-700">BBPOM Mataram</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Sistem Akuntabilitas Terpadu</p>
            </div>
        </div>
    );
}