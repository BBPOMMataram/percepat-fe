"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/api";
import SidebarESapa from "./SidebarESapa";
import NavbarESapa from "./NavbarESapa";
import FooterESapa from "./FooterESapa";

// Gunakan variabel global di luar komponen agar nilainya tetap dipertahankan
// meskipun LayoutESapa di-unmount dan di-remount saat user berpindah halaman
let isUserSynced = false;

export default function LayoutESapa({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (loading === false) {
            if (!user) {
                router.push(`/login?redirectUrl=${pathname}`);
            } else if (user.email && !isUserSynced) {
                // Eksekusi hanya JIKA user ada DAN belum pernah disinkronisasi dalam sesi browser ini
                isUserSynced = true; // Tandai agar tidak berulang saat pindah halaman
                
                const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA;
                
                const syncUser = async () => {
                    try {
                        await api.post(`${baseURL}/api/sync-user`, {
                            name: user.name,
                            email: user.email
                        });
                        console.log("Sinkronisasi akun e-sapa berhasil.");
                    } catch (err) {
                        console.error("Sinkronisasi akun e-sapa gagal.");
                        isUserSynced = false; // Buka kunci lagi jika gagal
                    }
                };
                syncUser();
            }
        }
    }, [user, loading, router, pathname]);

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