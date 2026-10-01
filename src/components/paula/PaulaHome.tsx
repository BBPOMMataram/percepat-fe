/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PaulaHome() {
    // State untuk menampung URL gambar, dengan fallback ke gambar default lokal
    const [aulaImg, setAulaImg] = useState<string>("/assets/images/paula/aula.webp");
    const [mobilImg, setMobilImg] = useState<string>("/assets/images/paula/cars.webp");

    return (
        <div className="bg-slate-50 flex items-center justify-center min-h-screen font-sans selection:bg-blue-200">
            <div className="container mx-auto text-center px-4">
                
                {/* Logo & Judul */}
                <img 
                    src="/assets/images/paula/logo_bpom_no_label.webp" 
                    alt="Logo BPOM" 
                    className="w-16 md:w-20 mx-auto mb-5 drop-shadow-sm" 
                />
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    Peminjaman Aula & Mobil
                </h1>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-12">
                    BBPOM di MATARAM
                </h2>

                {/* Container Kartu */}
                <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                    
                    {/* Card Pinjam Aula */}
                    <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[24px] overflow-hidden w-full max-w-[320px] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col border border-slate-100">
                        <div className="h-56 w-full overflow-hidden bg-slate-100">
                            <img 
                                src={aulaImg} 
                                alt="Aula" 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                            />
                        </div>
                        <div className="p-8 flex flex-col flex-1 items-center text-center">
                            <h3 className="text-2xl font-bold text-slate-800 mb-3">Pinjam Aula</h3>
                            <p className="text-slate-500 text-sm mb-8 flex-1 leading-relaxed">
                                Pinjam aula untuk acara dan pertemuan.
                            </p>
                            <Link 
                                href="/paula/aula" 
                                className="block w-full bg-[#2563eb] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-md shadow-blue-500/20"
                            >
                                Book
                            </Link>
                        </div>
                    </div>

                    {/* Card Pinjam Mobil */}
                    <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[24px] overflow-hidden w-full max-w-[320px] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col border border-slate-100">
                        <div className="h-56 w-full overflow-hidden bg-slate-100">
                            <img 
                                src={mobilImg} 
                                alt="Mobil" 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                            />
                        </div>
                        <div className="p-8 flex flex-col flex-1 items-center text-center">
                            <h3 className="text-2xl font-bold text-slate-800 mb-3">Pinjam Mobil</h3>
                            <p className="text-slate-500 text-sm mb-8 flex-1 leading-relaxed">
                                Pinjam mobil untuk perjalanan Anda.
                            </p>
                            <Link 
                                href="/paula/mobil" 
                                className="block w-full bg-[#10b981] hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-md shadow-emerald-500/20"
                            >
                                Book
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}