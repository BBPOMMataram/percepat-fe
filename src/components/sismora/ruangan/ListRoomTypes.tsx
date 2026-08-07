"use client";

import { ModalGeneral } from "@/components/main/ModalGeneral";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ListRoomTypes() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [data, setData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    useEffect(() => {
        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/room-types?per_page=${perPage}&search=${search}`;
        api.get(endpoint)
            .then(({ data }) => {
                setData(data);
                setCurrentPage(data?.current_page);
            })
            .catch((err) => console.log(err));
    }, [perPage, search]);

    const fetchWithUrl = (url: string) => {
        api.get(url)
            .then(({ data }) => {
                setData(data);
                setCurrentPage(data?.current_page);
            })
            .catch((err) => console.log(err));
    };

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

        api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/room-types/${selectedDeleteId}`)
            .then(() => {
                toast.success("Tipe ruangan berhasil dihapus!");
                closeDeleteHandler();
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
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tampilkan</span>
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        className="select select-bordered w-fit"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="Cari tipe ruangan..."
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
                            <th className="px-4 py-3 text-left">Suhu Min</th>
                            <th className="px-4 py-3 text-left">Suhu Max</th>
                            <th className="px-4 py-3 text-left">Kelembaban Min</th>
                            <th className="px-4 py-3 text-left">Kelembaban Max</th>
                            <th className="px-4 py-3 text-left">Is Humidity</th>
                            <th className="px-4 py-3 text-left">Deskripsi</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center py-6 text-gray-500">
                                    Belum ada data tipe ruangan
                                </td>
                            </tr>
                        ) : (
                            data?.data?.map((item: any, index: number) => (
                                <tr key={item.id} className="border-t transition">
                                    <td className="px-4 py-3 font-medium">{rowNumber(index)}</td>
                                    <td className="px-4 py-3 font-semibold">{item.nama}</td>
                                    <td className="px-4 py-3">{item.temp_min}°C</td>
                                    <td className="px-4 py-3">{item.temp_max}°C</td>
                                    <td className="px-4 py-3">{item.hum_min}%</td>
                                    <td className="px-4 py-3">{item.hum_max}%</td>
                                    <td className="px-4 py-3">
                                        <span className={`badge ${item.is_humidity ? "badge-success" : "badge-ghost"}`}>
                                            {item.is_humidity ? "Ya" : "Tidak"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px] truncate">{item.deskripsi || "-"}</td>
                                    <td className="px-1 py-3 flex justify-center">
                                        <Link
                                            href={`/sismora/ruangan/room-types/form?id=${item.id}`}
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

                <div className="flex justify-between items-center m-6">
                    <span>
                        Menampilkan {data?.from} - {data?.to} dari {data?.total} data
                    </span>
                </div>
                <div className="flex justify-end items-center m-4 gap-4">
                    <div className="btn-group">
                        {data?.links?.map((link: any, index: number) => (
                            <button
                                key={index}
                                className={`btn ${link.active && "btn-active"} ${!link.url && "btn-disabled"} mr-1`}
                                onClick={() => {
                                    if (link.url) {
                                        const url = new URL(link.url, window.location.origin);
                                        url.searchParams.set("per_page", String(perPage));
                                        url.searchParams.set("search", search);
                                        fetchWithUrl(url.toString());
                                    }
                                }}
                            >
                                <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left" data-tip="Tambah Tipe Ruangan">
                <Link
                    href="/sismora/ruangan/room-types/form"
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
                            Apakah Anda yakin ingin menghapus tipe ruangan ini? <br />
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
