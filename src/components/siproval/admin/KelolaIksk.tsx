"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

type IkskItem = {
  id: number;
  name: string;
  katim_count: number;
  katim_names: string[];
  tab_count: number;
  updated_at: string | null;
};

type ApiError = { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };

const errorText = (err: unknown, fallback: string) => {
  const e = err as ApiError;
  const firstValidation = e.response?.data?.errors
    ? Object.values(e.response.data.errors)[0]?.[0]
    : undefined;
  return firstValidation || e.response?.data?.message || fallback;
};

export default function KelolaIksk() {
  const { user } = useSelector((state: RootState) => state.auth);
  const authQuery = user?.id ? `?user_id=${user.id}` : "";

  const [iksks, setIksks] = useState<IkskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IkskItem | null>(null);
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<IkskItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${baseUrl}/api/superadmin/kelola-iksk${authQuery}`);
      const list = res.data?.data?.iksks;
      setIksks(Array.isArray(list) ? list : []);
    } catch (err) {
      setErrorMsg(errorText(err, "Gagal memuat daftar IKSK."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return iksks;
    return iksks.filter(
      (i) => i.name.toLowerCase().includes(q) || String(i.id) === q,
    );
  }, [iksks, search]);

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEdit = (item: IkskItem) => {
    setEditing(item);
    setFormName(item.name);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("Nama IKSK wajib diisi.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = editing
        ? await api.put(`${baseUrl}/api/superadmin/kelola-iksk/${editing.id}${authQuery}`, {
            name: formName,
          })
        : await api.post(`${baseUrl}/api/superadmin/kelola-iksk${authQuery}`, { name: formName });
      setSuccessMsg(res.data?.message || "IKSK berhasil disimpan.");
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(errorText(err, "Gagal menyimpan IKSK."));
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
        `${baseUrl}/api/superadmin/kelola-iksk/${deleteTarget.id}${authQuery}`,
      );
      setSuccessMsg(res.data?.message || "IKSK berhasil dihapus.");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setErrorMsg(errorText(err, "Gagal menghapus IKSK."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola IKSK</h1>
          <p className="mt-1 text-xs text-slate-500">
            Lihat, tambah, ubah, atau hapus daftar Indikator Kinerja Sasaran Kegiatan (IKSK).
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d]"
        >
          <Icon icon="solar:add-circle-bold" width={16} />
          Tambah IKSK
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
            <h2 className="text-sm font-bold text-slate-900">Daftar IKSK</h2>
            <p className="text-xs text-slate-500">{iksks.length} IKSK terdaftar</p>
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
              placeholder="Cari IKSK..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-[#005baa] focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat daftar IKSK...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Belum ada IKSK.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">ID</th>
                  <th className="py-3 px-4">Nama IKSK</th>
                  <th className="py-3 px-4 w-44 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((i) => (
                  <tr key={i.id} className="align-top hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{i.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{i.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(i)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Icon icon="solar:pen-bold" width={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(i)}
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
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900">
                {editing ? `Edit IKSK #${editing.id}` : "Tambah IKSK"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500">
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>
            <div className="space-y-3 px-6 py-5">
              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800">
                  {errorMsg}
                </div>
              )}
              <label className="block text-xs font-bold text-slate-700">Nama IKSK</label>
              <textarea
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                rows={4}
                maxLength={255}
                autoFocus
                placeholder="Contoh: Persentase sampel Sediaan Farmasi berisiko yang ditindaklanjuti sesuai ketentuan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#005baa] focus:bg-white focus:outline-none"
              />
              <p className="text-right text-[11px] text-slate-400">{formName.length}/255</p>
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
              <h2 className="text-base font-bold text-slate-900">Hapus IKSK?</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              IKSK <strong>&quot;{deleteTarget.name}&quot;</strong> akan dihapus permanen.
            </p>
            {(deleteTarget.katim_count > 0 || deleteTarget.tab_count > 0) && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                IKSK ini masih terhubung dengan {deleteTarget.katim_count} Katim
                {deleteTarget.tab_count > 0 && ` dan ${deleteTarget.tab_count} tab Google Sheet`}. Penempatan
                tersebut juga akan ikut dihapus.
              </div>
            )}
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

