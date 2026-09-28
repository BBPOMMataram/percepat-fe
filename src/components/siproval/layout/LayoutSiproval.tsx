"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";

export default function LayoutSiproval({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    
    const router = useRouter();
    const pathname = usePathname();

    // Panggil getUser untuk mengecek sesi aktif saat Siproval diakses
    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    // Logika Pengalihan (Route Guard)
    useEffect(() => {
        // Jika loading selesai dan user tidak ada, arahkan ke login
        if (loading === false && !user) {
            router.push(`/login?redirectUrl=${pathname}`);
        }
    }, [user, loading, router, pathname]);

    // Tampilkan loading spinner selama proses pengecekan atau jika user kosong
    if (loading || !user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                <span className="loading loading-spinner loading-lg text-emerald-600"></span>
            </div>
        );
    }

    // Jika user ada (sudah login), render halaman Siproval
    return (
        <div className="min-h-screen font-sans">
            {children}
        </div>
    );
}