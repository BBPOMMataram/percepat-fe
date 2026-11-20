import React from "react";

export type TabItem = {
  id: number;
  spreadsheet_id: number;
  title: string;
};

export type SpreadsheetItem = {
  id: number;
  name: string;
  year: number;
  is_readonly?: boolean;
  is_balai_rekap?: boolean;
  tabs: TabItem[];
};

export type ColumnSchema = {
  key: string;
  col_letter: string;
  label: string;
  type:
    | "readonly"
    | "editable"
    | "formula"
    | "editable_cumulative"
    | "editable_collab_cumulative";
  formula: string | null;
  can_edit: boolean;
  allowed_katim_ids?: string[];
  is_collaborative?: boolean;
  is_cumulative?: boolean;
  is_kendala?: boolean;
  is_rtl?: boolean;
  parent_header?: string | null;
  sub_label?: string | null;
  sub_parent?: string | null;
  hidden?: boolean;
  is_hidden?: boolean;
};

export type RowData = {
  row_index?: number;
  month?: number;
  month_name?: string;
  is_locked: boolean;
  is_current: boolean;
  can_edit_row?: boolean;
  pic_name?: string;
  row_name?: string;
  is_month_row?: boolean;
  is_total?: boolean;
  is_updated?: boolean;
  // Baris yang ditambahkan di browser dan belum tersimpan ke server
  is_new_client_row?: boolean;
  // Rumus asli tiap sel & nomor baris Excel (dari impor file) untuk perhitungan ulang yang benar
  formulas?: Record<string, string> | null;
  errors?: Record<string, string> | null;
  excel_row?: number | null;
  cells: Record<string, any>;
};

export type ActiveTabDetail = {
  id: number;
  title: string;
  columns_schema: ColumnSchema[];
  rows_data: RowData[];
};

export type YearItem = {
  id: number;
  year_number: number;
  desc?: string;
};

export type IkskItem = {
  id: number;
  name: string;
};

export type NoteItem = {
  num?: number | null;
  text: string;
  author: string;
};

export type IncompleteValidationModal = {
  isOpen: boolean;
  rowIndex: number;
  rowKey: number;
  monthName: string;
  isKendalaMissing: boolean;
  isRtlMissing: boolean;
  kendalaCol?: ColumnSchema;
  rtlCol?: ColumnSchema;
};

export type ValidationModalState = IncompleteValidationModal;

export type CollabModalState = {
  isOpen: boolean;
  rowKey: number;
  rowIndex?: number;
  colKey: string;
  colLabel: string;
  colLetter: string;
  monthName: string;
  isLocked: boolean;
  notes: NoteItem[];
  newNoteText: string;
  editingIndex: number | null;
  editingText: string;
};

export type ConfirmDialogState = {
  tone: "emerald" | "amber" | "rose";
  icon: string;
  title: string;
  message: string;
  // Teks peringatan tebal di bawah pesan utama (cth: "Data akan terupdate")
  note?: string;
  details?: string[];
  warnings?: string[];
  confirmLabel: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  onConfirm: () => void;
};

export type RowFormulaContext = {
  formulas?: Record<string, string> | null;
  // Sel yang di Excel bernilai galat (#DIV/0! dsb.; disimpan 0 untuk tampilan)
  errors?: Record<string, string> | null;
  excel_row?: number | null;
};

export interface TestLocalTableKatimProps {
  isKabalaiReadOnly?: boolean;
  rekapBalaiOnly?: boolean;
  headerRightSlot?: React.ReactNode;
}

export interface CollabNumModalState {
  isOpen: boolean;
  rowKey: number;
  rowIndex: number;
  monthName: string;
  col: ColumnSchema;
  contributors: Record<
    string,
    { user_id: string; author: string; value: number; updated_at?: string }
  >;
  myValue: string;
  canEdit: boolean;
}

export type HeaderGroup = {
  parent: string | null;
  cols: ColumnSchema[];
};
