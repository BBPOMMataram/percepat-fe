import React from 'react';

import { Josefin_Sans } from 'next/font/google';

const josefinSans = Josefin_Sans({ subsets: ['latin'] })

export const metadata = {
    title: {
        template: '%s | Percepat | BBPOM di Mataram',
        default: 'Percepat | BBPOM di Mataram'
    },
    description: 'Persediaan Cepat dan Tepat Balai Besar POM di Mataram',
}

export default function RootLayoutSiapMelayani({
    children,
}: {
    children: React.ReactNode,
}) {
    return (
        <div className={`${josefinSans.className}`} data-theme="percepat">
            {children}
        </div>
    )
}
