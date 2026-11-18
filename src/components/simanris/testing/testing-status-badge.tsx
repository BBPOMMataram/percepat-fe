"use client";

import type { TestingStatus } from "../types";
import { CheckCircle2, Clock, CircleAlert } from "lucide-react";

interface TestingStatusBadgeProps {
  status: TestingStatus;
  size?: "sm" | "md";
}

export function TestingStatusBadge({ status, size = "md" }: TestingStatusBadgeProps) {
  const isSm = size === "sm";
  const baseClasses = `inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors ${
    isSm ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
  }`;

  switch (status) {
    case "completed":
      return (
        <span
          className={`${baseClasses} bg-emerald-50 text-emerald-800 border-emerald-200`}
          title="Pengujian telah selesai divalidasi dan disimpan"
        >
          <CheckCircle2 className={isSm ? "h-3 w-3 text-emerald-600" : "h-3.5 w-3.5 text-emerald-600"} />
          Selesai
        </span>
      );
    case "draft":
      return (
        <span
          className={`${baseClasses} bg-amber-50 text-amber-800 border-amber-200`}
          title="Tersimpan sebagai draft sementara"
        >
          <Clock className={isSm ? "h-3 w-3 text-amber-600" : "h-3.5 w-3.5 text-amber-600"} />
          Draft
        </span>
      );
    case "not_started":
    default:
      return (
        <span
          className={`${baseClasses} bg-slate-100 text-slate-600 border-slate-200`}
          title="Aktivitas pengendalian belum diuji"
        >
          <CircleAlert className={isSm ? "h-3 w-3 text-slate-400" : "h-3.5 w-3.5 text-slate-400"} />
          Belum Diisi
        </span>
      );
  }
}
