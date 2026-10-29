"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import ETamuDocsModal from "@/components/e-tamu/ETamuDocsModal";

export default function NavbarETamu() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);
    const [activeModal, setActiveModal] = useState<"release-note" | "handbook" | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeString = isMounted
        ? currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "--:--:--";
    const dateString = isMounted
        ? currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : "Memuat tanggal...";

    const isActive = (path: string) => pathname === path;

    return (
        <>
            <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-sm gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/e-tamu" className="bg-slate-100 p-2 rounded-lg flex items-center justify-center">
                        <Image
                            src="/assets/images/bpomri_without_label.png"
                            alt="logo"
                            width={24}
                            height={24}
                            className="object-contain"
                        />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-none flex items-center gap-2">
                            E-TAMU
                            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                v2.0
                            </span>
                        </h1>
                        <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">
                            Balai Besar Pengawas Obat dan Makanan di Mataram
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {pathname?.startsWith("/admin/e-tamu") && (
                        <div className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-500 mr-2">
                            <Link
                                href="/e-tamu"
                                className={`flex items-center gap-1.5 pb-1 pt-1 transition-colors cursor-pointer ${
                                    isActive("/e-tamu")
                                        ? "text-emerald-600 border-b-2 border-emerald-600"
                                        : "hover:text-slate-800"
                                }`}
                            >
                                Buku Tamu
                            </Link>
                            <Link
                                href="/admin/e-tamu"
                                className={`flex items-center gap-1.5 pb-1 pt-1 transition-colors cursor-pointer ${
                                    isActive("/admin/e-tamu")
                                        ? "text-emerald-600 border-b-2 border-emerald-600"
                                        : "hover:text-slate-800"
                                }`}
                            >
                                Dashboard
                            </Link>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setActiveModal("release-note")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">
                            new_releases
                        </span>
                        <span>Release Note</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveModal("handbook")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            menu_book
                        </span>
                        <span>Handbook</span>
                    </button>

                    <div className="text-right hidden md:block pl-2 border-l border-slate-200">
                        <p className="text-[11px] text-slate-500">{dateString}</p>
                        <p className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">
                                schedule
                            </span>
                            {timeString} WITA
                        </p>
                    </div>
                </div>
            </nav>

            <ETamuDocsModal
                activeModal={activeModal}
                onClose={() => setActiveModal(null)}
                onSwitchModal={(modal) => setActiveModal(modal)}
            />
        </>
    );
}
