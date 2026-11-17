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
import type { CategoryDistributionItem } from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { ChartEmptyState } from "../shared/ChartEmptyState";

interface RiskCategoryChartProps {
  data: CategoryDistributionItem[];
  loading: boolean;
  selectedCategoryId?: number | "";
  onSelectCategory?: (categoryId: number | null) => void;
}

export function RiskCategoryChart({
  data,
  loading,
  selectedCategoryId,
  onSelectCategory,
}: RiskCategoryChartProps) {
  if (loading && data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-72" label="Memuat distribusi kategori..." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Distribusi Risiko per Kategori
          </h3>
          <p className="text-xs text-slate-500">
            Klik batang kategori untuk memfilter dashboard dan tabel di bawah.
          </p>
        </div>
        {selectedCategoryId ? (
          <button
            type="button"
            onClick={() => onSelectCategory?.(null)}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#005baa] hover:bg-blue-100"
          >
            Semua Kategori
          </button>
        ) : null}
      </div>

      {data.length === 0 ? (
        <ChartEmptyState
          heightClass="h-72"
          title="Belum ada distribusi kategori"
          description="Belum ada catatan risiko yang sesuai filter saat ini."
        />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={145}
                tick={{ fontSize: 11, fill: "#334155" }}
              />
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
                fill="#005baa"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(entry) => {
                  const item = entry as unknown as CategoryDistributionItem;
                  if (item?.category_id && onSelectCategory) {
                    onSelectCategory(
                      Number(selectedCategoryId) === item.category_id
                        ? null
                        : item.category_id
                    );
                  }
                }}
              />
              <Bar
                dataKey="inherent_high"
                name="Tinggi Inheren"
                fill="#f97316"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="residual_high"
                name="Tinggi Residual"
                fill="#dc2626"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
