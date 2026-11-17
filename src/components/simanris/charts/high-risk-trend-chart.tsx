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
import { AlertTriangle, Download, Filter, RotateCcw } from "lucide-react";
import type { DashboardHighRiskTrendData, MasterOptionsData } from "../types";
import {
  buildChartExportFilename,
  exportChartToPng,
} from "../lib/exportChartToPng";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface HighRiskTrendChartProps {
  data: DashboardHighRiskTrendData | null;
  loading?: boolean;
  options?: MasterOptionsData | null;
  filters?: { function_id?: number | ""; risk_category_id?: number | "" };
  onFilterChange?: (filters: { function_id?: number | ""; risk_category_id?: number | "" }) => void;
}

export function HighRiskTrendChart({
  data,
  loading,
  options,
  filters,
  onFilterChange,
}: HighRiskTrendChartProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const year = data?.year ?? 2026;
  const items = data?.items ?? [];
  const anomalies = data?.anomalies ?? [];
  const hasActiveFilter = Boolean(filters?.function_id || filters?.risk_category_id);
  const activeFunctionName = options?.functions.find((f) => f.id === Number(filters?.function_id))?.name;
  const activeCategoryName = options?.categories.find((c) => c.id === Number(filters?.risk_category_id))?.name;

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
      <div className="space-y-3 border-b border-slate-100 pb-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
              {activeFunctionName ? ` · Unit: ${activeFunctionName}` : ""}
              {activeCategoryName ? ` · Kategori: ${activeCategoryName}` : ""}
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

        {/* Local Filter Bar for Chart 4 */}
        {onFilterChange && (
          <div data-export-ignore="true" className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3 text-[#005baa]" />
              Filter Grafik:
            </span>

            <select
              value={filters?.function_id ?? ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  function_id: e.target.value ? Number(e.target.value) : "",
                })
              }
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                filters?.function_id
                  ? "border-blue-400 bg-blue-50 text-[#004281] font-semibold"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <option value="">Semua Fungsi / Unit Kerja</option>
              {options?.functions.map((fn) => (
                <option key={fn.id} value={fn.id}>
                  {fn.name}
                </option>
              ))}
            </select>

            <select
              value={filters?.risk_category_id ?? ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  risk_category_id: e.target.value ? Number(e.target.value) : "",
                })
              }
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                filters?.risk_category_id
                  ? "border-blue-400 bg-blue-50 text-[#004281] font-semibold"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <option value="">Semua Kategori Risiko</option>
              {options?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.code} — {cat.name}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    function_id: "",
                    risk_category_id: "",
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                title="Reset filter grafik ini"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        )}
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
                margin={{ top: 24, right: 28, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#334155" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown, name) => [
                    `${Number(val ?? 0)} Risiko`,
                    name === "inherent_high"
                      ? "Risiko Inheren Tinggi"
                      : "Risiko Residual Tinggi",
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                  formatter={(value: string) =>
                    value === "inherent_high"
                      ? "Risiko Inheren Tinggi"
                      : "Risiko Residual Tinggi"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="inherent_high"
                  name="inherent_high"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#dc2626" }}
                  activeDot={{ r: 7 }}
                >
                  <LabelList
                    dataKey="inherent_high"
                    position="top"
                    style={{ fontSize: 12, fontWeight: 700, fill: "#dc2626" }}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="residual_high"
                  name="residual_high"
                  stroke="#04a451"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#04a451" }}
                  activeDot={{ r: 7 }}
                >
                  <LabelList
                    dataKey="residual_high"
                    position="bottom"
                    style={{ fontSize: 12, fontWeight: 700, fill: "#04a451" }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {items.map((it) => (
              <div
                key={it.period_id}
                className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-xs space-y-1.5"
              >
                <div className="font-bold text-slate-800">{it.label}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Inheren Tinggi (16–19):</span>
                  <span className="font-bold text-red-600 text-sm">
                    {it.inherent_high} risiko
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Residual Tinggi (16–19):</span>
                  <span className="font-bold text-[#04a451] text-sm">
                    {it.residual_high} risiko
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-200">
                  Total catatan risiko periode: <b>{it.total_records}</b>
                </div>
              </div>
            ))}
          </div>

          {anomalies.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">
                  Catatan Format Numerik ({anomalies.length} baris):
                </div>
                <p className="leading-relaxed">
                  Terdapat nilai risiko dengan format teks kustom atau spasi (misalnya <code>&quot;- 2&quot;</code> atau <code>&quot;- 3&quot;</code>). Nilai tersebut dinormalisasi secara otomatis menjadi angka murni agar tidak merusak perhitungan tren.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
