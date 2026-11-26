"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, CheckCircle2, RefreshCw, Search, Send, UserCheck, Users, X } from "lucide-react";
import api from "@/utils/api";
import { formatEmployeeFullName } from "@/components/pengujian/pengendalian-mutu/data";

interface AuthUserItem {
    id: string;
    name: string;
    email?: string;
    telegram_chat_id?: string | null;
    telegram_username?: string | null;
    telegram_notif_enabled?: boolean;
    employee?: {
        nip?: string | null;
        jabatan?: string | null;
        gelar_depan?: string | null;
        gelar_belakang?: string | null;
        fungsi?: { name?: string | null } | null;
    } | null;
}

export default function AdminNotifikasiSuper() {
    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";

    const [users, setUsers] = useState<AuthUserItem[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [statusAlert, setStatusAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get<AuthUserItem[]>(`${authUrl}/api/get-all-users`);
            const list = Array.isArray(res.data) ? res.data : [];
            list.sort((a, b) => {
                const aConn = a.telegram_chat_id ? 1 : 0;
                const bConn = b.telegram_chat_id ? 1 : 0;
                if (aConn !== bConn) return bConn - aConn;
                return (a.name || "").localeCompare(b.name || "");
            });
            setUsers(list);
        } catch (error) {
            console.error("Gagal mengambil daftar user:", error);
            setStatusAlert({
                type: "error",
                text: "Gagal memuat daftar pengguna dari server Auth-BPOM.",
            });
        } finally {
            setLoadingUsers(false);
        }
    }, [authUrl]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => {
            const fullName = formatEmployeeFullName(u).toLowerCase();
            const baseName = (u.name || "").toLowerCase();
            const email = (u.email || "").toLowerCase();
            const nip = (u.employee?.nip || "").toLowerCase();
            const tgUser = (u.telegram_username || "").toLowerCase();
            return (
                fullName.includes(q) ||
                baseName.includes(q) ||
                email.includes(q) ||
                nip.includes(q) ||
                tgUser.includes(q)
            );
        });
    }, [users, searchQuery]);

    const isUserSelectable = (u: AuthUserItem) => Boolean(u.telegram_chat_id) && Boolean(u.telegram_notif_enabled);

    const connectedUsers = useMemo(() => users.filter(isUserSelectable), [users]);

    const selectedUsers = useMemo(
        () => users.filter((u) => selectedUserIds.includes(String(u.id))),
        [users, selectedUserIds]
    );

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleDropdownAdd = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) return;
        if (!selectedUserIds.includes(val)) {
            setSelectedUserIds((prev) => [...prev, val]);
        }
    };

    const handleSelectAllConnected = () => {
        setSelectedUserIds(connectedUsers.map((u) => String(u.id)));
    };

    const getUserStatusLabel = (u: AuthUserItem): string => {
        if (!u.telegram_chat_id) return "Belum terhubung ke Telegram";
        if (!u.telegram_notif_enabled) return "Notifikasi Telegram nonaktif";
        return u.telegram_username ? `@${u.telegram_username}` : "Terhubung";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusAlert(null);

        if (selectedUserIds.length === 0) {
            setStatusAlert({ type: "error", text: "Silakan pilih minimal 1 user tujuan." });
            return;
        }
        if (!message.trim()) {
            setStatusAlert({ type: "error", text: "Isi pesan notifikasi wajib diisi." });
            return;
        }

        setIsSending(true);
        try {
            const res = await api.post(`${authUrl}/api/telegram/send-manual`, {
                user_ids: selectedUserIds,
                title: title.trim() || undefined,
                message: message.trim(),
            });
            setStatusAlert({
                type: "success",
                text: res.data?.message || `Notifikasi Telegram berhasil dikirim ke ${selectedUserIds.length} user.`,
            });
            setTitle("");
            setMessage("");
            setSelectedUserIds([]);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Gagal mengirim notifikasi Telegram.";
            setStatusAlert({ type: "error", text: msg });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Kirim Notifikasi Telegram</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kirim pesan manual melalui bot Telegram ke satu atau beberapa user yang telah terhubung.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs border border-slate-200">
                    <UserCheck className="h-4 w-4 text-[#0088cc]" />
                    <span>{connectedUsers.length} dari {users.length} user aktif di Telegram</span>
                </div>
            </div>

            {statusAlert && (
                <div
                    role="alert"
                    className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium ${
                        statusAlert.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-rose-200 bg-rose-50 text-rose-800"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {statusAlert.type === "success" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                        )}
                        <span>{statusAlert.text}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStatusAlert(null)}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                {/* Pilih User Tujuan (Multiple) */}
                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-xs font-bold text-slate-800">
                            Pilih Penerima (Bisa Lebih dari 1 User) <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                            {connectedUsers.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSelectAllConnected}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                                >
                                    <Users className="h-3 w-3" />
                                    Pilih Semua Terhubung ({connectedUsers.length})
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={loadUsers}
                                disabled={loadingUsers}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0088cc] hover:underline"
                            >
                                <RefreshCw className={`h-3 w-3 ${loadingUsers ? "animate-spin" : ""}`} />
                                {loadingUsers ? "Memuat..." : "Refresh Daftar"}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, NIP, email, atau username Telegram..."
                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20 focus:outline-hidden transition"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                                title="Bersihkan pencarian"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Dropdown User (Otomatis mengikuti Search Bar, pilih untuk menambah penerima) */}
                    <div>
                        <select
                            value=""
                            onChange={handleDropdownAdd}
                            disabled={loadingUsers}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20 focus:outline-hidden transition font-medium"
                        >
                            <option value="">
                                {loadingUsers
                                    ? "-- Memuat daftar user... --"
                                    : filteredUsers.length === 0
                                    ? `-- Tidak ada user cocok dengan "${searchQuery}" --`
                                    : searchQuery
                                    ? `-- Menampilkan ${filteredUsers.length} user (Pilih untuk menambahkan) --`
                                    : "-- Pilih User yang Terhubung ke Telegram untuk Ditambahkan --"}
                            </option>
                            {filteredUsers.map((u) => {
                                const fullName = formatEmployeeFullName(u);
                                const selectable = isUserSelectable(u);
                                const alreadyAdded = selectedUserIds.includes(String(u.id));
                                const statusLabel = getUserStatusLabel(u);
                                return (
                                    <option key={u.id} value={u.id} disabled={!selectable || alreadyAdded}>
                                        {fullName} — [{alreadyAdded ? "Sudah dipilih" : statusLabel}]
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Daftar Hasil Pencarian Langsung Saat Mengetik (Klik untuk pilih / batal pilih) */}
                    {searchQuery.trim() && (
                        <div className="rounded-xl border border-sky-200 bg-white overflow-hidden shadow-xs">
                            <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span>Hasil Pencarian (klik untuk tambah/hapus):</span>
                                <span>{filteredUsers.length} user ditemukan</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-400 italic">
                                        Tidak ada user yang cocok dengan &quot;{searchQuery}&quot;.
                                    </div>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const fullName = formatEmployeeFullName(u);
                                        const selectable = isUserSelectable(u);
                                        const isSelected = selectedUserIds.includes(String(u.id));
                                        const nipStr = u.employee?.nip ? `NIP: ${u.employee.nip}` : u.email || "";

                                        return (
                                            <button
                                                key={u.id}
                                                type="button"
                                                disabled={!selectable}
                                                onClick={() => selectable && toggleUserSelection(String(u.id))}
                                                className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between gap-2 ${
                                                    !selectable
                                                        ? "bg-slate-50/70 text-slate-400 cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-sky-50 text-[#0088cc] font-bold cursor-pointer"
                                                        : "text-slate-800 hover:bg-sky-50/70 cursor-pointer"
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="font-semibold truncate">{fullName}</span>
                                                        {u.telegram_chat_id ? (
                                                            u.telegram_notif_enabled ? (
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                    {u.telegram_username ? `@${u.telegram_username}` : "Terhubung"}
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                                    Notif Nonaktif
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                                                                Belum terhubung ke Telegram
                                                            </span>
                                                        )}
                                                    </div>
                                                    {nipStr && (
                                                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                                            {nipStr}
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 text-[#0088cc] shrink-0" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Daftar Penerima Terpilih (Chips) */}
                    {selectedUsers.length > 0 && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold">
                                    Penerima Terpilih ({selectedUsers.length} user)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedUserIds([])}
                                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                                >
                                    Hapus Semua
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedUsers.map((u) => (
                                    <span
                                        key={u.id}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-900 shadow-2xs"
                                    >
                                        <span>
                                            {formatEmployeeFullName(u)}
                                            {u.telegram_username ? ` (@${u.telegram_username})` : ""}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleUserSelection(String(u.id))}
                                            className="rounded-full p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                            title="Hapus penerima"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Judul & Pesan */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="notif-title" className="block text-xs font-bold text-slate-700 mb-1">
                            Judul Pesan <span className="font-normal text-slate-400">(Opsional)</span>
                        </label>
                        <input
                            id="notif-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={150}
                            placeholder="Contoh: Pemberitahuan Verifikasi / Pengingat"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20 focus:outline-hidden transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="notif-message" className="block text-xs font-bold text-slate-700 mb-1">
                            Isi Pesan Notifikasi <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="notif-message"
                            required
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={4000}
                            placeholder="Tulis isi pesan yang akan dikirim ke Telegram penerima..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={isSending || selectedUserIds.length === 0 || !message.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0077b5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        {isSending
                            ? "Mengirim..."
                            : `Kirim Notifikasi Telegram${selectedUserIds.length > 0 ? ` (${selectedUserIds.length})` : ""}`}
                    </button>
                </div>
            </form>
        </div>
    );
}
