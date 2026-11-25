"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

type SectionKey =
  | "overview"
  | "development"
  | "functionDist"
  | "categoryDist"
  | "trend"
  | "highRes"
  | "matrix"
  | "dataQuality";

const SECTION_LABELS: Record<SectionKey, string> = {
  overview: "Ringkasan",
  development: "Grafik Perkembangan Jumlah Risiko",
  functionDist: "Grafik Sebaran Risiko per Fungsi",
  categoryDist: "Grafik Jumlah Kategori Risiko",
  trend: "Grafik Trend Risiko Tinggi",
  highRes: "Tabel Risiko Residual Tinggi",
  matrix: "Peta Matriks Risiko",
  dataQuality: "Ringkasan Kualitas Data",
};

export function DashboardContent() {
  const router = useRouter();
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

  // ---------------------------------------------------------------------------
  // Pemuatan data per bagian.
  // - Setiap bagian dimuat sendiri: gagal di satu bagian tidak menghentikan bagian lain.
  // - Setiap permintaan diberi nomor urut; jawaban yang datang terlambat (sudah ada
  //   permintaan yang lebih baru untuk bagian yang sama) diabaikan, sehingga data lama
  //   tidak menimpa grafik yang filternya sudah diganti.
  // - Galat dicatat per bagian, bukan sebagai galat seluruh dashboard.
  // ---------------------------------------------------------------------------
  const requestSeq = useRef<Partial<Record<SectionKey, number>>>({});
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, string>>>({});

  const beginRequest = (key: SectionKey): number => {
    const next = (requestSeq.current[key] ?? 0) + 1;
    requestSeq.current[key] = next;
    return next;
  };
  const isLatest = (key: SectionKey, seq: number) => requestSeq.current[key] === seq;

  const setSectionError = (key: SectionKey, message: string | null) => {
    setSectionErrors((prev) => {
      if (!message && !prev[key]) return prev;
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  };

  /** Memuat satu bagian; hasil hanya dipakai bila ini masih permintaan terbaru. */
  const loadSection = async <T,>(
    key: SectionKey,
    request: () => Promise<T>,
    apply: (value: T | null) => void,
    setLoading?: (value: boolean) => void
  ): Promise<void> => {
    const seq = beginRequest(key);
    setLoading?.(true);
    try {
      const res = await request();
      if (!isLatest(key, seq)) return;
      apply(res);
      setSectionError(key, null);
    } catch (err) {
      if (!isLatest(key, seq)) return;
      // Jangan tampilkan data lama yang tidak sesuai filter/periode yang diminta.
      apply(null);
      setSectionError(key, extractApiErrorMessage(err));
    } finally {
      if (isLatest(key, seq)) setLoading?.(false);
    }
  };

  const loadMasterOptions = useCallback(async () => {
    try {
      const res = await simanrisApi.getMasterOptions();
      setOptions(res);
    } catch {
      // Ditampilkan melalui error dashboard utama jika backend belum aktif
    }
  }, []);

  // Muat semua bagian saat filter global (Tahun / Periode) berubah atau "Muat Ulang".
  // Filter lokal tiap grafik tetap dipakai.
  const fetchAll = useCallback(async () => {
    setGlobalLoading(true);
    setApiError(null);

    const overviewSeq = beginRequest("overview");
    const overviewTask = simanrisApi
      .getOverview(globalFilters)
      .then((ov) => {
        if (isLatest("overview", overviewSeq)) setOverview(ov);
      })
      .catch((err) => {
        if (!isLatest("overview", overviewSeq)) return;
        setOverview(null);
        // Ringkasan gagal = kemungkinan besar API tidak terjangkau: tampilkan banner utama.
        setApiError(extractApiErrorMessage(err));
      });

    await Promise.allSettled([
      overviewTask,
      loadSection("development", () => simanrisApi.getDashboardDevelopment({ ...globalFilters, ...devFilters }), setDevelopment),
      loadSection("functionDist", () => simanrisApi.getDashboardFunctionDistribution({ ...globalFilters, ...funcFilters }), setFunctionDist),
      loadSection("categoryDist", () => simanrisApi.getDashboardCategoryDistribution({ ...globalFilters, ...catFilters }), setCategoryDist),
      loadSection("trend", () => simanrisApi.getDashboardHighRiskTrend({ ...globalFilters, ...trendFilters }), setHighRiskTrend),
      loadSection("highRes", () => simanrisApi.getDashboardHighResidualRisks({ ...globalFilters, ...highResFilters }), setHighResidualRisks),
      loadSection("matrix", () => simanrisApi.getRiskMatrix({ ...globalFilters, ...matrixFilters }), setMatrix),
      loadSection("dataQuality", () => simanrisApi.getDataQuality(globalFilters), setDataQuality),
    ]);

    // Permintaan lokal yang tertimpa oleh pemuatan global tidak mematikan indikatornya sendiri.
    setDevLoading(false);
    setFuncLoading(false);
    setCatLoading(false);
    setTrendLoading(false);
    setHighResLoading(false);
    setMatrixLoading(false);
    setGlobalLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Filter lokal: hanya memuat ulang bagian yang bersangkutan.
  const handleDevFilterChange = (next: typeof devFilters) => {
    setDevFilters(next);
    void loadSection("development", () => simanrisApi.getDashboardDevelopment({ ...globalFilters, ...next }), setDevelopment, setDevLoading);
  };

  const handleFuncFilterChange = (next: typeof funcFilters) => {
    setFuncFilters(next);
    void loadSection("functionDist", () => simanrisApi.getDashboardFunctionDistribution({ ...globalFilters, ...next }), setFunctionDist, setFuncLoading);
  };

  const handleCatFilterChange = (next: typeof catFilters) => {
    setCatFilters(next);
    void loadSection("categoryDist", () => simanrisApi.getDashboardCategoryDistribution({ ...globalFilters, ...next }), setCategoryDist, setCatLoading);
  };

  const handleTrendFilterChange = (next: typeof trendFilters) => {
    setTrendFilters(next);
    void loadSection("trend", () => simanrisApi.getDashboardHighRiskTrend({ ...globalFilters, ...next }), setHighRiskTrend, setTrendLoading);
  };

  const handleHighResFilterChange = (next: typeof highResFilters) => {
    setHighResFilters(next);
    void loadSection("highRes", () => simanrisApi.getDashboardHighResidualRisks({ ...globalFilters, ...next }), setHighResidualRisks, setHighResLoading);
  };

  const handleMatrixFilterChange = (next: typeof matrixFilters) => {
    setMatrixFilters(next);
    void loadSection("matrix", () => simanrisApi.getRiskMatrix({ ...globalFilters, ...next }), setMatrix, setMatrixLoading);
  };

  const failedSections = (Object.keys(sectionErrors) as SectionKey[]).filter((key) => sectionErrors[key]);

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

      {!apiError && failedSections.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold">Sebagian data gagal dimuat. Bagian yang gagal dikosongkan agar tidak menampilkan data yang keliru.</p>
            <ul className="mt-1 space-y-0.5 text-rose-800">
              {failedSections.map((key) => (
                <li key={key}>
                  <b>{SECTION_LABELS[key]}</b>: {sectionErrors[key]}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void fetchAll()}
              className="mt-2 rounded-lg border border-rose-300 bg-white px-2.5 py-1 font-semibold text-rose-900 hover:bg-rose-100"
            >
              Muat ulang semua
            </button>
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
          // Risiko inheren tinggi tidak ada di tabel residual; daftar lengkapnya
          // (Level Inheren >= 16) ada di Entry Data Pengujian.
          router.push("/simanris/entry-pengujian");
        }}
        onFilterResidualHigh={() => {
          // Tampilkan SEMUA risiko residual tinggi agar jumlahnya sama dengan kartu.
          handleHighResFilterChange({
            search: "",
            function_id: "",
            risk_category_id: "",
            residual_level: "",
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
            selectableLevels={{
              min: highResidualRisks?.min_level ?? 16,
              max: highResidualRisks?.max_level ?? 19,
            }}
            onSelectLevel={(lvl, scope) => {
              // Bawa cakupan fungsi/kategori peta ke tabel agar jumlahnya konsisten.
              handleHighResFilterChange({
                search: "",
                function_id: scope.function_id ?? "",
                risk_category_id: scope.risk_category_id ?? "",
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
