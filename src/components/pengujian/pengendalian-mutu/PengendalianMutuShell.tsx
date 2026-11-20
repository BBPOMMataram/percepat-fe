import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ClipboardCheck, ListChecks } from "lucide-react";
import LogoutBtn from "@/components/main/LogoutBtn";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getUserPhotoUrl } from "@/utils/userPhoto";

interface PengendalianMutuShellProps {
    children: ReactNode;
}

export default function PengendalianMutuShell({ children }: PengendalianMutuShellProps) {
    const { user, loading, pathname } = useRequireAuth();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-xs">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <Link href="/pengujian" className="flex min-w-0 items-center gap-3">
                        <Image src="/assets/images/bpomri_without_label.png" alt="Logo BBPOM" width={80} height={60} className="h-10 w-auto object-contain" />
                        <div className="min-w-0">
                            <p className="text-sm font-extrabold text-slate-900 sm:text-base">Laboratorium Pengujian BBPOM di Mataram</p>
                            <p className="text-xs text-slate-500">Pengendalian Mutu Pengujian Mikrobiologi</p>
                        </div>
                    </Link>
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
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
                        <div className="flex min-h-10 items-center">
                            {loading ? (
                                <span className="px-2 text-sm text-slate-500">Memuat...</span>
                            ) : user ? (
                                <div className="dropdown dropdown-end">
                                    <button type="button" tabIndex={0} className="btn btn-ghost btn-circle avatar" aria-label="Buka menu profil">
                                        <div className="relative w-10">
                                            <Image
                                                fill
                                                priority
                                                unoptimized
                                                className="rounded-full object-cover"
                                                alt="Foto profil pengguna"
                                                src={getUserPhotoUrl(user.photo_path)}
                                            />
                                        </div>
                                    </button>
                                    <ul tabIndex={0} className="menu dropdown-content z-50 mt-3 w-64 rounded-box bg-base-100 p-2 shadow-lg">
                                        <li>
                                            <span className="flex cursor-default flex-col items-start gap-0 whitespace-normal">
                                                <span className="font-semibold text-slate-800">
                                                    {[user.employee?.gelar_depan, user.name, user.employee?.gelar_belakang].filter(Boolean).join(" ")}
                                                </span>
                                                {user.employee?.nip && <span className="text-xs text-slate-500">NIP: {user.employee.nip}</span>}
                                                {user.employee?.unit_kerja && <span className="text-xs text-slate-500">{user.employee.unit_kerja}</span>}
                                            </span>
                                        </li>
                                        <li><Link href="/profile">Profile</Link></li>
                                        <li className="mt-2"><LogoutBtn /></li>
                                    </ul>
                                </div>
                            ) : (
                                <Link href={`/login?redirectUrl=${encodeURIComponent(pathname)}`} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#005baa] hover:bg-blue-50">
                                    Masuk
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
