/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PaulaSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: "Dashboard", path: "/paula/aula", icon: "dashboard" },
        { name: "Kegiatan", path: "/paula/aula/kegiatan", icon: "list_alt" },
        { name: "Kalender", path: "/paula/aula/kalender", icon: "calendar_month" },
        { name: "Pengajuan", path: "/paula/aula/pengajuan", icon: "edit_document" },
        { name: "Riwayat", path: "/paula/aula/riwayat", icon: "history" },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex h-full shadow-sm z-20">
            <div className="h-20 flex items-center px-8 border-b border-slate-100">
                <Link href="/paula" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src="/assets/images/paula/logo_bpom_no_label.webp" alt="Logo PAULA" className="w-9 h-9 object-contain" />
                    <span className="font-black text-xl tracking-wider text-slate-800">PAULA</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isExactMatch = item.path === "/paula/aula" ? pathname === "/paula/aula" : pathname.startsWith(item.path);
                    
                    return (
                        <Link 
                            key={item.name} 
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                                isExactMatch 
                                ? "bg-blue-50 text-blue-700" 
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.name}
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}