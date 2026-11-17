export interface ActorContext {
  actor: "pic_admin" | "katim" | "tu" | "kabalai";
  is_pic_or_admin: boolean;
  can_edit: boolean;
  can_resolve_conflict: boolean;
  is_global_scope: boolean;
  allowed_iksk_ids: number[];
  viewable_iksk_ids?: number[];
  katim_iksk_ids: number[];
  is_assigned?: boolean;
  user_id: string;
  user_name: string;
}

export interface AssignedKatim {
  user_id: string;
  name: string;
  call_name: string;
}

export interface IndicatorPerformance {
  iksk_id: number;
  target_tahunan: number | null;
  target_bulan: number | null;
  realisasi: number | null;
  capaian_bulan: number | null;
  capaian_tahun: number | null;
  status: "tercapai" | "belum";
  kategori: string;
  suggested_analisis_type: "keberhasilan" | "kegagalan" | "mixed";
}

export interface DynamicTableColumn {
  key: string;
  label: string;
  group: 'core' | 'capaian' | 'narasi' | 'monitoring' | 'status';
  editable: boolean;
  default_visible: boolean;
  available: boolean;
}

export interface IndicatorSummaryItem {
  iksk_id: number;
  iksk_name: string;
  sasaran_kode: string;
  sasaran_name: string;
  is_assigned?: boolean;
  can_edit?: boolean;
  assigned_katims: AssignedKatim[];
  is_multi_katim: boolean;
  performance: IndicatorPerformance;
  contributors_count: number;
  has_kendala: boolean;
  has_rtl: boolean;
  has_conflict: boolean;
  is_filled: boolean;
  unresolved_monitoring_count: number;
  timeline_date: string | null;
  arahan_pimpinan_preview: string;
  kendala_preview: string;
  rtl_preview: string;
  rekomendasi_preview: string;
  analisis_preview?: string;
}

export interface RekapIndexData {
  year: number;
  month: number;
  actor_context: ActorContext;
  available_years: number[];
  columns?: DynamicTableColumn[];
  summary: {
    total_iksk: number;
    tercapai: number;
    belum_tercapai: number;
    has_kendala: number;
    unresolved_monitoring: number;
    conflict_count: number;
    filled_rekap_count: number;
  };
  indicators: IndicatorSummaryItem[];
}

export interface OwnEntryData {
  id: number | null;
  is_draft: boolean;
  owner_scope: string;
  owner_name: string;
  has_kendala: boolean;
  has_rtl: boolean;
  rekap_kendala_text: string;
  rekap_rtl_text: string;
  rekomendasi_text: string;
  analisis_text: string;
  analisis_type: "keberhasilan" | "kegagalan" | "mixed";
  timeline_date: string;
  source_kendala_text: string;
  source_rtl_text: string;
  source_rekomendasi_text: string;
  has_kendala_conflict: boolean;
  has_rtl_conflict: boolean;
  updated_at: string | null;
}

export interface PeerEntryItem {
  id: number;
  owner_user_id: string | null;
  owner_name: string;
  owner_scope: string;
  has_kendala: boolean;
  has_rtl: boolean;
  rekap_kendala_text: string | null;
  rekap_rtl_text: string | null;
  rekomendasi_text: string | null;
  analisis_text: string | null;
  analisis_type: "keberhasilan" | "kegagalan" | "mixed" | null;
  timeline_date: string | null;
  source_kendala_text: string | null;
  source_rtl_text: string | null;
  has_kendala_conflict: boolean;
  has_rtl_conflict: boolean;
  is_editable: boolean;
  updated_at: string | null;
}

export interface MonitoringHistoryStep {
  reporting_year: number;
  reporting_month: number;
  progress_status: "sudah" | "belum";
  progress_note: string | null;
  previous_timeline_date: string | null;
  new_timeline_date: string | null;
  updated_by_name: string | null;
  updated_at: string | null;
}

export interface MonitoringItem {
  id: number;
  origin_month: number;
  owner_user_id: string | null;
  owner_name: string;
  kendala_text: string;
  rtl_text: string | null;
  rekomendasi_text: string | null;
  initial_timeline_date: string | null;
  current_timeline_date: string | null;
  status: "active" | "resolved" | "superseded";
  resolved_year: number | null;
  resolved_month: number | null;
  can_update: boolean;
  current_month_update: {
    progress_status: "sudah" | "belum";
    progress_note: string | null;
    previous_timeline_date: string | null;
    new_timeline_date: string | null;
    updated_by_name: string | null;
    updated_at: string | null;
  } | null;
  histories: MonitoringHistoryStep[];
}

export interface MonitoringHistoryRecord {
  id: number;
  origin_month: number;
  owner_user_id: string | null;
  owner_name: string | null;
  kendala_text: string;
  rtl_text: string | null;
  initial_timeline_date: string | null;
  current_timeline_date: string | null;
  status: "active" | "resolved" | "superseded";
  resolved_year: number | null;
  resolved_month: number | null;
  monitoring_histories?: MonitoringHistoryStep[];
}

export interface RekapDetailData {
  year: number;
  iksk_id: number;
  month: number;
  actor_context: ActorContext;
  indicator: {
    iksk_id: number;
    iksk_name: string;
    sasaran_kegiatan_id: number | null;
    sasaran_kode: string;
    sasaran_nomor: number | null;
    sasaran_name: string;
  };
  assigned_katims: AssignedKatim[];
  is_multi_katim: boolean;
  performance: IndicatorPerformance;
  arahan_pimpinan_text: string;
  master_tab_snapshot: {
    kendala: string;
    rtl: string;
    rekomendasi: string;
    analisis: string;
    arahan: string;
    timeline_date: string | null;
    timeline_text: string;
    progres_tl_sebelumnya: string;
    timeline_progres_tl_sebelumnya: string | null;
  };
  excel_source: {
    spreadsheet_id: number | null;
    source_tab_ids: number[];
    combined_kendala: string;
    combined_rtl: string;
    combined_rekomendasi: string;
  };
  own_entry: OwnEntryData;
  peer_entries: PeerEntryItem[];
  monitoring_items: MonitoringItem[];
  monitoring_history: MonitoringHistoryRecord[];
}

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
