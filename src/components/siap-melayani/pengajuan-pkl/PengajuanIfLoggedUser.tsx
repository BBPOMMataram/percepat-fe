import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { User } from "@/types/auth";
import axios from "@/utils/axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import PengajuanPKLTableSiapMelayani from "./PengajuanTable";

export default function PengajuanIfLoggedUserSiapMelayani({ user }: { user: User }) {
    const dispatch = useDispatch<AppDispatch>()

    const [pengajuan, setPengajuan] = useState<any>(null)

    useEffect(() => {
        axios.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + "/api/pengajuan-pkl")
            .then(res => {
                setPengajuan(res.data)
                console.log(res.data);
            })
            .catch(err => {
                dispatch(showAlert({ type: "error", message: "Something error, contact admin !", description: err.response?.data?.message || "No Message from Backend" }));
            })
    }, [dispatch])

    return (
        <>
            <div className="max-w-4xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Data Pengajuan PKL</h1>
                <p>Halo <b>{user.name}</b>, {pengajuan ? 'berikut adalah data pengajuan PKL Anda.' : 'Selamat datang di Aplikasi Siap Melayani, silahkan mengajukan PKL melalui tombol di bawah ini.'}</p>
                {
                    pengajuan ? (
                        <>
                            <PengajuanPKLTableSiapMelayani pengajuan={pengajuan} />
                            {/* FORM UPLOAD LAPORAN AKHIR */}
                            {pengajuan.data[0].peserta?.laporan_akhir ? null : (
                                <div className="flex flex-col lg:flex-row gap-2 justify-end mt-6">
                                    <label tabIndex={0} htmlFor="upload-laporan-akhir" className="btn btn-sm btn-primary w-fit">Upload Laporan Akhir</label>
                                    <input id="upload-laporan-akhir" type="file" className="file-input file-input-bordered file-input-sm w-full max-w-xs" />
                                </div>
                            )}
                        </>
                    )
                        : <button className="btn btn-primary mt-10">Ajukan PKL</button>
                }
            </div>
        </>
    )
}