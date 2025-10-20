import api from "@/utils/api"
import dayjs from "dayjs"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function AdminPresensiSiapMelayani() {
    const [presensi, setPresensi] = useState<any>([])

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/presensi`)
            .then(res => {
                setPresensi(res.data)
            })
    }, [])

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Presensi PKL</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Siap Melayani</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="w-full overflow-x-auto">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>University</th>
                                <th>Mayor</th>
                                <th>NIM</th>
                                <th>Position</th>
                                <th>Type</th>
                                <th>Datetime</th>
                                <th>Location</th>
                                <th>Photo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                presensi?.data?.map((item: any, index: number) => (
                                    <tr key={item.id} className="">
                                        <td>{(presensi?.current_page - 1) * parseInt(presensi?.per_page) + index + 1}</td>
                                        <td>{item.peserta.pengajuan?.user?.name}</td>
                                        <td>{item.peserta.pengajuan?.user?.email}</td>
                                        <td>{item.peserta.pengajuan?.user?.phone}</td>
                                        <td>{item.peserta.pengajuan?.user?.universitas}</td>
                                        <td>{item.peserta.pengajuan?.user?.jurusan}</td>
                                        <td>{item.peserta.pengajuan?.user?.nim}</td>
                                        <td>{item.peserta.pengajuan?.position?.name || '-'}</td>
                                        <td>{item.mode === "check-in" ? "CI" : "CO"}</td>
                                        <td>{item.created_at ? dayjs(item.created_at).format("dddd, DD MMMM YYYY (HH:mm)") : '-'}</td>
                                        <td className="px-4 py-3 text-xs text-center">
                                            <a
                                                href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                <span className="material-symbols-outlined">
                                                    location_on
                                                </span>
                                            </a>
                                            <div className="text-gray-500 text-[11px] mt-1">
                                                Lat: {item.latitude} <br /> Lng: {item.longitude}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="w-16 h-16 relative">
                                                <Image
                                                    src={item.selfie}
                                                    alt="Selfie"
                                                    fill
                                                    className="object-cover rounded-md border"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                {/* links */}
                <div className="flex justify-end mt-8">
                    <div className="btn-group">
                        {
                            presensi?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            api.get(link.url)
                                                .then(res => {
                                                    setPresensi(res.data)
                                                })
                                        }
                                    }}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                </button>
                            )
                        }
                    </div>
                </div>
            </div>
        </>
    )
}