"use client";
import { AR_One_Sans } from 'next/font/google';
import { useState } from 'react';
import AppSection from './simandalika/content/AppSection';
import VideoMaklumatSection from './simandalika/content/VideoMaklumatSection';
import Footer from './simandalika/footer/Footer';
import ColorPallet from './simandalika/hero/ColorPallet';
import Hero from './simandalika/hero/Hero';
import ParticlesBackground from './simandalika/hero/ParticlesBackground';

const arOneSans = AR_One_Sans({ subsets: ['latin'] });

const MainPage = () => {
    const [particleColor, setParticleColor] = useState("#004282");
    return (
        <div className={`${arOneSans.className}`}>
            <ParticlesBackground particleColor={particleColor} />
            <div className="absolute top-6 right-10 z-50 hidden md:block">
                <ColorPallet onColorClick={setParticleColor} />
            </div>
            <header>
                <Hero />
            </header>
            <main id="main" className='mb-20 mt-6'>
                <section>
                    <VideoMaklumatSection />
                </section>
                <section className='mt-0'>
                    <AppSection />
                </section>
            </main>
            <footer>
                <Footer />
            </footer>
        </div>
    )
}

export default MainPage