"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

type SpreadsheetOption = {
  id: number;
  name: string;
};

type TabItem = {
  id: number;
  google_spreadsheet_id: number;
  spreadsheet_name?: string;
  google_sheet_id: number | string;
  title: string;
  header_row: number;
  data_start_row: number;
  data_end_row: number;
  read_end_column: string;
  is_active: number;
};

export default function SyncTab() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetOption[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<number | null>(null);
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load available spreadsheets when user is available
  useEffect(() => {
    if (!user?.id) return;

    async function loadSpreadsheets() {
      setLoading(true);
      setErrorMsg("");
      try {
        const query = user?.id ? `?user_id=${user.id}` : "";
        const res = await api.get(`${baseUrl}/api/superadmin/sinkronisasi-spreadsheet${query}`);

        const data = res.data;
        const list: SpreadsheetOption[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.spreadsheets)
            ? data.spreadsheets
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setSpreadsheets(list);
        if (list.length > 0) {
          setSelectedSpreadsheetId(list[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setErrorMsg(
          e.response?.data?.message || "Gagal memuat daftar spreadsheet dari server."
        );
        setLoading(false);
      }
    }

    loadSpreadsheets();
  }, [user?.id]);

  useEffect(() => {
    if (selectedSpreadsheetId) {
      fetchTabs(selectedSpreadsheetId);
    }
  }, [selectedSpreadsheetId]);

  const fetchTabs = async (spreadsheetId: number) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const query = user?.id ? `&user_id=${user.id}` : "";
      const res = await api.get(
        `${baseUrl}/api/superadmin/sinkronisasi-tab?spreadsheet_id=${spreadsheetId}${query}`
      );
      const data = res.data;
      if (Array.isArray(data)) {
        setTabs(data);
      } else if (Array.isArray(data?.tabs)) {
        setTabs(data.tabs);
      } else if (Array.isArray(data?.data)) {
        setTabs(data.data);
      } else {
        setTabs([]);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal memuat data tab dari database."
      );
      setTabs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTabs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpreadsheetId) return;

    setSyncing(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api.post(`${baseUrl}/api/superadmin/sinkronisasi-tab`, {
        user_id: user?.id,
        google_spreadsheet_id: selectedSpreadsheetId,
      });

      if (res.status === 200 || res.status === 201) {
        setSuccessMsg(
          res.data?.message || "Tab spreadsheet berhasil disinkronisasikan!"
        );
        fetchTabs(selectedSpreadsheetId);
      } else {
        setErrorMsg(res.data?.message || "Gagal menyinkronkan tab spreadsheet.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal menarik tab Google Sheet dari server."
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sinkronisasi Tab</h1>
        <p className="mt-1 text-xs text-slate-500">
          Sinkronisasikan daftar sheet/tab dari Google Spreadsheet ke sistem SIPROVAL.
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

      {/* Selector & Sync trigger card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Sinkronkan Tab Spreadsheet
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pilih dokumen spreadsheet yang ingin diambil daftar tabnya dari Google Sheets.
        </p>

        <form onSubmit={handleSyncTabs} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Dokumen Spreadsheet
            </label>
            <select
              value={selectedSpreadsheetId ?? ""}
              onChange={(e) => setSelectedSpreadsheetId(Number(e.target.value))}
              disabled={spreadsheets.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            >
              {spreadsheets.length === 0 && (
                <option value="">Tidak ada spreadsheet tersedia</option>
              )}
              {spreadsheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={syncing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:opacity-50"
          >
            <Icon
              icon={syncing ? "solar:refresh-circle-linear" : "solar:layers-minimalistic-bold"}
              width={16}
              className={syncing ? "animate-spin" : ""}
            />
            {syncing ? "Menyinkronkan..." : "Tarik Tab dari Google Sheet"}
          </button>
        </form>
      </div>

      {/* Tabs list table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Tab Terdaftar
              </h2>
              <p className="text-xs text-slate-500">
                Pengaturan parameter pembacaan data (Header, Start Row, End Column).
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#005baa]">
              {tabs.length} Tab
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat tab...</p>
          </div>
        ) : tabs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Belum ada tab yang tersinkronisasi untuk spreadsheet ini.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Tab</th>
                  <th className="py-3 px-4">Google Sheet ID</th>
                  <th className="py-3 px-4 text-center">Header Row</th>
                  <th className="py-3 px-4 text-center">Data Start</th>
                  <th className="py-3 px-4 text-center">End Row</th>
                  <th className="py-3 px-4 text-center">End Col</th>
                  <th className="py-3 px-4 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tabs.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {item.google_sheet_id}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      Row {item.header_row}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      Row {item.data_start_row}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      Row {item.data_end_row}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      Col {item.read_end_column}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        ● Aktif
                      </span>
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
