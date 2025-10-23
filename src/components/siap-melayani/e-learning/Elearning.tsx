"use client"

import api from "@/utils/api";
import { useEffect, useState } from "react";

export default function ElearningSiapMelayani({ category }: { category: string }) {
    const [videos, setVideos] = useState<any>([])

    function getYoutubeEmbedLink(url: string): string {
        try {
            const parsed = new URL(url);
            let videoId = "";

            // Jika sudah embed → langsung return
            if (parsed.hostname.includes("youtube.com") && parsed.pathname.startsWith("/embed/")) {
                return url;
            }

            // Format: https://www.youtube.com/watch?v=xxxx
            if (parsed.hostname.includes("youtube.com")) {
                videoId = parsed.searchParams.get("v") ?? "";
            }

            // Format: https://youtu.be/xxxx
            else if (parsed.hostname.includes("youtu.be")) {
                videoId = parsed.pathname.slice(1);
            }

            if (!videoId) return ""; // <= selalu string kosong, bukan null
            return `https://www.youtube.com/embed/${videoId}`;
        } catch {
            return ""; // <= selalu string
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
                            {getYoutubeEmbedLink(video.link) ? (
                                <>
                                    <iframe
                                        src={video.link}
                                        title={video.name}
                                        className="w-full h-full rounded-lg"
                                        allowFullScreen
                                    ></iframe>
                                    <a href={video.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center mt-2">
                                        <div className="flex items-center gap-2">
                                            <span>Tonton di </span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                className="w-6 h-6 text-red-600"
                                            >
                                                <path d="M19.615 3.184c.745.196 1.333.78 1.53 1.523C21.5 6.45 21.5 12 21.5 12s0 5.55-.355 7.293a2.095 2.095 0 0 1-1.53 1.523C18.021 21 12 21 12 21s-6.021 0-7.615-.184a2.095 2.095 0 0 1-1.53-1.523C2.5 17.55 2.5 12 2.5 12s0-5.55.355-7.293a2.095 2.095 0 0 1 1.53-1.523C5.979 3 12 3 12 3s6.021 0 7.615.184zM10 8v8l6-4-6-4z" />
                                            </svg>
                                        </div>
                                    </a>
                                </>
                            ) : (
                                <div className="aspect-video my-3 flex items-center justify-center bg-gray-100 rounded-lg text-slate-500 p-2 text-center">
                                    <span>URL bermasalah <br />video tidak ditemukan</span>
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