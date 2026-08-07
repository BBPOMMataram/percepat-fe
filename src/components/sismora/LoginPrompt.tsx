"use client"

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function LoginPrompt() {
    return (
        <div className="min-h-screen bg-linear-to-br from-sky-900 via-blue-800 to-indigo-900 relative overflow-hidden flex items-center justify-center px-4">
            <div className="absolute inset-0">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
                        style={{
                            left: `${15 + i * 17}%`,
                            top: `${8 + i * 18}%`,
                        }}
                        animate={{
                            y: [0, -25, 0],
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 5 + i,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 max-w-lg w-full bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-10 text-center text-white"
            >
                <Image
                    src="/assets/images/bpom.webp"
                    alt="BPOM Logo"
                    width={80}
                    height={80}
                    className="mx-auto mb-6"
                    priority
                />
                <h1 className="text-3xl font-black tracking-tight mb-2">SISMORA</h1>
                <p className="text-sm text-white/60 mb-6">Sistem Informasi Monitoring Rupiah</p>
                <p className="text-base text-white/80 mb-8 leading-relaxed">
                    Halaman ini dikhususkan untuk monitoring anggaran rupiah murni.
                    Silahkan <b>login terlebih dahulu</b> untuk mengakses halaman ini.
                </p>
                <Link href="/login?redirectUrl=/sismora">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 rounded-full font-bold shadow-[0_20px_60px_rgba(56,189,248,0.4)] bg-linear-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-sky-950 border-2 border-white/20 hover:border-white/40 transition-all duration-300"
                    >
                        Login
                    </motion.button>
                </Link>
            </motion.div>
        </div>
    );
}
