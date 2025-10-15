"use client"
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Footer from "./Footer";
import Header from "./Header";
import OurApps from "./our-apps/OurApps";
import Profile from "./profile/Profile";
import Settings from "./settings/Settings";
import Sidebar from "./Sidebar";

export default function UserArea() {
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
        <main className="flex h-screen bg-gray-100 select-none">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header user={user} callName={callName} />
                <div className="flex-1 p-8 overflow-y-auto">
                    {
                        pathname === '/profile' && user &&
                        <Profile user={user} updateCallName={setCallName} callName={callName} />
                    }
                    {
                        pathname === '/settings' && user &&
                        <Settings user={user} />
                    }
                    {
                        pathname === '/our-apps' && user &&
                        <OurApps user={user} />
                    }
                    <Footer />
                </div>
            </div>
        </main>
    );
}
