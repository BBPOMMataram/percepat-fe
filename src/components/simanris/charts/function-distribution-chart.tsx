"use client";

import { useRef, useState } from "react";
import { Building2, Download, Layers } from "lucide-react";
import type { DashboardFunctionDistributionData } from "../types";
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

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
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
            const color = PROGRESS_COLORS[idx % PROGRESS_COLORS.length];
            const widthPct = Math.max(4, Math.min(100, item.percentage));

            return (
              <div key={item.unit_name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color }}
                    />
                    <span className="font-bold text-slate-800 truncate">
                      {item.unit_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-extrabold text-slate-900">
                      {item.total} risiko
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <span>
              Sumber kolom: <b>Nama Unit Kerja Terkait (Kolom K)</b> —{" "}
              {data?.use_alias_mapping
                ? "Digabungkan menggunakan konfigurasi function_alias_mappings"
                : "Nilai asli workbook setelah trimming spasi"}
            </span>
            <span className="font-extrabold text-slate-900">
              Total: {grandTotal} Risiko (100%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
