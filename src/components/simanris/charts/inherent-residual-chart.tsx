"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { InherentVsResidualItem } from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface InherentResidualChartProps {
  data: InherentVsResidualItem[];
  loading: boolean;
}

export function InherentResidualChart({
  data,
  loading,
}: InherentResidualChartProps) {
  if (loading && data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-64" label="Memuat perbandingan inheren & residual..." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900">
          Profil Risiko Inheren vs Residual per Level
        </h3>
        <p className="text-xs text-slate-500">
          Pergeseran distribusi frekuensi level sebelum dan sesudah pengendalian internal.
        </p>
      </div>

      {data.length === 0 ? (
        <ChartEmptyState
          heightClass="h-64"
          title="Belum ada data inheren & residual"
        />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="level" tick={{ fontSize: 11, fill: "#334155" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                labelFormatter={(lbl) => `Skor Level ${lbl}`}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="inherent_count"
                name="Inheren"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="residual_count"
                name="Residual"
                fill="#005baa"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
