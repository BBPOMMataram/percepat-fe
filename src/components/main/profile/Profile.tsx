"use client"
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormProfile from "./Form";
import HeaderProfile from "./Header";
import SidebarProfile from "./Sidebar";

export default function Profile() {
    const [callName, setCallName] = useState<string>("");

    const { user } = useSelector((state: RootState) => state.auth);

    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        dispatch(getUser())
    }, [dispatch])

    useEffect(() => {
        if (user) {
            setCallName(user.call_name || "");
        }
    }, [user]);


    return (
        <main className="flex h-screen bg-gray-100">
            <SidebarProfile user={user} />
            <div className="flex-1 flex flex-col">
                <HeaderProfile user={user} callName={callName} />
                <div className="flex-1 p-8 overflow-y-auto">
                    <FormProfile user={user} updateCallName={setCallName} callName={callName} />
                </div>
            </div>
        </main>
    );
}
