"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { AppDispatch, RootState } from "@/redux/store";
import { getUser, logout } from "@/features/authSlice";
import { showAlert } from "@/features/alertSlice";

export default function PercepatNavbar() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const pathname = usePathname();

    const { user } = useSelector((state: RootState) => state.auth);

    const [permintaanOpen, setPermintaanOpen] = useState(false);
    const [verifOpen, setVerifOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close dropdowns on route changes
    useEffect(() => {
        setPermintaanOpen(false);
        setVerifOpen(false);
        setMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(showAlert({ type: "success", message: "Anda berhasil keluar", description: "Logout sukses" }));
        router.push("/login");
    };

    const categories = [
        { label: "Reagen", hrefPermintaan: "/percepat-new/permintaan/reagen", hrefVerif: "/percepat-new/verif/reagen" },
        { label: "Baku Pembanding", hrefPermintaan: "/percepat-new/permintaan/baku-pembanding", hrefVerif: "/percepat-new/verif/baku-pembanding" },
        { label: "ATK", hrefPermintaan: "/percepat-new/permintaan/atk", hrefVerif: "/percepat-new/verif/atk" },
        { label: "Suku Cadang", hrefPermintaan: "/percepat-new/permintaan/suku-cadang", hrefVerif: "/percepat-new/verif/suku-cadang" },
        { label: "Perlengkapan Kebersihan", hrefPermintaan: "/percepat-new/permintaan/perlengkapan-kebersihan", hrefVerif: "/percepat-new/verif/perlengkapan-kebersihan" },
    ];

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-200 ${
                scrolled
                    ? "bg-white/90 backdrop-blur-md shadow-xs border-b border-slate-200/80"
                    : "bg-white/80 backdrop-blur-xs border-b border-slate-100"
            }`}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 relative flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 p-1 group-hover:scale-105 transition-transform">
                                <Image
                                    src="/assets/images/bpom_without_label.webp"
                                    alt="Logo BPOM"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </Link>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                        <Link href="/percepat-new" className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                                    PERCEPAT
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-600 hidden sm:block leading-tight">
                                Sistem Persediaan Terpadu
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            href="/percepat-new#inventory"
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                        >
                            Katalog Inventaris
                        </Link>
                        {/* Dropdown Permintaan */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setPermintaanOpen(v => !v);
                                    setVerifOpen(false);
                                }}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1"
                            >
                                <span>Permintaan</span>
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-150 ${permintaanOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {permintaanOpen && (
                                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                    {categories.map(c => (
                                        <Link
                                            key={c.hrefPermintaan}
                                            href={c.hrefPermintaan}
                                            onClick={() => setPermintaanOpen(false)}
                                            className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                        >
                                            {c.label}
                                        </Link>
                                    ))}
                                    <div className="border-t border-slate-100 mt-1 pt-1">
                                        <Link
                                            href="/percepat-new/permintaan/form"
                                            onClick={() => setPermintaanOpen(false)}
                                            className="block px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            + Buat Permintaan Baru
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dropdown Verifikasi */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setVerifOpen(v => !v);
                                    setPermintaanOpen(false);
                                }}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1"
                            >
                                <span>Verifikasi</span>
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-150 ${verifOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {verifOpen && (
                                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                    {categories.map(c => (
                                        <Link
                                            key={c.hrefVerif}
                                            href={c.hrefVerif}
                                            onClick={() => setVerifOpen(false)}
                                            className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                        >
                                            {c.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stok Opname Link (for Admin / Petugas) */}
                        {(user?.role?.level === "admin" || user?.role?.level === "superadmin") && (
                            <Link
                                href="/admin/percepat/stok-opname"
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                    pathname?.includes("/stok-opname")
                                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                                        : "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/50"
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                                <span>Stok Opname</span>
                            </Link>
                        )}
                    </nav>

                    {/* Right User Actions */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/percepat-new/permintaan/form"
                                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs hover:shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined text-base">add</span>
                                    <span>Buat Permintaan</span>
                                </Link>

                                <div className="dropdown dropdown-end">
                                    <div
                                        tabIndex={0}
                                        role="button"
                                        className="btn btn-ghost btn-circle avatar border border-slate-200 hover:border-slate-300 w-9 h-9 min-h-0"
                                    >
                                        <div className="w-8 rounded-full overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={user.photo_path || "/assets/images/noimage.svg"}
                                                alt={user.name || "User Avatar"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/assets/images/noimage.svg";
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ul
                                        tabIndex={0}
                                        className="menu dropdown-content bg-white rounded-2xl z-50 mt-2 w-64 p-2 shadow-xl border border-slate-200/80 text-slate-700"
                                    >
                                        <li className="menu-title px-3 py-2 border-b border-slate-100">
                                            <span className="font-semibold text-slate-900 text-sm leading-tight block">
                                                {`${user.employee?.gelar_depan || ""} ${user.name} ${user.employee?.gelar_belakang || ""}`.trim()}
                                            </span>
                                            <span className="text-xs text-slate-600 block mt-0.5 truncate">
                                                {user.email}
                                            </span>
                                            {user.employee?.unit_kerja && (
                                                <span className="text-[11px] text-blue-600 block mt-0.5">
                                                    {user.employee.unit_kerja}
                                                </span>
                                            )}
                                        </li>
                                        <li className="mt-1">
                                            <Link href="/profile" className="flex items-center gap-2 py-2">
                                                <span className="material-symbols-outlined text-lg">person</span>
                                                <span>Profil Saya</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/percepat-new/permintaan/reagen" className="flex items-center gap-2 py-2">
                                                <span className="material-symbols-outlined text-lg">history</span>
                                                <span>Riwayat Permintaan</span>
                                            </Link>
                                        </li>
                                        {(user?.role?.level === "admin" || user?.role?.level === "superadmin") && (
                                            <>
                                                <li className="border-t border-slate-100 mt-1 pt-1">
                                                    <Link href="/admin/percepat/stok-opname" className="flex items-center gap-2 py-2 text-indigo-700 font-medium">
                                                        <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                                                        <span>Stok Opname Gudang</span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/admin/percepat" className="flex items-center gap-2 py-2 text-blue-700 font-medium">
                                                        <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                                        <span>Admin Panel Percepat</span>
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                        <li className="border-t border-slate-100 mt-1 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 py-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">logout</span>
                                                <span>Keluar</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login?redirectUrl=/percepat-new"
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/login?redirectUrl=/percepat-new/permintaan/form"
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                                >
                                    <span>Buat Permintaan</span>
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-square md:hidden text-slate-700"
                            onClick={() => setMobileMenuOpen(v => !v)}
                            aria-label="Toggle menu"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-3 border-t border-slate-100 space-y-2">
                        <Link
                            href="/percepat-new#inventory"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Katalog Inventaris
                        </Link>
                        <div className="pt-2 border-t border-slate-100">
                            <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permintaan</div>
                            {categories.map(c => (
                                <Link
                                    key={c.hrefPermintaan}
                                    href={c.hrefPermintaan}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-1.5 text-sm text-slate-600 hover:text-blue-600"
                                >
                                    • {c.label}
                                </Link>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                            <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Verifikasi</div>
                            {categories.map(c => (
                                <Link
                                    key={c.hrefVerif}
                                    href={c.hrefVerif}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-1.5 text-sm text-slate-600 hover:text-blue-600"
                                >
                                    • {c.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
