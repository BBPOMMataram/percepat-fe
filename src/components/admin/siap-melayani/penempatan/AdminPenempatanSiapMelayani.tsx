import { showAlert } from "@/features/alertSlice"
import { AppDispatch } from "@/redux/store"
import api from "@/utils/api"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import AdminFormPenempatanSiapMelayani from "./AdminFormPenempatanSiapMelayani"

export default function AdminPenempatanSiapMelayani() {
    const [positions, setPositions] = useState<any>([])

    const [open, setOpen] = useState<boolean>(false)
    const [editData, setEditData] = useState<any>(null)

    const dispatch = useDispatch<AppDispatch>()

    const loadData = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/positions`)
            .then(res => {
                setPositions(res.data)
            })
    }

    const handleRemove = (id: number) => {
        if (window.confirm('Are you sure?')) {
            api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/positions/${id}`)
                .then((res) => {
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
    }, [])

    return (
        <>
            <AdminFormPenempatanSiapMelayani open={open} onClose={() => setOpen(false)} initialData={editData} onSuccess={loadData} />

            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Penempatan PKL</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Siap Melayani</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="mb-4">
                    <button className="btn btn-primary"
                        onClick={() => {
                            setOpen(true)
                            setEditData(null)
                        }}
                    >Add New</button>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Name</th>
                                <th>Kualifikasi Jurusan</th>
                                <th>Keterangan</th>
                                <th>Kuota</th>
                                <th>#</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                positions?.data?.map((item: any, index: number) => (
                                    <tr key={item.id} className="">
                                        <td>{(positions?.current_page - 1) * parseInt(positions?.per_page) + index + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{item.kualifikasi}</td>
                                        <td>{item.desc || "-"}</td>
                                        <td>{item.kuota}</td>
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
                            positions?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            api.get(link.url)
                                                .then(res => {
                                                    setPositions(res.data)
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