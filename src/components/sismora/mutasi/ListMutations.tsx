"use client";

import { ModalGeneral } from "@/components/main/ModalGeneral";
import api from "@/utils/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ListMutations() {
    const [items, setItems] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [perPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    const [showModalDelete, setShowModalDelete] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch rooms list for filter
    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms?per_page=1000`)
            .then(({ data }) => {
                const roomList = Array.isArray(data) ? data : data?.data || [];
                setRooms(roomList);
            })
            .catch((err) => console.log("Failed to fetch rooms:", err));
    }, []);

    // Helper untuk rentang tanggal dari string YYYY-MM
    const getMonthDateRange = (monthStr: string) => {
        if (!monthStr || !monthStr.includes("-")) return null;
        const [yStr, mStr] = monthStr.split("-");
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);
        const startDate = `${yStr}-${mStr.padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${yStr}-${mStr.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        return { startDate, endDate };
    };

    const fetchMutations = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (selectedRoom) params.append("room_id", selectedRoom);
        if (selectedMonth) {
            params.append("month", selectedMonth);
            const range = getMonthDateRange(selectedMonth);
            if (range) {
                params.append("start_date", range.startDate);
                params.append("end_date", range.endDate);
            }
        }
        params.append("page", currentPage.toString());
        params.append("per_page", perPage.toString());

        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations?${params.toString()}`;
        api.get(endpoint)
            .then(({ data }) => {
                const rawList = Array.isArray(data) ? data : data?.data || [];
                // Proteksi ganda di frontend jika respon backend masih mengembalikan record di luar bulan yang dipilih
                const list = selectedMonth
                    ? rawList.filter((m: any) => !m.tanggal || m.tanggal.startsWith(selectedMonth))
                    : rawList;
                setItems(list);
                const meta = data?.meta || data;
                setLastPage(meta?.last_page || 1);
                setTotal(selectedMonth ? list.length : (meta?.total ?? list.length));
                setFrom(meta?.from ?? (list.length > 0 ? (currentPage - 1) * perPage + 1 : 0));
                setTo(meta?.to ?? (list.length > 0 ? (currentPage - 1) * perPage + list.length : 0));
            })
            .catch((err) => {
                console.log(err);
                setItems([]);
                setTotal(0);
                setFrom(0);
                setTo(0);
            })
            .finally(() => setLoading(false));
    }, [search, selectedRoom, selectedMonth, currentPage, perPage]);

    useEffect(() => {
        fetchMutations();
    }, [fetchMutations]);

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (lastPage <= 7) {
            for (let i = 1; i <= lastPage; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push("...");
                pages.push(lastPage);
            } else if (currentPage >= lastPage - 3) {
                pages.push(1);
                pages.push("...");
                for (let i = lastPage - 4; i <= lastPage; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push("...");
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push("...");
                pages.push(lastPage);
            }
        }
        return pages;
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

        api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations/${selectedDeleteId}`)
            .then(() => {
                toast.success("Mutasi berhasil dihapus!");
                closeDeleteHandler();
                fetchMutations();
            })
            .catch((err) => {
                console.log(err);
                toast.error(err?.response?.data?.message || "Gagal menghapus data!");
            })
            .finally(() => setIsDeleting(false));
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Cari mutasi..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="input input-bordered w-full sm:w-60"
                />

                <select
                    value={selectedRoom}
                    onChange={(e) => {
                        setSelectedRoom(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="select select-bordered w-full sm:w-56"
                >
                    <option value="">Semua Ruangan</option>
                    {rooms.map((room: any) => (
                        <option key={room.id} value={room.id}>
                            {room.nama} {room.room_type?.nama ? `(${room.room_type.nama})` : ""}
                        </option>
                    ))}
                </select>

                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="input input-bordered w-full sm:w-48"
                    title="Filter Bulan"
                />

                {(search || selectedRoom || selectedMonth) && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch("");
                            setSelectedRoom("");
                            setSelectedMonth("");
                            setCurrentPage(1);
                        }}
                        className="btn btn-ghost btn-sm text-gray-500 hover:text-gray-800 self-start sm:self-center"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Reset
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra min-w-[700px]">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Ruangan</th>
                            <th className="px-4 py-3 text-left">Tanggal</th>
                            <th className="px-4 py-3 text-left">Jam</th>
                            <th className="px-4 py-3 text-left">Temperatur</th>
                            <th className="px-4 py-3 text-left">Kelembaban</th>
                            <th className="px-4 py-3 text-left">Deskripsi</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    <span className="loading loading-spinner loading-sm"></span> Memuat data...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    Belum ada data mutasi
                                </td>
                            </tr>
                        ) : (
                            items.map((item: any, index: number) => (
                                <tr key={item.id} className="border-t transition">
                                    <td className="px-4 py-3 font-medium">{rowNumber(index)}</td>
                                    <td className="px-4 py-3 font-semibold">
                                        <span className="badge badge-soft badge-primary">
                                            {item.room?.nama || item.room_id || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{item.tanggal || "-"}</td>
                                    <td className="px-4 py-3">{item.jam || "-"}</td>
                                    <td className="px-4 py-3">{item.temperature != null ? `${item.temperature}°C` : "-"}</td>
                                    <td className="px-4 py-3">{item.humidity != null ? `${item.humidity}%` : "-"}</td>
                                    <td className="px-4 py-3 max-w-[200px] truncate">{item.deskripsi || "-"}</td>
                                    <td className="px-1 py-3 flex justify-center">
                                        <Link
                                            href={`/sismora/mutasi/form?id=${item.id}`}
                                            className="btn btn-xs btn-ghost btn-warning tooltip tooltip-warning"
                                            data-tip="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[20px]!">edit</span>
                                        </Link>
                                        <Link
                                            href={`/sismora/mutasi/laporan?mutasi_id=${item.id}`}
                                            className="btn btn-xs btn-ghost btn-info tooltip tooltip-info"
                                            data-tip="Laporan"
                                        >
                                            <span className="material-symbols-outlined text-[20px]!">description</span>
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

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
                <span className="text-sm text-gray-500">
                    Menampilkan {from} - {to} dari {total} data
                </span>

                {lastPage > 1 && (
                    <div className="join">
                        <button
                            type="button"
                            className="join-item btn btn-sm"
                            disabled={currentPage <= 1 || loading}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                            «
                        </button>
                        {getPageNumbers().map((p, idx) =>
                            p === "..." ? (
                                <button key={`ellipsis-${idx}`} className="join-item btn btn-sm btn-disabled" disabled>
                                    ...
                                </button>
                            ) : (
                                <button
                                    key={p}
                                    type="button"
                                    className={`join-item btn btn-sm ${currentPage === p ? "btn-primary" : "btn-ghost"}`}
                                    onClick={() => setCurrentPage(Number(p))}
                                    disabled={loading}
                                >
                                    {p}
                                </button>
                            )
                        )}
                        <button
                            type="button"
                            className="join-item btn btn-sm"
                            disabled={currentPage >= lastPage || loading}
                            onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                        >
                            »
                        </button>
                    </div>
                )}
            </div>

            <div className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left" data-tip="Tambah Mutasi">
                <Link
                    href="/sismora/mutasi/form"
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
                            Apakah Anda yakin ingin menghapus mutasi ini? <br />
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
