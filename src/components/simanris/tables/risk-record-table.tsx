"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import { simanrisApi, extractApiErrorMessage } from "../lib/simanrisApi";
import type {
  MasterOptionsData,
  RiskListData,
  SimanrisDashboardFilters,
  SupportingDataResponse,
} from "../types";
import { DashboardFilter } from "../dashboard/dashboard-filter";
import { RiskLevelBadge } from "../shared/RiskLevelBadge";
import { RiskDetailModal } from "../shared/RiskDetailModal";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

type WorkbookTabKey =
  | "risk_register"
  | "rtp"
  | "control_testings"
  | "reviews"
  | "positive_risks"
  | "contexts"
  | "extra_sheets";

export function RiskRecordTableView() {
  const [options, setOptions] = useState<MasterOptionsData | null>(null);
  const [filters, setFilters] = useState<SimanrisDashboardFilters>({});
  const [activeTab, setActiveTab] = useState<WorkbookTabKey>("risk_register");
  const [sortBy, setSortBy] = useState<string>("residual_level");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [data, setData] = useState<RiskListData | null>(null);
  const [supporting, setSupporting] = useState<SupportingDataResponse | null>(
    null
  );
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
      const [res, sup] = await Promise.all([
        simanrisApi.listRisks({
          ...filters,
          sort_by: sortBy,
          sort_dir: sortDir,
          per_page: perPage,
          page,
        }),
        simanrisApi.getSupportingData({
          period_id: filters.period_id,
          batch_id: filters.batch_id,
        }),
      ]);
      setData(res);
      setSupporting(sup);
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

  const rtpList = supporting?.rtp ?? [];
  const ctList = supporting?.control_testings ?? [];
  const reviewList = supporting?.reviews ?? [];
  const posList = supporting?.positive_risks ?? [];
  const ctxList = supporting?.contexts ?? [];
  const extraSheets = supporting?.extra_sheets ?? [];

  const tabItems: Array<{
    key: WorkbookTabKey;
    label: string;
    count: number;
  }> = [
    {
      key: "risk_register",
      label: "Daftar Risiko / Kompilasi",
      count: paginator?.total ?? rows.length,
    },
    { key: "rtp", label: "RTP", count: rtpList.length },
    {
      key: "control_testings",
      label: "Aktivitas Pengendalian",
      count: ctList.length,
    },
    { key: "reviews", label: "Reviu Risiko", count: reviewList.length },
    {
      key: "positive_risks",
      label: "Risiko Positif",
      count: posList.length,
    },
    { key: "contexts", label: "Piagam & Konteks", count: ctxList.length },
    {
      key: "extra_sheets",
      label: "Tab Pendukung Lainnya",
      count: extraSheets.length,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Layers className="h-4 w-4 text-[#005baa] shrink-0" />
            <span>
              Periode aktif: <b>{data?.period?.period_name || "-"}</b> · File
              sumber: <b>{data?.batch?.file_name || "belum ada"}</b>
            </span>
          </div>
          {activeTab === "risk_register" && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500 font-medium">
                Baris / halaman:
              </label>
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
          )}
        </div>

        {/* Switcher Seluruh Tab Workbook Excel */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-[#004281] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
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
          <ChartLoadingState
            heightClass="h-80"
            label="Memuat daftar risk register & tab workbook..."
          />
        ) : activeTab !== "risk_register" ? (
          <div className="space-y-4">
            {activeTab === "rtp" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Baris</th>
                      <th className="px-3 py-2.5">Kode</th>
                      <th className="px-3 py-2.5">Peristiwa Risiko</th>
                      <th className="px-3 py-2.5">Uraian Mitigasi / RTP</th>
                      <th className="px-3 py-2.5">PIC &amp; Target Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rtpList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                          Tidak ada data RTP pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      rtpList.map((r) => {
                        const anyR = r as unknown as Record<string, unknown>;
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                              {r.source_sheet} #{r.source_row}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-[#004281]">
                              {r.risk_code || "-"}
                            </td>
                            <td className="px-3 py-2.5 max-w-sm">
                              {r.risk_event || "-"}
                            </td>
                            <td className="px-3 py-2.5 max-w-md">
                              {String(
                                anyR.mitigation_description ||
                                  r.treatment_plan ||
                                  r.action_plan ||
                                  "-"
                              )}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="font-semibold text-slate-800">
                                {r.pic || "-"}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {String(anyR.target_date || r.target_timeline || "-")}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "control_testings" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Baris</th>
                      <th className="px-3 py-2.5">Kode</th>
                      <th className="px-3 py-2.5">Peristiwa / Pengendalian</th>
                      <th className="px-3 py-2.5">Kelemahan &amp; Efektivitas</th>
                      <th className="px-3 py-2.5">Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ctList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                          Tidak ada data Pengujian Aktivitas Pengendalian pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      ctList.map((c) => {
                        const anyC = c as unknown as Record<string, unknown>;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                              {c.source_sheet} #{c.source_row}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-[#004281]">
                              {c.risk_code || "-"}
                            </td>
                            <td className="px-3 py-2.5 max-w-md">
                              <div className="font-semibold text-slate-800">
                                {String(anyC.risk_event || c.control_name || "-")}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {String(anyC.mitigation_description || "-")}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div>{String(anyC.control_weakness || "-")}</div>
                              <div className="font-semibold text-[#005baa]">
                                {String(anyC.control_effectiveness || "-")}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 max-w-xs">
                              {String(anyC.recommendation || c.testing_result || "-")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Baris</th>
                      <th className="px-3 py-2.5">Kode</th>
                      <th className="px-3 py-2.5">Peristiwa &amp; Mitigasi</th>
                      <th className="px-3 py-2.5">Progres &amp; Tanggal Reviu</th>
                      <th className="px-3 py-2.5">Efektivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviewList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                          Tidak ada data Reviu Risiko pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      reviewList.map((rv) => {
                        const anyRv = rv as unknown as Record<string, unknown>;
                        return (
                          <tr key={rv.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                              {rv.source_sheet} #{rv.source_row}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-[#004281]">
                              {rv.risk_code || "-"}
                            </td>
                            <td className="px-3 py-2.5 max-w-md">
                              <div className="font-semibold text-slate-800">
                                {String(anyRv.risk_event || rv.review_result || "-")}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {String(anyRv.mitigation_description || "-")}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div>{String(anyRv.progress || "-")}</div>
                              <div className="text-[11px] text-slate-500">
                                Tgl: {rv.review_date || "-"}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-slate-700">
                              {String(anyRv.control_effectiveness || "-")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "positive_risks" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Baris</th>
                      <th className="px-3 py-2.5">Kode</th>
                      <th className="px-3 py-2.5">Uraian Risiko Positif / Peluang</th>
                      <th className="px-3 py-2.5">Sasaran / Dampak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                          Tidak ada data Risiko Positif pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      posList.map((p) => {
                        const anyP = p as unknown as Record<string, unknown>;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                              {p.source_sheet} #{p.source_row}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-[#04a451]">
                              {String(anyP.code || p.risk_code || "-")}
                            </td>
                            <td className="px-3 py-2.5 max-w-md font-medium text-slate-800">
                              {String(anyP.description || p.opportunity_event || "-")}
                            </td>
                            <td className="px-3 py-2.5 max-w-md text-slate-600">
                              {String(anyP.objective || p.impact_desc || "-")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "contexts" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Tab Sumber</th>
                      <th className="px-3 py-2.5">Judul / Pokok Konteks</th>
                      <th className="px-3 py-2.5">Uraian / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ctxList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                          Tidak ada data Piagam / Konteks pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      ctxList.map((ctx) => (
                        <tr key={ctx.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 whitespace-nowrap font-semibold uppercase text-[#005baa]">
                            {ctx.context_type || ctx.source_sheet} #{ctx.source_row}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800 max-w-sm">
                            {ctx.title || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 max-w-xl">
                            {ctx.description || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "extra_sheets" && (
              <div className="space-y-4">
                {extraSheets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Tidak ada tab pendukung tambahan pada periode ini.
                  </div>
                ) : (
                  extraSheets.map((grp) => (
                    <div
                      key={grp.sheet_name}
                      className="rounded-xl border border-slate-200 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#004281]">
                          Tab: {grp.sheet_name} ({grp.row_type})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {grp.total} baris terbaca
                        </span>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {grp.rows.slice(0, 30).map((sr) => {
                          const np = (sr.normalized_payload ||
                            sr.normalized_data ||
                            {}) as Record<string, unknown>;
                          return (
                            <div
                              key={sr.id}
                              className="py-1.5 flex items-start gap-3 text-slate-700"
                            >
                              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                                B{sr.source_row}
                              </span>
                              <span className="font-mono font-bold text-[#005baa] shrink-0">
                                {String(np.risk_code || np.label || "-")}
                              </span>
                              <span className="line-clamp-1">
                                {String(
                                  np.risk_event ||
                                    (np.count !== undefined
                                      ? `Total: ${np.count}`
                                      : JSON.stringify(np))
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : rows.length === 0 ? (
          <ChartEmptyState
            heightClass="h-64"
            title="Tidak ada data risiko ditemukan"
            description="Pastikan periode memiliki batch terpublikasi atau ubah kata kunci pencarian."
            actionHref="/simanris/data-excel"
            actionLabel="Unggah Workbook di Data Excel"
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
