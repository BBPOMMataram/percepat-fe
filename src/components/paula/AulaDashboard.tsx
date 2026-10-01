"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function AulaDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Banner Selamat Datang */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Selamat Datang, {user?.name}</h1>
                    <p className="text-slate-500 font-medium">Pilih menu di bawah atau di *sidebar* untuk mengelola jadwal dan peminjaman aula.</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner relative z-10 shrink-0">
                    <span className="material-symbols-outlined text-3xl">waving_hand</span>
                </div>
            </div>

            {/* Menu Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/paula/aula/kegiatan" className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-indigo-900/5 hover:border-indigo-300 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-[28px]">list_alt</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">Daftar Kegiatan</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Lihat daftar seluruh kegiatan yang telah disetujui dan akan berlangsung di aula.</p>
                </Link>

                <Link href="/paula/aula/kalender" className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-300 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-[28px]">calendar_month</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">Kalender Aula</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Pantau jadwal penggunaan aula secara visual melalui tampilan interaktif kalender.</p>
                </Link>

                <Link href="/paula/aula/pengajuan" className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-amber-900/5 hover:border-amber-300 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-[28px]">edit_document</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">Pengajuan</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Ajukan peminjaman aula baru atau kelola status pengajuan peminjaman Anda.</p>
                </Link>
            </div>
        </div>
    );
}