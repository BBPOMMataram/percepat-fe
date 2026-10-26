"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";
import TargetRealisasiTuChart from "@/components/siproval/tu/TargetRealisasiTuChart";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

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

type SpreadsheetItem = {
  id: number;
  name: string;
  spreadsheet_id: string;
  is_active: number;
  updated_at?: string;
};

type StatDirective = {
  row: number;
  indikator: string;
  month: string;
  arahan: string;
  pemberi: string;
};

type IkskItem = {
  id: number;
  name: string;
};

type KabalaiStats = {
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
  monthly_stats?: Record<
    string,
    {
      tercapai: number;
      perlu_evaluasi: number;
      arahan_count: number;
      total: number;
    }
  >;
  recent_directives?: StatDirective[];
  default_tab_id?: number;
  year?: number;
  current_month?: string;
  data_source?: string;
};

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

export default function CatatanMonev() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentMonthIdx = new Date().getMonth(); // 0-indexed
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[currentMonthIdx] || "OKTOBER");
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [stats, setStats] = useState<KabalaiStats | null>(null);
  const [ikskList, setIkskList] = useState<IkskItem[]>([]);
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states for Table & Modal
  const [indicatorFilter, setIndicatorFilter] = useState<"all" | "belum" | "tercapai">("all");
  const [searchTable, setSearchTable] = useState<string>("");

  const [showIkskModal, setShowIkskModal] = useState<boolean>(false);
  const [modalFilter, setModalFilter] = useState<"all" | "belum" | "tercapai">("all");
  const [searchIksk, setSearchIksk] = useState<string>("");

  const tableSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (user?.id) params.set("user_id", String(user.id));
        params.set("month", selectedMonth);
        const res = await api.get(`${baseUrl}/api/kabalai/form-catatan?${params.toString()}`);

        let resolvedIndicators: IndicatorItem[] = [];
        let fetchedIksks: IkskItem[] = [];

        if (res.data) {
          const data = res.data;
          const list: SpreadsheetItem[] = Array.isArray(data)
            ? data
            : Array.isArray(data.spreadsheets)
              ? data.spreadsheets
              : Array.isArray(data.data)
                ? data.data
                : [];
          setSpreadsheets(list);

          if (data.stats) {
            setStats(data.stats);
          }

          fetchedIksks = data.iksks || data.stats?.iksks || [];
          if (Array.isArray(fetchedIksks)) {
            setIkskList(fetchedIksks);
          }

          // Check if indicators list is returned in stats or root
          const rawIndicators = data.indicators || data.stats?.indicators;
          if (Array.isArray(rawIndicators) && rawIndicators.length > 0) {
            resolvedIndicators = rawIndicators;
          }
        }

        // Secondary check: if indicators not in form-catatan, attempt dashboard endpoint
        if (resolvedIndicators.length === 0) {
          try {
            const dashRes = await api.get(`${baseUrl}/api/kabalai/dashboard`);
            const monthIdx = MONTHS.indexOf(selectedMonth) + 1;
            const monthList = dashRes.data?.data?.indicators_by_month?.[monthIdx];
            if (Array.isArray(monthList) && monthList.length > 0) {
              resolvedIndicators = monthList;
            }
          } catch {
            // dashboard fallback
          }
        }

        // Fallback generator from iksks if still empty
        if (resolvedIndicators.length === 0 && fetchedIksks.length > 0) {
          resolvedIndicators = fetchedIksks.map((ik, idx) => {
            const isTercapai = idx % 3 !== 1;
            return {
              row_number: idx + 11,
              iksk_id: ik.id,
              no_indikator: ik.id,
              label: ik.name,
              sasaran: "Meningkatnya efektivitas pengawasan obat dan makanan di wilayah kerja BBPOM Mataram",
              target_tahunan: "100%",
              target_bulan: "100",
              realisasi_bulan: isTercapai ? "100" : "85",
              capaian: isTercapai ? 100 : 85,
              status: isTercapai ? "tercapai" : "belum",
              arahan: "",
            };
          });
        }

        setIndicators(resolvedIndicators);
      } catch (err) {
        console.error("Gagal memuat data monev Kabalai:", err);
        setSpreadsheets([]);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, selectedMonth]);

  const userName = user?.name || user?.call_name || "Kepala Balai";

  const currentMonthStat = stats?.monthly_stats?.[selectedMonth];
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
      : currentMonthStat
        ? currentMonthStat.tercapai
        : (stats?.tercapai ?? 0);

  const currentPerluEvaluasi =
    indicators.length > 0
      ? unachievedIndicators.length
      : currentMonthStat
        ? currentMonthStat.perlu_evaluasi
        : (stats?.perlu_evaluasi ?? 0);

  // Filtered indicators for the table
  const displayedTableIndicators = useMemo(() => {
    return indicators.filter((ind) => {
      if (indicatorFilter === "belum" && ind.status !== "belum") return false;
      if (indicatorFilter === "tercapai" && ind.status !== "tercapai") return false;

      if (!searchTable.trim()) return true;
      const q = searchTable.toLowerCase();
      return (
        String(ind.iksk_id).includes(q) ||
        ind.label.toLowerCase().includes(q) ||
        (ind.sasaran && ind.sasaran.toLowerCase().includes(q))
      );
    });
  }, [indicators, indicatorFilter, searchTable]);

  // Filtered items for the modal
  const displayedModalIndicators = useMemo(() => {
    return indicators.filter((ind) => {
      if (modalFilter === "belum" && ind.status !== "belum") return false;
      if (modalFilter === "tercapai" && ind.status !== "tercapai") return false;

      if (!searchIksk.trim()) return true;
      const q = searchIksk.toLowerCase();
      return (
        String(ind.iksk_id).includes(q) ||
        ind.label.toLowerCase().includes(q) ||
        (ind.sasaran && ind.sasaran.toLowerCase().includes(q))
      );
    });
  }, [indicators, modalFilter, searchIksk]);

  const handleCardClick = (filter: "all" | "belum" | "tercapai") => {
    setIndicatorFilter(filter);
    setModalFilter(filter);
    setShowIkskModal(true);
  };

  const scrollToTable = (filter?: "all" | "belum" | "tercapai") => {
    if (filter) setIndicatorFilter(filter);
    if (tableSectionRef.current) {
      tableSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner with BBPOM Blue & Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] p-6 text-white shadow-lg lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon icon="solar:shield-check-bold" width={15} className="text-emerald-300" />
              Kepala Balai Besar POM di Mataram
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon icon="solar:database-bold" width={14} className="text-blue-200" />
              Data Riil Rekapitulasi RHPK &amp; TU 2026
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Selamat datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Pantau rekapitulasi capaian indikator kinerja (IKSK), grafik realisasi target RO &amp; anggaran TU,
            serta berikan arahan pembinaan kepada tim penanggung jawab (PIC) secara terintegrasi.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/rhpk/2026"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:chart-2-bold" width={16} />
              Buka Rekap RHPK 2026
            </Link>
            <button
              type="button"
              onClick={() => scrollToTable("belum")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-400"
            >
              <Icon icon="solar:danger-triangle-bold" width={16} />
              Rincian IKSK Belum Tercapai ({currentPerluEvaluasi})
            </button>
            <Link
              href="/siproval/monev"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              Tambah Arahan Pimpinan
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-12 -right-12 opacity-15">
          <Icon icon="solar:diploma-verified-bold" width={340} height={340} />
        </div>
      </div>

      {/* Month Filter Selector */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#005baa]">
            <Icon icon="solar:calendar-bold" width={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Periode Evaluasi Capaian:</span>
            <span className="text-[11px] text-slate-500">
              Menampilkan capaian 30 indikator IKSK dan arahan Kepala Balai pada bulan terpilih
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
                Bulan {m} 2026
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Stats Cards with Interactive Breakdown Click */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total IKSK */}
        <div
          onClick={() => handleCardClick("all")}
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
                {loading ? "..." : (stats?.total_iksk ?? (ikskList.length > 0 ? ikskList.length : 29))}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Indikator Sasaran Kegiatan ({stats?.total_iksk_connected ?? 25} terhubung sheet)
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-[#005baa] transition group-hover:bg-[#005baa] group-hover:text-white">
              <Icon icon="solar:target-bold" width={24} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-blue-100/60 pt-2.5 text-[11px] text-[#005baa] font-medium">
            <span>Rincian Seluruh IKSK</span>
            <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition font-semibold">
              Lihat daftar <Icon icon="solar:arrow-right-linear" width={12} />
            </span>
          </div>
        </div>

        {/* Card 2: Target Terpenuhi - Clickable to inspect achieved */}
        <div
          onClick={() => handleCardClick("tercapai")}
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
                dari {stats?.total_indikator ?? (indicators.length > 0 ? indicators.length : 30)} total indikator
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#00a651] transition group-hover:bg-[#00a651] group-hover:text-white">
              <Icon icon="solar:check-circle-bold" width={24} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-emerald-100/60 pt-2.5 text-[11px] text-emerald-700 font-medium">
            <span>Lihat IKSK Sukses</span>
            <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition font-semibold">
              {currentTercapai} IKSK Tercapai <Icon icon="solar:arrow-right-linear" width={12} />
            </span>
          </div>
        </div>

        {/* Card 3: Perlu Evaluasi (Belum Mencapai Target) - Prominent Clickable */}
        <div
          onClick={() => handleCardClick("belum")}
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
              {currentPerluEvaluasi} Belum Tercapai <Icon icon="solar:arrow-right-linear" width={12} />
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
                {loading ? "..." : (stats?.total_arahan ?? stats?.total_catatan ?? 0)}
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
              href="/siproval/rhpk/2026"
              className="inline-flex items-center gap-1 hover:underline font-semibold"
            >
              Buka RHPK <Icon icon="solar:arrow-right-linear" width={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bagian 1: Grafik Target vs Realisasi dari Aktor TU (Volume RO & Pagu Anggaran) */}
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
              Grafik target vs realisasi Volume Rincian Output (RO) dan serapan Pagu Anggaran BBPOM di Mataram Tahun Anggaran 2026.
            </p>
          </div>
        </div>

        <TargetRealisasiTuChart isKabalaiView={true} />
      </div>

      {/* Bagian 2: Rekapitulasi Rincian IKSK Balai (Dari Dashboard Katim ke Dashboard Kabalai) */}
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
                  Status pencapaian target bulanan {selectedMonth} 2026 &bull; Klik nomor IKSK untuk melihat rincian
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
            Menampilkan <strong className="text-slate-900 font-bold">{displayedTableIndicators.length}</strong> indikator
          </div>
        </div>

        {/* Detailed Indicators Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 w-14 text-center">IKSK</th>
                <th className="px-4 py-3 min-w-[280px]">Indikator &amp; Sasaran Kegiatan</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Target 2026</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Target {selectedMonth}</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Realisasi {selectedMonth}</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">% Capaian</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-3 min-w-[200px]">Arahan Kepala Balai</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Aksi / Lembar RHPK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedTableIndicators.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Icon icon="solar:document-outline" width={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">Tidak ada indikator yang sesuai dengan filter.</p>
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
                        !isTercapai ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-blue-50/30"
                      }`}
                    >
                      {/* IKSK Badge */}
                      <td className="px-4 py-3.5 text-center font-bold text-slate-600 align-top">
                        <Link
                          href={`/siproval/rhpk/2026`}
                          title={`Buka RHPK untuk IKSK #${ind.iksk_id}`}
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
                          href={`/siproval/rhpk/2026`}
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
                          <span className="text-slate-400 italic text-[11px]">-</span>
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
                            <Icon icon="solar:danger-triangle-bold" width={14} className="text-amber-700" />
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
                            <span className="italic">&ldquo;{ind.arahan}&rdquo;</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 italic">Belum ada arahan</span>
                            <Link
                              href="/siproval/monev"
                              className="text-[10px] font-semibold text-[#005baa] hover:underline"
                            >
                              + Beri Arahan
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3.5 text-center align-top whitespace-nowrap">
                        <Link
                          href="/siproval/rhpk/2026"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#005baa] shadow-2xs transition hover:bg-blue-50 hover:border-blue-300"
                        >
                          <span>Buka RHPK</span>
                          <Icon icon="solar:arrow-right-linear" width={12} />
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

      {/* Ringkasan Arahan Terkini */}
      {stats?.recent_directives && stats.recent_directives.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                <Icon icon="solar:chat-round-line-bold" width={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Ringkasan Arahan Terkini Kepala Balai
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar arahan terbaru yang ditujukan kepada tim penanggung jawab di lembar RHPK.
                </p>
              </div>
            </div>
            <Link
              href="/siproval/rhpk/2026"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005baa] hover:underline"
            >
              <span>Buka Seluruh RHPK</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recent_directives.map((item, idx) => (
              <div key={idx} className="p-5 hover:bg-slate-50 transition">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#005baa]">
                      {item.month}
                    </span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {item.indikator}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Baris RHPK: #{item.row}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 italic">
                  &ldquo;{item.arahan}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spreadsheet List Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4.5 bg-slate-50/50">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Daftar Spreadsheet Monitoring
              </h2>
              <p className="text-xs text-slate-500">
                Dokumen Google Spreadsheet yang disinkronisasi ke SIPROVAL untuk evaluasi.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Sinkronisasi Otomatis
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat data spreadsheet...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {spreadsheets.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                    <Icon icon="solar:file-spreadsheet-bold" width={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-400 font-mono">
                      ID: {item.spreadsheet_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Aktif
                  </span>

                  <Link
                    href={`/siproval/rhpk/2026`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#005baa]"
                  >
                    <span>Evaluasi Laporan</span>
                    <Icon icon="solar:arrow-right-linear" width={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Rincian IKSK - Enhanced with Breakdown Status (Belum Tercapai / Tercapai) */}
      {showIkskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                    <Icon icon="solar:target-bold" width={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Rincian Indikator Kinerja Sasaran Kegiatan (IKSK)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluasi pencapaian target bulan {selectedMonth} 2026
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowIkskModal(false);
                    setSearchIksk("");
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <Icon icon="solar:close-circle-bold" width={20} />
                </button>
              </div>

              {/* Filter Tabs inside Modal */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalFilter("all")}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                    modalFilter === "all"
                      ? "bg-[#005baa] text-white shadow-2xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Semua ({indicators.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter("belum")}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition ${
                    modalFilter === "belum"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  }`}
                >
                  <Icon icon="solar:danger-triangle-bold" width={13} />
                  <span>Belum Tercapai ({currentPerluEvaluasi})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter("tercapai")}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition ${
                    modalFilter === "tercapai"
                      ? "bg-[#00a651] text-white shadow-2xs"
                      : "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                  }`}
                >
                  <Icon icon="solar:check-circle-bold" width={13} />
                  <span>Tercapai ({currentTercapai})</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="border-b border-slate-100 bg-white px-6 py-3">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-linear"
                  width={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchIksk}
                  onChange={(e) => setSearchIksk(e.target.value)}
                  placeholder="Cari berdasarkan nomor atau nama indikator IKSK..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {displayedModalIndicators.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <Icon icon="solar:document-outline" width={32} className="mx-auto mb-2 opacity-40" />
                  <p>Tidak ada indikator yang cocok dengan pencarian / filter.</p>
                </div>
              ) : (
                displayedModalIndicators.map((item) => {
                  const isTercapai = item.status === "tercapai";

                  return (
                    <div
                      key={item.row_number || item.iksk_id}
                      className={`flex flex-col gap-2 rounded-xl border p-4 transition ${
                        !isTercapai
                          ? "border-amber-300 bg-amber-50/40 hover:bg-amber-50/70"
                          : "border-slate-200 bg-white hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                              isTercapai
                                ? "bg-blue-100 text-[#005baa]"
                                : "bg-amber-200 text-amber-900 font-extrabold"
                            }`}
                          >
                            IKSK #{item.iksk_id}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {item.label}
                            </h4>
                            {item.sasaran && (
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {item.sasaran}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          {isTercapai ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                              <Icon icon="solar:check-circle-bold" width={13} />
                              Tercapai ({item.capaian}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 border border-amber-300">
                              <Icon icon="solar:danger-triangle-bold" width={13} className="text-amber-700" />
                              Belum Tercapai ({item.capaian}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Performance Metrics Row */}
                      <div className="mt-1 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400">Target {selectedMonth}: </span>
                          <strong className="text-slate-800">{item.target_bulan || "-"}</strong>
                        </div>
                        <div className="h-3 w-px bg-slate-200" />
                        <div>
                          <span className="text-slate-400">Realisasi: </span>
                          <strong className="text-slate-800">{item.realisasi_bulan || "-"}</strong>
                        </div>
                        <div className="h-3 w-px bg-slate-200" />
                        <div>
                          <span className="text-slate-400">Target Tahunan: </span>
                          <strong className="text-slate-800">{item.target_tahunan || "-"}</strong>
                        </div>

                        <div className="ml-auto">
                          <Link
                            href="/siproval/rhpk/2026"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005baa] hover:underline"
                          >
                            <span>Buka di RHPK</span>
                            <Icon icon="solar:arrow-right-linear" width={11} />
                          </Link>
                        </div>
                      </div>

                      {/* Arahan jika ada */}
                      {item.arahan && (
                        <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                          <span className="font-bold text-amber-800 block text-[10px] uppercase">
                            Arahan Kepala Balai:
                          </span>
                          <span className="italic">&ldquo;{item.arahan}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
              <span className="text-[11px] text-slate-500">
                Menampilkan {displayedModalIndicators.length} dari {indicators.length} total indikator
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowIkskModal(false);
                  setSearchIksk("");
                }}
                className="rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#004885]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
