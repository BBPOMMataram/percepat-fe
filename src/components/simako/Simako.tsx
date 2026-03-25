"use client"

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const MainSimako = () => {
    return (
        <div className="min-h-screen bg-linear-to-br from-rose-500 via-pink-500 to-orange-400 relative overflow-hidden">
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
                <Image
                    src="/assets/images/bpom.webp"
                    alt="BPOM Logo"
                    width={120}
                    height={120}
                    className="mb-10"
                />
                {/* Floating badge */}
                {/* <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mb-12 px-8 py-4 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl hover:shadow-white/50 transition-all duration-500 hover:-translate-y-2 group"
                >
                    <span className="text-lg font-bold tracking-wide flex items-center gap-3">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping shadow-lg" />
                        SIMAKO - Sistem Masuk Keluar Kantor
                    </span>
                </motion.div> */}

                <motion.div
                    className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto mb-10"
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.3 }}
                >
                    <Link href="/simako/form-keluar">
                        <motion.button
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 0 60px rgba(0,212,170,0.6)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-6 py-4 rounded-[4rem] font-black shadow-[0_35px_80px_rgba(0,0,0,0.5)] bg-linear-to-br from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white border-4 border-white/20 hover:border-emerald-400/50 overflow-hidden transition-all duration-700 flex items-center justify-center gap-6 mx-auto lg:mx-0"
                        >
                            <motion.span
                                className="material-symbols-outlined text-4xl group-hover:rotate-180 group-hover:scale-125 transition-all duration-1000 origin-center"
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                fingerprint
                            </motion.span>
                            <span>IZIN KELUAR</span>
                            <div className="absolute inset-0 bg-linear-to-r from-white/30 to-transparent rounded-[4rem] blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                        </motion.button>
                    </Link>

                    <Link href="/simako/dashboard">
                        <motion.button
                            whileHover={{
                                scale: 1.05,
                                backgroundColor: "rgba(255,255,255,0.2)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-4 rounded-[4rem] font-black shadow-[0_25px_60px_rgba(0,0,0,0.4)] border-4 border-white/30 backdrop-blur-xl bg-white/10 hover:bg-white/20 hover:border-white/50 text-white transition-all duration-700 flex items-center justify-center gap-6 mx-auto lg:mx-0 group relative overflow-hidden"
                        >
                            <motion.span
                                className="material-symbols-outlined text-4xl group-hover:rotate-360 group-hover:scale-125 transition-all duration-1000 origin-center"
                                animate={{ rotate: [0, -360] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            >
                                dashboard
                            </motion.span>
                            <span>DASHBOARD</span>
                            <div className="absolute inset-0 bg-linear-to-r from-white/20 rounded-[4rem] blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mb-6 space-y-6"
                >
                    <h1 className="text-5xl lg:text-8xl font-black bg-linear-to-r from-white via-rose-50 to-pink-100 bg-clip-text text-transparent drop-shadow-[0_50px_100px_rgba(0,0,0,0.8)] leading-none tracking-[-0.05em]">
                        SIMAKO
                    </h1>
                    <div className="text-2xl lg:text-4xl font-bold text-white/95 drop-shadow-2xl tracking-wide uppercase opacity-90">
                        Sistem Masuk Keluar Kantor
                    </div>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.1 }}
                    className="text-xl lg:text-2xl max-w-3xl mx-auto px-8 text-white/85 leading-relaxed font-light drop-shadow-xl"
                >
                    Sistem pencatatan waktu masuk dan keluar kantor{' '}
                    <span className="font-black text-2xl bg-linear-to-r from-rose-200 via-pink-200 to-orange-200 bg-clip-text text-transparent drop-shadow-lg px-2 py-1 rounded-full inline-block animate-pulse">
                        pada jam kerja
                    </span>{' '}
                    Balai Besar POM di Mataram dengan{' '}
                    <span className="font-black text-transparent bg-linear-to-r from-white to-blue-100 bg-clip-text drop-shadow-lg px-2 py-1 rounded-full inline-block">
                        simpel
                    </span>{' '}
                    dan{' '}
                    <span className="font-black text-transparent bg-linear-to-r from-emerald-200 to-teal-200 bg-clip-text drop-shadow-lg px-2 py-1 rounded-full inline-block">
                        cepat
                    </span>
                </motion.p>

                {/* Mega CTA buttons */}


                {/* Feature highlights */}
                {/* <motion.div
                    className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full px-8"
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.5 }}
                >
                    {[
                        // { icon: '⚡', title: 'Simpel', desc: 'Proses Sederhana' },
                        // { icon: '🔐', title: 'Military Grade', desc: 'Enkripsi AES-256' },
                        // { icon: '🚀', title: 'Cepat', desc: 'Proses Cepat' },
                        // { icon: '📊', title: 'Analytics', desc: 'Laporan real-time' }
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
                </motion.div> */}
            </div>
        </div>
    );
};

export default MainSimako;

