"use client";
import Image from "next/image";
import Link from "next/link";
import ButtonLogin from "./ButtonLogin";
import DynamicText from "./DynamicText";
import SimandalikaText from "./SimandalikaText";

const Hero = () => {
    return (
        <div className="h-screen flex flex-col items-center justify-center">
            <div className="logo mb-7 sm:mb-0">
                <Image src="/assets/images/bpom_without_label.webp" alt="Hero Image of Si Mandalika" width={100} height={100} priority className="object-cover" />
            </div>
            <div className="hidden sm:block">
                <DynamicText />
            </div>
            <div className="flex flex-col items-center">
                <h1 className="text-2xl font-semibold mb-2 uppercase">Selamat datang di</h1>
                <SimandalikaText />
            </div>
            <p className="text-center text-lg">Sistem Monitoring Digitalisasi Aplikasi Terpadu Balai Besar POM di Mataram</p>
            <div className="mt-12">
                <Link href="/login" aria-label="Login to Si Mandalika">
                    <ButtonLogin />
                </Link>
            </div>
            <div className="arrow-icon mt-6 animate-bounce">
                <a href="#main">
                    <span className="material-symbols-outlined">
                        arrow_cool_down
                    </span>
                </a>
            </div>
        </div>
    )
}

export default Hero