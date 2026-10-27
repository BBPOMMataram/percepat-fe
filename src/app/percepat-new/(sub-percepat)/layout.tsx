import PercepatFooter from '@/components/percepat-new/footer/PercepatFooter';
import PercepatNavbar from '@/components/percepat-new/header/PercepatNavbar';
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
        <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between font-sans">
            <div>
                <PercepatNavbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {children}
                </main>
            </div>
            <PercepatFooter />
        </div>
    );
}
