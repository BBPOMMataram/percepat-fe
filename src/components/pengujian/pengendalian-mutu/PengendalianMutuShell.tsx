import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ClipboardCheck, ListChecks } from "lucide-react";

interface PengendalianMutuShellProps {
    children: ReactNode;
}

export default function PengendalianMutuShell({ children }: PengendalianMutuShellProps) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-xs">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <Link href="/pengujian" className="flex items-center gap-3">
                        <Image src="/assets/images/bpomri_without_label.png" alt="Logo BBPOM" width={80} height={60} className="h-10 w-auto object-contain" />
                        <div>
                            <p className="text-sm font-extrabold text-slate-900 sm:text-base">Laboratorium Pengujian BBPOM di Mataram</p>
                            <p className="text-xs text-slate-500">Pengendalian Mutu Pengujian Mikrobiologi</p>
                        </div>
                    </Link>
                    <nav className="flex flex-wrap gap-2" aria-label="Navigasi pengendalian mutu">
                        <Link href="/pengujian/pengendalian-mutu" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            <ListChecks className="h-4 w-4" />
                            Daftar Data
                        </Link>
                        <Link href="/pengujian/pengendalian-mutu/form" className="inline-flex items-center gap-2 rounded-lg bg-[#005baa] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#004b8d]">
                            <ClipboardCheck className="h-4 w-4" />
                            Isi Checklist
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
