"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarAdminPercepat() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ?
        "bg-bpom-blue text-gray-100" :
        "hover:bg-gray-100 hover:text-black";

    return (
        <aside className="w-16 lg:w-52 bg-white flex flex-col items-center py-3 gap-4 shadow-xl px-2">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-16 h-auto p-2" />
            <Link href={'/admin/percepat'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/percepat')}`} data-tip="Dashboard Admin">
                <span className="material-symbols-outlined">
                    apps
                </span>
                <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
            </Link>
            <div className="dropdown dropdown-right dropdown-center lg:w-full">
                <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/percepat/peserta')}`}
                    data-tip="Master Data">
                    <span className="material-symbols-outlined">
                        database
                    </span>
                    <span className="hidden lg:block whitespace-nowrap">Master</span>
                </button>
                <ul
                    tabIndex={0}
                    className="menu dropdown-content bg-base-100 rounded-box z-1 ml-4 max-w-fit p-2 shadow"
                >
                    <li>
                        <Link href={'/admin/percepat/master/reagen'}>Reagen</Link>
                    </li>
                    <li>
                        <Link href={'/admin/percepat/master/atk'}>ATK</Link>
                    </li>
                    <li>
                        <Link href={'/admin/percepat/master/perlengkapan'} className="whitespace-nowrap">Perlengkapan Kebersihan</Link>
                    </li>
                </ul>
            </div>
            <div className="dropdown dropdown-right dropdown-center lg:w-full">
                <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/percepat/peserta')}`}
                    data-tip="Permintaan">
                    <span className="material-symbols-outlined">
                        inventory
                    </span>
                    <span className="hidden lg:block whitespace-nowrap">Permintaan</span>
                </button>
                <ul
                    tabIndex={0}
                    className="menu dropdown-content bg-base-100 rounded-box z-1 ml-4 max-w-fit p-2 shadow"
                >
                    <li>
                        <Link href={'/admin/percepat/permintaan/reagen'}>Reagen</Link>
                    </li>
                    <li>
                        <Link href={'/admin/percepat/permintaan/atk'}>ATK</Link>
                    </li>
                    <li>
                        <Link href={'/admin/percepat/permintaan/perlengkapan'} className="whitespace-nowrap">Perlengkapan Kebersihan</Link>
                    </li>
                </ul>
            </div>

            <Link href={'/admin/percepat/settings'} className={`mt-auto flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/percepat/settings')}`} data-tip="Settings">
                <span className="material-symbols-outlined">
                    settings
                </span>
                <span className="hidden lg:block whitespace-nowrap">Settings</span>
            </Link>
        </aside >
    );
}
