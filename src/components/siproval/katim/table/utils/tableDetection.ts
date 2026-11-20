/**
 * Pure Utility Detection Functions untuk Tabel RHPK SIPROVAL
 */

import type { ColumnSchema, RowData } from "../types/tableTypes";
import { NUMERIC_HEADER_RE, NARRATIVE_HEADER_RE } from "../constants/tableConstants";
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
