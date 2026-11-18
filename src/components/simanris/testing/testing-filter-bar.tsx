"use client";

import type { PeriodItem, RiskFunctionItem } from "../types";
import { Search, RefreshCw, Filter, FileSpreadsheet, Loader2 } from "lucide-react";

interface TestingFilterBarProps {
  periods: PeriodItem[];
  functions: RiskFunctionItem[];
  selectedPeriodId: number | "";
  selectedFunctionId: number | "";
  searchQuery: string;
  selectedStatus: string;
  loading?: boolean;
  exporting?: boolean;
  onPeriodChange: (periodId: number) => void;
  onFunctionChange: (funcId: number | "") => void;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onExport?: () => void;
}

export function TestingFilterBar({
  periods,
  functions,
  selectedPeriodId,
  selectedFunctionId,
  searchQuery,
  selectedStatus,
  loading = false,
  exporting = false,
  onPeriodChange,
  onFunctionChange,
  onSearchChange,
  onStatusChange,
  onRefresh,
  onExport,
}: TestingFilterBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
      {/* Top Filter Row: Period, Function, Search, Refresh & Export */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Periode Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Tahun & Semester
          </label>
          <select
            value={selectedPeriodId}
            onChange={(e) => onPeriodChange(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.period_name || `${p.year} — Semester ${p.semester === 1 ? "I" : "II"}`}
                {p.active_import_batch_id ? " (Aktif)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Fungsi Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Unit Kerja / Fungsi
          </label>
          <select
            value={selectedFunctionId}
            onChange={(e) => onFunctionChange(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none"
          >
            <option value="">Semua Fungsi</option>
            {functions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input & Action Buttons */}
        <div className="lg:col-span-2 flex items-end gap-2">
          <div className="relative flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Cari Kode, Uraian, atau Aktivitas
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Contoh: R-01, pengaduan, edukasi..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-[#005baa] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2 text-slate-600 transition-colors shrink-0"
            title="Segarkan data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#005baa]" : ""}`} />
          </button>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={loading || exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors shrink-0 disabled:opacity-50"
              title="Unduh seluruh data kertas kerja pengujian ke format Excel (.xlsx)"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-white" />
              )}
              <span className="hidden sm:inline">Unduh Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 inline-flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Status:
          </span>
          {[
            { key: "all", label: "Semua Status" },
            { key: "not_started", label: "Belum Diisi" },
            { key: "draft", label: "Draft" },
            { key: "completed", label: "Selesai" },
          ].map((tab) => {
            const active = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStatusChange(tab.key)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                  active
                    ? "bg-[#004281] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400">
          Kriteria kelayakan: Level Risiko Inheren ≥ 16
        </p>
      </div>
    </div>
  );
}
