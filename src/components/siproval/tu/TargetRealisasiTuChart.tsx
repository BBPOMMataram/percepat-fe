"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  TrendingUp,
  Layers,
  DollarSign,
  Calendar,
  RefreshCw,
  Info,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/bar-chart";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

// BBPOM Official Colors:
// Green (Target): #00a651 (Vibrant BBPOM Green - Solid Polos)
// Royal Blue (Realisasi): #005baa (BBPOM Signature Blue - Solid Polos)

export type DataPeriodMode = "quarterly" | "monthly";
export type DataMetricMode = "volume" | "budget";

export type ChartItem = {
  label: string;
  target: number;
  realisasi: number;
  capaianPercent: number;
  targetFormatted: string;
  realisasiFormatted: string;
};

type LiveDataState = {
  is_live_data: boolean;
  source: string;
  last_synced_at: string;
  quarterly_volume: ChartItem[];
  quarterly_budget: ChartItem[];
  monthly_volume: ChartItem[];
  monthly_budget: ChartItem[];
};

// Target color is vibrant BBPOM Green (#00a651) - solid
const volumeChartConfig = {
  target: {
    label: "Target Volume (23 RO)",
    color: "#00a651", // BBPOM Green
  },
  realisasi: {
    label: "Realisasi Volume (23 RO)",
    color: "#005baa", // BBPOM Royal Blue
  },
} satisfies ChartConfig;

const budgetChartConfig = {
  target: {
    label: "Pagu Anggaran (DIPA)",
    color: "#00a651", // BBPOM Green
  },
  realisasi: {
    label: "Realisasi Anggaran (Serapan)",
    color: "#005baa", // BBPOM Royal Blue
  },
} satisfies ChartConfig;

export interface TargetRealisasiTuChartProps {
  isKabalaiView?: boolean;
}

export default function TargetRealisasiTuChart({ isKabalaiView = false }: TargetRealisasiTuChartProps) {
  // Default to 'budget' (Anggaran Rp) instead of 'volume'
  const [metricMode, setMetricMode] = useState<DataMetricMode>("budget");
  const [periodMode, setPeriodMode] = useState<DataPeriodMode>("quarterly");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live data fetched from /api/tu/dashboard-chart/2026
  const [liveData, setLiveData] = useState<LiveDataState>({
    is_live_data: false,
    source: "Memuat dari Basis Data Mandiri...",
    last_synced_at: "-",
    quarterly_volume: [],
    quarterly_budget: [],
    monthly_volume: [],
    monthly_budget: [],
  });

  const loadChartData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url = `${baseUrl}/api/tu/dashboard-chart/2026${forceRefresh ? "?refresh=1" : ""}`;
      const res = await api.get(url);
      if (res.data?.data) {
        const d = res.data.data;
        setLiveData({
          is_live_data: Boolean(d.is_live_data),
          source: d.source || "Basis Data Realisasi RO & Budget Mapping 2026",
          last_synced_at: d.last_synced_at || "Terkini",
          quarterly_volume: Array.isArray(d.quarterly_volume) ? d.quarterly_volume : [],
          quarterly_budget: Array.isArray(d.quarterly_budget) ? d.quarterly_budget : [],
          monthly_volume: Array.isArray(d.monthly_volume) ? d.monthly_volume : [],
          monthly_budget: Array.isArray(d.monthly_budget) ? d.monthly_budget : [],
        });
      }
    } catch (err) {
      console.warn("Gagal mengambil live data chart dashboard:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChartData(false);
  }, [loadChartData]);

  // Determine active chart data directly from live data state
  const activeChartData = useMemo<ChartItem[]>(() => {
    if (periodMode === "quarterly") {
      return metricMode === "volume"
        ? liveData.quarterly_volume
        : liveData.quarterly_budget;
    } else {
      return metricMode === "volume"
        ? liveData.monthly_volume
        : liveData.monthly_budget;
    }
  }, [periodMode, metricMode, liveData]);

  // Aggregate stats based on active data
  const stats = useMemo(() => {
    const totalTarget = activeChartData.reduce((acc, curr) => acc + (Number(curr.target) || 0), 0);
    const totalRealisasi = activeChartData.reduce((acc, curr) => acc + (Number(curr.realisasi) || 0), 0);
    const avgCapaian = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
    const deltaPercent = avgCapaian - 100;

    return {
      totalTarget,
      totalRealisasi,
      avgCapaian: Number(avgCapaian.toFixed(1)),
      deltaFormatted: `${deltaPercent > 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`,
      isSurplus: deltaPercent >= 0,
      totalTargetFormatted:
        metricMode === "volume"
          ? `${totalTarget.toLocaleString("id-ID")} Output`
          : formatCurrency(totalTarget),
      totalRealisasiFormatted:
        metricMode === "volume"
          ? `${totalRealisasi.toLocaleString("id-ID")} Output`
          : formatCurrency(totalRealisasi),
    };
  }, [activeChartData, metricMode]);

  const activeConfig = metricMode === "volume" ? volumeChartConfig : budgetChartConfig;

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#005baa]">
              <span className="h-2 w-2 rounded-full bg-[#005baa]"></span>
              Monitoring Kinerja TU 2026
            </span>

            {/* Live Data Status Indicator */}
            {liveData.is_live_data && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Basis Data Realisasi Live
              </span>
            )}

            <Badge
              variant="outline"
              className={`flex items-center gap-1 border-none px-2.5 py-0.5 text-xs font-semibold ${
                stats.isSurplus
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-blue-500/10 text-blue-700"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Rasio Capaian {stats.avgCapaian}%
              </span>
            </Badge>
          </div>

          <CardTitle className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            Perbandingan Target vs. Realisasi {metricMode === "volume" ? "Volume 23 Rincian Output (RO)" : "Anggaran Belanja (Pagu DIPA)"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Data riil bersumber dari Basis Data Realisasi RO &amp; Budget Mapping 2026 (Terkini: {liveData.last_synced_at}).
          </CardDescription>
        </div>

        {/* View Switchers & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh / Sync Live Data */}
          <button
            type="button"
            onClick={() => loadChartData(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-[#005baa] disabled:opacity-50"
            title="Sinkronkan pembaruan data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#005baa]" : ""}`} />
            <span>{isRefreshing ? "Menyinkronkan..." : "Perbarui Data"}</span>
          </button>

          {/* Metric Selector: Anggaran (Rp) vs Volume RO */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMetricMode("budget")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                metricMode === "budget"
                  ? "bg-white text-[#005baa] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Anggaran (Rp)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("volume")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                metricMode === "volume"
                  ? "bg-white text-[#005baa] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Volume RO</span>
            </button>
          </div>

          {/* Period Selector: Triwulan vs Bulanan */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setPeriodMode("quarterly")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                periodMode === "quarterly"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Per Triwulan</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode("monthly")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                periodMode === "monthly"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Per Bulan</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Ringkasan Akumulasi Total Target & Realisasi */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {metricMode === "volume" ? "Total Target Fisik" : "Total Target Pagu"}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {stats.totalTargetFormatted}
            </p>
            <span className="text-[11px] text-slate-500">
              {periodMode === "quarterly" ? "Target 4 Triwulan (2026)" : "Target 12 Bulan (2026)"}
            </span>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {metricMode === "volume" ? "Total Realisasi Fisik" : "Total Realisasi Belanja"}
            </p>
            <p className="mt-1 text-xl font-bold text-[#005baa]">
              {stats.totalRealisasiFormatted}
            </p>
            <span className="text-[11px] text-slate-500">
              Realisasi Akumulatif
            </span>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Rasio Ketercapaian
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {stats.avgCapaian}%
            </p>
            <span className="text-[11px] text-slate-500">
              Rata-rata Capaian
            </span>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Status Evaluasi
            </p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {stats.isSurplus ? "Sesuai Target" : "Proses Berjalan"}
            </p>
            <span className="text-[11px] text-slate-500">
              {stats.deltaFormatted} dari target
            </span>
          </div>
        </div>

        {/* Info Banner Khusus Mode Volume RO */}
        {metricMode === "volume" && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs text-blue-900">
            <Info className="h-4 w-4 shrink-0 text-[#005baa] mt-0.5" />
            <p className="leading-relaxed">
              <strong>Penjelasan Angka Volume:</strong> Data di atas merupakan akumulasi kuantitatif output fisik dari seluruh <strong>23 Rincian Output (RO)</strong> BBPOM di Mataram (antara lain sampel obat/makanan yang diuji laboratorium, sarana distribusi/produksi yang diawasi, berkas penyidikan perkara, sertifikat/rekomendasi layanan publik, serta laporan evaluasi kinerja).
            </p>
          </div>
        )}

        {/* Bar Chart Container */}
        <div className="h-[340px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-[#005baa]" />
                <span className="text-xs text-slate-500">Memuat visualisasi data kinerja...</span>
              </div>
            </div>
          ) : (
            <ChartContainer config={activeConfig} className="h-full w-full">
              <BarChart
                accessibilityLayer
                data={activeChartData}
                margin={{ top: 20, right: 12, left: 12, bottom: 5 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-xs font-semibold text-slate-600"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs text-slate-400"
                  tickFormatter={(val) => {
                    if (metricMode === "budget") {
                      if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)} M`;
                      if (val >= 1000000) return `${(val / 1000000).toFixed(0)} Jt`;
                    }
                    return Number(val).toLocaleString("id-ID");
                  }}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(0, 91, 170, 0.04)" }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(val, name) => {
                        const num = Number(val);
                        const formatted =
                          metricMode === "budget"
                            ? `Rp ${num.toLocaleString("id-ID")}`
                            : `${num.toLocaleString("id-ID")} Output`;
                        return (
                          <div className="flex w-full items-center justify-between gap-4 font-medium">
                            <span className="text-slate-500">{name}:</span>
                            <span className="font-mono font-bold text-slate-900">{formatted}</span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent className="mt-3 text-xs font-semibold text-slate-700" />} />
                
                {/* Bar Target: Solid Polos Vibrant BBPOM Green (#00a651) */}
                <Bar
                  dataKey="target"
                  name={metricMode === "volume" ? "Target Volume (23 RO)" : "Pagu Anggaran (DIPA)"}
                  fill="var(--color-target)"
                  radius={[4, 4, 0, 0]}
                />

                {/* Bar Realisasi: Solid Polos BBPOM Royal Blue (#005baa) */}
                <Bar
                  dataKey="realisasi"
                  name={metricMode === "volume" ? "Realisasi Volume (23 RO)" : "Realisasi Anggaran (Serapan)"}
                  fill="var(--color-realisasi)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between rounded-b-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-[#00a651]"></span>
          <span>Data terintegrasi otomatis dengan Basis Data Realisasi RO &amp; Budget Mapping 2026.</span>
        </div>
      </CardFooter>
    </Card>
  );
}

function formatCurrency(num: number): string {
  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(2).replace(".", ",")} M`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(0).replace(".", ",")} Jt`;
  }
  return `Rp ${num.toLocaleString("id-ID")}`;
}
