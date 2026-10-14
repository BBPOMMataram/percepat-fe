"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

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

type KabalaiStats = {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpreadsheets() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (user?.id) params.set("user_id", String(user.id));
        params.set("month", selectedMonth);
        const res = await api.get(`${baseUrl}/api/kabalai/form-catatan?${params.toString()}`);

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
        } else {
          setSpreadsheets([]);
        }
      } catch {
        setSpreadsheets([]);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchSpreadsheets();
    }
  }, [user?.id, selectedMonth]);

  const userName = user?.name || user?.call_name || "Kepala Balai";

  const currentMonthStat = stats?.monthly_stats?.[selectedMonth];
  const currentTercapai = currentMonthStat ? currentMonthStat.tercapai : (stats?.tercapai ?? 0);
  const currentPerluEvaluasi = currentMonthStat ? currentMonthStat.perlu_evaluasi : (stats?.perlu_evaluasi ?? 0);

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
              Data Riil Rekapitulasi RHPK 2026
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Selamat datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Pantau rekapitulasi capaian indikator kinerja kegiatan secara langsung dari lembar kerja RHPK
            dan berikan arahan pembinaan kepada tim penanggung jawab (PIC) terkait.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/rhpk/2026"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:chart-2-bold" width={16} />
              Buka Rekap RHPK 2026
            </Link>
            <Link
              href="/siproval/monev"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Icon icon="solar:calendar-date-bold" width={16} />
              Pilih Tahun Lain
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
              Menampilkan capaian 30 indikator dan arahan Kepala Balai pada bulan terpilih
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

      {/* 4 Stats Cards with BBPOM Blue & Green Gradients */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: BBPOM Deep Blue Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                Laporan Terhubung
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : (stats?.total_spreadsheets ?? spreadsheets.length)}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Spreadsheet Google Sheets aktif
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-[#005baa]">
              <Icon icon="solar:documents-bold" width={24} />
            </div>
          </div>
        </div>

        {/* Card 2: BBPOM Green Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#00a651]">
                Target Terpenuhi ({selectedMonth})
              </p>
              <p className="mt-2 text-3xl font-bold text-[#00a651]">
                {loading ? "..." : currentTercapai}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                dari {stats?.total_indikator ?? 30} total indikator (≥ 100%)
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#00a651]">
              <Icon icon="solar:check-circle-bold" width={24} />
            </div>
          </div>
        </div>

        {/* Card 3: Teal / Cyan Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488]">
                Perlu Evaluasi ({selectedMonth})
              </p>
              <p className="mt-2 text-3xl font-bold text-teal-800">
                {loading ? "..." : currentPerluEvaluasi}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Belum mencapai target bulanan
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-[#0d9488]">
              <Icon icon="solar:danger-triangle-bold" width={24} />
            </div>
          </div>
        </div>

        {/* Card 4: Soft Amber / Blue Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-blue-50/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Total Arahan Pimpinan
              </p>
              <p className="mt-2 text-3xl font-bold text-[#005baa]">
                {loading ? "..." : (stats?.total_arahan ?? stats?.total_catatan ?? 0)}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Arahan tercatat di RHPK 2026
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Icon icon="solar:chat-round-check-bold" width={24} />
            </div>
          </div>
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
    </div>
  );
}
