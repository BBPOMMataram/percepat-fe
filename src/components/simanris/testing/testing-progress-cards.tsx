"use client";

import type { TestingSummaryData } from "../types";
import { ShieldCheck, CheckCircle2, Clock, CircleAlert, TrendingUp } from "lucide-react";

interface TestingProgressCardsProps {
  summary: TestingSummaryData;
  loading?: boolean;
}

export function TestingProgressCards({ summary, loading = false }: TestingProgressCardsProps) {
  const { total_eligible, not_started, draft, completed, completion_percentage } = summary;

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Eligible */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Wajib Diuji (Inheren ≥ 16)
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : total_eligible}
            </h3>
            <p className="mt-1 text-[12px] text-slate-500">Aktivitas Pengendalian</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-2.5 text-[#005baa]">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Belum Diisi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Belum Diisi
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-700 tracking-tight">
              {loading ? "..." : not_started}
            </h3>
            <p className="mt-1 text-[12px] text-slate-500">Belum ada pengujian</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
            <CircleAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Draft */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 shadow-xs transition-all hover:shadow-md flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Draft Pengujian
            </p>
            <h3 className="mt-2 text-2xl font-black text-amber-900 tracking-tight">
              {loading ? "..." : draft}
            </h3>
            <p className="mt-1 text-[12px] text-amber-700/80">Sedang dalam proses</p>
          </div>
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Selesai */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-xs transition-all hover:shadow-md flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Pengujian Selesai
            </p>
            <h3 className="mt-2 text-2xl font-black text-emerald-900 tracking-tight">
              {loading ? "..." : completed}
            </h3>
            <p className="mt-1 text-[12px] text-emerald-700/80">Telah lengkap & terverifikasi</p>
          </div>
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Progress Bar Strip */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#005baa]" />
            <span className="font-bold text-slate-800">Progres Pengujian Aktivitas Pengendalian</span>
            <span className="text-slate-500">
              ({completed} dari {total_eligible} selesai)
            </span>
          </div>
          <span className="font-extrabold text-sm text-[#004281]">
            {loading ? "..." : `${completion_percentage.toFixed(1)}%`}
          </span>
        </div>
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#005baa] to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, completion_percentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
