"use client";

import { User } from "@/types/auth";
import dayjs from "@/utils/dayjs";
import Image from "next/image";
import LogoutBtn from "../LogoutBtn";
import NotificationBell from "../NotificationBell";

export default function HeaderProfile({ user, callName }: { user: User | null, callName: string }) {
    return (
        <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">
                    Welcome, {callName || user?.name}
                </h2>
                <p className="text-sm text-gray-500">
                    {dayjs().format("dddd, DD MMMM YYYY")}
                </p>
            </div>

            <div className="flex items-center  gap-4">
                <div className="relative hidden md:block">
                    <span className="material-symbols-outlined absolute left-2 top-2 text-gray-400 w-4 h-4">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search"
                        className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                {/* <div className="tooltip tooltip-bottom" data-tip="Not Available">
                    <span className="material-symbols-outlined">
                        notifications
                    </span>
                </div> */}
                <NotificationBell />
                <LogoutBtn />
                <Image
                    src={user?.photo_path || "/assets/images/noimage.webp"}
                    alt="Profile photo"
                    width={32}
                    height={32}
                    className="rounded-full object-cover w-8 h-8"
                />
            </div>
        </header>
    );
}
