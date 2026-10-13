"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006"
).replace(/\/+$/, "");

type UserOption = {
  id: number;
  name: string;
  email: string;
};

type SpreadsheetOption = {
  id: number;
  name: string;
};

type TabOption = {
  id: number;
  title: string;
};

type PermissionItem = {
  id: number;
  user_name: string;
  user_email: string;
  spreadsheet_name: string;
  tab_title: string;
  created_at: string;
};

export default function SyncPermission() {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetOption[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<number | null>(null);

  const [tabs, setTabs] = useState<TabOption[]>([]);
  const [selectedTab, setSelectedTab] = useState<number | null>(null);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get(`${baseUrl}/superadmin/permission`);
      const data = res.data;

      const permList = Array.isArray(data?.permissions)
        ? data.permissions
        : Array.isArray(data?.data?.permissions)
          ? data.data.permissions
          : Array.isArray(data)
            ? data
            : [];
      setPermissions(permList);

      const spList = Array.isArray(data?.spreadsheets)
        ? data.spreadsheets
        : Array.isArray(data?.data?.spreadsheets)
          ? data.data.spreadsheets
          : [];
      setSpreadsheets(spList);
      if (spList.length > 0 && !selectedSpreadsheet) {
        setSelectedSpreadsheet(spList[0].id);
      }

      const uList = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.data?.users)
          ? data.data.users
          : [];
      setUsers(uList);
      if (uList.length > 0 && !selectedUser) {
        setSelectedUser(uList[0].id);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal memuat data hak akses dari server."
      );
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tabs whenever selected spreadsheet changes
  useEffect(() => {
    if (!selectedSpreadsheet) return;

    async function fetchTabsForSpreadsheet() {
      try {
        const res = await api.get(
          `${baseUrl}/superadmin/sinkronisasi-tab?spreadsheet_id=${selectedSpreadsheet}`
        );
        const data = res.data;
        const list: TabOption[] = Array.isArray(data?.tabs)
          ? data.tabs
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
        setTabs(list);
        if (list.length > 0) {
          setSelectedTab(list[0].id);
        } else {
          setSelectedTab(null);
        }
      } catch {
        setTabs([]);
        setSelectedTab(null);
      }
    }

    fetchTabsForSpreadsheet();
  }, [selectedSpreadsheet]);

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpreadsheet || !selectedTab || !selectedUser) {
      setErrorMsg("Harap pilih spreadsheet, tab, dan user secara lengkap.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api.post(`${baseUrl}/superadmin/permission`, {
        google_spreadsheet_id: selectedSpreadsheet,
        tab_id: selectedTab,
        user_id: selectedUser,
      });

      if (res.status === 200 || res.status === 201) {
        setSuccessMsg(
          res.data?.message || "Hak akses berhasil diberikan kepada user!"
        );
        fetchPermissions();
      } else {
        setErrorMsg(res.data?.message || "Gagal menambahkan hak akses.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal menambahkan hak akses ke backend."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await api.delete(`${baseUrl}/superadmin/permission/${id}`);
      setSuccessMsg("Hak akses user berhasil dicabut.");
      fetchPermissions();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal mencabut hak akses.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hak Akses & Permission Google Sheet
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Atur penanggung jawab (PIC) yang memiliki hak akses untuk mengedit setiap tab
          Google Spreadsheet.
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

      {/* Permission Assignment Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Tambah Hak Akses User</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pilih dokumen spreadsheet, tab tujuan, dan akun user yang berhak mengedit.
        </p>

        <form onSubmit={handleGrantPermission} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Pilih Spreadsheet
            </label>
            <select
              value={selectedSpreadsheet ?? ""}
              onChange={(e) => setSelectedSpreadsheet(Number(e.target.value))}
              disabled={spreadsheets.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            >
              {spreadsheets.length === 0 && (
                <option value="">Tidak ada spreadsheet</option>
              )}
              {spreadsheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Pilih Tab
            </label>
            <select
              value={selectedTab ?? ""}
              onChange={(e) => setSelectedTab(Number(e.target.value))}
              disabled={tabs.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            >
              {tabs.length === 0 && (
                <option value="">Tidak ada tab tersedia</option>
              )}
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              3. Pilih User / PIC
            </label>
            <select
              value={selectedUser ?? ""}
              onChange={(e) => setSelectedUser(Number(e.target.value))}
              disabled={users.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            >
              {users.length === 0 && (
                <option value="">Tidak ada user tersedia</option>
              )}
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:opacity-50"
            >
              <Icon
                icon={saving ? "solar:refresh-circle-linear" : "solar:user-plus-bold"}
                width={16}
                className={saving ? "animate-spin" : ""}
              />
              {saving ? "Menyimpan..." : "Berikan Hak Akses"}
            </button>
          </div>
        </form>
      </div>

      {/* Permissions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Hak Akses Aktif
              </h2>
              <p className="text-xs text-slate-500">
                User yang saat ini memiliki otorisasi edit pada tab Google Spreadsheet.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#005baa]">
              {permissions.length} User Diberikan Akses
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat hak akses...</p>
          </div>
        ) : permissions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Belum ada permission yang diberikan.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Spreadsheet</th>
                  <th className="py-3 px-4">Tab</th>
                  <th className="py-3 px-4 w-40">Diberikan Pada</th>
                  <th className="py-3 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.user_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {item.user_email}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.spreadsheet_name}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#005baa]">
                      {item.tab_title}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {item.created_at}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRevoke(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={14} />
                        <span>Cabut</span>
                      </button>
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
