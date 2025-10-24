"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UnauthorizedPage() {
    const router = useRouter();

    useEffect(() => {
        document.title = "Akses Ditolak | BBPOM Mataram";
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
            <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center">
                {/* 🔒 Icon Lock */}
                <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-red-100 text-red-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-10 h-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V7.5a4.5 4.5 0 00-9 0v3m9 0H7.5m9 0A2.25 2.25 0 0118.75 12.75v6A2.25 2.25 0 0116.5 21H7.5A2.25 2.25 0 015.25 18.75v-6A2.25 2.25 0 017.5 10.5m9 0H7.5"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Akses Ditolak
                </h1>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    Anda tidak memiliki izin untuk mengakses halaman ini.
                    Silakan kembali ke halaman utama atau hubungi administrator jika ini
                    adalah kesalahan.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                    >
                        Ke Beranda
                    </button>
                </div>
            </div>

            <p className="mt-6 text-sm text-slate-500">
                © {new Date().getFullYear()} BBPOM Mataram
            </p>
        </div>
    );
}
