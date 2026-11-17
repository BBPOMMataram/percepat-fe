"use client";

interface ChartLoadingStateProps {
  heightClass?: string;
  label?: string;
}

export function ChartLoadingState({
  heightClass = "h-64",
  label = "Memuat data SIMANRIS...",
}: ChartLoadingStateProps) {
  return (
    <div
      className={`${heightClass} w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center gap-3 animate-pulse`}
    >
      <div className="h-7 w-7 rounded-full border-2 border-[#005baa] border-t-transparent animate-spin" />
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
