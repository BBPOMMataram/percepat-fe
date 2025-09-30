"use client"
import { showAlert } from "@/features/alertSlice"
import { AppDispatch } from "@/redux/store"
import axios from "@/utils/axios"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"

export default function StatistikPklSiapMelayani() {
    const dispatch = useDispatch<AppDispatch>()

    const [pkl, setPkl] = useState<any>(null)

    useEffect(() => {
        axios.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + '/api/landing-page')
            .then(res => {
                setPkl(res.data)
            })
            .catch(err => {
                dispatch(showAlert({ type: "error", message: "Error fetching data landing page", description: err || "No Message from Backend" }));
            })
    }, [dispatch])

    return (
        <div id="statistik" className="min-h-screen my-4 flex justify-center items-center flex-col">
            <h2 className="text-center font-bold text-lg lg:text-3xl font-serif">Statistik PKL</h2>
            <p className="text-center text-sm lg:text-base text-gray-700">Data statistik Mahasiswa PKL di Balai Besar POM di Mataram</p>

            <div className="my-10 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">{
                            pkl?.totalPengajuanPkl || <span className="material-symbols-outlined animate-spin">
                                cyclone
                            </span>
                        } Pengajuan</h2>
                        <p>Total pengajuan Mahasiswa PKL di Balai Besar POM di Mataram</p>
                    </div>
                </div><div className="flex-1 card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">{
                            pkl?.totalAktifPkl || <span className="material-symbols-outlined animate-spin">
                                cyclone
                            </span>
                        } Aktif</h2>
                        <p>Total Mahasiswa PKL aktif di Balai Besar POM di Mataram</p>
                    </div>
                </div><div className="flex-1 card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">{
                            pkl?.totalKuota || <span className="material-symbols-outlined animate-spin">
                                cyclone
                            </span>
                        } Kuota Tersedia</h2>
                        <p>Jumlah kuota PKL yang tersedia saat ini di Balai Besar POM di Mataram</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-center font-bold text-lg lg:text-3xl font-serif mb-6">Kuota PKL</h2>
                <table className="table table-zebra overflow-auto">
                    {/* head */}
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Penempatan</th>
                            <th>Kulifikasi Jurusan</th>
                            <th>Keterangan</th>
                            <th>Kuota Tersedia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pkl?.positions?.length > 0 ? pkl.positions.map((kuotaPkl: any, index: number) =>
                            <tr key={kuotaPkl.id}>
                                <td>{++index}</td>
                                <td>{kuotaPkl.name}</td>
                                <td>{kuotaPkl.kualifikasi}</td>
                                <td>{kuotaPkl.desc || '-'}</td>
                                <td className="text-center">{kuotaPkl.kuota}</td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center text-slate-500 py-4">
                                    Tidak ada posisi PKL tersedia
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}