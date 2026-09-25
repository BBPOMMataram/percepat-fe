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
        <div className="navbar bg-base-300 shadow-sm z-40 pr-6">
            <div className="flex-none">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="btn btn-ghost btn-circle">
                    {isSidebarOpen ? (
                        <span className="material-symbols-outlined">close</span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    )}
                </button>
            </div>
            
            <div className="flex-1">
                <a className="btn btn-ghost text-xl font-serif">E - SAPA</a>
            </div>
            
            <div className="flex-none gap-2">
                <button className="btn btn-ghost btn-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center overflow-hidden">
                            {user?.photo_path ? (
                                <Image src={user.photo_path} alt="Foto User" width={40} height={40} className="object-cover" />
                            ) : (
                                <span className="material-symbols-outlined">person</span>
                            )}
                        </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-200 rounded-box w-52">
                        <li className="font-bold text-lg text-center capitalize mb-2">{user?.call_name || user?.name || "User"}</li>
                        <div className="divider my-0"></div>
                        <li>
                            <button onClick={handleLogout} className="text-red-500 font-semibold justify-center py-3">Logout</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}