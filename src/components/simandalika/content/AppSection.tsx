"use client"
import axios from "@/config/axios";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { AppData } from "@/types/app-data";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import AppContainer from "./AppContainer";

// Skeleton card saat loading
const CardSkeleton = () => (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 shadow-md">
        <div className="h-1.5 w-full animate-pulse bg-gray-200" />
        <div className="flex flex-col gap-3 p-6">
            <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-gray-200" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-8 w-28 animate-pulse rounded-full bg-gray-200" />
            </div>
        </div>
    </div>
);

export default function AppSection() {
    const [dataApp, setDataApp] = useState<AppData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        let isMounted = true

        const fetchAppData = async () => {
            try {
                const { data } = await axios(process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + '/api/site')
                if (isMounted) setDataApp(data.data)
            } catch (error) {
                console.log("Error fetching app data:", error)
                dispatch(showAlert({ type: "error", message: "Error fetching app data", description: "Error fetching app data" }))
            }
            if (isMounted) setIsLoading(false)
        }

        setIsLoading(true)
        fetchAppData()

        return () => {
            isMounted = false
        }
    }, [dispatch])

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Judul section */}
            <div className="mb-10 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-bpom-green/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bpom-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-bpom-green" />
                    Inovasi
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                    Aplikasi &amp; Inovasi Kami
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 md:text-lg">
                    Kumpulan inovasi digital Balai Besar POM di Mataram
                    {!isLoading && dataApp.length > 0 && ` — ${dataApp.length} aplikasi siap digunakan`}.
                </p>
                <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-bpom-green to-teal-400" />
            </div>

            {/* Grid card */}
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                    : dataApp.map((app, index) => (
                        <AppContainer key={index} appData={app} />
                    ))
                }
            </div>

            {!isLoading && dataApp.length === 0 && (
                <p className="py-12 text-center text-sm font-medium text-gray-500">
                    Belum ada aplikasi yang terdaftar.
                </p>
            )}
        </div>
    )
}
