import { useState, useEffect } from "react"
import CountUp from "react-countup"
import Link from "next/link"
import api from "@/utils/api"

const AUTH_URL = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH

export default function AdminSuper() {
    const [dataDashboard, setDataDashboard] = useState<any>(null)
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`${AUTH_URL}/api/super/stats`)
                setStats(res.data)
            } catch (e) {
                console.error("Gagal memuat statistik:", e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const cards = [
        { label: "Total Users", value: stats?.total_users, bg: "bg-primary text-primary-content", href: "/admin/super/users" },
        { label: "Aplikasi (Sites)", value: stats?.total_sites, bg: "bg-secondary text-secondary-content", href: "/admin/super/users" },
        { label: "Pegawai", value: stats?.total_pegawai, bg: "bg-accent text-accent-content", href: "/admin/super/users" },
        { label: "Mahasiswa", value: stats?.total_mahasiswa, bg: "bg-info text-info-content", href: "/admin/super/users" },
        { label: "Admin", value: stats?.total_admin, bg: "bg-warning text-warning-content", href: "/admin/super/users" },
        { label: "User Aktif", value: stats?.total_active, bg: "bg-success text-success-content", href: "/admin/super/users" },
        { label: "User Nonaktif", value: stats?.total_inactive, bg: "bg-error text-error-content", href: "/admin/super/users" },
    ]

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 flex items-center">
                <h2 className="text-xl font-semibold text-gray-800 uppercase">Admin Panel Super Admin</h2>
            </div>

            <div className="bg-white rounded-2xl shadow px-8 py-6 mt-2">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {cards.map(c => (
                            <Link key={c.label} href={c.href}
                                className={`${c.bg} rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow`}>
                                <p className="text-sm font-medium opacity-90">{c.label}</p>
                                <p className="text-3xl lg:text-5xl font-bold mt-2">
                                    <CountUp end={c.value || 0} duration={1.5} separator="." />
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Dashboard lama (Siap Melayani) — disembunyikan sementara
            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-2"> ... </div> */}
        </>
    )
}