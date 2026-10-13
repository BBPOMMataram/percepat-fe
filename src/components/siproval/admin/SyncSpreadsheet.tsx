"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006"
).replace(/\/+$/, "");

type SpreadsheetItem = {
  id: number;
  name: string;
  spreadsheet_id: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
};

export default function SyncSpreadsheet() {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [spreadsheetInput, setSpreadsheetInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSpreadsheets();
  }, []);

  const fetchSpreadsheets = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get(
        `${baseUrl}/superadmin/sinkronisasi-spreadsheet`
      );
      const data = res.data;
      if (Array.isArray(data)) {
        setSpreadsheets(data);
      } else if (Array.isArray(data?.spreadsheets)) {
        setSpreadsheets(data.spreadsheets);
      } else if (Array.isArray(data?.data)) {
        setSpreadsheets(data.data);
      } else {
        setSpreadsheets([]);
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

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetInput.trim()) {
      setErrorMsg("Harap masukkan URL Google Spreadsheet atau Spreadsheet ID.");
      return;
    }

    setSyncing(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api.post(
        `${baseUrl}/superadmin/sinkronisasi-spreadsheet`,
        { spreadsheet: spreadsheetInput }
      );

      if (res.status === 200 || res.status === 201) {
        setSuccessMsg(
          res.data?.message || "Spreadsheet berhasil disinkronkan ke database SIPROVAL!"
        );
        setSpreadsheetInput("");
        fetchSpreadsheets();
      } else {
        setErrorMsg(res.data?.message || "Gagal melakukan sinkronisasi spreadsheet.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal menghubungkan spreadsheet ke backend SIPROVAL."
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Sinkronisasi Spreadsheet
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Hubungkan dokumen Google Spreadsheet baru ke sistem SIPROVAL.
        </p>
      </div>

      {/* Alerts */}
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

      {errorMsg && (
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

      {/* Form Input Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Tambahkan Spreadsheet Baru</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Masukkan URL lengkap Google Spreadsheet atau ID dokumennya.
        </p>

        <form onSubmit={handleSyncSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
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
              placeholder="https://docs.google.com/spreadsheets/d/1A2B3C... atau Spreadsheet ID"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={syncing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:opacity-50"
          >
            <Icon
              icon={syncing ? "solar:refresh-circle-linear" : "solar:cloud-upload-bold"}
              width={16}
              className={syncing ? "animate-spin" : ""}
            />
            {syncing ? "Menyinkronkan..." : "Sinkronisasi"}
          </button>
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
                  <th className="py-3 px-4 w-32 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spreadsheets.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
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
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${item.spreadsheet_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#005baa]"
                      >
                        <Icon icon="solar:plain-outline" width={14} />
                        <span>Buka</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
