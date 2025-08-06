import { AR_One_Sans } from 'next/font/google';
import Hero from './simandalika/Hero/Hero';
import Socials from './main/Social';

const arOneSans = AR_One_Sans({ subsets: ['latin'] });

const MainPage = () => {
    return (
        <div className={`${arOneSans.className}`}>
            <header>
                <Hero />
            </header>
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