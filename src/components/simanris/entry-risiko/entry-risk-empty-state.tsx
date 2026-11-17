"use client";

import React from "react";
import { ClipboardList, PlusCircle } from "lucide-react";

interface EntryRiskEmptyStateProps {
  title?: string;
  description?: string;
  onAddClick?: () => void;
  hasFilter?: boolean;
  onResetFilter?: () => void;
}

export default function EntryRiskEmptyState({
  title = "Belum Ada Data Risiko",
  description = "Belum ada rekaman risiko yang diinput untuk periode ini. Mulai tambahkan risiko baru menggunakan formulir dinamis sesuai template.",
  onAddClick,
  hasFilter = false,
  onResetFilter,
}: EntryRiskEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#004281] mb-4">
        <ClipboardList className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center gap-2 rounded-xl bg-[#004281] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#003366] transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Risiko Pertama</span>
          </button>
        )}

        {hasFilter && onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Reset Filter Pencarian
          </button>
        )}
      </div>
    </div>
  );
}
