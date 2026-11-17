"use client";

import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Filter, RotateCcw } from "lucide-react";
import type { DashboardCategoryDistributionData, MasterOptionsData } from "../types";
import {
  buildChartExportFilename,
  exportChartToPng,
} from "../lib/exportChartToPng";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface CategoryComparisonChartProps {
  data: DashboardCategoryDistributionData | null;
  loading?: boolean;
  options?: MasterOptionsData | null;
  filters?: { function_id?: number | ""; risk_source?: string };
  onFilterChange?: (filters: { function_id?: number | ""; risk_source?: string }) => void;
}

export function CategoryComparisonChart({
  data,
  loading,
  options,
  filters,
  onFilterChange,
}: CategoryComparisonChartProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const year = data?.year ?? 2026;
  const items = data?.items ?? [];
  const hasActiveFilter = Boolean(filters?.function_id || filters?.risk_source);
  const activeFunctionName = options?.functions.find((f) => f.id === Number(filters?.function_id))?.name;

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportChartToPng({
        element: cardRef.current,
        fileName: buildChartExportFilename("jumlah-kategori-risiko", year),
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
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-[#005baa]">
                3
              </span>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase">
                Jumlah Kategori Risiko
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Perbandingan kategori risiko Semester I {year} ({data?.sem1_total ?? 0}) vs Semester II{" "}
              {year} ({data?.sem2_total ?? 0})
              {activeFunctionName ? ` · Unit: ${activeFunctionName}` : ""}
              {filters?.risk_source ? ` · Sumber: ${filters.risk_source}` : ""}
            </p>
          </div>

          <button
            type="button"
            data-export-ignore="true"
            disabled={exporting || loading || items.length === 0}
            onClick={() => void handleExportPng()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#005baa] hover:border-blue-200 disabled:opacity-50 transition-colors"
            title="Unduh Grafik Jumlah Kategori Risiko sebagai PNG"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Mengekspor..." : "Unduh PNG"}
          </button>
        </div>

        {/* Local Filter Bar for Chart 3 */}
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
              value={filters?.risk_source ?? ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  risk_source: e.target.value,
                })
              }
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                filters?.risk_source
                  ? "border-blue-400 bg-blue-50 text-[#004281] font-semibold"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <option value="">Semua Sumber Risiko</option>
              <option value="Internal">Internal</option>
              <option value="Eksternal">Eksternal</option>
              <option value="Internal & Eksternal">Internal &amp; Eksternal</option>
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    function_id: "",
                    risk_source: "",
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
          heightClass="h-80"
          label="Memuat grafik perbandingan kategori risiko..."
        />
      ) : items.length === 0 ? (
        <ChartEmptyState
          heightClass="h-80"
          title="Data kategori risiko belum tersedia"
          description="Pastikan dataset Semester I atau Semester II telah dipublikasikan."
        />
      ) : (
        <>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={items}
                margin={{ top: 20, right: 16, left: 4, bottom: 48 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 10, fill: "#334155" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown, name) => [
                    `${Number(val ?? 0)} Risiko`,
                    name === "sem1_total" ? "Semester I" : "Semester II",
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                  formatter={(value: string) =>
                    value === "sem1_total" ? "Semester I" : "Semester II"
                  }
                />
                <Bar
                  dataKey="sem1_total"
                  name="sem1_total"
                  fill="#005baa"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                >
                  <LabelList
                    dataKey="sem1_total"
                    position="top"
                    style={{ fontSize: 10, fontWeight: 700, fill: "#005baa" }}
                    formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")}
                  />
                </Bar>
                <Bar
                  dataKey="sem2_total"
                  name="sem2_total"
                  fill="#04a451"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                >
                  <LabelList
                    dataKey="sem2_total"
                    position="top"
                    style={{ fontSize: 10, fontWeight: 700, fill: "#04a451" }}
                    formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            {items.map((it) => (
              <div
                key={it.name || it.code}
                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2 text-xs"
              >
                <div className="font-semibold text-slate-700 truncate" title={it.name}>
                  {it.name}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-[#005baa] font-bold">Sem I: {it.sem1_total}</span>
                  <span className="text-[#04a451] font-bold">Sem II: {it.sem2_total}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
