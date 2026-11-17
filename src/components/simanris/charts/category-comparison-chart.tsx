"use client";

import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import type { DashboardCategoryDistributionData } from "../types";
import {
  buildChartExportFilename,
  exportChartToPng,
} from "../lib/exportChartToPng";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface CategoryComparisonChartProps {
  data: DashboardCategoryDistributionData | null;
  loading?: boolean;
}

export function CategoryComparisonChart({
  data,
  loading,
}: CategoryComparisonChartProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const year = data?.year ?? 2026;
  const items = data?.items ?? [];

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportChartToPng({
        element: cardRef.current,
        fileName: buildChartExportFilename("jumlah-kategori-risiko", year),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-[#005baa]">
              3
            </span>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase">
              Jumlah Kategori Risiko
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Perbandingan kategori risiko Semester I {year} ({data?.sem1_total ?? 0}) vs Semester II{" "}
            {year} ({data?.sem2_total ?? 0})
          </p>
        </div>

        <button
          type="button"
          data-export-ignore="true"
          disabled={exporting || loading || items.length === 0}
          onClick={() => void handleExportPng()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#005baa] hover:border-blue-200 disabled:opacity-50 transition-colors"
          title="Unduh Grafik Jumlah Kategori Risiko sebagai PNG"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Mengekspor..." : "Unduh PNG"}
        </button>
      </div>

      {loading ? (
        <ChartLoadingState
          heightClass="h-80"
          label="Memuat grafik perbandingan kategori risiko..."
        />
      ) : items.length === 0 ? (
        <ChartEmptyState
          heightClass="h-80"
          title="Data kategori risiko belum tersedia"
          description="Pastikan dataset Semester I atau Semester II telah dipublikasikan."
        />
      ) : (
        <>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={items}
                margin={{ top: 24, right: 16, left: 4, bottom: 32 }}
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#334155" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.18)]}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: "12px", fontWeight: 600 }}
                />
                <Bar
                  name={`Semester I ${year}`}
                  dataKey="sem1_total"
                  fill="#005baa"
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="sem1_total"
                    position="top"
                    style={{
                      fill: "#004281",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                </Bar>
                <Bar
                  name={`Semester II ${year}`}
                  dataKey="sem2_total"
                  fill="#04a451"
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="sem2_total"
                    position="top"
                    style={{
                      fill: "#065f46",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ringkasan tabel mini perbandingan per kategori */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {items.map((cat) => (
              <div
                key={cat.name}
                className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs"
              >
                <div className="font-bold text-slate-800 truncate" title={cat.name}>
                  {cat.name}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    S1: <b className="text-[#005baa]">{cat.sem1_total}</b>
                  </span>
                  <span>
                    S2: <b className="text-[#04a451]">{cat.sem2_total}</b>
                  </span>
                  <span
                    className={`font-bold ${
                      cat.delta > 0
                        ? "text-amber-700"
                        : cat.delta < 0
                          ? "text-emerald-700"
                          : "text-slate-400"
                    }`}
                  >
                    {cat.delta > 0 ? `+${cat.delta}` : cat.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
