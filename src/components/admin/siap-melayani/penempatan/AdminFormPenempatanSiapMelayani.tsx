"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { Penempatan } from "@/types/penempatan";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface Props {
    open: boolean;
    onClose: () => void;
    initialData?: Penempatan | null;
    onSuccess?: () => void; // callback kalau data berhasil disimpan
}

export default function AdminFormPenempatanSiapMelayani({ open, onClose, initialData, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Penempatan>({
        name: "",
        kualifikasi: "",
        desc: "",
        kuota: 0,
    });

    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else
            setFormData({
                name: "",
                kualifikasi: "",
                desc: "",
                kuota: 0,
            });
        console.log(initialData);

    }, [initialData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "kuota" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // try {

        // Ganti URL ini sesuai endpoint API Laravel kamu
        const url = initialData
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/positions/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/positions`;

        const method = "POST";

        if (initialData) {
            formData['_method'] = 'PUT'; // untuk method spoofing di Laravel
        }

        await api.request({
            url, method, data: formData
        })
            .then((res) => {
                dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }))
                onSuccess?.(); // refresh data di parent
                onClose();
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.data?.message }))
            })
        setLoading(false);

        // } catch (error) {
        //     console.error(error);
        //     alert("Terjadi kesalahan saat menyimpan data");
        // } finally {
        //     setLoading(false);
        // }
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
                        {initialData ? "Edit Data" : "Tambah Data"}
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

                        <div>
                            <label className="block text-sm font-medium mb-1">Kualifikasi Jurusan</label>
                            <input
                                type="text"
                                name="kualifikasi"
                                value={formData.kualifikasi}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Keterangan</label>
                            <textarea
                                name="desc"
                                value={formData.desc}
                                onChange={handleChange}
                                className="textarea textarea-bordered w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Kuota</label>
                            <input
                                type="number"
                                name="kuota"
                                value={formData.kuota}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                                min={0}
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
