"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

type SpreadsheetItem = {
  id: number;
  name: string;
  spreadsheet_id: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
};

// Helper untuk mengekstrak Spreadsheet ID dari link URL penuh
function parseSpreadsheetId(val: string): string {
  const trimmed = val.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return match[1];
  }
  return trimmed;
}

export default function SyncSpreadsheet() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<number | "">("");
  const [spreadsheetInput, setSpreadsheetInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // State untuk konfirmasi hapus spreadsheet
  const [spreadsheetToDelete, setSpreadsheetToDelete] = useState<SpreadsheetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSpreadsheets();
    }
  }, [user?.id]);

  const fetchSpreadsheets = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.get(
        `${baseUrl}/api/superadmin/sinkronisasi-spreadsheet${query}`
      );
      const data = res.data;
      let list: SpreadsheetItem[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.spreadsheets)) {
        list = data.spreadsheets;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      }
      setSpreadsheets(list);
      if (list.length > 0 && selectedSpreadsheetId === "") {
        setSelectedSpreadsheetId(list[0].id);
        setSpreadsheetInput(list[0].spreadsheet_id);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal memuat data spreadsheet dari server."
      );
      setSpreadsheets([]);
    } finally {
      setLoading(false);
    }
  };

  const detectedId = parseSpreadsheetId(spreadsheetInput);
  const isFullUrl = spreadsheetInput.includes("/spreadsheets/d/");

  const handleSelectSpreadsheet = (id: number) => {
    setSelectedSpreadsheetId(id);
    const target = spreadsheets.find((s) => s.id === id);
    if (target) {
      setSpreadsheetInput(target.spreadsheet_id);
    }
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("Fungsi Sinkronisasi Google Sheets API telah dinonaktifkan. Silakan gunakan menu 'Kelola Akses RHPK'.");
    return;
  };

  const handleDeleteConfirm = async () => {
    if (!spreadsheetToDelete) return;
    setIsDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.delete(
        `${baseUrl}/api/superadmin/sinkronisasi-spreadsheet/${spreadsheetToDelete.id}${query}`
      );

      setSuccessMsg(
        res.data?.message || `Spreadsheet "${spreadsheetToDelete.name}" berhasil dihapus.`
      );
      setSpreadsheetToDelete(null);
      fetchSpreadsheets();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal menghapus spreadsheet dari sistem."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Sinkronisasi Spreadsheet (Nonaktif)
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Modul sinkronisasi Google Sheets API telah dinonaktifkan dan digantikan dengan sistem tabel mandiri di Kelola Akses RHPK.
        </p>
      </div>

      {/* Migration Notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Icon icon="solar:danger-triangle-bold" width={22} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                Fitur Sinkronisasi Google Sheets API Dinonaktifkan
              </h2>
              <p className="mt-0.5 text-xs text-amber-800">
                Sistem SIPROVAL kini menggunakan modul mandiri tanpa Google API. Unggah file Excel langsung di menu <strong>Kelola Akses RHPK</strong>.
              </p>
            </div>
          </div>
          <a
            href="/siproval/admin/kelola-akses-rhpk"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#004b8d] shrink-0"
          >
            <Icon icon="solar:document-medicine-bold" width={16} />
            Buka Kelola Akses RHPK
          </a>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-700 hover:text-red-900">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {/* Panduan Pengisian URL Spreadsheet */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white p-5 text-slate-700 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-2 text-[#005baa]">
            <Icon icon="solar:info-circle-bold" width={22} height={22} />
          </div>
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">
              Cara Menyalin Link & Pengisian Google Spreadsheet
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Anda dapat langsung menyalin (*copy*) seluruh URL dokumen dari address bar browser, sistem akan **secara otomatis mengambil potongan ID unik** yang berada di antara <code className="bg-blue-100/70 text-blue-800 px-1.5 py-0.5 rounded font-mono font-semibold">/d/</code> dan <code className="bg-blue-100/70 text-blue-800 px-1.5 py-0.5 rounded font-mono font-semibold">/edit</code>:
            </p>
            <div className="rounded-xl border border-blue-200 bg-white p-3 font-mono text-[11px] text-slate-500 overflow-x-auto">
              https://docs.google.com/spreadsheets/d/<span className="bg-amber-100 text-amber-900 font-bold px-1 rounded border border-amber-300">18O8LbP0HgzrUS5xXQ8Xp98o77pJxgTmT4oPbn5lCVgA</span>/edit?usp=sharing
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Icon icon="solar:check-read-linear" width={14} />
                Mendukung paste full link URL
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Icon icon="solar:check-read-linear" width={14} />
                Mendukung paste ID spreadsheet langsung
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                <Icon icon="solar:shield-warning-bold" width={14} />
                Pastikan dokumen sudah di-share ke Service Account SIPROVAL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Input Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-50 p-2 text-[#005baa]">
            <Icon icon="solar:pen-new-square-bold" width={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Perbarui Link / ID Spreadsheet</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pilih dokumen spreadsheet yang ingin diganti, lalu masukkan tautan (*link*) Google Spreadsheet atau ID dokumen baru:
            </p>
          </div>
        </div>

        <form onSubmit={handleSyncSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Pilih Dokumen Spreadsheet yang Akan Diperbarui:
            </label>
            <select
              value={selectedSpreadsheetId}
              onChange={(e) => handleSelectSpreadsheet(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none font-medium"
              required
            >
              <option value="" disabled>-- Pilih Spreadsheet --</option>
              {spreadsheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (ID: {s.spreadsheet_id.substring(0, 15)}...)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. Link URL Google Spreadsheet atau Spreadsheet ID Baru:
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Icon
                  icon="solar:link-minimalistic-2-linear"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  width={18}
                />
                <input
                  type="text"
                  value={spreadsheetInput}
                  onChange={(e) => setSpreadsheetInput(e.target.value)}
                  placeholder="Contoh: https://docs.google.com/spreadsheets/d/18O8LbP0.../edit"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={syncing || !selectedSpreadsheetId}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:opacity-50"
              >
                <Icon
                  icon={syncing ? "solar:refresh-circle-linear" : "solar:pen-new-square-bold"}
                  width={16}
                  className={syncing ? "animate-spin" : ""}
                />
                {syncing ? "Menyimpan Perubahan..." : "Perbarui Spreadsheet"}
              </button>
            </div>
          </div>

          {/* Live Preview ID Terdeteksi */}
          {spreadsheetInput.trim() && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">ID Terdeteksi:</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono font-semibold text-blue-800 text-[11px]">
                <Icon icon="solar:check-circle-bold" width={14} className="text-blue-600" />
                {detectedId}
              </span>
              {isFullUrl && (
                <span className="text-[11px] text-emerald-600 font-medium">
                  (Otomatis dipotong dari URL dokumen)
                </span>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Spreadsheet List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Spreadsheet Terdaftar
              </h2>
              <p className="text-xs text-slate-500">
                Daftar Google Spreadsheet yang tersimpan dan aktif di SIPROVAL.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#005baa]">
              {spreadsheets.length} Dokumen
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat spreadsheet terdaftar...</p>
          </div>
        ) : spreadsheets.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Belum ada spreadsheet yang terdaftar.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Dokumen</th>
                  <th className="py-3 px-4">Spreadsheet ID</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-40">Terdaftar Pada</th>
                  <th className="py-3 px-4 w-52 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spreadsheets.map((item, idx) => (
                  <tr key={item.id} className={`transition ${selectedSpreadsheetId === item.id ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                    <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.name}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {item.spreadsheet_id}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        ● Aktif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {item.created_at || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectSpreadsheet(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#005baa]/30 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-[#005baa] transition hover:bg-blue-100"
                          title="Pilih spreadsheet ini untuk diperbarui ID-nya"
                        >
                          <Icon icon="solar:pen-bold" width={14} />
                          <span>Ganti ID</span>
                        </button>

                        <a
                          href={`https://docs.google.com/spreadsheets/d/${item.spreadsheet_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#005baa]"
                          title="Buka dokumen di Google Spreadsheet"
                        >
                          <Icon icon="solar:plain-outline" width={14} />
                          <span>Buka</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSpreadsheetToDelete(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800"
                          title="Hapus spreadsheet ini dari sistem SIPROVAL"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={14} />
                          <span>Hapus</span>
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

      {/* Modal Konfirmasi Hapus Spreadsheet */}
      {spreadsheetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="rounded-full bg-rose-100 p-2.5">
                <Icon icon="solar:trash-bin-trash-bold" width={24} height={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Dokumen Spreadsheet?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1 mb-5">
              <p className="font-semibold text-slate-900">{spreadsheetToDelete.name}</p>
              <p className="font-mono text-[11px] text-slate-500 break-all">
                ID: {spreadsheetToDelete.spreadsheet_id}
              </p>
              <p className="text-[11px] text-rose-600 pt-1">
                Catatan: Semua konfigurasi tab dan permission yang terhubung dengan spreadsheet ini juga akan dibersihkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSpreadsheetToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <Icon icon="solar:trash-bin-trash-bold" width={16} />
                )}
                <span>{isDeleting ? "Menghapus..." : "Ya, Hapus Dokumen"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
