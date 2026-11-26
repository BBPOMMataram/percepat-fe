"use client";

import { useState, type KeyboardEvent } from "react";
import { Filter, RotateCcw } from "lucide-react";
import type { MasterOptionsData, RiskMatrixData } from "../types";
import { getRiskLevelStyle } from "../shared/RiskLevelBadge";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

type HeatmapScope = { function_id?: number | ""; risk_category_id?: number | "" };

interface RiskHeatmapProps {
  data: RiskMatrixData | null;
  loading: boolean;
  /**
   * Dipanggil saat sel RESIDUAL diklik. Hanya level di dalam `selectableLevels`
   * (rentang tabel Risiko Residual Tinggi) yang bisa diklik. Filter fungsi/kategori
   * milik peta ini ikut dikirim agar tabel menampilkan cakupan yang sama.
   */
  onSelectLevel?: (level: string, scope: HeatmapScope) => void;
  selectableLevels?: { min: number; max: number };
  options?: MasterOptionsData | null;
  filters?: { function_id?: number | ""; risk_category_id?: number | "" };
  onFilterChange?: (filters: { function_id?: number | ""; risk_category_id?: number | "" }) => void;
}

const LIKELIHOOD_LABELS: Record<number, string> = {
  5: "5 · Hampir Pasti",
  4: "4 · Sering",
  3: "3 · Kadang",
  2: "2 · Jarang",
  1: "1 · Hampir Tidak Terjadi",
};

const IMPACT_LABELS: Record<number, string> = {
  1: "1 · Tidak Signifikan",
  2: "2 · Minor",
  3: "3 · Moderat",
  4: "4 · Signifikan",
  5: "5 · Sangat Signifikan",
};

export function RiskHeatmap({
  data,
  loading,
  onSelectLevel,
  selectableLevels,
  options,
  filters,
  onFilterChange,
}: RiskHeatmapProps) {
  const [mode, setMode] = useState<"residual" | "inherent">("residual");
  const hasActiveFilter = Boolean(filters?.function_id || filters?.risk_category_id);
  const activeFunctionName = options?.functions.find((f) => f.id === Number(filters?.function_id))?.name;
  const activeCategoryName = options?.categories.find((c) => c.id === Number(filters?.risk_category_id))?.name;

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-80" label="Memuat matriks peta risiko..." />
      </div>
    );
  }

  if (!data || !data.available) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          Peta Matriks Risiko 5×5 (SAPA APIP)
        </h3>
        <ChartEmptyState
          heightClass="h-64"
          title="Matriks periode belum tersedia"
          description={
            data?.reason ||
            "Matriks hanya dirender dari konfigurasi periode terpublikasi (tanpa hardcode perkalian L × D)."
          }
        />
      </div>
    );
  }

  const cells = mode === "inherent" ? data.inherent : data.residual;
  const countLookup = new Map<string, number>();
  for (const c of cells) {
    countLookup.set(`${c.likelihood}x${c.impact}`, c.count);
  }

  const rows = [5, 4, 3, 2, 1];
  const cols = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Peta Matriks Risiko 5×5 (Berdasarkan Konfigurasi Periode)
          </h3>
          <p className="text-xs text-slate-500">
            Skor di setiap sel berasal dari <code>matrix_config</code> periode aktif. Klik sel berisi risiko untuk menyaring daftar.
            {activeFunctionName ? ` · Unit: ${activeFunctionName}` : ""}
            {activeCategoryName ? ` · Kategori: ${activeCategoryName}` : ""}
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("residual")}
            className={`rounded-lg px-3 py-1 transition-all ${
              mode === "residual"
                ? "bg-[#004281] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Residual
          </button>
          <button
            type="button"
            onClick={() => setMode("inherent")}
            className={`rounded-lg px-3 py-1 transition-all ${
              mode === "inherent"
                ? "bg-[#004281] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Inheren
          </button>
        </div>
      </div>

      {/* Local Filter Bar for Heatmap */}
      {onFilterChange && (
        <div data-export-ignore="true" className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3 text-[#005baa]" />
            Filter Matriks:
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
              title="Reset filter matriks ini"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-separate border-spacing-1.5 text-xs">
          <thead>
            <tr>
              <th className="w-40 text-left text-[11px] font-semibold text-slate-500 px-1">
                Kemungkinan ↓ / Dampak →
              </th>
              {cols.map((imp) => (
                <th
                  key={imp}
                  className="text-center font-bold text-slate-700 px-1 py-1 text-[11px]"
                >
                  {IMPACT_LABELS[imp]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((lik) => (
              <tr key={lik}>
                <td className="font-semibold text-slate-700 px-1 py-1 text-[11px] whitespace-nowrap">
                  {LIKELIHOOD_LABELS[lik]}
                </td>
                {cols.map((imp) => {
                  const key = `${lik}x${imp}`;
                  const lvl = data.matrix_config[key] ?? null;
                  const count = countLookup.get(key) ?? 0;
                  const style = getRiskLevelStyle(lvl, data.high_risk_min_level);
                  // Sel hanya bisa diklik bila hasilnya PASTI ada di tabel Risiko Residual Tinggi:
                  // mode residual, ada risikonya, dan levelnya di dalam rentang tabel.
                  const isSelectable =
                    mode === "residual" &&
                    count > 0 &&
                    lvl !== null &&
                    !!onSelectLevel &&
                    !!selectableLevels &&
                    lvl >= selectableLevels.min &&
                    lvl <= selectableLevels.max;
                  const selectCell = () => {
                    if (isSelectable && lvl !== null && onSelectLevel) {
                      onSelectLevel(String(lvl), {
                        function_id: filters?.function_id ?? "",
                        risk_category_id: filters?.risk_category_id ?? "",
                      });
                    }
                  };

                  return (
                    <td
                      key={imp}
                      onClick={isSelectable ? selectCell : undefined}
                      onKeyDown={
                        isSelectable
                          ? (e: KeyboardEvent<HTMLTableCellElement>) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                selectCell();
                              }
                            }
                          : undefined
                      }
                      role={isSelectable ? "button" : undefined}
                      tabIndex={isSelectable ? 0 : undefined}
                      className={`h-12 text-center rounded-xl font-bold transition-all ${style.cellBg} ${
                        isSelectable
                          ? "cursor-pointer ring-2 ring-slate-900/10 shadow-xs hover:scale-105 focus:outline-none focus-visible:ring-[#004281]"
                          : count > 0
                            ? "ring-1 ring-slate-900/5"
                            : "opacity-85"
                      }`}
                      title={`Kemungkinan: ${lik}, Dampak: ${imp} -> Level ${lvl} (${count} risiko)${
                        isSelectable ? " · klik untuk tampilkan di tabel Risiko Residual Tinggi" : ""
                      }`}
                    >
                      <div className="text-[10px] opacity-80">Lvl {lvl ?? "-"}</div>
                      <div className="text-base font-extrabold leading-none">
                        {count > 0 ? count : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <div>
          Batas Risiko Tinggi periode aktif:{" "}
          <b className="text-red-700 font-bold">
            ≥ Level {data.high_risk_min_level}
          </b>
        </div>
        <div className="w-full sm:w-auto">
          {mode === "residual" && selectableLevels && onSelectLevel
            ? `Klik sel Residual level ${selectableLevels.min}–${selectableLevels.max} untuk menampilkan risikonya di tabel Risiko Residual Tinggi.`
            : "Mode Inheren hanya untuk dibaca; tabel di bawah berisi risiko residual."}
        </div>
        <div>
          Total sel terisi {mode === "residual" ? "Residual" : "Inheren"}:{" "}
          <b>
            {Array.from(countLookup.values()).reduce((a, b) => a + b, 0)} risiko
          </b>
        </div>
      </div>
    </div>
  );
}
