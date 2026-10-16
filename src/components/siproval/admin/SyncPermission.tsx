"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
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

type MonthLockItem = {
  month: number;
  name: string;
  is_past: boolean;
  is_current: boolean;
  is_future: boolean;
  is_unlocked: boolean;
  is_unlocked_individually: boolean;
  note: string | null;
  unlocked_by: string | null;
  updated_at: string | null;
};

type SyncedColumnSummary = {
  column: string;
  type: string;
  users: string;
};

type SyncedTabDetail = {
  tab_id: number;
  tab_title: string;
  status: "synced" | "skipped" | "error";
  message?: string;
  data_end_row?: number;
  pic_row_number?: number;
  type_row_number?: number;
  ranges_count?: number;
  columns_summary?: SyncedColumnSummary[];
};

type SyncedSpreadsheetDetail = {
  spreadsheet_id: number;
  spreadsheet_name: string;
  tabs: SyncedTabDetail[];
};

type SyncPicResult = {
  total_spreadsheets: number;
  total_tabs: number;
  total_ranges: number;
  details: SyncedSpreadsheetDetail[];
};

export default function SyncPermission() {
  const { user } = useSelector((state: RootState) => state.auth);
  // Fitur hak akses manual disembunyikan sementara sesuai arahan
  const showManualPermission = false;
  const [activeSubTab, setActiveSubTab] = useState<"sync_pic" | "permissions" | "month_locks">("sync_pic");

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

  // Sync PIC from Sheet states
  const [syncScope, setSyncScope] = useState<"all" | "single">("all");
  const [syncSpreadsheetId, setSyncSpreadsheetId] = useState<string>("all");
  const [syncTabId, setSyncTabId] = useState<string>("all");
  const [syncTabsList, setSyncTabsList] = useState<TabOption[]>([]);
  const [syncingPic, setSyncingPic] = useState<boolean>(false);
  const [syncPicResult, setSyncPicResult] = useState<SyncPicResult | null>(null);

  // Month Locks state
  const [monthLocks, setMonthLocks] = useState<MonthLockItem[]>([]);
  const [universalUnlocked, setUniversalUnlocked] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loadingMonthLocks, setLoadingMonthLocks] = useState(false);
  const [togglingMonth, setTogglingMonth] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPermissions();
    }
  }, [user?.id]);

  const fetchPermissions = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.get(`${baseUrl}/api/superadmin/permission${query}`);
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
        const query = user?.id ? `&user_id=${user.id}` : "";
        const res = await api.get(
          `${baseUrl}/api/superadmin/sinkronisasi-tab?spreadsheet_id=${selectedSpreadsheet}${query}`
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
  }, [selectedSpreadsheet, user?.id]);

  // Fetch tabs whenever syncSpreadsheetId changes in Sync PIC tab
  useEffect(() => {
    if (syncSpreadsheetId && syncSpreadsheetId !== "all") {
      async function fetchTabsForSync() {
        try {
          const query = user?.id ? `&user_id=${user.id}` : "";
          const res = await api.get(
            `${baseUrl}/api/superadmin/sinkronisasi-tab?spreadsheet_id=${syncSpreadsheetId}${query}`
          );
          const data = res.data;
          const list: TabOption[] = Array.isArray(data?.tabs)
            ? data.tabs
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];
          setSyncTabsList(list);
          setSyncTabId("all");
        } catch {
          setSyncTabsList([]);
          setSyncTabId("all");
        }
      }
      fetchTabsForSync();
    } else {
      setSyncTabsList([]);
      setSyncTabId("all");
    }
  }, [syncSpreadsheetId, user?.id]);

  const handleStartSyncPic = async () => {
    setSyncingPic(true);
    setErrorMsg("");
    setSuccessMsg("");
    setSyncPicResult(null);

    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const payload: { google_spreadsheet_id?: string | number; google_sheet_tab_id?: string | number } = {};
      if (syncScope === "single" && syncSpreadsheetId !== "all") {
        payload.google_spreadsheet_id = syncSpreadsheetId;
        if (syncTabId !== "all") {
          payload.google_sheet_tab_id = syncTabId;
        }
      }

      const res = await api.post(`${baseUrl}/api/superadmin/sync-pic-columns${query}`, payload);
      if (res.data?.status === "success") {
        setSuccessMsg(res.data?.message || "Sinkronisasi PIC berhasil diselesaikan!");
        setSyncPicResult(res.data?.data);
        fetchPermissions();
      } else {
        setErrorMsg(res.data?.message || "Gagal melakukan sinkronisasi PIC.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Terjadi kesalahan saat memproses sinkronisasi PIC.");
    } finally {
      setSyncingPic(false);
    }
  };

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
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.post(`${baseUrl}/api/superadmin/permission${query}`, {
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
      const query = user?.id ? `?user_id=${user.id}` : "";
      await api.delete(`${baseUrl}/api/superadmin/permission/${id}${query}`);
      setSuccessMsg("Hak akses user berhasil dicabut.");
      fetchPermissions();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal mencabut hak akses.");
    }
  };

  const fetchMonthLocks = async (year = selectedYear) => {
    setLoadingMonthLocks(true);
    try {
      const query = user?.id ? `&user_id=${user.id}` : "";
      const res = await api.get(`${baseUrl}/api/superadmin/month-lock?year=${year}${query}`);
      const data = res.data?.data || res.data;
      if (data?.months) {
        setMonthLocks(data.months);
      }
      setUniversalUnlocked(Boolean(data?.universal_unlocked));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal memuat status kunci bulan.");
    } finally {
      setLoadingMonthLocks(false);
    }
  };

  const handleToggleMonthLock = async (month: number, currentUnlocked: boolean) => {
    setTogglingMonth(month);
    setErrorMsg("");
    setSuccessMsg("");
    const newUnlocked = !currentUnlocked;

    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.post(`${baseUrl}/api/superadmin/month-lock${query}`, {
        month,
        year: selectedYear,
        is_unlocked: newUnlocked,
        note: newUnlocked
          ? month === 0
            ? "Seluruh bulan dibuka oleh Superadmin"
            : `Bulan dibuka oleh Superadmin`
          : "Dikunci kembali oleh Superadmin",
      });

      setSuccessMsg(res.data?.message || "Status kunci bulan berhasil diperbarui.");
      fetchMonthLocks(selectedYear);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal memperbarui status kunci bulan.");
    } finally {
      setTogglingMonth(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Otorisasi PIC & Kunci Bulan Google Sheet
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Sinkronisasi otomatis hak akses PIC dari konfigurasi dokumen Google Sheet serta pengaturan pembukaan dan penguncian periode bulan.
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

      {/* Subtab Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveSubTab("sync_pic")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeSubTab === "sync_pic"
              ? "border-[#005baa] text-[#005baa]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icon icon="solar:magic-stick-3-bold" width={18} />
          <span>Otomatisasi PIC dari Sheet</span>
          <span className="rounded-full bg-blue-100 text-[#005baa] px-2 py-0.5 text-[10px] font-bold">
            Fitur Baru
          </span>
        </button>

        {showManualPermission && (
          <button
            type="button"
            onClick={() => setActiveSubTab("permissions")}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 -mb-px ${
              activeSubTab === "permissions"
                ? "border-[#005baa] text-[#005baa]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon icon="solar:shield-keyhole-bold" width={18} />
            <span>Hak Akses Tab Manual</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setActiveSubTab("month_locks");
            if (monthLocks.length === 0) fetchMonthLocks(selectedYear);
          }}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeSubTab === "month_locks"
              ? "border-[#005baa] text-[#005baa]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icon icon="solar:calendar-date-bold" width={18} />
          <span>Kunci Bulan Pengisian (Month Lock)</span>
          {universalUnlocked && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-bold">
              Universal Buka
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "sync_pic" && (
        <div className="space-y-6">
          {/* Card Panduan & Fitur */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#005baa] text-white shadow-md shadow-blue-500/20">
                    <Icon icon="solar:magic-stick-3-bold" width={20} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Sinkronisasi Hak Akses PIC & Kolom dari Sheet
                  </h2>
                </div>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  Sistem membaca <strong>2 baris konfigurasi terakhir</strong> di setiap tab Google Sheet (baris nama PIC dan baris tipe <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono text-[11px]">editable</code> / <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono text-[11px]">formula</code>).
                  Sistem akan otomatis mencocokkan nama PIC ke user, membagi hak akses kolom, dan membatasi data agar baris konfigurasi <strong>tidak bocor</strong> ke formulir pengisian Katim.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Icon icon="solar:check-circle-bold" width={14} />
                  Auto-Detect 2 Baris Terakhir
                </span>
              </div>
            </div>

            {/* Quick Badges / Petunjuk Format */}
            <div className="mt-4 pt-4 border-t border-blue-100/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2 text-slate-600">
                <Icon icon="solar:document-text-bold" width={16} className="text-[#005baa] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">Tipe Kolom:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan kata kunci <code className="font-semibold text-slate-700">editable</code> untuk kolom isian, atau <code className="font-semibold text-slate-700">formula</code> / <code className="font-semibold text-slate-700">rumus</code> untuk kalkulasi otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <Icon icon="solar:users-group-rounded-bold" width={16} className="text-[#005baa] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">Nama PIC:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung nama panggilan/alias (contoh: <em>Wibi</em>, <em>Firman</em>, <em>Mita</em>, <em>Putu</em>, <em>Dian</em>, dll) atau dipisah koma (contoh: <em>Putu, Dian</em>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <Icon icon="solar:shield-check-bold" width={16} className="text-[#005baa] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">Pencegahan Kebocoran:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Batas akhir data (<code className="font-semibold text-slate-700">data_end_row</code>) diset otomatis ke baris sebelum konfigurasi sehingga tidak tampil di tabel Katim.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Eksekusi Sinkronisasi */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Pilih Ruang Lingkup Sinkronisasi</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Tentukan apakah ingin memproses seluruh spreadsheet secara universal atau memilih dokumen spreadsheet tertentu.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Cakupan Sinkronisasi
                </label>
                <select
                  value={syncScope}
                  onChange={(e) => {
                    const val = e.target.value as "all" | "single";
                    setSyncScope(val);
                    if (val === "all") {
                      setSyncSpreadsheetId("all");
                      setSyncTabId("all");
                    } else if (spreadsheets.length > 0) {
                      setSyncSpreadsheetId(String(spreadsheets[0].id));
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-[#005baa]"
                >
                  <option value="all">Semua Spreadsheet (Universal - Seluruh File)</option>
                  <option value="single">Pilih Dokumen Spreadsheet Tertentu</option>
                </select>
              </div>

              {syncScope === "single" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      2. Dokumen Spreadsheet
                    </label>
                    <select
                      value={syncSpreadsheetId}
                      onChange={(e) => setSyncSpreadsheetId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-[#005baa]"
                    >
                      {spreadsheets.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Tab Google Sheet
                    </label>
                    <select
                      value={syncTabId}
                      onChange={(e) => setSyncTabId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-[#005baa]"
                    >
                      <option value="all">Semua Tab di Dokumen Ini</option>
                      {syncTabsList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">
                {syncScope === "all"
                  ? `Akan memproses seluruh spreadsheet aktif (${spreadsheets.length} dokumen).`
                  : syncTabId === "all"
                    ? `Akan memproses seluruh tab pada spreadsheet yang dipilih.`
                    : `Hanya memproses 1 tab yang dipilih.`}
              </span>

              <button
                type="button"
                disabled={syncingPic}
                onClick={handleStartSyncPic}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#004785] disabled:opacity-50"
              >
                <Icon
                  icon={syncingPic ? "solar:refresh-circle-bold" : "solar:play-circle-bold"}
                  width={18}
                  className={syncingPic ? "animate-spin" : ""}
                />
                <span>{syncingPic ? "Sedang Menyinkronkan..." : "Mulai Sinkronisasi PIC"}</span>
              </button>
            </div>
          </div>

          {/* Hasil Sinkronisasi */}
          {syncPicResult && (
            <div className="space-y-4">
              {/* Statistik Ringkasan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Spreadsheet Diproses
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">
                      {syncPicResult.total_spreadsheets}
                    </span>
                    <span className="text-xs text-slate-400">dokumen</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Tab Selesai Disinkronkan
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600">
                      {syncPicResult.total_tabs}
                    </span>
                    <span className="text-xs text-slate-400">tab sheet</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Range Kolom Dihasilkan
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-600">
                      {syncPicResult.total_ranges}
                    </span>
                    <span className="text-xs text-slate-400">segmen kolom</span>
                  </div>
                </div>
              </div>

              {/* Rincian per Dokumen & Tab */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  Rincian Hasil Sinkronisasi Per Dokumen & Tab
                </h3>

                <div className="space-y-6">
                  {syncPicResult.details.map((sp) => (
                    <div
                      key={sp.spreadsheet_id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon icon="solar:document-bold" className="text-[#005baa]" width={18} />
                        <h4 className="text-xs font-bold text-slate-800">
                          {sp.spreadsheet_name}
                        </h4>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {sp.tabs.length} Tab
                        </span>
                      </div>

                      <div className="space-y-3">
                        {sp.tabs.map((tab) => (
                          <div
                            key={tab.tab_id}
                            className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {tab.tab_title}
                                </span>
                                {tab.status === "synced" ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    Berhasil Disinkronkan
                                  </span>
                                ) : tab.status === "skipped" ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    Dilewati
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                    Error
                                  </span>
                                )}
                              </div>

                              {tab.status === "synced" && (
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span>
                                    Batas Data: <strong>Baris 2 s/d {tab.data_end_row}</strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Config: <strong>Baris {tab.pic_row_number} & {tab.type_row_number}</strong>
                                  </span>
                                </div>
                              )}
                            </div>

                            {tab.message && (
                              <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md">
                                {tab.message}
                              </p>
                            )}

                            {tab.columns_summary && tab.columns_summary.length > 0 && (
                              <div className="mt-3 border-t border-slate-100 pt-2.5">
                                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                                  Pengaturan Kolom yang Diterapkan:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {tab.columns_summary.map((col, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border ${
                                        col.type === "editable"
                                          ? "bg-blue-50 border-blue-200 text-blue-800"
                                          : "bg-emerald-50 border-emerald-200 text-emerald-800"
                                      }`}
                                    >
                                      <strong>Kolom {col.column}:</strong>
                                      <span>{col.users}</span>
                                      <span className="text-[9px] uppercase px-1 py-0.2 bg-white/70 rounded">
                                        {col.type}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showManualPermission && activeSubTab === "permissions" && (
        <>
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
    </>
  )}

  {/* SUBTAB 2: KUNCI BULAN PENGISIAN (MONTH LOCK) */}
  {activeSubTab === "month_locks" && (
    <div className="space-y-6">
      {/* Universal Unlock Card */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50/50 via-white to-sky-50/30 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#005baa] text-white">
                <Icon icon="solar:global-bold" width={18} />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Otorisasi Universal Bulan Lampau
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Secara default sistem, seluruh baris data pada bulan sebelum bulan berjalan terkunci (read-only). 
              Aktifkan fitur ini jika Anda ingin <strong>membuka seluruh bulan lampau sekaligus</strong> untuk semua Ketua Tim dan semua Google Spreadsheet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={togglingMonth === 0}
              onClick={() => handleToggleMonthLock(0, universalUnlocked)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
                universalUnlocked
                  ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-[#005baa] text-white hover:bg-[#004b8d]"
              } disabled:opacity-50`}
            >
              <Icon
                icon={
                  togglingMonth === 0
                    ? "solar:refresh-circle-linear"
                    : universalUnlocked
                      ? "solar:lock-bold"
                      : "solar:lock-unlocked-bold"
                }
                width={18}
                className={togglingMonth === 0 ? "animate-spin" : ""}
              />
              <span>
                {togglingMonth === 0
                  ? "Memproses..."
                  : universalUnlocked
                    ? "Kunci Semua Bulan Lampau"
                    : "Buka Semua Bulan Lampau (Universal)"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Month Cards Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Status Pengisian Per Bulan (Tahun {selectedYear})
            </h2>
            <p className="text-xs text-slate-500">
              Buka atau kunci izin pengisian data Katim untuk bulan-bulan tertentu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchMonthLocks(selectedYear)}
              disabled={loadingMonthLocks}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Icon icon="solar:refresh-linear" width={14} className={loadingMonthLocks ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loadingMonthLocks ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat status penguncian bulan...</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthLocks.map((m) => {
              const isCurrent = m.is_current;
              const isFuture = m.is_future;
              const isPast = m.is_past;

              return (
                <div
                  key={m.month}
                  className={`relative flex flex-col justify-between rounded-xl border p-4 transition ${
                    isCurrent
                      ? m.is_unlocked
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-red-300 bg-red-50/20"
                      : m.is_unlocked && isPast
                        ? "border-sky-300 bg-sky-50/30"
                        : isPast
                          ? "border-slate-200 bg-slate-50/50"
                          : !m.is_unlocked
                            ? "border-red-200 bg-red-50/20"
                            : "border-slate-200 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {String(m.month).padStart(2, "0")}
                      </span>
                      {isCurrent ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.is_unlocked
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              m.is_unlocked ? "bg-emerald-600" : "bg-red-600"
                            }`}
                          />
                          {m.is_unlocked ? "Bulan Ini (Terbuka)" : "Bulan Ini (Dikunci Admin)"}
                        </span>
                      ) : isFuture ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            m.is_unlocked
                              ? "bg-slate-100 text-slate-600"
                              : "bg-red-100 text-red-800 font-bold"
                          }`}
                        >
                          {m.is_unlocked ? "Mendatang" : "Terkunci Admin"}
                        </span>
                      ) : m.is_unlocked ? (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                          Dibuka Superadmin
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Terkunci
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-slate-800">
                      {m.name}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {isCurrent
                        ? m.is_unlocked
                          ? "Bulan berjalan (dapat diisi Katim)"
                          : "Bulan berjalan dikunci oleh Admin (hanya baca untuk Katim)"
                        : isFuture
                          ? m.is_unlocked
                            ? "Bulan mendatang (dapat diisi)"
                            : "Bulan mendatang dikunci oleh Admin"
                          : m.is_unlocked
                            ? universalUnlocked
                              ? "Terbuka melalui status Universal"
                              : "Terbuka khusus untuk bulan ini"
                            : "Terkunci (hanya baca untuk Katim)"}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={togglingMonth === m.month || (isPast && universalUnlocked)}
                      onClick={() => handleToggleMonthLock(m.month, m.is_unlocked)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-bold transition ${
                        m.is_unlocked
                          ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          : "border border-[#005baa] bg-white text-[#005baa] hover:bg-blue-50"
                      } disabled:opacity-50`}
                    >
                      <Icon
                        icon={
                          togglingMonth === m.month
                            ? "solar:refresh-circle-linear"
                            : m.is_unlocked
                              ? "solar:lock-bold"
                              : "solar:lock-unlocked-bold"
                        }
                        width={14}
                        className={togglingMonth === m.month ? "animate-spin" : ""}
                      />
                      <span>
                        {togglingMonth === m.month
                          ? "Menyimpan..."
                          : m.is_unlocked
                            ? isCurrent
                              ? "Kunci Bulan Ini"
                              : isPast
                                ? "Kunci Kembali"
                                : "Kunci Bulan Ini"
                            : isCurrent
                              ? "Buka Bulan Ini"
                              : isPast
                                ? "Buka Akses"
                                : "Buka Bulan Ini"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}
    </div>
  );
}
