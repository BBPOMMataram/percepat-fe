"use client";

import { useEffect, useState, useMemo, useCallback, Fragment } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

function formatRp(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatPct(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0%";
  return `${Number(num).toFixed(2).replace(/\.00$/, "")}%`;
}

type MonthTab = {
  id: number;
  title: string;
  google_sheet_id?: string | number | null;
  is_active?: number;
};

type AllocationInfo = {
  iksk_number: number;
  percent: number;
  target: number;
  realisasi: number;
};

type KegiatanItem = {
  row_number: number;
  no: number;
  code: string;
  name: string;
  pagu: number;
  realisasi: number;
  allocations: Record<string, AllocationInfo>;
};

type IkskSummary = {
  iksk_number: number;
  full_title: string;
  total_target: number;
  total_realisasi: number;
  persentase_capaian: number;
  kegiatan_count: number;
  kegiatans: {
    code: string;
    name: string;
    percent: number;
    target: number;
    realisasi: number;
    row_number: number;
  }[];
};

type SpreadsheetInfo = {
  id?: number;
  name?: string;
  spreadsheet_id?: string;
};

type SheetTabInfo = {
  id?: number;
  title?: string;
  google_sheet_id?: string | number | null;
};

export default function RekapitulasiAnggaran() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialYear = searchParams.get("year") || "2026";
  const initialTabId = searchParams.get("tab") || "";

  // Filter States
  const hasYearParam = Boolean(searchParams.get("year"));
  const [showYearList, setShowYearList] = useState<boolean>(!hasYearParam);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [availableYears, setAvailableYears] = useState<string[]>(["2026"]);
  const [tabs, setTabs] = useState<MonthTab[]>([]);
  const [selectedTabId, setSelectedTabId] = useState<string>(initialTabId);

  // Tab & Spreadsheet metadata
  const [tabTitle, setTabTitle] = useState("");
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [sheetTab, setSheetTab] = useState<SheetTabInfo | null>(null);

  // Data
  const [kegiatans, setKegiatans] = useState<KegiatanItem[]>([]);
  const [ikskSummaries, setIkskSummaries] = useState<IkskSummary[]>([]);

  // UI Views
  const [activeTabMode, setActiveTabMode] = useState<"kegiatan" | "iksk">("kegiatan");
  const [searchKegiatanQuery, setSearchKegiatanQuery] = useState("");
  const [searchIkskQuery, setSearchIkskQuery] = useState("");
  const [selectedIkskDetail, setSelectedIkskDetail] = useState<number | null>(null);

  // Status
  const [loadingTabs, setLoadingTabs] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch Available Tabs for Year
  const fetchMonthTabs = useCallback(async (yearToFetch: string) => {
    setLoadingTabs(true);
    setErrorMsg("");
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.get(
        `${baseUrl}/api/budget-mapping/${yearToFetch}/tabs${query}`
      );
      const raw = res.data;

      let tabList: MonthTab[] = [];
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

      // Select initial or first tab
      if (tabList.length > 0) {
        const found = tabList.find((t) => String(t.id) === initialTabId);
        const targetTab = found || tabList[0];
        setSelectedTabId(String(targetTab.id));
      } else {
        setSelectedTabId("");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal memuat daftar tab bulan dari server."
      );
    } finally {
      setLoadingTabs(false);
    }
  }, [user?.id, initialTabId]);

  // Fetch Available Years from API
  const fetchYears = useCallback(async () => {
    try {
      const res = await api.get(`${baseUrl}/api/budget-mapping/years`);
      const raw = res.data;
      const list = raw?.data?.years || raw?.years || raw?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const yearStrings = list
          .map((item) => (typeof item === "object" ? String(item.year) : String(item)))
          .filter(Boolean);
        if (yearStrings.length > 0) {
          setAvailableYears(Array.from(new Set(yearStrings)));
        }
      }
    } catch {
      // Keep fallback ["2026", "2025"]
    }
  }, []);

  // Fetch Detail Data for Selected Tab
  const fetchTabData = useCallback(
    async (tabIdToFetch: string, yearToFetch: string) => {
      if (!tabIdToFetch) return;
      setLoadingData(true);
      setErrorMsg("");
      try {
        const query = user?.id ? `?user_id=${user.id}` : "";
        const res = await api.get(
          `${baseUrl}/api/budget-mapping/${yearToFetch}/tab/${tabIdToFetch}${query}`
        );

        if (res.data) {
          const data = res.data.data || res.data;
          if (data.sheetTab) {
            setSheetTab(data.sheetTab);
            setTabTitle(data.sheetTab.title || `Bulan Tab #${tabIdToFetch}`);
          }
          if (data.spreadsheet) {
            setSpreadsheet(data.spreadsheet);
          }
          if (Array.isArray(data.kegiatans)) {
            setKegiatans(data.kegiatans);
          }
          if (Array.isArray(data.iksk_summaries)) {
            setIkskSummaries(data.iksk_summaries);
          }
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setErrorMsg(
          e.response?.data?.message || "Gagal memuat data rekapitulasi anggaran."
        );
      } finally {
        setLoadingData(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  useEffect(() => {
    fetchMonthTabs(selectedYear);
  }, [selectedYear, fetchMonthTabs]);

  useEffect(() => {
    if (selectedTabId) {
      fetchTabData(selectedTabId, selectedYear);
    }
  }, [selectedTabId, selectedYear, fetchTabData]);

  // Handle Month Tab Click
  const handleSelectTab = (tab: MonthTab) => {
    setSelectedTabId(String(tab.id));
    setSelectedIkskDetail(null);
    router.replace(
      `/siproval/tu/rekapitulasi-anggaran?year=${encodeURIComponent(
        selectedYear
      )}&tab=${encodeURIComponent(String(tab.id))}`,
      { scroll: false }
    );
  };

  // Overall totals
  const overallTotals = useMemo(() => {
    const totalPagu = kegiatans.reduce((sum, k) => sum + (Number(k.pagu) || 0), 0);
    const totalRealisasi = kegiatans.reduce(
      (sum, k) => sum + (Number(k.realisasi) || 0),
      0
    );
    const serapan = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    return {
      totalPagu,
      totalRealisasi,
      serapan,
    };
  }, [kegiatans]);

  // Filtered Kegiatans
  const filteredKegiatans = useMemo(() => {
    if (!searchKegiatanQuery.trim()) return kegiatans;
    const q = searchKegiatanQuery.toLowerCase();
    return kegiatans.filter(
      (k) =>
        k.code.toLowerCase().includes(q) ||
        k.name.toLowerCase().includes(q)
    );
  }, [kegiatans, searchKegiatanQuery]);

  // Filtered IKSKs
  const filteredIksks = useMemo(() => {
    if (!searchIkskQuery.trim()) return ikskSummaries;
    const q = searchIkskQuery.toLowerCase();
    return ikskSummaries.filter(
      (i) =>
        String(i.iksk_number).includes(q) ||
        i.full_title.toLowerCase().includes(q)
    );
  }, [ikskSummaries, searchIkskQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/siproval/tu" className="transition hover:text-[#005baa]">
              Tata Usaha
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">
              Rekapitulasi Anggaran
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Rekapitulasi Anggaran
            </h1>
            {tabTitle && (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {tabTitle}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Laporan pagu, realisasi belanja, dan serapan alokasi anggaran tiap bulan per kegiatan dan per 28 IKSK.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick jump to input page for this tab */}
          {selectedTabId && (
            <Link
              href={`/siproval/budget-mapping/year/tab?year=${selectedYear}&tab=${selectedTabId}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#005baa] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004a8b]"
            >
              <Icon icon="solar:pen-new-square-bold" width={16} />
              Input / Edit Alokasi Bulan Ini
            </Link>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {/* Filter Bar: Year & Month Tab Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 shrink-0">
              Tahun Anggaran:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400">
            {tabs.length} tab bulan tersedia
          </span>
        </div>

        {/* Month Pills Tabs */}
        {loadingTabs ? (
          <div className="py-2 text-xs text-slate-400">Memuat daftar bulan...</div>
        ) : tabs.length === 0 ? (
          <div className="py-2 text-xs text-slate-500">
            Tidak ada tab bulan yang ditemukan untuk tahun {selectedYear}.
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {tabs.map((tab) => {
              const isSelected = String(tab.id) === selectedTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-[#005baa] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    icon={isSelected ? "solar:calendar-bold" : "solar:calendar-linear"}
                    width={14}
                  />
                  <span>{tab.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main KPI Summary Bar: 2 Clear Cards (Total Pagu & Total Realisasi) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          <div className="sm:px-4 first:pl-0">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Total Pagu Kegiatan
            </span>
            <span className="mt-1 block text-xl font-bold text-slate-900">
              {formatRp(overallTotals.totalPagu)}
            </span>
            <span className="text-[11px] text-slate-400">
              {kegiatans.length} Output / Kegiatan
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Total Realisasi Kegiatan
            </span>
            <span className="mt-1 block text-xl font-bold text-emerald-700">
              {formatRp(overallTotals.totalRealisasi)}
            </span>
            <span className="text-[11px] text-slate-500">
              Tingkat Serapan: <strong className="text-emerald-700">{formatPct(overallTotals.serapan)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Switcher Navigation for Rekap Views */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTabMode("kegiatan");
            setSelectedIkskDetail(null);
          }}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTabMode === "kegiatan"
              ? "border-[#005baa] text-[#005baa]"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <Icon icon="solar:document-bold" width={16} />
          <span>Rekapitulasi Tiap Kegiatan ({kegiatans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMode("iksk")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTabMode === "iksk"
              ? "border-[#005baa] text-[#005baa]"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <Icon icon="solar:chart-2-bold" width={16} />
          <span>Rekapitulasi 28 IKSK ({ikskSummaries.length})</span>
        </button>
      </div>

      {/* Loading data state */}
      {loadingData ? (
        <div className="p-16 text-center">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-solid border-[#005baa] border-r-transparent" />
          <p className="mt-3 text-xs text-slate-500">Memuat data rekapitulasi...</p>
        </div>
      ) : activeTabMode === "kegiatan" ? (
        /* ============================================================ */
        /* VIEW 1: REKAPITULASI TIAP KEGIATAN                          */
        /* ============================================================ */
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Icon
                icon="solar:magnifer-linear"
                width={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchKegiatanQuery}
                onChange={(e) => setSearchKegiatanQuery(e.target.value)}
                placeholder="Cari berdasarkan kode atau nama kegiatan..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:outline-none"
              />
            </div>

            <span className="text-xs text-slate-500">
              Menampilkan {filteredKegiatans.length} dari {kegiatans.length} kegiatan
            </span>
          </div>

          {/* Table Kegiatan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                    <th className="py-3 px-3.5 w-12 text-center">No</th>
                    <th className="py-3 px-3.5 w-24">Kode</th>
                    <th className="py-3 px-3.5 min-w-64">Nama Kegiatan / Output</th>
                    <th className="py-3 px-3.5 text-right min-w-32">Pagu (Rp)</th>
                    <th className="py-3 px-3.5 text-right min-w-32">Realisasi (Rp)</th>
                    <th className="py-3 px-3.5 text-right min-w-24">Serapan</th>
                    <th className="py-3 px-3.5 min-w-80">Rincian Alokasi IKSK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKegiatans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                        Tidak ada data kegiatan yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredKegiatans.map((keg, idx) => {
                      const allocEntries = Object.entries(keg.allocations || {});
                      const serapanPct =
                        keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0;

                      return (
                        <tr
                          key={`keg-row-${keg.code}-${keg.row_number}`}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="py-3 px-3.5 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5 font-bold text-[#005baa]">
                            {keg.code}
                          </td>
                          <td className="py-3 px-3.5 font-medium text-slate-800">
                            {keg.name}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                            {formatRp(keg.pagu)}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-emerald-700">
                            {formatRp(keg.realisasi)}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                                serapanPct >= 80
                                  ? "bg-emerald-50 text-emerald-800"
                                  : serapanPct >= 50
                                  ? "bg-blue-50 text-blue-800"
                                  : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {formatPct(serapanPct)}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            {allocEntries.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">
                                Belum ada alokasi IKSK
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {allocEntries.map(([ikskNum, alloc]) => (
                                  <div
                                    key={ikskNum}
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px]"
                                  >
                                    <span className="font-bold text-slate-700">
                                      IKSK {ikskNum}:
                                    </span>
                                    <span className="font-semibold text-[#005baa]">
                                      {formatPct(alloc.percent)}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-600" title="Target">
                                      T: {formatRp(alloc.target)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer Summary */}
                {filteredKegiatans.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/70 border-t border-slate-200 font-bold text-slate-800 text-xs">
                      <td colSpan={3} className="py-3 px-3.5 text-center">
                        TOTAL KESELURUHAN
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-900">
                        {formatRp(overallTotals.totalPagu)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-emerald-700">
                        {formatRp(overallTotals.totalRealisasi)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-emerald-800">
                        {formatPct(overallTotals.serapan)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 font-normal text-[11px]">
                        {kegiatans.length} Output Anggaran
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* VIEW 2: REKAPITULASI 28 IKSK                                */
        /* ============================================================ */
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Icon
                icon="solar:magnifer-linear"
                width={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchIkskQuery}
                onChange={(e) => setSearchIkskQuery(e.target.value)}
                placeholder="Cari nomor IKSK atau sasaran strategis..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:outline-none"
              />
            </div>

            <span className="text-xs text-slate-500">
              Menampilkan {filteredIksks.length} dari {ikskSummaries.length} IKSK
            </span>
          </div>

          {/* Table of 28 IKSK with Inline Accordion Rows */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                    <th className="py-3 px-3.5 w-16 text-center">IKSK</th>
                    <th className="py-3 px-3.5 min-w-72">Indikator Kinerja Sasaran Kegiatan (IKSK)</th>
                    <th className="py-3 px-3.5 text-center w-28">Jml Kegiatan</th>
                    <th className="py-3 px-3.5 text-right min-w-32">Target IKSK (Rp)</th>
                    <th className="py-3 px-3.5 text-right min-w-32">Realisasi IKSK (Rp)</th>
                    <th className="py-3 px-3.5 text-right min-w-24">Capaian (%)</th>
                    <th className="py-3 px-3.5 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIksks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                        Tidak ada data IKSK yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredIksks.map((item) => {
                      const isExpanded = selectedIkskDetail === item.iksk_number;

                      return (
                        <Fragment key={`iksk-fragment-${item.iksk_number}`}>
                          {/* Main Row */}
                          <tr
                            className={`transition ${
                              isExpanded
                                ? "bg-blue-50/50 font-medium"
                                : "hover:bg-slate-50/70"
                            }`}
                          >
                            <td className="py-3 px-3.5 text-center">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-bold ${
                                  isExpanded
                                    ? "bg-[#005baa] text-white"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {item.iksk_number}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 font-medium text-slate-800">
                              {item.full_title}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                {item.kegiatan_count}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right font-bold text-[#005baa]">
                              {formatRp(item.total_target)}
                            </td>
                            <td className="py-3 px-3.5 text-right font-bold text-emerald-700">
                              {formatRp(item.total_realisasi)}
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <span
                                className={`text-xs font-bold ${
                                  item.persentase_capaian >= 80
                                    ? "text-emerald-700"
                                    : item.persentase_capaian >= 50
                                    ? "text-blue-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {formatPct(item.persentase_capaian)}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedIkskDetail(
                                    isExpanded ? null : item.iksk_number
                                  )
                                }
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                                  isExpanded
                                    ? "bg-slate-200 text-slate-800"
                                    : "text-[#005baa] hover:bg-blue-50 hover:underline"
                                }`}
                              >
                                <span>{isExpanded ? "Tutup" : "Rincian"}</span>
                                <Icon
                                  icon={
                                    isExpanded
                                      ? "solar:alt-arrow-up-linear"
                                      : "solar:alt-arrow-down-linear"
                                  }
                                  width={13}
                                />
                              </button>
                            </td>
                          </tr>

                          {/* Inline Expandable Detail Row Directly Beneath */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-b border-slate-200">
                              <td colSpan={7} className="p-4 sm:pl-12 sm:pr-6">
                                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="rounded bg-[#005baa] px-2 py-0.5 text-xs font-bold text-white">
                                        IKSK {item.iksk_number}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-900">
                                        Daftar Kegiatan Penyumbang Dana ({item.kegiatans.length} Kegiatan)
                                      </h4>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedIkskDetail(null)}
                                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                                    >
                                      Tutup Rincian
                                    </button>
                                  </div>

                                  {item.kegiatans.length === 0 ? (
                                    <div className="py-3 text-center text-xs text-slate-400 italic">
                                      Belum ada kegiatan yang mengalokasikan anggaran ke IKSK ini pada bulan ini.
                                    </div>
                                  ) : (
                                    <div className="overflow-hidden rounded-md border border-slate-200">
                                      <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                                            <th className="py-2 px-3">Kode Kegiatan</th>
                                            <th className="py-2 px-3">Nama Kegiatan / Output</th>
                                            <th className="py-2 px-3 text-right">Alokasi (%)</th>
                                            <th className="py-2 px-3 text-right">Target Disumbang (Rp)</th>
                                            <th className="py-2 px-3 text-right">Realisasi Disumbang (Rp)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                          {item.kegiatans.map((kg) => (
                                            <tr
                                              key={`detail-keg-${kg.code}`}
                                              className="hover:bg-slate-50"
                                            >
                                              <td className="py-2 px-3 font-bold text-[#005baa]">
                                                {kg.code}
                                              </td>
                                              <td className="py-2 px-3 text-slate-800 font-medium">
                                                {kg.name}
                                              </td>
                                              <td className="py-2 px-3 text-right font-bold text-slate-700">
                                                {formatPct(kg.percent)}
                                              </td>
                                              <td className="py-2 px-3 text-right font-semibold text-[#005baa]">
                                                {formatRp(kg.target)}
                                              </td>
                                              <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                                                {formatRp(kg.realisasi)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
