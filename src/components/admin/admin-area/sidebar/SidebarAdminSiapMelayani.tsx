"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarAdminSiapMelayani() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ?
        "bg-bpom-blue text-gray-100" :
        "hover:bg-gray-100 hover:text-black";

    return (
        <aside className="w-16 bg-white flex flex-col items-center py-3 gap-4 shadow-xl">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-auto h-auto p-2" />
            <button className={`tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/admin/siap-melayani')}`} data-tip="Dashboard Admin">
                <Link href={'/admin/siap-melayani'}>
                    <span className="material-symbols-outlined">
                        apps
                    </span>
                </Link>
            </button>
            <div className="dropdown dropdown-right dropdown-center">
                <button className={`tooltip tooltip-top p-2 pb-1 rounded-lg ${isActive('/admin/siap-melayani/peserta')} flex flex-col`}
                    data-tip="Data PKL">
                    <span className="material-symbols-outlined">
                        select
                    </span>
                    <span className="text-xs">PKL</span>
                </button>
                <ul
                    tabIndex={0}
                    className="menu dropdown-content bg-base-100 rounded-box z-1 ml-4 max-w-fit p-2 shadow"
                >
                    <li>
                        <Link href={'/admin/siap-melayani/peserta'}>Peserta</Link>
                    </li>
                    <li>
                        <Link href={'/admin/siap-melayani/presensi'}>Presensi</Link>
                    </li>
                    <li>
                        <Link href={'/admin/siap-melayani/penempatan'}>Penempatan</Link>
                    </li>
                    <li>
                        <Link href={'/admin/siap-melayani/quiz'}>Quiz</Link>
                    </li>
                    <li>
                        <Link href={'/admin/siap-melayani/pengajuan'}>Pengajuan</Link>
                    </li>
                </ul>
            </div>
            <button className={`tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/admin/siap-melayani/kunjungan-narasumber')}`} data-tip="Kunjungan & Narasumber">
                <Link href={'/admin/siap-melayani/kunjungan-narasumber'}>
                    <span className="material-symbols-outlined">
                        select
                    </span>
                </Link>
            </button>
            <button className={`tooltip tooltip-right p-2 pb-1 rounded-lg ${isActive('/admin/siap-melayani/pengaduan')}`} data-tip="Pengaduan">
                <Link href={'/admin/siap-melayani/pengaduan'}>
                    <span className="material-symbols-outlined">
                        select
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
