"use client";
import Image from "next/image";
import Link from "next/link";
import ButtonLogin from "./ButtonLogin";
import DynamicText from "./DynamicText";
import SimandalikaText from "./SimandalikaText";
import PaulaHeroCalendar from "./PaulaHeroCalendar";

const Hero = () => {
    return (
        <div className="min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-12 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
                {/* Left Column: Hero Brand & Info */}
                <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3 sm:space-y-4">
                    <div className="logo mb-1">
                        <Image src="/assets/images/bpom_without_label.webp" alt="Logo BBPOM di Mataram" width={95} height={95} priority className="object-cover drop-shadow-sm" />
                    </div>
                    <div className="hidden sm:block">
                        <DynamicText />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-800">
                            Selamat Datang di
                        </h2>
                        <div className="flex justify-center lg:justify-start">
                            <SimandalikaText />
                        </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed">
                        Sistem Monitoring Digitalisasi Aplikasi Terpadu Balai Besar POM di Mataram
                    </p>
                    <div className="pt-2">
                        <Link href="/login" aria-label="Login to Si Mandalika">
                            <ButtonLogin />
                        </Link>
                    </div>
                </div>

                {/* Right Column: Combined Calendar */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
                    <PaulaHeroCalendar />
                </div>
            </div>

            {/* Scroll Down Arrow */}
            <div className="arrow-icon mt-8 animate-bounce">
                <a href="#main" aria-label="Scroll to services">
                    <span className="material-symbols-outlined text-slate-400 hover:text-blue-600 transition-colors text-2xl">
                        arrow_cool_down
                    </span>
                </a>
            </div>
        </div>
    );
};

export default Hero;