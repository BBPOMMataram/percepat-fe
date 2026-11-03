/* eslint-disable @next/next/no-img-element */
"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/axios";
import NotificationBell from "@/components/simandalika/hero/NotificationBell";
import { getUserPhotoUrl } from "@/utils/userPhoto";

export default function PaulaNavbar() {
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = async () => {
        try {
            const authURL = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || 'http://localhost:8000';
            await api.post(`${authURL}/api/logout`);
        } catch (error) {
            console.error("Gagal logout:", error);
        }
        window.location.href = '/';
    };

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-end px-6 md:px-8 shadow-sm z-10 sticky top-0">
            {user ? (
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                        <p className="text-xs font-medium text-slate-500">{user?.employee?.fungsi?.name || 'User'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-xs flex items-center justify-center">
                        <img
                            src={getUserPhotoUrl(user?.photo_path)}
                            alt={user.name || "Foto Profil"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = "/assets/images/noimage.svg";
                            }}
                        />
                    </div>
                    <div className="h-8 w-px bg-slate-200 mx-1"></div>
                    <button 
                        onClick={handleLogout} 
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors flex items-center justify-center border border-transparent hover:border-red-100 cursor-pointer" 
                        title="Logout"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            ) : (
                <div className="h-10 w-48 bg-slate-100 rounded-xl animate-pulse"></div>
            )}
        </header>
    );
}
