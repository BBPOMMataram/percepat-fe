import api from "@/utils/api"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"

export default function AdminUserAdminSuper() {
    const [data, setData] = useState<any>([])
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
    const [year, setYear] = useState<number>(new Date().getFullYear())
    const [search, setSearch] = useState<string>("")
    const [fullData, setFullData] = useState<any[] | null>(null)
    const [loadingAll, setLoadingAll] = useState<boolean>(false)
    const [uploading, setUploading] = useState<boolean>(false)
    const [file, setFile] = useState<File | null>(null)
    const [itemsPerPage, setItemsPerPage] = useState<number>(10)
    const [sortColumn, setSortColumn] = useState<'work' | 'late'>('work')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const dispatch = useDispatch()

    const formatSecondsHMS = (value: unknown) => {
        if (value === null || value === undefined || value === '') return '-'
        const total = Number(value)
        if (!Number.isFinite(total)) return '-'
        const secs = Math.max(0, Math.floor(total))
        const hrs = Math.floor(secs / 3600)
        const mins = Math.floor((secs % 3600) / 60)
        const s = secs % 60
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${pad(hrs)}:${pad(mins)}:${pad(s)}`
    }

    // useEffect(() => {
    //     // reset cache of full data when month/year changes
    //     setFullData(null)
    //     setLoadingAll(false)
    //     api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_BEST_EMPLOYEE}/api/kehadiran?m=${month}&y=${year}&per_page=${itemsPerPage}`)
    //         .then(res => {
    //             setData(res.data)
    //         })
    // }, [month, year, itemsPerPage])

    // Load all pages when searching so results include all data, not just current page
    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoadingAll(true)
                const base = `${process.env.NEXT_PUBLIC_BACKEND_URL_BEST_EMPLOYEE}/api/kehadiran?m=${month}&y=${year}`
                // If first page not in cache, fetch it to know pagination
                const firstRes = await api.get(base)
                const firstData = firstRes.data
                const lastPage = firstData?.meta?.last_page || 1
                let items: any[] = Array.isArray(firstData?.data) ? [...firstData.data] : []
                for (let p = 2; p <= lastPage; p++) {
                    const res = await api.get(`${base}&page=${p}`)
                    if (Array.isArray(res.data?.data)) items = items.concat(res.data.data)
                }
                setFullData(items)
            } catch (e) {
                console.error('Load all pages failed', e)
                setFullData([])
            } finally {
                setLoadingAll(false)
            }
        }
        if (search.trim() && fullData === null && !loadingAll) {
            loadAll()
        }
    }, [search, month, year, fullData, loadingAll, itemsPerPage])

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Data Users</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Admin Super</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="w-full overflow-x-auto mt-10">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>NIP</th>
                                <th>Name</th>
                                <th>Bulan</th>
                                <th>Jml Hari Kerja</th>
                                <th>Jml Hari Kerja Pegawai</th>
                                <th>Jml Hari Cuti</th>
                                <th>Jml Hari Lembur</th>
                                <th
                                    className={`cursor-pointer hover:bg-gray-100 select-none ${sortColumn === 'work' ? 'bg-gray-50' : ''}`}
                                    onClick={() => {
                                        if (sortColumn === 'work') {
                                            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
                                        } else {
                                            setSortColumn('work')
                                            setSortOrder('asc')
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        Total Waktu Kerja Pegawai
                                        {sortColumn === 'work' && (sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>)}
                                    </div>
                                </th>
                                <th
                                    className={`cursor-pointer hover:bg-gray-100 select-none ${sortColumn === 'late' ? 'bg-gray-50' : ''}`}
                                    onClick={() => {
                                        if (sortColumn === 'late') {
                                            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
                                        } else {
                                            setSortColumn('late')
                                            setSortOrder('asc')
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        Total Waktu Terlambat
                                        {sortColumn === 'late' && (sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                (() => {
                                    const searching = search.trim().length > 0
                                    if (searching && fullData === null) {
                                        return (
                                            <tr>
                                                <td colSpan={10} className="text-center">Memuat semua data untuk pencarian...</td>
                                            </tr>
                                        )
                                    }
                                    let list: any[] = searching ? (fullData || []) : (data?.data || [])
                                    const q = search.toLowerCase()
                                    const filtered = !searching ? list : list.filter((item: any) => {
                                        const nip = String(item.NIP || '').toLowerCase()
                                        const nama = String(item.Nama || '').toLowerCase()
                                        return nip.includes(q) || nama.includes(q)
                                    })
                                    // Apply sorting for Total Waktu columns
                                    const sorted = [...filtered].sort((a, b) => {
                                        const timeA = sortColumn === 'work'
                                            ? Number(a.Total_Waktu_Kerja_Detik) || 0
                                            : Number(a.Total_Waktu_Terlambat_Detik) || 0
                                        const timeB = sortColumn === 'work'
                                            ? Number(b.Total_Waktu_Kerja_Detik) || 0
                                            : Number(b.Total_Waktu_Terlambat_Detik) || 0
                                        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
                                    })
                                    return sorted.map((item: any, index: number) => (
                                        <tr key={index} className="">
                                            <td>{searching ? index + 1 : ((data?.meta?.current_page - 1) * parseInt(data?.meta?.per_page) + index + 1)}</td>
                                            <td>{item.NIP || '-'}</td>
                                            <td>{item.Nama || '-'}</td>
                                            <td>{item.nama_bulan || '-'}</td>
                                            <td>{item.jumlah_hari_kerja_bulan || '-'}</td>
                                            <td>{item.Jumlah_Hari_Kerja_Pegawai || '-'}</td>
                                            <td>{item.Jumlah_Hari_Cuti || '-'}</td>
                                            <td>{item.Jumlah_Hari_Lembur || '-'}</td>
                                            <td>{formatSecondsHMS(item.Total_Waktu_Kerja_Detik)}</td>
                                            <td>{formatSecondsHMS(item.Total_Waktu_Terlambat_Detik)}</td>
                                        </tr>
                                    ))
                                })()
                            }
                        </tbody>
                    </table>
                </div>
                {/* links */}
                <div className="flex justify-end mt-8">
                    <div className="btn-group">
                        {
                            data?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            api.get(link.url)
                                                .then(res => {
                                                    setData(res.data)
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