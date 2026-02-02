import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

export default function ContentPemeliharaanAll({ dataAll, setDataAll, handleOpenDetail, isLoading, setIsloading }: { dataAll: any, setDataAll: (data: any) => void, handleOpenDetail: (code: string) => void, isLoading: boolean, setIsloading: (loading: boolean) => void }) {
    const [mergedDataAll, setMergedDataAll] = useState<any>([])
    const [perPage, setPerPage] = useState<string>("10")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [petugasFilter, setPetugasFilter] = useState<string>("all")
    const [listPetugasBmn, setListPetugasBmn] = useState<any[]>([])

    // Sync perPage with server response
    useEffect(() => {
        if (dataAll?.per_page) {
            setPerPage(String(dataAll.per_page));
        }
    }, [dataAll?.per_page]);

    // Fetch list of Petugas BMN for filter
    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-petugas-bmn`)
            .then((res) => {
                setListPetugasBmn(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    // Sync status Filter from URL when dataAll changes
    // Only update if URL has a different status param than current selection
    useEffect(() => {
        if (!dataAll?.links) return;

        // Find the first link with a valid URL (skip the "Previous" link which has url: null)
        const firstValidLink = dataAll.links.find((link: any) => link.url !== null);

        if (!firstValidLink) return;

        try {
            // Use a base so relative URLs parse correctly in all environments
            const url = new URL(firstValidLink.url, window.location.origin);
            const statusParam = url.searchParams.get("status");
            const petugasParam = url.searchParams.get("petugas_id");

            // Update status Filter if URL has a different status param
            if (statusParam !== null && statusParam !== statusFilter) {
                setStatusFilter(statusParam);
            }

            // Update petugas Filter if URL has a different petugas param
            if (petugasParam !== null && petugasParam !== petugasFilter) {
                setPetugasFilter(petugasParam);
            }
        } catch (e) {
            // URL parsing failed, keep current status/petugas Filter
        }
    }, [dataAll, statusFilter, petugasFilter]);

    // Calculate starting row number based on current page
    const getStartingNumber = () => {
        if (!dataAll?.current_page || dataAll?.current_page === 1) {
            return 1;
        }
        return (dataAll.current_page - 1) * parseInt(perPage) + 1;
    };

    // Handle per page change
    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);
        // Reset to first page with new per_page value
        const baseUrl = dataAll?.links?.[0]?.url?.split('?')[0] || `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-all`;

        setIsloading(true);
        let url = `${baseUrl}?page=1&per_page=${newPerPage}`;
        if (statusFilter !== "all") {
            url += `&status=${statusFilter}`;
        }
        if (petugasFilter !== "all") {
            url += `&petugas_id=${petugasFilter}`;
        }
        api.get(url)
            .then(res => {
                setDataAll(res.data);
                setIsloading(false);
            })
            .catch((err) => {
                console.log(err);
                setIsloading(false);
            });
    };

    // Handle status filter change
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        // Reset to first page with new status filter
        const baseUrl = dataAll?.links?.[0]?.url?.split('?')[0] || `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-all`;

        setIsloading(true);
        let url = `${baseUrl}?page=1&per_page=${perPage}`;
        if (newStatus !== "all") {
            url += `&status=${newStatus}`;
        }
        if (petugasFilter !== "all") {
            url += `&petugas_id=${petugasFilter}`;
        }
        api.get(url)
            .then(res => {
                setDataAll(res.data);
                setIsloading(false);
            })
            .catch((err) => {
                console.log(err);
                setIsloading(false);
            });
    };

    // Handle petugas filter change
    const handlePetugasFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPetugas = e.target.value;
        setPetugasFilter(newPetugas);
        // Reset to first page with new petugas filter
        const baseUrl = dataAll?.links?.[0]?.url?.split('?')[0] || `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-all`;

        setIsloading(true);
        let url = `${baseUrl}?page=1&per_page=${perPage}`;
        if (statusFilter !== "all") {
            url += `&status=${statusFilter}`;
        }
        if (newPetugas !== "all") {
            url += `&petugas_id=${newPetugas}`;
        }
        api.get(url)
            .then(res => {
                setDataAll(res.data);
                setIsloading(false);
            })
            .catch((err) => {
                console.log(err);
                setIsloading(false);
            });
    };

    // get user auth untuk pelapor dan petugas
    useEffect(() => {
        if (!Array.isArray(dataAll?.data)) return;

        // ambil semua external_user_id pelapor dan petugas
        const ids = [...new Set(
            dataAll?.data
                .map((item: any) => [
                    item.pelapor?.external_user_id,
                    item.petugas?.external_user_id
                ])
                .flat()
                .filter(Boolean)
        )];

        if (ids.length === 0) {
            setMergedDataAll(dataAll?.data);
            return;
        }

        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authMap = Object.fromEntries(
                    res.data.map((u: any) => [u.id, u])
                );

                setMergedDataAll(
                    dataAll?.data.map((item: any) => ({
                        ...item,
                        pelapor: item.pelapor
                            ? {
                                ...item.pelapor,
                                auth_user: authMap[item.pelapor.external_user_id] || null,
                            }
                            : null,
                        petugas: item.petugas
                            ? {
                                ...item.petugas,
                                auth_user: authMap[item.petugas.external_user_id] || null,
                            }
                            : null
                    }))
                );
            })
            .catch(() => setMergedDataAll(dataAll?.data));
    }, [dataAll]);

    // Apply persisted local ratings (and update when other components dispatch updates)
    useEffect(() => {
        const applyRatings = (ratings: Record<string, { rating: number; comment?: string }>) => {
            if (!ratings) return;
            setMergedDataAll((prev: any) => prev.map((item: any) => {
                const r = ratings[item.code];
                if (!r) return item;
                return { ...item, rating: { rating: r.rating, comment: r.comment } };
            }));
        };

        try {
            const raw = localStorage.getItem('pemeliharaan_local_ratings');
            if (raw) {
                const ratings = JSON.parse(raw);
                applyRatings(ratings);
            }
        } catch (e) {
            // ignore
        }

        const handler = (e: any) => {
            try {
                const stored = JSON.parse(localStorage.getItem('pemeliharaan_local_ratings') || '{}');
                const code = e?.detail?.code;
                if (code) {
                    setMergedDataAll((prev: any) => prev.map((item: any) => item.code === code && stored[code] ? { ...item, rating: { rating: stored[code].rating, comment: stored[code].comment } } : item));
                } else {
                    applyRatings(stored);
                }
            } catch (err) {
                // ignore
            }
        };

        window.addEventListener('pemeliharaan:rating-updated', handler as EventListener);
        return () => window.removeEventListener('pemeliharaan:rating-updated', handler as EventListener);
    }, []);


    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan</h2>
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
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Petugas</span>
                    <select
                        value={petugasFilter}
                        onChange={handlePetugasFilterChange}
                        className="select select-bordered w-fit"
                    >
                        <option value="all">Semua</option>
                        {listPetugasBmn?.length > 0 ? (
                            listPetugasBmn?.map((item: any) => (
                                <option key={item.user?.id} value={item.user?.id}>
                                    {item.user?.call_name || item.user?.name}
                                </option>
                            ))
                        ) : (
                            <option value="">Tidak ada data petugas</option>
                        )}
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
                            <th className="px-4 py-3 text-left">Tanggal Lapor</th>
                            <th className="px-4 py-3 text-left">Pelapor</th>
                            <th className="px-4 py-3 text-left">Petugas</th>
                            <th className="px-4 py-3 text-left">Rating</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mergedDataAll?.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    Belum ada data pemeliharaan
                                </td>
                            </tr>
                        ) : (
                            mergedDataAll?.map((item: any, index: number) => (
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
                                    <td className="px-4 py-3 text-sm ">
                                        {dayjs(item.created_at).format("DD MMM YYYY")}
                                        <br />
                                        {dayjs(item.created_at).format("HH:mm:ss")}
                                    </td>
                                    <td className={`px-4 py-3 uppercase`}>{item.pelapor?.auth_user?.call_name || item.pelapor?.auth_user?.name}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.petugas?.auth_user?.call_name || item.petugas?.auth_user?.name || '-'}</td>
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

                {/* Per page selector and links */}
                <div className="flex justify-end items-center m-4 gap-4">
                    <div className="btn-group">
                        {
                            dataAll?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            // Preserve per_page, status, and petugas parameters when navigating
                                            const url = new URL(link.url, window.location.origin);
                                            url.searchParams.set('per_page', perPage);
                                            if (statusFilter !== "all") {
                                                url.searchParams.set('status', statusFilter);
                                            }
                                            if (petugasFilter !== "all") {
                                                url.searchParams.set('petugas_id', petugasFilter);
                                            }
                                            setIsloading(true);
                                            api.get(url.toString())
                                                .then(res => {
                                                    setIsloading(false);
                                                    setDataAll(res.data);
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
            </div>
        </>
    )
}