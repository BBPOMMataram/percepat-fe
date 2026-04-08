"use client";

import { showAlert } from "@/features/alertSlice";
import { getUser, logout } from "@/features/authSlice";
import { AppDispatch } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SimakoFormKeluarPegawai from "./FormKeluarPegawai";
import SimakoFormKeluarSecurity from "./FormKeluarSecurity";

export default function SimakoFormKeluar() {
    const { user, loading } = useSelector((state: any) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-rose-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-white"></span>
            </div>
        );
    }

    const handleLogout = () => {
        dispatch(logout());
        dispatch(showAlert({
            type: 'success',
            message: 'You have been logged out',
            description: 'logout success'
        }));
        router.push('/login');
    };

    return (
        <>
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={handleLogout}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-all duration-300 shadow-xl group"
                    title="Logout"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">logout</span>
                </button>
            </div>

            {user?.employee?.is_security ? (
                <SimakoFormKeluarSecurity />
            ) : (
                <SimakoFormKeluarPegawai />
            )}
        </>
    );
}