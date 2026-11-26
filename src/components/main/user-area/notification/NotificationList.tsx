"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Clock } from "lucide-react";
import { Icon } from "@iconify/react";
import api from "@/utils/axios";
import type { User } from "@/types/auth";

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

export default function NotificationList({ user }: { user: User }) {
    const router = useRouter();
    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [filterModule, setFilterModule] = useState("all");

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await api.get(`${authUrl}/api/notifications`);
            setNotifications(res.data?.notifications || []);
            setUnreadCount(res.data?.unread_count || 0);
        } catch (error) {
            console.error("Gagal memuat notifikasi:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, authUrl]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        try {
            await api.post(`${authUrl}/api/notifications/mark-all-read`);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            window.dispatchEvent(new CustomEvent("bpom:notifications-updated"));
        } catch (error) {
            console.error("Gagal menandai semua dibaca:", error);
        }
    };

    const availableModules = useMemo(() => {
        return Array.from(
            new Set(
                notifications
                    .map((n) => n.module?.trim().toUpperCase())
                    .filter((m): m is string => Boolean(m))
            )
        );
    }, [notifications]);

    const filteredList = useMemo(() => {
        if (filterModule === "all") return notifications;
        return notifications.filter((n) => n.module?.trim().toUpperCase() === filterModule.toUpperCase());
    }, [notifications, filterModule]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-[#005baa]" />
                        Pemberitahuan
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                                {unreadCount} baru
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Klik salah satu pemberitahuan untuk membaca detail dan menandai sudah dibaca.
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004b8d] transition"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Tandai Semua Dibaca
                    </button>
                )}
            </div>

            {availableModules.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => setFilterModule("all")}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
                            filterModule === "all"
                                ? "bg-slate-900 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        Semua
                    </button>
                    {availableModules.map((mod) => (
                        <button
                            key={mod}
                            type="button"
                            onClick={() => setFilterModule(mod)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
                                filterModule.toUpperCase() === mod
                                    ? "bg-slate-900 text-white"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            {formatModuleLabel(mod)}
                        </button>
                    ))}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs divide-y divide-slate-100">
                {isLoading ? (
                    <div className="py-16 text-center text-sm text-slate-500">Memuat pemberitahuan...</div>
                ) : filteredList.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                        <Bell className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="text-sm font-bold text-slate-700">Belum ada pemberitahuan</p>
                        <p className="text-xs text-slate-400">Semua notifikasi Anda akan muncul di halaman ini.</p>
                    </div>
                ) : (
                    filteredList.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => router.push(`/notification/${item.id}`)}
                            className={`p-5 flex items-start gap-4 cursor-pointer transition ${
                                item.is_read
                                    ? "bg-white hover:bg-slate-50/80 opacity-80"
                                    : "bg-blue-50/40 hover:bg-blue-50/70"
                            }`}
                        >
                            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Icon icon={item.icon || "solar:bell-bing-bold"} width={20} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                                        {formatModuleLabel(item.module)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                        <Clock className="h-3 w-3" />
                                        {new Date(item.created_at).toLocaleString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                                <p className="text-xs text-slate-600 line-clamp-2">{item.message}</p>
                            </div>
                            {!item.is_read && (
                                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" title="Belum dibaca" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
