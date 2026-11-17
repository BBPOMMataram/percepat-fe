"use client";

import type { ComponentType } from "react";

interface RiskStatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "blue" | "red" | "orange" | "green" | "amber" | "slate";
  onClick?: () => void;
}

const TONE_MAP = {
  blue: {
    border: "border-blue-100 hover:border-blue-300",
    iconWrap: "bg-blue-50 text-[#005baa]",
    valueText: "text-[#004281]",
  },
  red: {
    border: "border-red-100 hover:border-red-300",
    iconWrap: "bg-red-50 text-red-600",
    valueText: "text-red-700",
  },
  orange: {
    border: "border-orange-100 hover:border-orange-300",
    iconWrap: "bg-orange-50 text-orange-600",
    valueText: "text-orange-700",
  },
  green: {
    border: "border-emerald-100 hover:border-emerald-300",
    iconWrap: "bg-emerald-50 text-[#04a451]",
    valueText: "text-emerald-700",
  },
  amber: {
    border: "border-amber-100 hover:border-amber-300",
    iconWrap: "bg-amber-50 text-amber-600",
    valueText: "text-amber-700",
  },
  slate: {
    border: "border-slate-200 hover:border-slate-300",
    iconWrap: "bg-slate-100 text-slate-600",
    valueText: "text-slate-900",
  },
};

export function RiskStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "blue",
  onClick,
}: RiskStatCardProps) {
  const styles = TONE_MAP[tone];
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-2xl border bg-white p-4 shadow-xs transition-all ${styles.border} ${
        onClick ? "cursor-pointer hover:shadow-sm" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className={`mt-1.5 text-2xl font-extrabold tracking-tight ${styles.valueText}`}>
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2.5 text-[11px] text-slate-500 leading-snug">{subtitle}</p>
    </Wrapper>
  );
}
