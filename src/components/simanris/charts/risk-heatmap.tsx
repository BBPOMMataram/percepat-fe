"use client";

import { useState } from "react";
import type { RiskMatrixData } from "../types";
import { getRiskLevelStyle } from "../shared/RiskLevelBadge";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface RiskHeatmapProps {
  data: RiskMatrixData | null;
  loading: boolean;
  onSelectLevel?: (mode: "inherent" | "residual", level: string) => void;
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
}: RiskHeatmapProps) {
  const [mode, setMode] = useState<"residual" | "inherent">("residual");

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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Peta Matriks Risiko 5×5 (Berdasarkan Konfigurasi Periode)
          </h3>
          <p className="text-xs text-slate-500">
            Skor di setiap sel berasal dari <code>matrix_config</code> periode aktif. Klik sel berisi risiko untuk menyaring daftar.
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
                  className="text-center text-[11px] font-semibold text-slate-600 pb-1"
                >
                  {IMPACT_LABELS[imp]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((lik) => (
              <tr key={lik}>
                <td className="text-[11px] font-semibold text-slate-600 pr-2">
                  {LIKELIHOOD_LABELS[lik]}
                </td>
                {cols.map((imp) => {
                  const key = `${lik}x${imp}`;
                  const matrixLevel = data.matrix_config[key] ?? null;
                  const count = countLookup.get(key) ?? 0;
                  const style = getRiskLevelStyle(
                    matrixLevel,
                    data.high_risk_min_level
                  );
                  return (
                    <td key={key}>
                      <button
                        type="button"
                        disabled={count === 0 || matrixLevel === null}
                        onClick={() => {
                          if (matrixLevel !== null && onSelectLevel) {
                            onSelectLevel(mode, String(matrixLevel));
                          }
                        }}
                        className={`w-full rounded-xl p-2.5 text-center transition-all border border-black/5 ${
                          style.cellBg
                        } ${
                          count > 0
                            ? "cursor-pointer hover:ring-2 hover:ring-slate-900/40 shadow-xs"
                            : "opacity-55 cursor-default"
                        }`}
                        title={`L=${lik}, D=${imp} → Level Matriks ${matrixLevel ?? "-"} (${count} risiko)`}
                      >
                        <div className="text-[10px] font-semibold opacity-80">
                          Lv {matrixLevel ?? "-"}
                        </div>
                        <div className="mt-0.5 text-base font-extrabold leading-none">
                          {count}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
