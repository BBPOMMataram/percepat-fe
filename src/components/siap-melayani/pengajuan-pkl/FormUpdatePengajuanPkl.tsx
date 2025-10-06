"use client"
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

export default function FormUpdatePengajuanPklSiapMelayani() {
    const formUpdatePengajuanRef = useRef<HTMLFormElement>(null);

    const [penempatan, setPenempatan] = useState<number>(0);
    const [listPenempatan, setListPenempatan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pengajuanPkl, setPengajuanPkl] = useState<any>(null);

    const dispatch = useDispatch<AppDispatch>();

    const router = useRouter();

    const { id } = useParams();

    // FETCHING DATA PENGAJUAN PKL
    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl/${id}`)
            .then(res => {
                setPengajuanPkl(res.data)
                setPenempatan(res.data.position_id) // agar dropdown penempatan terisi sesuai data yg akan diubah
                console.log('pengajuan pkl', res.data);
            })
            .catch(err => {
                console.log(err);
            })
    }, [id])

    // FETCHING DATA LIST PENEMPATAN UNTUK DROPDOWN
    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/penempatan`)
            .then(res => {
                setListPenempatan(res.data)
            })
            .catch(err => {
                console.log(err);
            })
    }, [])

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formUpdatePengajuanRef.current) {
            const formData = new FormData(formUpdatePengajuanRef.current);
            formData.append('_method', 'PATCH');
            api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl/${id}`, formData)
                .then(res => {
                    dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                    console.log(res.data);
                    setLoading(false);
                    router.push('/siap-melayani/pengajuan-pkl');
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
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Form Update Pengajuan PKL</h1>

            <div className="mb-2 flex items-center gap-1 animate-pulse">
                (<span className="ar-label-required"></span>)<span>Wajib diisi</span>
            </div>
            <form onSubmit={handleSubmitForm} className="space-y-4" ref={formUpdatePengajuanRef}>
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
                            defaultValue={
                                pengajuanPkl?.period_start
                                    ? dayjs(pengajuanPkl.period_start).format("YYYY-MM-DD")
                                    : ""
                            }
                            min={dayjs().format("YYYY-MM-DD")}
                        />
                        <span className="mx-2">s/d</span>
                        <input
                            required
                            name="period_end"
                            type="date"
                            className="ar-input-text-purple w-full"
                            defaultValue={
                                pengajuanPkl?.period_end
                                    ? dayjs(pengajuanPkl.period_end).format("YYYY-MM-DD")
                                    : ""
                            }
                            min={dayjs().format("YYYY-MM-DD")}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                        Surat Pengajuan <p className="text-xs text-red-600 m-1">(Isi hanya jika ingin mengubah surat pengajuan sebelumnya)</p>
                    </label>
                    <input
                        name="surat_pengajuan"
                        type="file"
                        className="ar-input-text-purple"
                    />
                    <p className="text-xs text-red-600 m-1">Format: .pdf, Max: 2 MB</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                        Proposal <p className="text-xs text-red-600 m-1">(Isi hanya jika ingin mengubah proposal sebelumnya)</p>
                    </label>
                    <input
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