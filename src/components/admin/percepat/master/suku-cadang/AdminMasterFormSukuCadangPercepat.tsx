"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface Props {
    open: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess?: () => void;
}

export default function AdminMasterFormSukuCadangPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        stock: 0,
        name: "",
        satuan: "",
        description: "",
    });

    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else
            setFormData({
                stock: 0,
                name: "",
                satuan: "",
                description: "",
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
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-suku-cadang/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-suku-cadang`;

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
                onSuccess?.();
                onClose();
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message || 'Terjadi kesalahan', description: err.response?.data?.message || 'Terjadi kesalahan' }))
                console.log(err);

            })
        setLoading(false);
    };

    if (!open) return null;

    return (
        <div className="modal modal-open z-50">
            <div className="modal-box relative">
                <button
                    type="button"
                    className="btn btn-sm btn-circle absolute right-2 top-2"
                    onClick={onClose}
                >
                    ✕
                </button>
                <h3 className="font-bold text-lg mb-4">
                    {initialData ? "Edit Data" : "Tambah Suku Cadang"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ""}
                            onChange={handleChange}
                            placeholder="Masukkan nama suku cadang"
                            className="input input-bordered w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Satuan</label>
                        <input
                            type="text"
                            name="satuan"
                            value={formData.satuan || ""}
                            onChange={handleChange}
                            placeholder="Masukkan satuan (pcs, box, dll)"
                            className="input input-bordered w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Stok</label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock || 0}
                            onChange={handleChange}
                            placeholder="Masukkan jumlah stok"
                            className="input input-bordered w-full"
                            min={0}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi</label>
                        <textarea
                            name="description"
                            value={formData.description || ""}
                            onChange={handleChange}
                            placeholder="Masukkan deskripsi (opsional)"
                            className="textarea textarea-bordered w-full"
                            rows={3}
                        />
                    </div>

                    <div className="modal-action pt-4">
                        <button type="button" className="btn" onClick={onClose}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="loading loading-spinner loading-xs"></span> : (initialData ? "Simpan Perubahan" : "Tambah")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
