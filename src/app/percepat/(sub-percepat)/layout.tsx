import Footer from '@/components/percepat/footer/Footer';
import NavBar from '@/components/percepat/header/NavBar';
import React from 'react';

export const metadata = {
    title: {
        template: '%s | Percepat | BBPOM di Mataram',
        default: 'Percepat | BBPOM di Mataram'
    },
    description: 'Aplikasi Percepatan Persediaan Balai Besar POM di Mataram',
}

export default function RootLayoutPercepatClient({
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
