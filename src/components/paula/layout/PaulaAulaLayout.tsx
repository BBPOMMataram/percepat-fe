"use client";

import { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/api";
import PaulaSidebar from "./PaulaSidebar";
import PaulaNavbar from "./PaulaNavbar";

export default function PaulaAulaLayout({ children }: { children: ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const pathname = usePathname();
    
    // State penanda apakah data user sudah disinkronkan ke DB Paula
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (loading === false && !user) {
            router.push(`/login?redirectUrl=${pathname}`);
        }
    }, [user, loading, router, pathname]);

    // SINKRONISASI USER SECARA OTOMATIS
    useEffect(() => {
        const syncDataToPaula = async () => {
            if (user) {
                try {
                    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || 'http://localhost:8000';
                    // Kirim payload data user dari Auth Central ke backend PAULA
                    await api.post(`${baseURL}/api/paula/sync-user`, user);
                } catch (error) {
                    console.error("Gagal sinkronisasi user ke PAULA", error);
                } finally {
                    setIsSynced(true);
                }
            }
        };

        if (user && !isSynced) {
            syncDataToPaula();
        }
    }, [user, isSynced]);

    // Tahan render halaman sampai proses sync database selesai
    if (loading || !user || !isSynced) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
            <PaulaSidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <PaulaNavbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}