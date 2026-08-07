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
    const isRoomTypesList = pathname === "/sismora/ruangan" || pathname === "/sismora/ruangan/room-types";
    const isRoomsList = pathname === "/sismora/ruangan/rooms";

    const isForm = isRoomTypesForm || isRoomsForm;

    const tabs = [
        { label: "Tipe Ruangan", path: "/sismora/ruangan/room-types" },
        { label: "Ruangan", path: "/sismora/ruangan/rooms" },
    ];

    const activeTab = isRoomsList || isRoomsForm ? 1 : 0;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 uppercase">Manajemen Ruangan</h1>

            {!isForm && (
                <div className="tabs tabs-boxed bg-white p-1 w-fit rounded-lg shadow-sm">
                    {tabs.map((tab, idx) => (
                        <button
                            key={idx}
                            className={`tab ${activeTab === idx ? "tab-active" : ""}`}
                            onClick={() => router.push(tab.path)}
                        >
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
