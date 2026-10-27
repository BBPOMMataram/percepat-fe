"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

type SpreadsheetTab = {
  id: number;
  title: string;
  google_sheet_id?: string | number | null;
  is_active?: number;
};

type TabsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    year?: number;
    spreadsheet?: {
      name?: string;
    };
    tabs?: SpreadsheetTab[];
  };
  tabs?: SpreadsheetTab[];
};

export default function BudgetMappingTabs() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const year = searchParams.get("year") || "2026";

  const [spreadsheetName, setSpreadsheetName] = useState("Spreadsheet Budget Mapping");
  const [tabs, setTabs] = useState<SpreadsheetTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Month Tab Modal State
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [monthNameInput, setMonthNameInput] = useState("");
  const [selectedSourceTabId, setSelectedSourceTabId] = useState<number | string>("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addWarning, setAddWarning] = useState("");

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  async function fetchTabs() {
    setLoading(true);
    setError("");

    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const response = await api.get(
        `${baseUrl}/api/budget-mapping/${year}/tabs${query}`
      );

      const raw = response.data;

      const sName = raw?.spreadsheet?.name || raw?.data?.spreadsheet?.name;
      if (sName) {
        setSpreadsheetName(sName);
      }

      let tabList: SpreadsheetTab[] = [];
      if (Array.isArray(raw)) {
        tabList = raw;
      } else if (Array.isArray(raw?.tabs)) {
        tabList = raw.tabs;
      } else if (Array.isArray(raw?.data?.tabs)) {
        tabList = raw.data.tabs;
      } else if (Array.isArray(raw?.data)) {
        tabList = raw.data;
      }

      setTabs(tabList);
      if (tabList.length > 0 && !selectedSourceTabId) {
        setSelectedSourceTabId(tabList[0].id);
      }
      setError("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Gagal memuat tab anggaran dari server.");
    } finally {
      setLoading(false);
    }
  }

  const handleAddMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthNameInput.trim()) {
      setAddError("Nama tab bulan harus diisi.");
      return;
    }

    setAddLoading(true);
    setAddError("");
    setAddSuccess("");
    setAddWarning("");

    try {
      const payload: Record<string, unknown> = {
        user_id: user?.id,
        month_name: monthNameInput.trim(),
      };
      if (selectedSourceTabId) {
        payload.source_tab_id = selectedSourceTabId;
      }

      const res = await api.post(`${baseUrl}/api/budget-mapping/${year}/tabs`, payload);
      setAddSuccess(`Tab '${monthNameInput.trim()}' berhasil ditambahkan ke spreadsheet tahun ${year}!`);
      if (res.data?.api_warning) {
        setAddWarning(`Catatan API: ${res.data.api_warning}`);
      }

      await fetchTabs();

      setTimeout(() => {
        setShowAddMonthModal(false);
        setAddSuccess("");
        setAddWarning("");
        setMonthNameInput("");
      }, 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAddError(e.response?.data?.message || "Gagal menambahkan tab bulan baru.");
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTabs();
    }
  }, [year, user?.id]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabs;
    return tabs.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [tabs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Navigation & breadcrumb header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/siproval/budget-mapping"
            className="transition hover:text-[#005baa]"
          >
            Budget Mapping
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Tahun {year}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMonthNameInput("");
              setAddError("");
              setAddSuccess("");
              setAddWarning("");
              setShowAddMonthModal(true);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#005baa] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d]"
          >
            <Icon icon="solar:add-circle-bold" width={16} />
            + Tambah Bulan Baru
          </button>

          <Link
            href="/siproval/tu/laporan-evaluasi?month=APRIL"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-[#005baa] shadow-sm transition hover:bg-blue-100"
          >
            <Icon icon="solar:printer-bold" width={16} />
            Eksport Laporan (Bulan April)
          </Link>

          <Link
            href={`/siproval/tu/rekapitulasi-anggaran?year=${year}`}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Icon icon="solar:chart-square-bold" width={16} className="text-[#005baa]" />
            Rekapitulasi Anggaran
          </Link>

          <Link
            href="/siproval/budget-mapping"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Icon icon="solar:arrow-left-linear" width={16} />
            Kembali ke Daftar Tahun
          </Link>
        </div>
      </div>

      {/* Spreadsheet info banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sumber Spreadsheet
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {spreadsheetName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih tab berikut untuk melihat atau memperbarui data rincian alokasi kegiatan
              anggaran.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-[#005baa]">
            <Icon icon="solar:layers-bold" width={16} />
            {tabs.length} Tab Tersedia
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-5">
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              width={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama tab (contoh: JANUARI, ANGGARAN)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tab List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Daftar Tab Anggaran</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Klik pada salah satu tab untuk membuka tabel editor.
          </p>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error && tabs.length === 0 ? (
          <div className="p-8 text-center text-sm text-red-600">
            {error}
          </div>
        ) : filteredTabs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Icon icon="solar:folder-open-linear" width={24} />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">
              Tab tidak ditemukan
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Tidak ada tab yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTabs.map((tab, index) => (
              <Link
                key={tab.id}
                href={`/siproval/budget-mapping/year/tab?year=${encodeURIComponent(
                  year,
                )}&tab=${encodeURIComponent(String(tab.id))}`}
                className="group flex items-center justify-between gap-4 px-6 py-4.5 transition hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#005baa] transition group-hover:bg-[#005baa] group-hover:text-white">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-[#005baa]">
                      {tab.title}
                    </h4>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>Tab ID: {tab.id}</span>
                      {tab.google_sheet_id !== undefined && (
                        <>
                          <span>•</span>
                          <span>Sheet ID: {String(tab.google_sheet_id)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex group-hover:bg-blue-100 group-hover:text-[#005baa]">
                    Input Alokasi
                  </span>
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#005baa]"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah Bulan Baru */}
      {showAddMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                  <Icon icon="solar:calendar-bold" width={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tambah Bulan Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menambah tab baru di dalam spreadsheet tahun {year}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!addLoading) {
                    setShowAddMonthModal(false);
                    setAddError("");
                    setAddSuccess("");
                    setAddWarning("");
                  }
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <form onSubmit={handleAddMonth} className="mt-5 space-y-4">
              {addError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <Icon icon="solar:danger-triangle-bold" width={16} className="shrink-0 text-red-600" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  <Icon icon="solar:check-circle-bold" width={16} className="shrink-0 text-emerald-600" />
                  <span>{addSuccess}</span>
                </div>
              )}

              {addWarning && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <Icon icon="solar:info-circle-bold" width={16} className="shrink-0 text-amber-600" />
                  <span>{addWarning}</span>
                </div>
              )}

              {/* Quick Select Month Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Bulan Cepat:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {MONTH_NAMES.map((m) => {
                    const formatted = `${m} ${year}`;
                    const isSelected = monthNameInput.toLowerCase() === formatted.toLowerCase();
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMonthNameInput(formatted)}
                        className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition border ${
                          isSelected
                            ? "bg-[#005baa] text-white border-[#005baa] shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-[#005baa]"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Tab Spreadsheet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={monthNameInput}
                  onChange={(e) => setMonthNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                  placeholder={`Contoh: Februari ${year}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Duplikasi Dari Tab Acuan
                </label>
                <select
                  value={selectedSourceTabId}
                  onChange={(e) => setSelectedSourceTabId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                >
                  {tabs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Nama dan susunan kegiatan akan disalin secara dinamis dari tab acuan, sedangkan seluruh nilai <strong>Pagu, Realisasi, dan alokasi IKSK otomatis dikosongkan</strong> pada tab baru.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={addLoading}
                  onClick={() => setShowAddMonthModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#004b8d] transition disabled:opacity-50"
                >
                  {addLoading ? (
                    <>
                      <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
                      Menduplikasi Tab...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-bold" width={16} />
                      Simpan & Buat Tab Bulan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
