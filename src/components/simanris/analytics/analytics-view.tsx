"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GitCompareArrows,
  Info,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { extractApiErrorMessage, simanrisApi } from "../lib/simanrisApi";
import type {
  MasterOptionsData,
  RiskMovementData,
  SemesterComparisonData,
  SupportingDataResponse,
} from "../types";
import { SemesterComparisonChart } from "../charts/semester-comparison-chart";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

export function AnalyticsView() {
  const [options, setOptions] = useState<MasterOptionsData | null>(null);
  const [basePeriodId, setBasePeriodId] = useState<number | "">("");
  const [targetPeriodId, setTargetPeriodId] = useState<number | "">("");
  const [functionId, setFunctionId] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<
    "comparison" | "movement" | "supporting"
  >("comparison");
  const [supportingSubTab, setSupportingSubTab] = useState<
    "rtp" | "control_testings" | "reviews" | "positive_risks" | "contexts"
  >("rtp");

  const [comparison, setComparison] = useState<SemesterComparisonData | null>(
    null
  );
  const [movement, setMovement] = useState<RiskMovementData | null>(null);
  const [supporting, setSupporting] = useState<SupportingDataResponse | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    simanrisApi
      .getMasterOptions()
      .then((res) => {
        setOptions(res);
        // Set default base & target jika tersedia minimal 2 periode terurut
        if (res.periods.length >= 2) {
          const sortedAsc = [...res.periods].sort(
            (a, b) => a.year - b.year || a.semester - b.semester
          );
          setBasePeriodId(sortedAsc[0].id);
          setTargetPeriodId(sortedAsc[sortedAsc.length - 1].id);
        } else if (res.periods.length === 1) {
          setTargetPeriodId(res.periods[0].id);
        }
      })
      .catch(() => {
        // Error ditangani di fetchAnalytics
      });
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [comp, mov, sup] = await Promise.all([
        simanrisApi.getSemesterComparison({
          base_period_id: basePeriodId,
          target_period_id: targetPeriodId,
          function_id: functionId,
          risk_category_id: categoryId,
        }),
        simanrisApi.getRiskMovement({
          base_period_id: basePeriodId,
          target_period_id: targetPeriodId,
        }),
        simanrisApi.getSupportingData({
          period_id: targetPeriodId || basePeriodId,
        }),
      ]);
      setComparison(comp);
      setMovement(mov);
      setSupporting(sup);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [basePeriodId, targetPeriodId, functionId, categoryId]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const movementEntries =
    movement?.movements ?? movement?.suggested_matches ?? [];

  const renderDeltaBadge = (delta: number | undefined, inverseGood = true) => {
    if (delta === undefined) return null;
    if (delta === 0) {
      return (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          Tetap (0)
        </span>
      );
    }
    const isPositive = delta > 0;
    const isGood = inverseGood ? !isPositive : isPositive;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
          isGood ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? `+${delta}` : delta}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005baa]">
              <GitCompareArrows className="h-4 w-4" /> Analisis Lintas Semester &amp; Dokumen Pendukung
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">
              Perbandingan Antarsemester &amp; Pergerakan Risiko
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void fetchAnalytics()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Perbarui Analisis
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Semester Pembanding (Base)
            </label>
            <select
              value={basePeriodId}
              onChange={(e) =>
                setBasePeriodId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
            >
              <option value="">Otomatis Terlama</option>
              {options?.periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.period_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Semester Target (Terbaru)
            </label>
            <select
              value={targetPeriodId}
              onChange={(e) =>
                setTargetPeriodId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
            >
              <option value="">Otomatis Terbaru</option>
              {options?.periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.period_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter Fungsi
            </label>
            <select
              value={functionId}
              onChange={(e) =>
                setFunctionId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
            >
              <option value="">Semua Fungsi</option>
              {options?.functions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
            >
              <option value="">Semua Kategori</option>
              {options?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {[
            { key: "comparison", label: "Perbandingan Agregat Semester" },
            {
              key: "movement",
              label: `Pergerakan & Pergeseran Kode (${movementEntries.length})`,
            },
            {
              key: "supporting",
              label: "Data Pendukung (RTP, Pengendalian, Reviu, Peluang)",
            },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() =>
                setActiveTab(t.key as "comparison" | "movement" | "supporting")
              }
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === t.key
                  ? "bg-[#004281] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading && !comparison ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ChartLoadingState heightClass="h-72" label="Menghitung perbandingan semester..." />
        </div>
      ) : (
        <>
          {activeTab === "comparison" && comparison && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-[#004281] flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{comparison.notice}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Total Baris Risiko
                    </span>
                    {renderDeltaBadge(comparison.deltas?.total_records, false)}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <div>
                      <div className="text-slate-400">
                        {comparison.base.period?.period_name || "Base"}
                      </div>
                      <div className="text-xl font-extrabold text-slate-700">
                        {comparison.base.total_records}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <div className="text-right">
                      <div className="text-slate-400">
                        {comparison.target.period?.period_name || "Target"}
                      </div>
                      <div className="text-xl font-extrabold text-[#004281]">
                        {comparison.target.total_records}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Risiko Tinggi Inheren
                    </span>
                    {renderDeltaBadge(comparison.deltas?.inherent_high, true)}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <div>
                      <div className="text-slate-400">
                        {comparison.base.period?.period_name || "Base"}
                      </div>
                      <div className="text-xl font-extrabold text-slate-700">
                        {comparison.base.inherent_high}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <div className="text-right">
                      <div className="text-slate-400">
                        {comparison.target.period?.period_name || "Target"}
                      </div>
                      <div className="text-xl font-extrabold text-orange-600">
                        {comparison.target.inherent_high}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Risiko Tinggi Residual
                    </span>
                    {renderDeltaBadge(comparison.deltas?.residual_high, true)}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <div>
                      <div className="text-slate-400">
                        {comparison.base.period?.period_name || "Base"}
                      </div>
                      <div className="text-xl font-extrabold text-slate-700">
                        {comparison.base.residual_high}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <div className="text-right">
                      <div className="text-slate-400">
                        {comparison.target.period?.period_name || "Target"}
                      </div>
                      <div className="text-xl font-extrabold text-red-600">
                        {comparison.target.residual_high}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <SemesterComparisonChart
                  title="Perbandingan Risiko per Kategori"
                  subtitle="Jumlah baris register tiap kategori di dua semester aktif."
                  baseLabel={comparison.base.period?.period_name || "Semester Base"}
                  targetLabel={
                    comparison.target.period?.period_name || "Semester Target"
                  }
                  data={comparison.category_comparison.map((c) => ({
                    label: c.category,
                    base_count: c.base_count,
                    target_count: c.target_count,
                    delta: c.delta,
                  }))}
                />

                <SemesterComparisonChart
                  title="Perbandingan Risiko per Fungsi / Unit"
                  subtitle="Distribusi jumlah risiko tiap fungsi pada semester pembanding dan target."
                  baseLabel={comparison.base.period?.period_name || "Semester Base"}
                  targetLabel={
                    comparison.target.period?.period_name || "Semester Target"
                  }
                  data={comparison.function_comparison.map((f) => ({
                    label: f.function,
                    base_count: f.base_count,
                    target_count: f.target_count,
                    delta: f.delta,
                  }))}
                />
              </div>
            </div>
          )}

          {activeTab === "movement" && movement && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-[#004281]">
                {movement.notice} (Tautan terverifikasi manual:{" "}
                <b>{movement.verified_count}</b> · Kandidat pergeseran kode:{" "}
                <b>{movement.code_shift_candidates.length}</b>)
              </div>

              {movementEntries.length === 0 ? (
                <ChartEmptyState
                  heightClass="h-56"
                  title="Belum ada pergerakan risiko atau dua semester aktif belum lengkap"
                  description="Publikasikan minimal dua dataset semester yang berbeda untuk menganalisis pergerakan skor maupun pergeseran kode."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5">Kode Lama → Baru</th>
                        <th className="px-3 py-2.5">Peristiwa Risiko</th>
                        <th className="px-3 py-2.5">Fungsi</th>
                        <th className="px-3 py-2.5 text-center">Residual Base → Target</th>
                        <th className="px-3 py-2.5 text-center">Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movementEntries.map((m, idx) => (
                        <tr key={`${m.from_code}-${m.to_code}-${idx}`} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold">
                            <span className="text-slate-600">{m.from_code || "-"}</span>{" "}
                            →{" "}
                            <span className="text-[#004281]">{m.to_code || "-"}</span>
                            {m.code_changed && (
                              <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-amber-800">
                                Geser Kode
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-800 max-w-md">
                            {m.risk_event || "-"}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                            {m.function_name || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                            {m.from_residual ?? "-"} → {m.to_residual ?? "-"}
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {renderDeltaBadge(m.residual_delta, true)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "supporting" && supporting && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "rtp", label: `RTP (${supporting.rtp.length})` },
                  {
                    key: "control_testings",
                    label: `Aktivitas Pengendalian (${supporting.control_testings.length})`,
                  },
                  { key: "reviews", label: `Reviu (${supporting.reviews.length})` },
                  {
                    key: "positive_risks",
                    label: `Risiko Positif (${supporting.positive_risks.length})`,
                  },
                  { key: "contexts", label: `Konteks (${supporting.contexts.length})` },
                ].map((sub) => (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() =>
                      setSupportingSubTab(
                        sub.key as
                          | "rtp"
                          | "control_testings"
                          | "reviews"
                          | "positive_risks"
                          | "contexts"
                      )
                    }
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                      supportingSubTab === sub.key
                        ? "bg-[#005baa] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                {supportingSubTab === "rtp" && (
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Kode</th>
                        <th className="px-3 py-2">Rencana Tindak Pengendalian</th>
                        <th className="px-3 py-2">PIC &amp; Target</th>
                        <th className="px-3 py-2">Sumber Sheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supporting.rtp.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            Belum ada data RTP pada periode target ini.
                          </td>
                        </tr>
                      ) : (
                        supporting.rtp.map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2.5 font-mono font-bold text-[#004281] whitespace-nowrap">
                              {r.risk_code || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800">
                              {r.treatment_plan || r.action_plan || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                              {r.pic || "-"} · {r.target_timeline || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                              {r.source_sheet} · B{r.source_row}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {supportingSubTab === "control_testings" && (
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Kode</th>
                        <th className="px-3 py-2">Pengendalian</th>
                        <th className="px-3 py-2">Hasil Pengujian</th>
                        <th className="px-3 py-2">Sumber Sheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supporting.control_testings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            Belum ada data pengujian pengendalian.
                          </td>
                        </tr>
                      ) : (
                        supporting.control_testings.map((ct) => (
                          <tr key={ct.id}>
                            <td className="px-3 py-2.5 font-mono font-bold text-[#004281] whitespace-nowrap">
                              {ct.risk_code || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800">
                              {ct.control_name || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {ct.testing_result || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                              {ct.source_sheet} · B{ct.source_row}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {supportingSubTab === "reviews" && (
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Kode</th>
                        <th className="px-3 py-2">Hasil Reviu</th>
                        <th className="px-3 py-2">Pereviu / Tanggal</th>
                        <th className="px-3 py-2">Sumber Sheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supporting.reviews.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            Belum ada data reviu manajemen.
                          </td>
                        </tr>
                      ) : (
                        supporting.reviews.map((rv) => (
                          <tr key={rv.id}>
                            <td className="px-3 py-2.5 font-mono font-bold text-[#004281] whitespace-nowrap">
                              {rv.risk_code || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800">
                              {rv.review_result || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                              {rv.reviewer || "-"} · {rv.review_date || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                              {rv.source_sheet} · B{rv.source_row}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {supportingSubTab === "positive_risks" && (
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Kode</th>
                        <th className="px-3 py-2">Peluang / Risiko Positif</th>
                        <th className="px-3 py-2">Dampak Positif</th>
                        <th className="px-3 py-2">Sumber Sheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supporting.positive_risks.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            Belum ada data risiko positif.
                          </td>
                        </tr>
                      ) : (
                        supporting.positive_risks.map((pr) => (
                          <tr key={pr.id}>
                            <td className="px-3 py-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {pr.risk_code || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800">
                              {pr.opportunity_event || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {pr.impact_desc || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                              {pr.source_sheet} · B{pr.source_row}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {supportingSubTab === "contexts" && (
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Tipe / Judul</th>
                        <th className="px-3 py-2">Uraian Konteks</th>
                        <th className="px-3 py-2">Sumber Sheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supporting.contexts.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                            Belum ada data konteks / piagam.
                          </td>
                        </tr>
                      ) : (
                        supporting.contexts.map((cx) => (
                          <tr key={cx.id}>
                            <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                              {cx.title || cx.context_type || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {cx.description || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                              {cx.source_sheet} · B{cx.source_row}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
