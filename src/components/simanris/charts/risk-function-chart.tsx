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
import type { FunctionDistributionItem } from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface RiskFunctionChartProps {
  data: FunctionDistributionItem[];
  loading: boolean;
  selectedFunctionId?: number | "";
  onSelectFunction?: (functionId: number | null) => void;
}

export function RiskFunctionChart({
  data,
  loading,
  selectedFunctionId,
  onSelectFunction,
}: RiskFunctionChartProps) {
  if (loading && data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-72" label="Memuat distribusi fungsi..." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Distribusi Risiko per Fungsi / Unit
          </h3>
          <p className="text-xs text-slate-500">
            Klik batang fungsi untuk drill-down lintas grafik &amp; daftar risiko.
          </p>
        </div>
        {selectedFunctionId ? (
          <button
            type="button"
            onClick={() => onSelectFunction?.(null)}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#005baa] hover:bg-blue-100"
          >
            Semua Fungsi
          </button>
        ) : null}
      </div>

      {data.length === 0 ? (
        <ChartEmptyState
          heightClass="h-72"
          title="Belum ada distribusi fungsi"
          description="Tidak ada baris risiko pada fungsi/filter yang dipilih."
        />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#334155" }}
                interval={0}
                angle={-10}
                textAnchor="end"
                height={48}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="total"
                name="Total Risiko"
                fill="#004281"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(entry) => {
                  const item = entry as unknown as FunctionDistributionItem;
                  if (item?.function_id && onSelectFunction) {
                    onSelectFunction(
                      Number(selectedFunctionId) === item.function_id
                        ? null
                        : item.function_id
                    );
                  }
                }}
              />
              <Bar
                dataKey="inherent_high"
                name="Tinggi Inheren"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="residual_high"
                name="Tinggi Residual"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
