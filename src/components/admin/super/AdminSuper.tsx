import { useState, useEffect } from "react"
import CountUp from "react-countup"
import Link from "next/link"
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts"
import api from "@/utils/api"

const AUTH_URL = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH

const PIE_COLORS = ["#3b82f6", "#f59e0b"]
const BAR_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#db2777", "#ea580c", "#65a30d", "#0891b2", "#9333ea"]

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

            {/* ===== GRAFIK ===== */}
            {!loading && stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* Grafik 1: Trend registrasi 6 bulan */}
                    <div className="bg-white rounded-2xl shadow px-6 py-5">
                        <h3 className="font-semibold text-gray-800 mb-4">Registrasi User — 6 Bulan Terakhir</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={stats.trend_registrasi || []}>
                                <defs>
                                    <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="bulan" fontSize={12} tickLine={false} />
                                <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="total" name="User Baru"
                                    stroke="#3b82f6" strokeWidth={2} fill="url(#gradReg)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Grafik 2: Distribusi tipe user (pie) */}
                    <div className="bg-white rounded-2xl shadow px-6 py-5">
                        <h3 className="font-semibold text-gray-800 mb-4">Komposisi Tipe User</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={stats.distribusi_tipe || []}
                                    dataKey="total"
                                    nameKey="nama"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    label={({ name, value }: any) => `${name}: ${value}`}
                                >
                                    {(stats.distribusi_tipe || []).map((_: any, i: number) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={28} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Grafik 3: User per aplikasi (bar horizontal) */}
                    <div className="bg-white rounded-2xl shadow px-6 py-5 lg:col-span-2">
                        <h3 className="font-semibold text-gray-800 mb-4">Jumlah User per Aplikasi</h3>
                        {(stats.user_per_site || []).length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-10">Belum ada user yang terhubung ke aplikasi.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(220, (stats.user_per_site?.length || 0) * 42)}>
                                <BarChart data={stats.user_per_site} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                                    <YAxis type="category" dataKey="name" width={140} fontSize={12} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="total" name="Jumlah User" radius={[0, 6, 6, 0]}>
                                        {(stats.user_per_site || []).map((_: any, i: number) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}

            {/* Dashboard lama (Siap Melayani) — disembunyikan sementara
            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-2"> ... </div> */}
        </>
    )
}