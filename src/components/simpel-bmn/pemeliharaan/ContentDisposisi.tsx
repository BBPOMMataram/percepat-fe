"use client";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import ModalDisposisiPemeliharaan from "./ModalDisposisiPemeliharaan";

export default function ContentDisposisi({ dataDisposisi, setDataDisposisi, handleOpenDetail, updateDataDisposisi, isLoading, setIsloading, statusFilter, setStatusFilter }: { dataDisposisi: any, setDataDisposisi: (data: any) => void, handleOpenDetail: (code: string) => void, updateDataDisposisi: (status?: string, perPage?: string) => void, isLoading: boolean, setIsloading: (loading: boolean) => void, statusFilter: string, setStatusFilter: (status: string) => void }) {
    const [showModalDiposisiPemeliharaan, setShowModalDiposisiPemeliharaan] = useState(false);
    const [code, setCode] = useState<string>("");
    const [perPage, setPerPage] = useState<string>("10")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [mergedDisposisiData, setMergedDisposisiData] = useState<any[]>([])

    // Use useMemo for stable disposisiData reference
    const disposisiData = useMemo(() => {
        return dataDisposisi?.data || dataDisposisi || [];
    }, [dataDisposisi]);

    // Track previous disposisiData to detect actual changes (not just reference changes)
    const prevDisposisiDataRef = useRef<string>("");

    // Determine if we have paginated data or array
    const hasPagination = dataDisposisi?.data !== undefined;

    // Calculate pagination
    const totalItems = Array.isArray(mergedDisposisiData) ? mergedDisposisiData.length : 0;
    const totalPageCount = Math.ceil(totalItems / parseInt(perPage));
    useEffect(() => {
        setTotalPages(totalPageCount);
    }, [totalPageCount]);

    // Sync perPage with server response (if available)
    useEffect(() => {
        if (hasPagination && dataDisposisi?.per_page) {
            setPerPage(String(dataDisposisi.per_page));
        }
    }, [hasPagination, dataDisposisi?.per_page]);

    // Calculate starting row number based on current page
    const getStartingNumber = () => {
        if (!hasPagination) {
            return 1;
        }
        if (!dataDisposisi?.current_page || dataDisposisi?.current_page === 1) {
            return 1;
        }
        return (dataDisposisi.current_page - 1) * parseInt(perPage) + 1;
    };

    // Handle per page change - requires refetch from API
    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);
        setCurrentPage(1); // Reset to first page
        updateDataDisposisi(statusFilter, newPerPage);
    };

    // Handle status filter change
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        setCurrentPage(1); // Reset to first page
        updateDataDisposisi(newStatus, perPage);
    };

    // Handle page change (client-side pagination)
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleOpenDisposisi = (code: string, pelapor: any) => {
        setCode(code);
        setShowModalDiposisiPemeliharaan(true);
    }

    const { user } = useSelector((state: RootState) => state.auth);

    // get user auth untuk pelapor - same logic as ContentPemeliharaanAll
    useEffect(() => {
        // Create a string representation of the data to detect actual changes
        const currentDataString = JSON.stringify(disposisiData);

        // Skip if data hasn't actually changed (prevents infinite loop)
        if (prevDisposisiDataRef.current === currentDataString) {
            return;
        }

        prevDisposisiDataRef.current = currentDataString;

        const sourceData = disposisiData;
        if (!Array.isArray(sourceData)) return;

        // ambil semua external_user_id pelapor
        const ids = [...new Set(
            sourceData
                .map((item: any) => item.pelapor?.external_user_id)
                .filter(Boolean)
        )];

        if (ids.length === 0) {
            setMergedDisposisiData(sourceData);
            return;
        }

        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authMap = Object.fromEntries(
                    res.data.map((u: any) => [u.id, u])
                );

                setMergedDisposisiData(
                    sourceData.map((item: any) => ({
                        ...item,
                        pelapor: item.pelapor
                            ? {
                                ...item.pelapor,
                                auth_user: authMap[item.pelapor.external_user_id] || null,
                            }
                            : null
                    }))
                );
            })
            .catch(() => setMergedDisposisiData(sourceData));
    }, [disposisiData]);

    // Get paginated data for display
    const getDisplayData = () => {
        // Filter berdasarkan status secara lokal untuk memastikan data yang tampil benar
        const source = mergedDisposisiData || [];
        const filtered = statusFilter === "all"
            ? source
            : source.filter((item: any) => item.status?.toLowerCase() === statusFilter.toLowerCase());

        if (hasPagination) {
            return filtered;
        }
        // Client-side pagination for array data
        const start = (currentPage - 1) * parseInt(perPage);
        const end = start + parseInt(perPage);
        return filtered.slice(start, end);
    };

    const displayData = getDisplayData();

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Disposisi</h2>
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
                        <option value="100">100</option>
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
            </div>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Kode</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Tipe Barang</th>
                            <th className="px-4 py-3 text-left">Pelapor</th>
                            <th className="px-4 py-3 text-left">Rating</th>
                            <th className="px-4 py-3 text-left">Tanggal Lapor</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    Belum ada data disposisi Anda
                                </td>
                            </tr>
                        ) : (
                            displayData.map((item: any, index: number) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{getStartingNumber() + index}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">
                                        {item.code}
                                    </td>
                                    <td className={`px-4 py-3 font-semibold ${item.status === 'open' ? 'text-bpom-green' : 'text-red-500'}`}>{item.status}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.tipe}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.pelapor?.auth_user?.call_name || item.pelapor?.auth_user?.name || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        {(() => {
                                            const rVal = item.rating?.rating ?? item.rating ?? null;
                                            const rComment = item.rating?.comment ?? item.rating_comment ?? null;
                                            if (!rVal) return '-';
                                            const rounded = Math.round(Number(rVal));
                                            return (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="text-yellow-400 font-semibold">
                                                        {Array.from({ length: 5 }, (_, i) => i < rounded ? '★' : '☆').join('')}
                                                    </div>
                                                    <div className="text-sm">{rounded}/5</div>
                                                    {rComment && (
                                                        <button className="btn btn-ghost btn-xs tooltip" data-tip={rComment}>i</button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>

                                    <td className="px-4 py-3 text-sm ">
                                        {dayjs(item.created_at).format("DD MMM YYYY")}
                                        <br />
                                        {dayjs(item.created_at).format("HH:mm:ss")}
                                    </td>
                                    <td className="px-4 py-3 flex flex-col gap-2 lg:flex-row">
                                        <button
                                            onClick={() => handleOpenDetail(item.code)}
                                            className="btn btn-sm btn-accent btn-soft tooltip tooltip-left" data-tip="Lihat Detail"
                                        >
                                            <span className="hidden lg:block">Detail</span>
                                            <span className="material-symbols-outlined">
                                                visibility
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleOpenDisposisi(item.code, item.disposisi_new_pemeliharaan[0]?.from_user?.auth_user)}
                                            className="btn btn-sm btn-primary btn-soft tooltip tooltip-left" data-tip="Lanjutkan Disposisi"
                                            disabled={item.disposisi_new_pemeliharaan?.at(-1)?.to_user?.external_user_id !== user?.id}
                                        >
                                            <span className="hidden lg:block">Lanjut</span>
                                            <span className="material-symbols-outlined">
                                                signature
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination controls (client-side for array, server-side for paginated) */}
                {hasPagination ? (
                    // Server-side pagination links
                    <div className="flex justify-end items-center m-4 gap-4">
                        <div className="btn-group">
                            {
                                dataDisposisi?.links?.map((link: any, index: number) =>
                                    <button
                                        key={index}
                                        className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                        onClick={() => {
                                            if (link.url) {
                                                setIsloading(true);
                                                const url = new URL(link.url);
                                                if (statusFilter !== "all") {
                                                    url.searchParams.set('status', statusFilter);
                                                }
                                                url.searchParams.set('per_page', perPage);
                                                api.get(url.toString())
                                                    .then(res => {
                                                        setIsloading(false);
                                                        setDataDisposisi(res.data);
                                                    })
                                            }
                                        }}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                    </button>
                                )
                            }
                        </div>
                    </div>
                ) : (
                    // Client-side pagination buttons
                    totalPages > 1 && (
                        <div className="flex justify-end items-center m-4 gap-4">
                            <div className="btn-group">
                                <button
                                    className={`btn ${currentPage === 1 && 'btn-disabled'} mr-1`}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    «
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={`btn ${currentPage === page && 'btn-active'} mr-1`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className={`btn ${currentPage === totalPages && 'btn-disabled'} mr-1`}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
            <ModalDisposisiPemeliharaan show={showModalDiposisiPemeliharaan} onClose={() => setShowModalDiposisiPemeliharaan(false)} code={code} updateDataDisposisi={(status) => updateDataDisposisi(status || statusFilter)} />
        </>
    )
}
