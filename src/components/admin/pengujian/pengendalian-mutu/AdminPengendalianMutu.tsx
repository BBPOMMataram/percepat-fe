"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
    Users, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    CheckCircle2, 
    XCircle, 
    ArrowLeft, 
    ShieldCheck, 
    AlertCircle,
    X,
    UserCheck,
    Info,
    RefreshCw,
    Check
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getUserPhotoUrl } from "@/utils/userPhoto";
import LogoutBtn from "@/components/main/LogoutBtn";
import { 
    fetchAllMasterPenyelia, 
    createMasterPenyelia, 
    updateMasterPenyelia, 
    deleteMasterPenyelia,
    fetchAuthUsers,
    formatEmployeeFullName,
    type MasterPenyeliaItem 
} from "@/components/pengujian/pengendalian-mutu/data";

export default function AdminPengendalianMutu() {
    const { user, loading: authLoading } = useRequireAuth();

    // Data State
    const [penyelias, setPenyelias] = useState<MasterPenyeliaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"penyelia">("penyelia");

    // Auth Users State (for selecting supervisor accounts from auth-bpom)
    const [authUsers, setAuthUsers] = useState<any[]>([]);
    const [loadingAuthUsers, setLoadingAuthUsers] = useState(false);
    const [selectedAuthUserId, setSelectedAuthUserId] = useState<string>("");
    const [authSearchQuery, setAuthSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        nama: "",
        nip: "",
        jabatan: "Penyelia Mikrobiologi",
        is_active: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Notification / Alert
    const [statusAlert, setStatusAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const loadPenyelias = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllMasterPenyelia();
            setPenyelias(data);
        } catch (error) {
            console.error("Gagal memuat master penyelia:", error);
            setStatusAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Gagal memuat data master penyelia.",
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadAuthUsers = useCallback(async () => {
        setLoadingAuthUsers(true);
        try {
            const users = await fetchAuthUsers();
            setAuthUsers(users);
        } catch (error) {
            console.error("Gagal memuat daftar user Auth-BPOM:", error);
        } finally {
            setLoadingAuthUsers(false);
        }
    }, []);

    useEffect(() => {
        loadPenyelias();
        loadAuthUsers();
    }, [loadPenyelias, loadAuthUsers]);

    const filteredPenyelias = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return penyelias;
        return penyelias.filter((item) => 
            item.nama.toLowerCase().includes(query) ||
            (item.nip && item.nip.toLowerCase().includes(query)) ||
            (item.jabatan && item.jabatan.toLowerCase().includes(query))
        );
    }, [penyelias, searchQuery]);

    // Filter Auth-BPOM users in real-time based on search input
    const filteredAuthUsers = useMemo(() => {
        const q = authSearchQuery.trim().toLowerCase();
        if (!q) return authUsers;
        return authUsers.filter((u) => {
            const fullName = formatEmployeeFullName(u).toLowerCase();
            const nip = String(u.employee?.nip || "").toLowerCase();
            const jabatan = String(u.employee?.jabatan || "").toLowerCase();
            const fungsiName = String(u.employee?.fungsi?.name || "").toLowerCase();
            const name = String(u.name || "").toLowerCase();
            const email = String(u.email || "").toLowerCase();
            return (
                fullName.includes(q) ||
                nip.includes(q) ||
                jabatan.includes(q) ||
                fungsiName.includes(q) ||
                name.includes(q) ||
                email.includes(q)
            );
        });
    }, [authUsers, authSearchQuery]);

    // Helper to select an auth account and auto-fill form data
    const selectAuthUser = (userObj: any) => {
        if (!userObj) {
            setSelectedAuthUserId("");
            return;
        }
        setSelectedAuthUserId(String(userObj.id));

        const fullNameWithGelar = formatEmployeeFullName(userObj);
        const userNip = userObj.employee?.nip ? String(userObj.employee.nip).trim() : "";
        const userJabatan = userObj.employee?.jabatan || userObj.employee?.fungsi?.name || "Penyelia Mikrobiologi";

        setFormData({
            nama: fullNameWithGelar,
            nip: userNip,
            jabatan: userJabatan,
            is_active: true,
        });
        setFormError("");
    };

    // Handle selecting an auth account via dropdown select
    const handleSelectAuthUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const targetId = e.target.value;
        if (!targetId) {
            setSelectedAuthUserId("");
            return;
        }

        const foundUser = authUsers.find((u) => String(u.id) === String(targetId));
        if (foundUser) {
            selectAuthUser(foundUser);
        }
    };

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setEditingId(null);
        setSelectedAuthUserId("");
        setAuthSearchQuery("");
        setFormData({
            nama: "",
            nip: "",
            jabatan: "Penyelia Mikrobiologi",
            is_active: true,
        });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: MasterPenyeliaItem) => {
        setModalMode("edit");
        setEditingId(item.id);
        setSelectedAuthUserId("");
        setAuthSearchQuery("");
        setFormData({
            nama: item.nama,
            nip: item.nip || "",
            jabatan: item.jabatan || "Penyelia Mikrobiologi",
            is_active: Boolean(item.is_active),
        });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSaving) return;
        setIsModalOpen(false);
        setFormError("");
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        const trimmedNama = formData.nama.trim();
        if (!trimmedNama) {
            setFormError("Nama penyelia wajib diisi atau dipilih dari akun Auth-BPOM.");
            return;
        }

        setIsSaving(true);
        try {
            if (modalMode === "create") {
                await createMasterPenyelia({
                    nama: trimmedNama,
                    nip: formData.nip.trim() || null,
                    jabatan: formData.jabatan.trim() || "Penyelia Mikrobiologi",
                    is_active: formData.is_active,
                });
                setStatusAlert({ type: "success", message: `Penyelia "${trimmedNama}" berhasil ditambahkan.` });
            } else if (editingId !== null) {
                await updateMasterPenyelia(editingId, {
                    nama: trimmedNama,
                    nip: formData.nip.trim() || null,
                    jabatan: formData.jabatan.trim() || "Penyelia Mikrobiologi",
                    is_active: formData.is_active,
                });
                setStatusAlert({ type: "success", message: `Data penyelia "${trimmedNama}" berhasil diperbarui.` });
            }
            setIsModalOpen(false);
            await loadPenyelias();
        } catch (error) {
            console.error("Gagal menyimpan penyelia:", error);
            setFormError(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (item: MasterPenyeliaItem) => {
        const nextStatus = !item.is_active;
        try {
            await updateMasterPenyelia(item.id, {
                nama: item.nama,
                nip: item.nip,
                jabatan: item.jabatan,
                is_active: nextStatus,
            });
            setPenyelias((prev) => 
                prev.map((p) => p.id === item.id ? { ...p, is_active: nextStatus } : p)
            );
            setStatusAlert({
                type: "success",
                message: `Status ${item.nama} diubah menjadi ${nextStatus ? "Aktif" : "Nonaktif"}.`,
            });
        } catch (error) {
            console.error("Gagal mengubah status penyelia:", error);
            setStatusAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Gagal memperbarui status.",
            });
        }
    };

    const handleDelete = async (item: MasterPenyeliaItem) => {
        const confirmMsg = `Apakah Anda yakin ingin menghapus data penyelia "${item.nama}"?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteMasterPenyelia(item.id);
            setPenyelias((prev) => prev.filter((p) => p.id !== item.id));
            setStatusAlert({
                type: "success",
                message: `Penyelia "${item.nama}" berhasil dihapus.`,
            });
        } catch (error) {
            console.error("Gagal menghapus penyelia:", error);
            setStatusAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Gagal menghapus data penyelia.",
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
            {/* Top Admin Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-xs">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <Image
                            src="/assets/images/bpomri_without_label.png"
                            alt="Logo BBPOM"
                            width={80}
                            height={60}
                            className="h-10 w-auto object-contain"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                    Admin Panel
                                </span>
                                <h1 className="text-sm font-extrabold text-slate-900 sm:text-base truncate">
                                    Pengendalian Mutu Pengujian
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500">
                                Pengelolaan Data Master &amp; Konfigurasi Laboratorium Mikrobiologi
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:justify-end">
                        <Link
                            href="/pengujian/pengendalian-mutu"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Kembali ke Modul
                        </Link>

                        <div className="flex min-h-10 items-center">
                            {authLoading ? (
                                <span className="text-xs text-slate-400">Memuat...</span>
                            ) : user ? (
                                <div className="dropdown dropdown-end">
                                    <button
                                        type="button"
                                        tabIndex={0}
                                        className="btn btn-ghost btn-circle avatar"
                                        aria-label="Menu profil"
                                    >
                                        <div className="relative w-9 rounded-full ring-2 ring-slate-200">
                                            <Image
                                                fill
                                                priority
                                                unoptimized
                                                className="rounded-full object-cover"
                                                alt="Foto profil pengguna"
                                                src={getUserPhotoUrl(user?.photo_path)}
                                            />
                                        </div>
                                    </button>
                                    <ul
                                        tabIndex={0}
                                        className="menu menu-sm dropdown-content mt-3 z-50 w-52 rounded-box bg-base-100 p-2 shadow-lg"
                                    >
                                        <li className="menu-title px-4 py-2">
                                            <span className="font-bold text-slate-800">{user.name}</span>
                                            <span className="text-xs font-normal text-slate-500">
                                                {typeof user.role === "string" ? user.role : (user.role as any)?.name || "Administrator"}
                                            </span>
                                        </li>
                                        <div className="divider my-1"></div>
                                        <li>
                                            <LogoutBtn />
                                        </li>
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Alert Notification */}
                {statusAlert && (
                    <div
                        className={`mb-6 flex items-center justify-between rounded-xl border p-4 text-sm font-medium shadow-xs transition ${
                            statusAlert.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-rose-200 bg-rose-50 text-rose-800"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {statusAlert.type === "success" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                            )}
                            <span>{statusAlert.message}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStatusAlert(null)}
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Navigation Tabs (Extensible for other master tables) */}
                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            type="button"
                            onClick={() => setActiveTab("penyelia")}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition ${
                                activeTab === "penyelia"
                                    ? "border-[#005baa] text-[#005baa]"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            Master Penyelia
                            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                                {penyelias.length}
                            </span>
                        </button>
                    </nav>
                </div>

                {/* Section Content: Master Penyelia */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    {/* Header Action Bar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Daftar Penyelia Pengujian</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Akun penyelia terdaftar dari Auth-BPOM yang aktif akan muncul pada opsi form checklist pengujian.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama / NIP penyelia..."
                                    className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#005baa] focus:ring-2 focus:ring-[#005baa]/20 focus:outline-hidden transition"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004b8d]"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah dari Auth-BPOM
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4 w-12 text-center">No</th>
                                    <th className="py-3 px-4">Nama Lengkap &amp; Gelar</th>
                                    <th className="py-3 px-4">NIP</th>
                                    <th className="py-3 px-4">Jabatan</th>
                                    <th className="py-3 px-4 text-center w-28">Status</th>
                                    <th className="py-3 px-4 text-right w-36">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                                            <div className="inline-flex items-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#005baa] border-t-transparent"></div>
                                                <span>Memuat daftar penyelia...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPenyelias.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Users className="h-10 w-10 stroke-[1.5] mb-2 text-slate-300" />
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {searchQuery ? "Penyelia tidak ditemukan" : "Belum ada data penyelia"}
                                                </p>
                                                <p className="text-xs text-slate-400 max-w-sm mt-1">
                                                    {searchQuery
                                                        ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchQuery}".`
                                                        : "Silakan klik tombol Tambah dari Auth-BPOM di atas untuk memilih pegawai sebagai penyelia pengujian."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPenyelias.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-500">
                                                {index + 1}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-slate-900 block">{item.nama}</span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                                                {item.nip || "-"}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-700 text-xs">
                                                {item.jabatan || "Penyelia Mikrobiologi"}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(item)}
                                                    title="Klik untuk mengubah status aktif"
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                                                        item.is_active
                                                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {item.is_active ? (
                                                        <>
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                            Aktif
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3 w-3 text-slate-400" />
                                                            Nonaktif
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(item)}
                                                        className="p-1.5 text-slate-500 hover:text-[#005baa] hover:bg-blue-50 rounded-lg transition"
                                                        title="Ubah data"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                        title="Hapus penyelia"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal Tambah / Ubah Penyelia */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100 transition my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-[#005baa]" />
                                <h3 className="text-base font-bold text-slate-900">
                                    {modalMode === "create" ? "Pilih Penyelia dari Auth-BPOM" : "Ubah Data Penyelia"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSaving}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
                            {/* Selector dari Akun Auth-BPOM jika mode Tambah */}
                            {modalMode === "create" && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-800">
                                            Pilih Akun Pegawai (Auth-BPOM) <span className="text-rose-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={loadAuthUsers}
                                            disabled={loadingAuthUsers}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005baa] hover:underline"
                                        >
                                            <RefreshCw className={`h-3 w-3 ${loadingAuthUsers ? "animate-spin" : ""}`} />
                                            {loadingAuthUsers ? "Memuat..." : "Refresh Akun"}
                                        </button>
                                    </div>

                                    {/* Search Bar Akun Pegawai */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={authSearchQuery}
                                            onChange={(e) => setAuthSearchQuery(e.target.value)}
                                            placeholder="Ketik untuk mencari (nama, gelar, NIP, dll)..."
                                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:ring-2 focus:ring-[#005baa]/20 focus:outline-hidden transition"
                                        />
                                        {authSearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setAuthSearchQuery("")}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full transition"
                                                title="Bersihkan pencarian"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown Akun (Filter Otomatis Mengikuti Pencarian) */}
                                    <div>
                                        <select
                                            value={selectedAuthUserId}
                                            onChange={handleSelectAuthUser}
                                            disabled={loadingAuthUsers}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-[#005baa] focus:ring-2 focus:ring-[#005baa]/20 focus:outline-hidden transition font-medium"
                                        >
                                            <option value="">
                                                {loadingAuthUsers
                                                    ? "-- Memuat akun dari Auth-BPOM... --"
                                                    : filteredAuthUsers.length === 0
                                                    ? `-- Tidak ada pegawai cocok dengan "${authSearchQuery}" --`
                                                    : authSearchQuery
                                                    ? `-- Menampilkan ${filteredAuthUsers.length} akun cocok (Pilih Akun) --`
                                                    : "-- Pilih Pegawai dari Daftar Akun --"}
                                            </option>
                                            {filteredAuthUsers.map((u) => {
                                                const formatted = formatEmployeeFullName(u);
                                                const nipStr = u.employee?.nip ? ` (NIP: ${u.employee.nip})` : "";
                                                const isAlreadyAdded = penyelias.some((p) => p.nama.toLowerCase() === formatted.toLowerCase());
                                                return (
                                                    <option key={u.id} value={u.id}>
                                                        {formatted} {nipStr} {isAlreadyAdded ? " [Sudah Terdaftar]" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Hasil Pencarian Interaktif Saat Mengetik */}
                                    {authSearchQuery.trim() && (
                                        <div className="rounded-xl border border-blue-200 bg-white shadow-xs overflow-hidden">
                                            <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                                <span>Pilih Langsung dari Hasil:</span>
                                                <span>{filteredAuthUsers.length} ditemukan</span>
                                            </div>
                                            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                                                {filteredAuthUsers.length === 0 ? (
                                                    <div className="p-3 text-center text-xs text-slate-400 italic">
                                                        Pegawai tidak ditemukan. Pastikan nama/NIP sesuai akun di Auth-BPOM.
                                                    </div>
                                                ) : (
                                                    filteredAuthUsers.map((u) => {
                                                        const formatted = formatEmployeeFullName(u);
                                                        const nipStr = u.employee?.nip ? String(u.employee.nip).trim() : null;
                                                        const jabatanStr = u.employee?.jabatan || u.employee?.fungsi?.name || null;
                                                        const isSelected = String(selectedAuthUserId) === String(u.id);
                                                        const isAlreadyAdded = penyelias.some((p) => p.nama.toLowerCase() === formatted.toLowerCase());

                                                        return (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => selectAuthUser(u)}
                                                                className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between gap-2 cursor-pointer hover:bg-blue-50/80 ${
                                                                    isSelected ? "bg-blue-50 text-[#005baa] font-bold" : "text-slate-800"
                                                                }`}
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-semibold truncate">{formatted}</span>
                                                                        {isAlreadyAdded && (
                                                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-500 shrink-0">
                                                                                Terdaftar
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                                                        {nipStr && <span>NIP: {nipStr}</span>}
                                                                        {nipStr && jabatanStr && <span> • </span>}
                                                                        {jabatanStr && <span>{jabatanStr}</span>}
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <Check className="h-4 w-4 text-[#005baa] shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Indikator Akun Pegawai Terpilih */}
                                    {selectedAuthUserId && (
                                        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                                <span className="truncate">
                                                    Pegawai terpilih: <strong>{formData.nama}</strong>
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAuthUserId("");
                                                    setFormData({
                                                        nama: "",
                                                        nip: "",
                                                        jabatan: "Penyelia Mikrobiologi",
                                                        is_active: true,
                                                    });
                                                }}
                                                className="text-xs text-slate-400 hover:text-rose-600 ml-2"
                                                title="Batal pilih"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Info Note tentang Profile */}
                                    <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 leading-relaxed">
                                        <Info className="h-4 w-4 text-[#005baa] shrink-0 mt-0.5" />
                                        <span>
                                            Data nama, gelar, dan NIP ditarik otomatis dari akun <strong>Auth-BPOM</strong>. 
                                            Jika gelar atau NIP pegawai belum lengkap, pegawai bersangkutan dapat melengkapinya di menu <strong>Profil (/our-apps)</strong>.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Form Input Detail (Otomatis Terisi) */}
                            <div className="space-y-3 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Lengkap &amp; Gelar
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        placeholder="Pilih akun di atas atau masukkan nama lengkap"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#005baa] focus:ring-2 focus:ring-[#005baa]/20 focus:outline-hidden transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        NIP <span className="text-xs font-normal text-slate-400">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nip}
                                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                        placeholder="NIP pegawai"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#005baa] focus:ring-2 focus:ring-[#005baa]/20 focus:outline-hidden transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Jabatan
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.jabatan}
                                        onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                                        placeholder="Contoh: Penyelia Mikrobiologi"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#005baa] focus:ring-2 focus:ring-[#005baa]/20 focus:outline-hidden transition"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="modal-is-active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-[#005baa] focus:ring-[#005baa]"
                                    />
                                    <label htmlFor="modal-is-active" className="text-xs font-medium text-slate-700 cursor-pointer">
                                        Aktifkan penyelia ini (langsung muncul pada form checklist pengujian)
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={isSaving}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving || !formData.nama.trim()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004b8d] transition disabled:opacity-60"
                                >
                                    {isSaving ? "Menyimpan..." : modalMode === "create" ? "Tambahkan sebagai Penyelia" : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
