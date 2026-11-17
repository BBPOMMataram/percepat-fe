"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RiskSourceItem } from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface RiskSourceChartProps {
  data: RiskSourceItem[];
  loading: boolean;
  selectedSource?: string;
  onSelectSource?: (source: string) => void;
}

const COLORS = ["#005baa", "#04a451", "#f59e0b", "#6366f1", "#64748b"];

export function RiskSourceChart({
  data,
  loading,
  selectedSource,
  onSelectSource,
}: RiskSourceChartProps) {
  if (loading && data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-64" label="Memuat proporsi sumber risiko..." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Sumber Risiko (Internal vs Eksternal)
          </h3>
          <p className="text-xs text-slate-500">
            Klik segmen untuk menyaring sumber risiko aktif.
          </p>
        </div>
        {selectedSource ? (
          <button
            type="button"
            onClick={() => onSelectSource?.("")}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#005baa] hover:bg-blue-100"
          >
            Semua Sumber
          </button>
        ) : null}
      </div>

      {data.length === 0 ? (
        <ChartEmptyState
          heightClass="h-64"
          title="Belum ada data sumber risiko"
        />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="source"
                cx="50%"
                cy="48%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={2}
                cursor="pointer"
                onClick={(entry) => {
                  const item = entry as unknown as RiskSourceItem;
                  if (item?.source && item.source !== "Tidak Diketahui" && onSelectSource) {
                    onSelectSource(
                      selectedSource === item.source ? "" : item.source
                    );
                  }
                }}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={`src-${entry.source}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => [`${val ?? 0} risiko`, "Jumlah"]}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
