"use client";

export function getRiskLevelStyle(
  level: number | null | undefined,
  highMin = 16
): { label: string; badgeClass: string; cellBg: string; dotColor: string } {
  if (level === null || level === undefined) {
    return {
      label: "N/A",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
      cellBg: "bg-slate-100 text-slate-500",
      dotColor: "#94a3b8",
    };
  }
  // Level 20–25: Sangat Tinggi / Ekstrem (Merah Tua)
  if (level >= 20) {
    return {
      label: `Sangat Tinggi (${level})`,
      badgeClass: "bg-red-800 text-white border-red-900 shadow-2xs",
      cellBg: "bg-red-800 text-white",
      dotColor: "#991b1b",
    };
  }
  // Level 18–19: Tinggi Prioritas Utama (Merah Matriks)
  if (level >= 18) {
    return {
      label: `Tinggi (${level})`,
      badgeClass: "bg-red-600 text-white border-red-700 shadow-2xs",
      cellBg: "bg-red-600 text-white",
      dotColor: "#dc2626",
    };
  }
  // Level 16–17: Tinggi (Oranye Matriks)
  if (level >= highMin) {
    return {
      label: `Tinggi (${level})`,
      badgeClass: "bg-orange-500 text-white border-orange-600 shadow-2xs",
      cellBg: "bg-orange-500 text-white",
      dotColor: "#f97316",
    };
  }
  // Level 10–15: Sedang (Kuning / Amber Matriks)
  if (level >= 10) {
    return {
      label: `Sedang (${level})`,
      badgeClass: "bg-amber-400 text-slate-950 border-amber-500 shadow-2xs",
      cellBg: "bg-amber-400 text-slate-950",
      dotColor: "#fbbf24",
    };
  }
  // Level 5–9: Rendah (Hijau Matriks)
  if (level >= 5) {
    return {
      label: `Rendah (${level})`,
      badgeClass: "bg-emerald-500 text-white border-emerald-600 shadow-2xs",
      cellBg: "bg-emerald-500 text-white",
      dotColor: "#10b981",
    };
  }
  // Level 1–4: Sangat Rendah (Biru Matriks)
  return {
    label: `Sangat Rendah (${level})`,
    badgeClass: "bg-sky-500 text-white border-sky-600 shadow-2xs",
    cellBg: "bg-sky-500 text-white",
    dotColor: "#0ea5e9",
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
      className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-extrabold tracking-tight whitespace-nowrap ${style.badgeClass}`}
    >
      {compact && level !== null && level !== undefined ? level : style.label}
    </span>
  );
}
