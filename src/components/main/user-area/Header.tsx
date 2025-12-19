"use client";

import { User } from "@/types/auth";
import dayjs from "@/utils/dayjs";
import Image from "next/image";
import Link from "next/link";
import LogoutBtn from "../LogoutBtn";
import NotificationBell from "../NotificationBell";

export default function HeaderUserArea({ user, callName }: { user: User | null, callName: string }) {
    return (
        <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
            <div>
                <h2 className="md:text-lg font-semibold text-gray-800">
                    {(() => {
                        const hour = dayjs().hour();
                        const greeting =
                            hour < 12 ? "Selamat pagi" :
                                hour < 15 ? "Selamat siang" :
                                    hour < 18 ? "Selamat sore" :
                                        "Selamat malam";
                        const fullName = `${user?.employee?.gelar_depan ? user?.employee?.gelar_depan + ". " : ""}${user?.name}${user?.employee?.gelar_belakang ? ", " + user?.employee?.gelar_belakang : ""}`;
                        return `${greeting}, ${callName || fullName}`;
                    })()}
                </h2>
                <p className="text-xs text-gray-500">
                    {dayjs().format("dddd, DD MMMM YYYY")}
                </p>
            </div>

            <div className="flex items-center  gap-4">
                <NotificationBell />
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <Image
                            src={user?.photo_path || "/assets/images/noimage.webp"}
                            alt="Profile photo"
                            width={32}
                            height={32}
                            className="rounded-full object-cover w-8 h-8"
                        />
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 max-w-fit p-2 shadow"
                    >
                        {
                            user?.student &&
                            <li>
                                <Link href={'/siap-melayani/presensi'}>Presensi</Link>
                            </li>
                        }
                        <li>
                            <Link href={'/profile'}>Profile</Link>
                        </li>
                        <li className="mt-2 w-fit">
                            <LogoutBtn />
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
}
