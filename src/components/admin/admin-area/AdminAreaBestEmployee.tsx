"use client"
import AdminBestEmployee from "@/components/admin/best-employee/AdminBestEmployee";
import FooterUserArea from "@/components/main/user-area/Footer";
import HeaderUserArea from "@/components/main/user-area/Header";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminPresensiBestEmployee from "../best-employee/presensi/AdminPresensiBestEmployee";
import AdminSettingsBestEmployee from "../best-employee/settings/AdminSettingsBestEmployee";
import SidebarAdminBestEmployee from "./sidebar/SidebarAdminBestEmployee";

export default function AdminAreaBestEmployee() {
    const [callName, setCallName] = useState<string>("");

    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>()
    const pathname = usePathname();

    useEffect(() => {
        dispatch(getUser())
    }, [dispatch])

    // CALL NAME DIPISAH KARENA SAAT USER KETIK DI KOLOM INPUT CALL NAME MAKA DI HEADER NYA JUGA IKUT TERUBAH
    useEffect(() => {
        if (user) {
            setCallName(user.call_name || "");
        }
    }, [user]);

    return (
        <main className="flex h-screen bg-gray-100 w-full">
            <SidebarAdminBestEmployee />
            <div className="flex-1 flex flex-col w-[calc(100%-4rem)] lg:w-[calc(100%-13rem)]">
                <HeaderUserArea user={user} callName={callName} />
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* ADMIN DASHBOARD PANEL */}
                    {
                        pathname === '/admin/best-employee' && user &&
                        <AdminBestEmployee />
                    }
                    {/* OTHERS */}
                    {
                        pathname === '/admin/best-employee/presensi' && user &&
                        <AdminPresensiBestEmployee />
                    }
                    {
                        pathname === '/admin/best-employee/settings' && user &&
                        <AdminSettingsBestEmployee user={user} />
                    }
                    <FooterUserArea />
                </div>
            </div>
        </main>
    );
}
