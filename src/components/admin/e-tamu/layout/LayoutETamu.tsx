"use client";

import NavbarETamu from "./NavbarETamu";
import FooterETamu from "./FooterETamu";

export default function LayoutETamu({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f3f7f6] flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            <NavbarETamu />
            
            {/* Area Konten Utama (seperti Buku Tamu, Riwayat, dll) akan masuk ke sini */}
            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col">
                {children}
            </div>

            <FooterETamu />
        </div>
    );
}