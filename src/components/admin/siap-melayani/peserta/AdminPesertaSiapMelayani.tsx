import api from "@/utils/api"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

export default function AdminPesertaSiapMelayani() {
    const [peserta, setPeserta] = useState<any>([])

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/peserta`)
            .then(res => {
                setPeserta(res.data)
                console.log('peserta:', res.data);

            })
    }, [])

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Peserta PKL</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Siap Melayani</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="w-full overflow-x-auto">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Name</th>
                                <th>University</th>
                                <th>Mayor</th>
                                <th>NIM</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Position</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Final Report</th>
                                <th>Certificate</th>
                                <th className="text-center">#</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                peserta?.data?.map((item: any, index: number) => (
                                    <tr key={item.id} className="[&>td]:align-top hover:bg-gray-100">
                                        <td>{(peserta?.current_page - 1) * parseInt(peserta?.per_page) + index + 1}</td>
                                        <td>{item.pengajuan?.user?.name}</td>
                                        <td>{item.pengajuan?.user?.universitas}</td>
                                        <td>{item.pengajuan?.user?.jurusan}</td>
                                        <td>{item.pengajuan?.user?.nim}</td>
                                        <td>{item.pengajuan?.user?.email}</td>
                                        <td>{item.pengajuan?.user?.phone}</td>
                                        <td>{item.pengajuan?.position?.name || '-'}</td>
                                        <td>{item.pengajuan?.period_start ? dayjs(item.pengajuan.period_start).format("dddd, DD MMMM YYYY") : '-'}</td>
                                        <td>{item.pengajuan?.period_end ? dayjs(item.pengajuan.period_end).format("dddd, DD MMMM YYYY") : '-'}</td>
                                        <td className="text-center">
                                            {item.laporan_akhir ?
                                                <button onClick={() => {
                                                    const frontendUrl = `/api/proxy/pdf?path=${encodeURIComponent(item.laporan_akhir)}`;
                                                    window.open(frontendUrl, "_blank");
                                                }} className="cursor-pointer">
                                                    <span className="material-symbols-outlined text-bpom-green">
                                                        eye_tracking
                                                    </span>
                                                </button>
                                                : '-'}
                                        </td>
                                        <td className="text-center">
                                            {item.sertifikat ?
                                                <button onClick={() => {
                                                    const frontendUrl = `/api/proxy/pdf?path=${encodeURIComponent(item.sertifikat)}`;
                                                    window.open(frontendUrl, "_blank");
                                                }} className="cursor-pointer">
                                                    <span className="material-symbols-outlined text-bpom-green">
                                                        eye_tracking
                                                    </span>
                                                </button>
                                                : '-'}
                                        </td>
                                        <td>
                                            <button className="btn btn-info btn-circle btn-sm tooltip tooltip-left" data-tip="Upload Sertifikat">
                                                {/* icon upload */}
                                                <span className="material-symbols-outlined !text-sm">
                                                    upload
                                                </span>
                                            </button>
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
                            peserta?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            api.get(link.url)
                                                .then(res => {
                                                    setPeserta(res.data)
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