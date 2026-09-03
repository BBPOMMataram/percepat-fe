"use client";
import api from "@/utils/api";
import { useEffect, useState, useRef, useCallback } from "react";

export default function ListBarangSimpelBmn() {
    const [dataBarang, setDataBarang] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [kodeBarangOrNameFilter, setKodeBarangOrNameFilter] = useState("");
    const [merkFilter, setMerkFilter] = useState("");

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debounce = useCallback((fn: () => void, delay: number) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(fn, delay);
    }, []);

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    useEffect(() => {
        debounce(() => {
            api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-barang-all?
                per_page=${perPage}
                &kode_or_name=${kodeBarangOrNameFilter}
                &merk=${merkFilter}
                `)
                .then(({ data }) => {
                    setDataBarang(data)
                    setCurrentPage(data?.current_page);
                    setPerPage(data?.per_page);
                })
                .catch((err) => {
                    console.log(err);
                });
        }, 500);
    }, [perPage, kodeBarangOrNameFilter, merkFilter, debounce]);

    const filterKodeOrNameHander = (v: string) => {
        setKodeBarangOrNameFilter(v);
    }

    const filterMerkHander = (v: string) => {
        setMerkFilter(v);
    }

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan</h2>
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
                <div className="ml-auto flex items-center gap-2">
                    <input type="text" className="ar-input-text-purple" placeholder="Cari Kode Barang / Nama" onChange={e => filterKodeOrNameHander(e.currentTarget.value)} />
                    <input type="text" className="ar-input-text-purple" placeholder="Cari Merk" onChange={e => filterMerkHander(e.currentTarget.value)} />
                </div>
            </div>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Kode Barang</th>
                            <th className="px-4 py-3 text-left">NUP</th>
                            <th className="px-4 py-3 text-left">Nama</th>
                            <th className="px-4 py-3 text-left">Merk</th>
                            <th className="px-4 py-3 text-left">Kondisi</th>
                            <th className="px-4 py-3 text-left">Lokasi</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataBarang?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    Belum ada data pemeliharaan
                                </td>
                            </tr>
                        ) : (
                            dataBarang?.data?.map((item: any, index: number) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{rowNumber(index)}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.kode}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.nup}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.nama}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.merk}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.kondisi}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.lokasi || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Per page selector and links */}
                <div className="flex justify-end items-center m-4 gap-4">
                    <div className="btn-group">
                        {
                            dataBarang?.links?.map((link: any, index: number) =>
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
        </>
    )
}