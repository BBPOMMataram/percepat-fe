"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import SidebarESapa from "./SidebarESapa";
import NavbarESapa from "./NavbarESapa";
import FooterESapa from "./FooterESapa";

export default function LayoutESapa({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    
    const router = useRouter();
    const pathname = usePathname();

    // 1. Panggil getUser saat layout dimuat untuk mengecek sesi aktif
    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    // 2. Logika Pengalihan (Route Guard)
    useEffect(() => {
        if (loading === false && !user) {
            router.push(`/login?redirectUrl=${pathname}`);
        }
    }, [user, loading, router, pathname]);

    // Jangan render layout dan isinya jika sedang loading ATAU user belum terverifikasi
    if (loading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#f8fafa]">
                <span className="loading loading-spinner loading-lg text-teal-600"></span>
            </div>
        );
    }

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