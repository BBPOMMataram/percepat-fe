"use client"
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

export default function FormPengajuanPklSiapMelayani() {
    const formPengajuanPklRef = useRef<HTMLFormElement>(null);

    const [penempatan, setPenempatan] = useState<number>(0);
    const [listPenempatan, setListPenempatan] = useState([]);
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch<AppDispatch>();

    const router = useRouter();

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/penempatan`)
            .then(res => {
                setListPenempatan(res.data)
                console.log('position', res.data);
            })
            .catch(err => {
                console.log(err);
            })
    }, [])

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl/`)
            .then(res => {

                const pengajuan = res.data.data

                if (pengajuan.length > 0) {
                    dispatch(showAlert({ type: "error", message: "Anda sudah memiliki pengajuan pkl", description: "Anda sudah memiliki pengajuan pkl" }))
                    router.push('/siap-melayani/pengajuan-pkl')
                }

                console.log('pengajuan pkl', res.data.data);
            })
            .catch(err => {
                console.log(err);
            })
    }, [router, dispatch])

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formPengajuanPklRef.current) {
            const formData = new FormData(formPengajuanPklRef.current);
            api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl`, formData)
                .then(res => {
                    dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                    console.log(res.data);
                    setLoading(false);
                    window.history.back();
                })
                .catch(err => {
                    dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                    console.log(err);
                    if (err.status == 401) {
                        router.push('/login');
                    }
                    setLoading(false);
                })
        }
    }

    return (
        <div className="max-w-4xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Form Pengajuan PKL</h1>

            <div className="mb-2 flex items-center gap-1 animate-pulse">
                (<span className="ar-label-required"></span>)<span>Wajib diisi</span>
            </div>
            <form onSubmit={handleSubmitForm} className="space-y-4" ref={formPengajuanPklRef}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 ar-label-required">
                        Penempatan
                    </label>
                    <select
                        name="position_id"
                        value={penempatan}
                        onChange={(e) => setPenempatan(parseInt(e.target.value))}
                        required
                        className="ar-input-text-purple"
                    >
                        {
                            listPenempatan.map((item: any) => {
                                return (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                )
                            })
                        }
                    </select>
                </div>

                {/* PERIODE */}
                <div className="">
                    <label className="block text-sm font-medium text-gray-700 ar-label-required">
                        Rencana Periode
                    </label>
                    <div className="flex items-center">
                        <input
                            required
                            name="period_start"
                            type="date"
                            className="ar-input-text-purple w-full"
                            min={new Date().toISOString().split("T")[0]}
                        />
                        <span className="mx-2">s/d</span>
                        <input
                            required
                            name="period_end"
                            type="date"
                            className="ar-input-text-purple w-full"
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 ar-label-required">
                        Surat Pengajuan
                    </label>
                    <input
                        required
                        name="surat_pengajuan"
                        type="file"
                        className="ar-input-text-purple"
                    />
                    <p className="text-xs text-red-600 m-1">Format: .pdf, Max: 2 MB</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 ar-label-required">
                        Proposal
                    </label>
                    <input
                        required
                        name="proposal"
                        type="file"
                        className="ar-input-text-purple"
                    />
                    <p className="text-xs text-red-600 m-1">Format: .pdf, max: 2 Mb</p>
                </div>

                <div className="flex gap-0.5 mt-10">
                    <button
                        type="button"
                        disabled={loading}
                        className="ar-btn-purple flex gap-1 w-fit"
                        onClick={() => window.history.back()}
                    >
                        <span className="material-symbols-outlined">
                            arrow_left_alt
                        </span> <span>Back</span>
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ar-btn-purple flex-1"
                    >
                        {loading ?
                            <span className="material-symbols-outlined animate-spin">
                                cyclone
                            </span>
                            : "Submit"}
                    </button>
                </div>
            </form>
        </div>
    )
}