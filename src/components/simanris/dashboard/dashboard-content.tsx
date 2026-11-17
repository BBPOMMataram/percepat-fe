"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  SIMANRIS_API_BASE,
  extractApiErrorMessage,
  simanrisApi,
} from "../lib/simanrisApi";
import type {
  DashboardCategoryDistributionData,
  DashboardDevelopmentData,
  DashboardFunctionDistributionData,
  DashboardHighResidualRisksData,
  DashboardHighRiskTrendData,
  DataQualityData,
  MasterOptionsData,
  OverviewData,
  RiskMatrixData,
  SimanrisDashboardFilters,
} from "../types";
import { DashboardHeader } from "./dashboard-header";
import { DashboardFilter } from "./dashboard-filter";
import { OverviewCards } from "./overview-cards";
import { RiskDevelopmentChart } from "../charts/risk-development-chart";
import { FunctionDistributionChart } from "../charts/function-distribution-chart";
import { CategoryComparisonChart } from "../charts/category-comparison-chart";
import { HighRiskTrendChart } from "../charts/high-risk-trend-chart";
import { HighResidualRisksTable } from "../tables/high-residual-risks-table";
import { RiskHeatmap } from "../charts/risk-heatmap";
import { DataQualityCard } from "../cards/data-quality-card";
import { RiskDetailModal } from "../shared/RiskDetailModal";
import { DataQualityModal } from "../shared/DataQualityModal";

export function DashboardContent() {
  const [options, setOptions] = useState<MasterOptionsData | null>(null);
  const [filters, setFilters] = useState<SimanrisDashboardFilters>({});

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [development, setDevelopment] =
    useState<DashboardDevelopmentData | null>(null);
  const [functionDist, setFunctionDist] =
    useState<DashboardFunctionDistributionData | null>(null);
  const [categoryDist, setCategoryDist] =
    useState<DashboardCategoryDistributionData | null>(null);
  const [highRiskTrend, setHighRiskTrend] =
    useState<DashboardHighRiskTrendData | null>(null);
  const [highResidualRisks, setHighResidualRisks] =
    useState<DashboardHighResidualRisksData | null>(null);
  const [matrix, setMatrix] = useState<RiskMatrixData | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityData | null>(null);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [qualityModalOpen, setQualityModalOpen] = useState(false);

  const loadMasterOptions = useCallback(async () => {
    try {
      const res = await simanrisApi.getMasterOptions();
      setOptions(res);
    } catch {
      // Ditampilkan melalui error dashboard utama jika backend belum aktif
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [ov, dev, fnDist, catDist, trend, highRes, mat, dq] =
        await Promise.all([
          simanrisApi.getOverview(filters),
          simanrisApi.getDashboardDevelopment(filters),
          simanrisApi.getDashboardFunctionDistribution(filters),
          simanrisApi.getDashboardCategoryDistribution(filters),
          simanrisApi.getDashboardHighRiskTrend(filters),
          simanrisApi.getDashboardHighResidualRisks(filters),
          simanrisApi.getRiskMatrix(filters),
          simanrisApi.getDataQuality(filters),
        ]);

      setOverview(ov);
      setDevelopment(dev);
      setFunctionDist(fnDist);
      setCategoryDist(catDist);
      setHighRiskTrend(trend);
      setHighResidualRisks(highRes);
      setMatrix(mat);
      setDataQuality(dq);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadMasterOptions();
  }, [loadMasterOptions]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchAll();
    }, 150);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const updateFilters = (next: SimanrisDashboardFilters) => {
    setFilters(next);
  };

  const highMin = overview?.period?.high_risk_min_level ?? 16;

  return (
    <div className="space-y-4">
      <DashboardHeader
        overview={overview}
        loading={loading}
        onRefresh={() => {
          void loadMasterOptions();
          void fetchAll();
        }}
      />

      {apiError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">
              Belum terhubung ke API SIMANRIS ({SIMANRIS_API_BASE})
            </p>
            <p className="mt-1 text-amber-800">{apiError}</p>
            <p className="mt-1 text-[11px] text-amber-700">
              Pastikan backend Laravel SIMANRIS berjalan di{" "}
              <code>{SIMANRIS_API_BASE}</code> dan database{" "}
              <code>bbpo_simanris</code> sudah dimigrasi.
            </p>
          </div>
        </div>
      )}

      <DashboardFilter
        options={options}
        filters={filters}
        onChange={updateFilters}
        onReset={() => updateFilters({ period_id: filters.period_id })}
      />

      <OverviewCards
        overview={overview}
        loading={loading}
        onFilterInherentHigh={() =>
          updateFilters({
            ...filters,
            inherent_level: filters.inherent_level === "high" ? "" : "high",
          })
        }
        onFilterResidualHigh={() =>
          updateFilters({
            ...filters,
            residual_level: filters.residual_level === "high" ? "" : "high",
          })
        }
        onOpenDataQuality={() => setQualityModalOpen(true)}
      />

      {/* Row 1: Grafik 1 (Perkembangan Jumlah Risiko) & Grafik 2 (Sebaran Risiko Semester II per Fungsi) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RiskDevelopmentChart data={development} loading={loading} />
        <FunctionDistributionChart
          data={functionDist}
          loading={loading}
          onToggleAliasMapping={(enabled) =>
            updateFilters({ ...filters, use_alias_mapping: enabled })
          }
        />
      </div>

      {/* Row 2: Grafik 3 (Jumlah Kategori Risiko) & Grafik 4 (Trend Risiko Tinggi Level 16–19) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <CategoryComparisonChart data={categoryDist} loading={loading} />
        </div>
        <div className="xl:col-span-5">
          <HighRiskTrendChart data={highRiskTrend} loading={loading} />
        </div>
      </div>

      {/* Row 3: Grafik/Tabel 5 (Risiko Residual Tinggi Level 16–19 Semester II 2026) */}
      <HighResidualRisksTable
        data={highResidualRisks}
        loading={loading}
        onSelectRisk={(id) => setSelectedRiskId(id)}
      />

      {/* Row 4: Peta Matriks Risiko 5x5 & Ringkasan Kualitas Data */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <RiskHeatmap
            data={matrix}
            loading={loading}
            onSelectLevel={(mode, lvl) =>
              updateFilters(
                mode === "inherent"
                  ? { ...filters, inherent_level: lvl }
                  : { ...filters, residual_level: lvl }
              )
            }
          />
        </div>
        <div className="xl:col-span-5">
          <DataQualityCard
            data={dataQuality}
            loading={loading}
            onOpenModal={() => setQualityModalOpen(true)}
          />
        </div>
      </div>

      <RiskDetailModal
        riskId={selectedRiskId}
        highMin={highMin}
        onClose={() => setSelectedRiskId(null)}
      />

      <DataQualityModal
        open={qualityModalOpen}
        data={dataQuality}
        onClose={() => setQualityModalOpen(false)}
      />
    </div>
  );
}
