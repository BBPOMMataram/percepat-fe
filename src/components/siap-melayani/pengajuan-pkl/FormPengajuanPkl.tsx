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
                if (res.data?.length > 0) {
                    setPenempatan(res.data[0].id)
                }
            })
            .catch(err => {
                console.log(err);
            })
    }, [])

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl/`)
            .then(res => {
                const pengajuan = res.data.data
                if (pengajuan?.length > 0) {
                    dispatch(showAlert({ type: "error", message: "Anda sudah memiliki pengajuan pkl", description: "Anda sudah memiliki pengajuan pkl" }))
                    router.push('/siap-melayani/pengajuan-pkl')
                }
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
        <div className="max-w-2xl mx-auto my-6 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-semibold text-bpom-blue uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Form Pendaftaran
                </span>
                <h1 className="text-2xl font-bold font-serif text-slate-800 mt-2">Form Pengajuan PKL</h1>
                <p className="text-xs text-slate-500 mt-1">
                    Silakan isi seluruh formulir dan unggah dokumen pendukung yang dipersyaratkan.
                </p>
            </div>

            <div className="mb-6 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                <span className="material-symbols-outlined !text-[16px]">info</span>
                <span>Tanda bintang (<span className="text-red-500 font-bold">*</span>) wajib diisi</span>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5" ref={formPengajuanPklRef}>
                {/* Penempatan */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Penempatan Unit Kerja <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="position_id"
                        value={penempatan}
                        onChange={(e) => setPenempatan(parseInt(e.target.value))}
                        required
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all focus:border-bpom-blue focus:ring-2 focus:ring-bpom-blue/20"
                    >
                        {listPenempatan.map((item: any) => (
                            <option key={item.id} value={item.id}>
                                {item.name} {item.kuota !== undefined ? `(Tersedia: ${item.kuota})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Periode */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Rencana Periode PKL <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <span className="text-[11px] text-slate-400 block mb-1">Tanggal Mulai</span>
                            <input
                                required
                                name="period_start"
                                type="date"
                                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all focus:border-bpom-blue focus:ring-2 focus:ring-bpom-blue/20"
                                min={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-400 block mb-1">Tanggal Berakhir</span>
                            <input
                                required
                                name="period_end"
                                type="date"
                                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all focus:border-bpom-blue focus:ring-2 focus:ring-bpom-blue/20"
                                min={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    </div>
                </div>

                {/* Surat Pengajuan */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Surat Pengajuan PKL <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        name="surat_pengajuan"
                        type="file"
                        accept=".pdf"
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-bpom-blue hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl p-1.5"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Format dokumen: PDF, Ukuran maksimal: 2 MB</p>
                </div>

                {/* Proposal */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Proposal PKL <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        name="proposal"
                        type="file"
                        accept=".pdf"
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-bpom-blue hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl p-1.5"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Format dokumen: PDF, Ukuran maksimal: 2 MB</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => window.history.back()}
                    >
                        <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                        <span>Kembali</span>
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-bpom-blue text-white font-medium text-sm hover:bg-bpom-blue/90 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin !text-[18px]">progress_activity</span>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined !text-[18px]">send</span>
                                <span>Kirim Pengajuan</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}