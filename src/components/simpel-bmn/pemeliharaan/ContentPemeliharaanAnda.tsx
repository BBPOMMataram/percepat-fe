import { showAlert } from "@/features/alertSlice";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

interface ContentPemeliharaanAndaProps {
    dataAnda: any; // Renamed from dataAll to dataAnda for clarity
    setDataAnda: (data: any) => void; // Renamed from setDataAll to setDataAnda for clarity
    mergedDataAll?: any[];
    currentUserId: number | undefined;
    handleOpenDetail: (code: string) => void;
    isLoading: boolean;
    setIsloading: (loading: boolean) => void;
    statusFilter: string; // New prop
    setStatusFilter: (status: string) => void; // New prop
}

export default function ContentPemeliharaanAnda({ dataAnda, setDataAnda, currentUserId, handleOpenDetail, isLoading, setIsloading, statusFilter, setStatusFilter }: ContentPemeliharaanAndaProps) {
    const [perPage, setPerPage] = useState<string>("10");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [localMergedData, setLocalMergedData] = useState<any[]>([]);
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

    // Sync perPage and currentPage with dataAnda response
    useEffect(() => {
        if (dataAnda?.per_page) {
            setPerPage(String(dataAnda.per_page));
        }
        if (dataAnda?.current_page) {
            setCurrentPage(dataAnda.current_page);
        }
    }, [dataAnda?.per_page, dataAnda?.current_page]);

    // Internal Merge Logic (Consistent with ContentPemeliharaanAll)
    useEffect(() => {
        const sourceData = dataAnda?.data || dataAnda;
        if (!Array.isArray(sourceData)) return;

        const ids = [...new Set(
            sourceData
                .map((item: any) => item.pelapor?.external_user_id)
                .filter(Boolean)
        )];

        if (ids.length === 0) {
            setLocalMergedData(sourceData);
            return;
        }

        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authMap = Object.fromEntries(
                    res.data.map((u: any) => [u.id, u])
                );

                setLocalMergedData(
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
            .catch(() => setLocalMergedData(sourceData));
    }, [dataAnda]);

    // Tentukan apakah data dari server terpaginasi atau hanya array mentah
    const hasPagination = dataAnda?.data !== undefined;

    // Data yang akan ditampilkan dengan filter status dan slicing (jika client-side)
    const displayData = useMemo(() => {
        let source = localMergedData || [];

        // Filter status lokal (sebagai cadangan jika backend tidak memfilter)
        if (statusFilter !== "all") {
            source = source.filter(item => item.status?.toLowerCase() === statusFilter.toLowerCase());
        }

        if (hasPagination) return source;

        // Client-side pagination logic
        const start = (currentPage - 1) * parseInt(perPage);
        return source.slice(start, start + parseInt(perPage));
    }, [localMergedData, hasPagination, currentPage, perPage, statusFilter]);

    // Kalkulasi total items dan pages
    const totalItems = hasPagination ? (dataAnda?.total ?? 0) : (localMergedData?.length || 0);
    const totalPages = hasPagination ? (dataAnda?.last_page || 1) : Math.ceil(totalItems / parseInt(perPage));

    const getStartingNumber = () => {
        const page = hasPagination ? (dataAnda?.current_page || 1) : currentPage;
        return (page - 1) * parseInt(perPage) + 1;
    };

    // Handle per page change
    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);
        setCurrentPage(1);

        setIsloading(true);
        const firstValidLink = dataAnda?.links?.find((l: any) => l.url !== null);
        const baseUrl = firstValidLink?.url?.split('?')[0] || `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-by-user`;

        const url = new URL(baseUrl);
        url.searchParams.set('page', '1');
        url.searchParams.set('per_page', newPerPage);
        if (statusFilter !== "all") {
            url.searchParams.set('status', statusFilter);
        }
        api.get(url.toString())
            .then(res => {
                setDataAnda(res.data);
                setIsloading(false);
            })
            .catch(() => setIsloading(false));
    };

    // Handle status filter change
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        setCurrentPage(1);

        setIsloading(true);
        const firstValidLink = dataAnda?.links?.find((l: any) => l.url !== null);
        const baseUrl = firstValidLink?.url?.split('?')[0] || `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-by-user`;

        const url = new URL(baseUrl);
        url.searchParams.set('page', '1');
        url.searchParams.set('per_page', perPage);
        if (newStatus !== "all") {
            url.searchParams.set('status', newStatus);
        }

        api.get(url.toString())
            .then(res => {
                setDataAnda(res.data);
                setIsloading(false);
            })
            .catch(() => setIsloading(false));
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;

        setIsloading(true);
        const firstValidLink = dataAnda?.links?.find((l: any) => l.url !== null);
        const baseUrl = firstValidLink?.url?.split('?')[0] || `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-by-user`;

        const url = new URL(baseUrl);
        url.searchParams.set('page', String(page));
        url.searchParams.set('per_page', perPage);
        if (statusFilter !== "all") url.searchParams.set('status', statusFilter);

        api.get(url.toString()).then(res => {
            setDataAnda(res.data);
            setIsloading(false);
        }).catch(() => setIsloading(false));
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

    return (
        <>
            <h2 className="mb-10 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan Anda</h2>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 mb-1 bg-base-200 rounded-xl border border-base-300">
                {/* Tampilkan */}
                <div className="join">
                    <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border border-base-300">
                        Tampilkan
                    </span>
                    <select value={perPage} onChange={handlePerPageChange} className="join-item select select-bordered select-sm w-16 text-xs">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <div className="w-px h-5 bg-base-300" />
                {/* Status */}
                <div className="join">
                    <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border border-base-300">
                        Status
                    </span>
                    <select value={statusFilter} onChange={handleStatusFilterChange} className="join-item select select-bordered select-sm w-24 text-xs">
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
                            <th className="px-4 py-3 text-left">Kode Barang / NUP</th>
                            <th className="px-4 py-3 text-left">Tanggal Lapor</th>
                            <th className="px-4 py-3 text-left">Pelapor</th>
                            <th className="px-4 py-3 text-left">Rating</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    {statusFilter !== "all"
                                        ? `Tidak ada data pemeliharaan dengan status "${statusFilter}"`
                                        : "Belum ada data pemeliharaan"}
                                </td>
                            </tr>
                        ) : (
                            displayData.map((item, index) => (
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
                                    <td className="px-4 py-3 text-sm">
                                        {item.barang_new_pemeliharaan?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {item.barang_new_pemeliharaan.map((b: any) => (
                                                    b.barang ? (
                                                        <span key={b.id} className="badge badge-ghost badge-sm font-mono whitespace-nowrap">
                                                            {b.barang.kode} / {b.barang.nup}
                                                        </span>
                                                    ) : null
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
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
                {hasPagination ? (
                    <div className="flex justify-end items-center m-4 gap-4">
                        <div className="btn-group">
                            {
                                dataAnda?.links?.map((link: any, index: number) =>
                                    <button
                                        key={index}
                                        className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                        onClick={() => {
                                            if (link.url) {
                                                const url = new URL(link.url, window.location.origin);
                                                url.searchParams.set('per_page', perPage);
                                                if (statusFilter !== "all") {
                                                    url.searchParams.set('status', statusFilter);
                                                }
                                                setIsloading(true);
                                                api.get(url.toString())
                                                    .then(res => {
                                                        setDataAnda(res.data);
                                                        setIsloading(false);
                                                    })
                                                    .catch(() => setIsloading(false));
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
                    totalPages > 1 && (
                        <div className="flex justify-end items-center m-4 gap-4">
                            <div className="btn-group">
                                <button
                                    className={`btn ${currentPage === 1 && 'btn-disabled'} mr-1`}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    «
                                </button>
                                {getPageNumbers().map((page, index) => (
                                    <button
                                        key={index}
                                        className={`btn ${page === currentPage ? 'btn-active' : ''} ${page === '...' ? 'btn-disabled' : ''} mr-1`}
                                        onClick={() => typeof page === 'number' && handlePageChange(page)}
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
