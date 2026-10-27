"use client";

import Image from "next/image";
import Link from "next/link";

export default function PercepatFooter() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200/80 py-8 text-slate-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 relative flex items-center justify-center rounded-xl bg-white border border-slate-200 p-1">
                        <Image
                            src="/assets/images/bpom_without_label.webp"
                            alt="Logo BPOM"
                            width={24}
                            height={24}
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-800 leading-tight">
                            PERCEPAT • BBPOM di Mataram
                        </div>
                        <div className="text-[11px] text-slate-400">
                            Jl. Caturwarga No. 5, Mataram, Nusa Tenggara Barat
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5 text-xs font-medium text-slate-600">
                    <Link href="/percepat-new#inventory" className="hover:text-slate-900 transition-colors">
                        Katalog
                    </Link>
                    <Link href="/percepat-new/permintaan/reagen" className="hover:text-slate-900 transition-colors">
                        Riwayat Permintaan
                    </Link>
                </div>

                <div className="text-xs text-slate-400">
                    © {new Date().getFullYear()} BBPOM di Mataram. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
