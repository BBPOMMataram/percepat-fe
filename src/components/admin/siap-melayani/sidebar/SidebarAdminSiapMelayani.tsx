"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarAdminSiapMelayani() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/admin/siap-melayani') {
            return pathname === path
                ? "bg-bpom-blue text-white shadow-sm font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
        }
        return pathname.startsWith(path)
            ? "bg-bpom-blue text-white shadow-sm font-semibold"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
    };

    return (
        <aside className="w-16 lg:w-56 bg-white flex flex-col py-3 px-2 shadow-md shrink-0 h-full border-r border-slate-100 overflow-hidden select-none">
            {/* LOGO */}
            <div className="flex flex-col items-center pb-2 border-b border-slate-100 shrink-0">
                <Image 
                    src="/assets/images/bpom.webp" 
                    alt="Logo BPOM" 
                    width={100} 
                    height={100} 
                    priority 
                    className="mx-auto w-12 h-auto p-1" 
                />
            </div>

            {/* NAV ITEMS - NO SCROLL, CLEAN FIT */}
            <nav className="flex flex-col gap-1 w-full flex-1 py-2 overflow-hidden justify-start">
                <Link 
                    href="/admin/siap-melayani" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">dashboard</span>
                    <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
                </Link>

                <Link 
                    href="/admin/siap-melayani/pengajuan" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/pengajuan')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">assignment</span>
                    <span className="hidden lg:block whitespace-nowrap">Pengajuan PKL</span>
                </Link>

                <Link 
                    href="/admin/siap-melayani/peserta" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/peserta')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">group</span>
                    <span className="hidden lg:block whitespace-nowrap">Peserta PKL</span>
                </Link>

                <Link 
                    href="/admin/siap-melayani/penempatan" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/penempatan')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">domain</span>
                    <span className="hidden lg:block whitespace-nowrap">Penempatan PKL</span>
                </Link>

                <Link 
                    href="/admin/siap-melayani/presensi" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/presensi')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">event_available</span>
                    <span className="hidden lg:block whitespace-nowrap">Presensi PKL</span>
                </Link>

                <Link 
                    href="/admin/siap-melayani/tata-tertib" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/tata-tertib')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">gavel</span>
                    <span className="hidden lg:block whitespace-nowrap">Tata Tertib PKL</span>
                </Link>

                <Link 
                    href="/admin/siap-melayani/e-learning" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/e-learning')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">local_library</span>
                    <span className="hidden lg:block whitespace-nowrap">E-Learning</span>
                </Link>

                <Link 
                    href="/admin/siap-melayani/pakta-integritas" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/pakta-integritas')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">verified</span>
                    <span className="hidden lg:block whitespace-nowrap">Pakta Integritas</span>
                </Link>
            </nav>

            {/* SETTINGS AT BOTTOM */}
            <div className="pt-2 border-t border-slate-100 shrink-0 mt-auto">
                <Link 
                    href="/admin/siap-melayani/settings" 
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/admin/siap-melayani/settings')}`} 
                >
                    <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
                    <span className="hidden lg:block whitespace-nowrap">Settings</span>
                </Link>
            </div>
        </aside>
    );
}
