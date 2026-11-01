import React from 'react';

const josefinSans = {
    className: "font-['Josefin_Sans',sans-serif]",
};

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
