"use client";

import { useState } from "react";
import { X, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { DataQualityData, ImportIssueItem } from "../types";

interface DataQualityModalProps {
  open: boolean;
  data: DataQualityData | null;
  onClose: () => void;
}

export function DataQualityModal({ open, data, onClose }: DataQualityModalProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [codeFilter, setCodeFilter] = useState<string>("all");

  if (!open || !data) return null;

  const uniqueCodes = Array.from(new Set(data.issues.map((i) => i.issue_code))).sort();

  const filteredIssues = data.issues.filter((issue) => {
    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
    if (codeFilter !== "all" && issue.issue_code !== codeFilter) return false;
    return true;
  });

  const renderSeverityBadge = (severity: ImportIssueItem["severity"]) => {
    if (severity === "error") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
          <AlertCircle className="h-3 w-3" /> Error
        </span>
      );
    }
    if (severity === "warning") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          <AlertTriangle className="h-3 w-3" /> Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
        <Info className="h-3 w-3" /> Info
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#004281] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-blue-200">
              Laporan Kualitas Data & Rekonsiliasi Workbook
            </p>
            <h3 className="text-base font-bold">
              {data.file_name || "Dataset Aktif"} — {data.issues.length} Temuan Tercatat
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-100 hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 flex flex-wrap items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Severity</option>
            <option value="error">Error ({data.summary.total_errors})</option>
            <option value="warning">Warning ({data.summary.total_warnings})</option>
            <option value="info">Info</option>
          </select>

          <select
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Kode Temuan</option>
            {uniqueCodes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs text-slate-500">
            Menampilkan <b>{filteredIssues.length}</b> dari {data.issues.length} issue (maks. 250)
          </span>
        </div>

        <div className="overflow-auto p-6">
          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Tidak ada temuan kualitas data pada filter ini.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Severity</th>
                  <th className="px-3 py-2.5">Sheet & Baris</th>
                  <th className="px-3 py-2.5">Kode Temuan</th>
                  <th className="px-3 py-2.5">Keterangan</th>
                  <th className="px-3 py-2.5">Nilai Asli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {renderSeverityBadge(issue.severity)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">
                      {issue.sheet_name || "-"}
                      {issue.row_number ? ` · Baris ${issue.row_number}` : ""}
                      {issue.column_name ? ` (${issue.column_name})` : ""}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {issue.issue_code}
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">{issue.message}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {issue.raw_value ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
