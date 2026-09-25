"use client";

import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function ESapa() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);

    // Cek session user saat komponen dimuat
    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    return (
        <div className="min-h-screen bg-base-100 flex flex-col justify-center items-center relative overflow-hidden font-sans">
            {/* Dekorasi Background */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-6 text-center z-10">
                <Image
                    src="/assets/images/bpom.webp"
                    alt="Logo BPOM"
                    width={130}
                    height={130}
                    className="mx-auto mb-8 drop-shadow-lg"
                    priority
                />
                
                <h1 className="text-5xl md:text-7xl font-extrabold text-base-content mb-4 font-serif tracking-tight">
                    E-SAPA
                </h1>
                
                <h2 className="text-xl md:text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-6">
                    Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran
                </h2>
                
                <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Platform digital terpadu Balai Besar POM di Mataram untuk mengelola, memonitor, dan mengevaluasi kegiatan serta pertanggungjawaban anggaran secara transparan, cepat, dan akurat.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {loading ? (
                        <button className="btn btn-primary btn-lg rounded-full px-10 shadow-lg border-none opacity-70 cursor-wait">
                            <span className="loading loading-spinner"></span>
                            Memeriksa Sesi...
                        </button>
                    ) : user ? (
                        <Link
                            href="/e-sapa/dashboard"
                            className="btn btn-primary btn-lg rounded-full px-10 shadow-lg hover:scale-105 transition-transform border-none"
                        >
                            <span className="material-symbols-outlined mr-2">dashboard</span>
                            Ke Dashboard E-SAPA
                        </Link>
                    ) : (
                        <Link
                            href="/login?redirectUrl=/e-sapa/dashboard"
                            className="btn btn-primary btn-lg rounded-full px-10 shadow-lg hover:scale-105 transition-transform border-none"
                        >
                            <span className="material-symbols-outlined mr-2">login</span>
                            Masuk ke Aplikasi
                        </Link>
                    )}
                    
                    <Link
                        href="/"
                        className="btn btn-outline btn-lg rounded-full px-10 hover:scale-105 transition-transform"
                    >
                        Kembali ke Portal
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-6 text-sm text-gray-400 font-medium">
                &copy; {new Date().getFullYear()} Balai Besar POM di Mataram
            </div>
        </div>
    );
}