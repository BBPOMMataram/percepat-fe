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

    const formLaporanAkhirRef = useRef<HTMLFormElement>(null)

    // AMBIL DATA PENGAJUAN PKL
    useEffect(() => {
        apiBase.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + "/api/pengajuan-pkl")
            .then(res => {
                setPengajuan(res.data)
                console.log(res.data);
            })
            .catch(err => {
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
                    console.log(res.data);

                    // PERBAHARUI DATA TABLE
                    apiBase.get(process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI + "/api/pengajuan-pkl")
                        .then(res => {
                            setPengajuan(res.data)
                            console.log(res.data);
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
        apiBase.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-pkl/${pengajuan.data[0]?.id}`)
            .then(res => {
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                setPengajuan(null)
                console.log(res.data);
            })
            .catch(err => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
            })
    }

    return (
        <>
            <div className="max-w-6xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Pengajuan PKL</h1>
                <p>Halo <b>{user.name}</b>, {pengajuan?.data?.length > 0 ? 'berikut adalah data pengajuan PKL Anda.' : 'Selamat datang di Aplikasi Siap Melayani, silahkan mengajukan PKL melalui tombol di bawah ini.'}</p>
                {
                    pengajuan?.data?.length > 0 ? (
                        <>
                            <PengajuanPKLTableSiapMelayani pengajuan={pengajuan} />

                            <div className="flex items-center gap-2">
                                {/* BUTTON UPDATE */}
                                {pengajuan.data[0]?.status == 'diproses' ? (
                                    <>
                                        <Link href={`/siap-melayani/pengajuan-pkl/form-update/${pengajuan.data[0]?.id}`}>
                                            <button className="btn btn-primary btn-sm rounded-sm ml-4">
                                                <span className="material-symbols-outlined !text-[20px]">
                                                    edit
                                                </span>
                                                <span>Ubah</span>
                                            </button>
                                        </Link>
                                        <button className="btn btn-error btn-sm rounded-sm" onClick={removePengajuan}>
                                            <span className="material-symbols-outlined !text-[20px]">
                                                delete
                                            </span>
                                            <span>Hapus</span>
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn btn-disabled btn-sm rounded-sm ml-4">
                                        <span className="material-symbols-outlined !text-[20px]">
                                            edit
                                        </span>
                                        <span>Ubah</span>
                                    </button>
                                )}

                                {/* FORM UPLOAD LAPORAN AKHIR */}
                                {/* SEMENTARA TAMPILKAN SAAT STATUS SUDAH DITERIMA, NANTI BUAT DENGAN TANGGAL BERAKHIR (JIKA PERLU) */}
                                {pengajuan.data[0]?.status == 'diproses' ? null : (
                                    <form
                                        ref={formLaporanAkhirRef}
                                        onSubmit={uploadLaporanAkhir}
                                        className="flex flex-col lg:flex-row gap-2 justify-end ml-auto">
                                        <label tabIndex={0} htmlFor="laporan_akhir" className="btn btn-sm btn-accent w-fit">
                                            <span className="material-symbols-outlined !text-[20px]">
                                                upload
                                            </span>
                                            <span>Upload Laporan Akhir</span>
                                        </label>
                                        <input
                                            onChange={(e) => {
                                                if (e.target.form) {
                                                    e.target.form.requestSubmit(); // cara paling aman di React
                                                }
                                            }}
                                            id="laporan_akhir" name="laporan_akhir" type="file" className="file-input file-input-bordered file-input-sm w-full max-w-xs" />
                                    </form>
                                )}
                            </div>
                        </>
                    )
                        : <button className="btn btn-primary mt-10"><Link href="/siap-melayani/pengajuan-pkl/form">Ajukan PKL</Link></button>
                }
            </div>
        </>
    )
}