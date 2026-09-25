"use client";

import { useState } from "react";
import SidebarESapa from "./SidebarESapa";
import NavbarESapa from "./NavbarESapa";
import FooterESapa from "./FooterESapa";

export default function LayoutESapa({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-[#f8fafa] font-sans text-slate-800">
            <SidebarESapa isSidebarOpen={isSidebarOpen} />
            
            <div className={`flex-1 flex flex-col transition-all duration-300 h-screen overflow-hidden ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                <NavbarESapa isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                
                <main className="flex-1 overflow-y-auto bg-[#f8fafa] flex flex-col relative">
                    <div className="flex-1">
                        {children}
                    </div>
                    <FooterESapa />
                </main>
            </div>
        </div>
    );
}