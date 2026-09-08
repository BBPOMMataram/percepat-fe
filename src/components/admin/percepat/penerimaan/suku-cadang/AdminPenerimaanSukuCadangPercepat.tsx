import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import AdminPenerimaanFormSukuCadangPercepat from "./AdminPenerimaanFormSukuCadangPercepat";

export default function AdminPenerimaanSukuCadangPercepat() {
    const [data, setData] = useState<any>([])
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [open, setOpen] = useState<boolean>(false)
    const [editData, setEditData] = useState<any>(null)
    const [kodeBarangOrNameFilter, setKodeBarangOrNameFilter] = useState("");
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const dispatch = useDispatch<AppDispatch>()

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;
    const loadData = useCallback(() => {
        const params = new URLSearchParams({
            per_page: String(perPage),
            name: kodeBarangOrNameFilter,
            ...(startDate && { start_date: startDate }),
            ...(endDate && { end_date: endDate }),
        });

        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-suku-cadang?${params}`)
            .then(({ data }) => {
                setData(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
    }, [perPage, kodeBarangOrNameFilter, startDate, endDate]);

    const handleRemove = (id: number) => {
        if (window.confirm('Confirm delete?')) {
            api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-suku-cadang/${id}`)
                .then((res) => {
                    dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }))
                    loadData()
                })
                .catch(err => {
                    dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.data?.message }))
                })
        }
    }

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filterKodeOrNameHander = (v: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setKodeBarangOrNameFilter(v)
        }, 500);
    }

    useEffect(() => {
        loadData()
    }, [loadData])

    return (
        <>
            <AdminPenerimaanFormSukuCadangPercepat open={open} onClose={() => setOpen(false)} initialData={editData} onSuccess={loadData} />

            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Penerimaan Suku Cadang</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Percepat</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="mb-4">
                        <button className="btn btn-primary"
                            onClick={() => {
                                setOpen(true)
                                setEditData(null)
                            }}
                        >Add New</button>
                    </div>

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
                        <input type="text" className="ar-input-text-purple" placeholder="Cari Kode Barang / Nama" onChange={e => filterKodeOrNameHander(e.currentTarget.value)} />
                        <button
                            onClick={() => {
                                const params = new URLSearchParams({
                                    per_page: String(perPage),
                                    page: String(currentPage),
                                    ...(kodeBarangOrNameFilter && { name: kodeBarangOrNameFilter }),
                                    ...(startDate && { start_date: startDate }),
                                    ...(endDate && { end_date: endDate }),
                                });
                                window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-suku-cadang/export-pdf?${params}`, '_blank');
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
                                <th>jumlah</th>
                                <th>vendor</th>
                                <th>tgl terima</th>
                                <th>##</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                data?.data?.map((item: any, index: number) => (
                                    <tr key={item.id}>
                                        <td>{rowNumber(index)}</td>
                                        <td>{item.sukuCadang?.name}</td>
                                        <td>{item.jumlah}</td>
                                        <td>{item.vendor}</td>
                                        <td>{item.created_at ? dayjs(item.created_at).format("DD MMM YYYY") : '-'}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => {
                                                    setEditData(item);
                                                    setOpen(true);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-error ml-1"
                                                onClick={() => handleRemove(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                {/* links */}
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
                                                    setData(res.data)
                                                    setCurrentPage(res.data?.current_page);
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
