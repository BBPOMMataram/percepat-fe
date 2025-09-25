import FooterSiapMelayani from '@/components/siap-melayani/footer/Footer';
import HeroSiapMelayani from '@/components/siap-melayani/header/Hero';
import NavBarSiapMelayani from '@/components/siap-melayani/header/NavBar';
import React from 'react';

export const metadata = {
    title: {
        template: '%s | Siap Melayani | BBPOM di Mataram',
        default: 'Siap Melayani | BBPOM di Mataram'
    },
    description: 'Sistem Monitoring Digitalisasi Aplikasi Terpadu Balai Besar POM di Mataram',
}

export default function RootLayoutSiapMelayani({
    children,
}: {
    children: React.ReactNode,
}) {
    return (
        <>
            <header>
                <NavBarSiapMelayani />
            </header>
            <main className="lg:px-14 py-12 px-4">
                {children}
            </main>
            <footer>
                <FooterSiapMelayani />
            </footer>

        </>
    )
}
