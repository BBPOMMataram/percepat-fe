/**
 * Pure Utility Detection Functions untuk Tabel RHPK SIPROVAL
 */

import type { ColumnSchema, RowData } from "../types/tableTypes";
import {
  NUMERIC_HEADER_RE,
  NARRATIVE_HEADER_RE,
  MIN_MONTH_COLUMN_GROUPS,
  MIN_ROWS_FOR_VERTICAL_MONTH,
  STANDALONE_MONTH_COLUMN_LABELS,
  STANDARD_MONTH_NAMES,
} from "../constants/tableConstants";
import { getMonthNumberFromText } from "./tableFormatting";

export function isKendalaCol(headerName?: string | null): boolean {
  const h = (headerName || "").toLowerCase();
  return h.includes("kendala");
}

export function isRtlCol(headerName?: string | null): boolean {
  const h = (headerName || "").toLowerCase();
  if (h.includes("rencana tindak lanjut") || /\brtl\b/i.test(h)) return true;
  if (
    h.includes("tindak lanjut") &&
    !/(%|persen|bobot|jumlah|sampel|surat|sesuai|kualitas|ketepatan|laporan|indikator|formula|perhitungan|capaian)/i.test(
      h,
    )
  ) {
    return true;
  }
  return false;
}

export function isCellContentFilled(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  return s !== "" && s !== "-" && s !== "/";
}

/**
 * Judul "milik" kolom itu sendiri: sub_label, atau bagian terakhir label multi-indikator
 * ("Nilai AKIP - Rekomendasi" -> "Rekomendasi")
 */
export function getOwnColumnHeader(col: ColumnSchema): string {
  const sub = String((col as any).sub_label || "").trim();
  if (sub) return sub.toLowerCase();
  const label = String(col.label || "").trim();
  const parts = label.split(" - ");
  return (parts.length > 1 ? parts[parts.length - 1] : label).toLowerCase();
}

/**
 * Aturan terpadu deteksi kolom kolaboratif (sama dengan ApiLocalRhpkTestController::isCollaborativeColumn di backend)
 */
export function isCollaborativeCol(col: ColumnSchema): boolean {
  if (col.type === "formula" || col.type === "readonly") return false;
  if (col.is_collaborative === true) return true;

  const sub = String((col as any).sub_label || "").toLowerCase();
  const label = (col.label || "").toLowerCase();

  // 1. Kendala & RTL selalu kolom catatan kolaboratif
  if (isKendalaCol(sub) || isKendalaCol(label)) return true;
  if (isRtlCol(sub) || isRtlCol(label)) return true;

  // 2. Nilai sub_label diperiksa lebih dulu: "Jumlah rekomendasi ..." = angka, "Rekomendasi" = catatan
  const own = getOwnColumnHeader(col);
  if (NUMERIC_HEADER_RE.test(own)) return false;
  return NARRATIVE_HEADER_RE.test(own);
}

/**
 * Helper untuk mendeteksi apakah suatu baris merupakan baris summary/total
 */
export function isSummaryOrTotalRow(r?: RowData | null): boolean {
  if (!r?.cells) return false;
  const keys = ["col_0", "col_1", "col_2", "col_3", "col_4"];
  for (const k of keys) {
    const val = r.cells[k];
    if (typeof val === "string") {
      const lower = val.toLowerCase().trim();
      if (
        lower === "total" ||
        lower === "jumlah" ||
        lower.startsWith("total ") ||
        lower.startsWith("jumlah ") ||
        lower === "rata-rata" ||
        lower === "rata - rata" ||
        lower === "average" ||
        lower.startsWith("rata-rata") ||
        lower.startsWith("rata - rata")
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Helper deteksi kolom editable kumulatif (cth: G2=40+g1 atau formula =G3+13)
 */
export function isCumulativeCol(col?: ColumnSchema | null): boolean {
  if (!col) return false;
  if (col.type === "formula" || col.type === "readonly") return false;
  const l = (col.label || "").toLowerCase();
  const sub = ((col as any).sub_label || "").toLowerCase();
  // Kolom Penandaan pada Caput RO Spl Pangan (PIRT) bertipe mandiri per bulan (non-kumulatif)
  if (
    l.includes("dievaluasi penandaan") ||
    sub.includes("dievaluasi penandaan")
  ) {
    return false;
  }
  // Jika kolom secara eksplisit bertipe editable biasa ('editable'):
  // Patuhi status editable biasa dan JANGAN masukkan jadi kumulatif kecuali is_cumulative diset true!
  if (col.type === "editable") {
    return Boolean((col as any).is_cumulative);
  }
  if ((col as any).is_cumulative) return true;
  if (
    col.type === "editable_cumulative" ||
    col.type === "editable_collab_cumulative"
  )
    return true;
  const formula = (col.formula || "").trim();
  const letter = (col.col_letter || "").trim().toUpperCase();
  if (formula && letter) {
    // Format formula cth: =G3+13, =G2+11, =H3+13, =G+13, =G+, =F8, =G8
    const regex = new RegExp(`^=?\\s*${letter}\\d*(\\+|$)`, "i");
    if (regex.test(formula)) return true;
  }
  if (l.includes("%") || l.includes("persen")) return false;
  if (
    l.includes("kumulatif") ||
    l.includes("sd bulan") ||
    l.includes("s.d. bulan") ||
    l.includes("s/d bulan") ||
    l.includes("s.d") ||
    l.includes("capaian sd") ||
    l.includes("realisasi sd") ||
    l.includes("jumlah sd") ||
    l.includes("total kumulatif") ||
    l.includes("ditindaklanjuti") ||
    l.includes("diberikan kepada") ||
    l.includes("sarana yang diperiksa") ||
    l.includes("sampel yang diuji") ||
    l.includes("renlak") ||
    l.includes("tepat waktu")
  ) {
    return true;
  }
  return false;
}

/**
 * Helper deteksi apakah tabel menggunakan struktur horizontal (bulan ada di kolom)
 */
export function isHorizontalTable(columns?: ColumnSchema[] | null): boolean {
  if (!columns || columns.length === 0) return false;
  const monthColsCount = columns.filter((c) => {
    const pHeader = c.parent_header || "";
    const lbl = c.label || "";
    return (
      getMonthNumberFromText(pHeader) !== null ||
      getMonthNumberFromText(lbl) !== null
    );
  }).length;
  return monthColsCount >= 3;
}

/**
 * Tentukan tata letak bulan sebuah tab:
 * - true  = horizontal (bulan berada di kelompok kolom, mis. JAN | FEB | ... pada tab A. Capaian RAPK)
 * - false = vertikal (satu baris per bulan / per data).
 *
 * Urutan pemeriksaan:
 * 1. Ada kolom "Bulan"/"Periode" mandiri -> vertikal.
 * 2. Kolom dikelompokkan per bulan (parent_header / sub_parent) -> horizontal. Diperiksa SEBELUM penanda bulan
 *    pada baris, karena server dapat menandai bulan baris dari teks narasi (mis. kendala yang menyebut "Juli").
 * 3. Cukup banyak baris bertanda bulan -> vertikal.
 * 4. Label kolom berisi nama bulan -> horizontal.
 */
/** Bentuk minimal kolom & baris yang dibutuhkan isHorizontalMonthLayout (dipakai tabel Ketua Tim maupun PIC). */
export interface MonthLayoutColumn {
  label?: string | null;
  sub_label?: string | null;
  parent_header?: string | null;
  sub_parent?: string | null;
}
export interface MonthLayoutRow {
  month?: number | null;
}

export function isHorizontalMonthLayout(
  columns?: MonthLayoutColumn[] | null,
  rows?: MonthLayoutRow[] | null,
): boolean {
  if (!columns || columns.length === 0) return false;

  const standaloneLabels: readonly string[] = STANDALONE_MONTH_COLUMN_LABELS;
  const hasStandaloneMonthCol = columns.some((c) => {
    const label = (c.label || "").trim().toLowerCase();
    const sub = (c.sub_label || "").trim().toLowerCase();
    return (
      standaloneLabels.includes(label) ||
      standaloneLabels.includes(sub) ||
      label.startsWith(`${standaloneLabels[0]} `)
    );
  });
  if (hasStandaloneMonthCol) return false;

  const distinctMonths = (texts: Array<string | null | undefined>): number => {
    const months = new Set<number>();
    texts.forEach((t) => {
      const m = getMonthNumberFromText(t);
      if (m !== null) months.add(m);
    });
    return months.size;
  };

  const groupMonthCount = distinctMonths(
    columns.flatMap((c) => [c.parent_header, c.sub_parent]),
  );
  if (groupMonthCount >= MIN_MONTH_COLUMN_GROUPS) return true;

  const dataRows = rows || [];
  const hasMonthRows = dataRows.some(
    (r) =>
      typeof r?.month === "number" &&
      r.month >= 1 &&
      r.month <= STANDARD_MONTH_NAMES.length,
  );
  if (dataRows.length >= MIN_ROWS_FOR_VERTICAL_MONTH && hasMonthRows) return false;

  return distinctMonths(columns.map((c) => c.label)) >= MIN_MONTH_COLUMN_GROUPS;
}

/**
 * Apakah `row` (pada indeks array `arrayIdx`) adalah baris yang sedang diedit?
 * Baris diidentifikasi lewat row_index (unik per tab). Nomor bulan hanya dipakai bila row_index
 * tidak diketahui, karena row_index (mulai 0) dan bulan (mulai 1) berbeda ruang nilai:
 * mencampurnya membuat edit November ikut menimpa Oktober.
 */
export function isTargetRow(
  row: RowData,
  arrayIdx: number,
  rowKey: number,
  rowIndex?: number | null,
): boolean {
  if (rowIndex !== undefined && rowIndex !== null) {
    return row.row_index !== undefined && row.row_index !== null
      ? row.row_index === rowIndex
      : arrayIdx === rowIndex;
  }
  const key =
    row.month !== undefined && row.month !== null && row.month !== 0
      ? row.month
      : row.row_index !== undefined && row.row_index !== null
        ? row.row_index
        : arrayIdx;
  return key === rowKey;
}

/** Nomor bulan (1..12) milik baris tujuan edit untuk dikirim ke server; 0 bila bukan baris bulan. */
export function getRowUpdateMonth(
  rows: RowData[] | null | undefined,
  rowKey: number,
  rowIndex?: number | null,
): number {
  const list = rows || [];
  const target = list.find((r, idx) => isTargetRow(r, idx, rowKey, rowIndex));
  const month = target?.month;
  return typeof month === "number" &&
    month >= 1 &&
    month <= STANDARD_MONTH_NAMES.length
    ? month
    : 0;
}

/**
 * Helper identifikasi Tab Data detil pengujian khusus IKSK 1 (Sediaan Farmasi Berisiko)
 */
export function isIksk1DetilPengujianTab(
  tabTitle?: string | null,
  spName?: string | null,
): boolean {
  const t = (tabTitle || "").toLowerCase();
  const s = (spName || "").toLowerCase();
  const isDetil = t.includes("detil pengujian") || t.includes("detail pengujian");
  const isIksk1 = s.includes("sediaan farmasi") || s.includes("sampel sediaan farmasi");
  return isDetil && isIksk1;
}
