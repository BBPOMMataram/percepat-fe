"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

type IkskOption = { id: number; name: string };
type UserOption = { id: string; name: string; email: string };
type KatimItem = {
  user_id: string;
  name: string;
  email: string;
  iksks: (IkskOption & { katim_id: number })[];
};

type ApiError = { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };

const errorText = (err: unknown, fallback: string) => {
  const e = err as ApiError;
  const firstValidation = e.response?.data?.errors
    ? Object.values(e.response.data.errors)[0]?.[0]
    : undefined;
  return firstValidation || e.response?.data?.message || fallback;
};

export default function KelolaUser() {
  const { user } = useSelector((state: RootState) => state.auth);
  const authQuery = user?.id ? `?user_id=${user.id}` : "";

  const [katims, setKatims] = useState<KatimItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [iksks, setIksks] = useState<IkskOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formUserId, setFormUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [formIkskIds, setFormIkskIds] = useState<number[]>([]);
  const [ikskSearch, setIkskSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<KatimItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${baseUrl}/api/superadmin/kelola-user${authQuery}`);
      const data = res.data?.data || {};
      setKatims(Array.isArray(data.katims) ? data.katims : []);
      setUsers(Array.isArray(data.users) ? data.users : []);
      setIksks(Array.isArray(data.iksks) ? data.iksks : []);
    } catch (err) {
      setErrorMsg(errorText(err, "Gagal memuat data Katim."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredKatims = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return katims;
    return katims.filter(
      (k) =>
        k.name?.toLowerCase().includes(q) ||
        k.email?.toLowerCase().includes(q) ||
        k.iksks.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [katims, search]);

  const katimUserIds = useMemo(() => new Set(katims.map((k) => k.user_id)), [katims]);

  const availableUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return users
      .filter((u) => !katimUserIds.has(u.id))
      .filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      .slice(0, 50);
  }, [users, katimUserIds, userSearch]);

  const filteredIksks = useMemo(() => {
    const q = ikskSearch.toLowerCase().trim();
    return iksks.filter((i) => !q || i.name.toLowerCase().includes(q) || String(i.id) === q);
  }, [iksks, ikskSearch]);

  const openAdd = () => {
    setEditingUserId(null);
    setFormUserId("");
    setUserSearch("");
    setFormIkskIds([]);
    setIkskSearch("");
    setModalOpen(true);
  };

  const openEdit = (k: KatimItem) => {
    setEditingUserId(k.user_id);
    setFormUserId(k.user_id);
    setFormIkskIds(k.iksks.map((i) => i.id));
    setIkskSearch("");
    setModalOpen(true);
  };

  const toggleIksk = (id: number) => {
    setFormIkskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId) {
      setErrorMsg("Pilih user yang akan dijadikan Katim.");
      return;
    }
    if (formIkskIds.length === 0) {
      setErrorMsg("Pilih minimal satu IKSK.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = editingUserId
        ? await api.put(`${baseUrl}/api/superadmin/kelola-user/${editingUserId}${authQuery}`, {
            iksk_ids: formIkskIds,
          })
        : await api.post(`${baseUrl}/api/superadmin/kelola-user${authQuery}`, {
            user_id: formUserId,
            iksk_ids: formIkskIds,
          });
      setSuccessMsg(res.data?.message || "Data Katim berhasil disimpan.");
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(errorText(err, "Gagal menyimpan data Katim."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.delete(
        `${baseUrl}/api/superadmin/kelola-user/${deleteTarget.user_id}${authQuery}`,
      );
      setSuccessMsg(res.data?.message || "Katim berhasil dihapus.");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setErrorMsg(errorText(err, "Gagal menghapus Katim."));
    } finally {
      setDeleting(false);
    }
  };

  const selectedUser = users.find((u) => u.id === formUserId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola User (Katim)</h1>
          <p className="mt-1 text-xs text-slate-500">
            Tambah, ubah, atau hapus Ketua Tim beserta penempatan IKSK yang menjadi tanggung jawabnya.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d]"
        >
          <Icon icon="solar:user-plus-bold" width={16} />
          Tambah Katim
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}
      {errorMsg && !modalOpen && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-700">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar Katim</h2>
            <p className="text-xs text-slate-500">{katims.length} Katim terdaftar</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Icon
              icon="solar:magnifer-linear"
              width={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau IKSK..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-[#005baa] focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat data Katim...</p>
          </div>
        ) : filteredKatims.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Belum ada data Katim.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-64">Nama Katim</th>
                  <th className="py-3 px-4">Penempatan IKSK</th>
                  <th className="py-3 px-4 w-44 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKatims.map((k, idx) => (
                  <tr key={k.user_id} className="align-top hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{k.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{k.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {k.iksks.map((i) => (
                          <span
                            key={i.katim_id}
                            title={i.name}
                            className="inline-flex max-w-md items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-800"
                          >
                            <strong>{i.id}.</strong>
                            <span className="truncate">{i.name}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(k)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Icon icon="solar:pen-bold" width={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(k)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={14} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleSave}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingUserId ? "Edit Penempatan IKSK Katim" : "Tambah Katim"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500">
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">1. User / Pegawai</label>
                {editingUserId ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
                    <div className="font-bold text-slate-900">
                      {katims.find((k) => k.user_id === editingUserId)?.name}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {katims.find((k) => k.user_id === editingUserId)?.email}
                    </div>
                  </div>
                ) : selectedUser ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#005baa] bg-blue-50 px-3.5 py-2.5 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{selectedUser.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{selectedUser.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormUserId("")}
                      className="text-xs font-semibold text-[#005baa]"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200">
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Cari nama atau email pegawai..."
                      className="w-full rounded-t-xl border-b border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <div className="max-h-48 overflow-y-auto">
                      {availableUsers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">User tidak ditemukan.</div>
                      ) : (
                        availableUsers.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => setFormUserId(u.id)}
                            className="block w-full px-3.5 py-2 text-left text-xs hover:bg-slate-50"
                          >
                            <span className="font-semibold text-slate-800">{u.name}</span>
                            <span className="ml-2 font-mono text-[11px] text-slate-500">{u.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">2. Penempatan IKSK</label>
                  <span className="text-[11px] font-semibold text-[#005baa]">
                    {formIkskIds.length} dipilih
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200">
                  <input
                    value={ikskSearch}
                    onChange={(e) => setIkskSearch(e.target.value)}
                    placeholder="Cari IKSK..."
                    className="w-full rounded-t-xl border-b border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                  <div className="max-h-64 overflow-y-auto">
                    {filteredIksks.map((i) => (
                      <label
                        key={i.id}
                        className="flex cursor-pointer items-start gap-2.5 px-3.5 py-2 text-xs hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={formIkskIds.includes(i.id)}
                          onChange={() => toggleIksk(i.id)}
                          className="mt-0.5 accent-[#005baa]"
                        />
                        <span className="text-slate-700">
                          <strong>{i.id}.</strong> {i.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2 text-xs font-semibold text-white hover:bg-[#004b8d] disabled:opacity-50"
              >
                {saving && <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Icon icon="solar:trash-bin-trash-bold" width={20} />
              </span>
              <h2 className="text-base font-bold text-slate-900">Hapus Katim?</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              <strong>{deleteTarget.name}</strong> akan dihapus dari daftar Katim beserta{" "}
              {deleteTarget.iksks.length} penempatan IKSK dan anggota timnya. Akun user tidak ikut terhapus.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

