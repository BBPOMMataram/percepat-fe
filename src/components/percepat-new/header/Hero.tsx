"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import StaticLabCard from "../home/StaticLabCard";

// Dynamic import untuk Three.js dan Canvas agar tidak pernah di-render pada SSR (mencegah hydration mismatch)
const MolecularBackground = dynamic(() => import("../home/MolecularBackground"), {
    ssr: false,
});
const Interactive3DFlask = dynamic(() => import("../home/Interactive3DFlask"), {
    ssr: false,
});

export default function Hero() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [mounted, setMounted] = useState(false);
    const [isLegacy, setIsLegacy] = useState(true);

    useEffect(() => {
        setMounted(true);
        try {
            const ua = navigator.userAgent || "";

            // 1. Deteksi Windows lawas (Windows 7: NT 6.1, Windows 8/8.1: NT 6.2/6.3, XP: NT 5.x)
            const isOldWindows = /Windows NT 6\.[123]|Windows NT 5\./i.test(ua);

            // 2. Deteksi Chrome lawas (versi 109 adalah versi terakhir di Windows 7)
            const chromeMatch = ua.match(/Chrome\/(\d+)/i);
            const chromeVer = chromeMatch ? parseInt(chromeMatch[1], 10) : 999;
            const isOldChrome = chromeVer <= 109;

            // 3. Deteksi kapabilitas akselerasi WebGL
            let hasWebGL = false;
            try {
                const canvas = document.createElement("canvas");
                hasWebGL = !!(
                    window.WebGLRenderingContext &&
                    (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
                );
            } catch {
                hasWebGL = false;
            }

            // 4. Deteksi class penanda dari layout.tsx
            const htmlHasLegacy =
                document.documentElement.classList.contains("legacy-win") ||
                document.documentElement.getAttribute("data-legacy-browser") === "true";

            // Jika terdeteksi Windows lama, Chrome lama, atau tanpa WebGL -> Tetap di mode ringan
            setIsLegacy(isOldWindows || isOldChrome || !hasWebGL || htmlHasLegacy);
        } catch {
            setIsLegacy(true);
        }
    }, []);

    // Hanya tampilkan 3D & partikel jika sudah selesai hydrate di client DAN bukan browser/OS lama
    const show3D = mounted && !isLegacy;

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-white pt-8 pb-16 sm:pt-12 sm:pb-20 border-b border-slate-100">
            {/* Partikel molekul hanya aktif jika terdeteksi browser modern */}
            {show3D && <MolecularBackground />}

            {/* Subtle gentle background lighting */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-100/35 via-teal-50/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {!show3D ? (
                    /* =========================================================================
                       TAMPILAN OTOMATIS UNTUK WINDOWS LAMA / CHROME LAWAS (RINGAN & 100% STABIL)
                       Menampilkan hanya gambar Erlenmeyer tanpa tombol atau kartu tambahan
                       ========================================================================= */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        {/* Kolom Kiri: Teks & Aksi Utama Bersih */}
                        <div className="md:col-span-7 flex flex-col items-start">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-4">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                Balai Besar POM di Mataram &bull; PERCEPAT
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.16] mb-4">
                                Persediaan Laboratorium Lebih{" "}
                                <span className="text-[#005baa]">
                                    Cepat dan Tepat
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                                Pusat kendali stok reagen, baku pembanding, ATK, suku cadang, dan perlengkapan secara real-time dengan alur permintaan serta verifikasi digital yang ringkas.
                            </p>

                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <Link
                                    href={user ? "/percepat-new/permintaan/form" : "/login?redirectUrl=/percepat-new/permintaan/form"}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
                                >
                                    <span>Buat Permintaan</span>
                                    <span className="material-symbols-outlined text-lg">
                                        arrow_forward
                                    </span>
                                </Link>

                                <a
                                    href="#inventory"
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-2xs transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg text-slate-500">
                                        inventory_2
                                    </span>
                                    <span>Lihat Katalog</span>
                                </a>
                            </div>
                        </div>

                        {/* Kolom Kanan: Gambar Erlenmeyer Saja (Bersih, Tanpa Tombol/Tampilan Tambahan) */}
                        <div className="md:col-span-5 flex justify-center items-center">
                            <StaticLabCard />
                        </div>
                    </div>
                ) : (
                    /* =========================================================================
                       TAMPILAN OTOMATIS UNTUK BROWSER / OS MODERN (3D INTERAKTIF)
                       ========================================================================= */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        {/* Kolom Kiri: Motion typography */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="md:col-span-7 flex flex-col items-start"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-4">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                Balai Besar POM di Mataram &bull; PERCEPAT
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.16] mb-4"
                            >
                                Persediaan Laboratorium Lebih{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-600">
                                    Cepat dan Tepat
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl"
                            >
                                Pusat kendali stok reagen, baku pembanding, ATK, suku cadang, dan perlengkapan secara real-time dengan alur permintaan serta verifikasi digital yang ringkas.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="flex flex-wrap items-center gap-3 w-full sm:w-auto"
                            >
                                <Link
                                    href={user ? "/percepat-new/permintaan/form" : "/login?redirectUrl=/percepat-new/permintaan/form"}
                                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                                >
                                    <span>Buat Permintaan</span>
                                    <motion.span
                                        className="material-symbols-outlined text-lg"
                                        animate={{ x: [0, 4, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                    >
                                        arrow_forward
                                    </motion.span>
                                </Link>

                                <a
                                    href="#inventory"
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/90 hover:bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg text-slate-500">
                                        inventory_2
                                    </span>
                                    <span>Lihat Katalog</span>
                                </a>
                            </motion.div>
                        </motion.div>

                        {/* Kolom Kanan: Interactive 3D Flask */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25, duration: 0.6 }}
                            className="md:col-span-5 flex justify-center"
                        >
                            <Interactive3DFlask />
                        </motion.div>
                    </div>
                )}
            </div>
        </section>
    );
}