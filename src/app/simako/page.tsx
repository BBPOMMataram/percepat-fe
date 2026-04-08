"use client"

import MainSimako from "@/components/simako/Simako";
import { showAlert } from "@/features/alertSlice";
import { logout } from "@/features/authSlice";
import { AppDispatch } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export default function SimakoPage() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

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
            <MainSimako />
        </>
    )
}
