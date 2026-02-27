"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarAdminSuper() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ?
        "bg-bpom-blue text-gray-100" :
        "hover:bg-gray-100 hover:text-black";

    return (
        <aside className="w-16 lg:w-52 bg-white flex flex-col items-center py-3 gap-4 shadow-xl px-2">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-16 h-auto p-2" />
            <Link href={'/admin/super'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/super')}`} data-tip="Dashboard Admin">
                <span className="material-symbols-outlined">
                    apps
                </span>
                <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
            </Link>
            <Link href={'/admin/super/users'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/super/users')}`} data-tip="Data User">
                <span className="material-symbols-outlined">
                    supervised_user_circle
                </span>
                <span className="hidden lg:block whitespace-nowrap">Data User</span>
            </Link>

            <Link href={'/admin/super/settings'} className={`mt-auto flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/super/settings')}`} data-tip="Settings">
                <span className="material-symbols-outlined">
                    settings
                </span>
                <span className="hidden lg:block whitespace-nowrap">Settings</span>
            </Link>
        </aside >
    );
}
