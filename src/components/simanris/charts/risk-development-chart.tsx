"use client";

import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Download, Filter, RotateCcw, TrendingUp } from "lucide-react";
import type { DashboardDevelopmentData, MasterOptionsData } from "../types";
import {
  buildChartExportFilename,
  exportChartToPng,
} from "../lib/exportChartToPng";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface RiskDevelopmentChartProps {
  data: DashboardDevelopmentData | null;
  loading?: boolean;
  filterLabel?: string;
  options?: MasterOptionsData | null;
  filters?: { function_id?: number | ""; risk_category_id?: number | "" };
  onFilterChange?: (filters: { function_id?: number | ""; risk_category_id?: number | "" }) => void;
}

const BAR_COLORS = ["#005baa", "#04a451", "#0284c7", "#0f766e"];

export function RiskDevelopmentChart({
  data,
  loading,
  filterLabel,
  options,
  filters,
  onFilterChange,
}: RiskDevelopmentChartProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportChartToPng({
        element: cardRef.current,
        fileName: buildChartExportFilename(
          "perkembangan-jumlah-risiko",
          data?.year ?? 2026
        ),
      });
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items ?? [];
  const hasActiveFilter = Boolean(filters?.function_id || filters?.risk_category_id);
  const activeFunctionName = options?.functions.find((f) => f.id === Number(filters?.function_id))?.name;
  const activeCategoryName = options?.categories.find((c) => c.id === Number(filters?.risk_category_id))?.name;

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
                1
              </span>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase">
                Perkembangan Jumlah Risiko
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Perbandingan total risiko antarsemester Tahun {data?.year ?? 2026}
              {activeFunctionName ? ` · Unit: ${activeFunctionName}` : ""}
              {activeCategoryName ? ` · Kategori: ${activeCategoryName}` : ""}
              {filterLabel ? ` · ${filterLabel}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {data && data.sem1_total > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                <TrendingUp className="h-3.5 w-3.5 text-[#04a451]" />
                {data.delta >= 0 ? `+${data.delta}` : data.delta} risiko (
                {data.delta >= 0 ? `+${data.delta_percent}%` : `${data.delta_percent}%`})
              </span>
            )}

            <button
              type="button"
              data-export-ignore="true"
              disabled={exporting || loading || items.length === 0}
              onClick={() => void handleExportPng()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#005baa] hover:border-blue-200 disabled:opacity-50 transition-colors"
              title="Unduh Grafik Perkembangan Jumlah Risiko sebagai PNG"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Mengekspor..." : "Unduh PNG"}
            </button>
          </div>
        </div>

        {/* Local Filter Bar for Chart 1 */}
        {onFilterChange && (
          <div data-export-ignore="true" className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3 text-[#005baa]" />
              Filter:
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
          label="Memuat grafik perkembangan jumlah risiko..."
        />
      ) : items.length === 0 ? (
        <ChartEmptyState
          heightClass="h-72"
          title="Data perkembangan risiko belum tersedia"
          description="Unggah dan publikasikan file Excel Semester I atau Semester II pada halaman Data Excel."
          actionHref="/simanris/data-excel"
          actionLabel="Buka Data Excel"
        />
      ) : (
        <>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={items}
                margin={{ top: 28, right: 24, left: 8, bottom: 12 }}
                barSize={72}
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
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.18)]}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown, _name, item) => {
                    const payload = item?.payload as
                      | DashboardDevelopmentData["items"][number]
                      | undefined;
                    const sheetInfo = payload?.primary_sheet
                      ? ` (Sheet '${payload.primary_sheet}')`
                      : "";
                    return [`${Number(val ?? 0)} Risiko${sheetInfo}`, "Total Risiko"];
                  }}
                />
                <Bar dataKey="total_risks" radius={[10, 10, 0, 0]}>
                  {items.map((entry, idx) => (
                    <Cell
                      key={entry.period_id}
                      fill={BAR_COLORS[idx % BAR_COLORS.length]}
                    />
                  ))}
                  <LabelList
                    dataKey="total_risks"
                    position="top"
                    style={{
                      fill: "#0f172a",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ringkasan angka per semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {items.map((it, idx) => (
              <div
                key={it.period_id}
                className="rounded-xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{it.label}</div>
                  <div className="text-[11px] text-slate-500">
                    Sheet utama: <b>{it.primary_sheet}</b>
                    {it.summary_sheet_total !== null
                      ? ` · Sheet8: ${it.summary_sheet_total}`
                      : ""}
                  </div>
                </div>
                <div
                  className="text-lg font-extrabold"
                  style={{ color: BAR_COLORS[idx % BAR_COLORS.length] }}
                >
                  {it.total_risks}
                </div>
              </div>
            ))}
          </div>

          {/* Catatan Rekonsiliasi (mis. 160 baris Kompilasi vs 159 di Sheet8/PPT) */}
          {data?.reconciliation_warnings &&
            data.reconciliation_warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    Catatan Rekonsiliasi Sumber Data Excel:
                  </div>
                  {data.reconciliation_warnings.map((w) => (
                    <p key={w.period_id} className="leading-relaxed">
                      <b>{w.period_name}:</b> {w.message}
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
