"use client"

import axiosInstance from "@/config/axios";
import { faCartArrowDown, faShoppingCart, faTruckLoading } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";

export default function TablePenerimaanAtk(props: any) {
    const [data, setData] = useState<any>()
    const [nameToSearch, setNameToSearch] = useState('')

    const getData = useCallback(async (url = `${props.url}?limit=${props.limit}&name=${nameToSearch}`) => {
        const res = await axiosInstance.get(url)
        setData(res.data);
    }, [nameToSearch, props])

    useEffect(() => {
        getData()

    }, [getData])

    const items = () => {
        let number = 1

        return data?.map((item: any, index: number) => {
            return (
                <tr key={index}>
                    <td>{number++}</td>
                    <td>{item.atk?.name}</td>
                    <td>{item.atk?.satuan}</td>
                    <td>{item.jumlah}</td>
                    <td>{item.vendor}</td>
                    <td>{new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                </tr>
            )
        })
    }

    return !data ?
    //  <BiLoaderCircle className="mx-auto mt-24 text-5xl text-quaternary animate-spin"></BiLoaderCircle>
    <FontAwesomeIcon icon={faTruckLoading} />
        : (
            <div className="mb-4">
                <div className="table-header flex items-center mb-2">
                    <h2 className="text-xl sm:text-2xl xl:text-3xl flex">
                        <FontAwesomeIcon icon={faCartArrowDown} className="mr-2" flip="horizontal" /> {props.title}
                    </h2>
                    <div className="search ml-auto">
                        <input type="text" className="p-2 border border-quaternary focus:outline-none"
                            placeholder="Cari berdasarkan nama"
                            value={nameToSearch}
                            onChange={e => setNameToSearch(e.target.value)}
                            onClick={(e: any) => e.target.select()}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="[&_th]:border [&_th]:border-quaternary text-left">
                            <tr className="bg-secondary [&>th]:p-2">
                                <th>No</th>
                                <th>Nama</th>
                                <th>Satuan</th>
                                <th>Jumlah</th>
                                <th>Vendor</th>
                                <th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="[&_td]:border [&_td]:border-quaternary [&_td]:px-2 [&_td]:py-1">
                            {items()}
                        </tbody>
                    </table>
                </div>
            </div>
        )
}