"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? "bg-bpom-blue text-gray-100" : "hover:bg-gray-100 hover:text-black";

    return (
        <aside className="w-16 bg-white flex flex-col items-center py-3 gap-4 shadow-xl">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-auto h-auto p-2" />

            <button className="tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/dashboard')}" data-tip="Dashboard">
                <span className="material-symbols-outlined">
                    dashboard
                </span>
            </button>
            <button className={`tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/profile')}`} data-tip="Profile">
                <Link href={'/profile'}>
                    <span className="material-symbols-outlined">
                        account_circle
                    </span>
                </Link>
            </button>
            <button className="tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/dashboard')}" data-tip="Forum">
                <span className="material-symbols-outlined">
                    forum
                </span>
            </button>
            <button className="tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/dashboard')}" data-tip="Report Error">
                <span className="material-symbols-outlined">
                    report_gmailerrorred
                </span>
            </button>
            <button className={`tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/our-apps')}`} data-tip="Our Apps">
                <Link href={'/our-apps'}>
                    <span className="material-symbols-outlined">
                        apps
                    </span>
                </Link>
            </button>
            <button className={`mt-auto tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/settings')}`} data-tip="Settings">
                <Link href={'/settings'}>
                    <span className="material-symbols-outlined">
                        settings
                    </span>
                </Link>
            </button>
        </aside >
    );
}
