"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { PaginatedData, RiskPriorityItem } from "../types";
import { RiskLevelBadge } from "../shared/RiskLevelBadge";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface RiskPriorityTableProps {
  data: PaginatedData<RiskPriorityItem> | null;
  highMin?: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSelectRisk: (riskId: number) => void;
}

export function RiskPriorityTable({
  data,
  highMin = 16,
  loading,
  onPageChange,
  onSelectRisk,
}: RiskPriorityTableProps) {
  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-64" label="Memuat daftar risiko prioritas..." />
      </div>
    );
  }

  const rows = data?.data || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Risiko Prioritas (Urut Level Residual Tertinggi)
          </h3>
          <p className="text-xs text-slate-500">
            Klik baris untuk menelusuri penyebab, pengendalian, RTP, dan snapshot baris Excel.
          </p>
        </div>

        <Link
          href="/simanris/data-risiko"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-50"
        >
          Lihat Semua Data Risiko
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <ChartEmptyState
          heightClass="h-52"
          title="Belum ada baris risiko prioritas"
          description="Unggah workbook atau longgarkan filter yang sedang aktif."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Kode</th>
                  <th className="px-3 py-2.5">Peristiwa Risiko</th>
                  <th className="px-3 py-2.5">Fungsi</th>
                  <th className="px-3 py-2.5">Kategori</th>
                  <th className="px-3 py-2.5 text-center">Inheren</th>
                  <th className="px-3 py-2.5 text-center">Residual</th>
                  <th className="px-3 py-2.5">Sumber Sheet</th>
                  <th className="px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onSelectRisk(row.id)}
                    className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-[#004281]">
                      <div>{row.risk_code || "-"}</div>
                      {row.has_matrix_anomaly && (
                        <span className="mt-0.5 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-amber-800">
                          <AlertTriangle className="h-2.5 w-2.5" /> Anomali
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-md">
                      <p className="line-clamp-2 font-medium text-slate-800">
                        {row.risk_event || "-"}
                      </p>
                      {row.is_duplicate_code_candidate && (
                        <span className="mt-0.5 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                          Kode Ganda
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                      {row.function_name || "-"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                      {row.category_name || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <RiskLevelBadge
                        level={row.inherent_level}
                        highMin={highMin}
                        compact
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <RiskLevelBadge
                        level={row.residual_level}
                        highMin={highMin}
                        compact
                      />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                      {row.source_sheet || "-"} · B{row.source_row ?? "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRisk(row.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white"
                      >
                        <Eye className="h-3 w-3" /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                Menampilkan <b>{data.from ?? 0}</b>–<b>{data.to ?? 0}</b> dari{" "}
                <b>{data.total}</b> risiko
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={data.current_page <= 1}
                  onClick={() => onPageChange(data.current_page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </button>
                <span className="px-2 font-semibold text-slate-700">
                  {data.current_page} / {data.last_page}
                </span>
                <button
                  type="button"
                  disabled={data.current_page >= data.last_page}
                  onClick={() => onPageChange(data.current_page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
