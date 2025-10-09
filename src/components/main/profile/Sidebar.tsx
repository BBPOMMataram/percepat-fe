"use client";

import { User } from "@/types/auth";

export default function SidebarProfile({ user }: { user: User | null }) {
    return (
        <aside className="w-16 bg-white flex flex-col items-center py-6 gap-6 shadow-xl">
            <button className="tooltip tooltip-right p-2 rounded-lg hover:bg-gray-100" data-tip="Dashboard">
                <span className="material-symbols-outlined">
                    dashboard
                </span>
            </button>
            <button className="tooltip tooltip-right p-2 rounded-lg hover:bg-gray-100 bg-gray-200" data-tip="Profile">
                <span className="material-symbols-outlined">
                    account_circle
                </span>
            </button>
            <button className="tooltip tooltip-right p-2 rounded-lg hover:bg-gray-100" data-tip="Forum">
                <span className="material-symbols-outlined">
                    forum
                </span>
            </button>
            <button className="tooltip tooltip-right p-2 rounded-lg hover:bg-gray-100" data-tip="Report Error">
                <span className="material-symbols-outlined">
                    report_gmailerrorred
                </span>
            </button>
            <button className="tooltip tooltip-right p-2 rounded-lg hover:bg-gray-100" data-tip="Our Apps">
                <span className="material-symbols-outlined">
                    apps
                </span>
            </button>
            <button className="tooltip tooltip-right p-2 rounded-lg hover:bg-gray-100 mt-auto" data-tip="Setting">
                <span className="material-symbols-outlined">
                    settings
                </span>
            </button>
        </aside>
    );
}
