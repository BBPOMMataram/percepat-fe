"use client"

import api from "@/utils/api";
import { useEffect, useState } from "react";

export default function TataTertibPklSiapMelayani() {
    const [content, setContent] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);

    const loadData = () => {
        setLoading(true);
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/documents/tata_tertib`)
            .then(res => {
                setContent(res.data?.content);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }

    useEffect(() => {
        loadData();
    }, []);

    return (
        <section id="informasi" className="w-full max-w-4xl mx-auto py-8 px-2">
            <div className="text-center mb-8">
                <span className="text-xs font-semibold text-bpom-blue uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Ketentuan & Tata Tertib
                </span>
                <h1 className="text-2xl lg:text-3xl font-bold font-serif text-slate-800 mt-3 tracking-tight">
                    ATURAN PRAKTIK KERJA LAPANGAN (PKL)
                </h1>
                <p className="text-sm lg:text-base text-slate-500 mt-1">
                    Balai Besar Pengawas Obat dan Makanan di Mataram
                </p>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 md:p-10">
                {loading ? (
                    <div className="py-16 text-center text-slate-400">
                        <span className="material-symbols-outlined animate-spin text-bpom-blue !text-3xl">progress_activity</span>
                        <p className="text-sm text-slate-500 mt-2">Memuat dokumen tata tertib...</p>
                    </div>
                ) : (
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: content || '' }}></div>
                    </div>
                )}
            </div>
        </section>
    );
}