"use client";
import { AR_One_Sans } from 'next/font/google';
import Script from 'next/script';
import AppSection from './simandalika/content/AppSection';
import Footer from './simandalika/footer/Footer';
import Hero from './simandalika/hero/Hero';
import ParticlesBackground from './simandalika/hero/ParticlesBackground';

const arOneSans = AR_One_Sans({ subsets: ['latin'] });

const MainPage = () => {
    const particleColor = "#004282";
    return (
        <div className={`${arOneSans.className}`}>
            <ParticlesBackground particleColor={particleColor} />
            <header>
                <Hero />
            </header>
            <main id="main" className='mb-20 mt-2'>
                <section>
                    {/* <VideoMaklumatSection /> */}
                </section>
                <section className='mt-0'>
                    <AppSection />
                </section>
            </main>
            <Footer />
            <Script src="https://website-widgets.pages.dev/dist/sienna.min.js" strategy="lazyOnload" />
        </div>
    )
}

export default MainPage
