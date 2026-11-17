export interface SimanrisApiResponse<T> {
  status: "success" | "error" | "duplicate_detected";
  message?: string;
  data: T;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface RiskFunctionItem {
  id: number;
  code: string;
  name: string;
}

export interface RiskCategoryItem {
  id: number;
  code: string;
  name: string;
}

export interface TemplateVersionItem {
  id: number;
  template_name: string;
  version: string;
  effective_date: string | null;
  is_active: boolean;
}

export interface ImportBatchSummary {
  id: number;
  file_name: string;
  status?: string;
  total_rows?: number;
  valid_rows?: number;
  warning_rows?: number;
  error_rows?: number;
  published_at: string | null;
}

export interface PeriodItem {
  id: number;
  year: number;
  semester: number;
  period_name: string;
  status?: string;
  high_risk_min_level: number;
  active_import_batch_id: number | null;
  active_import_batch?: ImportBatchSummary | null;
  import_batches_count?: number;
}

export interface MasterOptionsData {
  periods: PeriodItem[];
  functions: RiskFunctionItem[];
  categories: RiskCategoryItem[];
  templates: TemplateVersionItem[];
}

export interface SimanrisDashboardFilters {
  period_id?: number | "";
  batch_id?: number | "";
  function_id?: number | "";
  risk_category_id?: number | "";
  risk_source?: string;
  inherent_level?: string;
  residual_level?: string;
  search?: string;
  status?: string;
  entry_mode?: string;
  include_unpublished?: boolean;
}

export interface ReconciliationSummary {
  kompilasi_count?: number;
  function_sheets_total?: number;
  function_sheet_counts?: Record<string, number>;
  sheet8_total?: number | null;
  missing_in_function_sheets?: number;
  extra_in_function_sheets?: number;
  [key: string]: unknown;
}

export interface OverviewData {
  period: {
    id: number;
    year: number;
    semester: number;
    period_name: string;
    high_risk_min_level: number;
  } | null;
  batch: {
    id: number;
    file_name: string;
    source_type: string;
    published_at: string | null;
    reconciliation_summary: ReconciliationSummary | null;
  } | null;
  total_rows: number;
  total_records: number;
  unique_risk_codes: number;
  duplicate_candidates: number;
  inherent_high: number;
  residual_high: number;
  functions_count: number;
  categories_count: number;
  data_quality_issues: number;
  warning_issues_count: number;
  error_issues_count: number;
  rtp_count: number;
  positive_risks_count: number;
  data_status: string;
}

export interface CategoryDistributionItem {
  category_id: number | null;
  code: string;
  name: string;
  total: number;
  inherent_high: number;
  residual_high: number;
}

export interface FunctionDistributionItem {
  function_id: number | null;
  code: string;
  name: string;
  total: number;
  inherent_high: number;
  residual_high: number;
}

export interface ResidualLevelItem {
  level: number;
  total: number;
}

export interface InherentVsResidualItem {
  level: number;
  inherent_count: number;
  residual_count: number;
}

export interface RiskSourceItem {
  source: string;
  total: number;
}

export interface MatrixCellCount {
  likelihood: number;
  impact: number;
  level: number | null;
  count: number;
}

export interface RiskMatrixData {
  available: boolean;
  reason?: string;
  high_risk_min_level: number;
  matrix_config: Record<string, number>;
  inherent: MatrixCellCount[];
  residual: MatrixCellCount[];
}

export interface RiskPriorityItem {
  id: number;
  risk_code: string | null;
  risk_event: string | null;
  function_name: string | null;
  category_name: string | null;
  risk_source: string | null;
  inherent_likelihood: number | null;
  inherent_impact: number | null;
  inherent_level: number | null;
  residual_likelihood: number | null;
  residual_impact: number | null;
  residual_level: number | null;
  has_matrix_anomaly: boolean;
  is_duplicate_code_candidate: boolean;
  source_sheet: string | null;
  source_row: number | null;
}

export interface RiskRecordItem {
  id: number;
  period_id: number;
  import_batch_id: number;
  function_id: number | null;
  risk_category_id: number | null;
  risk_code: string | null;
  normalized_risk_code: string | null;
  business_process: string | null;
  objective: string | null;
  risk_event: string | null;
  risk_cause: string | null;
  risk_impact_desc: string | null;
  risk_source: string | null;
  raw_category_name: string | null;
  raw_unit_name: string | null;
  existing_control: string | null;
  control_effectiveness: string | null;
  inherent_likelihood: number | null;
  inherent_impact: number | null;
  inherent_level: number | null;
  residual_likelihood: number | null;
  residual_impact: number | null;
  residual_level: number | null;
  has_matrix_anomaly: boolean;
  is_duplicate_code_candidate: boolean;
  source_sheet: string | null;
  source_row: number | null;
  raw_data?: Record<string, unknown> | null;
  risk_function?: RiskFunctionItem | null;
  risk_category?: RiskCategoryItem | null;
  period?: PeriodItem | null;
  import_batch?: ImportBatchItem | null;
}

export interface RiskListData {
  period: {
    id: number;
    period_name: string;
    high_risk_min_level: number;
  } | null;
  batch: {
    id: number;
    file_name: string;
  } | null;
  records: PaginatedData<RiskRecordItem>;
}

export interface RiskTreatmentPlanItem {
  id: number;
  risk_code: string | null;
  risk_event?: string | null;
  treatment_plan?: string | null;
  action_plan?: string | null;
  pic?: string | null;
  target_timeline?: string | null;
  status?: string | null;
  source_sheet: string | null;
  source_row: number | null;
  raw_data?: Record<string, unknown> | null;
}

export interface ControlTestingItem {
  id: number;
  risk_code: string | null;
  control_name?: string | null;
  testing_result?: string | null;
  source_sheet: string | null;
  source_row: number | null;
  raw_data?: Record<string, unknown> | null;
}

export interface RiskReviewItem {
  id: number;
  risk_code: string | null;
  review_result?: string | null;
  reviewer?: string | null;
  review_date?: string | null;
  source_sheet: string | null;
  source_row: number | null;
  raw_data?: Record<string, unknown> | null;
}

export interface PositiveRiskItem {
  id: number;
  risk_code: string | null;
  opportunity_event?: string | null;
  impact_desc?: string | null;
  source_sheet: string | null;
  source_row: number | null;
  raw_data?: Record<string, unknown> | null;
}

export interface RiskContextItem {
  id: number;
  sheet_name?: string | null;
  context_type?: string | null;
  title?: string | null;
  description?: string | null;
  source_sheet: string | null;
  source_row: number | null;
  raw_data?: Record<string, unknown> | null;
}

export interface RiskDetailData {
  record: RiskRecordItem;
  treatment_plans: RiskTreatmentPlanItem[];
  control_testings: ControlTestingItem[];
  reviews: RiskReviewItem[];
}

export interface ImportIssueItem {
  id: number;
  import_batch_id: number;
  sheet_name: string | null;
  row_number: number | null;
  column_name: string | null;
  issue_code: string;
  severity: "error" | "warning" | "info";
  message: string;
  raw_value?: string | null;
}

export interface DataQualityData {
  batch_id: number | null;
  file_name?: string | null;
  summary: {
    missing_risk_codes: number;
    incomplete_risk_codes: number;
    duplicate_candidates: number;
    missing_categories: number;
    missing_functions: number;
    missing_assessments: number;
    invalid_numerical_values: number;
    matrix_anomalies: number;
    reconciliation_issues: number;
    total_warnings: number;
    total_errors: number;
  };
  reconciliation_summary: ReconciliationSummary | null;
  issues: ImportIssueItem[];
}

export interface ImportBatchItem {
  id: number;
  period_id: number;
  function_id: number | null;
  template_version_id: number | null;
  file_name: string;
  file_hash?: string;
  file_size?: number;
  source_type: "master_compilation" | "function_workbook";
  status: "uploaded" | "parsed" | "validated" | "staged" | "published" | "failed" | "cancelled";
  is_active: boolean;
  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  error_rows: number;
  uploaded_by_name?: string | null;
  published_at: string | null;
  created_at: string;
  reconciliation_summary: ReconciliationSummary | null;
  detected_sheets?: Array<{
    name?: string;
    sheet_name?: string;
    classified_as?: string;
    row_count?: number;
  }> | null;
  period?: PeriodItem | null;
  risk_function?: RiskFunctionItem | null;
  template_version?: TemplateVersionItem | null;
}

export interface ImportStagingRowItem {
  id: number;
  import_batch_id: number;
  source_sheet: string;
  source_row: number;
  row_type:
    | "risk_register"
    | "function_register"
    | "rtp"
    | "control_testing"
    | "review"
    | "positive_risk"
    | "context"
    | "summary"
    | "unknown";
  validation_status: "valid" | "warning" | "error";
  risk_code: string | null;
  normalized_data: Record<string, unknown> | null;
  raw_data: Record<string, unknown> | null;
}

export interface ImportPreviewData {
  batch: ImportBatchItem;
  row_type_counts: Record<string, number>;
  staging_rows: PaginatedData<ImportStagingRowItem>;
  issues: ImportIssueItem[];
}

export interface DuplicateDetectedPayload {
  file_hash: string;
  existing_batches: Array<{
    id: number;
    file_name: string;
    status: string;
    created_at: string;
    period?: PeriodItem | null;
  }>;
}

export interface SemesterSummary {
  available: boolean;
  period: {
    id: number;
    year: number;
    semester: number;
    period_name: string;
    batch_id?: number | null;
    file_name?: string | null;
  } | null;
  total_records: number;
  unique_risk_codes: number;
  inherent_high: number;
  residual_high: number;
  by_category: Record<string, number>;
  by_function: Record<string, number>;
}

export interface SemesterComparisonData {
  comparison_scope: string;
  notice: string;
  base: SemesterSummary;
  target: SemesterSummary;
  deltas: {
    total_records: number;
    inherent_high: number;
    residual_high: number;
  } | null;
  category_comparison: Array<{
    category: string;
    base_count: number;
    target_count: number;
    delta: number;
  }>;
  function_comparison: Array<{
    function: string;
    base_count: number;
    target_count: number;
    delta: number;
  }>;
}

export interface RiskMovementEntry {
  match_basis: string;
  verified: boolean;
  from_code: string | null;
  to_code: string | null;
  code_changed: boolean;
  risk_event: string | null;
  function_name: string | null;
  from_inherent: number | null;
  to_inherent: number | null;
  from_residual: number | null;
  to_residual: number | null;
  residual_delta: number;
}

export interface RiskMovementData {
  base_period?: string;
  target_period?: string;
  verified_count: number;
  movements?: RiskMovementEntry[];
  suggested_matches?: RiskMovementEntry[];
  code_shift_candidates: RiskMovementEntry[];
  notice: string;
}

export interface SupportingDataResponse {
  batch_id?: number;
  rtp: RiskTreatmentPlanItem[];
  control_testings: ControlTestingItem[];
  reviews: RiskReviewItem[];
  positive_risks: PositiveRiskItem[];
  contexts: RiskContextItem[];
}

export type RiskRecordStatus = "draft" | "submitted" | "published" | "archived";

export interface FormFieldOptionObject {
  value: string | number;
  label: string;
}

export type FormFieldOption = string | FormFieldOptionObject;

export interface FormFieldValidation {
  max_length?: number;
  min_length?: number;
  min?: number;
  max?: number;
  pattern?: string;
  [key: string]: unknown;
}

export interface FormFieldSchema {
  id: number;
  field_key: string;
  source_header: string;
  parent_header: string | null;
  source_column: string;
  column_index: number;
  display_label: string;
  group_key: string;
  group_label: string;
  data_type: "string" | "text" | "integer" | "select" | "date" | string;
  input_type: "text" | "textarea" | "number" | "select" | "multiselect" | "readonly_calculated" | "date" | string;
  is_required: boolean;
  is_editable: boolean;
  is_visible: boolean;
  is_system_generated: boolean;
  options: FormFieldOption[] | null;
  validation: FormFieldValidation | null;
  help_text: string | null;
  sort_order: number;
}

export interface FormSectionSchema {
  key: string;
  label: string;
  description: string | null;
  order: number;
  fields: FormFieldSchema[];
}

export interface DynamicFormSchemaResponse {
  template: {
    id: number;
    template_name: string;
    version: string;
    year: number;
    effective_date: string | null;
    is_active: boolean;
  };
  period: {
    id: number;
    year: number;
    semester: number;
    period_name: string;
    high_risk_min_level: number;
  };
  sections: FormSectionSchema[];
  scoring_matrix: Record<string, number>;
  master_options: {
    categories: RiskCategoryItem[];
    functions: RiskFunctionItem[];
    sources: string[];
    control_weaknesses: string[];
    control_effectivenesses: string[];
  };
}

export interface DuplicateRiskCandidate {
  id: number;
  risk_code: string;
  risk_event: string;
  function_name: string | null;
  status: string;
}

export interface DuplicateRiskWarning {
  type: string;
  message: string;
  candidate: DuplicateRiskCandidate;
}

export interface RiskRecordEntry {
  id: number;
  period_id: number;
  function_id: number | null;
  risk_category_id: number | null;
  source_row_number?: number | null;
  risk_code: string | null;
  normalized_risk_code?: string | null;
  objective: string | null;
  business_process: string | null;
  risk_event: string | null;
  risk_cause: string | null;
  risk_source: string | null;
  potential_impact: string | null;
  risk_owner: string | null;
  raw_unit_name: string | null;
  raw_category_name: string | null;
  inherent_likelihood: number | null;
  inherent_impact: number | null;
  inherent_level: number | null;
  existing_controls: string | null;
  control_attributes: string | null;
  control_weakness: string | null;
  control_effectiveness: string | null;
  residual_likelihood: number | null;
  residual_impact: number | null;
  residual_level: number | null;
  status: RiskRecordStatus;
  entry_mode: "excel_import" | "web_entry";
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  risk_function?: RiskFunctionItem | null;
  risk_category?: RiskCategoryItem | null;
  [key: string]: unknown;
}

