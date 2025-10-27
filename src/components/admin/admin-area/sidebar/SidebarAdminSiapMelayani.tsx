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
        <aside className="w-16 lg:w-52 bg-white flex flex-col items-center py-3 gap-4 shadow-xl px-2">
            <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto w-16 h-auto p-2" />
            <Link href={'/admin/siap-melayani'} className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/siap-melayani')}`} data-tip="Dashboard Admin">
                <span className="material-symbols-outlined">
                    apps
                </span>
                <span className="hidden lg:block whitespace-nowrap">Dashboard</span>
            </Link>
            <div className="dropdown dropdown-right dropdown-center lg:w-full">
                <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/siap-melayani/peserta')}`}
                    data-tip="Data PKL">
                    <span className="material-symbols-outlined">
                        diversity_2
                    </span>
                    <span className="hidden lg:block whitespace-nowrap">PKL</span>
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
                    {/* <li>
                        <Link href={'/admin/siap-melayani/quiz'}>Quiz</Link>
                    </li> */}
                    <li>
                        <Link href={'/admin/siap-melayani/pengajuan'}>Pengajuan</Link>
                    </li>
                    <li>
                        <Link href={'/admin/siap-melayani/tata-tertib'}>Tata Tertib</Link>
                    </li>
                    <li>
                        <Link href={'/admin/siap-melayani/e-learning'}>E-Learning</Link>
                    </li>
                    <li>
                        <Link href={'/admin/siap-melayani/pakta-integritas'} className="whitespace-nowrap">Link Pakta Integritas</Link>
                    </li>
                </ul>
            </div>
            <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/siap-melayani/kunjungan-narasumber')}`} data-tip="Kunjungan & Narasumber">
                {/* <Link href={'/admin/siap-melayani/kunjungan-narasumber'}> */}
                <span className="material-symbols-outlined">
                    interpreter_mode
                </span>
                <span className="hidden lg:block whitespace-nowrap">Narasumber</span>
                {/* </Link> */}
            </button>
            <button className={`flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/admin/siap-melayani/pengaduan')}`} data-tip="Pengaduan">
                {/* <Link href={'/admin/siap-melayani/pengaduan'}> */}
                <span className="material-symbols-outlined">
                    support_agent
                </span>
                <span className="hidden lg:block whitespace-nowrap">Pengaduan</span>
                {/* </Link> */}
            </button>
            <Link href={'/admin/siap-melayani/settings'} className={`mt-auto flex gap-2 lg:w-full tooltip tooltip-right p-2 rounded-lg ${isActive('/settings')}`} data-tip="Settings">
                <span className="material-symbols-outlined">
                    settings
                </span>
                <span className="hidden lg:block whitespace-nowrap">Settings</span>
            </Link>
        </aside >
    );
}
