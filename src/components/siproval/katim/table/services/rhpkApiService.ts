/**
 * API Service untuk Layanan Data Tabel RHPK SIPROVAL
 */

import api from "@/utils/api";
import { DEFAULT_BASE_URL } from "../constants/tableConstants";
import type { RowData } from "../types/tableTypes";

export interface FetchTableDataParams {
  year?: number;
  ikskId?: number | null;
  spreadsheetId?: number | null;
  tabId?: number | null;
  isRekapBalaiView?: boolean;
  isKabalai?: boolean;
  userId?: number | string | null;
  baseUrl?: string;
}

export interface ToggleMonthLockParams {
  month: number;
  year: number;
  isUnlocked: boolean;
  note: string;
  userId?: number | string | null;
  baseUrl?: string;
}

export interface UpdateTabPayload {
  updates?: Array<{
    month?: number | string;
    row_index?: number;
    key: string;
    value: any;
    note?: string;
  }>;
  rows_data?: RowData[];
  base_row_count?: number;
}

export interface ImportExcelParams {
  tabId: number;
  file: File;
  dryRun?: boolean;
  userId?: number | string | null;
  baseUrl?: string;
}

export interface UploadExcelParams {
  file: File;
  year: number;
  userId?: number | string | null;
  baseUrl?: string;
}

export const buildAuthQuery = (userId?: number | string | null): string => {
  return userId ? `?user_id=${userId}` : "";
};

export const fetchTableData = async (params: FetchTableDataParams) => {
  const baseUrl = params.baseUrl || DEFAULT_BASE_URL;
  const authQuery = buildAuthQuery(params.userId);
  const qYear = params.year ? `&year=${params.year}` : "";
  const qIksk = params.ikskId ? `&iksk_id=${params.ikskId}` : "";
  const qSp = params.spreadsheetId ? `&spreadsheet_id=${params.spreadsheetId}` : "";
  const qTab = params.tabId ? `&tab_id=${params.tabId}` : "";
  const qKabalai = params.isRekapBalaiView
    ? "&rekap_balai_only=1&read_only=1"
    : params.isKabalai
      ? "&is_kabalai=1"
      : "";

  const url = `${baseUrl}/api/test-local-table${authQuery}${qYear}${qIksk}${qSp}${qTab}${qKabalai}`;
  return api.get(url);
};

export const toggleMonthLock = async (params: ToggleMonthLockParams) => {
  const baseUrl = params.baseUrl || DEFAULT_BASE_URL;
  const authQuery = buildAuthQuery(params.userId);
  return api.post(
    `${baseUrl}/api/test-local-table/toggle-month-lock${authQuery}`,
    {
      month: params.month,
      year: params.year,
      is_unlocked: params.isUnlocked,
      note: params.note,
    },
  );
};

export const updateTab = async (
  tabId: number,
  payload: UpdateTabPayload,
  userId?: number | string | null,
  baseUrl: string = DEFAULT_BASE_URL,
) => {
  const authQuery = buildAuthQuery(userId);
  return api.post(
    `${baseUrl}/api/test-local-table/tab/${tabId}/update${authQuery}`,
    payload,
  );
};

export const getSpreadsheetExportUrl = (
  spreadsheetId: number,
  mode: "all" | "locked" | "active" | string = "all",
  userId?: number | string | null,
  baseUrl: string = DEFAULT_BASE_URL,
): string => {
  // FEAT-001: parameter digabung dengan "&" (sebelumnya "?mode=locked?user_id=..." membuat mode terkunci gagal)
  const userQuery = userId ? `&user_id=${encodeURIComponent(String(userId))}` : "";
  return `${baseUrl}/api/test-local-table/spreadsheet/${spreadsheetId}/export?mode=${encodeURIComponent(mode)}${userQuery}`;
};

export const importTabExcel = async (params: ImportExcelParams) => {
  const baseUrl = params.baseUrl || DEFAULT_BASE_URL;
  const authQuery = buildAuthQuery(params.userId);
  const formData = new FormData();
  formData.append("file", params.file);
  if (params.dryRun) {
    formData.append("dry_run", "1");
  }
  return api.post(
    `${baseUrl}/api/test-local-table/tab/${params.tabId}/import-excel${authQuery}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};

export const uploadExcel = async (params: UploadExcelParams) => {
  const baseUrl = params.baseUrl || DEFAULT_BASE_URL;
  const authQuery = buildAuthQuery(params.userId);
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("year", String(params.year));
  return api.post(
    `${baseUrl}/api/test-local-table/upload${authQuery}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};

export const rhpkApiService = {
  buildAuthQuery,
  fetchTableData,
  toggleMonthLock,
  updateTab,
  getSpreadsheetExportUrl,
  importTabExcel,
  uploadExcel,
};

export default rhpkApiService;
