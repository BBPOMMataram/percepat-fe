"use client";

import Link from "next/link";
import {
  CalendarRange,
  Database,
  Download,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { simanrisApi } from "../lib/simanrisApi";
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
  const batchId = overview?.batch?.id;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 sm:px-5 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#004281] px-3 py-1 text-xs font-semibold text-white">
            <CalendarRange className="h-3.5 w-3.5" />
            {periodLabel}
          </span>

          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Belum Ada Dataset Terpublikasi
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {batchId && fileLabel && (
            <button
              type="button"
              onClick={() =>
                void simanrisApi.downloadImportExcel(batchId, fileLabel)
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh Excel Aktif
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Muat Ulang
          </button>

          <Link
            href="/simanris/data-excel"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#004281] transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Kelola Data Excel
          </Link>
        </div>
      </div>
    </div>
  );
}
