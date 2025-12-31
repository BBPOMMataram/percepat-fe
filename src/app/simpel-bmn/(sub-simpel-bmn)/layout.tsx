import Footer from '@/components/simpel-bmn/footer/Footer';
import NavBar from '@/components/simpel-bmn/header/NavBar';
import React from 'react';

export const metadata = {
    title: {
        template: '%s | Simpel BMN | BBPOM di Mataram',
        default: 'Simpel BMN | BBPOM di Mataram'
    },
    description: 'Sistem Manajemen Pemeliharaan Balai Besar POM di Mataram',
}

export default function RootLayoutSimpelBmnClient({
    children,
}: {
    children: React.ReactNode,
}) {
    return (
        <>
            <header>
                <NavBar />
            </header>
            <main className="lg:px-14 py-12 px-4">
                {children}
            </main>
            <footer>
                <Footer />
            </footer>

        </>
    )
}
