import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

interface ContentPemeliharaanAndaProps {
    dataAll: any;
    mergedDataAll: any[];
    currentUserId: number | undefined;
    handleOpenDetail: (code: string) => void;
}

export default function ContentPemeliharaanAnda({ dataAll, mergedDataAll, currentUserId, handleOpenDetail }: ContentPemeliharaanAndaProps) {
    const [perPage, setPerPage] = useState<string>("10");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Sync perPage with dataAll response
    useEffect(() => {
        if (dataAll?.per_page) {
            setPerPage(String(dataAll.per_page));
        }
    }, [dataAll?.per_page]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [mergedDataAll, statusFilter]);

    // Set initial loading to false after data is loaded
    useEffect(() => {
        if (mergedDataAll && mergedDataAll.length > 0) {
            setIsInitialLoading(false);
        }
    }, [mergedDataAll]);

    // Memoized filtered data
    const filteredData = useMemo(() => {
        if (!Array.isArray(mergedDataAll) || mergedDataAll.length === 0) {
            return [];
        }

        let filtered = mergedDataAll.filter(
            (item: any) => String(item.pelapor?.external_user_id) === String(currentUserId)
        );

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((item: any) => item.status === statusFilter);
        }

        return filtered;
    }, [mergedDataAll, currentUserId, statusFilter]);

    // Calculate pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / parseInt(perPage));
    const startIndex = (currentPage - 1) * parseInt(perPage);
    const endIndex = startIndex + parseInt(perPage);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Handle per page change
    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPerPage(e.target.value);
        setCurrentPage(1);
    };

    // Handle status filter change
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push("...");
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push("...");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    // Show loading state
    if (isInitialLoading && (!mergedDataAll || mergedDataAll.length === 0)) {
        return (
            <>
                <h2 className="mb-10 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan Anda</h2>
                <div className="flex justify-center items-center p-10">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </>
        );
    }

    return (
        <>
            <h2 className="mb-10 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan Anda</h2>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tampilkan</span>
                    <select
                        value={perPage}
                        onChange={handlePerPageChange}
                        className="select select-bordered w-fit"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="select select-bordered w-fit"
                    >
                        <option value="all">Semua</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div className="ml-auto text-sm text-gray-600">
                    Menampilkan {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} data
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Kode</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Tipe Barang</th>
                            <th className="px-4 py-3 text-left">Tanggal Lapor</th>
                            <th className="px-4 py-3 text-left">Pelapor</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500">
                                    {statusFilter !== "all"
                                        ? `Tidak ada data pemeliharaan dengan status "${statusFilter}"`
                                        : "Belum ada data pemeliharaan"}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{startIndex + index + 1}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">
                                        {item.code}
                                    </td>
                                    <td className={`px-4 py-3 font-semibold ${item.status === 'open' ? 'text-bpom-green' : 'text-red-500'}`}>{item.status}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.tipe}</td>
                                    <td className="px-4 py-3 text-sm ">
                                        {dayjs(item.created_at).format("DD MMM YYYY")}
                                        <br />
                                        {dayjs(item.created_at).format("HH:mm:ss")}
                                    </td>
                                    <td className={`px-4 py-3 uppercase`}>{item.pelapor?.auth_user?.call_name || item.pelapor?.auth_user?.name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleOpenDetail(item.code)}
                                            className="btn btn-sm btn-accent btn-soft"
                                        >
                                            <span className="hidden lg:block">Detail</span>
                                            <span className="material-symbols-outlined">
                                                visibility
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center m-4 gap-2">
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>

                        {getPageNumbers().map((page, index) => (
                            <button
                                key={index}
                                className={`btn btn-sm ${page === currentPage ? 'btn-active' : ''} ${page === '...' ? 'btn-disabled' : 'btn-outline'}`}
                                onClick={() => typeof page === 'number' && handlePageChange(page)}
                                disabled={page === '...'}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

