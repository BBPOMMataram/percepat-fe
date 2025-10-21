import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export default function AdminTataTertibSiapMelayani() {
    const [data, setData] = useState<any>({
        content: ''
    })

    const dispatch = useDispatch<AppDispatch>();

    const handleUpdateLink = () => {
        api.put(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/ducuments/tata_tertib`, {
            content: data.content
        })
            .then(res => {
                dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message || 'Content tata tertib berhasil diperbarui.' }))
                loadData()
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.response?.data?.message || 'Terjadi kesalahan saat memperbarui content tata tertib.' }))
            })
    }

    const loadData = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/documents/tata_tertib`)
            .then(res => {
                setData(res.data)
            })
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Tata Tertib</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Siap Melayani</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="flex flex-col">
                    <label htmlFor="content">
                        Update content tata tertib
                    </label>
                    <div className="flex flex-col">
                        <input type="text" id="content" name="content"
                            className="ar-input-text-purple mt-2 flex-1"
                            placeholder="Input content tata tertib"
                            value={data?.content}
                            onChange={(e) => setData({ ...data, content: e.target.value })}
                        />
                        <button className="btn btn-primary mt-2 ml-2" onClick={handleUpdateLink}>Update</button>
                    </div>
                </div>
            </div>
        </>
    )
}