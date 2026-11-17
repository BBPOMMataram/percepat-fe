"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, Eye, FileSpreadsheet } from "lucide-react";
import { simanrisApi, extractApiErrorMessage } from "../lib/simanrisApi";
import type {
  MasterOptionsData,
  RiskListData,
  SimanrisDashboardFilters,
} from "../types";
import { DashboardFilter } from "../dashboard/dashboard-filter";
import { RiskLevelBadge } from "../shared/RiskLevelBadge";
import { RiskDetailModal } from "../shared/RiskDetailModal";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

export function RiskRecordTableView() {
  const [options, setOptions] = useState<MasterOptionsData | null>(null);
  const [filters, setFilters] = useState<SimanrisDashboardFilters>({});
  const [sortBy, setSortBy] = useState<string>("residual_level");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [data, setData] = useState<RiskListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);

  useEffect(() => {
    simanrisApi
      .getMasterOptions()
      .then(setOptions)
      .catch(() => {
        // Error ditangani di fetch utama
      });
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await simanrisApi.listRisks({
        ...filters,
        sort_by: sortBy,
        sort_dir: sortDir,
        per_page: perPage,
        page,
      });
      setData(res);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortDir, perPage, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchList();
    }, 180);
    return () => clearTimeout(t);
  }, [fetchList]);

  const toggleSort = (col: string) => {
    setPage(1);
    if (sortBy === col) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const paginator = data?.records;
  const rows = paginator?.data || [];
  const highMin = data?.period?.high_risk_min_level ?? 16;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Eksplorasi Risk Register Lengkap
          </h2>
          <p className="text-xs text-slate-500">
            Menampilkan seluruh record risiko terpublikasi untuk periode{" "}
            <b>{data?.period?.period_name || "-"}</b> (file:{" "}
            <b>{data?.batch?.file_name || "belum ada"}</b>).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-500 font-medium">Baris / halaman:</label>
          <select
            value={perPage}
            onChange={(e) => {
              setPage(1);
              setPerPage(Number(e.target.value));
            }}
            className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700"
          >
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <DashboardFilter
        options={options}
        filters={filters}
        onChange={(next) => {
          setPage(1);
          setFilters(next);
        }}
        onReset={() => {
          setPage(1);
          setFilters((prev) => ({ period_id: prev.period_id }));
        }}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        {loading && !data ? (
          <ChartLoadingState heightClass="h-80" label="Memuat daftar risk register..." />
        ) : rows.length === 0 ? (
          <ChartEmptyState
            heightClass="h-64"
            title="Tidak ada data risiko ditemukan"
            description="Pastikan periode memiliki batch terpublikasi atau ubah kata kunci pencarian."
            actionHref="/simanris/upload"
            actionLabel="Upload Workbook Excel"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("source_row")}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Baris <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("risk_code")}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Kode <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5">Peristiwa &amp; Penyebab</th>
                    <th className="px-3 py-2.5">Fungsi &amp; Kategori</th>
                    <th className="px-3 py-2.5">Sumber</th>
                    <th className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSort("inherent_level")}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Inheren <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSort("residual_level")}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Residual <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRiskId(rec.id)}
                      className="cursor-pointer hover:bg-blue-50/40"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                          {rec.source_sheet || "-"} #{rec.source_row ?? "-"}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-mono font-bold text-[#004281]">
                        {rec.risk_code || "-"}
                        {rec.has_matrix_anomaly && (
                          <div className="mt-1 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-amber-800">
                            <AlertTriangle className="h-2.5 w-2.5" /> Anomali
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 max-w-md">
                        <div className="font-semibold text-slate-800 line-clamp-2">
                          {rec.risk_event || "-"}
                        </div>
                        {rec.risk_cause && (
                          <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                            Penyebab: {rec.risk_cause}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-700">
                          {rec.risk_function?.name || rec.raw_unit_name || "-"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rec.risk_category?.name || rec.raw_category_name || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                        {rec.risk_source || "-"}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <RiskLevelBadge
                          level={rec.inherent_level}
                          highMin={highMin}
                          compact
                        />
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <RiskLevelBadge
                          level={rec.residual_level}
                          highMin={highMin}
                          compact
                        />
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRiskId(rec.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-[#005baa] hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3" /> Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginator && paginator.last_page > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  Menampilkan <b>{paginator.from ?? 0}</b>–<b>{paginator.to ?? 0}</b>{" "}
                  dari <b>{paginator.total}</b> baris
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={paginator.current_page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                  </button>
                  <span className="px-2 font-semibold text-slate-700">
                    Hal {paginator.current_page} / {paginator.last_page}
                  </span>
                  <button
                    type="button"
                    disabled={paginator.current_page >= paginator.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <RiskDetailModal
        riskId={selectedRiskId}
        highMin={highMin}
        onClose={() => setSelectedRiskId(null)}
      />
    </div>
  );
}
