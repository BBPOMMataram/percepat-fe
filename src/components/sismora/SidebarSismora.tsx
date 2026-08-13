"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarSismora() {
    const pathname = usePathname();

    const isActive = (path: string, exact = false) => {
        const active = exact
            ? pathname === path
            : pathname === path || pathname.startsWith(path + '/');

        return active
            ? "bg-bpom-blue text-gray-100"
            : "hover:bg-gray-100 hover:text-black";
    }

    return (
        <aside className="w-16 lg:w-52 bg-white flex flex-col items-center py-3 gap-4 shadow-xl px-2">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-16 h-auto p-2" />
            <Link href={'/sismora'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/sismora', true)}`} data-tip="Dashboard">
                <span className="material-symbols-outlined">
                    apps
                </span>
                <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
            </Link>
            <Link href={'/sismora/mutasi'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/sismora/mutasi')}`} data-tip="Mutasi">
                <span className="material-symbols-outlined">
                    swap_horiz
                </span>
                <span className="hidden lg:block whitespace-nowrap">Mutasi</span>
            </Link>
            <Link href={'/sismora/ruangan'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/sismora/ruangan')}`} data-tip="Ruangan">
                <span className="material-symbols-outlined">
                    meeting_room
                </span>
                <span className="hidden lg:block whitespace-nowrap">Ruangan</span>
            </Link>
            <Link href={'/sismora/settings'} className={`mt-auto flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/sismora/settings')}`} data-tip="Settings">
                <span className="material-symbols-outlined">
                    settings
                </span>
                <span className="hidden lg:block whitespace-nowrap">Settings</span>
            </Link>
        </aside>
    );
}
