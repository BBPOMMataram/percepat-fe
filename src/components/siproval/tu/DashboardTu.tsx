"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import TargetRealisasiTuChart from "./TargetRealisasiTuChart";
import SimetrisNkoDashboard from "../dashboard/SimetrisNkoDashboard";
import IkskMonitoringSection, {
  IKSK_MONTHS,
  IkskFilter,
} from "../dashboard/IkskMonitoringSection";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

interface TuMetricsSummary {
  totalRo: number;
  totalPagu: number;
  totalRealisasi: number;
  persenRealisasi: number;
}

export default function DashboardTu() {
  const currentYear = new Date().getFullYear();
  const { user } = useSelector((state: RootState) => state.auth);
  const userName = user?.name || user?.call_name || "Bagian Tata Usaha (TU)";

  // Periode capaian IKSK (sama dengan Dashboard Katim: default bulan berjalan)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    IKSK_MONTHS[new Date().getMonth()] || "NOVEMBER"
  );
  const [counts, setCounts] = useState({ total: 0, tercapai: 0, belum: 0 });
  const [filterRequest, setFilterRequest] = useState<{ filter: IkskFilter; nonce: number } | null>(null);
  const handleCounts = useCallback(
    (c: { total: number; tercapai: number; belum: number }) => setCounts(c),
    []
  );

  const [metrics, setMetrics] = useState<TuMetricsSummary | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);
        setMetricsError(null);
        const res = await api.get(`${baseUrl}/api/tu/dashboard-chart/${currentYear}`);
        const d = res.data?.data;
        if (!d) {
          setMetrics(null);
          return;
        }
        const s = d.summary || {};
        const pagu = Number(s.total_pagu) || 0;
        const real = Number(s.total_realisasi_budget) || 0;
        setMetrics({
          totalRo: Number(s.total_ro || d.total_ro) || 0,
          totalPagu: pagu,
          totalRealisasi: real,
          persenRealisasi: pagu > 0 ? Number(((real / pagu) * 100).toFixed(2)) : 0,
        });
      } catch (err) {
        console.warn("Gagal memuat metrik ringkasan TU:", err);
        setMetrics(null);
        setMetricsError("Ringkasan anggaran TU gagal dimuat dari server.");
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [currentYear]);

  const formatRupiah = (num: number): string => {
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(2).replace(".", ",")} M`;
    }
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(0).replace(".", ",")} Jt`;
    }
    return `Rp ${num.toLocaleString("id-ID")}`;
  };

  const show = (fn: (m: TuMetricsSummary) => string) =>
    loadingMetrics ? "..." : metrics ? fn(metrics) : "-";

  return (
    <div className="space-y-8">
      {/* Welcome banner with BBPOM Blue & Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] p-6 text-white shadow-lg lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon icon="solar:shield-check-bold" width={15} className="text-emerald-300" />
              Bagian Tata Usaha (TU)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon icon="solar:database-bold" width={14} className="text-blue-200" />
              Data Riil Rekapitulasi RHPK &amp; TU {currentYear}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Selamat Datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Pantau capaian indikator kinerja (IKSK), NKO, alokasi pagu, realisasi serapan
            belanja, dan ketercapaian Rincian Output (RO) BBPOM di Mataram tahun anggaran{" "}
            {currentYear} secara terintegrasi.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/tu/realisasi-ro"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:document-medicine-bold" width={16} />
              <span>Realisasi RO</span>
            </Link>
            <button
              type="button"
              onClick={() => setFilterRequest({ filter: "belum", nonce: Date.now() })}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-400"
            >
              <Icon icon="solar:danger-triangle-bold" width={16} />
              <span>Rincian IKSK Belum Tercapai ({counts.belum})</span>
            </button>
            <Link
              href="/siproval/tu/konversi-nko"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Icon icon="solar:chart-square-bold" width={16} className="text-emerald-300" />
              <span>Konversi NKO</span>
            </Link>
            <Link
              href="/siproval/budget-mapping"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Icon icon="solar:wallet-money-bold" width={16} className="text-emerald-300" />
              <span>Mapping Anggaran</span>
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-15">
          <Icon icon="solar:pie-chart-3-bold" width={320} height={320} />
        </div>
      </div>

      {/* Monitoring capaian IKSK (komponen bersama Dashboard Katim & TU) */}
      <IkskMonitoringSection
        apiPath="/api/tu/form-catatan"
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        rhpkHref={(id) => `/siproval/tu/rhpk?iksk_id=${id}`}
        rhpkActionLabel="Lihat IKSK"
        filterRequest={filterRequest}
        onCountsChange={handleCounts}
        middle={
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
                  Ringkasan anggaran tahun berjalan, NKO &amp; Kerangka Kerja Logis, serta grafik
                  target vs realisasi Volume RO dan serapan Pagu Anggaran {currentYear}.
                </p>
              </div>
            </div>

            {metricsError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                {metricsError}
              </div>
            )}

            {/* 4 kartu ringkasan anggaran TU (dari Mapping Anggaran & Realisasi RO di database) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 p-5 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                      Total Rincian Output (RO)
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-[#005baa]">
                      {show((m) => `${m.totalRo} RO`)}
                    </p>
                    <span className="mt-1 inline-block text-xs text-slate-500 font-medium">
                      Realisasi RO {currentYear}
                    </span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#005baa]">
                    <Icon icon="solar:document-medicine-bold" width={24} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-5 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#00a651]">
                      Total Pagu Anggaran
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-[#00a651]">
                      {show((m) => (m.totalPagu > 0 ? formatRupiah(m.totalPagu) : "-"))}
                    </p>
                    <span className="mt-1 inline-block text-xs text-slate-500 font-medium">
                      Alokasi Pagu DIPA {currentYear}
                    </span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-[#00a651]">
                    <Icon icon="solar:wallet-money-bold" width={24} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-100/50 p-5 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488]">
                      Realisasi Belanja
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-teal-800">
                      {show((m) => (m.totalRealisasi > 0 ? formatRupiah(m.totalRealisasi) : "-"))}
                    </p>
                    <span className="mt-1 inline-block text-xs text-slate-500 font-medium">
                      Serapan Anggaran Berjalan
                    </span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-[#0d9488]">
                    <Icon icon="solar:card-recive-bold" width={24} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-blue-50/50 p-5 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Rasio Serapan Belanja
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-[#005baa]">
                      {show((m) => (m.totalPagu > 0 ? `${m.persenRealisasi}%` : "-"))}
                    </p>
                    <span className="mt-1 inline-block text-xs text-slate-500 font-medium">
                      Realisasi Belanja / Pagu
                    </span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#005baa]">
                    <Icon icon="solar:chart-2-bold" width={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Simetris BPOM Dashboard: NKO, Pagu, Realisasi, Capaian & Kerangka Kerja Logis (dikendalikan oleh filter bulan di atas card) */}
            <SimetrisNkoDashboard
              initialYear={currentYear}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              hideMonthSelector={true}
            />

            {/* Target vs Realisasi Comparison Chart */}
            <TargetRealisasiTuChart />
          </div>
        }
      />
    </div>
  );
}
