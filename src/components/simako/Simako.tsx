"use client"

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const MainSimako = () => {
    const [hoveredFeature, setHoveredFeature] = useState(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white/30 rounded-full"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: `${10 + i * 20}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            scale: [1, 1.4, 1],
                            opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center text-white">
                {/* Floating badge */}
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mb-12 px-8 py-4 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl hover:shadow-white/50 transition-all duration-500 hover:-translate-y-2 group"
                >
                    <span className="text-lg font-bold tracking-wide flex items-center gap-3">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping shadow-lg" />
                        SIMAKO - Absensi Pintar Kantor
                    </span>
                </motion.div>

                {/* Main hero illustration */}
                <motion.div
                    initial={{ scale: 0.6, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 1.5, delay: 0.1 }}
                    className="mb-20 lg:mb-32 relative group cursor-default"
                >
                    <div className="w-80 h-80 lg:w-96 lg:h-96 bg-white/10 backdrop-blur-3xl rounded-[3.5rem] border-8 border-white/20 shadow-[0_35px_60px_rgba(0,0,0,0.4)] p-12 lg:p-16 flex items-center justify-center relative overflow-hidden hover:shadow-[0_45px_80px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-700">
                        {/* Glow ring */}
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-400/30 via-pink-400/20 to-orange-400/30 rounded-[3.5rem] blur-xl animate-pulse opacity-80 group-hover:opacity-100" />

                        {/* Central clock */}
                        <motion.span
                            className="material-symbols-outlined text-[8rem] lg:text-[10rem] text-white drop-shadow-[0_25px_50px_rgba(0,0,0,0.7)] font-light z-10 relative"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            schedule
                        </motion.span>

                        {/* Status indicators */}
                        <div className="absolute top-8 right-12 flex gap-6">
                            <motion.div
                                className="flex flex-col items-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1 }}
                            >
                                <div className="w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-xl animate-ping" />
                                <span className="text-xs font-bold uppercase tracking-wider mt-2 text-emerald-100">LIVE</span>
                            </motion.div>
                            <motion.div
                                className="flex flex-col items-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.2 }}
                            >
                                <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-xl animate-spin" style={{ animationDuration: '2s' }} />
                                <span className="text-xs font-bold uppercase tracking-wider mt-2 text-blue-100">ONLINE</span>
                            </motion.div>
                        </div>

                        {/* Login/Logout cards */}
                        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-12 z-20">
                            <motion.div
                                className="group p-6 bg-white/15 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 hover:shadow-rose-500/40 hover:scale-110 hover:-rotate-5 transition-all duration-500 cursor-pointer flex flex-col items-center"
                                whileHover={{ y: -12 }}
                            >
                                <span className="material-symbols-outlined text-4xl text-white drop-shadow-2xl mb-3 group-hover:text-rose-200 transition-colors">login</span>
                                <span className="text-sm font-bold uppercase tracking-widest text-white group-hover:text-rose-100">MASUK</span>
                            </motion.div>
                            <motion.div
                                className="group p-6 bg-white/15 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 hover:shadow-emerald-500/40 hover:scale-110 hover:rotate-5 transition-all duration-500 cursor-pointer flex flex-col items-center"
                                whileHover={{ y: -12 }}
                            >
                                <span className="material-symbols-outlined text-4xl text-white drop-shadow-2xl mb-3 group-hover:text-emerald-200 transition-colors">logout</span>
                                <span className="text-sm font-bold uppercase tracking-widest text-white group-hover:text-emerald-100">KELUAR</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mb-12 space-y-6"
                >
                    <h1 className="text-7xl lg:text-9xl xl:text-[10rem] font-black bg-gradient-to-r from-white via-rose-50 to-pink-100 bg-clip-text text-transparent drop-shadow-[0_50px_100px_rgba(0,0,0,0.8)] leading-none tracking-[-0.05em]">
                        SIMAKO
                    </h1>
                    <div className="text-2xl lg:text-4xl font-bold text-white/95 drop-shadow-2xl tracking-wide uppercase opacity-90">
                        Absensi Masuk Keluar Kantor
                    </div>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.1 }}
                    className="text-xl lg:text-2xl max-w-3xl mx-auto mb-20 px-8 text-white/85 leading-relaxed font-light drop-shadow-xl"
                >
                    Sistem absensi berbasis AI yang memberikan{' '}
                    <span className="font-black text-2xl bg-gradient-to-r from-rose-200 via-pink-200 to-orange-200 bg-clip-text text-transparent drop-shadow-lg px-2 py-1 rounded-full inline-block animate-pulse">
                        akurasi 100%
                    </span>{' '}
                    dalam pencatatan waktu masuk dan keluar karyawan dengan antarmuka yang{' '}
                    <span className="font-black text-transparent bg-gradient-to-r from-white to-blue-100 bg-clip-text drop-shadow-lg px-2 py-1 rounded-full inline-block">
                        elegan
                    </span>{' '}
                    dan{' '}
                    <span className="font-black text-transparent bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text drop-shadow-lg px-2 py-1 rounded-full inline-block">
                        intuitif
                    </span>.
                </motion.p>

                {/* Mega CTA buttons */}
                <motion.div
                    className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto mb-32"
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.3 }}
                >
                    <Link href="/simako/absen">
                        <motion.button
                            whileHover={{
                                scale: 1.1,
                                boxShadow: "0 0 60px rgba(0,212,170,0.6)",
                                y: -15
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-20 py-12 lg:px-24 lg:py-14 rounded-[4rem] font-black text-2xl shadow-[0_35px_80px_rgba(0,0,0,0.5)] bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white border-4 border-white/20 hover:border-emerald-400/50 overflow-hidden transition-all duration-700 flex items-center justify-center gap-6 mx-auto lg:mx-0"
                        >
                            <motion.span
                                className="material-symbols-outlined text-4xl group-hover:rotate-180 group-hover:scale-125 transition-all duration-1000 origin-center"
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                fingerprint
                            </motion.span>
                            <span>ABSEN SEKARANG</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-[4rem] blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                        </motion.button>
                    </Link>

                    <Link href="/simako/dashboard">
                        <motion.button
                            whileHover={{
                                scale: 1.05,
                                y: -10,
                                backgroundColor: "rgba(255,255,255,0.2)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="px-20 py-12 lg:px-24 lg:py-14 rounded-[4rem] font-black text-2xl shadow-[0_25px_60px_rgba(0,0,0,0.4)] border-4 border-white/30 backdrop-blur-xl bg-white/10 hover:bg-white/20 hover:border-white/50 text-white transition-all duration-700 flex items-center justify-center gap-6 mx-auto lg:mx-0 group relative overflow-hidden"
                        >
                            <motion.span
                                className="material-symbols-outlined text-4xl group-hover:rotate-360 group-hover:scale-125 transition-all duration-1000 origin-center"
                                animate={{ rotate: [0, -360] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            >
                                dashboard
                            </motion.span>
                            <span>LIHAT DASHBOARD</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 rounded-[4rem] blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                    className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full px-8"
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.5 }}
                >
                    {[
                        { icon: '⚡', title: 'Lightning Fast', desc: 'Update 0.1 detik' },
                        { icon: '🔐', title: 'Military Grade', desc: 'Enkripsi AES-256' },
                        { icon: '🚀', title: 'AI Powered', desc: 'Pengenalan wajah' },
                        { icon: '📊', title: 'Analytics', desc: 'Laporan real-time' }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            className="group p-10 lg:p-12 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/15 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] hover:-translate-y-6 hover:scale-[1.02] transition-all duration-1000 cursor-pointer relative overflow-hidden"
                            whileHover={{ rotateX: 5, rotateY: 5 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10" />
                            <div className="text-6xl lg:text-7xl mb-6 group-hover:scale-110 transition-all duration-700 origin-center">
                                {feature.icon}
                            </div>
                            <h3 className="font-black text-2xl lg:text-3xl mb-4 drop-shadow-2xl group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 group-hover:bg-clip-text transition-all duration-700">
                                {feature.title}
                            </h3>
                            <p className="text-lg text-white/80 font-medium drop-shadow-lg leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default MainSimako;

