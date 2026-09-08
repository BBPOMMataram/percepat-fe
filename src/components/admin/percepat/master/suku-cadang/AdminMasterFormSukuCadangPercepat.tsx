import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface Props {
    open: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess: () => void;
}

export default function AdminMasterFormSukuCadangPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [name, setName] = useState("");
    const [satuan, setSatuan] = useState("");
    const [stock, setStock] = useState(0);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setSatuan(initialData.satuan || "");
            setStock(initialData.stock || 0);
            setDescription(initialData.description || "");
        } else {
            setName("");
            setSatuan("");
            setStock(0);
            setDescription("");
        }
    }, [initialData, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = { name, satuan, stock, description };
        const url = initialData
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/suku-cadang/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/suku-cadang`;

        const method = initialData ? api.put : api.post;

        method(url, payload)
            .then((res) => {
                dispatch(showAlert({ type: 'success', message: res.data.message }));
                onSuccess();
                onClose();
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message || 'Error' }));
            })
            .finally(() => setLoading(false));
    };

    if (!open) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{initialData ? 'Edit' : 'Tambah'} Suku Cadang</h3>
                <form onSubmit={handleSubmit} className="py-4">
                    <div className="form-control">
                        <label className="label">Nama</label>
                        <input type="text" className="input input-bordered" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-control">
                        <label className="label">Satuan</label>
                        <input type="text" className="input input-bordered" value={satuan} onChange={e => setSatuan(e.target.value)} required />
                    </div>
                    <div className="form-control">
                        <label className="label">Stock</label>
                        <input type="number" className="input input-bordered" value={stock} onChange={e => setStock(Number(e.target.value))} min={0} />
                    </div>
                    <div className="form-control">
                        <label className="label">Deskripsi</label>
                        <textarea className="textarea textarea-bordered" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="modal-action">
                        <button type="button" className="btn" onClick={onClose}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
