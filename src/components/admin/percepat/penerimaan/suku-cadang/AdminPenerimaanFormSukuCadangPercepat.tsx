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

export default function AdminPenerimaanFormSukuCadangPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [sukuCadangId, setSukuCadangId] = useState("");
    const [jumlah, setJumlah] = useState(0);
    const [vendor, setVendor] = useState("");
    const [loading, setLoading] = useState(false);
    const [sukuCadangList, setSukuCadangList] = useState<any>([]);

    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-suku-cadang/getAll`)
            .then(({ data }) => {
                setSukuCadangList(data.data || data);
            })
            .catch(err => console.log(err));
    }, []);

    useEffect(() => {
        if (initialData) {
            setSukuCadangId(initialData.suku_cadang_id || "");
            setJumlah(initialData.jumlah || 0);
            setVendor(initialData.vendor || "");
        } else {
            setSukuCadangId("");
            setJumlah(0);
            setVendor("");
        }
    }, [initialData, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = { suku_cadang_id: sukuCadangId, jumlah, vendor };
        const url = initialData
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-suku-cadang/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-suku-cadang`;

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
                <h3 className="font-bold text-lg">{initialData ? 'Edit' : 'Tambah'} Penerimaan Suku Cadang</h3>
                <form onSubmit={handleSubmit} className="py-4">
                    <div className="form-control">
                        <label className="label">Suku Cadang</label>
                        <select className="select select-bordered" value={sukuCadangId} onChange={e => setSukuCadangId(e.target.value)} required>
                            <option value="">Pilih Suku Cadang</option>
                            {sukuCadangList.map((item: any) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label">Jumlah</label>
                        <input type="number" className="input input-bordered" value={jumlah} onChange={e => setJumlah(Number(e.target.value))} min={0} required />
                    </div>
                    <div className="form-control">
                        <label className="label">Vendor</label>
                        <input type="text" className="input input-bordered" value={vendor} onChange={e => setVendor(e.target.value)} />
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
