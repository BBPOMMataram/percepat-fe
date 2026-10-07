/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/api";

export default function DashboardESemu() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (loading === false && !user) {
            router.push(`/login?redirectUrl=${pathname}`);
        }
    }, [user, loading, router, pathname]);

    // FUNGSI KEMBALI KE PORTAL UTAMA
    const handleBackToMenu = () => {
        router.push('/');
    };

    const integrations = [
        {
            title: 'ISO 9001:2015',
            desc: 'Sistem Manajemen Mutu',
            icon: '/assets/images/e-semu/medal-icon.png',
            url: 'https://bit.ly/QMSdimataram'
        },
        {
            title: 'ISO/IEC 17025 : 2017',
            desc: 'Sistem Manajemen Laboratorium',
            icon: '/assets/images/e-semu/lab-icon.png',
            url: 'https://sites.google.com/view/labbbpommataram/'
        },
        {
            title: 'ISO 45001:2018',
            desc: 'Sistem Manajemen Kesehatan dan Keselamatan Kerja',
            icon: '/assets/images/e-semu/health-icon.png',
            url: 'https://sites.google.com/view/k3-bbpom-mtr'
        },
        {
            title: 'ISO 37001:2016',
            desc: 'Sistem Manajemen Anti Penyuapan',
            icon: '/assets/images/e-semu/money-icon.png',
            url: 'http://bit.ly/SMAP_BBPOMMataram'
        }
    ];

    if (loading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    return (
        <div className="antialiased bg-slate-50 min-h-screen text-slate-800 scroll-smooth font-sans">
            
            {/* HEADER STICKY */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-screen-xl mx-auto px-4 md:px-8 flex justify-between items-center h-20">
                    <div className="flex items-center gap-3 md:gap-4">
                        <img src="/assets/images/e-semu/bpomri_without_label.png" className="w-10 md:w-12 object-contain drop-shadow-sm" alt="Logo BPOM" />
                        <span className="font-black text-sm md:text-lg text-slate-800 tracking-tight hidden sm:block">
                            BALAI BESAR POM DI MATARAM
                        </span>
                        <span className="font-black text-lg text-slate-800 tracking-tight sm:hidden">
                            BBPOM Mataram
                        </span>
                    </div>
                    <div>
                        <button 
                            onClick={handleBackToMenu}
                            className="flex items-center justify-center bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold py-2 md:py-2.5 px-4 md:px-6 rounded-xl transition-all duration-300 text-xs md:text-sm shadow-sm cursor-pointer"
                        >
                            <span className="hidden md:inline">Ke Menu Utama</span>
                            <span className="md:hidden">Menu Utama</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50">
                {/* Latar Belakang Dekorasi */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="max-w-screen-xl mx-auto px-4 py-20 lg:py-28 gap-12 text-slate-600 md:px-8 flex flex-col md:flex-row items-center relative z-10">
                    <div className="flex-1 space-y-8 max-w-2xl text-center md:text-left">
                        <div className="space-y-4">
                            <h1 className="text-5xl lg:text-7xl text-slate-900 font-black tracking-tight leading-tight">
                                E <span >-</span> SEMU
                            </h1>
                            <p className="text-lg lg:text-xl leading-relaxed text-slate-600 font-medium max-w-lg mx-auto md:mx-0">
                                Elektronik Sistem Manajemen Mutu <br className="hidden sm:block" />
                                Balai Besar POM di Mataram
                            </p>
                        </div>
                        <div className="pt-2 flex justify-center md:justify-start">
                            <a href="#content"
                                className="inline-flex items-center justify-center py-3.5 px-8 text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-full shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:shadow-blue-600/50 cursor-pointer">
                                Lihat Sertifikasi
                            </a>
                        </div>
                    </div>
                    <div className="flex-1 w-full flex justify-center relative mt-12 md:mt-0">
                        <img src="/assets/images/e-semu/smile-illustration.png" className="max-w-md w-full drop-shadow-2xl animate-in fade-in zoom-in duration-1000" alt="Ilustrasi Smile" />
                    </div>
                </div>
            </section>

            {/* INTEGRATION CARDS SECTION */}
            <div id="content" className="bg-white border-t border-slate-200 py-20 lg:py-28 relative">
                <div className="max-w-screen-xl mx-auto px-4 md:px-8">
                    <div className="max-w-2xl mx-auto text-center mb-16">
                        <h2 className="text-slate-900 text-3xl md:text-4xl font-black mb-5 tracking-tight">
                            Portal ISO BBPOM Mataram
                        </h2>
                    </div>
                    
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {integrations.map((item) => (
                            <div key={item.title} className="group flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300 transition-all duration-300 overflow-hidden relative">
                                {/* Latar Belakang Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                                <div className="p-8 flex-1 flex flex-col items-center text-center relative z-10">
                                    <div className="w-24 h-24 mb-6 bg-slate-50 rounded-2xl flex items-center justify-center p-4 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-100">
                                        <img src={item.icon} alt={`Icon ${item.title}`} className="w-full h-full object-contain drop-shadow-sm" />
                                    </div>
                                    <h4 className="text-slate-900 font-black text-xl mb-3">{item.title}</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                                <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="relative z-10 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 py-4 px-6 text-center font-bold transition-colors flex items-center justify-center gap-2 border-t border-slate-100 group-hover:border-blue-600"
                                >
                                    Buka Portal
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-slate-900 text-slate-400 py-10">
                <div className="max-w-screen-xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-2 rounded-full">
                            <img src="/assets/images/e-semu/bpomri_without_label.png" alt="Logo BPOM" className="w-8 opacity-90 grayscale" />
                        </div>
                        <p className="text-sm font-medium tracking-wide">Copyright © {new Date().getFullYear()} - BBPOM di Mataram</p>
                    </div>
                    <div className="flex gap-4">
                        <a href="https://www.instagram.com/bpom.mataram" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:bg-pink-600 transition-all duration-300 bg-slate-800 p-2.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50" className="fill-current">
                                <path d="M 16 3 C 8.8324839 3 3 8.8324839 3 16 L 3 34 C 3 41.167516 8.8324839 47 16 47 L 34 47 C 41.167516 47 47 41.167516 47 34 L 47 16 C 47 8.8324839 41.167516 3 34 3 L 16 3 z M 16 5 L 34 5 C 40.086484 5 45 9.9135161 45 16 L 45 34 C 45 40.086484 40.086484 45 34 45 L 16 45 C 9.9135161 45 5 40.086484 5 34 L 5 16 C 5 9.9135161 9.9135161 5 16 5 z M 37 11 A 2 2 0 0 0 35 13 A 2 2 0 0 0 37 15 A 2 2 0 0 0 39 13 A 2 2 0 0 0 37 11 z M 25 14 C 18.936712 14 14 18.936712 14 25 C 14 31.063288 18.936712 36 25 36 C 31.063288 36 36 31.063288 36 25 C 36 18.936712 31.063288 14 25 14 z M 25 16 C 29.982407 16 34 20.017593 34 25 C 34 29.982407 29.982407 34 25 34 C 20.017593 34 16 29.982407 16 25 C 16 20.017593 20.017593 16 25 16 z"></path>
                            </svg>
                        </a>
                        <a target="_blank" href="https://www.youtube.com/@BBPOMMataram" rel="noopener noreferrer" className="hover:text-white hover:bg-red-600 transition-all duration-300 bg-slate-800 p-2.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                            </svg>
                        </a>
                    </div>
                </div>
            </footer>
            
        </div>
    );
}