"use client";
import { RootState } from "@/redux/store";
import dayjs from "dayjs";
import { useState } from "react";
import { useSelector } from "react-redux";
import ModalDisposisiPemeliharaan from "./ModalDisposisiPemeliharaan";

export default function ContentDisposisi({ disposisi, handleOpenDetail }: { disposisi: any[], handleOpenDetail: (code: string) => void }) {
    const [showModalDiposisiPemeliharaan, setShowModalDiposisiPemeliharaan] = useState(false);
    const [code, setCode] = useState<string>("");

    const handleOpenDisposisi = (code: string, pelapor: any) => {
        setCode(code);
        setShowModalDiposisiPemeliharaan(true);
    }

    const { user } = useSelector((state: RootState) => state.auth);

    console.log('diposisi', disposisi);
    console.log('user', user);


    return (
        <>
            <h2 className="mb-10 font-bold text-lg lg:text-3xl font-serif">Data Disposisi</h2>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="min-w-full text-sm text-gray-700">
                    <thead className="bg-gray-100 text-gray-900 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Kode</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Tipe Barang</th>
                            <th className="px-4 py-3 text-left">Pelapor</th>
                            <th className="px-4 py-3 text-left">Tanggal Lapor</th>
                            <th className="px-4 py-3">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disposisi.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500">
                                    Belum ada data disposisi Anda
                                </td>
                            </tr>
                        ) : (
                            disposisi.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">
                                        {item.code}
                                    </td>
                                    <td className={`px-4 py-3 font-semibold ${item.status === 'open' ? 'text-bpom-green' : 'text-red-500'}`}>{item.status}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.tipe}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.pelapor?.auth_user?.call_name || item.pelapor?.auth_user?.name}</td>

                                    <td className="px-4 py-3 text-sm ">
                                        {dayjs(item.created_at).format("DD MMM YYYY")}
                                        <br />
                                        {dayjs(item.created_at).format("HH:mm:ss")}
                                    </td>
                                    <td className="px-4 py-3 flex flex-col gap-2 lg:flex-row">
                                        <button
                                            onClick={() => handleOpenDetail(item.code)}
                                            className="btn btn-sm btn-accent btn-soft tooltip tooltip-left" data-tip="Lihat Detail"
                                        >
                                            <span className="hidden lg:block">Detail</span>
                                            <span className="material-symbols-outlined">
                                                visibility
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleOpenDisposisi(item.code, item.disposisi_new_pemeliharaan[0]?.from_user?.auth_user)}
                                            className="btn btn-sm btn-primary btn-soft tooltip tooltip-left" data-tip="Lanjutkan Disposisi"
                                            disabled={item.disposisi_new_pemeliharaan.at(-1)?.to_user?.external_user_id !== user?.id}
                                        >
                                            <span className="hidden lg:block">Lanjut</span>
                                            <span className="material-symbols-outlined">
                                                signature
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <ModalDisposisiPemeliharaan show={showModalDiposisiPemeliharaan} onClose={() => setShowModalDiposisiPemeliharaan(false)} code={code} />
        </>
    )
}