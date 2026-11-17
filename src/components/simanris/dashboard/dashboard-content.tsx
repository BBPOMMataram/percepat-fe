"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  // 1. Global Filter (Tahun & Periode Semester Laporan SAJA)
  const [globalFilters, setGlobalFilters] = useState<SimanrisDashboardFilters>({});

  // 2. Local Filters per Chart & Table
  const [devFilters, setDevFilters] = useState<{
    function_id?: number | "";
    risk_category_id?: number | "";
  }>({});

  const [funcFilters, setFuncFilters] = useState<{
    risk_source?: string;
    risk_category_id?: number | "";
    use_alias_mapping?: boolean;
  }>({ use_alias_mapping: true });

  const [catFilters, setCatFilters] = useState<{
    function_id?: number | "";
    risk_source?: string;
  }>({});

  const [trendFilters, setTrendFilters] = useState<{
    function_id?: number | "";
    risk_category_id?: number | "";
  }>({});

  const [highResFilters, setHighResFilters] = useState<{
    search?: string;
    function_id?: number | "";
    risk_category_id?: number | "";
    residual_level?: string;
  }>({});

  const [matrixFilters, setMatrixFilters] = useState<{
    function_id?: number | "";
    risk_category_id?: number | "";
  }>({});

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [development, setDevelopment] = useState<DashboardDevelopmentData | null>(null);
  const [functionDist, setFunctionDist] = useState<DashboardFunctionDistributionData | null>(null);
  const [categoryDist, setCategoryDist] = useState<DashboardCategoryDistributionData | null>(null);
  const [highRiskTrend, setHighRiskTrend] = useState<DashboardHighRiskTrendData | null>(null);
  const [highResidualRisks, setHighResidualRisks] = useState<DashboardHighResidualRisksData | null>(null);
  const [matrix, setMatrix] = useState<RiskMatrixData | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityData | null>(null);

  // Individual loading states
  const [globalLoading, setGlobalLoading] = useState(true);
  const [devLoading, setDevLoading] = useState(false);
  const [funcLoading, setFuncLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [highResLoading, setHighResLoading] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [qualityModalOpen, setQualityModalOpen] = useState(false);

  const tableRef = useRef<HTMLDivElement | null>(null);

  const loadMasterOptions = useCallback(async () => {
    try {
      const res = await simanrisApi.getMasterOptions();
      setOptions(res);
    } catch {
      // Ditampilkan melalui error dashboard utama jika backend belum aktif
    }
  }, []);

  // Fetch all when global filters (Year / Period) change
  const fetchAll = useCallback(async () => {
    setGlobalLoading(true);
    setApiError(null);
    try {
      const [ov, dev, fnDist, catDist, trend, highRes, mat, dq] =
        await Promise.all([
          simanrisApi.getOverview(globalFilters),
          simanrisApi.getDashboardDevelopment({ ...globalFilters, ...devFilters }),
          simanrisApi.getDashboardFunctionDistribution({ ...globalFilters, ...funcFilters }),
          simanrisApi.getDashboardCategoryDistribution({ ...globalFilters, ...catFilters }),
          simanrisApi.getDashboardHighRiskTrend({ ...globalFilters, ...trendFilters }),
          simanrisApi.getDashboardHighResidualRisks({ ...globalFilters, ...highResFilters }),
          simanrisApi.getRiskMatrix({ ...globalFilters, ...matrixFilters }),
          simanrisApi.getDataQuality(globalFilters),
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
      setGlobalLoading(false);
    }
  }, [globalFilters, devFilters, funcFilters, catFilters, trendFilters, highResFilters, matrixFilters]);

  useEffect(() => {
    void loadMasterOptions();
  }, [loadMasterOptions]);

  // Initial load & when globalFilters changes
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchAll();
    }, 150);
    return () => clearTimeout(t);
  }, [globalFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Individual chart fetchers when local filters change
  const handleDevFilterChange = async (next: typeof devFilters) => {
    setDevFilters(next);
    setDevLoading(true);
    try {
      const res = await simanrisApi.getDashboardDevelopment({ ...globalFilters, ...next });
      setDevelopment(res);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setDevLoading(false);
    }
  };

  const handleFuncFilterChange = async (next: typeof funcFilters) => {
    setFuncFilters(next);
    setFuncLoading(true);
    try {
      const res = await simanrisApi.getDashboardFunctionDistribution({ ...globalFilters, ...next });
      setFunctionDist(res);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setFuncLoading(false);
    }
  };

  const handleCatFilterChange = async (next: typeof catFilters) => {
    setCatFilters(next);
    setCatLoading(true);
    try {
      const res = await simanrisApi.getDashboardCategoryDistribution({ ...globalFilters, ...next });
      setCategoryDist(res);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setCatLoading(false);
    }
  };

  const handleTrendFilterChange = async (next: typeof trendFilters) => {
    setTrendFilters(next);
    setTrendLoading(true);
    try {
      const res = await simanrisApi.getDashboardHighRiskTrend({ ...globalFilters, ...next });
      setHighRiskTrend(res);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setTrendLoading(false);
    }
  };

  const handleHighResFilterChange = async (next: typeof highResFilters) => {
    setHighResFilters(next);
    setHighResLoading(true);
    try {
      const res = await simanrisApi.getDashboardHighResidualRisks({ ...globalFilters, ...next });
      setHighResidualRisks(res);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setHighResLoading(false);
    }
  };

  const handleMatrixFilterChange = async (next: typeof matrixFilters) => {
    setMatrixFilters(next);
    setMatrixLoading(true);
    try {
      const res = await simanrisApi.getRiskMatrix({ ...globalFilters, ...next });
      setMatrix(res);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setMatrixLoading(false);
    }
  };

  const highMin = overview?.period?.high_risk_min_level ?? 16;

  return (
    <div className="space-y-4">
      <DashboardHeader
        overview={overview}
        loading={globalLoading}
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

      {/* 1. Global Filter (Hanya Tahun dan Periode Semester) */}
      <DashboardFilter
        options={options}
        filters={globalFilters}
        mode="global"
        onChange={(next) => setGlobalFilters(next)}
        onReset={() => setGlobalFilters({})}
      />

      {/* 2. Overview Metric Cards */}
      <OverviewCards
        overview={overview}
        loading={globalLoading}
        onFilterInherentHigh={() => {
          handleHighResFilterChange({
            ...highResFilters,
            residual_level: highResFilters.residual_level === "high" ? "" : "high",
          });
          tableRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
        onFilterResidualHigh={() => {
          handleHighResFilterChange({
            ...highResFilters,
            residual_level: highResFilters.residual_level === "high" ? "" : "high",
          });
          tableRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenDataQuality={() => setQualityModalOpen(true)}
      />

      {/* Row 1: Grafik 1 (Perkembangan Jumlah Risiko) & Grafik 2 (Sebaran Risiko per Fungsi) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RiskDevelopmentChart
          data={development}
          loading={globalLoading || devLoading}
          options={options}
          filters={devFilters}
          onFilterChange={handleDevFilterChange}
        />
        <FunctionDistributionChart
          data={functionDist}
          loading={globalLoading || funcLoading}
          options={options}
          filters={funcFilters}
          onFilterChange={handleFuncFilterChange}
          onToggleAliasMapping={(enabled) =>
            handleFuncFilterChange({ ...funcFilters, use_alias_mapping: enabled })
          }
        />
      </div>

      {/* Row 2: Grafik 3 (Jumlah Kategori Risiko) & Grafik 4 (Trend Risiko Tinggi Level 16–19) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <CategoryComparisonChart
            data={categoryDist}
            loading={globalLoading || catLoading}
            options={options}
            filters={catFilters}
            onFilterChange={handleCatFilterChange}
          />
        </div>
        <div className="xl:col-span-5">
          <HighRiskTrendChart
            data={highRiskTrend}
            loading={globalLoading || trendLoading}
            options={options}
            filters={trendFilters}
            onFilterChange={handleTrendFilterChange}
          />
        </div>
      </div>

      {/* Row 3: Tabel 5 (Risiko Residual Tinggi Level 16–19) */}
      <div ref={tableRef}>
        <HighResidualRisksTable
          data={highResidualRisks}
          loading={globalLoading || highResLoading}
          onSelectRisk={(id) => setSelectedRiskId(id)}
          options={options}
          filters={highResFilters}
          onFilterChange={handleHighResFilterChange}
        />
      </div>

      {/* Row 4: Peta Matriks Risiko 5x5 & Ringkasan Kualitas Data */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <RiskHeatmap
            data={matrix}
            loading={globalLoading || matrixLoading}
            options={options}
            filters={matrixFilters}
            onFilterChange={handleMatrixFilterChange}
            onSelectLevel={(_mode, lvl) => {
              handleHighResFilterChange({
                ...highResFilters,
                residual_level: lvl,
              });
              tableRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>
        <div className="xl:col-span-5">
          <DataQualityCard
            data={dataQuality}
            loading={globalLoading}
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
