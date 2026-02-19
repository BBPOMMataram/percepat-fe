"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void; // callback kalau data berhasil disimpan
    url: string;
    pengajuan: any;
    mode: string;
}

export default function AdminFormPengajuanSiapMelayani({ open, onClose, onSuccess, url, pengajuan, mode }: Props) {
    const [loading, setLoading] = useState(false);
    const [catatan, setNote] = useState("");

    const dispatch = useDispatch<AppDispatch>()

    const noteRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const method = "PATCH";

        await api({
            url, method, data: {
                catatan
            }
        })
            .then((res) => {
                dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }))
                onSuccess?.(); // refresh data di parent
                onClose();
                setNote("");
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.data?.message }))
            })
        setLoading(false);
    };

    useEffect(() => {
        if (open && noteRef.current) {
            setTimeout(() => { //kasi timeout biar tampil dulu baru bisa focus
                noteRef.current?.focus();
            }, 50);
        }
    }, [open]);

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
                        {`${mode} pengajuan ${pengajuan?.user?.auth_user?.name}`}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Note</label>
                            <input
                                ref={noteRef}
                                type="text"
                                name="catatan"
                                value={catatan}
                                onChange={(e) => setNote(e.target.value)}
                                required
                                className="ar-input-text-purple w-full"
                            />
                        </div>

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => {
                                onClose()
                                setNote("")
                            }}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? "loading" : ""}`}
                                disabled={loading}
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
