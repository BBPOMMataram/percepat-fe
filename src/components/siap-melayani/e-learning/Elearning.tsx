"use client"

import api from "@/utils/api"
import { useEffect, useState } from "react"

export default function ElearningSiapMelayani({ category }: { category: string }) {
    const [videos, setVideos] = useState<any>([])

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/elearnings-by-category/${category}`)
            .then(res => {
                setVideos(res.data)
            })
    }, [category])

    return (
        <div id="informasi" className="min-h-screen my-8 flex justify-center items-center flex-col mx-2">
            <h2 className="text-center font-bold text-lg lg:text-3xl font-serif uppercase">E LEARNING {category}</h2>
            <p className="text-center text-sm lg:text-base text-gray-700">Balai Besar Pengawas Obat dan Makanan (BBPOM) di Mataram</p>

            <div className="max-w-4xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate space-y-8">
                {videos?.data?.map((video: any, index: number) => (
                    <div key={index} className="border-b pb-4">
                        <h3 className="text-xl font-semibold">{video.name}</h3>
                        <div className="aspect-video my-3">
                            {isValidUrl(video.link) ? (
                                <iframe
                                    src={video.link}
                                    title={video.name}
                                    className="w-full h-full rounded-lg"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="aspect-video my-3 flex items-center justify-center bg-gray-100 rounded-lg text-slate-500 p-2">
                                    <span>URL bermasalah atau tidak ada video</span>
                                </div>
                            )}
                        </div>
                        <p className="text-slate-600">{video.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}