"use client";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ModalDisposisiPemeliharaan from "./ModalDisposisiPemeliharaan";

export default function ContentDisposisi({
    dataDisposisi,
    setDataDisposisi,
    handleOpenDetail,
    updateDataDisposisi,
    isLoading,
    setIsloading,
    statusFilter,
    setStatusFilter
}: {
    dataDisposisi: any,
    setDataDisposisi: (data: any) => void,
    handleOpenDetail: (code: string) => void,
    updateDataDisposisi: (status?: string, perPage?: string) => void,
    isLoading: boolean,
    setIsloading: (loading: boolean) => void,
    statusFilter: string,
    setStatusFilter: (status: string) => void
}) {
    const [showModalDiposisiPemeliharaan, setShowModalDiposisiPemeliharaan] = useState(false);
    const [code, setCode] = useState<string>("");
    const [perPage, setPerPage] = useState<string>("10");
    const [currentPage, setCurrentPage] = useState<number>(1);

    const { user } = useSelector((state: RootState) => state.auth);

    // dataDisposisi sudah di-merge dari parent — langsung pakai
    const disposisiData = useMemo(() => {
        return dataDisposisi?.data || dataDisposisi || [];
    }, [dataDisposisi]);

    const hasPagination = dataDisposisi?.data !== undefined;

    useEffect(() => {
        if (hasPagination && dataDisposisi?.per_page) {
            setPerPage(String(dataDisposisi.per_page));
        }
    }, [hasPagination, dataDisposisi?.per_page]);

    const getStartingNumber = () => {
        if (!hasPagination) return 1;
        if (!dataDisposisi?.current_page || dataDisposisi?.current_page === 1) return 1;
        return (dataDisposisi.current_page - 1) * parseInt(perPage) + 1;
    };

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value;
        setPerPage(v);
        setCurrentPage(1);
        updateDataDisposisi(statusFilter, v);
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value;
        setStatusFilter(v);
        setCurrentPage(1);
        updateDataDisposisi(v, perPage);
    };

    const handlePageChange = (page: number) => {
        const totalPages = Math.ceil((Array.isArray(disposisiData) ? disposisiData.length : 0) / parseInt(perPage));
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleOpenDisposisi = (code: string) => {
        setCode(code);
        setShowModalDiposisiPemeliharaan(true);
    };

    // Tampilkan data — tidak ada merge lokal, langsung dari parent
    const getDisplayData = () => {
        const source = Array.isArray(disposisiData) ? disposisiData : [];
        const filtered = statusFilter === "all"
            ? source
            : source.filter((item: any) => item.status?.toLowerCase() === statusFilter.toLowerCase());

        if (hasPagination) return filtered;
        const start = (currentPage - 1) * parseInt(perPage);
        return filtered.slice(start, start + parseInt(perPage));
    };

    const displayData = getDisplayData();
    const totalPages = Math.ceil((Array.isArray(disposisiData) ? disposisiData.length : 0) / parseInt(perPage));

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Disposisi</h2>

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
                            <th className="px-4 py-3 text-left">Pelapor</th>
                            <th className="px-4 py-3 text-left">Rating</th>
                            <th className="px-4 py-3 text-left">Tanggal Lapor</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-6 text-gray-500">Belum ada data disposisi Anda</td></tr>
                        ) : (
                            displayData.map((item: any, index: number) => (
                                <tr key={item.id} className="border-t transition">
                                    <td className="px-4 py-3 font-medium">{getStartingNumber() + index}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.code}</td>
                                    <td className={`px-4 py-3 font-semibold ${item.status === 'open' ? 'text-bpom-green' : 'text-red-500'}`}>{item.status}</td>
                                    <td className="px-4 py-3 uppercase">{item.tipe}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {item.barang_new_pemeliharaan?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {item.barang_new_pemeliharaan.map((b: any) => b.barang
                                                    ? <span key={b.id} className="badge badge-ghost badge-sm font-mono whitespace-nowrap">{b.barang.kode} / {b.barang.nup}</span>
                                                    : null
                                                )}
                                            </div>
                                        ) : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3 uppercase">{item.pelapor?.auth_user?.call_name || item.pelapor?.auth_user?.name || '-'}</td>
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
                                    <td className="px-4 py-3 text-sm">{dayjs(item.created_at).format("DD MMM YYYY")}<br />{dayjs(item.created_at).format("HH:mm:ss")}</td>
                                    <td className="px-4 py-3 flex flex-col gap-2 lg:flex-row">
                                        <button onClick={() => handleOpenDetail(item.code)} className="btn btn-sm btn-accent btn-soft tooltip tooltip-left" data-tip="Lihat Detail">
                                            <span className="hidden lg:block">Detail</span>
                                            <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                        <button
                                            onClick={() => handleOpenDisposisi(item.code)}
                                            className="btn btn-sm btn-primary btn-soft tooltip tooltip-left" data-tip="Lanjutkan Disposisi"
                                            disabled={item.disposisi_new_pemeliharaan?.at(-1)?.to_user?.external_user_id !== user?.id}
                                        >
                                            <span className="hidden lg:block">Lanjut</span>
                                            <span className="material-symbols-outlined">signature</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {hasPagination ? (
                    <div className="flex justify-end items-center m-4 gap-4">
                        <div className="btn-group">
                            {dataDisposisi?.links?.map((link: any, index: number) =>
                                <button key={index} className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            setIsloading(true);
                                            const url = new URL(link.url);
                                            if (statusFilter !== "all") url.searchParams.set('status', statusFilter);
                                            url.searchParams.set('per_page', perPage);
                                            api.get(url.toString()).then(res => { setIsloading(false); setDataDisposisi(res.data); });
                                        }
                                    }}>
                                    <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    totalPages > 1 && (
                        <div className="flex justify-end items-center m-4 gap-4">
                            <div className="btn-group">
                                <button className={`btn ${currentPage === 1 && 'btn-disabled'} mr-1`} onClick={() => handlePageChange(currentPage - 1)}>«</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button key={page} className={`btn ${currentPage === page && 'btn-active'} mr-1`} onClick={() => handlePageChange(page)}>{page}</button>
                                ))}
                                <button className={`btn ${currentPage === totalPages && 'btn-disabled'} mr-1`} onClick={() => handlePageChange(currentPage + 1)}>»</button>
                            </div>
                        </div>
                    )
                )}
            </div>

            <ModalDisposisiPemeliharaan
                show={showModalDiposisiPemeliharaan}
                onClose={() => setShowModalDiposisiPemeliharaan(false)}
                code={code}
                updateDataDisposisi={(status) => updateDataDisposisi(status || statusFilter)}
            />
        </>
    );
}
