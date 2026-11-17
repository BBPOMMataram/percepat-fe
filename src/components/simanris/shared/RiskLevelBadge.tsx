"use client";

export function getRiskLevelStyle(
  level: number | null | undefined,
  highMin = 16
): { label: string; badgeClass: string; cellBg: string } {
  if (level === null || level === undefined) {
    return {
      label: "N/A",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      cellBg: "bg-slate-100 text-slate-500",
    };
  }
  if (level >= 20) {
    return {
      label: `Sangat Tinggi (${level})`,
      badgeClass: "bg-red-100 text-red-800 border-red-300",
      cellBg: "bg-red-600 text-white",
    };
  }
  if (level >= highMin) {
    return {
      label: `Tinggi (${level})`,
      badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
      cellBg: "bg-orange-500 text-white",
    };
  }
  if (level >= 10) {
    return {
      label: `Sedang (${level})`,
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      cellBg: "bg-amber-300 text-slate-900",
    };
  }
  if (level >= 5) {
    return {
      label: `Rendah (${level})`,
      badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
      cellBg: "bg-sky-200 text-slate-900",
    };
  }
  return {
    label: `Sangat Rendah (${level})`,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cellBg: "bg-emerald-200 text-emerald-950",
  };
}

interface RiskLevelBadgeProps {
  level: number | null | undefined;
  highMin?: number;
  compact?: boolean;
}

export function RiskLevelBadge({
  level,
  highMin = 16,
  compact = false,
}: RiskLevelBadgeProps) {
  const style = getRiskLevelStyle(level, highMin);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style.badgeClass}`}
    >
      {compact && level !== null && level !== undefined ? level : style.label}
    </span>
  );
}
