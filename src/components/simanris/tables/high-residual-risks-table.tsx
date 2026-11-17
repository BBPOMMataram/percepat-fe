"use client";

import { useRef, useState } from "react";
import { Download, Eye, Filter, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import type { DashboardHighResidualRisksData, MasterOptionsData } from "../types";
import {
  buildChartExportFilename,
  exportChartToPng,
} from "../lib/exportChartToPng";
import { RiskLevelBadge } from "../shared/RiskLevelBadge";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface HighResidualRisksTableProps {
  data: DashboardHighResidualRisksData | null;
  loading?: boolean;
  onSelectRisk?: (riskId: number) => void;
  options?: MasterOptionsData | null;
  filters?: {
    search?: string;
    function_id?: number | "";
    risk_category_id?: number | "";
    residual_level?: string;
  };
  onFilterChange?: (filters: {
    search?: string;
    function_id?: number | "";
    risk_category_id?: number | "";
    residual_level?: string;
  }) => void;
}

export function HighResidualRisksTable({
  data,
  loading,
  onSelectRisk,
  options,
  filters,
  onFilterChange,
}: HighResidualRisksTableProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const periodYear = data?.period?.year ?? 2026;
  const periodSem = data?.period?.semester ?? 2;
  const periodLabel =
    data?.period?.period_name ||
    `Semester ${periodSem === 1 ? "I" : "II"} ${periodYear}`;
  const minLevel = data?.min_level ?? 16;
  const maxLevel = data?.max_level ?? 19;
  const items = data?.items ?? [];

  const hasActiveFilter = Boolean(
    filters?.search ||
      filters?.function_id ||
      filters?.risk_category_id ||
      filters?.residual_level
  );

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportChartToPng({
        element: cardRef.current,
        fileName: buildChartExportFilename(
          "risiko-residual-tinggi",
          periodYear,
          periodSem
        ),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-xs font-extrabold text-red-700">
              5
            </span>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase">
              Risiko Residual Tinggi (Level {minLevel}–{maxLevel}) — {periodLabel}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Daftar risiko prioritas dengan nilai Level Risiko Residual antara {minLevel} hingga{" "}
            {maxLevel}, diurutkan dari skor tertinggi ({items.length} risiko teridentifikasi)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-slate-500 font-medium">Warna Matriks Risiko:</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-red-800 px-2 py-0.5 font-bold text-white">
              20–25 Sangat Tinggi
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 font-bold text-white">
              18–19 Tinggi (Atas)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2 py-0.5 font-bold text-white">
              16–17 Tinggi (Menengah)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 font-bold text-slate-950">
              10–15 Sedang
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 font-bold text-white">
              5–9 Rendah
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-2 py-0.5 font-bold text-white">
              1–4 Sangat Rendah
            </span>
          </div>
        </div>

        <button
          type="button"
          data-export-ignore="true"
          disabled={exporting || loading || items.length === 0}
          onClick={() => void handleExportPng()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#005baa] hover:border-blue-200 disabled:opacity-50 transition-colors"
          title="Unduh Tabel Risiko Residual Tinggi sebagai PNG"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Mengekspor..." : "Unduh PNG"}
        </button>
      </div>

      {/* Local Filter Bar for Table 5 */}
      {onFilterChange && (
        <div data-export-ignore="true" className="flex flex-wrap items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-200 p-2.5 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={filters?.search ?? ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  search: e.target.value,
                })
              }
              placeholder="Cari kode, peristiwa, penyebab..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#005baa] focus:outline-none"
            />
            {filters?.search && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, search: "" })}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={filters?.function_id ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                function_id: e.target.value ? Number(e.target.value) : "",
              })
            }
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filters?.function_id
                ? "border-blue-400 bg-blue-50 text-[#004281] font-semibold"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            <option value="">Semua Fungsi / Unit</option>
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
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filters?.risk_category_id
                ? "border-blue-400 bg-blue-50 text-[#004281] font-semibold"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            <option value="">Semua Kategori</option>
            {options?.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.code} — {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters?.residual_level ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                residual_level: e.target.value,
              })
            }
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filters?.residual_level
                ? "border-blue-400 bg-blue-50 text-[#004281] font-semibold"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            <option value="">Semua Level Tinggi (16–19)</option>
            <option value="19">Level 19 (Tinggi Atas)</option>
            <option value="18">Level 18 (Tinggi Atas)</option>
            <option value="17">Level 17 (Tinggi Menengah)</option>
            <option value="16">Level 16 (Tinggi Menengah)</option>
          </select>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  search: "",
                  function_id: "",
                  risk_category_id: "",
                  residual_level: "",
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
              title="Reset filter tabel ini"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filter
            </button>
          )}
        </div>
      )}

      {loading ? (
        <ChartLoadingState
          heightClass="h-64"
          label="Memuat daftar risiko residual tinggi..."
        />
      ) : items.length === 0 ? (
        <ChartEmptyState
          heightClass="h-56"
          title="Tidak ada risiko residual tinggi (Level 16–19)"
          description="Pada periode dan filter ini tidak ditemukan risiko dengan nilai residual 16–19."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3.5 py-3 w-28">Kode Risiko</th>
                <th className="px-3.5 py-3">Uraian Risiko (Risk Event)</th>
                <th className="px-3.5 py-3 w-52">Unit Kerja / Kategori</th>
                <th className="px-3.5 py-3 w-36 text-center">Level Inheren</th>
                <th className="px-3.5 py-3 w-36 text-center">Level Residual</th>
                {onSelectRisk && (
                  <th className="px-3.5 py-3 w-20 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-900 align-top">
                    {row.risk_code || "-"}
                  </td>
                  <td className="px-3.5 py-3 text-slate-800 align-top space-y-1">
                    <div className="font-semibold">{row.risk_event}</div>
                    {row.risk_cause && (
                      <div className="text-[11px] text-slate-500 line-clamp-2">
                        <b>Penyebab:</b> {row.risk_cause}
                      </div>
                    )}
                    {row.potential_impact && (
                      <div className="text-[11px] text-slate-500 line-clamp-2">
                        <b>Dampak:</b> {row.potential_impact}
                      </div>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-slate-700 align-top space-y-0.5">
                    <div className="font-medium">{row.function_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {row.category_name}
                    </div>
                    {row.risk_source && (
                      <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {row.risk_source}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-center align-top">
                    <RiskLevelBadge
                      level={row.inherent_level}
                      highMin={minLevel}
                    />
                  </td>
                  <td className="px-3.5 py-3 text-center align-top">
                    <RiskLevelBadge
                      level={row.residual_level}
                      highMin={minLevel}
                    />
                  </td>
                  {onSelectRisk && (
                    <td className="px-3.5 py-3 text-center align-top">
                      <button
                        type="button"
                        data-export-ignore="true"
                        onClick={() => onSelectRisk(row.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-blue-50 hover:text-[#005baa] hover:border-blue-200 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Detail
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
