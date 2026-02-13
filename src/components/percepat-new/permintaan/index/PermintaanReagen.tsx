"use client";
import api from "@/utils/api";
import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PermintaanReagenPercepat() {
    const [dataPermintaan, setDataBarang] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [kodeBarangOrNameFilter, setKodeBarangOrNameFilter] = useState("");

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-reagen?
            per_page=${perPage}
            &kode_or_name=${kodeBarangOrNameFilter}
            `)
            .then(({ data }) => {
                setDataBarang(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [perPage, kodeBarangOrNameFilter]);

    const filterKodeOrNameHander = (v: string) => {
        setTimeout(() => {
            setKodeBarangOrNameFilter(v)
        }, 2000);
    }

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Permintaan Reagen</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tampilkan</span>
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        className="select select-bordered w-fit"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>
                {/* <div className="ml-auto flex items-center gap-2">
                    <input type="text" className="ar-input-text-purple" placeholder="Cari Kode Barang / Nama" onChange={e => filterKodeOrNameHander(e.currentTarget.value)} />
                </div> */}
            </div>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Pemohon</th>
                            <th className="px-4 py-3 text-left">Fungsi</th>
                            <th className="px-4 py-3 text-left">KaTim / Penyelia</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Tgl Permintaan</th>
                            <th className="px-4 py-3 text-left">Tgl Penyerahan</th>
                            {/* <th className="px-4 py-3 text-center">##</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {dataPermintaan?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    Belum ada data permintaan
                                </td>
                            </tr>
                        ) : (
                            dataPermintaan?.data?.map((item: any, index: number) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{rowNumber(index)}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.peminta.name}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.bidang?.name || item.bidang_name_auth_external}</td>
                                    <td className={`px-4 py-3`}>{item.bidang?.user?.name || item.katim?.name}</td>
                                    <td className={`px-4 py-3`}>{item.status?.name}</td>
                                    <td className={`px-4 py-3`}>{dayjs(item.created_at).format("DD MMM YYYY")}</td>
                                    <td className={`px-4 py-3`}>{
                                        item.tgl_penyerahan ?
                                            dayjs(item.tgl_penyerahan).format("DD MMM YYYY")
                                            : '-'
                                    }</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Per page selector and links */}
                <div className="flex justify-between items-center m-6">
                    <span>
                        Menampilkan {dataPermintaan?.from} - {dataPermintaan?.to} dari {dataPermintaan?.total} data
                    </span>

                </div>
                <div className="flex justify-end items-center m-4 gap-4">

                    <div className="btn-group">
                        {
                            dataPermintaan?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            // Preserve per_page, status, and petugas parameters when navigating
                                            const url = new URL(link.url, window.location.origin);
                                            url.searchParams.set('per_page', String(perPage));
                                            // if (statusFilter !== "all") {
                                            //     url.searchParams.set('status', statusFilter);
                                            // }
                                            // if (petugasFilter !== "all") {
                                            //     url.searchParams.set('petugas_id', petugasFilter);
                                            // }
                                            // setIsloading(true);
                                            api.get(url.toString())
                                                .then(({ data }) => {
                                                    // setIsloading(false);
                                                    setDataBarang(data);
                                                    setCurrentPage(data?.current_page);
                                                    setPerPage(data?.per_page);
                                                    console.log('test', data);

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
            <div className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left" data-tip="Create New">
                <Link
                    href="/percepat-new/permintaan/form"
                    className="btn btn-primary btn-floating btn-circle hover:scale-110 hover:rotate-[90deg] transition-all duration-200 ease-in-out" >
                    <span className="material-symbols-outlined">
                        add
                    </span>
                </Link>
            </div>
        </>
    )
}