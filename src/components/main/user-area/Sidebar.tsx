"use client";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RootState } from "@/redux/store";
import api from "@/utils/axios";

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useSelector((state: RootState) => state.auth);
    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get(`${authUrl}/api/notifications`);
            setUnreadCount(Number(res.data?.unread_count || 0));
        } catch (error) {
            console.error("Gagal memuat jumlah notifikasi:", error);
        }
    }, [user, authUrl]);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        const handleUpdated = () => fetchUnreadCount();
        window.addEventListener("bpom:notifications-updated", handleUpdated);

        return () => {
            clearInterval(interval);
            window.removeEventListener("bpom:notifications-updated", handleUpdated);
        };
    }, [user, fetchUnreadCount]);

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(`${path}/`)
            ? "bg-bpom-blue text-gray-100"
            : "hover:bg-gray-100 hover:text-black";

    return (
        <aside className="w-16 lg:w-52 bg-white flex flex-col items-center py-3 gap-4 shadow-xl px-2">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-16 h-auto p-2" />

            <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/dashboard')}`} data-tip="Dashboard">
                <span className="material-symbols-outlined">
                    dashboard
                </span>
                <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
            </button>
            <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/forum')}`} data-tip="Forum">
                <span className="material-symbols-outlined">
                    forum
                </span>
                <span className="hidden lg:block whitespace-nowrap">Forum</span>
            </button>
            <Link href={'/notification'} className={`relative flex items-center gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/notification')}`} data-tip="Notification">
                <span className="material-symbols-outlined">
                    notifications
                </span>
                <span className="hidden lg:block whitespace-nowrap">Notification</span>
                {unreadCount > 0 && (
                    <span className="lg:ml-auto absolute -top-1 -right-1 lg:static inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </Link>
            <Link href={'/our-apps'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/our-apps')}`} data-tip="Our Apps">
                <span className="material-symbols-outlined">
                    apps
                </span>
                <span className="hidden lg:block whitespace-nowrap">Our Apps</span>
            </Link>
            <Link href={'/profile'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/profile')}`} data-tip="Profile">
                <span className="material-symbols-outlined">
                    account_circle
                </span>
                <span className="hidden lg:block whitespace-nowrap">Profile</span>
            </Link>
            <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/report-error')}`} data-tip="Report Error">
                <span className="material-symbols-outlined">
                    report_gmailerrorred
                </span>
                <span className="hidden lg:block whitespace-nowrap">Report Error</span>
            </button>
            <Link href={'/settings'} className={`mt-auto flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/settings')}`} data-tip="Settings">
                <span className="material-symbols-outlined">
                    settings
                </span>
                <span className="hidden lg:block whitespace-nowrap">Settings</span>
            </Link>
        </aside >
    );
}
