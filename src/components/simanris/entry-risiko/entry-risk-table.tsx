"use client";

import React, { useState } from "react";
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  FileSpreadsheet,
  Send,
  CheckCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import type { RiskCategoryItem, RiskFunctionItem, RiskRecordEntry } from "../types";
import { getRiskLevelBadge } from "./dynamic-field-renderer";
import { RiskDetailModal } from "../shared/RiskDetailModal";

interface EntryRiskTableProps {
  records: RiskRecordEntry[];
  functions: RiskFunctionItem[];
  categories: RiskCategoryItem[];
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onEdit: (record: RiskRecordEntry) => void;
  onSubmitRecord: (id: number) => void;
  onPublishRecord: (id: number) => void;
  onArchiveRecord: (id: number) => void;
  onDeleteRecord: (id: number) => void;
  onExportExcel: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  functionFilter: string;
  onFunctionFilterChange: (funcId: string) => void;
  loading?: boolean;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return { label: "Draf", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    case "submitted":
      return { label: "Diajukan", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    case "published":
      return { label: "Terpublikasi", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "archived":
      return { label: "Diarsipkan", bg: "bg-slate-100 text-slate-600 border-slate-200" };
    default:
      return { label: status, bg: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

export default function EntryRiskTable({
  records,
  functions,
  categories,
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  onEdit,
  onSubmitRecord,
  onPublishRecord,
  onArchiveRecord,
  onDeleteRecord,
  onExportExcel,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  functionFilter,
  onFunctionFilterChange,
  loading = false,
}: EntryRiskTableProps) {
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Filters & Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-56 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari kode risiko, peristiwa, sasaran..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#004281] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#004281] focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draf</option>
              <option value="submitted">Diajukan</option>
              <option value="published">Terpublikasi</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>

          {/* Function Filter */}
          <select
            value={functionFilter}
            onChange={(e) => onFunctionFilterChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#004281] focus:bg-white focus:outline-none max-w-44"
          >
            <option value="">Semua Fungsi</option>
            {functions.map((fn) => (
              <option key={fn.id} value={fn.id}>
                {fn.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export Excel Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Download Excel sesuai struktur template resmi"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">Kode Risiko</th>
                <th className="py-3 px-4 w-32">Kategori</th>
                <th className="py-3 px-4 min-w-64">Uraian Peristiwa (Risk Event)</th>
                <th className="py-3 px-4 w-36">Unit Kerja</th>
                <th className="py-3 px-4 w-24 text-center">Inheren</th>
                <th className="py-3 px-4 w-24 text-center">Residual</th>
                <th className="py-3 px-4 w-24 text-center">Sumber</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Memuat data risiko...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada rekaman risiko yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const statusBadge = getStatusBadge(r.status);
                  const inhBadge = getRiskLevelBadge(r.inherent_level);
                  const resBadge = getRiskLevelBadge(r.residual_level);
                  const isWebEntry = r.entry_mode === "web_entry";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {(currentPage - 1) * perPage + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#004281]">
                        {r.risk_code || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.risk_category?.name || r.raw_category_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        <p className="line-clamp-2 leading-relaxed" title={r.risk_event || ""}>
                          {r.risk_event || "—"}
                        </p>
                        {r.objective && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={r.objective}>
                            Sasaran: {r.objective}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {r.risk_function?.name || r.raw_unit_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold border ${inhBadge.bg}`}>
                          {r.inherent_level ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold border ${resBadge.bg}`}>
                          {r.residual_level ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isWebEntry ? "bg-purple-50 text-purple-700" : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {isWebEntry ? "Form Web" : "Import Excel"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadge.bg}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Lihat Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedRiskId(r.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Risiko"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Workflow buttons */}
                          {r.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => onSubmitRecord(r.id)}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Ajukan untuk Reviu"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}

                          {r.status !== "published" && (
                            <button
                              type="button"
                              onClick={() => onPublishRecord(r.id)}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Publikasikan ke Dashboard"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {r.status === "published" && (
                            <button
                              type="button"
                              onClick={() => onArchiveRecord(r.id)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                              title="Arsipkan Risiko"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}

                          {r.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(r.id)}
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                              title="Hapus Draf"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs text-slate-600">
          <div>
            Menampilkan <strong className="text-slate-800">{records.length}</strong> dari{" "}
            <strong className="text-slate-800">{total}</strong> total risiko
          </div>

          <div className="flex items-center gap-1.5 self-center">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              <span>Sebelumnya</span>
            </button>
            <span className="px-2 text-xs font-semibold text-slate-700">
              {currentPage} / {Math.max(1, lastPage)}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= lastPage || loading}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail Risiko */}
      {selectedRiskId !== null && (
        <RiskDetailModal
          riskId={selectedRiskId}
          onClose={() => setSelectedRiskId(null)}
        />
      )}
    </div>
  );
}
