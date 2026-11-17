"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ResidualLevelItem } from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface RiskLevelChartProps {
  data: ResidualLevelItem[];
  highMin?: number;
  loading: boolean;
  onSelectLevel?: (level: string) => void;
}

function barColor(level: number, highMin: number): string {
  if (level >= 20) return "#dc2626";
  if (level >= highMin) return "#f97316";
  if (level >= 10) return "#f59e0b";
  if (level >= 5) return "#0ea5e9";
  return "#10b981";
}

export function RiskLevelChart({
  data,
  highMin = 16,
  loading,
  onSelectLevel,
}: RiskLevelChartProps) {
  if (loading && data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-64" label="Memuat distribusi level residual..." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900">
          Sebaran Skor Level Risiko Residual
        </h3>
        <p className="text-xs text-slate-500">
          Nilai persis dari workbook (tanpa kalkulasi ulang sepihak). Klik batang untuk filter level.
        </p>
      </div>

      {data.length === 0 ? (
        <ChartEmptyState
          heightClass="h-64"
          title="Belum ada data level residual"
        />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="level"
                tick={{ fontSize: 11, fill: "#334155" }}
                label={{ value: "Level Residual", position: "insideBottom", offset: -2, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(val) => [`${val ?? 0} risiko`, "Jumlah"]}
                labelFormatter={(lbl) => `Level Residual ${lbl}`}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="total"
                name="Jumlah Risiko"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(entry) => {
                  const item = entry as unknown as ResidualLevelItem;
                  if (item?.level !== undefined && onSelectLevel) {
                    onSelectLevel(String(item.level));
                  }
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.level}`}
                    fill={barColor(entry.level, highMin)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
