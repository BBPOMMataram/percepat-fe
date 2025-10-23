"use client"

import api from "@/utils/api";
import { useEffect, useState } from "react";

export default function TataTertibPklSiapMelayani() {
    const [content, setContent] = useState<string>();

    const loadData = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/documents/tata_tertib`)
            .then(res => {
                setContent(res.data?.content)
            })
    }

    useEffect(() => {
        loadData()
    })

    return (
        <div id="informasi" className="min-h-screen my-8 flex justify-center items-center flex-col mx-2">
            <h2 className="text-center font-bold text-lg lg:text-3xl font-serif">ATURAN PRAKTIK KERJA LAPANGAN (PKL)</h2>
            <p className="text-center text-sm lg:text-base text-gray-700">Balai Besar Pengawas Obat dan Makanan (BBPOM) di Mataram</p>

            <div className="max-w-4xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate">
                <div dangerouslySetInnerHTML={{ __html: content || '' }}></div>
            </div>
        </div>
    )
}