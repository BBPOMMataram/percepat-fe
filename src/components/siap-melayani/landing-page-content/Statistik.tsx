<<<<<<< HEAD
=======
"use client"
import { showAlert } from "@/features/alertSlice"
import { AppDispatch } from "@/redux/store"
import axios from "@/utils/axios"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"

export default function StatistikPklSiapMelayani() {
    const dispatch = useDispatch<AppDispatch>()

    const [pkl, setPkl] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        setLoading(true)
        axios.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + '/api/landing-page')
            .then(res => {
                setPkl(res.data)
                setLoading(false)
            })
            .catch(err => {
                setLoading(false)
                dispatch(showAlert({ type: "error", message: "Error fetching data landing page", description: err || "No Message from Backend" }));
            })
    }, [dispatch])

    return (
        <section id="statistik" className="w-full max-w-6xl mx-auto py-8">
            <div className="text-center mb-10">
                <span className="text-xs font-semibold text-bpom-blue uppercase tracking-wider bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
                    Statistik & Kuota
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold font-serif text-slate-800 mt-3">Statistik PKL</h2>
                <p className="text-sm lg:text-base text-slate-500 mt-1 max-w-lg mx-auto">
                    Data statistik dan informasi kuota Mahasiswa Praktik Kerja Lapangan di Balai Besar POM di Mataram
                </p>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Card 1: Pengajuan */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs border-b-[5px] border-b-[#003366] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-bpom-blue uppercase tracking-wider">Total Pengajuan</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
                            {loading ? (
                                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded"></span>
                            ) : (
                                pkl?.totalPengajuanPkl ?? 0
                            )}
                        </span>
                        <span className="text-sm font-medium text-slate-500">Berkas</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">
                        Total pengajuan berkas Mahasiswa PKL yang telah masuk
                    </p>
                </div>

                {/* Card 2: Mahasiswa Aktif */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs border-b-[5px] border-b-[#003366] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-bpom-blue uppercase tracking-wider">Mahasiswa Aktif</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
                            {loading ? (
                                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded"></span>
                            ) : (
                                pkl?.totalAktifPkl ?? 0
                            )}
                        </span>
                        <span className="text-sm font-medium text-slate-500">Mahasiswa</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">
                        Total Mahasiswa PKL aktif saat ini di BBPOM di Mataram
                    </p>
                </div>

                {/* Card 3: Kuota Tersedia */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs border-b-[5px] border-b-[#003366] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-bpom-blue uppercase tracking-wider">Kuota Tersedia</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
                            {loading ? (
                                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded"></span>
                            ) : (
                                pkl?.totalKuota ?? 0
                            )}
                        </span>
                        <span className="text-sm font-medium text-slate-500">Slot Terbuka</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">
                        Jumlah kuota penerimaan PKL yang masih tersedia
                    </p>
                </div>
            </div>

            {/* Table Kuota PKL */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 font-serif">Ketersediaan Kuota PKL</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Informasi posisi penempatan dan kualifikasi jurusan</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                                <th className="px-6 py-3.5 w-12 text-center">#</th>
                                <th className="px-6 py-3.5">Penempatan</th>
                                <th className="px-6 py-3.5">Kualifikasi Jurusan</th>
                                <th className="px-6 py-3.5">Keterangan</th>
                                <th className="px-6 py-3.5 text-center w-36">Kuota Tersedia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined animate-spin text-bpom-blue">progress_activity</span>
                                            <span>Memuat data kuota...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : pkl?.positions?.length > 0 ? (
                                pkl.positions.map((kuotaPkl: any, index: number) => (
                                    <tr key={kuotaPkl.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 text-center text-xs text-slate-400 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {kuotaPkl.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md">
                                                {kuotaPkl.kualifikasi || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {kuotaPkl.desc || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                kuotaPkl.kuota > 0
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                                    : 'bg-red-50 text-red-600 border border-red-200/60'
                                            }`}>
                                                {kuotaPkl.kuota} Slot
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <span className="material-symbols-outlined text-slate-300 !text-4xl">inbox</span>
                                            <span className="text-sm">Tidak ada posisi PKL tersedia</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
>>>>>>> 51c15b5ae5503b85174c5e32672c39c7ee27f21f
