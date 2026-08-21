"use client"

import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingWithoutText from "@/components/main/loading/LoadingWithoutText";
import HeaderUserArea from "@/components/main/user-area/Header";
import FooterUserArea from "@/components/main/user-area/Footer";
import SidebarSismora from "./SidebarSismora";
import LoginPrompt from "./LoginPrompt";
import DashboardSismora from "./DashboardSismora";
import Ruangan from "./ruangan/Ruangan";
import Mutasi from "./mutasi/Mutasi";

export default function MainSismora() {
    const [callName, setCallName] = useState<string>("");
    const dispatch = useDispatch<AppDispatch>()
    const { user, loading } = useSelector((state: RootState) => state.auth)
    const pathname = usePathname();

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setCallName(user.call_name || "");
        }
    }, [user]);

    if (loading) return <div className="flex h-screen w-full items-center justify-center bg-gray-100"><LoadingWithoutText /></div>;

    if (!user) {
        return <LoginPrompt />;
    }

    return (
        <main className="flex h-screen bg-gray-100 w-full">
            <SidebarSismora />
            <div className="flex-1 flex flex-col w-[calc(100%-4rem)] lg:w-[calc(100%-13rem)]">
                <HeaderUserArea user={user} callName={callName} />
                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {pathname === '/sismora' && <DashboardSismora />}
                    {pathname.startsWith('/sismora/mutasi') && <Mutasi />}
                    {pathname.startsWith('/sismora/ruangan') && <Ruangan />}
                    <FooterUserArea />
                </div>
            </div>
        </main>
    );
}
