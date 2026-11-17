"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileUp,
  History,
  RefreshCw,
} from "lucide-react";
import { extractApiErrorMessage, simanrisApi } from "../lib/simanrisApi";
import type {
  ImportBatchItem,
  MasterOptionsData,
  PaginatedData,
} from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

export function ImportHistoryView() {
  const [options, setOptions] = useState<MasterOptionsData | null>(null);
  const [periodId, setPeriodId] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<PaginatedData<ImportBatchItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMaster = useCallback(async () => {
    try {
      const res = await simanrisApi.getMasterOptions();
      setOptions(res);
    } catch {
      // Ditangani saat fetch batch
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await simanrisApi.listImports({
        period_id: periodId,
        status: statusFilter || undefined,
        source_type: sourceTypeFilter || undefined,
        per_page: 15,
        page,
      });
      setData(res);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [periodId, statusFilter, sourceTypeFilter, page]);

  useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const handleActivate = async (batch: ImportBatchItem) => {
    setActivatingId(batch.id);
    setError(null);
    setMessage(null);
    try {
      await simanrisApi.activatePeriodBatch(batch.period_id, batch.id);
      setMessage(
        `Snapshot Batch #${batch.id} (${batch.file_name}) berhasil diaktifkan sebagai dataset utama periode ${batch.period?.period_name || batch.period_id}.`
      );
      await fetchHistory();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setActivatingId(null);
    }
  };

  const rows = data?.data || [];

  const statusPill = (status: ImportBatchItem["status"]) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-800";
      case "staged":
      case "validated":
      case "parsed":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-slate-200 text-slate-600";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005baa]">
            <History className="h-4 w-4" /> Audit &amp; Snapshot Dataset
          </div>
          <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">
            Riwayat Import Workbook Excel
          </h2>
          <p className="text-xs text-slate-500">
            Menyimpan seluruh histori batch unggahan beserta opsi aktivasi ulang snapshot periode sebelumnya.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchHistory()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/simanris/upload"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004281]"
          >
            <FileUp className="h-3.5 w-3.5" />
            Upload Baru
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Filter Periode
          </label>
          <select
            value={periodId}
            onChange={(e) => {
              setPage(1);
              setPeriodId(e.target.value ? Number(e.target.value) : "");
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
          >
            <option value="">Semua Periode</option>
            {options?.periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.period_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Filter Status Batch
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
          >
            <option value="">Semua Status</option>
            <option value="published">Published</option>
            <option value="staged">Staged (Belum Publish)</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Jenis Workbook
          </label>
          <select
            value={sourceTypeFilter}
            onChange={(e) => {
              setPage(1);
              setSourceTypeFilter(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
          >
            <option value="">Semua Sumber</option>
            <option value="master_compilation">Kompilasi Master</option>
            <option value="function_workbook">Workbook Per Fungsi</option>
          </select>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        {loading && !data ? (
          <ChartLoadingState heightClass="h-64" label="Memuat riwayat import..." />
        ) : rows.length === 0 ? (
          <ChartEmptyState
            heightClass="h-60"
            title="Belum ada riwayat unggahan"
            description="Mulai dengan mengunggah file Excel SAPA APIP Semester I atau Semester II."
            actionHref="/simanris/upload"
            actionLabel="Upload Workbook Pertama"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Batch</th>
                    <th className="px-3 py-2.5">Nama File &amp; Pengirim</th>
                    <th className="px-3 py-2.5">Periode</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-center">Ringkasan Baris</th>
                    <th className="px-3 py-2.5">Waktu</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 whitespace-nowrap font-mono font-bold text-slate-700">
                        #{batch.id}
                        {batch.is_active && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-[#04a451] px-2 py-0.5 font-sans text-[10px] font-bold text-white">
                            AKTIF
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">
                          {batch.file_name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {batch.source_type === "master_compilation"
                            ? "Kompilasi Master"
                            : `Fungsi: ${batch.risk_function?.name || "-"}`}
                          {batch.uploaded_by_name
                            ? ` · Oleh ${batch.uploaded_by_name}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700">
                        {batch.period?.period_name || `Periode #${batch.period_id}`}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${statusPill(
                            batch.status
                          )}`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap text-[11px]">
                        <span className="font-bold text-slate-800">
                          {batch.total_rows}
                        </span>{" "}
                        total ·{" "}
                        <span className="text-emerald-700 font-semibold">
                          {batch.valid_rows} valid
                        </span>{" "}
                        ·{" "}
                        <span className="text-amber-700 font-semibold">
                          {batch.warning_rows} warn
                        </span>{" "}
                        ·{" "}
                        <span className="text-red-700 font-semibold">
                          {batch.error_rows} err
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-[11px] text-slate-500">
                        {batch.published_at
                          ? new Date(batch.published_at).toLocaleString("id-ID")
                          : new Date(batch.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap space-x-1.5">
                        <Link
                          href={`/simanris/upload?batch_id=${batch.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-3 w-3" /> Preview
                        </Link>
                        {batch.status === "published" && !batch.is_active && (
                          <button
                            type="button"
                            disabled={activatingId === batch.id}
                            onClick={() => void handleActivate(batch)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#005baa] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#004281] disabled:opacity-50"
                          >
                            {activatingId === batch.id
                              ? "Mengaktifkan..."
                              : "Aktifkan Snapshot"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.last_page > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  Halaman {data.current_page} dari {data.last_page} (Total{" "}
                  {data.total} batch)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={data.current_page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={data.current_page >= data.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
