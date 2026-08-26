"use client";

import { AppData } from "@/types/app-data";
import { User } from "@/types/auth";
import api from "@/utils/api";
import { useEffect, useMemo, useState } from "react";
import CardApp from "./CardApp";

// Skeleton saat loading, biar tidak muncul teks "Loading..." mentah
const CardSkeleton = () => (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-1.5 w-full animate-pulse bg-gray-200" />
        <div className="flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="mt-2 h-10 w-full animate-pulse rounded-xl bg-gray-200" />
        </div>
    </div>
);

export default function OurApps({ user }: { user: User | null }) {
    const [dataApp, setDataApp] = useState<AppData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [query, setQuery] = useState("")

    const fetchAppData = async () => {
        try {
            const { data } = await api(process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + '/api/site')
            setDataApp(data.data)
        } catch (error) {
            console.log("Error fetching app data:", error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        setIsLoading(true)
        fetchAppData()
    }, [])

    const adminApps = user?.sites ?? []
    const isAdmin = user?.role?.level == "admin" && adminApps.length > 0

    const filteredApps = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return dataApp
        return dataApp.filter(app =>
            (app.name ?? '').toLowerCase().includes(q) ||
            (app.desc ?? '').toLowerCase().includes(q) ||
            (app.pic ?? '').toLowerCase().includes(q)
        )
    }, [dataApp, query])

    return (
        <div className="flex flex-col">
            {isAdmin &&
                <div className="mb-6 rounded-2xl bg-white p-6 shadow md:p-8">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 md:text-xl">Aplikasi yang Anda Kelola</h2>
                            <p className="mt-0.5 text-sm text-gray-500">Akses panel administrator untuk aplikasi berikut.</p>
                        </div>
                        <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                            {adminApps.length} aplikasi
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {adminApps.map((app, index) => (
                            <CardApp key={index} appData={app} isAdmin={true} />
                        ))}
                    </div>
                </div>
            }

            <div className="rounded-2xl bg-white p-6 shadow md:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 md:text-xl">Aplikasi Kami</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Kumpulan aplikasi internal BBPOM di Mataram.
                            {!isLoading && dataApp.length > 0 && ` Tersedia ${dataApp.length} aplikasi.`}
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari aplikasi..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : filteredApps.map((app, index) => (
                            <CardApp key={index} appData={app} />
                        ))
                    }
                </div>

                {!isLoading && filteredApps.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {dataApp.length === 0 ? 'Belum ada aplikasi yang terdaftar.' : `Tidak ada aplikasi yang cocok dengan "${query}".`}
                        </p>
                        {dataApp.length > 0 && (
                            <button onClick={() => setQuery("")} className="mt-2 text-sm font-semibold text-sky-600 hover:underline">
                                Reset pencarian
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
