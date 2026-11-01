"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";
import TargetRealisasiTuChart from "@/components/siproval/tu/TargetRealisasiTuChart";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

const MONTHS = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

export interface IndicatorItem {
  row_number: number;
  iksk_id: number;
  no_indikator?: number;
  spreadsheet_id?: number | null;
  tab_id?: number | null;
  label: string;
  sasaran: string;
  target_tahunan: string;
  target_bulan: string;
  realisasi_bulan: string;
  capaian: number;
  status: "tercapai" | "belum";
  arahan: string;
}

interface IkskItem {
  id: number;
  name: string;
}

interface DashboardMetrics {
  total_assigned_iksks?: number;
  user_iksks?: Array<{ id: number; name: string }>;
  total_arahan_pimpinan?: number;
  data_source?: string;
  counts_iku?: Record<
    number,
    {
      tidak_dapat_disimpulkan: number;
      sangat_baik: number;
      baik: number;
      cukup: number;
      total: number;
      persen_tercapai: number;
    }
  >;
  counts_caput?: Record<
    number,
    {
      caput_tidak_mencapai_target: number;
      caput_mencapai_target: number;
    }
  >;
  indicators_by_month?: Record<number, IndicatorItem[]>;
}

interface KatimStats {
  total_iksk?: number;
  total_iksk_connected?: number;
  iksks?: IkskItem[];
  indicators?: IndicatorItem[];
  total_spreadsheets?: number;
  total_indikator?: number;
  total_catatan?: number;
  total_arahan?: number;
  perlu_evaluasi?: number;
  tercapai?: number;
}

export default function DashboardKatim() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const currentMonthIdx = new Date().getMonth(); // 0-indexed (e.g. 10 for November)
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTHS[currentMonthIdx] || "NOVEMBER"
  );
  const selectedMonthIdx = MONTHS.indexOf(selectedMonth) + 1;

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [stats, setStats] = useState<KatimStats | null>(null);
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [arahanList, setArahanList] = useState<any[]>([]);
  const [loadingArahan, setLoadingArahan] = useState<boolean>(true);

  // Table filter and search
  const [indicatorFilter, setIndicatorFilter] = useState<
    "all" | "belum" | "tercapai"
  >("all");
  const [searchTable, setSearchTable] = useState<string>("");
  const tableSectionRef = useRef<HTMLDivElement | null>(null);

  const userName = user?.name || user?.call_name || "Ketua Tim (Katim)";
  const selectedMonthTitle =
    selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1).toLowerCase();

  // Fetch full Monev indicators & stats (all 30 IKSKs)
  useEffect(() => {
    const fetchMonevData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("user_id", String(user.id));
        queryParams.set("month", selectedMonth);

        // Try katim endpoint first, fallback to kabalai if needed
        let res;
        try {
          res = await api.get(
            `${baseUrl}/api/katim/form-catatan?${queryParams.toString()}`
          );
        } catch {
          res = await api.get(
            `${baseUrl}/api/kabalai/form-catatan?${queryParams.toString()}`
          );
        }

        if (res.data) {
          const data = res.data;
          if (data.stats) {
            setStats(data.stats);
          }
          const rawIndicators = data.indicators || data.stats?.indicators;
          if (Array.isArray(rawIndicators) && rawIndicators.length > 0) {
            setIndicators(rawIndicators);
          }
        }
      } catch (err: any) {
        console.error("Gagal memuat rekapitulasi data IKSK Katim:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonevData();
  }, [user?.id, selectedMonth]);

  // Fetch Katim personal metrics
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("user_id", String(user.id));
        const res = await api.get(
          `${baseUrl}/api/katim/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
        );
        if (res.data?.status === "success" && res.data?.data) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error("Gagal memuat metrik dashboard Katim:", err);
      }
    };

    fetchDashboardMetrics();
  }, [user?.id]);

  // Fetch Arahan Pimpinan
  useEffect(() => {
    const fetchArahan = async () => {
      setLoadingArahan(true);
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("user_id", String(user.id));
        queryParams.set("month", selectedMonth);
        const res = await api.get(
          `${baseUrl}/api/katim/arahan-pimpinan?${queryParams.toString()}`
        );
        if (res.data?.status === "success" && res.data?.data) {
          setArahanList(res.data.data.arahan_list || []);
        }
      } catch (err) {
        console.error("Gagal memuat arahan pimpinan di dashboard:", err);
      } finally {
        setLoadingArahan(false);
      }
    };

    fetchArahan();
  }, [user?.id, selectedMonth]);

  // Derived indicator status calculations
  const unachievedIndicators = useMemo(
    () => indicators.filter((i) => i.status === "belum"),
    [indicators]
  );
  const achievedIndicators = useMemo(
    () => indicators.filter((i) => i.status === "tercapai"),
    [indicators]
  );

  const currentTercapai =
    indicators.length > 0
      ? achievedIndicators.length
      : (stats?.tercapai ?? 0);

  const currentPerluEvaluasi =
    indicators.length > 0
      ? unachievedIndicators.length
      : (stats?.perlu_evaluasi ?? 0);

  // Filtered indicators for the table
  const displayedTableIndicators = useMemo(() => {
    return indicators.filter((ind) => {
      if (indicatorFilter === "belum" && ind.status !== "belum") return false;
      if (indicatorFilter === "tercapai" && ind.status !== "tercapai")
        return false;

      if (!searchTable.trim()) return true;
      const q = searchTable.toLowerCase();
      return (
        String(ind.iksk_id).includes(q) ||
        ind.label.toLowerCase().includes(q) ||
        (ind.sasaran && ind.sasaran.toLowerCase().includes(q))
      );
    });
  }, [indicators, indicatorFilter, searchTable]);

  const scrollToTable = (filter?: "all" | "belum" | "tercapai") => {
    if (filter) setIndicatorFilter(filter);
    if (tableSectionRef.current) {
      tableSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Specific indicators assigned to this Katim
  const myAssignedIndicators =
    metrics?.indicators_by_month?.[selectedMonthIdx] || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner with BBPOM Blue & Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] p-6 text-white shadow-lg lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon
                icon="solar:shield-check-bold"
                width={15}
                className="text-emerald-300"
              />
              Ketua Tim Kerja (Katim)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon
                icon="solar:database-bold"
                width={14}
                className="text-blue-200"
              />
              Data Riil Rekapitulasi RHPK &amp; TU 2026
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Selamat Datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Pantau rekapitulasi capaian indikator kinerja (IKSK), grafik
            realisasi target RO &amp; anggaran TU, serta koordinasikan pengisian
            dan tindak lanjut arahan secara terintegrasi.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/katim/entry-data-rhpk"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:pen-new-square-bold" width={16} />
              <span>Entry Data RHPK</span>
            </Link>
            <button
              type="button"
              onClick={() => scrollToTable("belum")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-400"
            >
              <Icon icon="solar:danger-triangle-bold" width={16} />
              <span>Rincian IKSK Belum Tercapai ({currentPerluEvaluasi})</span>
            </button>
            <Link
              href="/siproval/katim/arahan-pimpinan"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Icon
                icon="solar:chat-round-line-bold"
                width={16}
                className="text-emerald-300"
              />
              <span>Lihat Arahan Pimpinan</span>
            </Link>
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 opacity-15">
          <Icon icon="solar:widget-5-bold" width={340} height={340} />
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <Icon
            icon="solar:danger-triangle-bold"
            width={20}
            className="shrink-0 text-rose-600"
          />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Month Filter Selector */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#005baa]">
            <Icon icon="solar:calendar-bold" width={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">
              Periode Evaluasi Capaian:
            </span>
            <span className="text-[11px] text-slate-500">
              Menampilkan capaian 30 indikator IKSK dan arahan Kepala Balai pada
              bulan terpilih
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2 text-xs font-bold text-[#005baa] transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                Bulan {m} {currentYear}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Stats Cards (Same as Kabalai cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total IKSK */}
        <div
          onClick={() => scrollToTable("all")}
          className="group relative flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 p-5 shadow-2xs transition hover:shadow-md hover:border-[#005baa]/60 cursor-pointer"
          title="Klik untuk melihat rincian seluruh IKSK"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                  Total IKSK
                </p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-[#005baa]">
                  Aktif
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 group-hover:text-[#005baa] transition">
                {loading
                  ? "..."
                  : (stats?.total_iksk ??
                    (indicators.length > 0 ? indicators.length : 30))}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Indikator Sasaran Kegiatan (
                {stats?.total_iksk_connected ?? 25} terhubung sheet)
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-[#005baa] transition group-hover:bg-[#005baa] group-hover:text-white">
              <Icon icon="solar:target-bold" width={24} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-blue-100/60 pt-2.5 text-[11px] text-[#005baa] font-medium">
            <span>Rincian Seluruh IKSK</span>
            <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition font-semibold">
              Lihat tabel <Icon icon="solar:arrow-right-linear" width={12} />
            </span>
          </div>
        </div>

        {/* Card 2: Target Terpenuhi */}
        <div
          onClick={() => scrollToTable("tercapai")}
          className="group relative flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-5 shadow-2xs transition hover:shadow-md hover:border-[#00a651]/60 cursor-pointer"
          title="Klik untuk melihat daftar IKSK yang telah memenuhi target"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#00a651]">
                  Target Terpenuhi ({selectedMonth})
                </p>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  ≥ 100%
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-[#00a651] group-hover:scale-105 transition transform origin-left">
                {loading ? "..." : currentTercapai}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                dari {indicators.length > 0 ? indicators.length : 30} total
                indikator
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#00a651] transition group-hover:bg-[#00a651] group-hover:text-white">
              <Icon icon="solar:check-circle-bold" width={24} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-emerald-100/60 pt-2.5 text-[11px] text-emerald-700 font-medium">
            <span>Lihat IKSK Sukses</span>
            <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition font-semibold">
              {currentTercapai} Tercapai{" "}
              <Icon icon="solar:arrow-right-linear" width={12} />
            </span>
          </div>
        </div>

        {/* Card 3: Perlu Evaluasi */}
        <div
          onClick={() => scrollToTable("belum")}
          className="group relative flex flex-col justify-between rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-rose-50/50 p-5 shadow-sm transition hover:shadow-lg hover:border-amber-500 cursor-pointer ring-2 ring-amber-100"
          title="Klik untuk melihat rincian IKSK yang belum mencapai target"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Perlu Evaluasi ({selectedMonth})
                </p>
                <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[9px] font-extrabold text-amber-900 animate-pulse">
                  Perhatian Pimpinan
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-amber-800 group-hover:scale-105 transition transform origin-left">
                {loading ? "..." : currentPerluEvaluasi}
              </p>
              <span className="mt-1 inline-block text-xs font-medium text-amber-900/80">
                Belum mencapai target bulanan
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-800 transition group-hover:bg-amber-600 group-hover:text-white shadow-xs">
              <Icon icon="solar:danger-triangle-bold" width={24} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-amber-200/80 pt-2.5 text-[11px] text-amber-900 font-bold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
              Lihat Rincian IKSK
            </span>
            <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition underline decoration-amber-400">
              {currentPerluEvaluasi} Belum Tercapai{" "}
              <Icon icon="solar:arrow-right-linear" width={12} />
            </span>
          </div>
        </div>

        {/* Card 4: Total Arahan Pimpinan */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 via-white to-amber-50/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                Total Arahan Pimpinan
              </p>
              <p className="mt-2 text-3xl font-bold text-[#005baa]">
                {loading
                  ? "..."
                  : (stats?.total_arahan ?? stats?.total_catatan ?? 0)}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Arahan tercatat di RHPK 2026
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-[#005baa]">
              <Icon icon="solar:chat-round-check-bold" width={24} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-blue-100/60 pt-2.5 text-[11px] text-[#005baa] font-medium">
            <span>Riwayat Arahan</span>
            <Link
              href="/siproval/katim/arahan-pimpinan"
              className="inline-flex items-center gap-1 hover:underline font-semibold"
            >
              Lihat Semua <Icon icon="solar:arrow-right-linear" width={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bagian 1: Grafik Target vs Realisasi dari Aktor TU */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#005baa] text-white">
            <Icon icon="solar:chart-square-bold" width={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Monitoring Kinerja &amp; Anggaran Satuan Kerja (Data TU)
            </h2>
            <p className="text-[11px] text-slate-500">
              Grafik target vs realisasi Volume Rincian Output (RO) dan serapan
              Pagu Anggaran BBPOM di Mataram Tahun Anggaran 2026.
            </p>
          </div>
        </div>

        <TargetRealisasiTuChart isKabalaiView={true} />
      </div>

      {/* Bagian 2: Tabel Rincian Capaian Indikator Kinerja Sasaran Kegiatan (IKSK) */}
      <div
        ref={tableSectionRef}
        className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-white to-emerald-50/40 px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#005baa] text-white shadow-2xs">
                <Icon icon="solar:checklist-minimalistic-bold" width={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rincian Capaian Indikator Kinerja Sasaran Kegiatan (IKSK)
                </h3>
                <span className="text-xs text-slate-500">
                  Status pencapaian target bulanan {selectedMonth} 2026 &bull;
                  Klik nomor IKSK untuk melihat rincian
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills: Semua, Belum Tercapai, Tercapai */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIndicatorFilter("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                indicatorFilter === "all"
                  ? "bg-[#005baa] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Semua ({indicators.length})
            </button>
            <button
              type="button"
              onClick={() => setIndicatorFilter("belum")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                indicatorFilter === "belum"
                  ? "bg-amber-600 text-white"
                  : "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              }`}
            >
              <Icon icon="solar:danger-triangle-bold" width={14} />
              <span>Belum Tercapai ({currentPerluEvaluasi})</span>
            </button>
            <button
              type="button"
              onClick={() => setIndicatorFilter("tercapai")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                indicatorFilter === "tercapai"
                  ? "bg-[#00a651] text-white"
                  : "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
              }`}
            >
              <Icon icon="solar:check-circle-bold" width={14} />
              <span>Tercapai ({currentTercapai})</span>
            </button>
          </div>
        </div>

        {/* Search input for table */}
        <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Icon
              icon="solar:magnifer-linear"
              width={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="Cari berdasarkan nama indikator atau nomor IKSK..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 transition focus:border-[#005baa] focus:outline-none"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Menampilkan{" "}
            <strong className="text-slate-900 font-bold">
              {displayedTableIndicators.length}
            </strong>{" "}
            indikator
          </div>
        </div>

        {/* Detailed Indicators Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 w-14 text-center">IKSK</th>
                <th className="px-4 py-3 min-w-[280px]">
                  Indikator &amp; Sasaran Kegiatan
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  Target 2026
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  Target {selectedMonth}
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  Realisasi {selectedMonth}
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  % Capaian
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 min-w-[200px]">
                  Arahan Kepala Balai
                </th>
                <th className="px-4 py-3 text-center whitespace-nowrap">
                  Aksi / Lembar RHPK
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedTableIndicators.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Icon
                      icon="solar:document-outline"
                      width={32}
                      className="mx-auto mb-2 opacity-40"
                    />
                    <p className="text-xs font-medium">
                      Tidak ada indikator yang sesuai dengan filter.
                    </p>
                    {indicatorFilter !== "all" && (
                      <button
                        type="button"
                        onClick={() => {
                          setIndicatorFilter("all");
                          setSearchTable("");
                        }}
                        className="mt-2 text-xs font-bold text-[#005baa] hover:underline"
                      >
                        Reset Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayedTableIndicators.map((ind) => {
                  const isTercapai = ind.status === "tercapai";
                  const hasReal =
                    ind.realisasi_bulan &&
                    ind.realisasi_bulan !== "#DIV/0!" &&
                    ind.realisasi_bulan !== "" &&
                    ind.realisasi_bulan !== "-";

                  return (
                    <tr
                      key={ind.row_number || ind.iksk_id}
                      className={`transition ${
                        !isTercapai
                          ? "bg-amber-50/30 hover:bg-amber-50/60"
                          : "hover:bg-blue-50/30"
                      }`}
                    >
                      {/* IKSK Badge */}
                      <td className="px-4 py-3.5 text-center font-bold text-slate-600 align-top">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          title={`Buka formulir RHPK untuk IKSK #${ind.iksk_id}`}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs transition ${
                            isTercapai
                              ? "bg-blue-50 text-[#005baa] hover:bg-[#005baa] hover:text-white"
                              : "bg-amber-100 text-amber-900 hover:bg-amber-600 hover:text-white"
                          }`}
                        >
                          {ind.iksk_id}
                        </Link>
                      </td>

                      {/* Indikator & Sasaran */}
                      <td className="px-4 py-3.5 align-top">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          className="font-bold text-slate-900 hover:text-[#005baa] transition leading-snug"
                        >
                          {ind.label}
                        </Link>
                        {ind.sasaran && (
                          <div className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                            {ind.sasaran}
                          </div>
                        )}
                      </td>

                      {/* Target 2026 */}
                      <td className="px-3 py-3.5 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {ind.target_tahunan || "-"}
                      </td>

                      {/* Target Bulan */}
                      <td className="px-3 py-3.5 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {ind.target_bulan || "-"}
                      </td>

                      {/* Realisasi Bulan */}
                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {hasReal ? (
                          <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-900 text-[11px]">
                            {ind.realisasi_bulan}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            -
                          </span>
                        )}
                      </td>

                      {/* % Capaian */}
                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {ind.capaian > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isTercapai
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-900 font-extrabold border border-amber-300"
                            }`}
                          >
                            <span>{ind.capaian}%</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {isTercapai ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <Icon icon="solar:check-circle-bold" width={14} />
                            Tercapai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300">
                            <Icon
                              icon="solar:danger-triangle-bold"
                              width={14}
                              className="text-amber-700"
                            />
                            Belum Tercapai
                          </span>
                        )}
                      </td>

                      {/* Arahan Kepala Balai */}
                      <td className="px-4 py-3.5 align-top">
                        {ind.arahan ? (
                          <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                            <span className="font-bold text-amber-800 block text-[10px] uppercase">
                              Arahan Pimpinan:
                            </span>
                            <span className="italic">
                              &ldquo;{ind.arahan}&rdquo;
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada arahan
                          </span>
                        )}
                      </td>

                      {/* Aksi Lembar RHPK */}
                      <td className="px-4 py-3.5 text-center align-top whitespace-nowrap">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90 hover:shadow-sm"
                          title={`Buka formulir pengisian IKSK #${ind.iksk_id}`}
                        >
                          <Icon
                            icon="ri:file-excel-2-fill"
                            width={15}
                            className="text-emerald-300"
                          />
                          <span>Buka IKSK #{ind.iksk_id}</span>
                          <Icon icon="solar:arrow-right-linear" width={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian 3: Rekapitulasi Data Asli Indikator Tim (Khusus Tim Katim Saat Ini) */}
      {myAssignedIndicators.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-emerald-50/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi Data Asli Indikator Tim ({selectedMonthTitle}{" "}
                  {currentYear})
                </h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#005baa]">
                  {myAssignedIndicators.length} Indikator Tim
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Nilai capaian riil indikator yang secara spesifik ditugaskan ke
                tim Anda.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Klik tombol{" "}
              <strong className="text-[#005baa] font-bold">
                &quot;Buka IKSK&quot;
              </strong>{" "}
              pada baris terkait untuk langsung membuka formulir pengisian RHPK.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 w-12 text-center">No</th>
                  <th className="px-4 py-3 min-w-[260px]">
                    Indikator & Sasaran Kegiatan
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Target 2026
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Target {selectedMonthTitle}
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Realisasi {selectedMonthTitle}
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    % Capaian
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">
                    Arahan Kepala Balai
                  </th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">
                    Aksi Pengisian RHPK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {myAssignedIndicators.map((ind) => {
                  const isTercapai = ind.status === "tercapai";
                  const hasReal =
                    ind.realisasi_bulan &&
                    ind.realisasi_bulan !== "#DIV/0!" &&
                    ind.realisasi_bulan !== "";

                  return (
                    <tr
                      key={ind.row_number}
                      className="hover:bg-blue-50/30 transition"
                    >
                      <td className="px-4 py-3.5 text-center font-bold text-slate-600 align-top">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          title={`Buka formulir RHPK untuk IKSK #${ind.iksk_id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700 text-xs transition hover:bg-[#005baa] hover:text-white"
                        >
                          {ind.iksk_id}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          className="font-bold text-slate-900 hover:text-[#005baa] transition"
                          title={`Buka formulir RHPK untuk IKSK #${ind.iksk_id}`}
                        >
                          {ind.label}
                        </Link>
                        {ind.sasaran && (
                          <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                            {ind.sasaran}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {ind.target_tahunan || "-"}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {ind.target_bulan || "-"}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {hasReal ? (
                          <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-800 text-[11px]">
                            {ind.realisasi_bulan}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            -
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {hasReal && ind.capaian > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isTercapai
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <span>{ind.capaian}%</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {isTercapai ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <Icon icon="solar:check-circle-bold" width={14} />
                            Tercapai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <Icon icon="solar:clock-circle-bold" width={14} />
                            Belum
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        {ind.arahan ? (
                          <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                            <span className="font-bold text-amber-800 block text-[10px] uppercase">
                              Arahan:
                            </span>
                            <span className="italic">
                              &ldquo;{ind.arahan}&rdquo;
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada arahan
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center align-top whitespace-nowrap">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90 hover:shadow-sm"
                          title={`Buka formulir RHPK IKSK #${ind.iksk_id}`}
                        >
                          <Icon
                            icon="ri:file-excel-2-fill"
                            width={15}
                            className="text-emerald-300"
                          />
                          <span>Buka IKSK #{ind.iksk_id}</span>
                          <Icon icon="solar:arrow-right-linear" width={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
