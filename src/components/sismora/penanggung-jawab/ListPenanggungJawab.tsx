"use client";

import { ModalGeneral } from "@/components/main/ModalGeneral";
import api from "@/utils/api";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface PenanggungJawabItem {
    id: number;
    laboratorium: string;
    penyelia: string;
    penanggung_jawab: string;
    keterangan?: string;
    updated_at?: string;
}

export default function ListPenanggungJawab() {
    const [items, setItems] = useState<PenanggungJawabItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form Modal state
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formLab, setFormLab] = useState("");
    const [formPenyelia, setFormPenyelia] = useState("");
    const [formPj, setFormPj] = useState("");
    const [formKeterangan, setFormKeterangan] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchItems = useCallback(() => {
        setLoading(true);
        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/penanggung-jawabs?search=${encodeURIComponent(search)}`;
        api.get(endpoint)
            .then(({ data }) => {
                const list = Array.isArray(data) ? data : data?.data || [];
                setItems(list);
            })
            .catch((err) => {
                console.error("Gagal memuat data penanggung jawab:", err);
                toast.error("Gagal memuat data penanggung jawab");
                setItems([]);
            })
            .finally(() => setLoading(false));
    }, [search]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleOpenAdd = () => {
        setIsEditing(false);
        setEditId(null);
        setFormLab("");
        setFormPenyelia("");
        setFormPj("");
        setFormKeterangan("");
        setShowFormModal(true);
    };

    const handleOpenEdit = (item: PenanggungJawabItem) => {
        setIsEditing(true);
        setEditId(item.id);
        setFormLab(item.laboratorium);
        setFormPenyelia(item.penyelia);
        setFormPj(item.penanggung_jawab);
        setFormKeterangan(item.keterangan || "");
        setShowFormModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formLab.trim() || !formPenyelia.trim() || !formPj.trim()) {
            toast.warning("Laboratorium, Penyelia, dan Penanggung Jawab wajib diisi!");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                laboratorium: formLab.trim(),
                penyelia: formPenyelia.trim(),
                penanggung_jawab: formPj.trim(),
                keterangan: formKeterangan.trim() || null,
            };

            if (isEditing && editId) {
                await api.put(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/penanggung-jawabs/${editId}`, payload);
                toast.success("Data berhasil diperbarui!");
            } else {
                await api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/penanggung-jawabs`, payload);
                toast.success("Data baru berhasil ditambahkan!");
            }

            setShowFormModal(false);
            fetchItems();
        } catch (err: any) {
            console.error("Error saving data:", err);
            toast.error(err?.response?.data?.message || "Gagal menyimpan data!");
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteHandler = (id: number) => {
        setSelectedDeleteId(id);
        setShowModalDelete(true);
    };

    const confirmDeleteHandler = () => {
        if (!selectedDeleteId) return;
        setIsDeleting(true);

        api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/penanggung-jawabs/${selectedDeleteId}`)
            .then(() => {
                toast.success("Data berhasil dihapus!");
                setShowModalDelete(false);
                setSelectedDeleteId(null);
                fetchItems();
            })
            .catch((err) => {
                console.error(err);
                toast.error(err?.response?.data?.message || "Gagal menghapus data!");
            })
            .finally(() => setIsDeleting(false));
    };

    return (
        <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-2xl">badge</span>
                        Penyelia & Penanggung Jawab Ruangan
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Kelola data Penyelia Laboratorium dan Penanggung Jawab Ruangan untuk Form Pemantauan Suhu & Kelembaban (F-6.3)
                    </p>
                </div>

                <button
                    onClick={handleOpenAdd}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tambah Data
                </button>
            </div>

            {/* Filter and Table Container */}
            <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Cari lab, penyelia, atau PJ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input input-bordered input-sm w-full pl-9"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-2 text-gray-400 text-[18px]">
                            search
                        </span>
                    </div>

                    <span className="text-xs text-gray-500 font-medium">
                        Total: <span className="font-bold text-gray-800">{items.length}</span> laboratorium
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-5xl mb-2 text-gray-300">badge</span>
                        <p className="text-sm font-medium">Belum ada data Penyelia & Penanggung Jawab</p>
                        <p className="text-xs text-gray-400 mt-1">Klik tombol &quot;Tambah Data&quot; untuk menambahkan data awal.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="table table-zebra w-full text-sm">
                            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                                <tr>
                                    <th className="w-12 text-center py-3">#</th>
                                    <th className="py-3">Laboratorium / Bagian</th>
                                    <th className="py-3">Penyelia Laboratorium</th>
                                    <th className="py-3">Penanggung Jawab Ruangan</th>
                                    <th className="py-3">Keterangan</th>
                                    <th className="w-24 text-center py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="hover">
                                        <td className="text-center font-medium text-gray-500">{idx + 1}</td>
                                        <td>
                                            <span className="font-bold text-gray-900 inline-flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-bpom-blue"></span>
                                                {item.laboratorium}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-gray-800">{item.penyelia}</div>
                                            <span className="text-[11px] text-gray-500">Penyelia Lab</span>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-gray-800">{item.penanggung_jawab}</div>
                                            <span className="text-[11px] text-gray-500">PJ Ruangan</span>
                                        </td>
                                        <td className="text-gray-500 text-xs">
                                            {item.keterangan || "-"}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 tooltip tooltip-top"
                                                    data-tip="Edit Data"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => openDeleteHandler(item.id)}
                                                    className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50 tooltip tooltip-top"
                                                    data-tip="Hapus Data"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form Tambah / Edit */}
            {showFormModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">
                                    {isEditing ? "edit" : "add_circle"}
                                </span>
                                {isEditing ? "Edit Penyelia & Penanggung Jawab" : "Tambah Penyelia & Penanggung Jawab"}
                            </h3>
                            <button
                                onClick={() => setShowFormModal(false)}
                                className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Laboratorium / Bagian <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Obat, Mikrobiologi, OTSK, Kosmetik, Pangan..."
                                    value={formLab}
                                    onChange={(e) => setFormLab(e.target.value)}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Penyelia Laboratorium <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Else Hanifa"
                                    value={formPenyelia}
                                    onChange={(e) => setFormPenyelia(e.target.value)}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Penanggung Jawab Ruangan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Lalu Satriawandi"
                                    value={formPj}
                                    onChange={(e) => setFormPj(e.target.value)}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Keterangan (Opsional)
                                </label>
                                <textarea
                                    placeholder="Catatan tambahan..."
                                    value={formKeterangan}
                                    onChange={(e) => setFormKeterangan(e.target.value)}
                                    className="textarea textarea-bordered textarea-sm w-full h-20"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => setShowFormModal(false)}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">save</span>
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Delete Confirmation */}
            {showModalDelete && (
                <ModalGeneral
                    open={showModalDelete}
                    onClose={() => setShowModalDelete(false)}
                >
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 text-red-600">
                            <span className="material-symbols-outlined">warning</span>
                            Konfirmasi Hapus Data
                        </h3>
                        <p className="text-sm text-gray-600">
                            Apakah Anda yakin ingin menghapus data Penyelia & Penanggung Jawab ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setShowModalDelete(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDeleteHandler}
                                className="btn btn-error btn-sm text-white flex items-center gap-1.5"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </ModalGeneral>
            )}
        </div>
    );
}
