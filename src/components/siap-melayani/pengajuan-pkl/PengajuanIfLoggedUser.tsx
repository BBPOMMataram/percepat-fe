<<<<<<< HEAD
=======
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { User } from "@/types/auth";
import apiBase from "@/utils/axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import PengajuanPKLTableSiapMelayani from "./PengajuanTable";

export default function PengajuanIfLoggedUserSiapMelayani({ user }: { user: User }) {
    const dispatch = useDispatch<AppDispatch>()

    const [pengajuan, setPengajuan] = useState<any>(null)
    const [loadingTable, setLoadingTable] = useState<boolean>(true)

    const formLaporanAkhirRef = useRef<HTMLFormElement>(null)

    // AMBIL DATA PENGAJUAN PKL
    useEffect(() => {
        setLoadingTable(true)
        apiBase.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + "/api/pengajuan-pkl")
            .then(res => {
                setPengajuan(res.data)
                setLoadingTable(false)
            })
            .catch(err => {
                setLoadingTable(false)
                dispatch(showAlert({ type: "error", message: err.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
            })
    }, [dispatch])

    const uploadLaporanAkhir = (e: React.FormEvent) => {
        e.preventDefault();

        if (formLaporanAkhirRef.current) {
            const formData = new FormData(formLaporanAkhirRef.current);
            apiBase.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/upload-laporan-akhir`, formData)
                .then(res => {
                    dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))

                    // PERBAHARUI DATA TABLE
                    apiBase.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + "/api/pengajuan-pkl")
                        .then(res => {
                            setPengajuan(res.data)
                        })
                        .catch(err => {
                            dispatch(showAlert({ type: "error", message: err.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                        })
                })
                .catch(err => {
                    if (err.response?.status === 404) {
                        dispatch(showAlert({ type: "error", message: err.response?.data?.message, description: 'Data tidak ditemukan' }));
                        return
                    }
                    dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                })
        }
    }

    const removePengajuan = () => {
        if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;
        apiBase.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl/${pengajuan.data[0]?.id}`)
            .then(res => {
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                setPengajuan(null)
            })
            .catch(err => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
            })
    }

    return (
        <div className="max-w-6xl mx-auto my-6 space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-bpom-blue bg-blue-50 px-2.5 py-0.5 rounded-full">
                            Portal PKL
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold font-serif text-slate-800">Pengajuan Praktik Kerja Lapangan</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Halo <span className="font-semibold text-slate-700">{user.name}</span>
                        {pengajuan?.data?.length > 0 
                            ? ' berikut adalah ringkasan status pengajuan PKL Anda.' 
                            : ' selamat datang di Sistem Pengajuan PKL BBPOM di Mataram.'}
                    </p>
                </div>
            </div>

            {/* JIKA BUKAN MAHASISWA */}
            {!user.student && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-6 text-amber-800 flex items-start gap-4">
                    <span className="material-symbols-outlined text-amber-600 !text-2xl mt-0.5">info</span>
                    <div>
                        <h3 className="font-semibold text-base mb-1">Akses Khusus Mahasiswa</h3>
                        <p className="text-sm text-amber-700">
                            Halaman pengajuan PKL ini diperuntukkan bagi pengguna dengan profil mahasiswa. Akun Anda saat ini tidak terdaftar sebagai mahasiswa aktif.
                        </p>
                    </div>
                </div>
            )}

            {/* JIKA MAHASISWA */}
            {user.student && (
                <>
                    {loadingTable ? (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
                            <span className="material-symbols-outlined animate-spin text-bpom-blue !text-3xl">progress_activity</span>
                            <p className="text-sm text-slate-500 mt-2">Memuat data pengajuan...</p>
                        </div>
                    ) : pengajuan?.data?.length > 0 ? (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-base">Riwayat & Berkas Pengajuan</h3>
                                <span className="text-xs text-slate-500">
                                    Total: {pengajuan.data.length} pengajuan
                                </span>
                            </div>

                            <PengajuanPKLTableSiapMelayani pengajuan={pengajuan} />

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                {/* Actions: Ubah & Hapus */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {pengajuan.data[0]?.status === 'diproses' ? (
                                        <>
                                            <Link 
                                                href={`/siap-melayani/pengajuan-pkl/form-update/${pengajuan.data[0]?.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-bpom-blue font-medium text-sm hover:bg-blue-100 transition-colors"
                                            >
                                                <span className="material-symbols-outlined !text-[18px]">edit</span>
                                                <span>Ubah</span>
                                            </Link>
                                            <button 
                                                onClick={removePengajuan}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                <span>Hapus</span>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-xs text-slate-400 italic">
                                            Pengajuan telah diproses dan tidak dapat diubah
                                        </div>
                                    )}
                                </div>

                                {/* FORM UPLOAD LAPORAN AKHIR */}
                                {pengajuan.data[0]?.status !== 'diproses' && (
                                    <form
                                        ref={formLaporanAkhirRef}
                                        onSubmit={uploadLaporanAkhir}
                                        className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto sm:ml-auto"
                                    >
                                        <label
                                            htmlFor="laporan_akhir"
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">upload</span>
                                            <span>Upload Laporan Akhir</span>
                                        </label>
                                        <input
                                            onChange={(e) => {
                                                if (e.target.form) {
                                                    e.target.form.requestSubmit();
                                                }
                                            }}
                                            id="laporan_akhir"
                                            name="laporan_akhir"
                                            type="file"
                                            className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl p-1"
                                        />
                                    </form>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-xs">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <span className="material-symbols-outlined !text-[32px]">assignment_add</span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Belum Ada Pengajuan PKL</h3>
                            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                                Anda belum mengajukan permohonan Praktik Kerja Lapangan di Balai Besar POM di Mataram. Klik tombol di bawah untuk membuat pengajuan baru.
                            </p>
                            <Link
                                href="/siap-melayani/pengajuan-pkl/form"
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-bpom-blue text-white font-medium text-sm hover:bg-bpom-blue/90 shadow-xs transition-all"
                            >
                                <span className="material-symbols-outlined !text-[18px]">add_circle</span>
                                <span>Ajukan PKL Sekarang</span>
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
>>>>>>> 51c15b5ae5503b85174c5e32672c39c7ee27f21f
