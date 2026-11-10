"use client";

import { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import api from "@/utils/api";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

const MONTH_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface MetricCardData {
  score?: number;
  score_formatted?: string;
  value?: number;
  value_formatted?: string;
  predikat?: string;
  label: string;
  sub: string;
}

interface KerangkaKerjaLogisRow {
  no: number;
  sasaran: string;
  sasaran_no: number;
  indikator: string;
  target: string;
  realisasi: string;
  capaian: string;
  capaian_dinormalisasi: string;
  kategori_iku: string;
  is_active: boolean;
  is_annual_target: boolean;
}

interface SimetrisNkoData {
  year: number;
  selected_month: string;
  selected_month_num: number;
  available_months: Record<number, string>;
  cards: {
    nko: MetricCardData;
    pagu: MetricCardData;
    realisasi_anggaran: MetricCardData;
    capaian_anggaran: MetricCardData;
  };
  kerangka_kerja_logis: KerangkaKerjaLogisRow[];
}

interface SimetrisNkoDashboardProps {
  initialYear?: number;
  initialMonth?: string;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  hideMonthSelector?: boolean;
  compact?: boolean;
  showFullTableLink?: boolean;
}

export default function SimetrisNkoDashboard({
  initialYear = 2026,
  initialMonth = "September",
  selectedMonth: propSelectedMonth,
  onMonthChange,
  hideMonthSelector = false,
  compact = false,
  showFullTableLink = true,
}: SimetrisNkoDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [internalMonth, setInternalMonth] = useState<string>(initialMonth);

  // Normalisasi nama bulan (dukung huruf besar "OKTOBER" maupun title case "Oktober")
  const activeMonth = useMemo(() => {
    const raw = propSelectedMonth || internalMonth;
    if (!raw) return "Oktober";
    const found = MONTH_OPTIONS.find(
      (m) => m.toLowerCase() === raw.toLowerCase(),
    );
    return found || raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }, [propSelectedMonth, internalMonth]);

  const [data, setData] = useState<SimetrisNkoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");

  const fetchData = async (year: number, month: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `${baseUrl}/api/tu/nko/dashboard?year=${year}&month=${encodeURIComponent(month)}`,
      );
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error("Gagal mengambil data dashboard NKO:", err);
      // Fallback coba endpoint alias jika /tu/nko/dashboard dicegat permission
      try {
        const altRes = await api.get(
          `${baseUrl}/api/nko/dashboard?year=${year}&month=${encodeURIComponent(month)}`,
        );
        if (altRes.data?.data) {
          setData(altRes.data.data);
          return;
        }
      } catch (_) {}
      setError(
        err?.response?.data?.message ||
          "Gagal memuat data Kerangka Kerja Logis & NKO.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedYear, activeMonth);
  }, [selectedYear, activeMonth]);

  const filteredRows = useMemo(() => {
    if (!data?.kerangka_kerja_logis) return [];
    if (!searchFilter.trim()) return data.kerangka_kerja_logis;
    const q = searchFilter.toLowerCase();
    return data.kerangka_kerja_logis.filter(
      (r) =>
        r.indikator.toLowerCase().includes(q) ||
        r.sasaran.toLowerCase().includes(q) ||
        String(r.no).includes(q),
    );
  }, [data, searchFilter]);

  const getCapaianBadge = (valStr: string, isNorm = false) => {
    if (!valStr || valStr === "-") {
      return <span className="text-slate-400 font-medium">-</span>;
    }
    const cleanNum = parseFloat(valStr.replace("%", ""));
    if (isNaN(cleanNum)) {
      return <span className="text-slate-400 font-medium">{valStr}</span>;
    }

    if (cleanNum > 100) {
      return (
        <span className="inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 text-xs font-bold rounded-md bg-[#00bcd4] text-white shadow-sm">
          {valStr}
        </span>
      );
    }
    if (cleanNum >= 100) {
      return (
        <span className="inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 text-xs font-bold rounded-md bg-[#4caf50] text-white shadow-sm">
          {valStr}
        </span>
      );
    }
    if (cleanNum >= 80) {
      return (
        <span className="inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 text-xs font-bold rounded-md bg-[#8bc34a] text-white shadow-sm">
          {valStr}
        </span>
      );
    }
    if (cleanNum >= 60) {
      return (
        <span className="inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 text-xs font-bold rounded-md bg-[#ff9800] text-white shadow-sm">
          {valStr}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 text-xs font-bold rounded-md bg-[#f44336] text-white shadow-sm">
        {valStr}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Bar ala SIMETRIS */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 font-bold">
            <Icon icon="solar:chart-2-bold" className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                <Icon
                  icon="solar:calendar-date-bold"
                  className="text-slate-500"
                />
                {selectedYear}
              </span>
              <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Balai Besar Pengawas Obat dan Makanan di Mataram
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dashboard Nilai Kinerja Organisasi (NKO) & Kerangka Kerja Logis
              SIMETRIS BPOM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showFullTableLink && (
            <Link
              href="/siproval/tu/konversi-nko"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <Icon icon="solar:table-split-bold" className="text-base" />
              Tabel 12 Bulan (Konversi NKO)
            </Link>
          )}
          <button
            type="button"
            onClick={() => fetchData(selectedYear, activeMonth)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50"
          >
            <Icon
              icon="solar:refresh-circle-bold"
              className={`text-base ${loading ? "animate-spin" : ""}`}
            />
            Perbarui
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card NKO */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00bcd4] to-[#0097a7] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/90">
              NKO
            </h4>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
              {data?.cards.nko.predikat || "-"}
            </span>
          </div>
          <p className="text-xs text-white/80 mt-1">
            Data Tahun {selectedYear}
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {loading ? "..." : data?.cards.nko.score_formatted || "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-white/80 flex items-center gap-1">
            <Icon icon="solar:shield-check-bold" />
            Normalisasi $\le$ 110% SAKIP Ka BPOM
          </div>
        </div>

        {/* Card Pagu */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Pagu
            </h4>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon icon="solar:wallet-money-bold" className="text-lg" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {data?.cards.pagu.sub || `Data Tahun ${selectedYear}`}
          </p>
          <div className="mt-4">
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">
              {loading ? "..." : data?.cards.pagu.value_formatted || "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Pagu Alokasi DIPA Mataram
          </div>
        </div>

        {/* Card Realisasi Anggaran */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Realisasi Anggaran
            </h4>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon icon="solar:card-recive-bold" className="text-lg" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {data?.cards.realisasi_anggaran.sub || `Data Tahun ${selectedYear}`}
          </p>
          <div className="mt-4">
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">
              {loading
                ? "..."
                : data?.cards.realisasi_anggaran.value_formatted || "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Realisasi Belanja s.d. Bulan Ini
          </div>
        </div>

        {/* Card Capaian Anggaran */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Capaian
            </h4>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Icon icon="solar:pie-chart-2-bold" className="text-lg" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {data?.cards.capaian_anggaran.sub || `Data Tahun ${selectedYear}`}
          </p>
          <div className="mt-4">
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">
              {loading
                ? "..."
                : data?.cards.capaian_anggaran.value_formatted || "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Persentase Serapan Anggaran
          </div>
        </div>
      </div>

      {/* Kerangka Kerja Logis Section */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Kerangka Kerja Logis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi capaian 28 Indikator Kinerja Sasaran Kegiatan (IKSK)
                berdasarkan Pedoman SAKIP BPOM
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Bulan: hanya tampil jika TIDAK dikendalikan dari filter utama dashboard di atas */}
              {!hideMonthSelector && !propSelectedMonth ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Pilih Bulan:
                  </label>
                  <div className="relative min-w-[160px]">
                    <select
                      value={activeMonth}
                      onChange={(e) => {
                        setInternalMonth(e.target.value);
                        onMonthChange?.(e.target.value);
                      }}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    >
                      {MONTH_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50/80 px-3 py-1.5 text-xs font-bold text-cyan-800">
                  <Icon icon="solar:calendar-bold" className="text-cyan-600" />
                  <span>
                    Periode: Bulan {activeMonth} {selectedYear}
                  </span>
                </span>
              )}

              {/* Search bar */}
              <div className="relative min-w-[200px]">
                <Icon
                  icon="solar:magnifer-linear"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
                />
                <input
                  type="text"
                  placeholder="Cari indikator / sasaran..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Kerangka Kerja Logis ala SIMETRIS */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#1a2b49] text-white font-bold tracking-wider">
                <th className="w-12 py-3.5 px-3 text-center border-r border-white/10">
                  NO
                </th>
                <th className="min-w-[240px] max-w-[320px] py-3.5 px-4 border-r border-white/10">
                  SASARAN
                </th>
                <th className="min-w-[300px] py-3.5 px-4 border-r border-white/10">
                  INDIKATOR
                </th>
                <th className="w-24 py-3.5 px-3 text-center border-r border-white/10">
                  TARGET
                </th>
                <th className="w-24 py-3.5 px-3 text-center border-r border-white/10">
                  REALISASI
                </th>
                <th className="w-28 py-3.5 px-3 text-center border-r border-white/10">
                  CAPAIAN
                </th>
                <th className="w-32 py-3.5 px-3 text-center">
                  CAPAIAN DINORMALISASI
                  <span className="block text-[10px] text-cyan-300 font-normal">
                    A (Maks 110%)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Icon
                      icon="solar:refresh-circle-bold"
                      className="mx-auto mb-2 text-2xl animate-spin text-cyan-600"
                    />
                    Memuat data Kerangka Kerja Logis bulan {selectedMonth}...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada indikator yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr
                    key={r.no}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                      {r.no}
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-snug border-r border-slate-100 font-medium">
                      {r.sasaran}
                    </td>
                    <td className="py-3 px-4 text-slate-800 leading-snug border-r border-slate-100 font-medium">
                      {r.indikator}
                      {r.is_annual_target && (
                        <span className="ml-2 inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          Target Tahunan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {r.target}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {r.realisasi}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                      {getCapaianBadge(r.capaian, false)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getCapaianBadge(r.capaian_dinormalisasi, true)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info SAKIP */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-xs text-slate-500 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:info-circle-bold"
              className="text-cyan-600 text-base flex-shrink-0"
            />
            <span>
              Perhitungan NKO mengacu pada SK Ka BPOM No. 676 Tahun 2025.
              Indikator target tahunan yang belum jatuh tempo (N/A) dikecualikan
              dari pembagi rata-rata.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-[#00bcd4]" /> &gt; 100%
              (Istimewa)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-[#4caf50]" /> 100% (Baik)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-[#f44336]" /> &lt; 80%
              (Perlu Perbaikan)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
