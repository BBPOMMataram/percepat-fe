"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import MolecularBackground from "../home/MolecularBackground";
import Interactive3DFlask from "../home/Interactive3DFlask";

export default function Hero() {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-white pt-10 pb-16 sm:pt-14 sm:pb-20 border-b border-slate-100">
            {/* Interactive Molecular Particle Background (Follows User Cursor) */}
            <MolecularBackground />

            {/* Subtle gentle background lighting */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-100/35 via-teal-50/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center mt-10">
                    
                    {/* Left Column: Clean, confident typography with smooth entry animations */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="lg:col-span-7 flex flex-col items-start"
                    >

                        {/* Heading */}
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

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl"
                        >
                            Pusat kendali stok reagen, baku pembanding, ATK, suku cadang, dan perlengkapan secara real-time dengan alur permintaan serta verifikasi digital yang ringkas.
                        </motion.p>

                        {/* CTA Actions */}
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

                    {/* Right Column: Interactive 3D Flask (360° Drag & Spline 3D Mode) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25, duration: 0.6 }}
                        className="lg:col-span-5 flex justify-center"
                    >
                        <Interactive3DFlask />
                    </motion.div>

                </div>
            </div>
        </section>
    );
}