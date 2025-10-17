"use client"
import AdminSiapMelayani from "@/components/admin/siap-melayani/AdminSiapMelayani";
import FooterUserArea from "@/components/main/user-area/Footer";
import HeaderUserArea from "@/components/main/user-area/Header";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SidebarAdminSiapMelayani from "./sidebar/SidebarAdminSiapMelayani";

export default function AdminArea() {
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
            console.log("user updated:", user);

        }
    }, [user]);

    return (
        <main className="flex h-screen bg-gray-100 select-none">
            <SidebarAdminSiapMelayani />
            <div className="flex-1 flex flex-col">
                <HeaderUserArea user={user} callName={callName} />
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* ADMIN PANEL */}
                    {
                        pathname.startsWith('/admin/siap-melayani') && user &&
                        <AdminSiapMelayani />
                    }
                    <FooterUserArea />
                </div>
            </div>
        </main>
    );
}
