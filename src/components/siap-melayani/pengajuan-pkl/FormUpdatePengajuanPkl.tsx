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
        <div className="max-w-2xl mx-auto my-6 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-semibold text-bpom-blue uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Pembaruan Data
                </span>
                <h1 className="text-2xl font-bold font-serif text-slate-800 mt-2">Form Ubah Pengajuan PKL</h1>
                <p className="text-xs text-slate-500 mt-1">
                    Ubah informasi pengajuan dan unggah ulang berkas baru bila diperlukan.
                </p>
            </div>

            <div className="mb-6 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                <span className="material-symbols-outlined !text-[16px]">info</span>
                <span>Tanda bintang (<span className="text-red-500 font-bold">*</span>) wajib diisi</span>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5" ref={formUpdatePengajuanRef}>
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
                                defaultValue={
                                    pengajuanPkl?.period_start
                                        ? dayjs(pengajuanPkl.period_start).format("YYYY-MM-DD")
                                        : ""
                                }
                                min={dayjs().format("YYYY-MM-DD")}
                            />
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-400 block mb-1">Tanggal Berakhir</span>
                            <input
                                required
                                name="period_end"
                                type="date"
                                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all focus:border-bpom-blue focus:ring-2 focus:ring-bpom-blue/20"
                                defaultValue={
                                    pengajuanPkl?.period_end
                                        ? dayjs(pengajuanPkl.period_end).format("YYYY-MM-DD")
                                        : ""
                                }
                                min={dayjs().format("YYYY-MM-DD")}
                            />
                        </div>
                    </div>
                </div>

                {/* Surat Pengajuan */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Surat Pengajuan PKL
                    </label>
                    <span className="text-[11px] text-amber-600 block mb-1.5">
                        *Unggah berkas baru hanya jika ingin memperbarui surat pengajuan sebelumnya
                    </span>
                    <input
                        name="surat_pengajuan"
                        type="file"
                        accept=".pdf"
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-bpom-blue hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl p-1.5"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Format dokumen: PDF, Ukuran maksimal: 2 MB</p>
                </div>

                {/* Proposal */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Proposal PKL
                    </label>
                    <span className="text-[11px] text-amber-600 block mb-1.5">
                        *Unggah berkas baru hanya jika ingin memperbarui proposal sebelumnya
                    </span>
                    <input
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
                                <span className="material-symbols-outlined !text-[18px]">save</span>
                                <span>Simpan Perubahan</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}