import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ContentPemeliharaanAll({
    dataAll,
    mergedDataAll,       // ← terima dari parent, sudah include auth_user
    setDataAll,
    handleOpenDetail,
    isLoading,
    setIsloading
}: {
    dataAll: any,
    mergedDataAll: any[], // ← prop baru
    setDataAll: (data: any) => void,
    handleOpenDetail: (code: string) => void,
    isLoading: boolean,
    setIsloading: (loading: boolean) => void
}) {
    // Tidak ada lagi state mergedDataAll lokal — pakai prop dari parent
    const [localMerged, setLocalMerged] = useState<any[]>([])
    const [perPage, setPerPage] = useState<string>("10")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [petugasFilter, setPetugasFilter] = useState<string>("all")
    const [listPetugasBmn, setListPetugasBmn] = useState<any[]>([])

    const [monthMode, setMonthMode] = useState<"none" | "single" | "range">("none")
    const [singleMonth, setSingleMonth] = useState<string>("")
    const [monthFrom, setMonthFrom] = useState<string>("")
    const [monthTo, setMonthTo] = useState<string>("")

    const [searchKodeBarang, setSearchKodeBarang] = useState<string>("")
    const [searchKodeBarangInput, setSearchKodeBarangInput] = useState<string>("")

    // ── Sync localMerged dari prop parent (sudah di-merge) ───────────────────
    useEffect(() => {
        setLocalMerged(mergedDataAll ?? []);
    }, [mergedDataAll]);

    // ── Terapkan rating lokal dari localStorage ───────────────────────────────
    useEffect(() => {
        const applyRatings = (ratings: Record<string, { rating: number; comment?: string }>) => {
            if (!ratings) return;
            setLocalMerged((prev: any) => prev.map((item: any) => {
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
                    setLocalMerged((prev: any) => prev.map((item: any) =>
                        item.code === code && stored[code]
                            ? { ...item, rating: { rating: stored[code].rating, comment: stored[code].comment } }
                            : item
                    ));
                } else {
                    applyRatings(stored);
                }
            } catch (err) { }
        };
        window.addEventListener('pemeliharaan:rating-updated', handler as EventListener);
        return () => window.removeEventListener('pemeliharaan:rating-updated', handler as EventListener);
    }, []);

    // Sync perPage with server response
    useEffect(() => {
        if (dataAll?.per_page) setPerPage(String(dataAll.per_page));
    }, [dataAll?.per_page]);

    // Fetch list Petugas BMN untuk filter dropdown
    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-petugas-bmn`)
            .then((res) => setListPetugasBmn(res.data))
            .catch((err) => console.log(err));
    }, []);

    const appendMonthParams = (url: URL, mode: "none" | "single" | "range", sm: string, mf: string, mt: string) => {
        if (mode === "single" && sm) url.searchParams.set("month", sm);
        else if (mode === "range") {
            if (mf) url.searchParams.set("month_from", mf);
            if (mt) url.searchParams.set("month_to", mt);
        }
    };

    const getBaseUrl = () =>
        dataAll?.links?.[0]?.url?.split('?')[0] ||
        `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-all`;

    const buildUrl = (
        page: number, pp: string, status: string, petugas: string,
        mode: "none" | "single" | "range", sm: string, mf: string, mt: string, kodeBarang: string
    ) => {
        const url = new URL(`${getBaseUrl()}?page=${page}&per_page=${pp}`, window.location.origin);
        if (status !== "all") url.searchParams.set("status", status);
        if (petugas !== "all") url.searchParams.set("petugas_id", petugas);
        if (kodeBarang.trim()) url.searchParams.set("kode_barang", kodeBarang.trim());
        appendMonthParams(url, mode, sm, mf, mt);
        return url.toString();
    };

    // fetchData: hanya update dataAll — merge dilakukan di parent via useEffect watch dataAll
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
        const v = e.target.value; setPerPage(v);
        fetchData(buildUrl(1, v, statusFilter, petugasFilter, monthMode, singleMonth, monthFrom, monthTo, searchKodeBarang));
    };
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value; setStatusFilter(v);
        fetchData(buildUrl(1, perPage, v, petugasFilter, monthMode, singleMonth, monthFrom, monthTo, searchKodeBarang));
    };
    const handlePetugasFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value; setPetugasFilter(v);
        fetchData(buildUrl(1, perPage, statusFilter, v, monthMode, singleMonth, monthFrom, monthTo, searchKodeBarang));
    };
    const handleMonthModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value as "none" | "single" | "range";
        setMonthMode(v); setSingleMonth(""); setMonthFrom(""); setMonthTo("");
        fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "none", "", "", "", searchKodeBarang));
    };
    const handleSingleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value; setSingleMonth(v);
        if (v) fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "single", v, "", "", searchKodeBarang));
    };
    const handleMonthFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value; setMonthFrom(v);
        if (v && monthTo) fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "range", "", v, monthTo, searchKodeBarang));
    };
    const handleMonthToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value; setMonthTo(v);
        if (monthFrom && v) fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, "range", "", monthFrom, v, searchKodeBarang));
    };
    const handleSearchKodeBarangChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchKodeBarangInput(e.target.value);
    const handleSearchKodeBarangSubmit = () => {
        setSearchKodeBarang(searchKodeBarangInput);
        fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, monthMode, singleMonth, monthFrom, monthTo, searchKodeBarangInput));
    };
    const handleSearchKodeBarangKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSearchKodeBarangSubmit();
    };
    const handleClearSearchKodeBarang = () => {
        setSearchKodeBarangInput(""); setSearchKodeBarang("");
        fetchData(buildUrl(1, perPage, statusFilter, petugasFilter, monthMode, singleMonth, monthFrom, monthTo, ""));
    };

    const handleDownloadPdf = async () => {
        setIsloading(true);
        try {
            const url = new URL(getBaseUrl(), window.location.origin);
            url.searchParams.set("page", "1");
            url.searchParams.set("per_page", "9999");
            if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
            if (petugasFilter !== "all") url.searchParams.set("petugas_id", petugasFilter);
            appendMonthParams(url, monthMode, singleMonth, monthFrom, monthTo);
            if (searchKodeBarang.trim()) url.searchParams.set("kode_barang", searchKodeBarang.trim());

            const res = await api.get(url.toString());
            const rawData: any[] = res.data?.data ?? [];

            // get-user-batch hanya untuk keperluan PDF (data lengkap per_page=9999)
            const ids = [...new Set(
                rawData.flatMap((item: any) => [
                    item.pelapor?.external_user_id,
                    item.petugas?.external_user_id,
                ]).filter(Boolean)
            )];
            let authMap: Record<string, any> = {};
            if (ids.length > 0) {
                const authRes = await api.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids }
                );
                authMap = Object.fromEntries(authRes.data.map((u: any) => [u.id, u]));
            }

            const mergedRows = rawData.map((item: any) => ({
                ...item,
                pelapor_name: authMap[item.pelapor?.external_user_id]?.call_name || authMap[item.pelapor?.external_user_id]?.name || "-",
                petugas_name: authMap[item.petugas?.external_user_id]?.call_name || authMap[item.petugas?.external_user_id]?.name || "-",
            }));

            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            doc.setFontSize(14); doc.setFont("helvetica", "bold");
            doc.text("Laporan Data Pemeliharaan", 14, 15);
            doc.setFontSize(9); doc.setFont("helvetica", "normal");
            const filterInfo = [
                `Status: ${statusFilter === "all" ? "Semua" : statusFilter}`,
                `Petugas: ${petugasFilter === "all" ? "Semua" : listPetugasBmn.find((p) => String(p.user?.id) === petugasFilter)?.user?.call_name || petugasFilter}`,
                monthMode === "single" && singleMonth ? `Bulan: ${singleMonth}` : "",
                monthMode === "range" && monthFrom && monthTo ? `Range: ${monthFrom} s/d ${monthTo}` : "",
                `Dicetak: ${dayjs().format("DD MMM YYYY HH:mm")}`,
                `Kode Barang: ${searchKodeBarang.trim() || "Semua"}`,
            ].filter(Boolean).join("   |   ");
            doc.text(filterInfo, 14, 22);

            autoTable(doc, {
                startY: 27,
                head: [["#", "Kode", "Status", "Tipe", "Kode Barang / NUP", "Tanggal Lapor", "Pelapor", "Petugas", "Rating"]],
                body: mergedRows.map((item: any, idx: number) => {
                    const rVal = item.rating?.rating ?? item.rating ?? null;
                    const kodeBarang = item.barang_new_pemeliharaan?.filter((b: any) => b.barang)?.map((b: any) => `${b.barang.kode} / ${b.barang.nup}`).join("\n") || "-";
                    return [idx + 1, item.code, item.status, (item.tipe ?? "").toUpperCase(), kodeBarang, dayjs(item.created_at).format("DD MMM YYYY HH:mm"), item.pelapor_name.toUpperCase(), item.petugas_name.toUpperCase(), rVal ? `${Math.round(Number(rVal))}/5` : "-"];
                }),
                styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: { 0: { halign: "center", cellWidth: 8 }, 1: { cellWidth: 20 }, 2: { halign: "center", cellWidth: 18 }, 3: { halign: "center", cellWidth: 18 }, 4: { cellWidth: 45 }, 5: { halign: "center", cellWidth: 35 }, 8: { halign: "center", cellWidth: 16 } },
            });

            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i); doc.setFontSize(8); doc.setFont("helvetica", "normal");
                doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
            }

            let fileName = "data-pemeliharaan";
            if (monthMode === "single" && singleMonth) fileName += `_${singleMonth}`;
            if (monthMode === "range" && monthFrom && monthTo) fileName += `_${monthFrom}_sd_${monthTo}`;
            if (statusFilter !== "all") fileName += `_${statusFilter}`;
            fileName += ".pdf";
            doc.save(fileName);
        } catch (err) {
            console.error("Gagal generate PDF:", err);
        } finally {
            setIsloading(false);
        }
    };

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan</h2>
            <div className="flex flex-wrap items-center gap-1.5 p-2 mb-1 bg-base-200 rounded-xl border border-base-300">
                <div className="join">
                    <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border border-base-300">Tampilkan</span>
                    <select value={perPage} onChange={handlePerPageChange} className="join-item select select-bordered select-sm w-16 text-xs">
                        <option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option>
                    </select>
                </div>
                <div className="w-px h-5 bg-base-300" />
                <div className="join">
                    <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border border-base-300">Status</span>
                    <select value={statusFilter} onChange={handleStatusFilterChange} className="join-item select select-bordered select-sm w-24 text-xs">
                        <option value="all">Semua</option><option value="open">Open</option><option value="closed">Closed</option>
                    </select>
                </div>
                <div className="w-px h-5 bg-base-300" />
                <div className="join">
                    <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border border-base-300">Petugas</span>
                    <select value={petugasFilter} onChange={handlePetugasFilterChange} className="join-item select select-bordered select-sm w-28 text-xs">
                        <option value="all">Semua</option>
                        {listPetugasBmn?.map((item: any) => (
                            <option key={item.user?.id} value={item.user?.id}>{item.user?.call_name || item.user?.name}</option>
                        ))}
                    </select>
                </div>
                <div className="w-px h-5 bg-base-300" />
                <div className="join">
                    <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border border-base-300">Bulan</span>
                    <select value={monthMode} onChange={handleMonthModeChange} className="join-item select select-bordered select-sm w-24 text-xs">
                        <option value="none">Semua</option><option value="single">Tertentu</option><option value="range">Range</option>
                    </select>
                    {monthMode === "single" && <input type="month" value={singleMonth} onChange={handleSingleMonthChange} className="join-item input input-bordered input-sm text-xs w-36" />}
                    {monthMode === "range" && (
                        <>
                            <input type="month" value={monthFrom} onChange={handleMonthFromChange} className="join-item input input-bordered input-sm text-xs w-32" />
                            <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border-y border-base-300">s/d</span>
                            <input type="month" value={monthTo} onChange={handleMonthToChange} min={monthFrom || undefined} className="join-item input input-bordered input-sm text-xs w-32" />
                        </>
                    )}
                </div>
                <div className="w-px h-5 bg-base-300" />
                <div className="join">
                    <span className="join-item flex items-center px-2 text-xs text-gray-500 bg-base-100 border border-base-300">Kode Barang</span>
                    <input type="text" value={searchKodeBarangInput} onChange={handleSearchKodeBarangChange} onKeyDown={handleSearchKodeBarangKeyDown} placeholder="cari..." className="join-item input input-bordered input-sm text-xs w-32" />
                    {searchKodeBarangInput && (
                        <button onClick={handleClearSearchKodeBarang} className="join-item btn btn-sm btn-ghost px-2">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                    <button onClick={handleSearchKodeBarangSubmit} className="join-item btn btn-sm btn-ghost px-2">
                        <span className="material-symbols-outlined text-sm">search</span>
                    </button>
                </div>
                <button onClick={handleDownloadPdf} disabled={isLoading} className="btn btn-sm btn-error btn-soft gap-1 ml-auto">
                    {isLoading ? <span className="loading loading-spinner loading-xs" /> : <span className="material-symbols-outlined text-sm">picture_as_pdf</span>}
                    PDF
                </button>
            </div>

            {(statusFilter !== "all" || petugasFilter !== "all" || monthMode !== "none" || searchKodeBarang) && (
                <div className="flex flex-wrap gap-1.5 mb-3 px-1">
                    {statusFilter !== "all" && <span className="badge badge-info badge-sm gap-1">Status: {statusFilter}<button onClick={() => handleStatusFilterChange({ target: { value: "all" } } as any)}><span className="material-symbols-outlined !text-sm">close</span></button></span>}
                    {petugasFilter !== "all" && <span className="badge badge-info badge-sm gap-1">Petugas: {listPetugasBmn.find(p => String(p.user?.id) === petugasFilter)?.user?.call_name || petugasFilter}<button onClick={() => handlePetugasFilterChange({ target: { value: "all" } } as any)}><span className="material-symbols-outlined !text-sm">close</span></button></span>}
                    {monthMode === "single" && singleMonth && <span className="badge badge-info badge-sm gap-1">Bulan: {singleMonth}<button onClick={() => { setSingleMonth(""); handleMonthModeChange({ target: { value: "none" } } as any); }}><span className="material-symbols-outlined !text-sm">close</span></button></span>}
                    {monthMode === "range" && monthFrom && monthTo && <span className="badge badge-info badge-sm gap-1">Range: {monthFrom} s/d {monthTo}<button onClick={() => handleMonthModeChange({ target: { value: "none" } } as any)}><span className="material-symbols-outlined !text-sm">close</span></button></span>}
                    {searchKodeBarang && <span className="badge badge-info badge-sm gap-1">Kode: {searchKodeBarang}<button onClick={handleClearSearchKodeBarang}><span className="material-symbols-outlined !text-sm">close</span></button></span>}
                </div>
            )}

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
                            <th className="px-4 py-3 text-left">Petugas</th>
                            <th className="px-4 py-3 text-left">Rating</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {localMerged?.length === 0 ? (
                            <tr><td colSpan={10} className="text-center py-6 text-gray-500">Belum ada data pemeliharaan</td></tr>
                        ) : (
                            localMerged?.map((item: any, index: number) => (
                                <tr key={item.id} className="border-t transition">
                                    <td className="px-4 py-3 font-medium">{getStartingNumber() + index}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.code}</td>
                                    <td className={`px-4 py-3 font-semibold ${item.status === 'open' ? 'text-bpom-green' : 'text-red-500'}`}>{item.status}</td>
                                    <td className="px-4 py-3 uppercase">{item.tipe}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {item.barang_new_pemeliharaan?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {item.barang_new_pemeliharaan.map((b: any) => b.barang ? <span key={b.id} className="badge badge-ghost badge-sm font-mono whitespace-nowrap">{b.barang.kode} / {b.barang.nup}</span> : null)}
                                            </div>
                                        ) : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{dayjs(item.created_at).format("DD MMM YYYY")}<br />{dayjs(item.created_at).format("HH:mm:ss")}</td>
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
                                                    <div className="text-yellow-400 font-semibold">{Array.from({ length: 5 }, (_, i) => i < rounded ? '★' : '☆').join('')}</div>
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
                            <button key={index} className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                onClick={() => {
                                    if (link.url) {
                                        const url = new URL(link.url, window.location.origin);
                                        url.searchParams.set('per_page', perPage);
                                        if (statusFilter !== "all") url.searchParams.set('status', statusFilter);
                                        if (petugasFilter !== "all") url.searchParams.set('petugas_id', petugasFilter);
                                        appendMonthParams(url, monthMode, singleMonth, monthFrom, monthTo);
                                        fetchData(url.toString());
                                    }
                                }}>
                                <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
