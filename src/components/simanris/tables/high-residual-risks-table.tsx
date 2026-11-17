"use client";

import { useRef, useState } from "react";
import { Download, Eye, ShieldAlert } from "lucide-react";
import type { DashboardHighResidualRisksData } from "../types";
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
}

export function HighResidualRisksTable({
  data,
  loading,
  onSelectRisk,
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
                  <th
                    data-export-ignore="true"
                    className="px-3.5 py-3 w-24 text-right"
                  >
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectRisk?.(item.id)}
                  className={
                    onSelectRisk
                      ? "cursor-pointer hover:bg-red-50/30 transition-colors"
                      : ""
                  }
                >
                  <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 font-mono text-xs font-extrabold text-red-800">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      {item.risk_code || "-"}
                    </span>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {item.source_sheet || "Kompilasi"} #{item.source_row ?? "-"}
                    </div>
                  </td>

                  <td className="px-3.5 py-3.5 align-top">
                    <div className="font-semibold text-slate-900 leading-relaxed whitespace-normal">
                      {item.risk_event || "-"}
                    </div>
                    {item.risk_cause && (
                      <div className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-700">
                          Penyebab:
                        </span>{" "}
                        {item.risk_cause}
                      </div>
                    )}
                  </td>

                  <td className="px-3.5 py-3.5 align-top">
                    <div className="font-bold text-slate-800">
                      {item.raw_unit_name || item.function_name || "-"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Kategori: <b>{item.category_name || "-"}</b>
                    </div>
                  </td>

                  <td className="px-3.5 py-3.5 align-top text-center whitespace-nowrap">
                    <RiskLevelBadge
                      level={item.inherent_level}
                      highMin={minLevel}
                    />
                    {item.inherent_likelihood && item.inherent_impact && (
                      <div className="mt-1 text-[10px] text-slate-500">
                        K:{item.inherent_likelihood} × D:{item.inherent_impact}
                      </div>
                    )}
                  </td>

                  <td className="px-3.5 py-3.5 align-top text-center whitespace-nowrap">
                    <RiskLevelBadge
                      level={item.residual_level}
                      highMin={minLevel}
                    />
                    {item.residual_likelihood && item.residual_impact && (
                      <div className="mt-1 text-[10px] text-slate-500">
                        K:{item.residual_likelihood} × D:{item.residual_impact}
                      </div>
                    )}
                  </td>

                  {onSelectRisk && (
                    <td
                      data-export-ignore="true"
                      className="px-3.5 py-3.5 align-top text-right whitespace-nowrap"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRisk(item.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#005baa] hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3" /> Detail
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
