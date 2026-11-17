"use client";

import Link from "next/link";
import { FileUp, RefreshCw, CalendarRange, Database } from "lucide-react";
import type { OverviewData } from "../types";

interface DashboardHeaderProps {
  overview: OverviewData | null;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  overview,
  loading,
  onRefresh,
}: DashboardHeaderProps) {
  const periodLabel = overview?.period?.period_name || "Periode Belum Dipilih";
  const fileLabel = overview?.batch?.file_name;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#004281] px-3 py-1 text-[11px] font-semibold text-white">
              <CalendarRange className="h-3.5 w-3.5" />
              {periodLabel}
            </span>
            {fileLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
                <Database className="h-3.5 w-3.5" />
                Dataset Aktif: {fileLabel}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                Belum Ada Dataset Terpublikasi
              </span>
            )}
          </div>

          <h2 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Manajemen Risiko BBPOM di Mataram
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Ringkasan profil risiko inheren, residual, pengendalian, dan kualitas data workbook SAPA APIP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
          <Link
            href="/simanris/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#004281] transition-colors"
          >
            <FileUp className="h-4 w-4" />
            Upload Workbook Excel
          </Link>
        </div>
      </div>
    </div>
  );
}
