import api from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export default function AdminKartuStokPerlengkapanPercepat() {
    const [data, setData] = useState<any>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [kodeBarangOrNameFilter, setKodeBarangOrNameFilter] = useState("");
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    const loadData = useCallback(() => {
        const params = new URLSearchParams({
            per_page: String(perPage),
            name: kodeBarangOrNameFilter,
            ...(startDate && { start_date: startDate }),
            ...(endDate && { end_date: endDate }),
        });

        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/perlengkapan-kebersihan?${params}`)
            .then(({ data }) => {
                setData(data);
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
            })
            .catch(err => console.log(err));
    }, [perPage, kodeBarangOrNameFilter, startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [perPage, loadData]);

    const downloadHandler = (id: number) => {
        api({
            url: `/api/v1/download-perlengkapan/${id}`,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Kartu-Stok-Perlengkapan-${id}.pdf`);
                document.body.appendChild(link);
                link.click();
                toast.success('Download berhasil !', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            })
            .catch(err => console.log(err));
    };

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filterKodeOrNameHander = (v: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setKodeBarangOrNameFilter(v);
        }, 500);
    };

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Kartu Stok Perlengkapan Kebersihan</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Percepat</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tampilkan</span>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="select select-bordered w-fit"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="ar-input-text-purple"
                        />
                        <span className="text-sm text-gray-600">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="ar-input-text-purple"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <input type="text" className="ar-input-text-purple" placeholder="Cari nama barang" onChange={e => filterKodeOrNameHander(e.currentTarget.value)} />
                        <button
                            onClick={() => {
                                const params = new URLSearchParams({
                                    per_page: String(perPage),
                                    page: String(currentPage),
                                    ...(kodeBarangOrNameFilter && { name: kodeBarangOrNameFilter }),
                                    ...(startDate && { start_date: startDate }),
                                    ...(endDate && { end_date: endDate }),
                                });
                                window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/perlengkapan-kebersihan/export-pdf?${params}`, '_blank');
                            }}
                            className="btn btn-success text-white gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            PDF
                        </button>
                    </div>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama</th>
                                <th>Stock</th>
                                <th>Satuan</th>
                                <th>##</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                data?.data?.map((item: any, index: number) => (
                                    <tr key={item.id}>
                                        <td>{rowNumber(index)}</td>
                                        <td>{item.name}</td>
                                        <td>{item.stock}</td>
                                        <td>{item.satuan}</td>
                                        <td>
                                            <span className="btn btn-sm btn-ghost btn-error tooltip tooltip-error tooltip-left" data-tip="Download Kartu Stok"
                                                onClick={() => downloadHandler(item.id)}>
                                                <span className="material-symbols-outlined">
                                                    download
                                                </span>
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-8">
                    <div className="btn-group">
                        {
                            data?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            const url = new URL(link.url);
                                            url.searchParams.set('per_page', String(perPage));
                                            url.searchParams.set('name', kodeBarangOrNameFilter);
                                            if (startDate) url.searchParams.set('start_date', startDate);
                                            if (endDate) url.searchParams.set('end_date', endDate);

                                            api.get(url.toString())
                                                .then(res => {
                                                    setData(res.data);
                                                    setCurrentPage(res.data?.current_page);
                                                });
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
    );
}
