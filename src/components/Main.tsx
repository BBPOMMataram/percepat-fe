import { AR_One_Sans } from 'next/font/google';
import Hero from './simandalika/hero/Hero';
import AppSection from './simandalika/content/AppSection';
import VideoMaklumatSection from './simandalika/content/VideoMaklumatSection';
import axios from '@/config/axios';
import Footer from './simandalika/footer/Footer';

const arOneSans = AR_One_Sans({ subsets: ['latin'] });

const MainPage = async () => {
    return (
        <div className={`${arOneSans.className}`}>
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