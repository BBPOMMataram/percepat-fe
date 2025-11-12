import FooterSiapMelayani from '@/components/simpel-bmn/footer/Footer';
import NavBarSiapMelayani from '@/components/simpel-bmn/header/NavBar';
import React from 'react';

export const metadata = {
    title: {
        template: '%s | Simpel BMN | BBPOM di Mataram',
        default: 'Simpel BMN | BBPOM di Mataram'
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
