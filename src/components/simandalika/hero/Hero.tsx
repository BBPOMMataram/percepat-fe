"use client";
import Image from "next/image"
import DynamicText from "./DynamicText"
import SimandalikaText from "./SimandalikaText"
import ParticlesBackground from "./ParticlesBackground";
import ColorPallet from "./ColorPallet";
import { useState } from "react";

const Hero = () => {
    const [particleColor, setParticleColor] = useState("#004282");
    return (
        <div className="h-screen flex flex-col items-center justify-center">
            <ParticlesBackground particleColor={particleColor} />
            <div className="absolute top-6 right-10 z-50 hidden md:block">
                <ColorPallet onColorClick={setParticleColor} />
            </div>
            <div className="logo mb-7 sm:mb-0">
                <Image src="/assets/images/bpom_without_label.webp" alt="Hero Image of Si Mandalika" width={100} height={100} priority className="object-cover" />
            </div>
            <div className="hidden sm:block">
                <DynamicText />
            </div>
            <div className="flex flex-col items-center mb-2">
                <h1 className="text-2xl font-semibold mb-2 uppercase">Selamat datang di</h1>
                <SimandalikaText />
            </div>
            <p className="text-center text-lg">Sistem Monitoring Digitalisasi Aplikasi Terpadu Balai Besar POM di Mataram</p>
            <div className="arrow-icon mt-12 animate-bounce">
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