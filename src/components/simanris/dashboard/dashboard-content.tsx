"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  SIMANRIS_API_BASE,
  extractApiErrorMessage,
  simanrisApi,
} from "../lib/simanrisApi";
import type {
  CategoryDistributionItem,
  DataQualityData,
  FunctionDistributionItem,
  InherentVsResidualItem,
  MasterOptionsData,
  OverviewData,
  PaginatedData,
  ResidualLevelItem,
  RiskMatrixData,
  RiskPriorityItem,
  RiskSourceItem,
  SimanrisDashboardFilters,
} from "../types";
import { DashboardHeader } from "./dashboard-header";
import { DashboardFilter } from "./dashboard-filter";
import { OverviewCards } from "./overview-cards";
import { RiskCategoryChart } from "../charts/risk-category-chart";
import { RiskFunctionChart } from "../charts/risk-function-chart";
import { RiskLevelChart } from "../charts/risk-level-chart";
import { InherentResidualChart } from "../charts/inherent-residual-chart";
import { RiskSourceChart } from "../charts/risk-source-chart";
import { RiskHeatmap } from "../charts/risk-heatmap";
import { DataQualityCard } from "../cards/data-quality-card";
import { RiskPriorityTable } from "../tables/risk-priority-table";
import { RiskDetailModal } from "../shared/RiskDetailModal";
import { DataQualityModal } from "../shared/DataQualityModal";

export function DashboardContent() {
  const [options, setOptions] = useState<MasterOptionsData | null>(null);
  const [filters, setFilters] = useState<SimanrisDashboardFilters>({});
  const [priorityPage, setPriorityPage] = useState(1);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [categories, setCategories] = useState<CategoryDistributionItem[]>([]);
  const [functions, setFunctions] = useState<FunctionDistributionItem[]>([]);
  const [levels, setLevels] = useState<ResidualLevelItem[]>([]);
  const [inhVsRes, setInhVsRes] = useState<InherentVsResidualItem[]>([]);
  const [sources, setSources] = useState<RiskSourceItem[]>([]);
  const [matrix, setMatrix] = useState<RiskMatrixData | null>(null);
  const [priority, setPriority] = useState<PaginatedData<RiskPriorityItem> | null>(null);
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
      const [ov, cat, fn, lvl, ivr, src, mat, prio, dq] = await Promise.all([
        simanrisApi.getOverview(filters),
        simanrisApi.getRiskByCategory(filters),
        simanrisApi.getRiskByFunction(filters),
        simanrisApi.getRiskByLevel(filters),
        simanrisApi.getInherentVsResidual(filters),
        simanrisApi.getRiskBySource(filters),
        simanrisApi.getRiskMatrix(filters),
        simanrisApi.getRiskPriority({ ...filters, page: priorityPage, per_page: 10 }),
        simanrisApi.getDataQuality(filters),
      ]);

      setOverview(ov);
      setCategories(cat);
      setFunctions(fn);
      setLevels(lvl);
      setInhVsRes(ivr);
      setSources(src);
      setMatrix(mat);
      setPriority(prio);
      setDataQuality(dq);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, priorityPage]);

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
    setPriorityPage(1);
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
            <p className="font-bold">Belum terhubung ke API SIMANRIS ({SIMANRIS_API_BASE})</p>
            <p className="mt-1 text-amber-800">{apiError}</p>
            <p className="mt-1 text-[11px] text-amber-700">
              Pastikan backend Laravel SIMANRIS berjalan di <code>{SIMANRIS_API_BASE}</code> dan database <code>bbpo_simanris</code> sudah dimigrasi.
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

      {/* Row 1: Category & Function drill-down */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RiskCategoryChart
          data={categories}
          loading={loading}
          selectedCategoryId={filters.risk_category_id}
          onSelectCategory={(categoryId) =>
            updateFilters({ ...filters, risk_category_id: categoryId ?? "" })
          }
        />
        <RiskFunctionChart
          data={functions}
          loading={loading}
          selectedFunctionId={filters.function_id}
          onSelectFunction={(functionId) =>
            updateFilters({ ...filters, function_id: functionId ?? "" })
          }
        />
      </div>

      {/* Row 2: Level distribution, Inherent vs Residual, Risk Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RiskLevelChart
          data={levels}
          highMin={highMin}
          loading={loading}
          onSelectLevel={(lvl) =>
            updateFilters({
              ...filters,
              residual_level: filters.residual_level === lvl ? "" : lvl,
            })
          }
        />
        <InherentResidualChart data={inhVsRes} loading={loading} />
        <RiskSourceChart
          data={sources}
          loading={loading}
          selectedSource={filters.risk_source}
          onSelectSource={(src) =>
            updateFilters({ ...filters, risk_source: src })
          }
        />
      </div>

      {/* Row 3: Risk Matrix Heatmap + Data Quality */}
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

      {/* Row 4: Top Priority Risk Table */}
      <RiskPriorityTable
        data={priority}
        highMin={highMin}
        loading={loading}
        onPageChange={setPriorityPage}
        onSelectRisk={(id) => setSelectedRiskId(id)}
      />

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
