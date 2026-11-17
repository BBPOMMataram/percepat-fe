"use client";

import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";

interface ChartEmptyStateProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  heightClass?: string;
}

export function ChartEmptyState({
  title = "Belum ada data untuk ditampilkan",
  description = "Unggah dan publikasikan workbook Excel manajemen risiko atau ubah filter aktif.",
  actionHref,
  actionLabel,
  heightClass = "h-60",
}: ChartEmptyStateProps) {
  return (
    <div
      className={`${heightClass} w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-6 flex flex-col items-center justify-center text-center`}
    >
      <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <FileSpreadsheet className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-3 inline-flex items-center rounded-lg bg-[#005baa] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#004281] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
