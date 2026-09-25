"use client";

import { logout } from "@/features/authSlice";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

interface NavbarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (val: boolean) => void;
}

export default function NavbarESapa({ isSidebarOpen, setIsSidebarOpen }: NavbarProps) {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    return (
        <div className="h-20 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-40 px-4 sm:px-8 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="p-2 mr-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">
                        {isSidebarOpen ? "menu_open" : "menu"}
                    </span>
                </button>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full border border-slate-100 transition-colors cursor-pointer">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                            {user?.photo_path ? (
                                <Image src={user.photo_path} alt="Foto User" width={36} height={36} className="object-cover w-full h-full" />
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            )}
                        </div>
                        <div className="hidden sm:flex flex-col items-start mr-1">
                            <span className="text-sm font-bold text-slate-800 leading-none capitalize">{user?.name || "User"}</span>
                            <span className="text-[11px] text-slate-500 mt-1 leading-none">{user?.employee?.fungsi?.name || "Pengguna Sistem"}</span>
                        </div>
                        <span className="material-symbols-outlined text-[20px] text-slate-400 hidden sm:block">expand_more</span>
                    </div>
                    
                    <ul tabIndex={0} className="menu dropdown-content mt-2 p-2 shadow-lg bg-white border border-slate-100 rounded-xl w-56">
                        <li className="p-3 pb-2 border-b border-slate-100 mb-1 sm:hidden">
                            <span className="font-bold text-slate-800 capitalize text-sm">{user?.name || "User"}</span>
                            <span className="text-[11px] text-slate-500 mt-1">{user?.employee?.fungsi?.name || "Pengguna Sistem"}</span>
                        </li>
                        <li>
                            <button onClick={handleLogout} className="text-red-600 font-medium py-2.5 flex items-center gap-2 hover:bg-red-50 rounded-lg">
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Keluar Aplikasi
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}