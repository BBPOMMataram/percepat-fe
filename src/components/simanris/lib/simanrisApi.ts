import api from "@/utils/api";
import type { AxiosProgressEvent } from "axios";
import type {
  CategoryDistributionItem,
  DashboardCategoryDistributionData,
  DashboardDevelopmentData,
  DashboardFunctionDistributionData,
  DashboardHighResidualRisksData,
  DashboardHighRiskTrendData,
  DataQualityData,
  DuplicateRiskWarning,
  DynamicFormSchemaResponse,
  FunctionDistributionItem,
  ImportBatchItem,
  ImportPreviewData,
  InherentVsResidualItem,
  MasterOptionsData,
  OverviewData,
  PaginatedData,
  PeriodItem,
  ResidualLevelItem,
  RiskDetailData,
  RiskListData,
  RiskMatrixData,
  RiskMovementData,
  RiskPriorityItem,
  RiskRecordEntry,
  RiskSourceItem,
  SemesterComparisonData,
  SimanrisApiResponse,
  SimanrisDashboardFilters,
  SupportingDataResponse,
  TemplateVersionItem,
} from "../types";

export const SIMANRIS_API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIMANRIS || "http://localhost:8002";

const simanrisUrl = (path: string) => `${SIMANRIS_API_BASE}/api/simanris${path}`;

export function setSimanrisActorHeaders(actor?: {
  id?: string | number | null;
  name?: string | null;
  email?: string | null;
}) {
  if (actor?.name) {
    api.defaults.headers.common["X-Actor-Name"] = actor.name;
  }
  if (actor?.email) {
    api.defaults.headers.common["X-Actor-Email"] = actor.email;
  }
  if (actor?.id !== undefined && actor?.id !== null) {
    api.defaults.headers.common["X-Actor-Id"] = String(actor.id);
  }
}

function compactParams(params: Record<string, unknown> = {}) {
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      cleaned[k] = v as string | number | boolean;
    }
  }
  return cleaned;
}

export function extractApiErrorMessage(err: unknown, fallback = "Terjadi kesalahan koneksi ke server SIMANRIS."): string {
  if (typeof err === "object" && err !== null) {
    const anyErr = err as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      message?: string;
    };
    if (anyErr.response?.data?.errors) {
      const firstField = Object.values(anyErr.response.data.errors)[0];
      if (firstField?.[0]) return firstField[0];
    }
    if (anyErr.response?.data?.message) return anyErr.response.data.message;
    if (anyErr.message) return anyErr.message;
  }
  return fallback;
}

export const simanrisApi = {
  async getMasterOptions(): Promise<MasterOptionsData> {
    const res = await api.get<SimanrisApiResponse<MasterOptionsData>>(
      simanrisUrl("/master-options")
    );
    return res.data.data;
  },

  async createPeriod(payload: {
    year: number;
    semester: 1 | 2;
    period_name?: string;
    high_risk_min_level?: number;
  }): Promise<PeriodItem> {
    const res = await api.post<SimanrisApiResponse<PeriodItem>>(
      simanrisUrl("/periods"),
      payload
    );
    return res.data.data;
  },

  async activatePeriodBatch(periodId: number, batchId: number): Promise<PeriodItem> {
    const res = await api.post<SimanrisApiResponse<PeriodItem>>(
      simanrisUrl(`/periods/${periodId}/activate-batch`),
      { batch_id: batchId }
    );
    return res.data.data;
  },

  async getOverview(filters: SimanrisDashboardFilters): Promise<OverviewData> {
    const res = await api.get<SimanrisApiResponse<OverviewData>>(
      simanrisUrl("/dashboard/overview"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getDashboardDevelopment(
    filters: SimanrisDashboardFilters
  ): Promise<DashboardDevelopmentData> {
    const res = await api.get<SimanrisApiResponse<DashboardDevelopmentData>>(
      simanrisUrl("/dashboard/development"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getDashboardFunctionDistribution(
    filters: SimanrisDashboardFilters
  ): Promise<DashboardFunctionDistributionData> {
    const res = await api.get<
      SimanrisApiResponse<DashboardFunctionDistributionData>
    >(simanrisUrl("/dashboard/function-distribution"), {
      params: compactParams(filters as Record<string, unknown>),
    });
    return res.data.data;
  },

  async getDashboardCategoryDistribution(
    filters: SimanrisDashboardFilters
  ): Promise<DashboardCategoryDistributionData> {
    const res = await api.get<
      SimanrisApiResponse<DashboardCategoryDistributionData>
    >(simanrisUrl("/dashboard/category-distribution"), {
      params: compactParams(filters as Record<string, unknown>),
    });
    return res.data.data;
  },

  async getDashboardHighRiskTrend(
    filters: SimanrisDashboardFilters
  ): Promise<DashboardHighRiskTrendData> {
    const res = await api.get<SimanrisApiResponse<DashboardHighRiskTrendData>>(
      simanrisUrl("/dashboard/high-risk-trend"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getDashboardHighResidualRisks(
    filters: SimanrisDashboardFilters
  ): Promise<DashboardHighResidualRisksData> {
    const res = await api.get<
      SimanrisApiResponse<DashboardHighResidualRisksData>
    >(simanrisUrl("/dashboard/high-residual-risks"), {
      params: compactParams(filters as Record<string, unknown>),
    });
    return res.data.data;
  },

  async getRiskByCategory(
    filters: SimanrisDashboardFilters
  ): Promise<CategoryDistributionItem[]> {
    const res = await api.get<SimanrisApiResponse<CategoryDistributionItem[]>>(
      simanrisUrl("/dashboard/risk-category"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getRiskByFunction(
    filters: SimanrisDashboardFilters
  ): Promise<FunctionDistributionItem[]> {
    const res = await api.get<SimanrisApiResponse<FunctionDistributionItem[]>>(
      simanrisUrl("/dashboard/risk-function"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getRiskByLevel(filters: SimanrisDashboardFilters): Promise<ResidualLevelItem[]> {
    const res = await api.get<SimanrisApiResponse<ResidualLevelItem[]>>(
      simanrisUrl("/dashboard/risk-level"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getInherentVsResidual(
    filters: SimanrisDashboardFilters
  ): Promise<InherentVsResidualItem[]> {
    const res = await api.get<SimanrisApiResponse<InherentVsResidualItem[]>>(
      simanrisUrl("/dashboard/inherent-vs-residual"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getRiskBySource(filters: SimanrisDashboardFilters): Promise<RiskSourceItem[]> {
    const res = await api.get<SimanrisApiResponse<RiskSourceItem[]>>(
      simanrisUrl("/dashboard/risk-source"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getRiskMatrix(filters: SimanrisDashboardFilters): Promise<RiskMatrixData> {
    const res = await api.get<SimanrisApiResponse<RiskMatrixData>>(
      simanrisUrl("/dashboard/risk-matrix"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getRiskPriority(
    filters: SimanrisDashboardFilters & { page?: number; per_page?: number }
  ): Promise<PaginatedData<RiskPriorityItem>> {
    const res = await api.get<SimanrisApiResponse<PaginatedData<RiskPriorityItem>>>(
      simanrisUrl("/dashboard/risk-priority"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getDataQuality(
    filters: SimanrisDashboardFilters & { issue_code?: string; severity?: string }
  ): Promise<DataQualityData> {
    const res = await api.get<SimanrisApiResponse<DataQualityData>>(
      simanrisUrl("/dashboard/data-quality"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async listRisks(
    filters: SimanrisDashboardFilters & {
      sort_by?: string;
      sort_dir?: "asc" | "desc";
      per_page?: number;
      page?: number;
    }
  ): Promise<RiskListData> {
    const res = await api.get<SimanrisApiResponse<RiskListData>>(
      simanrisUrl("/risks"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getRisks(
    filters: SimanrisDashboardFilters & {
      sort_by?: string;
      sort_dir?: "asc" | "desc";
      per_page?: number;
      page?: number;
    }
  ): Promise<RiskListData> {
    return this.listRisks(filters);
  },

  async getRiskDetail(id: number): Promise<RiskDetailData> {
    const res = await api.get<SimanrisApiResponse<RiskDetailData>>(
      simanrisUrl(`/risks/${id}`)
    );
    return res.data.data;
  },

  async getSupportingData(filters: {
    period_id?: number | "";
    batch_id?: number | "";
  }): Promise<SupportingDataResponse> {
    const res = await api.get<SimanrisApiResponse<SupportingDataResponse>>(
      simanrisUrl("/supporting-data"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async uploadImport(
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<ImportBatchItem> {
    const res = await api.post<SimanrisApiResponse<ImportBatchItem>>(
      simanrisUrl("/imports"),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt: AxiosProgressEvent) => {
          if (evt.total && onProgress) {
            onProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      }
    );
    return res.data.data;
  },

  async listImports(params?: {
    period_id?: number | "";
    year?: number | "";
    semester?: number | "";
    status?: string;
    source_type?: string;
    per_page?: number;
    page?: number;
  }): Promise<PaginatedData<ImportBatchItem>> {
    const res = await api.get<SimanrisApiResponse<PaginatedData<ImportBatchItem>>>(
      simanrisUrl("/import-history"),
      { params: compactParams((params || {}) as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getImportPreview(
    batchId: number,
    params?: {
      row_type?: string;
      source_sheet?: string;
      validation_status?: string;
      severity?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<ImportPreviewData> {
    const res = await api.get<SimanrisApiResponse<ImportPreviewData>>(
      simanrisUrl(`/imports/${batchId}/preview`),
      { params: compactParams((params || {}) as Record<string, unknown>) }
    );
    return res.data.data;
  },

  getImportDownloadUrl(batchId: number): string {
    return simanrisUrl(`/imports/${batchId}/download`);
  },

  async downloadImportExcel(
    batchId: number,
    fallbackFileName = `SIMANRIS_Import_${batchId}.xlsx`
  ): Promise<void> {
    const res = await api.get(simanrisUrl(`/imports/${batchId}/download`), {
      responseType: "blob",
    });

    let fileName = fallbackFileName;
    const disposition = res.headers?.["content-disposition"];
    if (typeof disposition === "string") {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
      if (match?.[1]) {
        try {
          fileName = decodeURIComponent(match[1]);
        } catch {
          fileName = match[1];
        }
      }
    }

    const blob = new Blob([res.data], {
      type:
        res.headers?.["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async revalidateImport(batchId: number): Promise<ImportBatchItem> {
    const res = await api.post<SimanrisApiResponse<ImportBatchItem>>(
      simanrisUrl(`/imports/${batchId}/validate`)
    );
    return res.data.data;
  },

  async publishImport(
    batchId: number,
    activateDataset = true
  ): Promise<ImportBatchItem> {
    const res = await api.post<SimanrisApiResponse<ImportBatchItem>>(
      simanrisUrl(`/imports/${batchId}/publish`),
      { activate_dataset: activateDataset }
    );
    return res.data.data;
  },

  async cancelImport(batchId: number): Promise<ImportBatchItem> {
    const res = await api.post<SimanrisApiResponse<ImportBatchItem>>(
      simanrisUrl(`/imports/${batchId}/cancel`)
    );
    return res.data.data;
  },

  async getSemesterComparison(
    filters: {
      base_period_id?: number | "";
      target_period_id?: number | "";
    } & Omit<SimanrisDashboardFilters, "period_id" | "batch_id" | "search">
  ): Promise<SemesterComparisonData> {
    const res = await api.get<SimanrisApiResponse<SemesterComparisonData>>(
      simanrisUrl("/analytics/semester-comparison"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async getRiskMovement(filters: {
    base_period_id?: number | "";
    target_period_id?: number | "";
  }): Promise<RiskMovementData> {
    const res = await api.get<SimanrisApiResponse<RiskMovementData>>(
      simanrisUrl("/analytics/risk-movement"),
      { params: compactParams(filters as Record<string, unknown>) }
    );
    return res.data.data;
  },

  /* -------------------------------------------------------------------------- */
  /* Dynamic Entry Risiko & Form Schema API                                     */
  /* -------------------------------------------------------------------------- */
  async getEntryFormSchema(params?: {
    period_id?: number;
    function_id?: number;
    template_id?: number;
  }): Promise<DynamicFormSchemaResponse> {
    const res = await api.get<SimanrisApiResponse<DynamicFormSchemaResponse>>(
      simanrisUrl("/entry-form/schema"),
      { params: compactParams((params || {}) as Record<string, unknown>) }
    );
    return res.data.data;
  },

  async validateRiskEntry(payload: Record<string, unknown>): Promise<{
    has_duplicate_warning: boolean;
    duplicate_warning: DuplicateRiskWarning | null;
  }> {
    const res = await api.post<
      SimanrisApiResponse<{
        has_duplicate_warning: boolean;
        duplicate_warning: DuplicateRiskWarning | null;
      }>
    >(simanrisUrl("/risks/validate"), payload);
    return res.data.data;
  },

  async createRiskRecord(payload: Record<string, unknown>): Promise<RiskRecordEntry> {
    const res = await api.post<SimanrisApiResponse<RiskRecordEntry>>(
      simanrisUrl("/risks"),
      payload
    );
    return res.data.data;
  },

  async updateRiskRecord(
    id: number,
    payload: Record<string, unknown>
  ): Promise<RiskRecordEntry> {
    const res = await api.put<SimanrisApiResponse<RiskRecordEntry>>(
      simanrisUrl(`/risks/${id}`),
      payload
    );
    return res.data.data;
  },

  async submitRiskRecord(id: number): Promise<RiskRecordEntry> {
    const res = await api.post<SimanrisApiResponse<RiskRecordEntry>>(
      simanrisUrl(`/risks/${id}/submit`)
    );
    return res.data.data;
  },

  async publishRiskRecord(id: number): Promise<RiskRecordEntry> {
    const res = await api.post<SimanrisApiResponse<RiskRecordEntry>>(
      simanrisUrl(`/risks/${id}/publish`)
    );
    return res.data.data;
  },

  async archiveRiskRecord(id: number): Promise<RiskRecordEntry> {
    const res = await api.post<SimanrisApiResponse<RiskRecordEntry>>(
      simanrisUrl(`/risks/${id}/archive`)
    );
    return res.data.data;
  },

  async deleteRiskRecord(id: number): Promise<void> {
    await api.delete<SimanrisApiResponse<null>>(simanrisUrl(`/risks/${id}`));
  },

  getExportExcelUrl(params?: {
    period_id?: number;
    function_id?: number;
    status?: string;
  }): string {
    const search = new URLSearchParams();
    if (params?.period_id) search.set("period_id", String(params.period_id));
    if (params?.function_id) search.set("function_id", String(params.function_id));
    if (params?.status) search.set("status", params.status);
    const qs = search.toString();
    return simanrisUrl(`/risks/export${qs ? `?${qs}` : ""}`);
  },

  async getTemplates(): Promise<TemplateVersionItem[]> {
    const res = await api.get<SimanrisApiResponse<TemplateVersionItem[]>>(
      simanrisUrl("/templates")
    );
    return res.data.data;
  },

  async getActiveTemplate(): Promise<TemplateVersionItem> {
    const res = await api.get<SimanrisApiResponse<TemplateVersionItem>>(
      simanrisUrl("/templates/active")
    );
    return res.data.data;
  },

  async activateTemplate(id: number): Promise<TemplateVersionItem> {
    const res = await api.post<SimanrisApiResponse<TemplateVersionItem>>(
      simanrisUrl(`/templates/${id}/activate`)
    );
    return res.data.data;
  },
};
