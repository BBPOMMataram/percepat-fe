import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

export default function ContentPemeliharaanAll({ dataAll, setDataAll, handleOpenDetail }: { dataAll: any, setDataAll: (data: any) => void, handleOpenDetail: (code: string) => void }) {
    const [mergedDataAll, setMergedDataAll] = useState<any>([])
    const [perPage, setPerPage] = useState<string>("10")

    // Sync perPage with server response
    useEffect(() => {
        if (dataAll?.per_page) {
            setPerPage(String(dataAll.per_page));
        }
    }, [dataAll?.per_page]);

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
        api.get(`${baseUrl}?page=1&per_page=${newPerPage}`)
            .then(res => {
                setDataAll(res.data);
            })
            .catch(() => { });
    };

    // get user auth untuk pelapor
    useEffect(() => {
        if (!Array.isArray(dataAll?.data)) return;

        // ambil semua external_user_id pelapor
        const ids = [...new Set(
            dataAll?.data
                .map((item: any) => item.pelapor?.external_user_id)
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
                            : null
                    }))
                );
            })
            .catch(() => setMergedDataAll(dataAll?.data));
    }, [dataAll]);


    return (
        <>
            <h2 className="mb-10 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan</h2>
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
                        {mergedDataAll?.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500">
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
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tampilkan:</span>
                        <select
                            value={perPage}
                            onChange={handlePerPageChange}
                            className="select select-bordered select-sm"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    <div className="btn-group">
                        {
                            dataAll?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            // Preserve per_page parameter when navigating
                                            const url = new URL(link.url, window.location.origin);
                                            url.searchParams.set('per_page', perPage);
                                            api.get(url.toString())
                                                .then(res => {
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