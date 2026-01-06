import { showAlert } from "@/features/alertSlice"
import api from "@/utils/api"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"

export default function AdminPresensiBestEmployee() {
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

    useEffect(() => {
        // reset cache of full data when month/year changes
        setFullData(null)
        setLoadingAll(false)
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_BEST_EMPLOYEE}/api/kehadiran?m=${month}&y=${year}&per_page=${itemsPerPage}`)
            .then(res => {
                setData(res.data)
            })
    }, [month, year, itemsPerPage])

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
                <div className="text-lg font-semibold text-gray-800 uppercase">Data Presensi</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Best Employee</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="flex flex-col mb-4 gap-8">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Bulan</label>
                            <select
                                className="select select-bordered select-xs"
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                            >
                                <option value={1}>Januari</option>
                                <option value={2}>Februari</option>
                                <option value={3}>Maret</option>
                                <option value={4}>April</option>
                                <option value={5}>Mei</option>
                                <option value={6}>Juni</option>
                                <option value={7}>Juli</option>
                                <option value={8}>Agustus</option>
                                <option value={9}>September</option>
                                <option value={10}>Oktober</option>
                                <option value={11}>November</option>
                                <option value={12}>Desember</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Tahun</label>
                            <select
                                className="select select-bordered select-xs"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {Array.from({ length: 4 }).map((_, i) => {
                                    const y = 2025 + i
                                    return (
                                        <option key={y} value={y}>{y}</option>
                                    )
                                })}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Tampilkan</label>
                            <select
                                className="select select-bordered select-xs"
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            >
                                <option value={10}>10 data</option>
                                <option value={25}>25 data</option>
                                <option value={50}>50 data</option>
                                <option value={200}>Semua</option>
                            </select>
                        </div>
                        <div className="w-full md:w-auto md:ml-auto">
                            <input
                                type="text"
                                className="input input-bordered input-sm w-full md:w-64"
                                placeholder="Cari NIP atau Nama..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <form
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
                        onSubmit={async (e) => {
                            e.preventDefault()
                            if (!file) return
                            try {
                                setUploading(true)
                                const form = new FormData()
                                form.append('file', file)
                                const url = `${process.env.NEXT_PUBLIC_BACKEND_URL_BEST_EMPLOYEE}/api/kehadiran/upload`
                                await api.post(url, form, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                })
                                // reload data setelah upload
                                const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_BEST_EMPLOYEE}/api/kehadiran?m=${month}&y=${year}`)
                                setData(res.data)
                                setFullData(null)
                                setFile(null)
                                    ; (document.getElementById('be-import-file') as HTMLInputElement | null)?.value && ((document.getElementById('be-import-file') as HTMLInputElement).value = '')
                                dispatch(showAlert({ type: 'success', message: 'Berhasil mengunggah file presensi', description: 'Data presensi telah diperbarui.' }))
                            } catch (err: any) {
                                console.error('Upload gagal', err)
                                const description = err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat mengunggah file.'
                                dispatch(showAlert({ type: 'error', message: 'Upload gagal', description }))
                            } finally {
                                setUploading(false)
                            }
                        }}
                    >
                        <input
                            id="be-import-file"
                            type="file"
                            accept=".xls,.xlsx,.csv"
                            className="file-input file-input-bordered file-input-sm"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <button
                            type="submit"
                            className={`btn btn-sm btn-primary ${uploading || !file ? 'btn-disabled' : ''}`}
                            disabled={uploading || !file}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>
                </div>
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