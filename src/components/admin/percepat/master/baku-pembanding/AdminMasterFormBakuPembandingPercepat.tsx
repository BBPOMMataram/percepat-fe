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

export default function AdminMasterFormBakuPembandingPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        kode_baru: "",
        name: "",
        letak: "",
        stock: 0,
        satuan: "",
        expired: "",
    });
    const [tanggal, setTanggal] = useState<string>("");

    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        if (initialData) {
            setFormData({
                kode_baru: initialData.kode_baru || "",
                name: initialData.name || "",
                letak: initialData.letak || "",
                stock: initialData.stock ?? 0,
                satuan: initialData.satuan || "",
                expired: initialData.expired || "",
            });
            setTanggal(initialData.expired ? initialData.expired.substring(0, 10) : "");
        } else {
            setFormData({
                kode_baru: "",
                name: "",
                letak: "",
                stock: 0,
                satuan: "",
                expired: "",
            });
            setTanggal("");
        }
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
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/baku-pembanding/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/baku-pembanding`;

        const method = "POST";

        let payload = {
            ...formData,
            expired: tanggal || null,
        };

        if (initialData) {
            payload = {
                ...payload,
                _method: 'PUT'
            };
        }

        await api({
            url, method, data: payload
        })
            .then((res) => {
                dispatch(showAlert({ type: 'success', message: res.data.message || "Data berhasil disimpan!", description: res.data.message || "Success" }));
                onSuccess?.();
                onClose();
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message || err.message, description: err.response?.data?.message || "Error" }));
                console.log(err);
            });
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
                        {initialData ? "Edit Baku Pembanding" : "Tambah Baku Pembanding"}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Kode Baru</label>
                            <input
                                type="text"
                                name="kode_baru"
                                value={formData.kode_baru}
                                onChange={handleChange}
                                placeholder="Contoh: BP-001"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Nama Baku Pembanding</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Letak</label>
                            <input
                                type="text"
                                name="letak"
                                value={formData.letak}
                                onChange={handleChange}
                                placeholder="Contoh: Lemari A / Rak 2"
                                className="input input-bordered w-full"
                            />
                        </div>

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

                        <div className="ml-auto">
                            <label className="block text-sm font-medium text-gray-700">
                                Tanggal Expired
                            </label>
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="ar-input-text-purple"
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
