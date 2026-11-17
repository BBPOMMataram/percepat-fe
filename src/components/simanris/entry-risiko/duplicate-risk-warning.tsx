"use client";

import React from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import type { DuplicateRiskWarning as DuplicateWarningType } from "../types";

interface DuplicateRiskWarningProps {
  warning: DuplicateWarningType;
  onProceed: () => void;
  onDismiss: () => void;
  isSubmitting?: boolean;
}

export default function DuplicateRiskWarning({
  warning,
  onProceed,
  onDismiss,
  isSubmitting = false,
}: DuplicateRiskWarningProps) {
  const { candidate, message, type } = warning;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm animate-in fade-in-50 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-200/80 p-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Peringatan Potensi Duplikasi ({type === "duplicate_risk_code" ? "Kode Risiko Sama" : "Peristiwa Risiko Serupa"})
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">{message}</p>

            {candidate && (
              <div className="mt-2.5 rounded-lg border border-amber-200 bg-white/80 p-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#004281]">{candidate.risk_code}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-600">{candidate.function_name || "Semua Fungsi"}</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-600">
                    {candidate.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-slate-600 italic">
                  &ldquo;{candidate.risk_event}&rdquo;
                </p>
              </div>
            )}

            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onProceed}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer"
              >
                <span>Tetap Simpan Record</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100/50 cursor-pointer"
              >
                Kembali & Periksa Data
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-amber-600 hover:bg-amber-200/50"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
