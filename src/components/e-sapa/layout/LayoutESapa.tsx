"use client";

import { useEffect, useState, useRef } from "react"; // Tambahkan useRef
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import api from "@/utils/api"; // Kembalikan menggunakan util api
import { getUser } from "@/features/authSlice";
import SidebarESapa from "./SidebarESapa";
import NavbarESapa from "./NavbarESapa";
import FooterESapa from "./FooterESapa";

export default function LayoutESapa({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Gunakan ref untuk melacak apakah sinkronisasi sudah dilakukan dalam sesi komponen ini
    const isSyncedRef = useRef(false); 

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
            } else if (user.email && !isSyncedRef.current) {
                // Eksekusi hanya JIKA user ada DAN belum pernah disinkronisasi sebelumnya
                isSyncedRef.current = true; // Tandai sudah diproses agar tidak berulang kali dikirim
                
                const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
                
                // Gunakan util 'api' agar Token JWT otomatis terlampir dan bisa lolos dari AuthenticateWithJwt
                api.post(`${baseURL}/api/sync-user`, {
                    name: user.name,
                    email: user.email
                })
                .then(res => console.log("Berhasil sinkronisasi user:", res.data))
                .catch(err => {
                    console.error("Gagal sinkronisasi user:", err);
                    isSyncedRef.current = false; // Buka kunci lagi jika gagal agar bisa dicoba ulang
                });
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