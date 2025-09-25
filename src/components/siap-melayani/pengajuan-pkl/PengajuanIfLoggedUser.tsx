import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { User } from "@/types/auth";
import axios from "@/utils/axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export default function PengajuanIfLoggedUserSiapMelayani({ user }: { user: User }) {
    const dispatch = useDispatch<AppDispatch>()

    const [pengajuan, setPengajuan] = useState<any>(null)

    useEffect(() => {
        axios.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + "/pengajuan-pkl")
            .then(res => {
                setPengajuan(res.data)
                console.log(res.data);
            })
            .catch(err => {
                dispatch(showAlert({ type: "error", message: "Error fetching data pengajuan pkl", description: err || "No Message from Backend" }));
            })
    }, [dispatch])

    return (
        <>
            <div className="max-w-4xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Data Pengajuan PKL</h1>
                <p>Halo <b>{user.name}</b>, berikut adalah data pengajuan PKL Anda</p>

                <table className="table table-zebra overflow-auto">
                    {/* head */}
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Posisi</th>
                            <th>Kulifikasi Jurusan</th>
                            <th>Keterangan</th>
                            <th>Kuota Tersedia</th>
                        </tr>
                    </thead>
                    {/* <tbody>
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
                    </tbody> */}
                </table>
            </div>
        </>
    )
}