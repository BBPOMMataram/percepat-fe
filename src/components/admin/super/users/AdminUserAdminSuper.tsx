import api from "@/utils/api"
import { useEffect, useState, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"

const AUTH_URL = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH

interface Site { id: number; name: string }
interface Role { id: number; level: string; description: string }
interface UserRow {
    id: string
    name: string
    email: string
    call_name?: string | null
    is_active: number | boolean
    role?: Role | null
    sites?: Site[]
    phones?: { id?: number; phone_number?: string; is_main?: boolean }[]
    employee?: { nip?: string; unit_kerja?: string } | null
    student?: { nim?: string; university?: string } | null
}

export default function AdminUserAdminSuper() {
    const [users, setUsers] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [page, setPage] = useState(1)
    const dispatch = useDispatch()
    const { user: authUser } = useSelector((s: any) => s.auth)
    const myIdRef = { current: authUser?.id as string | undefined }

    // master data
    const [roles, setRoles] = useState<Role[]>([])
    const [sites, setSites] = useState<Site[]>([])

    // edit modal state
    const [editing, setEditing] = useState<UserRow | null>(null)
    const [form, setForm] = useState({ name: "", email: "", call_name: "", role_id: "", is_active: true, site_ids: [] as number[], password: "", password_confirmation: "" })
    const [saving, setSaving] = useState(false)
    const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null)

    const notify = (ok: boolean, text: string) => {
        setFlash({ ok, text })
        setTimeout(() => setFlash(null), 3500)
    }

    const loadUsers = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const params = new URLSearchParams({ page: String(page), per_page: "15" })
            if (search.trim()) params.set("search", search.trim())
            if (roleFilter) params.set("role_id", roleFilter)
            if (typeFilter) params.set("type", typeFilter)
            const res = await api.get(`${AUTH_URL}/api/super/users?${params.toString()}`)
            setUsers(res.data)
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.status === 403
                ? "Akses ditolak: hanya superadmin."
                : "Gagal memuat data users.")
        } finally {
            setLoading(false)
        }
    }, [page, search, roleFilter, typeFilter])

    useEffect(() => { loadUsers() }, [loadUsers])

    useEffect(() => {
        // master data untuk form (roles & sites) — pakai endpoint yang sudah ada
        api.get(`${AUTH_URL}/api/site`).then(r => setSites(r.data?.data || r.data || [])).catch(() => {})
        api.get(`${AUTH_URL}/api/users`).then(r => {
            // roles tidak ada endpoint khusus; ambil dari response index jika perlu.
        }).catch(() => {})
    }, [])

    const openEdit = (u: UserRow) => {
        setEditing(u)
        setForm({
            name: u.name || "",
            email: u.email || "",
            call_name: u.call_name || "",
            role_id: String(u.role?.id ?? ""),
            is_active: !!u.is_active,
            site_ids: (u.sites || []).map((s: any) => Number(s.id)),
            password: "",
            password_confirmation: "",
        })
    }

    const toggleSite = (id: number) => {
        setForm(prev => ({
            ...prev,
            site_ids: prev.site_ids.includes(id)
                ? prev.site_ids.filter(s => s !== id)
                : [...prev.site_ids, id],
        }))
    }

    const saveEdit = async () => {
        if (!editing) return
        setSaving(true)
        try {
            const payload: any = {
                name: form.name,
                email: form.email,
                call_name: form.call_name,
                role_id: Number(form.role_id),
                is_active: form.is_active,
                site_ids: form.site_ids,
            }
            if (form.password && form.password === form.password_confirmation) {
                payload.password = form.password
                payload.password_confirmation = form.password_confirmation
            } else if (form.password && form.password !== form.password_confirmation) {
                notify(false, "Konfirmasi password tidak cocok.")
                setSaving(false)
                return
            }
            await api.patch(`${AUTH_URL}/api/super/users/${editing.id}`, payload)
            notify(true, `User "${form.name}" berhasil diperbarui.`)
            setEditing(null)
            loadUsers()
        } catch (e: any) {
            const errs = (e?.response?.data?.errors || {}) as Record<string, string[]>
            const msg = e?.response?.data?.message || Object.values(errs)?.[0]?.[0] || "Gagal menyimpan perubahan."
            notify(false, String(msg))
        } finally {
            setSaving(false)
        }
    }

    const deleteUser = async (u: UserRow) => {
        if (!confirm(`Hapus user "${u.name}" (${u.email})?\n\nTindakan ini PERMANEN dan tidak bisa dibatalkan!`)) return
        setSaving(true)
        try {
            await api.delete(`${AUTH_URL}/api/users/${u.id}`)
            notify(true, `User "${u.name}" berhasil dihapus.`)
            loadUsers()
        } catch (e: any) {
            const errs = (e?.response?.data?.errors || {}) as Record<string, string[]>
            const msg = e?.response?.data?.message || Object.values(errs)?.[0]?.[0] || "Gagal menghapus user."
            notify(false, String(msg))
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Data Users</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Admin Super</h2>
            </div>

            <div className="bg-white rounded-2xl shadow px-8 py-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <div className="flex flex-1 gap-2">
                        <input
                            type="text"
                            placeholder="Cari nama / email..."
                            className="input input-bordered w-full md:w-72"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') { setPage(1); setSearch(searchInput) }
                            }}
                        />
                        <button className="btn btn-primary" onClick={() => { setPage(1); setSearch(searchInput) }}>
                            Cari
                        </button>
                    </div>
                    <select
                        className="select select-bordered md:w-56"
                        value={roleFilter}
                        onChange={e => { setPage(1); setRoleFilter(e.target.value) }}
                    >
                        <option value="">Semua Role</option>
                        <option value="1">Superadmin</option>
                        <option value="2">Admin</option>
                        <option value="3">User</option>
                    </select>
                    <select
                        className="select select-bordered md:w-48"
                        value={typeFilter}
                        onChange={e => { setPage(1); setTypeFilter(e.target.value) }}
                    >
                        <option value="">Semua Tipe</option>
                        <option value="pegawai">Pegawai</option>
                        <option value="mahasiswa">Mahasiswa</option>
                        <option value="umum">Umum</option>
                    </select>
                </div>

                {flash && (
                    <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${flash.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {flash.text}
                    </div>
                )}
                {error && (
                    <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium bg-red-100 text-red-700">{error}</div>
                )}

                <div className="w-full overflow-x-auto mt-6">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama</th>
                                <th>Email</th>
                                <th>No HP</th>
                                <th>Tipe</th>
                                <th>NIP / NIM</th>
                                <th>Role</th>
                                <th>Akses Aplikasi (Sites)</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} className="text-center py-6">Memuat...</td></tr>
                            ) : (users?.data || []).length === 0 ? (
                                <tr><td colSpan={10} className="text-center py-6">Tidak ada data.</td></tr>
                            ) : (
                                (users.data as UserRow[]).map((u, index) => (
                                    <tr key={u.id}>
                                        <td>{(loading || !users?.meta) ? index + 1 : ((users.meta.current_page - 1) * (users.meta.per_page || 15) + index + 1)}</td>
                                        <td className="font-medium">{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            {(() => {
                                                const main = (u.phones || []).find(p => p.is_main) || (u.phones || [])[0]
                                                return main?.phone_number || '-'
                                            })()}
                                        </td>
                                        <td>
                                            {u.employee ? (
                                                <span className="badge badge-info badge-sm">Pegawai</span>
                                            ) : u.student ? (
                                                <span className="badge badge-warning badge-sm">Mahasiswa</span>
                                            ) : (
                                                <span className="badge badge-ghost badge-sm">Umum</span>
                                            )}
                                        </td>
                                        <td>{u.employee?.nip || u.student?.nim || '-'}</td>
                                        <td>
                                            <span className={`badge ${u.role?.level === 'superadmin' ? 'badge-secondary' : u.role?.level === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                                                {u.role?.level || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {(u.sites || []).length === 0
                                                    ? <span className="text-gray-400">-</span>
                                                    : u.sites!.map((s: any) => (
                                                        <span key={s.id} className="badge badge-outline badge-sm">{s.name}</span>
                                                    ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="btn btn-sm btn-outline btn-primary" onClick={() => openEdit(u)}>
                                                    Kelola
                                                </button>
                                                {u.id !== myIdRef.current && (
                                                    <button className="btn btn-sm btn-outline btn-error" onClick={() => deleteUser(u)} disabled={saving}>
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end mt-8">
                    <div className="btn-group">
                        <button className={`btn btn-sm ${!users?.links?.prev && 'btn-disabled'}`} onClick={() => setPage(p => Math.max(1, p - 1))}>
                            « Prev
                        </button>
                        <button className="btn btn-sm btn-ghost">
                            Hal. {users?.meta?.current_page ?? 1} / {users?.meta?.last_page ?? 1}
                        </button>
                        <button className={`btn btn-sm ${(users?.meta?.current_page ?? 1) >= (users?.meta?.last_page ?? 1) && 'btn-disabled'}`} onClick={() => setPage(p => p + 1)}>
                            Next »
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Kelola User */}
            {editing && (
                <dialog className="modal modal-open" style={{ zIndex: 60 }}>
                    <div className="modal-box max-w-2xl bg-white rounded-2xl">
                        <h3 className="font-bold text-lg">Kelola User: {editing.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

                            <div className="form-control">
                                <label className="label"><span className="label-text">Nama</span></label>
                                <input type="text" className="input input-bordered" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Email</span></label>
                                <input type="email" className="input input-bordered" value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Call Name</span></label>
                                <input type="text" className="input input-bordered" value={form.call_name}
                                    onChange={e => setForm(f => ({ ...f, call_name: e.target.value }))} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Role</span></label>
                                <select className="select select-bordered" value={form.role_id}
                                    onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}>
                                    <option value="">— Pilih —</option>
                                    <option value="1">Superadmin</option>
                                    <option value="2">Admin</option>
                                    <option value="3">User</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Password Baru (opsional)</span></label>
                                <input type="password" className="input input-bordered" value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Konfirmasi Password</span></label>
                                <input type="password" className="input input-bordered" value={form.password_confirmation}
                                    onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))} />
                            </div>
                            <div className="form-control col-span-full">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <span className="label-text font-medium">Status Aktif</span>
                                    <input type="checkbox" className="toggle toggle-success" checked={form.is_active}
                                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                    <span className="label-text-alt">{form.is_active ? "Aktif" : "Nonaktif"}</span>
                                </label>
                            </div>
                            <div className="col-span-full">
                                <label className="label"><span className="label-text font-medium">Akses Aplikasi</span></label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {(sites.length > 0 ? sites : [
                                        { id: 1, name: 'PERCEPAT' }, { id: 10, name: 'SIAP MELAYANI' },
                                        { id: 4, name: 'SIMPEL BMN' }, { id: 12, name: 'Best Employee' },
                                        { id: 13, name: 'SIMAKO' },
                                    ]).map((s: any) => (
                                        <label key={s.id} className={`cursor-pointer badge badge-lg gap-2 ${form.site_ids.includes(Number(s.id)) ? 'badge-primary' : 'badge-outline'}`}>
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-xs"
                                                checked={form.site_ids.includes(Number(s.id))}
                                                onChange={() => toggleSite(Number(s.id))}
                                            />
                                            {s.name}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Centang aplikasi yang bisa diakses user ini sebagai admin.
                                </p>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setEditing(null)} disabled={saving}>Batal</button>
                            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                                {saving ? <span className="loading loading-spinner loading-sm"></span> : null}
                                Simpan
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop" onClick={() => !saving && setEditing(null)}>
                        <button>close</button>
                    </form>
                </dialog>
            )}
        </>
    )
}
