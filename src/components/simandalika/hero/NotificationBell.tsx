/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import api from "@/utils/axios";
import { Icon } from "@iconify/react";
import {
    getPushPermissionState,
    isWebPushSupported,
    PushPermissionState,
    subscribeWebPush,
    syncWebPushIfGranted,
    unsubscribeWebPush,
} from "@/utils/webPush";

interface NotificationItem {
    id: number;
    module: string;
    title: string;
    message: string;
    action_url: string | null;
    icon: string;
    type: "danger" | "warning" | "info" | "success";
    is_read: boolean;
    created_at: string;
}

function formatModuleLabel(mod?: string | null): string {
    const trimmed = (mod || "").trim();
    if (!trimmed) return "";
    if (trimmed.toLowerCase() === "admin-super") return "Admin BPOM";
    return trimmed;
}

function formatRelativeTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffSeconds < 60) return "Baru saja";
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} jam lalu`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch {
        return "";
    }
}

interface NotificationBellProps {
    compact?: boolean;
}

export default function NotificationBell({ compact = false }: NotificationBellProps) {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [filterModule, setFilterModule] = useState<string>("all");
    const [pushPermission, setPushPermission] = useState<PushPermissionState>("unsupported");
    const [isPushSubscribed, setIsPushSubscribed] = useState(false);
    const [isPushBusy, setIsPushBusy] = useState(false);
    const [pushFeedback, setPushFeedback] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await api.get(`${authUrl}/api/notifications`);
            setNotifications(res.data?.notifications || []);
            setUnreadCount(res.data?.unread_count || 0);
        } catch (error) {
            console.error("Gagal memuat notifikasi terpusat:", error);
        }
    };

    // Ambil data pertama kali & polling setiap 30 detik + dengar event sinkronisasi
    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            const handleUpdated = () => fetchNotifications();
            window.addEventListener("bpom:notifications-updated", handleUpdated);
            return () => {
                clearInterval(interval);
                window.removeEventListener("bpom:notifications-updated", handleUpdated);
            };
        }
    }, [user, authUrl]);

    // Cek status izin Web Push & sinkronisasi otomatis jika user sudah pernah mengizinkan
    useEffect(() => {
        if (!user) {
            setIsPushSubscribed(false);
            return;
        }
        const perm = getPushPermissionState();
        setPushPermission(perm);

        if (!isWebPushSupported()) return;

        let active = true;
        (async () => {
            if (perm === "granted") {
                const synced = await syncWebPushIfGranted(authUrl);
                if (active) setIsPushSubscribed(synced);
            } else {
                if (active) setIsPushSubscribed(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [user?.id, authUrl]);

    const handleEnableWebPush = async () => {
        setIsPushBusy(true);
        setPushFeedback(null);
        const result = await subscribeWebPush(authUrl);
        setPushPermission(getPushPermissionState());
        if (result.ok) {
            setIsPushSubscribed(true);
            setPushFeedback("Notifikasi perangkat aktif. Anda akan menerima pemberitahuan meski web ditutup.");
        } else {
            setIsPushSubscribed(false);
            setPushFeedback(result.message || "Gagal mengaktifkan notifikasi perangkat.");
        }
        setIsPushBusy(false);
    };

    const handleDisableWebPush = async () => {
        setIsPushBusy(true);
        setPushFeedback(null);
        await unsubscribeWebPush(authUrl, true);
        setIsPushSubscribed(false);
        setPushFeedback("Notifikasi perangkat dinonaktifkan untuk perangkat ini.");
        setIsPushBusy(false);
    };

    // Reset filter jika modul yang dipilih sudah tidak ada di daftar notifikasi
    useEffect(() => {
        if (
            filterModule !== "all" &&
            !notifications.some((n) => n.module?.trim().toUpperCase() === filterModule.toUpperCase())
        ) {
            setFilterModule("all");
        }
    }, [notifications, filterModule]);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Navigasi ke halaman detail notifikasi (/notification/[id]); mark-as-read dijalankan saat halaman dibuka
    const handleNotificationClick = (notif: NotificationItem) => {
        setIsOpen(false);
        router.push(`/notification/${notif.id}`);
    };

    // Tandai semua notifikasi telah dibaca
    const handleMarkAllAsRead = async () => {
        setIsLoading(true);
        try {
            await api.post(`${authUrl}/api/notifications/mark-all-read`);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            window.dispatchEvent(new CustomEvent("bpom:notifications-updated"));
        } catch (error) {
            console.error("Gagal menandai semua dibaca:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return null; // Hanya tampil jika sudah login
    }

    // Ekstrak modul unik yang memang memiliki notifikasi aktif (hanya modul dengan notif yang ditampilkan)
    const availableModules = Array.from(
        new Set(
            notifications
                .map((n) => n.module?.trim().toUpperCase())
                .filter((mod): mod is string => Boolean(mod))
        )
    );

    const filteredList = notifications.filter((n) => {
        if (filterModule === "all") return true;
        return n.module?.trim().toUpperCase() === filterModule.toUpperCase();
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case "danger":
                return {
                    bg: "bg-rose-50 text-rose-600 border-rose-200",
                    badge: "bg-rose-100 text-rose-700",
                    dot: "bg-rose-500",
                };
            case "warning":
                return {
                    bg: "bg-amber-50 text-amber-700 border-amber-200",
                    badge: "bg-amber-100 text-amber-800",
                    dot: "bg-amber-500",
                };
            case "success":
                return {
                    bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
                    badge: "bg-emerald-100 text-emerald-700",
                    dot: "bg-emerald-500",
                };
            default:
                return {
                    bg: "bg-blue-50 text-blue-600 border-blue-200",
                    badge: "bg-blue-100 text-blue-700",
                    dot: "bg-blue-500",
                };
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* TOMBOL LONCENG */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs border ${
                    compact ? "w-9 h-9 rounded-xl" : "w-11 h-11 rounded-2xl"
                } ${
                    isOpen
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30"
                        : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300"
                }`}
                title="Pemberitahuan Sistem SI MANDALIKA"
                aria-label="Pemberitahuan"
            >
                <Icon
                    icon={unreadCount > 0 ? "solar:bell-bing-bold" : "solar:bell-linear"}
                    width={compact ? 18 : 22}
                    className={unreadCount > 0 && !isOpen ? "animate-wiggle text-amber-500" : ""}
                />

                {/* BADGE MERAH MENYALA */}
                {unreadCount > 0 && (
                    <span
                        className={`absolute -top-1 -right-1 rounded-full bg-rose-600 text-white font-black flex items-center justify-center shadow-md shadow-rose-500/40 ring-2 ring-white animate-pulse ${
                            compact
                                ? "min-w-[18px] h-[18px] px-1 text-[10px]"
                                : "min-w-[20px] h-5 px-1.5 text-[11px]"
                        }`}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* DROPDOWN POPOVER NOTIFIKASI */}
            {isOpen && (
                <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header Popover */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                <Icon icon="solar:bell-bing-bold" width={18} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-sm">Pemberitahuan</h3>
                                <p className="text-[11px] text-slate-500">Lintas Modul SI MANDALIKA</p>
                            </div>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition cursor-pointer"
                                title="Tandai semua telah dibaca"
                            >
                                <Icon icon="solar:check-read-bold" width={14} />
                                <span>Tandai Semua Dibaca</span>
                            </button>
                        )}
                    </div>

                    {/* Status & Toggle Web Push Notification Perangkat */}
                    {pushPermission !== "unsupported" && (
                        <div className="px-4 py-2.5 bg-white border-b border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                            isPushSubscribed
                                                ? "bg-emerald-500"
                                                : pushPermission === "denied"
                                                ? "bg-rose-500"
                                                : "bg-amber-400"
                                        }`}
                                    />
                                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                                        {isPushSubscribed
                                            ? "Push Notifikasi Aktif"
                                            : pushPermission === "denied"
                                            ? "Notifikasi Diblokir Browser"
                                            : "Aktifkan Push Notifikasi"}
                                    </span>
                                </div>

                                {isPushSubscribed ? (
                                    <button
                                        type="button"
                                        onClick={handleDisableWebPush}
                                        disabled={isPushBusy}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer shrink-0 disabled:opacity-50"
                                    >
                                        {isPushBusy ? "..." : "Nonaktifkan"}
                                    </button>
                                ) : pushPermission === "denied" ? (
                                    <span className="text-[10px] text-rose-500 font-semibold shrink-0">
                                        Ubah di izin situs
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleEnableWebPush}
                                        disabled={isPushBusy}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shrink-0 disabled:opacity-50"
                                    >
                                        {isPushBusy ? "Memproses..." : "Izinkan"}
                                    </button>
                                )}
                            </div>

                            {pushFeedback && (
                                <p className="text-[10px] text-slate-500 leading-snug">
                                    {pushFeedback}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Filter Kategori Modul (Hanya modul yang memiliki notifikasi aktif) */}
                    {availableModules.length > 0 && (
                        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                            <button
                                type="button"
                                onClick={() => setFilterModule("all")}
                                className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
                                    filterModule === "all"
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                                }`}
                            >
                                Semua
                            </button>
                            {availableModules.map((mod) => (
                                <button
                                    key={mod}
                                    type="button"
                                    onClick={() => setFilterModule(mod)}
                                    className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
                                        filterModule.toUpperCase() === mod
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                                    }`}
                                >
                                    {formatModuleLabel(mod)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* List Notifikasi */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                        {filteredList.length === 0 ? (
                            <div className="py-12 px-6 text-center space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                                    <Icon icon="solar:bell-off-linear" width={24} />
                                </div>
                                <p className="text-xs font-bold text-slate-700">Tidak ada pemberitahuan baru</p>
                                <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                                    Semua tugas, persetujuan, dan laporan Anda saat ini sudah bersih.
                                </p>
                            </div>
                        ) : (
                            filteredList.map((item) => {
                                const colors = getTypeColor(item.type);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNotificationClick(item)}
                                        className={`p-4 transition-all duration-150 flex items-start gap-3.5 cursor-pointer ${
                                            item.is_read
                                                ? "bg-white hover:bg-slate-50/80 opacity-75"
                                                : "bg-blue-50/40 hover:bg-blue-50/70 font-semibold"
                                        }`}
                                    >
                                        {/* Icon Type */}
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${colors.bg}`}
                                        >
                                            <Icon icon={item.icon || "solar:bell-bing-bold"} width={18} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${colors.badge}`}
                                                >
                                                    {formatModuleLabel(item.module)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-normal shrink-0">
                                                    {formatRelativeTime(item.created_at)}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                                                {item.title}
                                            </h4>
                                            <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                                {item.message}
                                            </p>
                                        </div>

                                        {/* Titik Penanda Belum Dibaca */}
                                        {!item.is_read && (
                                            <span
                                                className={`w-2 h-2 rounded-full ${colors.dot} shrink-0 mt-1.5`}
                                                title="Belum dibaca"
                                            />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Popover */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">
                            Notifikasi sesuai wewenang jabatan
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                router.push("/notification");
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                            Lihat Semua
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
