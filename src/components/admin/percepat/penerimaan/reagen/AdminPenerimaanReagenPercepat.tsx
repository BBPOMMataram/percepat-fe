import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import AdminPenerimaanFormReagenPercepat from "./AdminPenerimaanFormReagenPercepat";

export default function AdminPenerimaanReagenPercepat() {
    const [data, setData] = useState<any>([])
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [open, setOpen] = useState<boolean>(false)
    const [editData, setEditData] = useState<any>(null)

    const dispatch = useDispatch<AppDispatch>()

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;
    const loadData = useCallback(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-reagen?per_page=${perPage}`)
            .then(({ data }) => {
                setData(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
    }, [perPage]);

    const handleRemove = (id: number) => {
        if (window.confirm('Confirm delete?')) {
            api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-reagen/${id}`)
                .then((res) => {
                    console.log(res);

                    dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }))
                    loadData()
                })
                .catch(err => {
                    dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.data?.message }))
                })
        }
    }

    useEffect(() => {
        loadData()
    }, [loadData])

    return (
        <>
            <AdminPenerimaanFormReagenPercepat open={open} onClose={() => setOpen(false)} initialData={editData} onSuccess={loadData} />

            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Penerimaan Reagen</div>
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

                    <div className="flex items-center gap-2 ml-auto">
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
                    {/* <div className="ml-auto flex items-center gap-2">
                    <input type="text" className="ar-input-text-purple" placeholder="Cari Kode Barang / Nama" onChange={e => filterKodeOrNameHander(e.currentTarget.value)} />
                </div> */}
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama</th>
                                <th>Expired</th>
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
                                        <td>{item.barang.name}</td>
                                        <td>{item.barang?.expired ? dayjs(item.barang?.expired).format("DD MMM YYYY") : '-'}</td>
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
                                            api.get(link.url)
                                                .then(res => {
                                                    setData(res.data)
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