"use client";

import Link from "next/link";

export default function PaulaHome() {
    return (
        <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans selection:bg-blue-200 p-4 sm:p-8">
            <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side - Brand & Info */}
                <div className="md:w-5/12 bg-slate-900 p-10 md:p-14 flex flex-col justify-center relative overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute bottom-[-10%] right-[-20%] w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    
                    <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                        {/* Menggunakan image default bpom dengan warna asli */}
                        <div className="bg-white p-3 rounded-2xl mb-8 shadow-sm">
                            <img 
                                src="/assets/images/paula/logo_bpom_no_label.webp" 
                                alt="Logo BPOM" 
                                className="w-12 h-12 object-contain" 
                            />
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-5">
                            Peminjaman <br className="hidden md:block"/>Aula & Mobil
                        </h1>
                        <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-sm">
                            Fasilitas BBPOM di Mataram untuk kelancaran kegiatan operasional dan kedinasan.
                        </p>
                    </div>
                </div>

                {/* Right Side - Actions */}
                <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-slate-50/50">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pilih Layanan</h2>
                        <p className="text-sm text-slate-500 mt-1">Silakan pilih fasilitas yang ingin Anda pinjam.</p>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {/* Aula Option */}
                        <Link 
                            href="/paula/aula" 
                            className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                        >
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                <img 
                                    src="/assets/images/paula/aula.webp" 
                                    alt="Aula" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">Peminjaman Aula</h3>
                                <p className="text-sm text-slate-500">Reservasi ruang rapat dan aula.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mr-2">
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </div>
                        </Link>

                        {/* Mobil Option */}
                        <Link 
                            href="/paula/mobil" 
                            className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-5 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
                        >
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                <img 
                                    src="/assets/images/paula/cars.webp" 
                                    alt="Mobil" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">Peminjaman Mobil</h3>
                                <p className="text-sm text-slate-500">Pengajuan kendaraan operasional.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors mr-2">
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </div>
                        </Link>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}