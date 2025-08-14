import { AR_One_Sans } from 'next/font/google';
import Hero from './simandalika/hero/Hero';
import Socials from './main/Social';
import AppSection from './simandalika/content/AppSection';
import VideoMaklumatSection from './simandalika/content/VideoMaklumatSection';
import axios from '@/config/axios';

const arOneSans = AR_One_Sans({ subsets: ['latin'] });

const MainPage = async () => {

    const datas = await axios('/api/site')

    const { data } = datas.data //data pertama dari axios response dan data kedua dari laravel resource
    // console.log(data);

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
                    <AppSection appData={data} />
                </section>
            </main>
            <footer className='p-4 grid sm:grid-cols-2 border-teal-300 border-t-2 border-double'>
                <div className="socials flex items-center justify-center mb-4 sm:order-2">
                    <Socials />
                </div>
                <div className="flex items-center justify-center">
                    <p className="text-sm text-gray-500">© 2021 - {new Date().getFullYear()} BBPOM di Mataram. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default MainPage