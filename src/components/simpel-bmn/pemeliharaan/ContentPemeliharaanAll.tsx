import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

export default function ContentPemeliharaanAll({ dataAll, setDataAll, handleOpenDetail, isLoading, setIsloading }: { dataAll: any, setDataAll: (data: any) => void, handleOpenDetail: (code: string) => void, isLoading: boolean, setIsloading: (loading: boolean) => void }) {
    const [mergedDataAll, setMergedDataAll] = useState<any>([])
    const [perPage, setPerPage] = useState<string>("10")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [petugasFilter, setPetugasFilter] = useState<string>("all")
    const [listPetugasBmn, setListPetugasBmn] = useState<any[]>([])

    // ── Filter bulan ──────────────────────────────────────────────
    const [monthMode, setMonthMode] = useState<"none" | "single" | "range">("none")
    const [singleMonth, setSingleMonth] = useState<string>("")   // "YYYY-MM"
    const [monthFrom, setMonthFrom] = useState<string>("")
    const [monthTo, setMonthTo] = useState<string>("")
    // ─────────────────────────────────────────────────────────────

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
    useEffect(() => {
        if (!dataAll?.links) return;
        const firstValidLink = dataAll.links.find((link: any) => link.url !== null);
        if (!firstValidLink) return;
        try {
            const url = new URL(firstValidLink.url, window.location.origin);
            const statusParam = url.searchParams.get("status");
            const petugasParam = url.searchParams.get("petugas_id");
            if (statusParam !== null && statusParam !== statusFilter) setStatusFilter(statusParam);
            if (petugasParam !== null && petugasParam !== petugasFilter) setPetugasFilter(petugasParam);
        } catch (e) { }
    }, [dataAll, statusFilter, petugasFilter]);

    // ── Helper: tambahkan parameter bulan ke URL ──────────────────
    const appendMonthParams = (url: URL, mode: "none" | "single" | "range", sm: string, mf: string, mt: string) => {
        if (mode === "single" && sm) {
            url.searchParams.set("month", sm);
        } else if (mode === "range") {
            if (mf) url.searchParams.set("month_from", mf);
            if (mt) url.searchParams.set("month_to", mt);
        }
    };
    // ─────────────────────────────────────────────────────────────

    const getBaseUrl = () =>
        dataAll?.links?.[0]?.url?.split('?')[0] ||
        `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-all`;

    const buildUrl = (
        page: number,
        pp: string,
        status: string,
        petugas: string,
        mode: "none" | "single" | "range",
        sm: string,
        mf: string,
        mt: string
    ) => {
        const url = new URL(`${getBaseUrl()}?page=${page}&per_page=${pp}`, window.location.origin);
        if (status !== "all") url.searchParams.set("status", status);
        if (petugas !== "all") url.searchParams.set("petugas_id", petugas);
        appendMonthParams(url, mode, sm, mf, mt);
        return url.toString();
    };

    const fetchData = (url: string) => {
        setIsloading(true);
        api.get(url)
            .then(res => { setDataAll(res.data); setIsloading(false); })
            .catch(err => { console.log(err); setIsloading(false); });
    };

    const getStartingNumber = () => {
        if (!dataAll?.current_page || dataAll?.current_page === 1) return 1;
        return (dataAll.current_page - 1) * parseInt(perPage) + 1;
    };

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);
        fetchData(buildUrl(1, newPerPage, statusFilter, petugasFilter, monthMode, singleMonth, monthFrom, monthTo));
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        fetchData(buildUrl(1, perPage, newStatus, petugasFilter, monthMode, singleMonth, monthFrom, monthTo));
    };

    const handlePetugasFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPetugas = e.target.value;
        setPetugasFilter(newPetugas);
        fetchData(buildUrl(1, perPage, statusFilter, newPetugas, monthMode, singleMonth, monthFrom, monthTo));
    };

    // ── Handler filter bulan ──────────────────────────────────────
    const handleMonthModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMode = e.target.value as "none" | "single" | "range";
        setMonthMode(newMode);
        // Reset nilai bulan saat mode berubah
        setSingleMonth("");
        setMonthFrom("");
        setMonthTo("");
        fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "none", "", "", ""));
    };

    const handleSingleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSingleMonth(val);
        if (val) fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "single", val, "", ""));
    };

    const handleMonthFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMonthFrom(val);
        if (val && monthTo) fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "range", "", val, monthTo));
    };

    const handleMonthToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMonthTo(val);
        if (monthFrom && val) fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "range", "", monthFrom, val));
    };
    // ─────────────────────────────────────────────────────────────

    // get user auth untuk pelapor dan petugas
    useEffect(() => {
        if (!Array.isArray(dataAll?.data)) return;
        const ids = [...new Set(
            dataAll?.data
                .map((item: any) => [item.pelapor?.external_user_id, item.petugas?.external_user_id])
                .flat()
                .filter(Boolean)
        )];
        if (ids.length === 0) { setMergedDataAll(dataAll?.data); return; }
        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authMap = Object.fromEntries(res.data.map((u: any) => [u.id, u]));
                setMergedDataAll(dataAll?.data.map((item: any) => ({
                    ...item,
                    pelapor: item.pelapor ? { ...item.pelapor, auth_user: authMap[item.pelapor.external_user_id] || null } : null,
                    petugas: item.petugas ? { ...item.petugas, auth_user: authMap[item.petugas.external_user_id] || null } : null
                })));
            })
            .catch(() => setMergedDataAll(dataAll?.data));
    }, [dataAll]);

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
            if (raw) applyRatings(JSON.parse(raw));
        } catch (e) { }

        const handler = (e: any) => {
            try {
                const stored = JSON.parse(localStorage.getItem('pemeliharaan_local_ratings') || '{}');
                const code = e?.detail?.code;
                if (code) {
                    setMergedDataAll((prev: any) => prev.map((item: any) =>
                        item.code === code && stored[code] ? { ...item, rating: { rating: stored[code].rating, comment: stored[code].comment } } : item
                    ));
                } else {
                    applyRatings(stored);
                }
            } catch (err) { }
        };
        window.addEventListener('pemeliharaan:rating-updated', handler as EventListener);
        return () => window.removeEventListener('pemeliharaan:rating-updated', handler as EventListener);
    }, []);

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">

                {/* Per page */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tampilkan</span>
                    <select value={perPage} onChange={handlePerPageChange} className="select select-bordered w-fit">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <select value={statusFilter} onChange={handleStatusFilterChange} className="select select-bordered w-fit">
                        <option value="all">Semua</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                {/* Petugas */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Petugas</span>
                    <select value={petugasFilter} onChange={handlePetugasFilterChange} className="select select-bordered w-fit">
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

                {/* ── Filter Bulan ── */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Bulan</span>
                    <select value={monthMode} onChange={handleMonthModeChange} className="select select-bordered w-fit">
                        <option value="none">Semua</option>
                        <option value="single">Bulan tertentu</option>
                        <option value="range">Range bulan</option>
                    </select>
                </div>

                {monthMode === "single" && (
                    <div className="flex items-center gap-2">
                        <input
                            type="month"
                            value={singleMonth}
                            onChange={handleSingleMonthChange}
                            className="input input-bordered w-fit"
                        />
                    </div>
                )}

                {monthMode === "range" && (
                    <div className="flex items-center gap-2">
                        <input
                            type="month"
                            value={monthFrom}
                            onChange={handleMonthFromChange}
                            className="input input-bordered w-fit"
                            placeholder="Dari"
                        />
                        <span className="text-sm text-gray-600">s/d</span>
                        <input
                            type="month"
                            value={monthTo}
                            onChange={handleMonthToChange}
                            className="input input-bordered w-fit"
                            placeholder="Sampai"
                            min={monthFrom || undefined}
                        />
                    </div>
                )}
                {/* ─────────────────── */}

            </div>

            {/* Tabel & Pagination tetap sama */}
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
                                <tr key={item.id} className="border-t transition">
                                    <td className="px-4 py-3 font-medium">{getStartingNumber() + index}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.code}</td>
                                    <td className={`px-4 py-3 font-semibold ${item.status === 'open' ? 'text-bpom-green' : 'text-red-500'}`}>{item.status}</td>
                                    <td className="px-4 py-3 uppercase">{item.tipe}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {dayjs(item.created_at).format("DD MMM YYYY")}<br />
                                        {dayjs(item.created_at).format("HH:mm:ss")}
                                    </td>
                                    <td className="px-4 py-3 uppercase">{item.pelapor?.auth_user?.call_name || item.pelapor?.auth_user?.name}</td>
                                    <td className="px-4 py-3 uppercase">{item.petugas?.auth_user?.call_name || item.petugas?.auth_user?.name || '-'}</td>
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
                                                    {rComment && <button className="btn btn-ghost btn-xs tooltip" data-tip={rComment}>i</button>}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleOpenDetail(item.code)} className="btn btn-sm btn-accent btn-soft">
                                            <span className="hidden lg:block">Detail</span>
                                            <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="flex justify-end items-center m-4 gap-4">
                    <div className="btn-group">
                        {dataAll?.links?.map((link: any, index: number) =>
                            <button
                                key={index}
                                className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                onClick={() => {
                                    if (link.url) {
                                        const url = new URL(link.url, window.location.origin);
                                        url.searchParams.set('per_page', perPage);
                                        if (statusFilter !== "all") url.searchParams.set('status', statusFilter);
                                        if (petugasFilter !== "all") url.searchParams.set('petugas_id', petugasFilter);
                                        appendMonthParams(url, monthMode, singleMonth, monthFrom, monthTo);
                                        fetchData(url.toString());
                                    }
                                }}
                            >
                                <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}