"use client";

import { usePathname, useRouter } from "next/navigation";
import ListRoomTypes from "./ListRoomTypes";
import ListRooms from "./ListRooms";
import FormRoomType from "./FormRoomType";
import FormRoom from "./FormRoom";

export default function Ruangan() {
    const pathname = usePathname();
    const router = useRouter();

    const isRoomTypesForm = pathname.startsWith("/sismora/ruangan/room-types/form");
    const isRoomsForm = pathname.startsWith("/sismora/ruangan/rooms/form");
    const isRoomTypesList = pathname === "/sismora/ruangan/room-types";
    const isRoomsList = pathname === "/sismora/ruangan" || pathname === "/sismora/ruangan/rooms";

    const isForm = isRoomTypesForm || isRoomsForm;

    const tabs = [
        { label: "Ruangan", path: "/sismora/ruangan/rooms" },
        { label: "Tipe Ruangan", path: "/sismora/ruangan/room-types" },
    ];

    const activeTab = isRoomsList || isRoomsForm ? 0 : 1;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 uppercase">Manajemen Ruangan</h1>

            {!isForm && (
                <div className="flex bg-gray-100 rounded-xl p-1 w-fit shadow-inner">
                    {tabs.map((tab, idx) => (
                        <button
                            key={idx}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === idx
                                    ? "bg-primary text-white shadow-md"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            }`}
                            onClick={() => router.push(tab.path)}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {idx === 0 ? "meeting_room" : "door_front"}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {isRoomTypesList && <ListRoomTypes />}
            {isRoomsList && <ListRooms />}
            {isRoomTypesForm && <FormRoomType />}
            {isRoomsForm && <FormRoom />}
        </div>
    );
}
