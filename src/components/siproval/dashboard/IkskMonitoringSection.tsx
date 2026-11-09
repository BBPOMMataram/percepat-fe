"use client";

// Bagian monitoring capaian 30 indikator IKSK per bulan (filter bulan, 4 kartu ringkasan, tabel rincian).
// Dipakai bersama oleh Dashboard Katim dan Dashboard TU agar isi & sumber datanya seragam:
// data diambil dari rekap "A. Capaian RAPK Mataram" di RHPK lokal (endpoint form-catatan), tanpa angka bawaan.
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";
import { getSakipCategory } from "@/utils/sakipCategory";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

export const IKSK_MONTHS = [
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

export interface IkskIndicatorItem {
  row_number: number;
  iksk_id: number;
  no_indikator?: number;
  label: string;
  sasaran: string;
  sasaran_kode?: string;
  sasaran_nama?: string;
  target_tahunan: string;
  target_bulan: string;
  realisasi_bulan: string;
  capaian: number;
  capaian_normalisasi?: number;
  status: "tercapai" | "belum";
  arahan: string;
}

interface IkskStats {
  total_iksk?: number;
  total_iksk_connected?: number;
  total_arahan?: number;
  total_catatan?: number;
  perlu_evaluasi?: number;
  tercapai?: number;
  data_source?: string;
}

export type IkskFilter = "all" | "belum" | "tercapai";

export interface IkskMonitoringSectionProps {
  /** Endpoint rekap capaian, mis. "/api/katim/form-catatan" atau "/api/tu/form-catatan" */
  apiPath: string;
  /** Endpoint cadangan bila endpoint utama ditolak (mis. Kabalai) */
  fallbackApiPath?: string;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  /** Tautan lembar RHPK per IKSK (Katim: formulir isian, TU: lihat-saja) */
  rhpkHref: (ikskId: number) => string;
  rhpkActionLabel?: string;
  /** Tautan halaman Arahan Pimpinan (kosong = tidak ditampilkan) */
  arahanHref?: string;
  /** Konten di antara kartu ringkasan dan tabel rincian (mis. NKO & grafik TU) */
  middle?: ReactNode;
  /** Permintaan dari luar untuk memfilter & menggulir ke tabel (nonce berubah tiap klik) */
  filterRequest?: { filter: IkskFilter; nonce: number } | null;
  onCountsChange?: (counts: { total: number; tercapai: number; belum: number }) => void;
}

export default function IkskMonitoringSection({
  apiPath,
  fallbackApiPath,
  selectedMonth,
  onMonthChange,
  rhpkHref,
  rhpkActionLabel = "Buka IKSK",
  arahanHref,
  middle,
  filterRequest,
  onCountsChange,
}: IkskMonitoringSectionProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentYear = new Date().getFullYear();
  const MONTHS = IKSK_MONTHS;

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<IkskStats | null>(null);
  const [indicators, setIndicators] = useState<IkskIndicatorItem[]>([]);
  const [indicatorFilter, setIndicatorFilter] = useState<IkskFilter>("all");
  const [searchTable, setSearchTable] = useState<string>("");
  const tableSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      const q = new URLSearchParams();
      if (user?.id) q.set("user_id", String(user.id));
      q.set("month", selectedMonth);
      q.set("year", String(currentYear));
      try {
        let res;
        try {
          res = await api.get(`${baseUrl}${apiPath}?${q.toString()}`);
        } catch (e) {
          if (!fallbackApiPath) throw e;
          res = await api.get(`${baseUrl}${fallbackApiPath}?${q.toString()}`);
        }
        if (cancelled) return;
        const data = res.data || {};
        setStats(data.stats || null);
        const raw = data.indicators || data.stats?.indicators;
        setIndicators(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error("Gagal memuat rekap capaian IKSK:", err);
        if (!cancelled) {
          setStats(null);
          setIndicators([]);
          setErrorMsg("Gagal memuat rekap capaian IKSK dari server. Muat ulang halaman untuk mencoba lagi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user?.id, selectedMonth, apiPath, fallbackApiPath, currentYear]);

  const achievedIndicators = useMemo(
    () => indicators.filter((i) => i.status === "tercapai"),
    [indicators]
  );
  const unachievedIndicators = useMemo(
    () => indicators.filter((i) => i.status === "belum"),
    [indicators]
  );
  const currentTercapai = achievedIndicators.length;
  const currentPerluEvaluasi = unachievedIndicators.length;

  useEffect(() => {
    onCountsChange?.({
      total: indicators.length,
      tercapai: currentTercapai,
      belum: currentPerluEvaluasi,
    });
  }, [indicators.length, currentTercapai, currentPerluEvaluasi, onCountsChange]);

  const scrollToTable = (filter?: IkskFilter) => {
    if (filter) setIndicatorFilter(filter);
    tableSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (filterRequest) scrollToTable(filterRequest.filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRequest?.nonce]);

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

  return (
    <>
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <Icon icon="solar:danger-triangle-bold" width={20} className="shrink-0 text-rose-600" />
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
            onChange={(e) => onMonthChange(e.target.value)}
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
                {loading ? "..." : (stats?.total_iksk ?? "-")}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                {indicators.length} indikator di rekap &bull;{" "}
                {stats?.total_iksk_connected ?? "-"} IKSK punya dokumen RHPK
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
                dari {indicators.length} indikator pada rekap
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
                  : (stats?.total_arahan ?? "-")}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Arahan tercatat di RHPK {currentYear}
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-[#005baa]">
              <Icon icon="solar:chat-round-check-bold" width={24} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-blue-100/60 pt-2.5 text-[11px] text-[#005baa] font-medium">
            <span>Riwayat Arahan</span>
            {arahanHref ? (
              <Link
                href={arahanHref}
                className="inline-flex items-center gap-1 hover:underline font-semibold"
              >
                Lihat Semua <Icon icon="solar:arrow-right-linear" width={12} />
              </Link>
            ) : (
              <span className="text-slate-500">Bulan {selectedMonth}: {indicators.filter((i) => i.arahan).length}</span>
            )}
          </div>
        </div>
      </div>

      {middle}

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
                  Status pencapaian target bulanan {selectedMonth} {currentYear} &bull;
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
                          href={rhpkHref(ind.iksk_id)}
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
                          href={rhpkHref(ind.iksk_id)}
                          className="font-bold text-slate-900 hover:text-[#005baa] transition leading-snug"
                        >
                          {ind.label}
                        </Link>
                        {ind.sasaran && (
                          <div className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[10px] shrink-0">
                              Sasaran {ind.sasaran_kode || (ind.sasaran.includes(' - ') ? ind.sasaran.split(' - ')[0] : '01')}
                            </span>
                            <span className="line-clamp-2 text-slate-600">
                              {ind.sasaran_nama || (ind.sasaran.includes(' - ') ? ind.sasaran.substring(ind.sasaran.indexOf(' - ') + 3) : ind.sasaran)}
                            </span>
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
                            title={`${getSakipCategory(ind.capaian).label} (${getSakipCategory(ind.capaian).range})`}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold ${getSakipCategory(ind.capaian).className}`}
                          >
                            <span>{ind.capaian.toFixed(2)}%</span>
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
                          href={rhpkHref(ind.iksk_id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90 hover:shadow-sm"
                          title={`Buka formulir pengisian IKSK #${ind.iksk_id}`}
                        >
                          <Icon
                            icon="ri:file-excel-2-fill"
                            width={15}
                            className="text-emerald-300"
                          />
                          <span>{rhpkActionLabel} #{ind.iksk_id}</span>
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

      {stats?.data_source && (
        <p className="text-[11px] text-slate-400">
          Sumber data capaian IKSK: {stats.data_source}
        </p>
      )}
    </>
  );
}
