"use client";

import { useRef, useState } from "react";
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Download } from "lucide-react";
import type { DashboardHighRiskTrendData } from "../types";
import {
  buildChartExportFilename,
  exportChartToPng,
} from "../lib/exportChartToPng";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface HighRiskTrendChartProps {
  data: DashboardHighRiskTrendData | null;
  loading?: boolean;
}

export function HighRiskTrendChart({
  data,
  loading,
}: HighRiskTrendChartProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const year = data?.year ?? 2026;
  const items = data?.items ?? [];
  const anomalies = data?.anomalies ?? [];

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportChartToPng({
        element: cardRef.current,
        fileName: buildChartExportFilename("trend-risiko-tinggi", year),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-xs font-extrabold text-red-700">
              4
            </span>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase">
              Trend Risiko Tinggi ({data?.level_range_label || "Level 16–19"})
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pergerakan jumlah Risiko Inheren Tinggi vs Risiko Residual Tinggi antarsemester Tahun{" "}
            {year}
          </p>
        </div>

        <button
          type="button"
          data-export-ignore="true"
          disabled={exporting || loading || items.length === 0}
          onClick={() => void handleExportPng()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#005baa] hover:border-blue-200 disabled:opacity-50 transition-colors"
          title="Unduh Grafik Trend Risiko Tinggi sebagai PNG"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Mengekspor..." : "Unduh PNG"}
        </button>
      </div>

      {loading ? (
        <ChartLoadingState
          heightClass="h-72"
          label="Memuat grafik trend risiko tinggi..."
        />
      ) : items.length === 0 ? (
        <ChartEmptyState
          heightClass="h-72"
          title="Data trend risiko tinggi belum tersedia"
          description="Pastikan dataset Semester I atau Semester II telah dipublikasikan."
        />
      ) : (
        <>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={items}
                margin={{ top: 28, right: 36, left: 12, bottom: 12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  padding={{ left: 48, right: 48 }}
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#334155" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.22)]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: "12px", fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  name="Risiko Inheren Tinggi (Level 16–19)"
                  dataKey="inherent_high"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#dc2626", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8 }}
                >
                  <LabelList
                    dataKey="inherent_high"
                    position="top"
                    offset={10}
                    style={{
                      fill: "#b91c1c",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  />
                </Line>
                <Line
                  type="monotone"
                  name="Risiko Residual Tinggi (Level 16–19)"
                  dataKey="residual_high"
                  stroke="#005baa"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#005baa", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8 }}
                >
                  <LabelList
                    dataKey="residual_high"
                    position="top"
                    offset={10}
                    style={{
                      fill: "#004281",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ringkasan Angka */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {items.map((it) => (
              <div
                key={it.period_id}
                className="rounded-xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-2.5 flex items-center justify-between text-xs"
              >
                <div className="font-bold text-slate-800">{it.label}</div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 font-bold text-red-700">
                    Inheren: {it.inherent_high}
                  </span>
                  <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 font-bold text-[#004281]">
                    Residual: {it.residual_high}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Warning Anomali Kolom (mis. S-01 baris 5 pada Kompilasi Semester II 2026) */}
          {anomalies.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">
                  Peringatan Kualitas Data (Ketidaksesuaian Kolom Skor):
                </div>
                {anomalies.map((anom, i) => (
                  <p key={`${anom.period_id}-${anom.row_number}-${i}`} className="leading-relaxed">
                    <b>
                      {anom.period_name} ({anom.sheet_name} Baris {anom.row_number}):
                    </b>{" "}
                    {anom.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
