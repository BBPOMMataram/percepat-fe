"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  Rocket,
  Trash2,
} from "lucide-react";
import { extractApiErrorMessage, simanrisApi } from "../lib/simanrisApi";
import type { ImportBatchItem, ImportPreviewData } from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";

interface ImportPreviewProps {
  batchId: number;
  onPublished: (batch: ImportBatchItem) => void;
  onCancelled: () => void;
}

const ROW_TABS = [
  { key: "risk_register", label: "Register Risiko Utama" },
  { key: "function_register", label: "Sheet Fungsi" },
  { key: "rtp", label: "RTP" },
  { key: "control_testing", label: "Pengendalian" },
  { key: "review", label: "Reviu" },
  { key: "positive_risk", label: "Risiko Positif" },
  { key: "context", label: "Konteks / Piagam" },
];

export function ImportPreview({
  batchId,
  onPublished,
  onCancelled,
}: ImportPreviewProps) {
  const [rowType, setRowType] = useState("risk_register");
  const [validationStatus, setValidationStatus] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [page, setPage] = useState(1);

  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activateDataset, setActivateDataset] = useState(true);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await simanrisApi.getImportPreview(batchId, {
        row_type: rowType,
        validation_status: validationStatus || undefined,
        severity: severityFilter || undefined,
        per_page: 20,
        page,
      });
      setPreview(res);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [batchId, rowType, validationStatus, severityFilter, page]);

  useEffect(() => {
    void fetchPreview();
  }, [fetchPreview]);

  const handleRevalidate = async () => {
    setBusyAction("validate");
    setError(null);
    try {
      await simanrisApi.revalidateImport(batchId);
      await fetchPreview();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePublish = async () => {
    setBusyAction("publish");
    setError(null);
    try {
      const published = await simanrisApi.publishImport(batchId, activateDataset);
      onPublished(published);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancel = async () => {
    setBusyAction("cancel");
    setError(null);
    try {
      await simanrisApi.cancelImport(batchId);
      onCancelled();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  if (loading && !preview) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <ChartLoadingState heightClass="h-80" label="Memuat preview hasil parsing Excel..." />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-xs text-red-700">
        {error || "Preview batch tidak ditemukan."}
      </div>
    );
  }

  const { batch, row_type_counts: counts, staging_rows: staging, issues } = preview;
  const isPublished = batch.status === "published";
  const isCancelled = batch.status === "cancelled";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold text-white">
                Batch #{batch.id}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#005baa]">
                {batch.period?.period_name || `Periode #${batch.period_id}`}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-slate-700">
                Status: {batch.status}
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-900">
              Preview &amp; Validasi Staging — {batch.file_name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isPublished && !isCancelled && (
              <>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => void handleRevalidate()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${busyAction === "validate" ? "animate-spin" : ""}`}
                  />
                  Validasi Ulang
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => void handleCancel()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Batalkan Batch
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-slate-500">Total Baris Terdeteksi</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">
              {batch.total_rows}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-emerald-700">Valid</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-800">
              {batch.valid_rows}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="text-amber-700">Warning (Tetap Disimpan)</div>
            <div className="mt-1 text-xl font-extrabold text-amber-800">
              {batch.warning_rows}
            </div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="text-red-700">Error</div>
            <div className="mt-1 text-xl font-extrabold text-red-800">
              {batch.error_rows}
            </div>
          </div>
        </div>

        {!isPublished && !isCancelled && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={activateDataset}
                onChange={(e) => setActivateDataset(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#005baa]"
              />
              Jadikan dataset aktif untuk periode ini setelah dipublikasikan
            </label>

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => void handlePublish()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#04a451] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" />
              {busyAction === "publish"
                ? "Mempublikasikan..."
                : "Publikasikan ke Database"}
            </button>
          </div>
        )}
      </div>

      {/* Tab Staging Rows */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {ROW_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setPage(1);
                  setRowType(t.key);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  rowType === t.key
                    ? "bg-[#004281] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label} ({counts[t.key] ?? 0})
              </button>
            ))}
          </div>

          <select
            value={validationStatus}
            onChange={(e) => {
              setPage(1);
              setValidationStatus(e.target.value);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="">Semua Status Baris</option>
            <option value="valid">Valid</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Sheet &amp; Baris</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Ringkasan Data Ternormalisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staging.data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    Tidak ada baris pada kategori &amp; filter ini.
                  </td>
                </tr>
              ) : (
                staging.data.map((row) => {
                  const norm = row.normalized_data || {};
                  const summaryText =
                    String(
                      norm.risk_event ||
                        norm.treatment_plan ||
                        norm.opportunity_event ||
                        norm.control_name ||
                        norm.review_result ||
                        norm.title ||
                        "-"
                    );
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                        {row.source_sheet} · B{row.source_row}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {row.validation_status === "valid" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : row.validation_status === "warning" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <AlertTriangle className="h-3 w-3" /> Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                            <AlertCircle className="h-3 w-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-[#004281]">
                        {row.risk_code || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-800 max-w-xl">
                        <p className="line-clamp-2">{summaryText}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {staging.last_page > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Menampilkan {staging.from ?? 0}–{staging.to ?? 0} dari {staging.total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={staging.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="font-semibold text-slate-700">
                {staging.current_page} / {staging.last_page}
              </span>
              <button
                type="button"
                disabled={staging.current_page >= staging.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Daftar Issues Validasi & Rekonsiliasi */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Catatan Validasi &amp; Rekonsiliasi ({issues.length})
            </h4>
            <p className="text-xs text-slate-500">
              Temuan anomali matriks, kode kosong/ganda, maupun selisih Kompilasi vs Sheet Fungsi.
            </p>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="">Semua Severity</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        {issues.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Tidak ada temuan validasi pada filter ini.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs">
            {issues.map((issue) => (
              <div key={issue.id} className="p-3 flex items-start gap-2.5 hover:bg-slate-50">
                {issue.severity === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                ) : issue.severity === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800">
                    [{issue.sheet_name || "-"}
                    {issue.row_number ? ` · Baris ${issue.row_number}` : ""}]{" "}
                    <span className="font-mono text-[11px] text-slate-500">
                      ({issue.issue_code})
                    </span>
                  </div>
                  <p className="mt-0.5 text-slate-600">{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
