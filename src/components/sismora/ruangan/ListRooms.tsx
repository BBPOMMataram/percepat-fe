"use client";

import { ModalGeneral } from "@/components/main/ModalGeneral";
import api from "@/utils/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ListRooms() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const rowNumber = (index: number) => index + 1;

    const fetchRooms = useCallback(() => {
        setLoading(true);
        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms?search=${search}`;
        api.get(endpoint)
            .then(({ data }) => {
                setItems(Array.isArray(data) ? data : data?.data || []);
            })
            .catch((err) => {
                console.log(err);
                setItems([]);
            })
            .finally(() => setLoading(false));
    }, [search]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const filteredItems = items.filter((item: any) =>
        item.nama?.toLowerCase().includes(search.toLowerCase())
    );

    const openDeleteHandler = (id: number) => {
        setSelectedDeleteId(id);
        setShowModalDelete(true);
    };

    const closeDeleteHandler = () => {
        setSelectedDeleteId(null);
        setShowModalDelete(false);
    };

    const confirmDeleteHandler = () => {
        if (!selectedDeleteId) return;
        setIsDeleting(true);

        api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms/${selectedDeleteId}`)
            .then(() => {
                toast.success("Ruangan berhasil dihapus!");
                closeDeleteHandler();
                fetchRooms();
            })
            .catch((err) => {
                console.log(err);
                toast.error(err?.response?.data?.message || "Gagal menghapus data!");
            })
            .finally(() => setIsDeleting(false));
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Cari ruangan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>

            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Nama</th>
                            <th className="px-4 py-3 text-left">Tipe Ruangan</th>
                            <th className="px-4 py-3 text-left">Deskripsi</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500">
                                    <span className="loading loading-spinner loading-sm"></span> Memuat data...
                                </td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500">
                                    Belum ada data ruangan
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item: any, index: number) => (
                                <tr key={item.id} className="border-t transition">
                                    <td className="px-4 py-3 font-medium">{rowNumber(index)}</td>
                                    <td className="px-4 py-3 font-semibold">{item.nama}</td>
                                    <td className="px-4 py-3">
                                        <span className="badge badge-soft badge-primary">
                                            {item.room_type?.nama || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 max-w-[250px] truncate">{item.deskripsi || "-"}</td>
                                    <td className="px-1 py-3 flex justify-center">
                                        <Link
                                            href={`/sismora/ruangan/rooms/form?id=${item.id}`}
                                            className="btn btn-xs btn-ghost btn-warning tooltip tooltip-warning"
                                            data-tip="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[20px]!">edit</span>
                                        </Link>
                                        <span
                                            className="btn btn-xs btn-ghost btn-error tooltip tooltip-error"
                                            data-tip="Hapus"
                                            onClick={() => openDeleteHandler(item.id)}
                                        >
                                            <span className="material-symbols-outlined text-[20px]!">delete</span>
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left" data-tip="Tambah Ruangan">
                <Link
                    href="/sismora/ruangan/rooms/form"
                    className="btn btn-primary btn-floating btn-circle hover:scale-110 hover:rotate-90 transition-all duration-200 ease-in-out"
                >
                    <span className="material-symbols-outlined">add</span>
                </Link>
            </div>

            {showModalDelete && (
                <ModalGeneral open={showModalDelete} onClose={closeDeleteHandler}>
                    <div className="text-center">
                        <span className="material-symbols-outlined text-error text-5xl mb-3">warning</span>
                        <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
                        <p className="text-gray-500 mb-6">
                            Apakah Anda yakin ingin menghapus ruangan ini? <br />
                            <span className="text-error font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                        </p>
                        <div className="flex justify-center gap-3">
                            <button className="btn btn-ghost" onClick={closeDeleteHandler} disabled={isDeleting}>
                                Batal
                            </button>
                            <button className="btn btn-error" onClick={confirmDeleteHandler} disabled={isDeleting}>
                                {isDeleting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span> Menghapus...
                                    </>
                                ) : (
                                    "Ya, Hapus"
                                )}
                            </button>
                        </div>
                    </div>
                </ModalGeneral>
            )}
        </>
    );
}
