"use client";

import { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/axios";
import PaulaSidebar from "./PaulaSidebar";
import PaulaNavbar from "./PaulaNavbar";

export default function PaulaAulaLayout({ children }: { children: ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const pathname = usePathname();
    
    // State penanda apakah data user sudah disinkronkan ke DB Paula
    const [isSynced, setIsSynced] = useState(false);
    const [paulaUser, setPaulaUser] = useState<any>(null);

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
                    // Kirim payload data user dari Auth Central ke backend PAULA
                    const res = await api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_PAULA}/api/paula/sync-user`, user);
                    setPaulaUser(res.data?.user || null);
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

    const isSecurity = Boolean(paulaUser?.is_security || user?.is_security);
    const isAdmin = Boolean(
        paulaUser?.is_admin ||
        user?.role?.level === "superadmin" ||
        user?.role?.level === "admin" ||
        (user?.role as any) === "superadmin" ||
        (user?.role as any) === "admin"
    );

    // Enforce 3 Aktor Protection
    useEffect(() => {
        if (!loading && user && isSynced) {
            if (isSecurity) {
                // Aktor Security HANYA boleh mengakses /paula/mobil/security
                if (pathname !== "/paula/mobil/security") {
                    router.replace("/paula/mobil/security");
                }
            } else if (!isAdmin) {
                // Aktor User Biasa TIDAK BOLEH mengakses /paula/mobil/security maupun /paula/mobil/servis
                if (pathname.startsWith("/paula/mobil/security") || pathname.startsWith("/paula/mobil/servis")) {
                    router.replace("/paula/mobil");
                }
            }
        }
    }, [loading, user, isSynced, isSecurity, isAdmin, pathname, router]);

    // Tahan render halaman sampai proses sync database selesai
    if (loading || !user || !isSynced) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    if (isSecurity && pathname !== "/paula/mobil/security") {
        return null;
    }

    if (!isSecurity && !isAdmin && (pathname.startsWith("/paula/mobil/security") || pathname.startsWith("/paula/mobil/servis"))) {
        return null;
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
