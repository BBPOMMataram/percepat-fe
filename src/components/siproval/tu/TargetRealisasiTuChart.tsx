"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
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
    label: "Target Volume (RO)",
    color: "#00a651", // BBPOM Green
  },
  realisasi: {
    label: "Realisasi Volume (RO)",
    color: "#005baa", // BBPOM Royal Blue
  },
} satisfies ChartConfig;

const budgetChartConfig = {
  target: {
    label: "Pagu Anggaran (Target)",
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
  const [metricMode, setMetricMode] = useState<DataMetricMode>("volume");
  const [periodMode, setPeriodMode] = useState<DataPeriodMode>("quarterly");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live data fetched from /api/tu/dashboard-chart/2026
  const [liveData, setLiveData] = useState<LiveDataState>({
    is_live_data: false,
    source: "Memuat dari Spreadsheet...",
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
          source: d.source || "Spreadsheet Realisasi RO (Tab 155) & Maping Anggaran 2026",
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
      avgCapaian: avgCapaian.toFixed(1),
      deltaPercent: deltaPercent.toFixed(1),
      isSurplus: deltaPercent >= 0,
      totalTargetFormatted:
        metricMode === "volume"
          ? `${totalTarget.toLocaleString("id-ID")} Unit`
          : formatCurrency(totalTarget),
      totalRealisasiFormatted:
        metricMode === "volume"
          ? `${totalRealisasi.toLocaleString("id-ID")} Unit`
          : formatCurrency(totalRealisasi),
    };
  }, [activeChartData, metricMode]);

  const activeConfig = metricMode === "volume" ? volumeChartConfig : budgetChartConfig;

  return (
    <Card className="rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-xs transition hover:shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#005baa]/10 px-2.5 py-1 text-xs font-semibold text-[#005baa]">
              <Layers className="h-3.5 w-3.5" />
              Monitoring Kinerja TU 2026
            </span>

            {/* Live Data Status Indicator */}
            {liveData.is_live_data && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Data Riil Live (Spreadsheet &amp; DB)
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
              {stats.isSurplus ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>
                Rasio Capaian {stats.avgCapaian}%
              </span>
            </Badge>
          </div>

          <CardTitle className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            Perbandingan Target vs. Realisasi {metricMode === "volume" ? "Volume RO" : "Anggaran Belanja"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Data riil langsung dari <span className="font-semibold text-slate-700">Tab Realisasi RO 155</span> &amp; <span className="font-semibold text-slate-700">Budget Mapping 2026</span> (Sinkron: {liveData.last_synced_at}).
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
            title="Tarik pembaruan data langsung dari Google Sheets"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#005baa]" : ""}`} />
            <span>{isRefreshing ? "Sinkron..." : "Perbarui Data"}</span>
          </button>

          {/* Metric Mode Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setMetricMode("volume")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                metricMode === "volume"
                  ? "bg-white font-bold text-[#005baa] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Volume RO
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("budget")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                metricMode === "budget"
                  ? "bg-white font-bold text-[#005baa] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Anggaran (Rp)
            </button>
          </div>

          {/* Period Mode Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setPeriodMode("quarterly")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                periodMode === "quarterly"
                  ? "bg-white font-bold text-[#005baa] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Per Triwulan
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode("monthly")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                periodMode === "monthly"
                  ? "bg-white font-bold text-[#005baa] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Per Bulan
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Top KPI highlights bar */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {metricMode === "volume" ? "Total Target Volume" : "Total Pagu Anggaran"}
            </span>
            <p className="mt-1 text-lg font-bold text-slate-900">{stats.totalTargetFormatted}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#00a651]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#00a651]"></span>
              Target BBPOM ({periodMode === "quarterly" ? "4 Triwulan" : "12 Bulan"})
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {metricMode === "volume" ? "Total Realisasi Volume" : "Total Serapan Belanja"}
            </span>
            <p className="mt-1 text-lg font-bold text-[#005baa]">{stats.totalRealisasiFormatted}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#005baa]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#005baa]"></span>
              Realisasi Akumulatif
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Rasio Ketercapaian
            </span>
            <p className="mt-1 text-lg font-bold text-slate-900">{stats.avgCapaian}%</p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              {Number(stats.avgCapaian) >= 50 ? "Progress Berjalan Baik" : "Dalam Pemantauan"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sumber Data
            </span>
            <p className="mt-1 text-sm font-bold text-slate-900 truncate" title={liveData.source}>
              {liveData.is_live_data ? "Database Mandiri" : "Sedang Memuat..."}
            </p>
            <span className="text-[11px] text-slate-500">{liveData.last_synced_at}</span>
          </div>
        </div>

        {/* Clean Bar Chart: Clean white background, solid flat bars */}
        <div className="relative w-full rounded-xl border border-slate-100 bg-white p-2 sm:p-4 min-h-[340px]">
          {isLoading && activeChartData.length === 0 ? (
            <div className="flex h-[320px] w-full flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-[#005baa]" />
              <span className="text-xs">Memuat data realisasi anggaran dari database mandiri...</span>
            </div>
          ) : (
            <ChartContainer config={activeConfig} className="aspect-auto h-[320px] w-full">
              <BarChart accessibilityLayer data={activeChartData} margin={{ top: 20, right: 12, left: 12, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100" />
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
                            : `${num.toLocaleString("id-ID")} Unit`;
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
                  name={metricMode === "volume" ? "Target Volume (RO)" : "Pagu Anggaran"}
                  fill="var(--color-target)"
                  radius={[4, 4, 0, 0]}
                />

                {/* Bar Realisasi: Solid Polos BBPOM Royal Blue (#005baa) */}
                <Bar
                  dataKey="realisasi"
                  name={metricMode === "volume" ? "Realisasi Volume (RO)" : "Realisasi Anggaran"}
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
          <span>Data terintegrasi otomatis dengan database Realisasi RO &amp; Budget Mapping 2026.</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isKabalaiView ? (
            <>
              <Link
                href="/siproval/rhpk/2026"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#005baa] shadow-2xs transition hover:bg-blue-50 hover:border-blue-300"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Buka Rekap RHPK 2026
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </Link>
              <Link
                href="/siproval/monev"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#005baa] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#004887]"
              >
                Catatan Monev &amp; Arahan
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/siproval/tu/realisasi-ro"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#005baa] shadow-2xs transition hover:bg-blue-50 hover:border-blue-300"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Buka Realisasi RO (Tab 155)
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </Link>
              <Link
                href="/siproval/tu/laporan-evaluasi?month=APRIL"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#005baa] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#004887]"
              >
                Eksport Laporan Evaluasi
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
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
