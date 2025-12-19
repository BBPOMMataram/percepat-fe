"use client";

export default function NotificationBell() {
    return (
        <div className="dropdown dropdown-end tooltip tooltip-left" data-tip="Notifications">
            <button
                className="relative p-2 rounded-full hover:bg-gray-100"
                tabIndex={0}
            >
                <span className="material-symbols-outlined text-gray-700 select-none">
                    notifications
                </span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div
                className="menu dropdown-content z-50 w-72 bg-white shadow-lg rounded-xl border border-gray-200"
                tabIndex={0}
            >
                <div className="p-3 border-b border-gray-300 text-sm font-semibold text-gray-700">
                    Notifications
                </div>
                <ul className="py-2">
                    <li className="p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer text-xs rounded-sm mb-1">
                        Selamat datang di Sistem Informasi Balai Besar POM di Mataram
                    </li>
                    {/* <li className="p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer text-xs rounded-sm mb-1">
                        Sistem presensi telah diperbarui
                    </li> */}
                </ul>
                {/* <div className="p-2 text-center text-xs text-blue-600 hover:underline cursor-pointer">
                        Lihat semua
                    </div> */}
            </div>
        </div>
    );
}
