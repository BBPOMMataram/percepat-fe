import { showAlert } from "@/features/alertSlice";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

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
    const dispatch = useDispatch();

    // move ratedCodes here because we read/write it in effects below
    const [ratedCodes, setRatedCodes] = useState<Record<string, boolean>>({});

    // persisted rated codes & local ratings to reflect immediately across views
    const [localRatings, setLocalRatings] = useState<Record<string, { rating: number; comment?: string }>>(() => {
        try {
            const raw = localStorage.getItem('pemeliharaan_local_ratings');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('pemeliharaan_local_ratings', JSON.stringify(localRatings));
        } catch (e) { }
    }, [localRatings]);

    useEffect(() => {
        // load ratedCodes from localStorage as well
        try {
            const raw = localStorage.getItem('pemeliharaan_rated_codes');
            if (raw) setRatedCodes(JSON.parse(raw));
        } catch (e) { }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('pemeliharaan_rated_codes', JSON.stringify(ratedCodes));
        } catch (e) { }
    }, [ratedCodes]);

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

    // Rating modal state
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingCode, setRatingCode] = useState<string | null>(null);
    const [ratingValue, setRatingValue] = useState<number>(5);
    const [ratingComment, setRatingComment] = useState<string>("");
    const [submittingRating, setSubmittingRating] = useState(false);

    const handleOpenRating = (code: string) => {
        setRatingCode(code);
        setRatingValue(5);
        setRatingComment("");
        setShowRatingModal(true);
    };

    const handleCloseRating = () => {
        if (submittingRating) return;
        setShowRatingModal(false);
        setRatingCode(null);
    };

    const handleSubmitRating = async () => {
        if (!ratingCode) return;
        const code = ratingCode;
        const rating = Math.min(5, Math.max(1, Math.round(ratingValue)));

        setSubmittingRating(true);
        try {
            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN || ''}/api/rate-new-pemeliharaan`;
            const res = await api.post(url, { code, rating, comment: ratingComment || undefined });

            // mark as rated locally
            setRatedCodes(prev => ({ ...prev, [code]: true }));

            // fetch latest detail to obtain stored rating (in case backend returns it elsewhere)
            try {
                const detail = await api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-detail`, { code });
                const ratingData = detail?.data?.rating ?? (detail?.data?.rating_value ? { rating: detail.data.rating_value, comment: detail.data.rating_comment } : null);
                if (ratingData) {
                    setLocalRatings(prev => ({ ...prev, [code]: { rating: ratingData.rating ?? ratingData, comment: ratingData.comment } }));
                } else {
                    // fallback use what user just submitted
                    setLocalRatings(prev => ({ ...prev, [code]: { rating, comment: ratingComment || undefined } }));
                }
            } catch (e) {
                setLocalRatings(prev => ({ ...prev, [code]: { rating, comment: ratingComment || undefined } }));
            }

            // notify other components to refresh if they wish
            try {
                window.dispatchEvent(new CustomEvent('pemeliharaan:rating-updated', { detail: { code } }));
                // also request global refetch from server for lists
                window.dispatchEvent(new Event('pemeliharaan:refetch'));
            } catch (e) { }

            setShowRatingModal(false);
            setRatingCode(null);
            dispatch(showAlert({ type: 'success', message: 'Terima kasih, rating berhasil dikirim.', description: res?.data?.message || 'Terima kasih, rating berhasil dikirim.' }));
        } catch (error: any) {
            console.error('Submit rating error', error);
            const errMsg = error?.response?.data?.message || error?.message || 'Gagal mengirim rating. Silakan coba lagi.';
            dispatch(showAlert({ type: 'error', message: errMsg, description: errMsg }));
        } finally {
            setSubmittingRating(false);
        }
    };

    // helper to get displayed rating (prefer localRatings overlay)
    const getDisplayedRating = (code: string, item: any) => {
        if (localRatings[code]) return localRatings[code];
        const rVal = item.rating?.rating ?? item.rating ?? null;
        const rComment = item.rating?.comment ?? item.rating_comment ?? null;
        if (!rVal) return null;
        return { rating: Number(rVal), comment: rComment };
    }

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
                            <th className="px-4 py-3 text-left">Rating</th>
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
                                        {(() => {
                                            const dr = getDisplayedRating(item.code, item);
                                            if (!dr) return '-';
                                            const rounded = Math.round(Number(dr.rating));
                                            return (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="text-yellow-400 font-semibold">{Array.from({ length: 5 }, (_, i) => i < rounded ? '★' : '☆').join('')}</div>
                                                    <div className="text-sm">{rounded}/5</div>
                                                    {dr.comment && <button className="btn btn-ghost btn-xs tooltip" data-tip={dr.comment}>i</button>}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenDetail(item.code)}
                                                className="btn btn-sm btn-accent btn-soft"
                                            >
                                                <span className="hidden lg:block">Detail</span>
                                                <span className="material-symbols-outlined">
                                                    visibility
                                                </span>
                                            </button>

                                            {/* Show Rate button only for items reported by current user and not already rated locally */}
                                            {String(item.pelapor?.external_user_id) === String(currentUserId) && (
                                                <button
                                                    onClick={() => handleOpenRating(item.code)}
                                                    className="btn btn-sm btn-primary btn-soft"
                                                    disabled={Boolean(ratedCodes[item.code]) || Boolean(item.rating) || item.status !== 'closed'}
                                                    title={
                                                        (Boolean(ratedCodes[item.code]) || Boolean(item.rating))
                                                            ? 'Sudah dirating'
                                                            : item.status !== 'closed'
                                                                ? 'Pemeliharaan belum closed'
                                                                : 'Beri rating'
                                                    }
                                                >
                                                    <span className="hidden lg:block">Rate</span>
                                                    <span className="material-symbols-outlined">star</span>
                                                </button>
                                            )}
                                        </div>
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

            {/* Rating Modal */}
            {showRatingModal && ratingCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
                        <h3 className="text-lg font-semibold mb-2">Rating untuk {ratingCode}</h3>
                        <div className="flex items-center gap-2 mb-3">
                            {[1, 2, 3, 4, 5].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setRatingValue(v)}
                                    className={`btn btn-ghost btn-sm ${v <= ratingValue ? 'text-yellow-400' : 'text-gray-400'}`}
                                    aria-label={`Set rating ${v}`}
                                >
                                    {v <= ratingValue ? '★' : '☆'}
                                </button>
                            ))}
                            <div className="text-sm text-gray-600">{ratingValue} / 5</div>
                        </div>
                        <textarea
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder="Tambahkan komentar (opsional)"
                            className="textarea textarea-bordered w-full mb-3"
                            rows={3}
                        />

                        <div className="flex justify-end gap-2">
                            <button className="btn btn-sm btn-ghost" onClick={handleCloseRating} disabled={submittingRating}>Batal</button>
                            <button className="btn btn-sm btn-primary" onClick={handleSubmitRating} disabled={submittingRating}>
                                {submittingRating ? 'Mengirim...' : 'Kirim Rating'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

