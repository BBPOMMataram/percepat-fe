/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PaulaSidebar() {
    const pathname = usePathname();
    
    // Logika Otomatis: Hanya true jika URL diawali dengan rute yang sesuai
    const isAulaActive = pathname.startsWith('/paula/aula');
    const isMobilActive = pathname.startsWith('/paula/mobil');

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex h-full shadow-sm z-20">
            <div className="h-20 flex items-center px-8 border-b border-slate-100">
                <Link href="/paula" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src="/assets/images/paula/logo_bpom_no_label.webp" alt="Logo PAULA" className="w-9 h-9 object-contain" />
                    <span className="font-black text-xl tracking-wider text-slate-800">PAULA</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                
                {/* Menu Aula (Hanya tampil jika sedang di rute /paula/aula) */}
                {isAulaActive && (
                    <div>
                        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-blue-50 text-blue-700 cursor-default">
                            <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                            Peminjaman Aula
                        </div>
                        <div className="pl-11 pr-2 mt-1 space-y-1 relative before:absolute before:inset-y-0 before:left-[30px] before:w-px before:bg-slate-200">
                            {[
                                { name: "Dashboard Aula", path: "/paula/aula", icon: "dashboard" },
                                { name: "Kegiatan Aula", path: "/paula/aula/kegiatan", icon: "list_alt" },
                                { name: "Kalender Aula", path: "/paula/aula/kalender", icon: "calendar_month" },
                                { name: "Pengajuan Aula", path: "/paula/aula/pengajuan", icon: "edit_document" },
                                { name: "Riwayat Aula", path: "/paula/aula/riwayat", icon: "history" }
                            ].map(item => (
                                <Link 
                                    key={item.name} 
                                    href={item.path}
                                    className={`block py-2 px-3 rounded-lg text-[13px] font-semibold transition-colors ${
                                        pathname === item.path ? "text-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu Mobil (Hanya tampil jika sedang di rute /paula/mobil) */}
                {isMobilActive && (
                    <div>
                        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-700 cursor-default">
                            <span className="material-symbols-outlined text-[20px]">directions_car</span>
                            Peminjaman Mobil
                        </div>
                        <div className="pl-11 pr-2 mt-1 space-y-1 relative before:absolute before:inset-y-0 before:left-[30px] before:w-px before:bg-slate-200">
                            {[
                                { name: "Dashboard Mobil", path: "/paula/mobil", icon: "dashboard" },
                                { name: "Jadwal Mobil", path: "/paula/mobil/jadwal", icon: "list_alt" },
                                { name: "Kalender Mobil", path: "/paula/mobil/kalender", icon: "calendar_month" },
                                { name: "Pengajuan Mobil", path: "/paula/mobil/pengajuan", icon: "edit_document" },
                                { name: "Riwayat Mobil", path: "/paula/mobil/riwayat", icon: "history" }
                            ].map(item => (
                                <Link 
                                    key={item.name} 
                                    href={item.path}
                                    className={`block py-2 px-3 rounded-lg text-[13px] font-semibold transition-colors ${
                                        pathname === item.path ? "text-indigo-600 bg-indigo-50/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </aside>
    );
}