"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Icon } from "@iconify/react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import api from "@/utils/axios";

interface NotificationDetail {
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

export default function NotificationDetailPage() {
    const params = useParams();
    const id = String(params?.id || "");
    const { user, loading: authLoading } = useRequireAuth();
    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";

    const [notification, setNotification] = useState<NotificationDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!user || !id) return;

        let active = true;
        (async () => {
            setIsLoading(true);
            setErrorMessage("");
            try {
                const res = await api.get(`${authUrl}/api/notifications/${id}`);
                const notif: NotificationDetail | undefined = res.data?.notification;
                if (!notif) {
                    if (active) setErrorMessage("Notifikasi tidak ditemukan.");
                    return;
                }

                // Tandai sebagai sudah dibaca saat halaman detail notifikasi dibuka
                if (!notif.is_read) {
                    try {
                        await api.patch(`${authUrl}/api/notifications/${id}/read`);
                        notif.is_read = true;
                    } catch (err) {
                        console.error("Gagal menandai notifikasi sebagai dibaca:", err);
                    }
                }

                if (active) setNotification(notif);
            } catch (error: any) {
                console.error("Gagal memuat detail notifikasi:", error);
                if (active) {
                    setErrorMessage(
                        error?.response?.data?.message || "Notifikasi tidak ditemukan atau Anda tidak memiliki akses."
                    );
                }
            } finally {
                if (active) setIsLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [user, id, authUrl]);

    const hasExternalActionUrl =
        notification?.action_url &&
        notification.action_url !== `/notification/${id}` &&
        notification.action_url !== "/notification";

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href="/notification"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Semua Notifikasi
                    </Link>
                </div>

                {authLoading || isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-xs">
                        Memuat detail pemberitahuan...
                    </div>
                ) : errorMessage || !notification ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
                        <p className="text-sm font-bold text-rose-800">{errorMessage || "Notifikasi tidak ditemukan."}</p>
                        <Link
                            href="/notification"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                        >
                            Kembali ke Daftar Notifikasi
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
                            <div className="flex items-start gap-3.5">
                                <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Icon icon={notification.icon || "solar:bell-bing-bold"} width={22} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                                            {formatModuleLabel(notification.module)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Sudah Dibaca
                                        </span>
                                    </div>
                                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                        {notification.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                    {new Date(notification.created_at).toLocaleString("id-ID", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                            {notification.message}
                        </div>

                        {hasExternalActionUrl && notification.action_url && (
                            <div className="flex justify-end pt-2">
                                <Link
                                    href={notification.action_url}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004b8d] transition shadow-xs"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Buka Halaman Terkait
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
