"use client";
import { createPopper } from "@popperjs/core";
import { useEffect, useRef, useState } from "react";

export default function NotificationBell() {
    const [showPopper, setShowPopper] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const popperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (buttonRef.current && popperRef.current) {
            createPopper(buttonRef.current, popperRef.current, {
                placement: "bottom-end",
                modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
            });
        }
    }, [showPopper]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setShowPopper((p) => !p)}
                className="relative p-2 rounded-full hover:bg-gray-100"
            >
                <span className="material-symbols-outlined text-gray-700">
                    notifications
                </span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showPopper && (
                <div
                    ref={popperRef}
                    className="z-50 w-72 bg-white shadow-lg rounded-xl border border-gray-200"
                >
                    <div className="p-3 border-b border-gray-300 text-sm font-semibold text-gray-700">
                        Notification
                    </div>
                    <ul className="divide-y divide-gray-100">
                        <li className="p-3 hover:bg-gray-50 cursor-pointer">
                            <div className="text-sm font-medium text-gray-800">
                                Welcome
                            </div>
                            <div className="text-xs text-gray-500">
                                Selamat datang di Sistem Informasi Balai Besar POM di Mataram
                            </div>
                        </li>
                        {/* <li className="p-3 hover:bg-gray-50 cursor-pointer">
                            <div className="text-sm font-medium text-gray-800">
                                Update Sistem
                            </div>
                            <div className="text-xs text-gray-500">
                                Sistem presensi telah diperbarui
                            </div>
                        </li> */}
                    </ul>
                    {/* <div className="p-2 text-center text-xs text-blue-600 hover:underline cursor-pointer">
                        Lihat semua
                    </div> */}
                </div>
            )}
        </div>
    );
}
