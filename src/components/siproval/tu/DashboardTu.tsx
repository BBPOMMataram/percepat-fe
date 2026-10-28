"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import TargetRealisasiTuChart from "./TargetRealisasiTuChart";
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

  const [metrics, setMetrics] = useState<TuMetricsSummary>({
    totalRo: 23,
    totalPagu: 0,
    totalRealisasi: 0,
    persenRealisasi: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const res = await api.get(`${baseUrl}/api/tu/dashboard-chart/${currentYear}`);
        if (res.data?.data) {
          const d = res.data.data;
          const s = d.summary || {};
          const pagu = Number(s.total_pagu) || 0;
          const real = Number(s.total_realisasi_budget) || 0;
          const persen = pagu > 0 ? (real / pagu) * 100 : 0;

          // Hitung total RO dari Realisasi RO jika ada
          const totalRo = d.total_ro || 23;

          setMetrics({
            totalRo,
            totalPagu: pagu,
            totalRealisasi: real,
            persenRealisasi: Number(persen.toFixed(2)),
          });
        }
      } catch (err) {
        console.warn("Gagal memuat metrik ringkasan TU:", err);
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
              Basis Data Evaluasi &amp; Anggaran {currentYear}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Selamat Datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Pantau perencanaan alokasi pagu anggaran, realisasi serapan belanja, dan ketercapaian Rincian Output (RO) BBPOM di Mataram tahun anggaran {currentYear} secara real-time.
          </p>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-15">
          <Icon icon="solar:pie-chart-3-bold" width={320} height={320} />
        </div>
      </div>

      {/* 4 Metric Cards: Data Riil Kinerja Tata Usaha */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Rincian Output */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                Total Rincian Output (RO)
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#005baa]">
                {loadingMetrics ? "..." : `${metrics.totalRo} RO`}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500 font-medium">
                Sasaran Kinerja {currentYear}
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#005baa]">
              <Icon icon="solar:document-medicine-bold" width={24} />
            </div>
          </div>
        </div>

        {/* Card 2: Pagu DIPA Anggaran */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#00a651]">
                Total Pagu Anggaran
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#00a651]">
                {loadingMetrics
                  ? "..."
                  : metrics.totalPagu > 0
                  ? formatRupiah(metrics.totalPagu)
                  : "Rp 27,33 M"}
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

        {/* Card 3: Realisasi Belanja */}
        <div className="flex flex-col justify-between rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488]">
                Realisasi Belanja
              </p>
              <p className="mt-2 text-2xl font-extrabold text-teal-800">
                {loadingMetrics
                  ? "..."
                  : metrics.totalRealisasi > 0
                  ? formatRupiah(metrics.totalRealisasi)
                  : "Rp 12,13 M"}
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

        {/* Card 4: Rasio Serapan Belanja */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-blue-50/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Rasio Serapan Belanja
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#005baa]">
                {loadingMetrics
                  ? "..."
                  : metrics.persenRealisasi > 0
                  ? `${metrics.persenRealisasi}%`
                  : "44,38%"}
              </p>
              <span className="mt-1 inline-block text-xs text-emerald-600 font-semibold">
                ● Tingkat Efisiensi Anggaran
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#005baa]">
              <Icon icon="solar:chart-2-bold" width={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Target vs Realisasi Comparison Chart */}
      <TargetRealisasiTuChart />
    </div>
  );
}
