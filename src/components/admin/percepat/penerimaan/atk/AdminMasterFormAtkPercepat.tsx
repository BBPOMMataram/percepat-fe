"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface Props {
    open: boolean;
    onClose: () => void;
    initialData?: any; // data yang mau diedit, kalau null berarti form untuk tambah baru
    onSuccess?: () => void; // callback kalau data berhasil disimpan
}

export default function AdminMasterFormAtkPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        stock: 0,
        name: "",
        satuan: "",
        desc: "",
    });

    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else
            setFormData({
                stock: 0,
                name: "",
                satuan: "",
                desc: "",
            });
    }, [initialData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: name === "stock" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const url = initialData
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/atk/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/atk`;

        const method = "POST";

        let payload = formData;

        if (initialData) {
            payload = {
                ...formData,
                _method: 'PUT'
            };
        }

        await api({
            url, method, data: payload
        })
            .then((res) => {
                dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }))
                onSuccess?.(); // refresh data di parent
                onClose();
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.data?.message }))
                console.log(err);

            })
        setLoading(false);
    };

    return (
        <>
            <input
                type="checkbox"
                className="modal-toggle"
                checked={open}
                onChange={onClose}
            />
            <div className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">
                        {initialData ? "Edit Data" : "Add new data"}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                            />
                        </div>

                        {/* <div>
                            <label className="block text-sm font-medium mb-1">Keterangan</label>
                            <textarea
                                name="desc"
                                value={formData.desc}
                                onChange={handleChange}
                                className="textarea textarea-bordered w-full"
                            />
                        </div> */}

                        <div>
                            <label className="block text-sm font-medium mb-1">Stock</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                                min={0}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Satuan</label>
                            <input
                                type="text"
                                name="satuan"
                                value={formData.satuan}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? "loading" : ""}`}
                                disabled={loading}
                            >
                                {initialData ? "Update" : "Submit"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
