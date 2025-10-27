"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? "bg-bpom-blue text-gray-100" : "hover:bg-gray-100 hover:text-black";

    return (
        <aside className="w-16 lg:w-52 bg-white flex flex-col items-center py-3 gap-4 shadow-xl px-2">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-16 h-auto p-2" />

            <button className="flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/dashboard')}" data-tip="Dashboard">
                <span className="material-symbols-outlined">
                    dashboard
                </span>
                <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
            </button>
            <Link href={'/profile'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/profile')}`} data-tip="Profile">

                <span className="material-symbols-outlined">
                    account_circle
                </span>
                <span className="hidden lg:block whitespace-nowrap">Profile</span>
            </Link>
            <button className="flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/dashboard')}" data-tip="Forum">
                <span className="material-symbols-outlined">
                    forum
                </span>
                <span className="hidden lg:block whitespace-nowrap">Forum</span>
            </button>
            <button className="flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/dashboard')}" data-tip="Report Error">
                <span className="material-symbols-outlined">
                    report_gmailerrorred
                </span>
                <span className="hidden lg:block whitespace-nowrap">Report Error</span>
            </button>
            <Link href={'/our-apps'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/our-apps')}`} data-tip="Our Apps">

                <span className="material-symbols-outlined">
                    apps
                </span>
                <span className="hidden lg:block whitespace-nowrap">Our Apps</span>
            </Link>
            <Link href={'/settings'} className={`mt-auto flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/settings')}`} data-tip="Settings">

                <span className="material-symbols-outlined">
                    settings
                </span>
                <span className="hidden lg:block whitespace-nowrap">Settings</span>
            </Link>
        </aside >
    );
}
