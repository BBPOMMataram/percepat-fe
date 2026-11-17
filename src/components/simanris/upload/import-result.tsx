"use client";

import Link from "next/link";
import { CheckCircle2, LayoutDashboard, ShieldAlert, FileUp, History } from "lucide-react";
import type { ImportBatchItem } from "../types";

interface ImportResultProps {
  batch: ImportBatchItem;
  onReset: () => void;
}

export function ImportResult({ batch, onReset }: ImportResultProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            Publikasi Berhasil
          </span>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            Batch #{batch.id} ({batch.file_name}) telah masuk ke database resmi
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            {batch.is_active
              ? "Dataset ini langsung ditetapkan sebagai dataset aktif untuk periode terkait dan ditampilkan di dashboard."
              : "Dataset tersimpan sebagai snapshot terpublikasi tanpa mengubah dataset aktif saat ini."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-slate-500">Total Baris</div>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {batch.total_rows}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-emerald-700">Valid</div>
          <div className="mt-1 text-lg font-extrabold text-emerald-800">
            {batch.valid_rows}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-amber-700">Warning</div>
          <div className="mt-1 text-lg font-extrabold text-amber-800">
            {batch.warning_rows}
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="text-red-700">Error</div>
          <div className="mt-1 text-lg font-extrabold text-red-800">
            {batch.error_rows}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        <Link
          href="/simanris"
          className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#004281]"
        >
          <LayoutDashboard className="h-4 w-4" />
          Buka Dashboard Eksekutif
        </Link>
        <Link
          href="/simanris/data-risiko"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ShieldAlert className="h-4 w-4" />
          Jelajahi Data Risiko
        </Link>
        <Link
          href="/simanris/import-history"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <History className="h-4 w-4" />
          Riwayat Import
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#005baa] hover:bg-blue-100"
        >
          <FileUp className="h-4 w-4" />
          Upload Workbook Lainnya
        </button>
      </div>
    </div>
  );
}
