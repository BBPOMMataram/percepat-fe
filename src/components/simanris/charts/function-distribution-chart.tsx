"use client";

import { useRef, useState } from "react";
import { Building2, Download, Filter, Layers, RotateCcw } from "lucide-react";
import type { DashboardFunctionDistributionData, MasterOptionsData } from "../types";
import {
  buildChartExportFilename,
  exportChartToPng,
} from "../lib/exportChartToPng";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface FunctionDistributionChartProps {
  data: DashboardFunctionDistributionData | null;
  loading?: boolean;
  onToggleAliasMapping?: (enabled: boolean) => void;
  options?: MasterOptionsData | null;
  filters?: { risk_source?: string; risk_category_id?: number | "" };
  onFilterChange?: (filters: { risk_source?: string; risk_category_id?: number | "" }) => void;
}

const PROGRESS_COLORS = [
  "#004281",
  "#005baa",
  "#0284c7",
  "#04a451",
  "#0d9488",
  "#f59e0b",
  "#6366f1",
  "#64748b",
];

export function FunctionDistributionChart({
  data,
  loading,
  onToggleAliasMapping,
  options,
  filters,
  onFilterChange,
}: FunctionDistributionChartProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const periodYear = data?.period?.year ?? 2026;
  const periodSem = data?.period?.semester ?? 2;
  const periodLabel =
    data?.period?.period_name ||
    `Semester ${periodSem === 1 ? "I" : "II"} ${periodYear}`;

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportChartToPng({
        element: cardRef.current,
        fileName: buildChartExportFilename(
          "sebaran-risiko-per-fungsi",
          periodYear,
          periodSem
        ),
      });
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items ?? [];
  const grandTotal = data?.grand_total ?? 0;
  const hasActiveFilter = Boolean(filters?.risk_source || filters?.risk_category_id);
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
                2
              </span>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase">
                Sebaran Risiko {periodSem === 1 ? "Semester I" : "Semester II"} per Fungsi
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Distribusi risiko berdasarkan kolom <b>Nama Unit Kerja Terkait</b> ({periodLabel} · Total:{" "}
              <b>{grandTotal}</b> risiko)
              {filters?.risk_source ? ` · Sumber: ${filters.risk_source}` : ""}
              {activeCategoryName ? ` · Kategori: ${activeCategoryName}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onToggleAliasMapping && (
              <button
                type="button"
                data-export-ignore="true"
                onClick={() => onToggleAliasMapping(!data?.use_alias_mapping)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  data?.use_alias_mapping
                    ? "border-blue-300 bg-blue-50 text-[#004281]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                title="Beralih antara nama unit kerja asli pada Excel (8 label) atau penggabungan alias fungsi"
              >
                <Layers className="h-3.5 w-3.5" />
                {data?.use_alias_mapping ? "Mode: Alias Fungsi" : "Mode: Unit Kerja Asli Excel"}
              </button>
            )}

            <button
              type="button"
              data-export-ignore="true"
              disabled={exporting || loading || items.length === 0}
              onClick={() => void handleExportPng()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#005baa] hover:border-blue-200 disabled:opacity-50 transition-colors"
              title="Unduh Grafik Sebaran Risiko per Fungsi sebagai PNG"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Mengekspor..." : "Unduh PNG"}
            </button>
          </div>
        </div>

        {/* Local Filter Bar for Chart 2 */}
        {onFilterChange && (
          <div data-export-ignore="true" className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3 text-[#005baa]" />
              Filter Grafik:
            </span>

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
                    risk_source: "",
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
          label="Memuat sebaran risiko per fungsi..."
        />
      ) : items.length === 0 ? (
        <ChartEmptyState
          heightClass="h-72"
          title="Data sebaran fungsi belum tersedia"
          description="Pastikan periode memiliki dataset Excel terpublikasi."
        />
      ) : (
        <div className="space-y-3 pt-1">
          {items.map((item, idx) => {
            const pct = item.percentage ?? 0;
            const color = PROGRESS_COLORS[idx % PROGRESS_COLORS.length];
            const displayName = item.name || item.unit_name;
            return (
              <div key={displayName || idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate max-w-[70%]">
                    {displayName}
                  </span>
                  <span className="text-slate-500 font-medium">
                    <b className="text-slate-900">{item.total}</b> risiko ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(2, pct))}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
