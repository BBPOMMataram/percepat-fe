"use client";

import { useState } from "react";
import SidebarESapa from "./SidebarESapa";
import NavbarESapa from "./NavbarESapa";
import FooterESapa from "./FooterESapa";

export default function LayoutESapa({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        // Memaksa tema "coffee" khusus untuk rute E-Sapa
        <div data-theme="coffee" className="flex h-screen bg-base-100 font-sans text-base-content overflow-hidden">
            <SidebarESapa isSidebarOpen={isSidebarOpen} />
            
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                <NavbarESapa isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                
                <main className="flex-1 overflow-y-auto bg-base-100 flex flex-col">
                    {children}
                    <FooterESapa />
                </main>
            </div>
        </div>
    );
}