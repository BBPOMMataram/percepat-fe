"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import * as XLSX from "xlsx";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

type TabItem = {
  id: number;
  spreadsheet_id: number;
  title: string;
};

type SpreadsheetItem = {
  id: number;
  name: string;
  year: number;
  is_readonly?: boolean;
  is_balai_rekap?: boolean;
  tabs: TabItem[];
};

type ColumnSchema = {
  key: string;
  col_letter: string;
  label: string;
  type: "readonly" | "editable" | "formula" | "editable_cumulative" | "editable_collab_cumulative";
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

type RowData = {
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
  cells: Record<string, any>;
};

type ActiveTabDetail = {
  id: number;
  title: string;
  columns_schema: ColumnSchema[];
  rows_data: RowData[];
};

type YearItem = {
  id: number;
  year_number: number;
  desc?: string;
};

type IkskItem = {
  id: number;
  name: string;
};

export type NoteItem = {
  num?: number | null;
  text: string;
  author: string;
};

export function isKendalaCol(headerName?: string | null): boolean {
  const h = (headerName || "").toLowerCase();
  return h.includes("kendala");
}

export function isRtlCol(headerName?: string | null): boolean {
  const h = (headerName || "").toLowerCase();
  if (h.includes("rencana tindak lanjut") || /\brtl\b/i.test(h)) return true;
  if (
    h.includes("tindak lanjut") &&
    !/(%|persen|bobot|jumlah|sampel|surat|sesuai)/i.test(h)
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

export function isCollaborativeCol(col: ColumnSchema): boolean {
  if (col.is_collaborative) return true;
  const label = (col.label || "").toLowerCase();
  if (isKendalaCol(label) || isRtlCol(label)) return true;
  const isNumericHeader =
    /(jumlah|target|persentase|%|realisasi|skor|nilai|rasio|bobot|anggaran|total|\ba[1-9]\b|\bb[1-9]?\b|\bc[1-9]?\b)/i.test(
      label,
    );
  if (isNumericHeader) return false;
  return /(catatan|keterangan|deskripsi|uraian|rekomendasi)/i.test(label);
}

export function getMonthColor(monthName?: string | null) {
  let m = (monthName || "").toUpperCase().trim();
  m = m.replace(/^S[\.\/]?D[\.\s]+/i, "").trim();
  if (m === "PEBRUARI") m = "FEBRUARI";
  if (m === "NOPEMBER") m = "NOVEMBER";
  switch (m) {
    case "JANUARI":
      return {
        header: "bg-[#fce8e6] text-[#991b1b] border-r border-rose-300",
        sub: "bg-[#fff5f5] text-slate-700",
        dot: "bg-[#e11d48]",
      };
    case "FEBRUARI":
      return {
        header: "bg-[#f3e8fd] text-[#581c87] border-r border-purple-300",
        sub: "bg-[#faf5ff] text-slate-700",
        dot: "bg-[#9333ea]",
      };
    case "MARET":
      return {
        header: "bg-[#fef7e0] text-[#78350f] border-r border-amber-300",
        sub: "bg-[#fffbeb] text-slate-700",
        dot: "bg-[#d97706]",
      };
    case "APRIL":
      return {
        header: "bg-[#e6f4ea] text-[#064e3b] border-r border-emerald-300",
        sub: "bg-[#f0fdf4] text-slate-700",
        dot: "bg-[#059669]",
      };
    case "MEI":
      return {
        header: "bg-[#e8f0fe] text-[#1e3a8a] border-r border-blue-300",
        sub: "bg-[#eff6ff] text-slate-700",
        dot: "bg-[#2563eb]",
      };
    case "JUNI":
      return {
        header: "bg-[#ede9fe] text-[#3730a3] border-r border-indigo-300",
        sub: "bg-[#f5f3ff] text-slate-700",
        dot: "bg-[#4f46e5]",
      };
    case "JULI":
      return {
        header: "bg-[#ffedd5] text-[#9a3412] border-r border-orange-300",
        sub: "bg-[#fff7ed] text-slate-700",
        dot: "bg-[#ea580c]",
      };
    case "AGUSTUS":
      return {
        header: "bg-[#ccfbf1] text-[#115e59] border-r border-teal-300",
        sub: "bg-[#f0fdfa] text-slate-700",
        dot: "bg-[#0d9488]",
      };
    case "SEPTEMBER":
      return {
        header: "bg-[#fef9c3] text-[#854d0e] border-r border-yellow-300",
        sub: "bg-[#fefce8] text-slate-700",
        dot: "bg-[#ca8a04]",
      };
    case "OKTOBER":
      return {
        header: "bg-[#cffafe] text-[#155e75] border-r border-cyan-300",
        sub: "bg-[#ecfeff] text-slate-700",
        dot: "bg-[#0891b2]",
      };
    case "NOVEMBER":
      return {
        header: "bg-[#e0f2fe] text-[#075985] border-r border-sky-300",
        sub: "bg-[#f0f9ff] text-slate-700",
        dot: "bg-[#0284c7]",
      };
    case "DESEMBER":
      return {
        header: "bg-[#ffe4e6] text-[#9f1239] border-r border-rose-300",
        sub: "bg-[#fff1f2] text-slate-700",
        dot: "bg-[#e11d48]",
      };
    default:
      return {
        header: "bg-slate-100 text-slate-800 border-r border-slate-300",
        sub: "bg-slate-50 text-slate-700",
        dot: "bg-slate-500",
      };
  }
}

export function parseNotes(raw: unknown): NoteItem[] {
  const rawText = String(raw ?? "").trim();
  if (!rawText || rawText === "-" || rawText === "/") return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const result: NoteItem[] = [];

  lines.forEach((line, idx) => {
    // 1. Check (+ Name) or (Name) at end
    let match = line.match(
      /^(?:(\d+)[\.\)]\s*)?(.*?)(?:\s*\(\+?\s*([^\(\)]+)\))$/,
    );
    if (match && match[2]) {
      result.push({
        num: match[1] ? parseInt(match[1], 10) : idx + 1,
        text: match[2].trim(),
        author: match[3].trim().replace(/^\+\s*/, ""),
      });
      return;
    }
    // 2. Check + Name at end
    match = line.match(
      /^(?:(\d+)[\.\)]\s*)?(.*?)(?:\s*\+\s*([a-zA-Z\s\.,]+))$/,
    );
    if (match && match[2] && match[3]) {
      result.push({
        num: match[1] ? parseInt(match[1], 10) : idx + 1,
        text: match[2].trim(),
        author: match[3].trim().replace(/^\+\s*/, ""),
      });
      return;
    }
    // 3. Fallback without author
    match = line.match(/^(?:(\d+)[\.\)]\s*)?(.*)$/);
    result.push({
      num: match && match[1] ? parseInt(match[1], 10) : idx + 1,
      text: (match && match[2] ? match[2] : line).trim(),
      author: "",
    });
  });

  return result;
}

export function formatNotes(notes: NoteItem[]): string {
  return notes
    .filter((n) => n.text.trim())
    .map((n, idx) => {
      const cleanAuthor = (n.author || "").replace(/^\+\s*/, "").trim();
      const authorPart = cleanAuthor ? ` (+ ${cleanAuthor})` : "";
      return `${idx + 1}. ${n.text.trim()}${authorPart}`;
    })
    .join("\n");
}

export function getPageNumbers(
  current: number,
  total: number,
): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function resolveRowMonthName(
  r: RowData,
  monthColKey?: string | null,
): string {
  if (
    monthColKey &&
    r.cells?.[monthColKey] &&
    String(r.cells[monthColKey]).trim()
  ) {
    return String(r.cells[monthColKey]).trim();
  }
  if (r.month_name && typeof r.month_name === "string" && r.month_name.trim()) {
    return r.month_name.trim();
  }
  if (r.cells?.col_2 && typeof r.cells.col_2 === "string") {
    const val = r.cells.col_2.trim();
    if (
      /(januari|februari|pebruari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)/i.test(
        val,
      )
    ) {
      return val;
    }
  }
  if (r.cells?.col_0 && typeof r.cells.col_0 === "string") {
    const val = r.cells.col_0.trim();
    if (
      /(januari|februari|pebruari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)/i.test(
        val,
      )
    ) {
      return val;
    }
  }
  if (r.month && r.month >= 1 && r.month <= 12) {
    const standardOrder = [
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
    return standardOrder[r.month - 1];
  }
  return "";
}

type CollabModalState = {
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

export const STANDARD_MONTH_NAMES = [
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

export function getMonthNumberFromText(text?: string | null): number | null {
  if (!text) return null;
  let t = text.trim().toLowerCase();
  t = t.replace(/^(s[\.\/]?d[\.\s]+|sampai\s+dengan\s+)/i, "").trim();

  const map: Record<string, number> = {
    januari: 1,
    jan: 1,
    january: 1,
    februari: 2,
    feb: 2,
    pebruari: 2,
    february: 2,
    maret: 3,
    mar: 3,
    march: 3,
    april: 4,
    apr: 4,
    mei: 5,
    may: 5,
    juni: 6,
    jun: 6,
    june: 6,
    juli: 7,
    jul: 7,
    july: 7,
    agustus: 8,
    agu: 8,
    ags: 8,
    agst: 8,
    august: 8,
    september: 9,
    sep: 9,
    sept: 9,
    oktober: 10,
    okt: 10,
    oct: 10,
    october: 10,
    november: 11,
    nov: 11,
    nopember: 11,
    desember: 12,
    des: 12,
    dec: 12,
    december: 12,
  };

  if (map[t]) return map[t];

  for (const [key, num] of Object.entries(map)) {
    if (
      t.startsWith(key + " ") ||
      t.startsWith(key + " -") ||
      t.startsWith(key + "-") ||
      t.startsWith(key + ":") ||
      t.startsWith(key + "/") ||
      t.startsWith(key + "(")
    ) {
      return num;
    }
  }

  for (const [key, num] of Object.entries(map)) {
    if (
      t.endsWith(" " + key) ||
      t.endsWith("-" + key) ||
      t.endsWith("/" + key)
    ) {
      return num;
    }
  }

  return null;
}

// Helper deteksi kolom editable kumulatif (cth: G2=40+g1 atau formula =G3+13)
export function isCumulativeCol(col?: ColumnSchema | null): boolean {
  if (!col) return false;
  if ((col as any).is_cumulative) return true;
  const formula = (col.formula || "").trim();
  const letter = (col.col_letter || "").trim().toUpperCase();
  if (formula && letter) {
    // Format formula cth: =G3+13, =G2+11, =H3+13, =G+13, =G+, =F8, =G8
    const regex = new RegExp(`^=?\\s*${letter}\\d*(\\+|$)`, "i");
    if (regex.test(formula)) return true;
  }
  const l = (col.label || "").toLowerCase();
  if (
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

// Helper kalkulasi kolom kumulatif berjenjang: i = input + (i-1)
export const recalculateCumulativeRows = (
  rows: RowData[],
  columns: ColumnSchema[],
): RowData[] => {
  if (!rows || rows.length === 0 || !columns || columns.length === 0)
    return rows;

  const cumCols = columns.filter((c) => isCumulativeCol(c));
  if (cumCols.length === 0) return rows;

  const newRows = rows.map((r) => ({
    ...r,
    cells: { ...r.cells },
  }));

  cumCols.forEach((col) => {
    let runningTotal = 0;
    for (let i = 0; i < newRows.length; i++) {
      const inputKey = `${col.key}_input`;
      const contribKey = `${col.key}_contributors`;

      const contribs = newRows[i].cells[contribKey];
      const hasContrib =
        contribs &&
        typeof contribs === "object" &&
        Object.keys(contribs).length > 0;

      const hasInput =
        newRows[i].cells[inputKey] !== undefined &&
        newRows[i].cells[inputKey] !== null &&
        newRows[i].cells[inputKey] !== "";

      const cellVal = newRows[i].cells[col.key];
      const isEmpty =
        cellVal === undefined || cellVal === null || cellVal === "";

      let monthlyDelta = 0;
      let hasMonthActivity = false;

      if (hasContrib) {
        let cSum = 0;
        Object.values(contribs).forEach((c: any) => {
          cSum += parseFloat(String(c?.value || 0).replace(",", ".")) || 0;
        });
        monthlyDelta = cSum;
        newRows[i].cells[inputKey] = cSum;
        hasMonthActivity = true;
      } else if (hasInput) {
        monthlyDelta = parseFloat(String(newRows[i].cells[inputKey]).replace(",", ".")) || 0;
        hasMonthActivity = true;
      } else if (!isEmpty && !isNaN(Number(String(cellVal).replace(",", ".")))) {
        const currentVal = parseFloat(String(cellVal).replace(",", ".")) || 0;
        if (i === 0) {
          monthlyDelta = currentVal;
        } else {
          monthlyDelta =
            currentVal >= runningTotal && runningTotal > 0
              ? currentVal - runningTotal
              : currentVal;
        }
        newRows[i].cells[inputKey] = monthlyDelta;
        hasMonthActivity = true;
      }

      if (hasMonthActivity) {
        runningTotal += monthlyDelta;
        newRows[i].cells[col.key] = Math.round(runningTotal * 100) / 100;
      } else if (runningTotal > 0 && !isEmpty) {
        // Carry-over nilai bulan sebelumnya jika ada baris aktif
        newRows[i].cells[col.key] = Math.round(runningTotal * 100) / 100;
      }
    }
  });

  return newRows;
};

// Helper evaluasi dan kalkulasi formula otomatis per baris data
export const recalculateRowFormulas = (
  cells: Record<string, any>,
  columns: ColumnSchema[],
): Record<string, any> => {
  const updatedCells = { ...cells };

  const excelMathEnv = {
    sum: (...args: any[]) =>
      args
        .flat(Infinity)
        .reduce((a: number, b: number) => Number(a) + (Number(b) || 0), 0),
    average: (...args: any[]) => {
      const flat = args
        .flat(Infinity)
        .filter((x: any) => typeof x === "number" && !isNaN(x));
      return flat.length
        ? flat.reduce((a: number, b: number) => a + b, 0) / flat.length
        : 0;
    },
    min: Math.min,
    max: Math.max,
    abs: Math.abs,
    round: Math.round,
    if: (cond: any, a: any, b: any) => (cond ? a : b),
    na: () => 0,
  };

  columns.forEach((col) => {
    if (col.type === "formula" && col.formula) {
      let expr = col.formula.trim();
      if (expr.startsWith("=")) {
        expr = expr.slice(1).trim();
      }

      // 1. Ganti persentase angka misal 20% -> (20/100) atau 70% -> (70/100)
      expr = expr.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");

      // 2. Hilangkan nomor baris Excel jika ada, misal G2 -> G, H2 -> H, I11 -> I
      // Memastikan rumus template baris selalu mengacu pada sel di baris data berjalan ini
      expr = expr.replace(/([A-Za-z]+)\d+/g, "$1");

      // 3. Buat token map untuk huruf kolom dan key kolom baris saat ini
      const tokenMap: Record<string, number> = {};
      columns.forEach((c) => {
        const letter = (c.col_letter || "").toUpperCase().trim();
        const rawVal = updatedCells[c.key];
        const numVal =
          rawVal !== undefined &&
          rawVal !== null &&
          rawVal !== "" &&
          !isNaN(Number(rawVal))
            ? Number(rawVal)
            : 0;
        if (letter) {
          tokenMap[letter] = numVal;
        }
        tokenMap[c.key] = numVal;
      });

      // 4. Urutkan token terpanjang lebih dahulu untuk mencegah partial replacement
      const tokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
      for (const tok of tokens) {
        const regex = new RegExp(`\\b${tok}\\b`, "gi");
        expr = expr.replace(regex, String(tokenMap[tok]));
      }

      // 5. Cek pembagian dengan 0 secara aman
      if (/\/\s*0+(\.0+)?(?!\d)/.test(expr)) {
        updatedCells[col.key] = 0;
        return;
      }

      // 6. Tangani fungsi matematika umum Excel
      expr = expr
        .replace(/\bif\s*\(/gi, "excelMathEnv.if(")
        .replace(/\bna\s*\(\s*\)/gi, "excelMathEnv.na()")
        .replace(/\bsum\s*\(/gi, "excelMathEnv.sum(")
        .replace(/\baveragea?\s*\(/gi, "excelMathEnv.average(")
        .replace(/\bmin\s*\(/gi, "excelMathEnv.min(")
        .replace(/\bmax\s*\(/gi, "excelMathEnv.max(")
        .replace(/\babs\s*\(/gi, "excelMathEnv.abs(")
        .replace(/\bround\s*\(/gi, "excelMathEnv.round(");

      // 7. Evaluasi ekspresi aritmatika aman
      const sanitized = expr.replace(
        /excelMathEnv\.(if|na|sum|average|min|max|abs|round)/g,
        "",
      );
      if (/^[\d\+\-\*/\(\)\,\.\s><=!]+$/.test(sanitized)) {
        try {
          const res = Function(
            "excelMathEnv",
            `"use strict"; return (${expr})`,
          )(excelMathEnv);
          if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
            let calculatedVal = Math.round(res * 100) / 100;

            // 1. Normalisasi Bobot (Bobot X%) sesuai Pedoman SAKIP
            // Jika kolom memiliki pembobotan (misal Bobot 20%, Bobot 70%, Bobot 10%), nilai maksimal dibatasi sebesar bobotnya
            const colMetaText = `${col.label || ""} ${col.parent_header || ""} ${col.sub_label || ""}`;
            const weightMatch = colMetaText.match(
              /bobot\s*:?\s*(\d+(?:\.\d+)?)\s*%/i,
            );
            if (weightMatch) {
              const maxWeight = parseFloat(weightMatch[1]);
              if (calculatedVal > maxWeight) {
                calculatedVal = maxWeight;
              }
            }

            // 2. Normalisasi Capaian RO / Indikator (Maksimal 110%) sesuai Pedoman SAKIP (Lampiran II Halaman 27)
            // "Jika capaian kinerja setiap indikator > 110% maka dinormalisasi menjadi 110%; jika <= 110% maka tidak dilakukan normalisasi"
            const isCapaianOrRo =
              /\b(capaian\s*ro|realisasi\s*ro|%\s*capaian|capaian\s*indikator|normalisasi|nko)\b/i.test(
                colMetaText,
              );
            if (isCapaianOrRo && calculatedVal > 110) {
              calculatedVal = 110;
            }

            updatedCells[col.key] = calculatedVal;
          } else {
            updatedCells[col.key] = 0;
          }
        } catch {
          // Abaikan jika ada kesalahan parsing matematika
        }
      }
    }
  });

  return updatedCells;
};

export default function TestLocalTableKatim() {
  const { user } = useSelector((state: RootState) => state.auth);
  const authQuery = user?.id ? `?user_id=${user.id}` : "";

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const paramIkskId = searchParams?.get("iksk_id") || searchParams?.get("iksk");
  const paramSpreadsheetId =
    searchParams?.get("spreadsheet_id") || searchParams?.get("spreadsheet");
  const paramTabId = searchParams?.get("tab_id") || searchParams?.get("tab");

  const [years, setYears] = useState<YearItem[]>([
    { id: 1, year_number: 2026 },
  ]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [iksks, setIksks] = useState<IkskItem[]>([]);
  const [selectedIkskId, setSelectedIkskId] = useState<number | null>(
    paramIkskId ? Number(paramIkskId) : null,
  );
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [selectedSpId, setSelectedSpId] = useState<number | null>(
    paramSpreadsheetId ? Number(paramSpreadsheetId) : null,
  );
  const [selectedTabId, setSelectedTabId] = useState<number | null>(
    paramTabId ? Number(paramTabId) : null,
  );
  const [activeTab, setActiveTab] = useState<ActiveTabDetail | null>(null);
  const [katims, setKatims] = useState<any[]>([]);

  const activeSpreadsheet = useMemo(() => {
    return spreadsheets.find((s) => s.id === selectedSpId) || null;
  }, [spreadsheets, selectedSpId]);
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth() + 1,
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal catatan kolaboratif (Kendala / RTL / Catatan PIC)
  const [collabModal, setCollabModal] = useState<CollabModalState | null>(null);
  const [savingCollab, setSavingCollab] = useState(false);

  // Tracking dirty edits before saving
  const [dirtyUpdates, setDirtyUpdates] = useState<
    Record<
      string,
      { month?: number; row_index?: number; key: string; value: any }
    >
  >({});

  // Export Excel dropdown state (Point 3)
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);

  // Modal Kolaborasi Angka Multi-Katim (Point 6)
  interface CollabNumModalState {
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
  const [collabNumModal, setCollabNumModal] =
    useState<CollabNumModalState | null>(null);

  // Modal validasi Kendala & RTL wajib diisi saat simpan perubahan
  const [validationModal, setValidationModal] =
    useState<IncompleteValidationModal | null>(null);
  const [highlightedIncompleteRows, setHighlightedIncompleteRows] = useState<
    number[]
  >([]);

  // Pagination & Filter state untuk tabel dengan banyak baris (misal KIE Medsos)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelMode, setExcelMode] = useState<"append" | "replace">("append");
  const [excelParsedRows, setExcelParsedRows] = useState<any[]>([]);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [excelSaving, setExcelSaving] = useState<boolean>(false);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  const [isPicUser, setIsPicUser] = useState(false);
  const isPicEffective =
    isPicUser ||
    Boolean(pathname?.includes("/siproval/pic")) ||
    Boolean(pathname?.includes("/siproval/admin"));
  const [isCurrentMonthLocked, setIsCurrentMonthLocked] = useState(false);
  const [monthLocksMap, setMonthLocksMap] = useState<Record<number, boolean>>(
    {},
  );
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  // State untuk Modal Upload / Import Excel
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<"tab" | "spreadsheet">("tab");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Jika user teridentifikasi sebagai murni PIC/Admin (dan BUKAN Katim) yang mengakses endpoint /siproval/katim/entry-data-rhpk,
  // alihkan secara halus ke endpoint resmi PIC: /siproval/admin/entry-data-rhpk
  useEffect(() => {
    const isKatimUser =
      user?.employee?.group_jabatan_id === 3 ||
      (Array.isArray(user?.katims) && user.katims.length > 0);

    if (
      !isKatimUser &&
      isPicUser &&
      pathname === "/siproval/katim/entry-data-rhpk"
    ) {
      const search = window.location.search || "";
      router.replace(`/siproval/admin/entry-data-rhpk${search}`);
    }
  }, [isPicUser, pathname, router, user]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setSelectedMonthFilter("all");
  }, [activeTab?.id]);

  const fetchData = async (
    targetYear = selectedYear,
    ikskId?: number | null,
    spId?: number | null,
    tId?: number | null,
  ) => {
    setLoading(true);
    try {
      const qYear = `&year=${targetYear}`;
      const effectiveIkskId =
        ikskId !== undefined && ikskId !== null
          ? ikskId
          : selectedIkskId !== null
            ? selectedIkskId
            : paramIkskId
              ? Number(paramIkskId)
              : null;
      const qIksk = effectiveIkskId ? `&iksk_id=${effectiveIkskId}` : "";

      // Ketika beralih IKSK, spId & tId diset null sehingga tidak memakai fallback spreadsheet/tab lama
      const isSwitchingIksk =
        ikskId !== undefined && ikskId !== null && ikskId !== selectedIkskId;
      const effectiveSpId =
        spId !== undefined
          ? spId
          : isSwitchingIksk
            ? null
            : selectedSpId !== null
              ? selectedSpId
              : paramSpreadsheetId
                ? Number(paramSpreadsheetId)
                : null;
      const qSp = effectiveSpId ? `&spreadsheet_id=${effectiveSpId}` : "";

      const effectiveTabId =
        tId !== undefined
          ? tId
          : isSwitchingIksk
            ? null
            : selectedTabId !== null
              ? selectedTabId
              : paramTabId
                ? Number(paramTabId)
                : null;
      const qTab = effectiveTabId ? `&tab_id=${effectiveTabId}` : "";

      const res = await api.get(
        `${baseUrl}/api/test-local-table${authQuery}${qYear}${qIksk}${qSp}${qTab}`,
      );
      const d = res.data?.data || {};

      if (d.is_pic !== undefined) {
        setIsPicUser(Boolean(d.is_pic));
      }
      if (d.is_current_month_locked !== undefined) {
        setIsCurrentMonthLocked(Boolean(d.is_current_month_locked));
      }
      if (d.month_locks) {
        setMonthLocksMap(d.month_locks);
      }
      if (Array.isArray(d.years) && d.years.length > 0) {
        setYears(d.years);
      }
      if (d.selected_year) {
        setSelectedYear(Number(d.selected_year));
      }
      if (Array.isArray(d.my_iksks)) {
        setIksks(d.my_iksks);
      }
      if (Array.isArray(d.katims)) {
        setKatims(d.katims);
      }
      if (d.selected_iksk_id) {
        setSelectedIkskId(Number(d.selected_iksk_id));
      }
      setSpreadsheets(d.spreadsheets || []);
      setCurrentMonth(d.current_month || new Date().getMonth() + 1);

      if (d.active_spreadsheet) {
        setSelectedSpId(d.active_spreadsheet.id);
      } else {
        setSelectedSpId(null);
      }

      if (d.active_tab) {
        setSelectedTabId(d.active_tab.id);
        const cols = d.active_tab.columns_schema || [];
        let rows = (d.active_tab.rows_data || []).map((r: any) => ({
          ...r,
          cells: r.cells || {},
        }));
        rows = recalculateCumulativeRows(rows, cols);
        rows = rows.map((r: any) => ({
          ...r,
          cells: recalculateRowFormulas(r.cells || {}, cols),
        }));
        setActiveTab({ ...d.active_tab, rows_data: rows });
      } else {
        setSelectedTabId(null);
        setActiveTab(null);
      }
      setDirtyUpdates({});
      setHighlightedIncompleteRows([]);
      setValidationModal(null);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Gagal memuat formulir tabel.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const initialIksk = paramIkskId ? Number(paramIkskId) : selectedIkskId;
      const initialSp = paramSpreadsheetId
        ? Number(paramSpreadsheetId)
        : selectedSpId;
      const initialTab = paramTabId ? Number(paramTabId) : selectedTabId;
      fetchData(selectedYear, initialIksk, initialSp, initialTab);
    }
  }, [user?.id, selectedYear, paramIkskId, paramSpreadsheetId, paramTabId]);

  const handleToggleCurrentMonthLock = async () => {
    setIsTogglingLock(true);
    try {
      const newUnlocked = isCurrentMonthLocked;
      await api.post(
        `${baseUrl}/api/test-local-table/toggle-month-lock${authQuery}`,
        {
          month: currentMonth,
          year: selectedYear,
          is_unlocked: newUnlocked,
          note: newUnlocked
            ? `Bulan ${currentMonth} dibuka oleh PIC/Admin`
            : `Bulan ${currentMonth} dikunci oleh PIC/Admin`,
        },
      );
      setIsCurrentMonthLocked(!newUnlocked);
      await fetchData();
    } catch (err: unknown) {
      console.error("Gagal mengubah status kunci bulan", err);
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    fetchData(year, selectedIkskId);
  };

  const handleSelectIksk = (ikskId: number) => {
    setSelectedIkskId(ikskId);
    setSelectedSpId(null);
    setSelectedTabId(null);
    setActiveTab(null); // Segera bersihkan tabel lama agar tidak muncul tabel IKSK sebelumnya

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("iksk_id", String(ikskId));
      url.searchParams.delete("spreadsheet_id");
      url.searchParams.delete("tab_id");
      window.history.replaceState({}, "", url.toString());
    }

    fetchData(selectedYear, ikskId, null, null);
  };

  const handleSelectSpreadsheet = (id: number) => {
    setSelectedSpId(id);
    setSelectedTabId(null);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("spreadsheet_id", String(id));
      url.searchParams.delete("tab_id");
      window.history.replaceState({}, "", url.toString());
    }

    fetchData(selectedYear, selectedIkskId, id, null);
  };

  const handleSelectTab = (tId: number) => {
    setSelectedTabId(tId);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab_id", String(tId));
      window.history.replaceState({}, "", url.toString());
    }

    if (selectedSpId) {
      fetchData(selectedYear, selectedIkskId, selectedSpId, tId);
    }
  };

  // Otomasi perhitungan untuk tabel Indeks KIE di sisi frontend
  const liveRecalculateIndeksKie = (rows: RowData[]): RowData[] => {
    if (rows.length < 18) return rows;
    const updated = rows.map((r) => ({ ...r, cells: { ...r.cells } }));

    // Col 2 s/d 24 (step 2)
    for (let colIdx = 2; colIdx <= 24; colIdx += 2) {
      const col4Key = `col_${colIdx}`;
      const col100Key = `col_${colIdx + 1}`;

      // 1. Skala 100 untuk baris pertanyaan Tatap Muka (1..4) dan Media (8..11)
      const qIndices = [1, 2, 3, 4, 8, 9, 10, 11];
      qIndices.forEach((rIdx) => {
        const v4 = updated[rIdx]?.cells?.[col4Key];
        if (v4 !== undefined && v4 !== "" && !isNaN(Number(v4))) {
          updated[rIdx].cells[col100Key] =
            Math.round((Number(v4) / 4) * 100 * 100) / 100;
        }
      });

      // 2. Indeks Tatap Muka (Row 5)
      let sum4TM = 0;
      let count4TM = 0;
      [1, 2, 3, 4].forEach((rIdx) => {
        const v = updated[rIdx]?.cells?.[col4Key];
        if (v !== undefined && v !== "" && !isNaN(Number(v))) {
          sum4TM += Number(v);
          count4TM++;
        }
      });
      if (count4TM > 0) {
        const avgTM4 = Math.round((sum4TM / count4TM) * 10000) / 10000;
        updated[5].cells[col4Key] = avgTM4;
        updated[5].cells[col100Key] =
          Math.round((avgTM4 / 4) * 100 * 100) / 100;
      }

      // 3. Indeks Media (Row 12)
      let sum4M = 0;
      let count4M = 0;
      [8, 9, 10, 11].forEach((rIdx) => {
        const v = updated[rIdx]?.cells?.[col4Key];
        if (v !== undefined && v !== "" && !isNaN(Number(v))) {
          sum4M += Number(v);
          count4M++;
        }
      });
      if (count4M > 0) {
        const avgM4 = Math.round((sum4M / count4M) * 10000) / 10000;
        updated[12].cells[col4Key] = avgM4;
        updated[12].cells[col100Key] =
          Math.round((avgM4 / 4) * 100 * 100) / 100;
      }

      // 4. Total Responden (Row 14) = Row 6 + Row 13
      const rTM = updated[6]?.cells?.[col4Key];
      const rM = updated[13]?.cells?.[col4Key];
      const nTM =
        rTM !== undefined && rTM !== "" && !isNaN(Number(rTM))
          ? Number(rTM)
          : 0;
      const nM =
        rM !== undefined && rM !== "" && !isNaN(Number(rM)) ? Number(rM) : 0;
      if (nTM > 0 || nM > 0) {
        updated[14].cells[col4Key] = nTM + nM;
      }

      // 5. Indeks Rata-rata (Row 15) = (Indeks Tatap Muka + Indeks Media) / 2
      const indTM = updated[5]?.cells?.[col4Key];
      const indM = updated[12]?.cells?.[col4Key];
      if (indTM && indM && !isNaN(Number(indTM)) && !isNaN(Number(indM))) {
        const avg4 = (Number(indTM) + Number(indM)) / 2;
        updated[15].cells[col4Key] = Math.round(avg4 * 10000) / 10000;
        const avg100 =
          (Number(updated[5]?.cells?.[col100Key] || 0) +
            Number(updated[12]?.cells?.[col100Key] || 0)) /
          2;
        updated[15].cells[col100Key] = Math.round(avg100 * 100) / 100;

        // 6. %Capaian (Row 17) = Indeks Rata-rata (Skala 100) / Target Indeks * 100
        const targetVal =
          updated[16]?.cells?.[col100Key] || updated[16]?.cells?.[col4Key];
        if (targetVal && !isNaN(Number(targetVal)) && Number(targetVal) > 0) {
          updated[17].cells[col100Key] =
            Math.round((avg100 / Number(targetVal)) * 100 * 100) / 100 + "%";
        }
      }
    }

    return updated;
  };

  // Handle cell edit lokal
  const handleCellChange = (
    rowId: number,
    colKey: string,
    val: string | number,
    rowIdx?: number,
  ) => {
    if (!activeTab) return;

    // Convert numeric if possible and not empty string
    const parsedVal = val === "" ? "" : isNaN(Number(val)) ? val : Number(val);

    const targetIdx = rowIdx !== undefined ? rowIdx : rowId;

    const targetCol = effectiveColumnsSchema.find((c) => c.key === colKey);
    const isCum = targetCol ? isCumulativeCol(targetCol) : false;

    // Update state activeTab lokal
    setActiveTab((prev) => {
      if (!prev) return prev;
      let newRows = prev.rows_data.map((r, idx) => {
        const rKey =
          r.month !== undefined && r.month !== null && r.month !== 0
            ? r.month
            : r.row_index !== undefined
              ? r.row_index
              : idx;
        if (
          rKey === rowId ||
          (rowIdx !== undefined && (r.row_index === rowIdx || idx === rowIdx))
        ) {
          if (isCum) {
            return {
              ...r,
              cells: {
                ...r.cells,
                [`${colKey}_input`]: parsedVal,
              },
            };
          }
          const updatedCells = recalculateRowFormulas(
            {
              ...r.cells,
              [colKey]: parsedVal,
            },
            effectiveColumnsSchema,
          );
          return {
            ...r,
            cells: updatedCells,
          };
        }
        return r;
      });

      if (isCum) {
        newRows = recalculateCumulativeRows(newRows, effectiveColumnsSchema);
        newRows = newRows.map((r) => ({
          ...r,
          cells: recalculateRowFormulas(r.cells, effectiveColumnsSchema),
        }));
      }

      // Auto-recalculate Total row jika ada (misal pada tab Caput Sarprod PO / Caput RO)
      const totalIdx = newRows.findIndex(
        (r) =>
          r.is_total ||
          r.row_name === "Total" ||
          r.cells?.col_0 === "Total" ||
          (typeof r.cells?.col_0 === "string" &&
            r.cells.col_0.toLowerCase() === "total") ||
          (typeof r.cells?.col_1 === "string" &&
            r.cells.col_1.toLowerCase() === "total"),
      );
      if (totalIdx !== -1) {
        const totalRow = {
          ...newRows[totalIdx],
          cells: { ...newRows[totalIdx].cells },
        };
        effectiveColumnsSchema.forEach((col) => {
          if (
            col.key === "col_0" ||
            (col.key === "col_1" && isNaN(Number(newRows[0]?.cells?.[col.key])))
          )
            return;
          let sum = 0;
          let hasNum = false;
          for (let r = 0; r < totalIdx; r++) {
            const v = newRows[r]?.cells?.[col.key];
            if (
              v !== undefined &&
              v !== null &&
              v !== "" &&
              !isNaN(Number(v))
            ) {
              sum += Number(v);
              hasNum = true;
            }
          }
          if (hasNum) {
            totalRow.cells[col.key] = Math.round(sum * 100) / 100;
          }
        });
        newRows[totalIdx] = totalRow;
      }

      return {
        ...prev,
        rows_data: newRows,
      };
    });

    // Catat ke dirtyUpdates
    const updateKey = `row_${targetIdx}_${colKey}`;
    setDirtyUpdates((prev) => ({
      ...prev,
      [updateKey]: {
        month:
          typeof rowId === "number" && rowId >= 1 && rowId <= 12 ? rowId : 0,
        row_index: targetIdx,
        key: colKey,
        value: parsedVal,
      },
    }));
  };

  // Helper placeholder & evaluasi formula instan untuk kolom angka/target
  const getCellPlaceholder = (col: ColumnSchema, rowIdx?: number) => {
    const l = (col.label || "").toLowerCase();
    const letter = (col.col_letter || "").toUpperCase();
    const isCumulative =
      ["G", "H", "J", "K", "M", "N"].includes(letter) ||
      l.includes("sarana yang diperiksa") ||
      l.includes("renlak") ||
      l.includes("ditindaklanjuti") ||
      l.includes("tepat waktu") ||
      l.includes("selesai diawasi");

    if (rowIdx !== undefined && rowIdx > 0 && isCumulative) {
      const prevExcelRow = rowIdx + 1;
      return letter
        ? `Cth: 80 (atau =+13 atau =${letter}${prevExcelRow}+13)`
        : "Cth: 80";
    }

    if (letter === "F" || l.includes("target sampel")) {
      return "Cth: 16 (atau =16)";
    }
    if (letter === "G" && l.includes("target indikator")) {
      return "Cth: 99.71";
    }
    if (isCumulative) {
      return letter ? `Cth: 24 (atau =+11)` : "Cth: 24";
    }
    return letter ? `Cth: 10` : "0";
  };

  // Evaluasi formula atau input aritmatika saat onBlur di input cell
  const handleCellBlur = (
    rowId: number,
    col: ColumnSchema,
    rawVal: string | number,
    rowIdxNum?: number,
  ) => {
    if (!activeTab || typeof rawVal !== "string") return;
    const trimmed = rawVal.trim();
    if (!trimmed) return;

    // 0. Kolom editable kumulatif bulanan (cth: G2=40+g1):
    // Cukup input angka penambahan bulan ini (misal 40 atau +40 atau =+40 atau =G1+40),
    // sistem otomatis mencatat input dan menjumlahkannya dengan baris bulan sebelumnya: i = input + (i-1)
    if (isCumulativeCol(col) && rowIdxNum !== undefined) {
      let delta = 0;
      let clean = trimmed;
      if (clean.startsWith("=")) clean = clean.slice(1).trim();
      if (clean.startsWith("+")) clean = clean.slice(1).trim();

      const colPrevMatch = clean.match(/^[A-Za-z]+\d*\s*\+\s*([\d\.]+)$/);
      if (colPrevMatch) {
        delta = parseFloat(colPrevMatch[1]);
      } else if (!isNaN(Number(clean))) {
        delta = Number(clean);
      }

      handleCellChange(rowId, col.key, delta, rowIdxNum);
      return;
    }

    // 1. Jika mengandung koma desimal Indonesia (cth: 99,71 -> 99.71)
    if (trimmed.includes(",") && !trimmed.includes(".")) {
      const normalized = trimmed.replace(",", ".");
      if (!isNaN(Number(normalized))) {
        handleCellChange(rowId, col.key, Number(normalized), rowIdxNum);
        return;
      }
    }

    // 2. Input diawali '+' (cth: +13 atau + 13) -> penjumlahan langsung dari bulan sebelumnya
    if (/^\+\s*[\d\.]+$/.test(trimmed)) {
      const addend = parseFloat(trimmed.replace("+", "").trim());
      const prevRIdx =
        rowIdxNum !== undefined ? rowIdxNum - 1 : rowId > 1 ? rowId - 2 : -1;
      const prevRow =
        prevRIdx >= 0 && activeTab.rows_data
          ? activeTab.rows_data[prevRIdx]
          : null;
      const baseVal = prevRow
        ? parseFloat(String(prevRow.cells?.[col.key] || 0)) || 0
        : 0;
      const finalRes = Math.round((baseVal + addend) * 100) / 100;
      handleCellChange(rowId, col.key, finalRes, rowIdxNum);
      return;
    }

    // 3. Jika diawali tanda '=' (formula, cth: =+13, =F2+9, =G+13, =G10+13, =16+9, atau =24)
    if (trimmed.startsWith("=")) {
      const expr = trimmed.slice(1).trim();

      // Cek apakah hanya angka langsung setelah '=' (cth: =24)
      if (!isNaN(Number(expr)) && expr !== "") {
        handleCellChange(rowId, col.key, Number(expr), rowIdxNum);
        return;
      }

      // Cek formula penjumlahan langsung dari bulan sebelumnya (cth: =+13 atau =-5)
      if (/^[\+\-]\s*[\d\.]+$/.test(expr)) {
        const delta = parseFloat(expr);
        const prevRIdx =
          rowIdxNum !== undefined ? rowIdxNum - 1 : rowId > 1 ? rowId - 2 : -1;
        const prevRow =
          prevRIdx >= 0 && activeTab.rows_data
            ? activeTab.rows_data[prevRIdx]
            : null;
        const baseVal = prevRow
          ? parseFloat(String(prevRow.cells?.[col.key] || 0)) || 0
          : 0;
        const finalRes = Math.round((baseVal + delta) * 100) / 100;
        handleCellChange(rowId, col.key, finalRes, rowIdxNum);
        return;
      }

      // Cek formula tanpa nomor baris (cth: =G+13 atau =F+9) -> mengacu ke kolom tersebut di baris sebelumnya
      const colOnlyMatch = expr.match(
        /^([A-Za-z]+)(?:\s*([\+\-\*/])\s*([\d\.]+))?$/,
      );
      if (colOnlyMatch && !expr.match(/^[A-Za-z]+\d+/)) {
        const [, targetLetter, op, operandStr] = colOnlyMatch;
        const operand = operandStr !== undefined ? parseFloat(operandStr) : 0;
        const prevRIdx =
          rowIdxNum !== undefined ? rowIdxNum - 1 : rowId > 1 ? rowId - 2 : -1;
        const prevRow =
          prevRIdx >= 0 && activeTab.rows_data
            ? activeTab.rows_data[prevRIdx]
            : null;
        const targetCol = effectiveColumnsSchema.find(
          (c) => c.col_letter?.toUpperCase() === targetLetter.toUpperCase(),
        );
        if (targetCol) {
          const baseVal = prevRow
            ? parseFloat(String(prevRow.cells?.[targetCol.key] || 0)) || 0
            : 0;
          let res = baseVal;
          if (op === "+") res = baseVal + operand;
          else if (op === "-") res = baseVal - operand;
          else if (op === "*") res = baseVal * operand;
          else if (op === "/" && operand !== 0) res = baseVal / operand;
          else if (!op) res = baseVal;

          const finalRes = Math.round(res * 100) / 100;
          handleCellChange(rowId, col.key, finalRes, rowIdxNum);
          return;
        }
      }

      // Cek apakah formula merujuk ke cell baris sebelumnya (cth: F2+9, G10+13, G2)
      const prevRowMatch = expr.match(
        /^([A-Za-z]+)(\d+)(?:\s*([\+\-\*/])\s*([\d\.]+))?$/,
      );
      if (prevRowMatch && activeTab.rows_data) {
        const [, targetLetter, targetRowNum, op, operandStr] = prevRowMatch;
        const operand = operandStr !== undefined ? parseFloat(operandStr) : 0;
        // Baris Excel row 2 = index 0, row 3 = index 1
        const targetRIdx = parseInt(targetRowNum, 10) - 2;
        const targetRow = activeTab.rows_data[targetRIdx];
        const targetCol = effectiveColumnsSchema.find(
          (c) => c.col_letter?.toUpperCase() === targetLetter.toUpperCase(),
        );

        if (targetRow && targetCol) {
          const baseVal =
            parseFloat(String(targetRow.cells?.[targetCol.key] || 0)) || 0;
          let res = baseVal;
          if (op === "+") res = baseVal + operand;
          else if (op === "-") res = baseVal - operand;
          else if (op === "*") res = baseVal * operand;
          else if (op === "/" && operand !== 0) res = baseVal / operand;
          else if (!op) res = baseVal;

          const finalRes = Math.round(res * 100) / 100;
          handleCellChange(rowId, col.key, finalRes, rowIdxNum);
          return;
        }
      }

      // Cek apakah formula aritmatika murni (cth: =16+9 atau =67+13)
      try {
        const sanitized = expr.replace(/[^0-9\+\-\*/\(\)\,\.\s]/g, "");
        if (sanitized === expr) {
          const res = Function(`"use strict"; return (${expr})`)();
          if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
            handleCellChange(
              rowId,
              col.key,
              Math.round(res * 100) / 100,
              rowIdxNum,
            );
            return;
          }
        }
      } catch {
        // Abaikan
      }
    }
  };

  // Unduh template Excel sesuai struktur kolom tab yang sedang aktif
  const handleDownloadExcelTemplate = () => {
    if (!activeTab || effectiveColumnsSchema.length === 0) return;
    try {
      const headers = effectiveColumnsSchema.map((c) => c.label);
      const sampleRow = effectiveColumnsSchema.map((c) => {
        if (c.key === "col_0") return 1;
        if ((c.label || "").toLowerCase().includes("bulan"))
          return selectedMonthFilter !== "all"
            ? selectedMonthFilter
            : "Januari";
        if (c.type === "formula") return "(Dihitung Otomatis)";
        return "";
      });
      const wsData = [headers, sampleRow];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      const safeTitle = (activeTab.title || "Tabel").replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      XLSX.writeFile(wb, `Template_${safeTitle}.xlsx`);
    } catch (err) {
      console.error("Gagal membuat template Excel:", err);
      setExcelError("Gagal mengunduh template Excel.");
    }
  };

  // Baca & parse file Excel (.xlsx / .xls / .csv)
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setExcelError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) throw new Error("Gagal membaca file.");
        const wb = XLSX.read(buffer, { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        if (!sheet) throw new Error("Lembar kerja kosong.");

        const rawJson: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });
        if (rawJson.length < 2) {
          throw new Error(
            "File Excel harus memiliki minimal 1 baris header dan 1 baris data.",
          );
        }

        // Cari baris header secara dinamis (jangan langsung asumsikan baris 0)
        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(15, rawJson.length); r++) {
          const rowStrings = rawJson[r].map((c) => String(c || "").trim().toLowerCase());
          const hasMonth = rowStrings.some((s) => s.includes("bulan") || s === "periode");
          const hasIndicator = rowStrings.some((s) => s.includes("indikator") || s.includes("target") || s.includes("realisasi"));
          const nextRowHasJan = (r + 1 < rawJson.length) && rawJson[r + 1].some((c) => {
            const s = String(c || "").trim().toLowerCase();
            return s === "januari" || s === "jan";
          });
          if (nextRowHasJan || (hasMonth && hasIndicator)) {
            headerRowIdx = r;
            break;
          }
        }

        // Deteksi apakah ada baris Sub-Header di bawah Main Header (misal: Target, Realisasi, Kendala, Rekomendasi)
        let dataStartRowIdx = headerRowIdx + 1;
        let subHeaderRowIdx: number | null = null;
        if (dataStartRowIdx < rawJson.length) {
          const nextRowVals = rawJson[dataStartRowIdx].map((c) => String(c || "").trim());
          const hasMonthInNext = nextRowVals.some((v) => getMonthNumberFromText(v) !== null);
          const hasUnitInNext = nextRowVals.some((v) => v.toLowerCase().includes("balai besar") || v === "14A");
          if (!hasMonthInNext && !hasUnitInNext) {
            const subKeywords = ['target', 'realisasi', 'kendala', 'rekomendasi', 'satuan', 'tw i', 'tw ii', 'tw iii', 'tw iv', '% capaian', 'persentase', 'jumlah'];
            const subCount = nextRowVals.filter((v) => subKeywords.some((sk) => v.toLowerCase().includes(sk))).length;
            if (subCount >= 2 || (subCount >= 1 && nextRowVals.filter(Boolean).length <= 4)) {
              subHeaderRowIdx = dataStartRowIdx;
              dataStartRowIdx++;
            }
          }
        }

        const excelHeaders = rawJson[headerRowIdx].map((h) => String(h || "").trim());
        const subHeaders = subHeaderRowIdx !== null ? rawJson[subHeaderRowIdx].map((h) => String(h || "").trim()) : [];
        const combinedHeaders = excelHeaders.map((h, i) => {
          const sub = subHeaders[i] || "";
          if (sub && h && sub.toLowerCase() !== h.toLowerCase()) return `${h} - ${sub}`;
          return sub || h;
        });

        // Filter baris data: abaikan baris kosong, baris metadata permission ('editable', 'admin', 'formula'),
        // baris nama Katim/pegawai di luar bulan, dan catatan kaki
        const isMetadataRow = (rowVals: any[]) => {
          const nonEmpties = rowVals.map((c) => String(c || "").trim()).filter(Boolean);
          if (nonEmpties.length === 0) return true;

          const permKeywords = ['editable', 'formula', 'readonly', 'admin', 'permision', 'permission'];
          const permCount = nonEmpties.filter((val) => permKeywords.includes(val.toLowerCase())).length;
          if (permCount > 0 && permCount / nonEmpties.length >= 0.3) {
            return true;
          }

          const firstVal = (nonEmpties[0] || "").toLowerCase();
          if (firstVal.startsWith("note:") || firstVal.startsWith("catatan:") || firstVal.startsWith("keterangan:") || firstVal.startsWith("link data:") || firstVal === "dst") {
            return true;
          }

          const hasMonth = nonEmpties.some((val) => getMonthNumberFromText(val) !== null);
          const staffKeywords = ['hilmi', 'basuki', 'sukma', 'rosita', 'apri', 'dian', 'suriyati', 'suriati', 'dion', 'mita', 'winartutik', 'nanang', 'fatimah', 'hardiono', 'wibisono', 'paramita'];
          const staffCount = nonEmpties.filter((val) => {
            const vLower = val.toLowerCase();
            return staffKeywords.some((sk) => vLower.includes(sk));
          }).length;

          if (!hasMonth && staffCount >= 2) {
            return true;
          }

          return false;
        };

        const rawDataRows = rawJson.slice(dataStartRowIdx);
        const dataRows: any[][] = [];
        for (const r of rawDataRows) {
          if (!r.some((c) => String(c).trim() !== "")) continue;
          if (isMetadataRow(r)) continue;
          const rMonth = r.map((c) => getMonthNumberFromText(String(c))).find((m) => m !== null);
          if (dataRows.length >= 12 && !rMonth && rawJson.length < 35) {
            continue;
          }
          dataRows.push(r);
        }

        // Petakan kolom Excel ke columns_schema tab aktif
        const mappedRows: any[] = [];
        const currentCount = activeTab?.rows_data?.length || 0;

        dataRows.forEach((rowVals, rIdx) => {
          const cells: Record<string, any> = {};
          let rowMonthName = "";

          effectiveColumnsSchema.forEach((col, colIdx) => {
            // Abaikan jika kolom merupakan kolom metadata permission
            if (/permission|permision|hak\s*akses|role/i.test(col.label || "")) {
              cells[col.key] = "";
              return;
            }

            // Pemetaan nilai kolom:
            // 1. Secara default, gunakan urutan posisi kolom asli (colIdx) yang 1-ke-1 dengan kolom Excel
            let val = rowVals[colIdx] ?? "";

            // 2. Jika ada kecocokan nama header LENGKAP yang spesifik (bukan kata generik seperti Target/Realisasi/Kendala/Rekomendasi):
            const isGenericWord = (w: string) =>
              /^(target|realisasi|kendala|rekomendasi|satuan|bulan|periode|no|no\.)$/i.test(w.trim());

            if (col.label && !isGenericWord(col.label)) {
              const fullMatchIdx = combinedHeaders.findIndex(
                (ch) => ch.toLowerCase() === col.label.toLowerCase()
              );
              if (fullMatchIdx !== -1 && rowVals[fullMatchIdx] !== undefined) {
                val = rowVals[fullMatchIdx];
              }
            }

            const isNoCol =
              col.type === "readonly" &&
              (col.key === "col_0" ||
                col.label.toLowerCase() === "no" ||
                col.label.toLowerCase() === "no.");
            if (isNoCol) {
              val = excelMode === "append" ? currentCount + rIdx + 1 : rIdx + 1;
            }

            const isBulanCol =
              (col.label || "").toLowerCase().includes("bulan") ||
              col.key === monthColKey ||
              col.key === "col_2";
            if (isBulanCol) {
              if (val !== "" && val !== undefined && val !== null) {
                rowMonthName = String(val).trim();
              }
            }

            cells[col.key] =
              val === "" ? "" : isNaN(Number(val)) ? val : Number(val);
          });

          // Tentukan nomor dan nama bulan jika ada
          let resolvedMonthNum = getMonthNumberFromText(rowMonthName);
          if (resolvedMonthNum === null && selectedMonthFilter !== "all") {
            resolvedMonthNum = getMonthNumberFromText(selectedMonthFilter);
            rowMonthName = selectedMonthFilter;
          }
          if (resolvedMonthNum && !rowMonthName) {
            rowMonthName = STANDARD_MONTH_NAMES[resolvedMonthNum - 1] || "";
          }

          // Pastikan kolom bulan terisi nama bulan baku
          effectiveColumnsSchema.forEach((col) => {
            if (
              (col.label || "").toLowerCase().includes("bulan") ||
              col.key === monthColKey ||
              col.key === "col_2"
            ) {
              if (!cells[col.key] && rowMonthName) {
                cells[col.key] = rowMonthName;
              }
            }
          });

          mappedRows.push({
            row_index: excelMode === "append" ? currentCount + rIdx : rIdx,
            month: resolvedMonthNum || 0,
            month_name: rowMonthName,
            is_month_row: false,
            is_locked: false,
            is_current: false,
            can_edit_row: true,
            cells,
          });
        });

        if (mappedRows.length === 0) {
          throw new Error(
            "Tidak ada baris data valid yang berhasil dibaca dari file Excel.",
          );
        }

        setExcelParsedRows(mappedRows);
      } catch (err: any) {
        console.error("Gagal memproses file Excel:", err);
        setExcelError(err.message || "Format file Excel tidak dapat diproses.");
        setExcelParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Simpan data Excel ke server dan perbarui tampilan tabel lokal
  const handleSaveExcelImport = async () => {
    if (!activeTab || excelParsedRows.length === 0) return;
    setExcelSaving(true);
    setExcelError(null);
    try {
      let finalRows: RowData[] = [];
      const existingRows = activeTab.rows_data || [];

      if (excelMode === "append") {
        // Baris baru hasil import ditempatkan di paling atas agar pegawai/Hermes langsung melihatnya
        finalRows = [...excelParsedRows, ...existingRows];
      } else {
        // Mode replace: Jika ada filter bulan aktif, ganti baris pada bulan itu saja
        if (selectedMonthFilter !== "all" && !isHorizontalMonthTable) {
          const targetNum = getMonthNumberFromText(selectedMonthFilter);
          const preserved = existingRows.filter(
            (r) => getRowMonthNumber(r) !== targetNum,
          );
          finalRows = [...excelParsedRows, ...preserved];
        } else {
          finalRows = excelParsedRows;
        }
      }

      // Re-index row_index dan No urut secara konsisten
      finalRows = finalRows.map((r, idx) => {
        const newCells = { ...r.cells };
        if (newCells.col_0 !== undefined) {
          newCells.col_0 = idx + 1;
        }
        return {
          ...r,
          row_index: idx,
          cells: newCells,
        };
      });

      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        { rows_data: finalRows },
      );

      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev,
        );
      } else {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: finalRows } : prev,
        );
      }

      setSuccessMsg(
        `Berhasil mengimpor ${excelParsedRows.length} baris data dari Excel!`,
      );
      setShowExcelModal(false);
      setExcelFile(null);
      setExcelParsedRows([]);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Gagal menyimpan data Excel:", err);
      setExcelError(
        err.response?.data?.message || "Gagal menyimpan data impor ke server.",
      );
    } finally {
      setExcelSaving(false);
    }
  };

  // Scroll halus ke atas tabel saat navigasi halaman
  const scrollToTableTop = () => {
    if (typeof document !== "undefined") {
      const el = document.getElementById("main-rhpk-table-container");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  // Tambah baris baru untuk tabel vertikal log kegiatan (misal KIE Medsos, Non Medsos, dsb)
  const handleAddRow = () => {
    if (!activeTab || !activeTab.rows_data) return;

    let targetMonthName = "Januari";
    if (selectedMonthFilter !== "all") {
      targetMonthName = selectedMonthFilter;
    } else if (currentMonth >= 1 && currentMonth <= 12) {
      const standardOrder = [
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
      targetMonthName = standardOrder[currentMonth - 1];
    }

    const currentRows = activeTab.rows_data;
    const targetMonthNum = getMonthNumberFromText(targetMonthName) || 0;

    // Cari kolom nomor urut jika ada
    const noCol = effectiveColumnsSchema.find(
      (c) =>
        (c.label || "").toLowerCase().trim() === "no" ||
        (c.label || "").toLowerCase().trim() === "no.",
    );
    let nextNo: number | string = currentRows.length + 1;
    if (noCol) {
      const monthRows = currentRows.filter((r) => {
        const m = r.cells?.[monthColKey || "col_2"] || r.month_name || "";
        return String(m).toLowerCase() === targetMonthName.toLowerCase();
      });
      nextNo = monthRows.length + 1;
    }

    const newCells: Record<string, any> = {};
    effectiveColumnsSchema.forEach((col) => {
      newCells[col.key] = "";
    });

    if (noCol) {
      newCells[noCol.key] = nextNo;
    } else {
      newCells.col_0 = nextNo;
    }

    if (monthColKey) {
      newCells[monthColKey] = targetMonthName;
    } else {
      newCells.col_2 = targetMonthName;
    }

    const newRow: RowData = {
      row_index: 0,
      month: targetMonthNum,
      month_name: targetMonthName,
      is_locked: false,
      is_current: true,
      can_edit_row: true,
      cells: newCells,
    };

    // Prepend new row ke urutan teratas (paling atas) dan sesuaikan row_index seluruh baris
    const updatedRows = [newRow, ...currentRows].map((r, idx) => ({
      ...r,
      row_index: idx,
    }));

    setActiveTab((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows_data: updatedRows,
      };
    });

    const updateColKey = monthColKey || "col_2";
    const updateVal = targetMonthName;

    setDirtyUpdates((prev) => ({
      ...prev,
      [`new_0_${updateColKey}`]: {
        month: targetMonthNum,
        row_index: 0,
        key: updateColKey,
        value: updateVal,
      },
    }));

    setCurrentPage(1);
    scrollToTableTop();

    setSuccessMsg(
      `Baris baru untuk bulan ${targetMonthName} berhasil ditambahkan di urutan paling atas! Silakan lengkapi isian lalu klik Simpan Perubahan.`,
    );
  };

  // Handler Hapus Baris untuk PIC (Point Tambahan)
  const handleDeleteRow = async (targetIdx: number) => {
    if (!activeTab || !activeTab.rows_data) return;
    const targetRow = activeTab.rows_data[targetIdx];
    if (!targetRow) return;

    const rowLabel =
      targetRow.month_name ||
      targetRow.cells?.[monthColKey || "col_2"] ||
      targetRow.cells?.col_0 ||
      `Baris ke-${targetIdx + 1}`;

    const confirmed = window.confirm(
      `Hapus "${rowLabel}" (Baris ke-${targetIdx + 1}) dari tabel ini?\n\nTindakan ini akan langsung menghapus baris dan memperbarui data di database.`
    );
    if (!confirmed) return;

    // Filter baris yang dihapus
    const remainingRows = activeTab.rows_data.filter((_, idx) => idx !== targetIdx);

    // Tata ulang nomor urut dan row_index
    let updatedRows = remainingRows.map((r, idx) => ({
      ...r,
      row_index: idx,
    }));

    // Hitung ulang kolom kumulatif jika ada
    updatedRows = recalculateCumulativeRows(updatedRows, effectiveColumnsSchema);

    // Hitung ulang rumus formula pada setiap baris
    updatedRows = updatedRows.map((r) => ({
      ...r,
      cells: recalculateRowFormulas(r.cells, effectiveColumnsSchema),
    }));

    // Update state tabel seketika
    setActiveTab((prev) => (prev ? { ...prev, rows_data: updatedRows } : prev));
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        {
          rows_data: updatedRows,
        }
      );
      setSuccessMsg(`Baris "${rowLabel}" berhasil dihapus dari tabel.`);
      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev
        );
      }
    } catch (err: any) {
      console.error("Gagal menghapus baris:", err);
      setErrorMsg(
        err.response?.data?.message || "Gagal menghapus baris dari server."
      );
      // Pulihkan kembali data tabel asli dari server jika terjadi kendala
      fetchTableData(activeTab.id, false);
    } finally {
      setSaving(false);
    }
  };

  // Kirim data ke backend lokal (Simpan Massal)
  const handleSave = async () => {
    if (!activeTab) return;
    const updatesList = Object.values(dirtyUpdates);
    if (updatesList.length === 0) {
      setSuccessMsg("Tidak ada perubahan yang perlu disimpan.");
      return;
    }

    // 1. Validasi Kendala & RTL Wajib Diisi:
    // Jika pada tabel terdapat kolom Kendala dan/atau RTL, dan user mengisi/mengubah data pada suatu baris/bulan,
    // maka Kendala dan RTL pada baris tersebut wajib diisi sebelum perubahan dapat disimpan ke database.
    // Jika Kendala & RTL sudah terisi, maka baris data dapat disimpan meskipun belum seluruh kolom sebaris terisi lengkap.
    const kendalaCols = effectiveColumnsSchema.filter((c) =>
      Boolean(
        c.is_kendala || isKendalaCol(c.label) || isKendalaCol(c.parent_header),
      ),
    );
    const rtlCols = effectiveColumnsSchema.filter((c) =>
      Boolean(c.is_rtl || isRtlCol(c.label) || isRtlCol(c.parent_header)),
    );
    const hasKendalaOrRtl = kendalaCols.length > 0 || rtlCols.length > 0;

    if (hasKendalaOrRtl) {
      const editableDataCols = effectiveColumnsSchema.filter((c) => {
        const isK = Boolean(
          c.is_kendala ||
          isKendalaCol(c.label) ||
          isKendalaCol(c.parent_header),
        );
        const isR = Boolean(
          c.is_rtl || isRtlCol(c.label) || isRtlCol(c.parent_header),
        );
        const isFormula = c.type === "formula";
        const isReadonly = c.type === "readonly";
        const isCol0 =
          c.key === "col_0" ||
          (c.label &&
            (c.label.toLowerCase() === "bulan" ||
              c.label.toLowerCase() === "no"));
        return (
          c.can_edit && !isFormula && !isReadonly && !isK && !isR && !isCol0
        );
      });

      const rows = activeTab.rows_data;
      const touchedRowIndices = new Set<number>();
      updatesList.forEach((up) => {
        if (up.row_index !== undefined && rows[up.row_index]) {
          touchedRowIndices.add(up.row_index);
        } else if (up.month !== undefined && up.month > 0) {
          const fIdx = rows.findIndex((r) => r.month === up.month);
          if (fIdx !== -1) touchedRowIndices.add(fIdx);
          else if (rows[up.month - 1]) touchedRowIndices.add(up.month - 1);
        }
      });

      const standardMonthNames: Record<number, string> = {
        1: "Januari",
        2: "Februari",
        3: "Maret",
        4: "April",
        5: "Mei",
        6: "Juni",
        7: "Juli",
        8: "Agustus",
        9: "September",
        10: "Oktober",
        11: "November",
        12: "Desember",
      };

      for (const rIdx of Array.from(touchedRowIndices)) {
        const row = rows[rIdx];
        if (!row || row.is_total) continue;

        // Cek apakah ada minimal satu kolom data yang terisi di baris ini
        const hasAnyData = editableDataCols.some((col) => {
          const val = row.cells?.[col.key];
          return isCellContentFilled(val);
        });

        if (hasAnyData) {
          const kendalaCol = kendalaCols[0];
          const rtlCol = rtlCols[0];

          const isKendalaMissing = Boolean(
            kendalaCol && !isCellContentFilled(row.cells?.[kendalaCol.key]),
          );
          const isRtlMissing = Boolean(
            rtlCol && !isCellContentFilled(row.cells?.[rtlCol.key]),
          );

          if (isKendalaMissing || isRtlMissing) {
            const mName =
              row.month_name ||
              (row.month && standardMonthNames[row.month]
                ? standardMonthNames[row.month]
                : "") ||
              (row.cells?.col_0
                ? String(row.cells.col_0)
                : `Baris ${rIdx + 1}`);

            const rKey =
              row.month !== undefined && row.month !== null && row.month !== 0
                ? row.month
                : row.row_index !== undefined
                  ? row.row_index
                  : rIdx;

            // Simpan perubahan data angka ke server terlebih dahulu agar tidak hilang
            setSaving(true);
            setErrorMsg("");
            try {
              const res = await api.post(
                `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
                { updates: updatesList, rows_data: activeTab.rows_data },
              );
              setDirtyUpdates({});
              if (res.data?.data?.rows_data) {
                setActiveTab((prev) =>
                  prev ? { ...prev, rows_data: res.data.data.rows_data } : prev,
                );
              }
            } catch (saveErr: any) {
              console.error("Gagal menyimpan data:", saveErr);
            } finally {
              setSaving(false);
            }

            setValidationModal({
              isOpen: true,
              rowIndex: rIdx,
              rowKey: rKey,
              monthName: mName,
              isKendalaMissing,
              isRtlMissing,
              kendalaCol,
              rtlCol,
            });

            setHighlightedIncompleteRows((prev) =>
              Array.from(new Set([...prev, rKey, rIdx])),
            );

            setSuccessMsg(
              `Data angka Anda berhasil disimpan ke sistem! Mohon lengkapi catatan Kendala dan RTL pada ${mName}.`,
            );

            // Scroll ke baris tabel
            const rowElem =
              document.getElementById(`local-row-${rKey}`) ||
              document.getElementById(`local-row-${rIdx}`);
            if (rowElem) {
              rowElem.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
          }
        }
      }
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        { updates: updatesList, rows_data: activeTab.rows_data },
      );
      setSuccessMsg(res.data?.message || "Data berhasil disimpan.");
      setDirtyUpdates({});
      setHighlightedIncompleteRows([]);
      setValidationModal(null);

      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev,
        );
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  // Handler Ekspor Excel RHPK (Point 3)
  const handleExportExcel = (mode: "locked" | "all") => {
    setShowExportDropdown(false);
    if (!activeSpreadsheet) {
      setErrorMsg("Pilih dokumen spreadsheet terlebih dahulu.");
      return;
    }
    const exportUrl = `${baseUrl}/api/test-local-table/spreadsheet/${activeSpreadsheet.id}/export?mode=${mode}${authQuery}`;
    window.open(exportUrl, "_blank");
  };

  // Handlers Kolaborasi Angka Multi-Katim (Point 6)
  const handleOpenCollabNumModal = (
    row: any,
    col: ColumnSchema,
    rowIndex: number,
    canEdit: boolean = true,
  ) => {
    const rKey =
      row.month !== undefined && row.month !== null && row.month !== 0
        ? row.month
        : row.row_index !== undefined
          ? row.row_index
          : rowIndex;

    const rowMonthName =
      resolveRowMonthName(row, monthColKey) ||
      row.month_name ||
      `Baris ${rowIndex + 1}`;

    const contribs = row.cells?.[col.key + "_contributors"] || {};
    const myId = user?.id ? String(user.id) : "";
    const myExisting =
      myId && contribs[myId] ? String(contribs[myId].value ?? "") : "";

    setCollabNumModal({
      isOpen: true,
      rowKey: Number(rKey),
      rowIndex,
      monthName: rowMonthName,
      col,
      contributors: contribs,
      myValue: myExisting,
      canEdit,
    });
  };

  const handleSaveCollabNumModal = async () => {
    if (!collabNumModal || !activeTab || !collabNumModal.canEdit) return;
    const { col, rowKey, rowIndex, contributors, myValue } = collabNumModal;
    const myId = user?.id ? String(user.id) : isPicUser ? "pic" : "katim_me";
    const myName =
      user?.name || user?.call_name || (isPicUser ? "PIC Balai" : "Katim");
    const numVal = parseFloat(String(myValue).replace(",", ".")) || 0;

    const updatedContribs: Record<
      string,
      { user_id: string; author: string; value: number; updated_at?: string }
    > = {
      ...contributors,
      [myId]: {
        user_id: myId,
        author: myName,
        value: numVal,
        updated_at: new Date().toISOString(),
      },
    };

    let totalMonthSum = 0;
    Object.values(updatedContribs).forEach((c: any) => {
      totalMonthSum += parseFloat(c.value || 0);
    });

    const isCum = isCumulativeCol(col);

    setActiveTab((prev) => {
      if (!prev) return prev;
      let newRows = prev.rows_data.map((r, idx) => {
        if (idx === rowIndex) {
          return {
            ...r,
            is_updated: true,
            cells: {
              ...r.cells,
              [col.key]: totalMonthSum,
              [`${col.key}_input`]: totalMonthSum,
              [`${col.key}_contributors`]: updatedContribs,
            },
          };
        }
        return r;
      });

      if (isCum) {
        newRows = recalculateCumulativeRows(newRows, effectiveColumnsSchema);
      }
      newRows = newRows.map((r) => ({
        ...r,
        cells: recalculateRowFormulas(r.cells, effectiveColumnsSchema),
      }));

      return { ...prev, rows_data: newRows };
    });

    try {
      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        {
          updates: [
            {
              month: rowKey,
              row_index: rowIndex,
              key: col.key,
              value: numVal,
            },
          ],
        },
      );
      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev,
        );
      }
      setSuccessMsg(
        `Kontribusi angka untuk ${col.label} (${collabNumModal.monthName}) berhasil disimpan! ${isCum ? "Total kumulatif dihitung otomatis." : `Total: ${totalMonthSum}`}`,
      );
    } catch (err: any) {
      console.error("Gagal simpan kontribusi angka:", err);
      const errMsg =
        err.response?.data?.message ||
        "Gagal menyimpan kontribusi angka. Periode mungkin telah dikunci oleh Administrator/TU.";
      setErrorMsg(errMsg);
      if (activeTab?.id) {
        fetchTableData(activeTab.id, false);
      }
    }

    setCollabNumModal(null);
  };

  // Handlers untuk Modal Catatan Kolaboratif (Kendala / RTL PIC)
  const handleOpenCollabModal = (
    rowKey: number,
    col: ColumnSchema,
    currentVal: any,
    monthName: string,
    canEdit: boolean,
    rowIndex?: number,
  ) => {
    const parsed = parseNotes(currentVal);
    setCollabModal({
      isOpen: true,
      rowKey,
      rowIndex: rowIndex ?? rowKey,
      colKey: col.key,
      colLabel: col.label,
      colLetter: col.col_letter,
      monthName,
      isLocked: !canEdit,
      notes: parsed,
      newNoteText: "",
      editingIndex: null,
      editingText: "",
    });
  };

  const handleDeleteCollabNote = (index: number) => {
    if (!collabModal) return;
    const updated = collabModal.notes
      .filter((_, idx) => idx !== index)
      .map((n, idx) => ({ ...n, num: idx + 1 }));
    setCollabModal({
      ...collabModal,
      notes: updated,
      editingIndex: null,
    });
  };

  const handleSaveEditedCollabNote = (index: number) => {
    if (!collabModal || !collabModal.editingText.trim()) return;
    const updated = [...collabModal.notes];
    updated[index] = {
      ...updated[index],
      text: collabModal.editingText.trim(),
    };
    setCollabModal({
      ...collabModal,
      notes: updated,
      editingIndex: null,
      editingText: "",
    });
  };

  // Simpan catatan kendala/RTL langsung ke database dan tampilkan seketika di tabel (1 Tombol Simpan)
  const handleSaveCollabModal = async () => {
    if (!collabModal || !activeTab) return;
    setSavingCollab(true);
    setErrorMsg("");
    setSuccessMsg("");

    let currentNotes = [...collabModal.notes];

    // Jika sedang dalam mode edit catatan yang ada
    if (collabModal.editingIndex !== null && collabModal.editingText.trim()) {
      currentNotes[collabModal.editingIndex] = {
        ...currentNotes[collabModal.editingIndex],
        text: collabModal.editingText.trim(),
      };
    }

    // Jika ada teks catatan baru di textarea
    if (collabModal.newNoteText.trim()) {
      const author = user?.name || user?.call_name || "PIC Katim";
      currentNotes.push({
        num: currentNotes.length + 1,
        text: collabModal.newNoteText.trim(),
        author,
      });
    }

    // Re-index nomor urut catatan
    const finalNotes = currentNotes.map((n, idx) => ({ ...n, num: idx + 1 }));
    const formatted = formatNotes(finalNotes);

    const targetRowIdx =
      collabModal.rowIndex !== undefined
        ? collabModal.rowIndex
        : collabModal.rowKey;

    try {
      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        {
          updates: [
            {
              month: collabModal.rowKey,
              row_index: targetRowIdx,
              key: collabModal.colKey,
              value: formatted,
            },
          ],
        },
      );
      setSuccessMsg(
        res.data?.message || "Catatan kendala/RTL berhasil disimpan!",
      );
      handleCellChange(
        collabModal.rowKey,
        collabModal.colKey,
        formatted,
        targetRowIdx,
      );
      // Update HANYA sel kendala/RTL di activeTab lokal agar tidak menghapus inputan angka di kolom lain
      setActiveTab((prev) => {
        if (!prev) return prev;
        const newRows = [...prev.rows_data];
        if (newRows[targetRowIdx]) {
          newRows[targetRowIdx] = {
            ...newRows[targetRowIdx],
            is_updated: true,
            cells: {
              ...newRows[targetRowIdx].cells,
              [collabModal.colKey]: formatted,
            },
          };
        }
        return { ...prev, rows_data: newRows };
      });
      setCollabModal(null);
    } catch (err: any) {
      // Jika request API gagal, tetap simpan ke state tabel lokal
      handleCellChange(
        collabModal.rowKey,
        collabModal.colKey,
        formatted,
        targetRowIdx,
      );
      setErrorMsg(
        err.response?.data?.message ||
          "Catatan tersimpan di tabel lokal. Klik 'Simpan Perubahan' nanti untuk mengirim ke server.",
      );
      setCollabModal(null);
    } finally {
      setSavingCollab(false);
    }
  };

  // Handler Upload / Import File Excel
  const handleUploadExcel = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      if (uploadMode === "tab" && activeTab) {
        // Import khusus ke tab ini
        const res = await api.post(
          `${baseUrl}/api/test-local-table/tab/${activeTab.id}/import-excel${authQuery}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        setSuccessMsg(
          res.data?.message || "Sheet Excel berhasil diimport ke tab ini!",
        );
        if (res.data?.data) {
          setActiveTab((prev) =>
            prev
              ? {
                  ...prev,
                  columns_schema: res.data.data.columns_schema,
                  rows_data: res.data.data.rows_data,
                }
              : prev,
          );
        }
      } else {
        // Upload/Perbarui seluruh dokumen
        formData.append("year", String(selectedYear));
        const res = await api.post(
          `${baseUrl}/api/test-local-table/upload${authQuery}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        setSuccessMsg(res.data?.message || "File Excel berhasil diunggah!");
        if (user?.id) {
          fetchData(selectedYear, selectedIkskId, selectedSpId, selectedTabId);
        }
      }
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Gagal mengunggah file Excel.",
      );
    } finally {
      setUploading(false);
    }
  };

  const dirtyCount = Object.keys(dirtyUpdates).length;

  // getMonthNumberFromText is defined at module level above

  // Pastikan tabel yang belum memiliki konfigurasi tetap menampilkan seluruh kolom (dan menyembunyikan kolom hidden)
  const effectiveColumnsSchema = useMemo<ColumnSchema[]>(() => {
    if (activeTab?.columns_schema && activeTab.columns_schema.length > 0) {
      return activeTab.columns_schema
        .filter((c) => {
          if (c.hidden || (c as any).is_hidden) return false;
          const isKlb =
            (activeTab?.title || "").toLowerCase().includes("klb") ||
            activeTab?.id === 90;
          if (isKlb && c.label?.trim().toLowerCase() === "pic") {
            return false;
          }
          return true;
        })
        .map((c) => ({
          ...c,
          parent_header:
            (c as any).parent_header ||
            (c.label && c.label.includes(" - ")
              ? c.label.split(" - ")[0].trim()
              : null),
          sub_label:
            (c as any).sub_label ||
            (c.label && c.label.includes(" - ")
              ? c.label.split(" - ").slice(1).join(" - ").trim()
              : c.label),
          is_collaborative: isCollaborativeCol(c),
          is_kendala: isKendalaCol(c.label),
          is_rtl: isRtlCol(c.label),
        }));
    }
    if (activeTab?.rows_data && activeTab.rows_data.length > 0) {
      const firstCells = activeTab.rows_data[0].cells || {};
      return Object.keys(firstCells).map((k, idx) => {
        const letter = String.fromCharCode(65 + (idx % 26));
        const isBulan = k === "col_0" || idx === 0;
        const colObj: ColumnSchema = {
          key: k,
          col_letter: letter,
          label: isBulan ? "Bulan" : `Kolom ${letter}`,
          type: isBulan ? "readonly" : "editable",
          formula: null,
          can_edit: !isBulan,
        };
        colObj.is_collaborative = isCollaborativeCol(colObj);
        colObj.is_kendala = isKendalaCol(colObj.label);
        colObj.is_rtl = isRtlCol(colObj.label);
        return colObj;
      });
    }
    return [];
  }, [activeTab]);

  // Deteksi dan kelompokkan kolom bertingkat (2-tier headers) jika ada parent_header atau format "Grup - Sub"
  const headerGroups = useMemo(() => {
    const hasGroups = effectiveColumnsSchema.some((c) =>
      Boolean(c.parent_header),
    );
    if (!hasGroups) return null;

    type HeaderGroup = {
      parent: string | null;
      cols: ColumnSchema[];
    };

    const groups: HeaderGroup[] = [];
    let currentGroup: HeaderGroup | null = null;

    effectiveColumnsSchema.forEach((col) => {
      const parentName = col.parent_header || null;
      if (currentGroup && currentGroup.parent === parentName) {
        currentGroup.cols.push(col);
      } else {
        currentGroup = {
          parent: parentName,
          cols: [col],
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [effectiveColumnsSchema]);

  // Deteksi apakah tabel menggunakan format horizontal (bulan ada di kolom/header)
  const isHorizontalMonthTable = useMemo(() => {
    if (!effectiveColumnsSchema || effectiveColumnsSchema.length === 0)
      return false;

    // 1. Jika tabel memiliki kolom 'Bulan', pasti tabel vertikal
    const hasBulanCol = effectiveColumnsSchema.some(
      (c) => (c.label || "").trim().toLowerCase() === "bulan",
    );
    if (hasBulanCol) return false;

    // 2. Jika baris data terdefinisi untuk 12 bulan (month 1..12), pasti tabel vertikal
    const rows = activeTab?.rows_data || [];
    if (rows.length === 12 && rows.some((r) => r.month && r.month > 0)) {
      return false;
    }

    // 3. Periksa parent_header (misal: JANUARI, FEBRUARI)
    const parentMonths = new Set<number>();
    effectiveColumnsSchema.forEach((col) => {
      if (col.parent_header) {
        const pm = getMonthNumberFromText(col.parent_header);
        if (pm !== null) parentMonths.add(pm);
      }
    });
    if (parentMonths.size >= 3) return true;

    // 4. Periksa label kolom (hanya jika label kolom mandiri menunjukkan bulan)
    const labelMonths = new Set<number>();
    effectiveColumnsSchema.forEach((col) => {
      const lm = getMonthNumberFromText(col.label);
      if (lm !== null) labelMonths.add(lm);
    });
    return labelMonths.size >= 3;
  }, [effectiveColumnsSchema, activeTab?.rows_data]);

  // Deteksi kolom bulan jika ada
  const monthColKey = useMemo(() => {
    if (!activeTab?.columns_schema) return null;
    const col = activeTab.columns_schema.find((c) => {
      const l = (c.label || "").toLowerCase().trim();
      return (
        l === "bulan" ||
        l.includes("bulan") ||
        (c.key === "col_2" && c.col_letter === "C")
      );
    });
    return col ? col.key : null;
  }, [activeTab?.columns_schema]);

  // Ekstrak nomor bulan (1..12) dari sebuah baris data secara akurat dan presisi
  const getRowMonthNumber = (r: RowData): number | null => {
    if (!r) return null;
    // 1. Cek dari kolom bulan jika terdeteksi
    if (monthColKey && r.cells?.[monthColKey] !== undefined) {
      const n = getMonthNumberFromText(String(r.cells[monthColKey]));
      if (n !== null) return n;
    }
    // 2. Cek kolom col_2 (seringkali kolom Bulan pada tabel multi-baris)
    if (r.cells?.col_2 !== undefined) {
      const n = getMonthNumberFromText(String(r.cells.col_2));
      if (n !== null) return n;
    }
    // 3. Cek month_name
    if (r.month_name) {
      const n = getMonthNumberFromText(r.month_name);
      if (n !== null) return n;
    }
    // 4. Cek r.month jika bernilai 1..12 dan bukan 0
    if (typeof r.month === "number" && r.month >= 1 && r.month <= 12) {
      return r.month;
    }
    return null;
  };

  // Ekstrak daftar bulan yang ada di tab saat ini beserta jumlah barisnya
  const availableMonths = useMemo(() => {
    const rawCount = activeTab?.rows_data?.length || 0;
    if (rawCount === 0) return [];

    const standardOrder = [
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

    // Jika tabel berstruktur horizontal (bulan berada di kolom header)
    if (isHorizontalMonthTable) {
      const result: { name: string; count: number }[] = [];
      standardOrder.forEach((name) => {
        const targetNum = getMonthNumberFromText(name);
        const hasMonthCol = effectiveColumnsSchema.some((c) => {
          const pNum = getMonthNumberFromText(c.parent_header);
          const lNum = getMonthNumberFromText(c.label);
          return pNum === targetNum || lNum === targetNum;
        });
        if (hasMonthCol) {
          result.push({ name, count: rawCount });
        }
      });
      return result;
    }

    // Default: tabel vertikal (bulan berada di baris)
    const monthCounts: Record<number, number> = {};

    activeTab?.rows_data?.forEach((r) => {
      const mNum = getRowMonthNumber(r);
      if (mNum !== null) {
        monthCounts[mNum] = (monthCounts[mNum] || 0) + 1;
      }
    });

    const hasAnyMonthColOrData =
      Boolean(monthColKey) ||
      effectiveColumnsSchema.some((c) =>
        (c.label || "").toLowerCase().includes("bulan"),
      ) ||
      Object.keys(monthCounts).length > 0;

    const result: { name: string; count: number }[] = [];

    if (hasAnyMonthColOrData) {
      // Pastikan seluruh 12 bulan (Januari s/d Desember) SELALU tampil lengkap
      standardOrder.forEach((name, idx) => {
        const mNum = idx + 1;
        result.push({
          name,
          count: monthCounts[mNum] || 0,
        });
      });
    } else {
      standardOrder.forEach((name, idx) => {
        const mNum = idx + 1;
        if (monthCounts[mNum]) {
          result.push({ name, count: monthCounts[mNum] });
        }
      });
    }

    return result;
  }, [
    activeTab?.rows_data,
    monthColKey,
    isHorizontalMonthTable,
    effectiveColumnsSchema,
  ]);

  // Filter baris berdasarkan Bulan dan Pencarian
  const filteredRows = useMemo(() => {
    if (!activeTab?.rows_data) return [];
    let rows = activeTab.rows_data;

    // Filter per Bulan (hanya jika tabel vertikal, karena pada tabel horizontal baris merupakan komoditi/item)
    if (selectedMonthFilter !== "all" && !isHorizontalMonthTable) {
      const targetMonthNum = getMonthNumberFromText(selectedMonthFilter);
      const filterLower = selectedMonthFilter.toLowerCase().trim();
      rows = rows.filter((r) => {
        const rMonthNum = getRowMonthNumber(r);
        if (targetMonthNum !== null && rMonthNum !== null) {
          return rMonthNum === targetMonthNum;
        }
        let m = "";
        if (monthColKey && r.cells?.[monthColKey]) {
          m = String(r.cells[monthColKey]).trim().toLowerCase();
        } else if (r.month_name) {
          m = String(r.month_name).trim().toLowerCase();
        } else if (r.cells?.col_2) {
          m = String(r.cells.col_2).trim().toLowerCase();
        }
        return (
          m === filterLower ||
          (filterLower === "februari" && m === "pebruari") ||
          (filterLower === "november" && m === "nopember")
        );
      });
    }

    // Filter per Pencarian: Mencari di SEMUA kolom, terutama kolom Topik dan Judul Topik
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      rows = rows.filter((r) => {
        // Kumpulkan semua teks dari semua sel pada baris ini
        const cellValues: string[] = [];
        if (r.cells) {
          Object.values(r.cells).forEach((val) => {
            if (val !== null && val !== undefined) {
              cellValues.push(String(val));
            }
          });
        }
        if (r.row_name) cellValues.push(String(r.row_name));
        if (r.month_name) cellValues.push(String(r.month_name));

        const fullRowText = cellValues.join(" ").toLowerCase();

        // Multi-token AND matching: seluruh kata pencarian harus cocok
        return tokens.every((token) => fullRowText.includes(token));
      });
    }

    return rows;
  }, [
    activeTab?.rows_data,
    selectedMonthFilter,
    isHorizontalMonthTable,
    searchQuery,
    monthColKey,
  ]);

  // Kolom yang ditampilkan saat ini (jika tabel horizontal difilter per bulan, tampilkan kolom tetap + kolom bulan terpilih)
  const displayedColumnsSchema = useMemo<ColumnSchema[]>(() => {
    if (!isHorizontalMonthTable || selectedMonthFilter === "all") {
      return effectiveColumnsSchema;
    }
    const targetMonthNum = getMonthNumberFromText(selectedMonthFilter);
    if (!targetMonthNum) return effectiveColumnsSchema;

    return effectiveColumnsSchema.filter((col) => {
      const isFixedLeft =
        col.key === "col_0" ||
        col.key === "col_1" ||
        (!col.parent_header && getMonthNumberFromText(col.label) === null);
      const colMonthNum =
        getMonthNumberFromText(col.parent_header) ||
        getMonthNumberFromText(col.label);
      return isFixedLeft || colMonthNum === targetMonthNum;
    });
  }, [effectiveColumnsSchema, isHorizontalMonthTable, selectedMonthFilter]);

  // Header groups yang ditampilkan saat ini
  const displayedHeaderGroups = useMemo(() => {
    if (!headerGroups) return null;
    if (!isHorizontalMonthTable || selectedMonthFilter === "all") {
      return headerGroups;
    }
    const targetMonthNum = getMonthNumberFromText(selectedMonthFilter);
    if (!targetMonthNum) return headerGroups;

    return headerGroups
      .map((grp) => {
        if (!grp.parent) {
          // Kolom tetap sebelah kiri (No, Rekomendasi/sertifikasi, dsb)
          return grp;
        }
        const grpMonthNum = getMonthNumberFromText(grp.parent);
        if (grpMonthNum === targetMonthNum) {
          return grp;
        }
        return null;
      })
      .filter((grp): grp is NonNullable<typeof grp> => grp !== null);
  }, [headerGroups, isHorizontalMonthTable, selectedMonthFilter]);

  // Deteksi jumlah dan style kolom sticky freeze kiri
  // Deteksi tab bertema cyan seperti KLB KP (sesuai template Excel asli)
  const isCyanHeader = useMemo(() => {
    const title = (activeTab?.title || "").toLowerCase();
    return title.includes("klb") || activeTab?.id === 90;
  }, [activeTab?.title, activeTab?.id]);

  // Deteksi tabel ber-header 3 tingkat (memiliki sub_parent rumus)
  const hasSubParents = useMemo(() => {
    return displayedColumnsSchema.some((c) => Boolean(c.sub_parent));
  }, [displayedColumnsSchema]);

  const getColWidthStyle = (col: ColumnSchema) => {
    const label = (col.label || "").toLowerCase();
    if (col.col_letter === "A" || label.includes("periode"))
      return "w-[130px] min-w-[130px]";
    if (col.col_letter === "B" || label === "upt")
      return "w-[140px] min-w-[140px]";
    if (col.col_letter === "C" && label === "pic")
      return "w-[65px] min-w-[65px]";
    if (col.col_letter === "D" || label.includes("identitas"))
      return "w-[300px] min-w-[280px]";
    if (label.includes("kendala") || label.includes("tindak lanjut"))
      return "w-[300px] min-w-[280px]";
    if (
      label.includes("justifikasi") ||
      label.includes("dukung") ||
      label.includes("verifikasi")
    )
      return "w-[180px] min-w-[160px]";
    return "min-w-[110px]";
  };

  const leftStickyConfig = useMemo(() => {
    const title = (activeTab?.title || "").toLowerCase();

    // Tab 140 / KIE dan DuMas: 3 freeze columns (No [45px], DIPA Badan POM [140px], Layanan Informasi [240px])
    if (title.includes("kie dan dumas") || activeTab?.id === 140) {
      return {
        count: 3,
        getClasses: (cIdx: number, isHeader: boolean, bgClass?: string) => {
          if (cIdx === 0) {
            return `sticky left-0 ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} w-[45px] min-w-[45px] max-w-[45px] text-center border-r border-slate-200`;
          }
          if (cIdx === 1) {
            return `sticky left-[45px] ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200`;
          }
          if (cIdx === 2) {
            return `sticky left-[185px] ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} min-w-[240px] max-w-[280px] shadow-r border-r border-slate-200`;
          }
          return "";
        },
      };
    }

    // Tab 18 Sarana Pengaduan: 3 freeze columns (No [45px], Sarana [160px], Alamat [170px])
    if (title.includes("sarana") || activeTab?.id === 161) {
      return {
        count: 3,
        getClasses: (cIdx: number, isHeader: boolean, bgClass?: string) => {
          if (cIdx === 0) {
            return `sticky left-0 ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} w-[45px] min-w-[45px] max-w-[45px] text-center border-r border-slate-200`;
          }
          if (cIdx === 1) {
            return `sticky left-[45px] ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} min-w-[160px] max-w-[190px] border-r border-slate-200`;
          }
          if (cIdx === 2) {
            return `sticky left-[205px] ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} min-w-[170px] max-w-[210px] shadow-r border-r border-slate-200`;
          }
          return "";
        },
      };
    }

    // Tab KLB KP (Tab 90 / title includes klb)
    if (title.includes("klb") || activeTab?.id === 90) {
      return {
        count: 2,
        getClasses: (cIdx: number, isHeader: boolean, bgClass?: string) => {
          if (cIdx === 0) {
            return `sticky left-0 ${isHeader ? "z-30 bg-cyan-200 text-cyan-950 font-bold" : `z-10 ${bgClass || "bg-white"} text-slate-900`} w-[130px] min-w-[130px] max-w-[130px] text-center border-r border-cyan-300`;
          }
          if (cIdx === 1) {
            return `sticky left-[130px] ${isHeader ? "z-30 bg-cyan-200 text-cyan-950 font-bold" : `z-10 ${bgClass || "bg-white"} text-slate-900`} w-[140px] min-w-[140px] max-w-[140px] text-center shadow-r border-r border-cyan-300`;
          }
          return "";
        },
      };
    }

    // Tab Indeks KIE, Caput Layanan Informasi, 17 Profesi Konsumen, Rincian Jenis Sardis, Rincian Sardis, atau tabel ber-header grup 2 kolom
    if (
      title.includes("indeks kie") ||
      title.includes("caput layanan") ||
      title.includes("profesi") ||
      title.includes("rincian jenis sardis") ||
      title.includes("rincian sardis") ||
      activeTab?.id === 109 ||
      activeTab?.id === 110 ||
      activeTab?.id === 135 ||
      activeTab?.id === 136 ||
      activeTab?.id === 160 ||
      (displayedHeaderGroups &&
        !displayedHeaderGroups[0]?.parent &&
        displayedHeaderGroups[0].cols.length > 1)
    ) {
      return {
        count: 2,
        getClasses: (cIdx: number, isHeader: boolean, bgClass?: string) => {
          if (cIdx === 0) {
            return `sticky left-0 ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} w-[50px] min-w-[50px] max-w-[50px] text-center border-r border-slate-200`;
          }
          if (cIdx === 1) {
            return `sticky left-[50px] ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} min-w-[260px] max-w-[290px] shadow-r border-r border-slate-200`;
          }
          return "";
        },
      };
    }

    // Header grup 1 kolom
    if (
      displayedHeaderGroups &&
      !displayedHeaderGroups[0]?.parent &&
      displayedHeaderGroups[0].cols.length === 1
    ) {
      return {
        count: 1,
        getClasses: (cIdx: number, isHeader: boolean, bgClass?: string) => {
          if (cIdx === 0) {
            return `sticky left-0 ${isHeader ? "z-30 bg-slate-100 text-slate-900" : `z-10 ${bgClass || "bg-white"} text-slate-900`} min-w-[130px] shadow-r border-r border-slate-200`;
          }
          return "";
        },
      };
    }

    return {
      count: 0,
      getClasses: () => "",
    };
  }, [activeTab?.title, activeTab?.id, displayedHeaderGroups]);

  const rawRowsCount = activeTab?.rows_data?.length || 0;
  const totalRows = filteredRows.length;
  const isPaginationNeeded = !isHorizontalMonthTable && rawRowsCount > 25;
  const effectivePageSize = pageSize === 0 ? totalRows : pageSize;
  const totalPages =
    effectivePageSize > 0 ? Math.ceil(totalRows / effectivePageSize) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages || 1);

  const paginatedRows = useMemo(() => {
    if (!isPaginationNeeded || pageSize === 0) return filteredRows;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, isPaginationNeeded, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Banner Katim */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Icon icon="solar:pen-new-square-bold" width={20} />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Entry Data RHPK
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Tahun {selectedYear}
              </span>
              {isPicUser && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-[#005baa] flex items-center gap-1 shadow-2xs">
                  <Icon icon="solar:shield-check-bold" width={13} />
                  Akses Penuh PIC / Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {isPicUser
                ? "Pengisian data capaian target dan indikator bulanan. Sebagai PIC/Admin, Anda memiliki akses penuh untuk mengisi angka target dan data realisasi di seluruh file dokumen RHPK."
                : "Pengisian data capaian target dan indikator kegiatan bulanan Katim secara langsung ke sistem internal BBPOM."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tombol Unggah / Import Excel */}
            {selectedSpId &&
              (isPicUser ||
                !spreadsheets.find((s) => s.id === selectedSpId)
                  ?.is_readonly) && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-50 transition"
                  title="Unggah / Import data dari file Excel (.xlsx)"
                >
                  <Icon
                    icon="solar:file-smile-linear"
                    width={16}
                    className="text-emerald-700"
                  />
                  <span>Unggah Excel</span>
                </button>
              )}

            {spreadsheets.find((s) => s.id === selectedSpId)?.is_readonly &&
            !isPicUser ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 shadow-2xs">
                <Icon
                  icon="solar:eye-bold"
                  width={16}
                  className="text-amber-600"
                />
                <span>Mode Baca (Master Rekap Balai)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || dirtyCount === 0}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm transition ${
                  dirtyCount > 0
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-bold" width={16} />
                    <span>
                      Simpan Perubahan {dirtyCount > 0 ? `(${dirtyCount})` : ""}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Tombol Unduh Excel RHPK dengan Tanda Tangan Kabalai (Point 3) */}
            {activeSpreadsheet && (
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setShowExportDropdown((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition"
                  title="Unduh file Excel dokumen RHPK lengkap dengan format Tanda Tangan Kabalai"
                >
                  <Icon
                    icon="solar:file-download-bold"
                    width={16}
                    className="text-emerald-600"
                  />
                  <span>Unduh Excel (RHPK)</span>
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    width={14}
                    className="text-slate-400"
                  />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                      PILIH PERIODE UNDUH (RHPK)
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExportExcel("locked")}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex flex-col gap-0.5 transition"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Icon
                          icon="solar:lock-keyhole-bold"
                          width={13}
                          className="text-amber-500"
                        />
                        <span>Bulan Terkunci (Final)</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Khusus bulan final terkunci + Tanda Tangan Kabalai
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportExcel("all")}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg flex flex-col gap-0.5 transition"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Icon
                          icon="solar:calendar-bold"
                          width={13}
                          className="text-blue-500"
                        />
                        <span>Semua Bulan (1 - 12)</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Unduh seluruh 12 bulan + Tanda Tangan Kabalai
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:check-circle-bold"
              width={18}
              className="text-emerald-600"
            />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-700"
          >
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:danger-triangle-bold"
              width={18}
              className="text-red-600"
            />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-700">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {/* Selector Spreadsheet & Tab */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Tahun:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleSelectYear(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#005baa] focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.year_number}>
                    {y.year_number}
                  </option>
                ))}
              </select>
            </div>

            {/* IKSK Selector (Hanya IKSK yang diampu Katim) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                IKSK:
              </label>
              <select
                value={selectedIkskId ?? ""}
                onChange={(e) => handleSelectIksk(Number(e.target.value))}
                className="rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:bg-white focus:outline-none max-w-xs md:max-w-sm truncate"
              >
                {iksks.length === 0 ? (
                  <option value="">Tidak ada IKSK diampu</option>
                ) : (
                  iksks.map((i) => (
                    <option key={i.id} value={i.id}>
                      IKSK {i.id}. {i.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Document Info / Selector: jika hanya 1 file cukup info tanpa dropdown, jika >= 2 file baru muncul dropdown pilihan */}
            {spreadsheets.length <= 1 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Dokumen:
                </span>
                {spreadsheets.length === 1 ? (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-xs font-semibold text-slate-800 max-w-xs md:max-w-md truncate shadow-2xs"
                    title={spreadsheets[0].name}
                  >
                    <Icon
                      icon="solar:file-spreadsheet-bold"
                      width={16}
                      className="text-emerald-600 shrink-0"
                    />
                    <span className="truncate">{spreadsheets[0].name}</span>
                  </div>
                ) : (
                  <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 italic">
                    Belum ada dokumen untuk IKSK ini
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Pilih Dokumen:
                </label>
                <select
                  value={selectedSpId ?? ""}
                  onChange={(e) =>
                    handleSelectSpreadsheet(Number(e.target.value))
                  }
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:outline-none max-w-xs md:max-w-md truncate cursor-pointer shadow-2xs"
                >
                  {spreadsheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {spreadsheets.find((s) => s.id === selectedSpId)
                  ?.is_readonly && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                    <Icon icon="solar:lock-bold" width={11} />
                    Read-Only (Rekap Balai)
                  </span>
                )}
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {spreadsheets.length} Dokumen
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div>
              Bulan Berjalan:{" "}
              <strong className="text-slate-800">
                {currentMonth} (
                {[
                  "",
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
                ][currentMonth] || "Oktober"}
                )
              </strong>
            </div>
            {isPicUser && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isCurrentMonthLocked
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  <Icon
                    icon={
                      isCurrentMonthLocked
                        ? "solar:lock-bold"
                        : "solar:lock-unlocked-bold"
                    }
                    width={12}
                  />
                  {isCurrentMonthLocked
                    ? "Terkunci untuk Katim"
                    : "Terbuka untuk Katim"}
                </span>
                <button
                  type="button"
                  disabled={isTogglingLock}
                  onClick={handleToggleCurrentMonthLock}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                    isCurrentMonthLocked
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-white hover:bg-red-50 text-red-600 border border-red-200"
                  } disabled:opacity-50`}
                >
                  <Icon
                    icon={
                      isTogglingLock
                        ? "solar:refresh-circle-linear"
                        : isCurrentMonthLocked
                          ? "solar:lock-unlocked-bold"
                          : "solar:lock-bold"
                    }
                    width={13}
                    className={isTogglingLock ? "animate-spin" : ""}
                  />
                  <span>
                    {isTogglingLock
                      ? "Menyimpan..."
                      : isCurrentMonthLocked
                        ? "Buka Akses Katim"
                        : "Kunci Akses Katim"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        {selectedSpId && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {spreadsheets
              .find((s) => s.id === selectedSpId)
              ?.tabs?.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTab(t.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    selectedTabId === t.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.title}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Main Table Entry */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {activeTab ? activeTab.title : "Tabel Formulir"}
            </h2>
            <p className="text-xs text-slate-500">
              Kolom dengan latar hijau adalah kolom yang dapat Anda isi. Kolom
              terkunci dilindungi sistem.
            </p>
          </div>

          {activeTab && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Editable (Bisa Diisi)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Kolom Terkunci / Formula
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-emerald-600 border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat tabel isian...</p>
          </div>
        ) : !activeTab ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Pilih dokumen dan tab di atas untuk mulai mengisi data.
          </div>
        ) : (
          <>
            {/* Top Control Bar: Search, Filter Bulan & Navigasi Halaman Cepat */}
            {activeTab && (
              <div className="border-b border-slate-200 bg-slate-50/70 p-4 space-y-3">
                {/* Row 1: Filter Bulan Pills & Tombol Aksi (Template Excel, Import Excel, Tambah Baris) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  {availableMonths.length > 1 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                        <Icon
                          icon="solar:calendar-bold"
                          width={14}
                          className="text-emerald-600"
                        />
                        Filter Bulan:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonthFilter("all");
                          setCurrentPage(1);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                          selectedMonthFilter === "all"
                            ? "bg-emerald-600 text-white shadow-emerald-600/20"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        Semua Bulan ({rawRowsCount})
                      </button>
                      {availableMonths.map((m) => {
                        const isSelected =
                          selectedMonthFilter.toLowerCase() ===
                          m.name.toLowerCase();
                        return (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => {
                              setSelectedMonthFilter(m.name);
                              setCurrentPage(1);
                            }}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {m.name} ({m.count})
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Tombol Aksi Tabel Vertikal: Tambah Baris */}
                  {!isHorizontalMonthTable &&
                    !spreadsheets.find((s) => s.id === selectedSpId)
                      ?.is_readonly && (
                      <div className="flex flex-wrap items-center gap-2 ml-auto">
                        {/* Tombol Hapus Baris Terakhir (Khusus PIC) */}
                        {isPicEffective &&
                          activeTab?.rows_data &&
                          activeTab.rows_data.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRow(activeTab.rows_data.length - 1)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 shadow-2xs cursor-pointer"
                              title="Hapus baris paling akhir/bawah dari tabel ini"
                            >
                              <Icon
                                icon="solar:trash-bin-trash-bold"
                                width={14}
                                className="text-rose-600"
                              />
                              <span>Hapus Baris Terakhir</span>
                            </button>
                          )}
                        {/* Tombol Tambah Baris */}
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-2xs"
                          title="Tambah baris kegiatan baru pada bulan ini (urutan paling atas)"
                        >
                          <Icon
                            icon="solar:add-circle-bold"
                            width={15}
                            className="text-emerald-700"
                          />
                          <span>
                            + Tambah Baris{" "}
                            {selectedMonthFilter !== "all"
                              ? `(${selectedMonthFilter})`
                              : ""}
                          </span>
                        </button>
                      </div>
                    )}
                </div>

                {/* Row 2: Search input + Info baris + Top Pagination Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search Box */}
                  <div className="relative flex-1 max-w-sm">
                    <Icon
                      icon="solar:magnifer-linear"
                      width={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Cari di tabel (topik, akun, judul, dll)..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <Icon icon="solar:close-circle-bold" width={14} />
                      </button>
                    )}
                  </div>

                  {/* Right: Info, Page Size, Navigation */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span>
                        Menampilkan{" "}
                        <span className="font-bold text-slate-900">
                          {totalRows === 0
                            ? 0
                            : (safeCurrentPage - 1) * (pageSize || 1) + 1}
                        </span>{" "}
                        -{" "}
                        <span className="font-bold text-slate-900">
                          {Math.min(
                            safeCurrentPage * (pageSize || 1),
                            totalRows,
                          )}
                        </span>{" "}
                        dari{" "}
                        <span className="font-bold text-slate-900">
                          {totalRows}
                        </span>{" "}
                        baris
                        {selectedMonthFilter !== "all" && (
                          <span className="ml-1 text-emerald-700 font-semibold">
                            ({selectedMonthFilter})
                          </span>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5 ml-1 border-l border-slate-300 pl-3">
                        <span className="text-[11px] text-slate-500">
                          Per Hal:
                        </span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                            scrollToTableTop();
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={200}>200</option>
                          <option value={0}>Semua ({totalRows})</option>
                        </select>
                      </div>
                    </div>

                    {pageSize > 0 && totalPages > 1 && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage(1);
                            scrollToTableTop();
                          }}
                          disabled={safeCurrentPage === 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                          title="Halaman Pertama"
                        >
                          <Icon
                            icon="solar:double-alt-arrow-left-linear"
                            width={14}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage((p) => Math.max(p - 1, 1));
                            scrollToTableTop();
                          }}
                          disabled={safeCurrentPage === 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                          title="Halaman Sebelumnya"
                        >
                          <Icon icon="solar:alt-arrow-left-linear" width={14} />
                        </button>

                        <span className="px-2 font-bold text-xs text-slate-700">
                          Hal {safeCurrentPage} / {totalPages}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage((p) => Math.min(p + 1, totalPages));
                            scrollToTableTop();
                          }}
                          disabled={safeCurrentPage === totalPages}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                          title="Halaman Selanjutnya"
                        >
                          <Icon
                            icon="solar:alt-arrow-right-linear"
                            width={14}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage(totalPages);
                            scrollToTableTop();
                          }}
                          disabled={safeCurrentPage === totalPages}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                          title="Halaman Terakhir"
                        >
                          <Icon
                            icon="solar:double-alt-arrow-right-linear"
                            width={14}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Keterangan Status & Petunjuk Pengisian (Ringkas & Jelas) */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-5 border-b border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Icon icon="solar:info-circle-bold" width={13} className="text-[#005baa]" />
                  Keterangan:
                </span>
                <div className="flex items-center gap-1.5" title="Baris pada bulan ini belum diisi oleh Katim">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0" />
                  <span className="text-slate-600 font-medium">Belum diisi</span>
                </div>
                <div className="flex items-center gap-1.5" title="Baris pada bulan ini sudah memiliki data terisi">
                  <Icon
                    icon="solar:check-circle-bold"
                    width={14}
                    className="text-emerald-600 shrink-0"
                  />
                  <span className="text-slate-600 font-medium">Sudah diisi</span>
                </div>

                {/* Penjelasan tanda ∑ (Akumulasi) vs tanpa ∑ */}
                <div className="flex items-center gap-1.5" title="Kolom berlabel ∑ mengakumulasikan nilai dari bulan sebelumnya secara otomatis">
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-blue-100 font-mono text-[10px] font-black text-blue-800 border border-blue-200 shrink-0">
                    ∑
                  </span>
                  <span className="text-slate-700 font-medium">
                    <strong>∑ (Akumulasi):</strong> Cukup input angka bulanan, sistem otomatis menjumlahkan. <em>Tanpa ∑</em>: Input angka final langsung.
                  </span>
                </div>

                {/* Tombol Lihat (Multi-Katim / Mode Hanya Lihat) */}
                <div className="flex items-center gap-1.5" title="Tombol untuk melihat rincian pengisi antar-katim atau membuka data saat periode terkunci">
                  <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                    <Icon icon="solar:eye-bold" width={12} className="text-indigo-600" />
                    Lihat
                  </span>
                  <span className="text-slate-600 font-medium">Rincian kontributor / mode lihat saat periode terkunci</span>
                </div>
              </div>
            </div>

            <div
              id="main-rhpk-table-container"
              className="w-full overflow-x-auto"
            >
              <table className="w-full border-collapse text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
                  {displayedHeaderGroups ? (
                    <>
                      {/* Baris 1: Header Non-Parent (rowSpan 2 atau 3) & Header Grup Utama */}
                      <tr
                        className={`border-b ${isCyanHeader ? "border-cyan-400 bg-cyan-300" : "border-slate-200"}`}
                      >
                        {displayedHeaderGroups.map((grp, gIdx) => {
                          if (!grp.parent) {
                            return grp.cols.map((col) => {
                              const globalColIdx =
                                displayedColumnsSchema.findIndex(
                                  (c) => c.key === col.key,
                                );
                              const stickyStyle = leftStickyConfig.getClasses(
                                globalColIdx,
                                true,
                              );
                              const widthCls = getColWidthStyle(col);

                              return (
                                <th
                                  key={col.key}
                                  rowSpan={hasSubParents ? 3 : 2}
                                  className={`py-3 px-3 font-bold text-center border-r border-b ${
                                    isCyanHeader
                                      ? "bg-cyan-200 text-cyan-950 border-cyan-400"
                                      : "bg-slate-50 text-slate-800 border-slate-200"
                                  } ${widthCls} ${stickyStyle}`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span
                                      className={`font-mono text-[10px] ${isCyanHeader ? "text-cyan-800 font-bold" : "text-slate-400"}`}
                                    >
                                      [{col.col_letter}]
                                    </span>
                                    {col.can_edit &&
                                    (isPicUser ||
                                      !col.allowed_katim_ids ||
                                      col.allowed_katim_ids.length === 0 ||
                                      col.allowed_katim_ids.some(
                                        (id: string | number) =>
                                          String(id) === String(user?.id),
                                      )) ? (
                                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                         <span>Editable</span>
                                         {isCumulativeCol(col) && (
                                           <span
                                             className="rounded bg-emerald-200/90 px-1 font-mono text-[9px] text-emerald-950 font-black"
                                             title="Kolom akumulasi otomatis: input angka bulanan, sistem otomatis menjumlahkan dengan bulan sebelumnya"
                                           >
                                             ∑
                                           </span>
                                         )}
                                       </span>
                                    ) : col.type === "formula" ? (
                                      <span
                                        className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800 cursor-help"
                                        title={
                                          col.formula
                                            ? `Rumus: ${col.formula.replace(/([A-Za-z]+)\d+/g, "$1")} (dihitung otomatis per baris)`
                                            : "Dihitung otomatis untuk setiap baris bulan"
                                        }
                                      >
                                        Formula
                                      </span>
                                    ) : (
                                      <Icon
                                        icon="solar:lock-bold"
                                        width={12}
                                        className={
                                          isCyanHeader
                                            ? "text-cyan-700"
                                            : "text-slate-400"
                                        }
                                      />
                                    )}
                                  </div>
                                  <div className="text-xs font-bold leading-tight">
                                    {col.label}
                                  </div>
                                  {col.sub_label &&
                                    col.sub_label !== col.label && (
                                      <div
                                        className={`text-[10px] font-normal mt-0.5 ${isCyanHeader ? "text-cyan-900" : "text-slate-500"}`}
                                      >
                                        {col.sub_label}
                                      </div>
                                    )}
                                </th>
                              );
                            });
                          }

                          const mColor = getMonthColor(grp.parent);
                          const grpMonthNum = getMonthNumberFromText(
                            grp.parent,
                          );
                          const isGrpLocked =
                            !isPicUser &&
                            grpMonthNum !== null &&
                            Boolean(monthLocksMap[grpMonthNum]);

                          return (
                            <th
                              key={`grp-${gIdx}-${grp.parent}`}
                              colSpan={grp.cols.length}
                              className={`py-2.5 px-3 font-bold border-b border-r text-center text-xs tracking-wider uppercase ${
                                isCyanHeader
                                  ? "bg-cyan-300 text-cyan-950 border-cyan-400 shadow-2xs font-extrabold"
                                  : `${mColor.header} border-slate-300`
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                {!isCyanHeader && (
                                  <span
                                    className={`size-2 rounded-full inline-block ${mColor.dot}`}
                                  />
                                )}
                                <span>{grp.parent}</span>
                                {isGrpLocked && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-slate-200/90 text-slate-700 px-1.5 py-0.5 text-[9px] font-bold lowercase tracking-normal">
                                    <Icon icon="solar:lock-bold" width={10} />
                                    terkunci
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>

                      {/* Baris 2: Sub-Parent Cara Perhitungan jika ada (Tier 2 untuk IKSK 4 KLB dsb) */}
                      {hasSubParents && (
                        <tr
                          className={`border-b ${isCyanHeader ? "bg-cyan-100 border-cyan-400" : "bg-slate-100 border-slate-200"}`}
                        >
                          {displayedHeaderGroups.map((grp, gIdx) => {
                            if (!grp.parent) return null;
                            const subParentText = grp.cols[0]?.sub_parent || "";
                            return (
                              <th
                                key={`subgrp-${gIdx}-${grp.parent}`}
                                colSpan={grp.cols.length}
                                className={`py-2.5 px-4 font-semibold text-center text-xs border-r border-b whitespace-pre-line leading-relaxed ${
                                  isCyanHeader
                                    ? "bg-cyan-100 text-cyan-950 border-cyan-400 shadow-inner"
                                    : "bg-slate-100 text-slate-800 border-slate-200"
                                }`}
                              >
                                {subParentText}
                              </th>
                            );
                          })}
                        </tr>
                      )}

                      {/* Baris 3 (atau Baris 2 normal): Sub-Kolom di bawah grup */}
                      <tr
                        className={`border-b ${isCyanHeader ? "bg-cyan-200 border-cyan-400" : "bg-slate-50 border-slate-200"}`}
                      >
                        {displayedHeaderGroups.map((grp) => {
                          if (!grp.parent) return null;
                          const mColor = getMonthColor(grp.parent);
                          const grpMonthNum = getMonthNumberFromText(
                            grp.parent,
                          );
                          const isGrpLocked =
                            !isPicUser &&
                            grpMonthNum !== null &&
                            Boolean(monthLocksMap[grpMonthNum]);
                          return grp.cols.map((col) => {
                            const colMonthNum =
                              grpMonthNum || getMonthNumberFromText(col.label);
                            const isColMonthLocked =
                              !isPicUser &&
                              colMonthNum !== null &&
                              Boolean(monthLocksMap[colMonthNum]);
                            const isColAllowedForUser =
                              isPicUser ||
                              !col.allowed_katim_ids ||
                              col.allowed_katim_ids.length === 0 ||
                              col.allowed_katim_ids.some(
                                (id: string | number) =>
                                  String(id) === String(user?.id),
                              );
                            const isEditableForMe =
                              col.can_edit &&
                              isColAllowedForUser &&
                              !isColMonthLocked;
                            const subTitle =
                              col.sub_label ||
                              (col.label && col.label.includes(" - ")
                                ? col.label
                                    .split(" - ")
                                    .slice(1)
                                    .join(" - ")
                                    .trim()
                                : col.label);
                            const widthCls = getColWidthStyle(col);

                            return (
                              <th
                                key={col.key}
                                className={`py-2 px-3 font-semibold border-r border-b last:border-r-0 ${widthCls} ${
                                  isCyanHeader
                                    ? "bg-cyan-200/90 text-cyan-950 border-cyan-400 text-center"
                                    : isEditableForMe
                                      ? "bg-emerald-50/60 text-emerald-950 border-slate-200"
                                      : `${mColor.sub} border-slate-200`
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className={`font-mono text-[10px] ${isCyanHeader ? "text-cyan-800 font-bold" : "text-slate-400"}`}
                                  >
                                    [{col.col_letter}]
                                  </span>
                                  {isEditableForMe ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                         <span>Editable</span>
                                         {isCumulativeCol(col) && (
                                           <span
                                             className="rounded bg-emerald-200/90 px-1 font-mono text-[9px] text-emerald-950 font-black"
                                             title="Kolom akumulasi otomatis: input angka bulanan, sistem otomatis menjumlahkan dengan bulan sebelumnya"
                                           >
                                             ∑
                                           </span>
                                         )}
                                       </span>
                                  ) : col.type === "formula" ? (
                                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800">
                                      Formula
                                    </span>
                                  ) : (
                                    <Icon
                                      icon="solar:lock-bold"
                                      width={12}
                                      className={
                                        isCyanHeader
                                          ? "text-cyan-700"
                                          : "text-slate-400"
                                      }
                                    />
                                  )}
                                </div>
                                <div className="text-[11px] leading-tight font-medium">
                                  {subTitle}
                                </div>
                                {col.sub_label &&
                                  col.sub_label !== subTitle && (
                                    <div
                                      className={`text-[10px] font-normal mt-0.5 ${isCyanHeader ? "text-cyan-900" : "text-slate-500"}`}
                                    >
                                      {col.sub_label}
                                    </div>
                                  )}
                              </th>
                            );
                          });
                        })}
                      </tr>
                    </>
                  ) : (
                    <tr>
                      {displayedColumnsSchema.map((col, cIdx) => {
                        const isEditableForMe = col.can_edit;
                        const stickyStyle = leftStickyConfig.getClasses(
                          cIdx,
                          true,
                        );
                        return (
                          <th
                            key={col.key}
                            className={`py-3 px-3.5 font-bold border-r border-slate-200 last:border-r-0 ${
                              stickyStyle ||
                              (isEditableForMe
                                ? "bg-emerald-50/60 text-emerald-950 min-w-[130px]"
                                : "text-slate-700 min-w-[130px]")
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-[10px] text-slate-400">
                                [{col.col_letter}]
                              </span>
                              {isEditableForMe ? (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                         <span>Editable</span>
                                         {isCumulativeCol(col) && (
                                           <span
                                             className="rounded bg-emerald-200/90 px-1 font-mono text-[9px] text-emerald-950 font-black"
                                             title="Kolom akumulasi otomatis: input angka bulanan, sistem otomatis menjumlahkan dengan bulan sebelumnya"
                                           >
                                             ∑
                                           </span>
                                         )}
                                       </span>
                              ) : col.type === "formula" ? (
                                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800">
                                  Formula
                                </span>
                              ) : (
                                <Icon
                                  icon="solar:lock-bold"
                                  width={12}
                                  className="text-slate-400"
                                />
                              )}
                            </div>
                            <div className="text-xs leading-tight">
                              {col.label}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={displayedColumnsSchema.length || 1}
                        className="py-12 text-center text-xs text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Icon
                            icon="solar:magnifer-linear"
                            width={24}
                            className="text-slate-400"
                          />
                          <span className="font-semibold text-slate-700">
                            Tidak ada baris data yang cocok
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {searchQuery
                              ? `Tidak ditemukan data dengan kata kunci "${searchQuery}"`
                              : "Tidak ada data untuk filter bulan yang dipilih."}
                          </span>
                          {(searchQuery || selectedMonthFilter !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery("");
                                setSelectedMonthFilter("all");
                                setCurrentPage(1);
                              }}
                              className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              Reset Filter & Tampilkan Semua
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, rIdx) => {
                      const isMultiRowTable =
                        (activeTab?.rows_data?.length || 0) > 12 ||
                        Boolean(monthColKey);
                      const originalIdx =
                        row.row_index !== undefined
                          ? row.row_index
                          : isPaginationNeeded && pageSize > 0
                            ? (safeCurrentPage - 1) * pageSize + rIdx
                            : rIdx;
                      const rowKey =
                        row.month !== undefined &&
                        row.month !== null &&
                        row.month !== 0
                          ? row.month
                          : row.row_index !== undefined
                            ? row.row_index
                            : originalIdx;
                      const rowIdxNum =
                        row.row_index !== undefined
                          ? row.row_index
                          : originalIdx;
                      const isMonthRow = !(
                        (row as any).is_month_row === false ||
                        (row.month !== undefined && row.month === 0)
                      );
                      const isMonthLocked = isMonthRow && row.is_locked;
                      const isCurrent = isMonthRow && row.is_current;
                      const canEditThisRow = row.can_edit_row !== false;
                      const isSectionRow =
                        (row as any).row_type === "section" ||
                        row.cells?.col_1 === "Survey Tatap Muka" ||
                        row.cells?.col_1 === "Survey Media";
                      const isFormulaRow =
                        (row as any).row_type === "formula" ||
                        [
                          "Indeks Tatap Muka",
                          "Indeks Media",
                          "Total Responden",
                          "Indeks Rata-rata",
                          "%Capaian",
                        ].includes(row.cells?.col_1);
                      const isQuestionRow =
                        (row as any).row_type === "question" ||
                        (typeof row.cells?.col_1 === "string" &&
                          row.cells.col_1.startsWith("- "));
                      const isTotalRow = Boolean(
                        row.is_total ||
                        row.row_name === "Total" ||
                        row.cells?.col_0 === "Total" ||
                        (typeof row.cells?.col_0 === "string" &&
                          row.cells.col_0.toLowerCase() === "total") ||
                        isFormulaRow,
                      );

                      const isHighlightedIncomplete =
                        highlightedIncompleteRows.includes(rowIdxNum) ||
                        highlightedIncompleteRows.includes(originalIdx);

                      const isUpdatedRow = Boolean(row.is_updated);
                      const isDirtyRow = Object.values(dirtyUpdates).some(
                        (up) =>
                          (up.row_index !== undefined &&
                            up.row_index === originalIdx) ||
                          (up.month !== undefined && up.month === row.month),
                      );
                      const isRowFilled = isUpdatedRow || isDirtyRow;

                      return (
                        <tr
                          key={rowKey}
                          id={`local-row-${rowKey}`}
                          className={`transition ${
                            isHighlightedIncomplete
                              ? "ring-2 ring-inset ring-amber-400 bg-amber-50/60"
                              : isSectionRow
                                ? "bg-slate-100 font-bold border-y border-slate-300 text-slate-900"
                                : isFormulaRow
                                  ? "bg-emerald-50/70 font-bold border-y border-emerald-300 text-slate-900 hover:bg-emerald-100/60"
                                  : isTotalRow
                                    ? "bg-emerald-50/70 font-bold border-t-2 border-emerald-300 text-slate-900 hover:bg-emerald-100/60"
                                    : isRowFilled
                                      ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] border-l-4 border-l-emerald-500"
                                      : "bg-rose-500/[0.07] hover:bg-rose-500/[0.13] border-l-4 border-l-rose-400"
                          }`}
                        >
                          {displayedColumnsSchema.map((col, cIdx) => {
                            const val = row.cells?.[col.key] ?? "";
                            const colMonthNum =
                              getMonthNumberFromText(col.parent_header) ||
                              getMonthNumberFromText(col.label);
                            const isColMonthLocked =
                              !isPicUser &&
                              colMonthNum !== null &&
                              Boolean(monthLocksMap[colMonthNum]);

                            const isIndeksKieTab =
                              activeTab?.id === 135 ||
                              Boolean(
                                activeTab?.title
                                  ?.toLowerCase()
                                  .includes("indeks kie"),
                              );
                            const isIndeksKieEditableRow =
                              isIndeksKieTab &&
                              (row.cells?.col_1 === "Jumlah Responden" ||
                                row.cells?.col_1 === "Target Indeks" ||
                                isQuestionRow);

                            const isUserAllowedForCol =
                              isPicUser ||
                              !col.allowed_katim_ids ||
                              col.allowed_katim_ids.length === 0 ||
                              col.allowed_katim_ids.some(
                                (id: string | number) =>
                                  String(id) === String(user?.id),
                              );

                            const canEditCell =
                              col.can_edit &&
                              isUserAllowedForCol &&
                              !isMonthLocked &&
                              !isColMonthLocked &&
                              canEditThisRow &&
                              (!isTotalRow || isIndeksKieEditableRow) &&
                              (!isFormulaRow || isIndeksKieEditableRow) &&
                              !isSectionRow;
                            const isNum = typeof val === "number";
                            const isCollab = isCollaborativeCol(col);

                            const stickyBg = isSectionRow
                              ? "bg-slate-200"
                              : isFormulaRow || isTotalRow
                                ? "bg-emerald-100"
                                : isQuestionRow
                                  ? "bg-blue-100"
                                  : isHighlightedIncomplete
                                    ? "bg-amber-100"
                                    : "bg-white";

                            const stickyTdClass = leftStickyConfig.getClasses(
                              cIdx,
                              false,
                              stickyBg,
                            );

                            // Untuk baris section header (cIdx >= leftStickyConfig.count tampil kosong)
                            if (
                              isSectionRow &&
                              cIdx >= Math.max(leftStickyConfig.count, 2)
                            ) {
                              return (
                                <td
                                  key={col.key}
                                  className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 bg-slate-50/40 text-center text-slate-300 font-mono"
                                >
                                  -
                                </td>
                              );
                            }

                            // Render khusus untuk kolom Catatan Kolaboratif (Kendala / Rencana Tindak Lanjut)
                            if (isCollab) {
                              const notes = parseNotes(val);
                              const rowMonthName =
                                resolveRowMonthName(row, monthColKey) ||
                                row.month_name ||
                                `Bulan ${row.month ?? rowIdxNum + 1}`;

                              return (
                                <td
                                  key={col.key}
                                  className={`p-2 border-r border-slate-100 last:border-r-0 min-w-[240px] max-w-[340px] align-top ${stickyTdClass} ${
                                    canEditCell
                                      ? "bg-emerald-50/15"
                                      : "bg-slate-50/20"
                                  }`}
                                >
                                  <div
                                    onClick={() =>
                                      handleOpenCollabModal(
                                        Number(row.month ?? rowIdxNum),
                                        col,
                                        val,
                                        rowMonthName,
                                        canEditCell,
                                        rowIdxNum,
                                      )
                                    }
                                    className={`group relative flex flex-col justify-between rounded-xl border p-2.5 transition cursor-pointer ${
                                      notes.length > 0
                                        ? "border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs"
                                        : canEditCell
                                          ? "border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-100/50"
                                          : "border-dashed border-slate-200 bg-slate-50/50"
                                    }`}
                                    title={`Klik untuk mengelola catatan PIC: ${col.label}`}
                                  >
                                    {notes.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {notes.map((n, idx) => (
                                          <div
                                            key={idx}
                                            className="text-xs leading-relaxed text-slate-800 flex items-start gap-1.5"
                                          >
                                            <span className="font-bold text-slate-400 shrink-0 text-[11px]">
                                              {idx + 1}.
                                            </span>
                                            <div className="flex-1 break-words">
                                              <span>{n.text}</span>
                                              {n.author && (
                                                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-blue-100 text-[#005baa] font-bold px-2 py-0.2 text-[10px] whitespace-nowrap">
                                                  + {n.author}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 py-1 text-xs">
                                        <Icon
                                          icon="solar:chat-round-line-linear"
                                          width={15}
                                          className={
                                            canEditCell
                                              ? "text-emerald-600"
                                              : "text-slate-400"
                                          }
                                        />
                                        <span
                                          className={`italic text-[11px] ${
                                            canEditCell
                                              ? "text-emerald-700 font-medium"
                                              : "text-slate-400"
                                          }`}
                                        >
                                          {canEditCell
                                            ? `+ Tambah catatan (+ ${
                                                user?.name || "Anda"
                                              })`
                                            : "Belum ada catatan"}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-slate-100 text-[10px]">
                                      <span className="font-bold text-[#005baa] flex items-center gap-1">
                                        <Icon
                                          icon="solar:chat-round-dots-bold"
                                          width={11}
                                        />
                                        {notes.length} Catatan PIC
                                      </span>
                                      <span className="text-slate-400 group-hover:text-[#005baa] flex items-center gap-0.5 font-semibold transition">
                                        <Icon
                                          icon="solar:pen-new-square-bold"
                                          width={12}
                                        />
                                        {canEditCell
                                          ? "Kelola Catatan"
                                          : "Lihat"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            // Kolom angka kolaboratif multi-katim (Point 6)
                            const isCollabNumeric =
                              col.type !== "formula" &&
                              col.type !== "readonly" &&
                              !isCollab &&
                              Array.isArray(col.allowed_katim_ids) &&
                              col.allowed_katim_ids.length > 1;

                            if (isCollabNumeric) {
                              const contribs = (row.cells?.[
                                col.key + "_contributors"
                              ] || {}) as Record<string, any>;
                              const contribList = Object.values(
                                contribs,
                              ) as Array<{
                                author?: string;
                                value?: number;
                                updated_at?: string;
                                user_id?: string;
                              }>;
                              const isCum = isCumulativeCol(col);
                              const rawInput = row.cells?.[col.key + "_input"];
                              const monthDelta =
                                rawInput !== undefined &&
                                rawInput !== null &&
                                rawInput !== ""
                                  ? rawInput
                                  : contribList.length > 0
                                    ? contribList.reduce(
                                        (acc, c) =>
                                          acc +
                                          (parseFloat(String(c?.value || 0)) ||
                                            0),
                                        0,
                                      )
                                    : rowIdxNum === 0
                                      ? val
                                      : activeTab?.rows_data &&
                                          rowIdxNum !== undefined &&
                                          rowIdxNum > 0 &&
                                          Number(val) >=
                                            Number(
                                              activeTab.rows_data[rowIdxNum - 1]
                                                ?.cells?.[col.key] || 0,
                                            ) &&
                                          Number(
                                            activeTab.rows_data[rowIdxNum - 1]
                                              ?.cells?.[col.key] || 0,
                                          ) > 0
                                        ? Number(val) -
                                          Number(
                                            activeTab.rows_data[rowIdxNum - 1]
                                              ?.cells?.[col.key] || 0,
                                          )
                                        : val;

                              return (
                                <td
                                  key={col.key}
                                  className={`p-1.5 border-r border-slate-100 last:border-r-0 ${stickyTdClass} bg-indigo-50/20`}
                                >
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center justify-between w-full gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenCollabNumModal(
                                            row,
                                            col,
                                            rowIdxNum,
                                            canEditCell,
                                          )
                                        }
                                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300 transition shadow-2xs cursor-pointer"
                                        title="Klik untuk membuka rincian kontributor & input angka Anda"
                                      >
                                        <span>
                                          {contribList.length > 0
                                            ? `${contribList.length} Katim`
                                            : canEditCell
                                              ? "Input"
                                              : "Lihat"}
                                        </span>
                                      </button>
                                      <span className="font-mono font-bold text-xs text-slate-900 pr-1">
                                        {val !== "" && val !== null
                                          ? String(val)
                                          : "-"}
                                      </span>
                                    </div>
                                    {isCum &&
                                      rowIdxNum !== undefined &&
                                      rowIdxNum > 0 &&
                                      val !== "" &&
                                      val !== null && (
                                        <div className="flex items-center justify-between w-full text-[10px] font-mono px-0.5 mt-0.5">
                                          <span className="text-[9px] text-slate-400">
                                            Bln ini:
                                          </span>
                                          <span
                                            className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded text-[10px]"
                                            title="Total kontribusi seluruh Katim khusus bulan ini"
                                          >
                                            +{monthDelta}
                                          </span>
                                          <span className="text-[9px] text-slate-400">
                                            ∑:
                                          </span>
                                          <span
                                            className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded text-[10px]"
                                            title="Total kumulatif s.d. bulan ini"
                                          >
                                            {String(val)}
                                          </span>
                                        </div>
                                      )}
                                    {contribList.length > 0 && (
                                      <div
                                        className="text-[10px] text-slate-500 font-sans line-clamp-1 text-right max-w-[170px]"
                                        title={contribList
                                          .map(
                                            (c) =>
                                              `${c.author || "Katim"}: ${c.value ?? 0}`,
                                          )
                                          .join(", ")}
                                      >
                                        {contribList
                                          .map(
                                            (c) =>
                                              `${(c.author || "Katim").split(" ")[0]}: ${c.value ?? 0}`,
                                          )
                                          .join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            }

                            // Kolom standar editable (input angka/teks)
                            if (canEditCell) {
                              return (
                                <td
                                  key={col.key}
                                  className={`p-1 border-r border-slate-100 last:border-r-0 ${stickyTdClass} ${
                                    isQuestionRow
                                      ? "bg-blue-50/25"
                                      : "bg-emerald-50/20"
                                  }`}
                                >
                                  {col.col_letter === "D" ||
                                  (col.label || "")
                                    .toLowerCase()
                                    .includes("identitas") ? (
                                    <textarea
                                      rows={3}
                                      value={val}
                                      onChange={(e) =>
                                        handleCellChange(
                                          Number(rowKey),
                                          col.key,
                                          e.target.value,
                                          rowIdxNum,
                                        )
                                      }
                                      onBlur={(e) =>
                                        handleCellBlur(
                                          Number(rowKey),
                                          col,
                                          e.target.value,
                                          rowIdxNum,
                                        )
                                      }
                                      placeholder={getCellPlaceholder(
                                        col,
                                        rowIdxNum,
                                      )}
                                      className="w-full rounded-lg px-2.5 py-1.5 text-xs border border-slate-200 bg-white text-slate-900 leading-tight focus:ring-1 focus:outline-none focus:border-emerald-600 focus:ring-emerald-600 resize-y font-medium"
                                    />
                                  ) : (
                                    (() => {
                                      const isCum = isCumulativeCol(col);
                                      const rawInput =
                                        row.cells?.[col.key + "_input"];
                                      const cellVal = row.cells?.[col.key];
                                      const prevVal =
                                        activeTab?.rows_data &&
                                        rowIdxNum !== undefined &&
                                        rowIdxNum > 0
                                          ? Number(
                                              activeTab.rows_data[rowIdxNum - 1]
                                                ?.cells?.[col.key] || 0,
                                            )
                                          : 0;
                                      const displayVal = isCum
                                        ? rawInput !== undefined &&
                                          rawInput !== null &&
                                          rawInput !== ""
                                          ? rawInput
                                          : rowIdxNum === 0
                                            ? cellVal
                                            : Number(cellVal) >= prevVal &&
                                                prevVal > 0
                                              ? Number(cellVal) - prevVal
                                              : cellVal
                                        : val;
                                      const cumulativeVal = isCum
                                        ? (cellVal ?? displayVal)
                                        : null;

                                      return (
                                        <div>
                                          <input
                                            type="text"
                                            inputMode="decimal"
                                            value={displayVal ?? ""}
                                            onChange={(e) =>
                                              handleCellChange(
                                                Number(rowKey),
                                                col.key,
                                                e.target.value,
                                                rowIdxNum,
                                              )
                                            }
                                            onBlur={(e) =>
                                              handleCellBlur(
                                                Number(rowKey),
                                                col,
                                                e.target.value,
                                                rowIdxNum,
                                              )
                                            }
                                            onWheel={(e) =>
                                              (e.target as HTMLElement).blur()
                                            }
                                            placeholder={
                                              isCum
                                                ? "Input angka bulan ini"
                                                : getCellPlaceholder(
                                                    col,
                                                    rowIdxNum,
                                                  )
                                            }
                                            title={
                                              isCum
                                                ? "Kolom kumulatif: Masukkan angka penambahan bulan ini (otomatis dijumlahkan dengan bulan lalu)"
                                                : col.col_letter === "F" ||
                                                    (col.label || "")
                                                      .toLowerCase()
                                                      .includes("target sampel")
                                                  ? "Target Sampel: Masukkan nilai exact (misal 16)"
                                                  : col.col_letter === "G" &&
                                                      (col.label || "")
                                                        .toLowerCase()
                                                        .includes(
                                                          "target indikator",
                                                        )
                                                    ? "Target Indikator (%): Masukkan nilai exact target (misal 99.71)"
                                                    : [
                                                          "G",
                                                          "H",
                                                          "J",
                                                          "K",
                                                          "M",
                                                          "N",
                                                        ].includes(
                                                          (
                                                            col.col_letter || ""
                                                          ).toUpperCase(),
                                                        ) ||
                                                        (col.label || "")
                                                          .toLowerCase()
                                                          .includes("sarana") ||
                                                        (col.label || "")
                                                          .toLowerCase()
                                                          .includes("renlak")
                                                      ? `Masukkan nilai exact kumulatif (misal 24) atau formula penjumlahan dari bulan sebelumnya (misal =+11 atau =${(col.col_letter || "G").toUpperCase()}${rowIdxNum ? rowIdxNum + 1 : 2}+11)`
                                                      : col.col_letter
                                                        ? `Masukkan nilai exact atau formula penjumlahan (misal =+5 atau =${col.col_letter.toUpperCase()}${rowIdxNum ? rowIdxNum + 1 : 2}+5)`
                                                        : "Masukkan angka"
                                            }
                                            className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                              isQuestionRow
                                                ? "border border-blue-300 bg-white text-blue-950 focus:border-blue-600 focus:ring-blue-600 font-semibold text-right"
                                                : "border border-slate-200 bg-white text-slate-900 focus:border-emerald-600 focus:ring-emerald-600 font-medium"
                                            }`}
                                          />
                                          {isCum &&
                                            rowIdxNum !== undefined &&
                                            rowIdxNum > 0 && (
                                              <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-500 font-mono">
                                                <span className="text-[9px] text-slate-400">
                                                  Kumulatif:
                                                </span>
                                                <span
                                                  className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded text-[10px]"
                                                  title="Hasil penjumlahan otomatis dari input bulan ini + total bulan sebelumnya"
                                                >
                                                  ∑ {cumulativeVal}
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                      );
                                    })()
                                  )}
                                </td>
                              );
                            }

                            const isTheMonthCol = monthColKey
                              ? col.key === monthColKey
                              : (cIdx === 0 || col.key === "col_0");
                            const showLockedBadge =
                              isMonthLocked &&
                              isMonthRow &&
                              isTheMonthCol;

                            const showStatusBadge =
                              isTheMonthCol &&
                              !isSectionRow &&
                              !isTotalRow &&
                              !isFormulaRow;

                            return (
                              <td
                                key={col.key}
                                className={`py-2.5 px-3.5 border-r border-slate-100 last:border-r-0 text-xs ${stickyTdClass} ${
                                  isNum
                                    ? "text-right font-mono"
                                    : "text-left text-slate-700"
                                } ${
                                  isFormulaRow
                                    ? "bg-slate-200 text-slate-900 font-bold border-b border-slate-300"
                                    : isQuestionRow && col.type === "formula"
                                      ? "bg-slate-200 text-slate-900 font-semibold"
                                      : isTotalRow
                                        ? "bg-slate-200 text-slate-900 font-bold border-b border-slate-300"
                                        : col.type === "formula"
                                          ? "bg-slate-200 text-slate-800 font-semibold"
                                          : isMonthLocked || isColMonthLocked || !col.can_edit
                                            ? "bg-slate-200/80 text-slate-600 font-medium"
                                            : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>
                                      {val !== "" ? String(val) : "-"}
                                    </span>
                                    {showStatusBadge &&
                                      (isRowFilled ? (
                                        <span
                                          className="inline-flex items-center text-emerald-600 shrink-0"
                                          title="Baris ini sudah diisi / terisi"
                                        >
                                          <Icon
                                            icon="solar:check-circle-bold"
                                            width={14}
                                          />
                                        </span>
                                      ) : (
                                        <span
                                          className="inline-flex items-center shrink-0"
                                          title="Baris ini belum diisi"
                                        >
                                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                                        </span>
                                      ))}
                                  </div>
                                  {isPicEffective &&
                                    cIdx === 0 &&
                                    !isSectionRow &&
                                    !isTotalRow &&
                                    !isFormulaRow && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteRow(originalIdx);
                                        }}
                                        className="inline-flex items-center justify-center h-5 w-5 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-100/80 transition cursor-pointer shrink-0 ml-1"
                                        title={`Hapus baris ini (${row.month_name || `Baris ke-${originalIdx + 1}`})`}
                                      >
                                        <Icon
                                          icon="solar:trash-bin-trash-bold"
                                          width={13}
                                        />
                                      </button>
                                    )}
                                  {showLockedBadge && (
                                    <span className="rounded bg-slate-200 px-1 py-0.2 text-[9px] text-slate-600">
                                      Terkunci
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Catatan Dokumen (khususnya untuk Caput RO) */}
            {(activeTab?.id === 70 ||
              activeTab?.title?.toLowerCase().includes("caput ro")) && (
              <div className="m-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 shadow-2xs">
                <Icon
                  icon="solar:info-circle-bold"
                  className="size-4 shrink-0 text-blue-600 mt-0.5"
                />
                <div className="leading-relaxed">
                  <strong className="font-bold text-blue-950">
                    Catatan Dokumen:
                  </strong>{" "}
                  Data Realisasi RO Sampel Obat, OBA, SK dan Kos dihitung dari
                  data Realisasi Sampling tiap bulannya.
                </div>
              </div>
            )}

            {/* Legend untuk Indeks KIE */}
            {(activeTab?.id === 135 ||
              activeTab?.title?.toLowerCase().includes("indeks kie")) && (
              <div className="m-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Keterangan Dokumen:
                </div>
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-4 rounded bg-[#418ab3] shadow-xs inline-block" />
                    <span className="font-bold text-[#1f4e78]">Ibu Win</span>
                    <span className="text-slate-500 text-[11px]">
                      (Evaluasi Survey Tatap Muka & Media - Skala 4)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-4 rounded bg-[#70ad47] shadow-xs inline-block" />
                    <span className="font-bold text-[#385723]">Rumus</span>
                    <span className="text-slate-500 text-[11px]">
                      (Dihitung Otomatis: Indeks Tatap Muka, Indeks Media, Total
                      Responden, Indeks Rata-rata, %Capaian)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination Toolbar */}
            {isPaginationNeeded && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-5 py-3.5 rounded-b-2xl">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>
                    Menampilkan{" "}
                    <span className="font-bold text-slate-900">
                      {totalRows === 0
                        ? 0
                        : (safeCurrentPage - 1) * (pageSize || 1) + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-bold text-slate-900">
                      {Math.min(safeCurrentPage * (pageSize || 1), totalRows)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-bold text-slate-900">
                      {totalRows}
                    </span>{" "}
                    baris
                    {selectedMonthFilter !== "all" && (
                      <span className="ml-1 text-emerald-700 font-semibold">
                        ({selectedMonthFilter})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px] text-slate-500">Baris:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                        scrollToTableTop();
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={0}>Semua ({totalRows})</option>
                    </select>
                  </div>
                </div>

                {pageSize > 0 && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage(1);
                        scrollToTableTop();
                      }}
                      disabled={safeCurrentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      title="Halaman Pertama"
                    >
                      <Icon
                        icon="solar:double-alt-arrow-left-linear"
                        width={16}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage((p) => Math.max(p - 1, 1));
                        scrollToTableTop();
                      }}
                      disabled={safeCurrentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      title="Halaman Sebelumnya"
                    >
                      <Icon icon="solar:alt-arrow-left-linear" width={16} />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {getPageNumbers(safeCurrentPage, totalPages).map(
                        (p, pIdx) =>
                          p === "..." ? (
                            <span
                              key={`dots-${pIdx}`}
                              className="px-1 text-xs text-slate-400"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setCurrentPage(Number(p));
                                scrollToTableTop();
                              }}
                              className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition shadow-2xs ${
                                safeCurrentPage === Number(p)
                                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {p}
                            </button>
                          ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage((p) => Math.min(p + 1, totalPages));
                        scrollToTableTop();
                      }}
                      disabled={safeCurrentPage === totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      title="Halaman Selanjutnya"
                    >
                      <Icon icon="solar:alt-arrow-right-linear" width={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage(totalPages);
                        scrollToTableTop();
                      }}
                      disabled={safeCurrentPage === totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      title="Halaman Terakhir"
                    >
                      <Icon
                        icon="solar:double-alt-arrow-right-linear"
                        width={16}
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Kelola Catatan Kolaboratif (Kendala & RTL PIC) */}
      {collabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Icon icon="solar:chat-round-dots-bold" width={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Kelola Catatan PIC: {collabModal.colLabel}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {collabModal.monthName} • Kolom [{collabModal.colLetter}]
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCollabModal(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Info Aturan Penomoran & Penanda PIC */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                <Icon
                  icon="solar:info-circle-bold"
                  width={18}
                  className="text-emerald-600 shrink-0 mt-0.5"
                />
                <div className="space-y-0.5 leading-relaxed text-[11px]">
                  <strong>Sistem Penanda Otomatis PIC:</strong> Setiap catatan
                  yang ditambahkan akan otomatis diberi nomor urut dan penanda
                  nama PIC{" "}
                  <code className="bg-white/90 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800">
                    + {user?.name || "Nama Anda"}
                  </code>{" "}
                  di akhir kalimat. Penambahan oleh PIC lain akan melanjutkan
                  nomor berikutnya secara aman tanpa menghapus catatan
                  sebelumnya.
                </div>
              </div>

              {/* Daftar Catatan yang Ada */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Catatan Terdaftar ({collabModal.notes.length})
                  </h4>
                </div>

                {collabModal.notes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    <Icon
                      icon="solar:document-text-linear"
                      width={28}
                      className="mx-auto mb-1.5 text-slate-300"
                    />
                    Belum ada catatan pada periode ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {collabModal.notes.map((note, nIdx) => {
                      const isCurrentUserAuthor = Boolean(
                        user?.name &&
                        note.author &&
                        (note.author
                          .toLowerCase()
                          .includes(user.name.toLowerCase()) ||
                          user.name
                            .toLowerCase()
                            .includes(note.author.toLowerCase())),
                      );
                      const isEditingThis = collabModal.editingIndex === nIdx;

                      return (
                        <div
                          key={nIdx}
                          className={`rounded-xl border p-3.5 transition ${
                            isCurrentUserAuthor
                              ? "border-emerald-200 bg-emerald-50/30"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {isEditingThis ? (
                            <div className="space-y-2">
                              <textarea
                                value={collabModal.editingText}
                                onChange={(e) =>
                                  setCollabModal({
                                    ...collabModal,
                                    editingText: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-emerald-300 p-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCollabModal({
                                      ...collabModal,
                                      editingIndex: null,
                                      editingText: "",
                                    })
                                  }
                                  className="rounded-lg px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveEditedCollabNote(nIdx)
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  Simpan Perubahan
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                                  {nIdx + 1}
                                </span>
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                    {note.text}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    {isCurrentUserAuthor ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                        <Icon
                                          icon="solar:user-bold"
                                          width={11}
                                        />
                                        Anda (+ {note.author || user?.name})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-[#005baa]">
                                        <Icon
                                          icon="solar:user-linear"
                                          width={11}
                                        />
                                        + {note.author || "PIC"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {!collabModal.isLocked && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCollabModal({
                                        ...collabModal,
                                        editingIndex: nIdx,
                                        editingText: note.text,
                                      })
                                    }
                                    title="Edit catatan ini"
                                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                                  >
                                    <Icon icon="solar:pen-bold" width={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCollabNote(nIdx)}
                                    title="Hapus catatan ini"
                                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Icon
                                      icon="solar:trash-bin-trash-bold"
                                      width={14}
                                    />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Tambah Catatan Baru */}
              {!collabModal.isLocked ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      {collabModal.notes.length === 0
                        ? `Tulis Catatan ${collabModal.colLabel} Baru`
                        : `Tambah Catatan Baru (Nomor #${collabModal.notes.length + 1})`}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Disimpan atas nama:{" "}
                      <strong className="text-slate-800">
                        + {user?.name || "Anda"}
                      </strong>
                    </span>
                  </div>

                  <textarea
                    value={collabModal.newNoteText}
                    onChange={(e) =>
                      setCollabModal({
                        ...collabModal,
                        newNoteText: e.target.value,
                      })
                    }
                    placeholder="Tuliskan kendala atau rencana tindak lanjut di sini..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <div className="text-[11px] text-slate-500 italic">
                    Cukup tulis di sini, lalu klik tombol{" "}
                    <strong>"Simpan"</strong> di bawah untuk langsung menyimpan
                    ke database dan menampilkan ke tabel.
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                  Kolom atau bulan ini sedang dalam status terkunci, hanya dapat
                  melihat catatan terdaftar.
                </div>
              )}
            </div>

            {/* Modal Footer - HANYA 1 TOMBOL SIMPAN & 1 TOMBOL BATAL */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Icon
                  icon="solar:info-circle-linear"
                  width={14}
                  className="text-slate-400"
                />
                <span>
                  Penanda PIC:{" "}
                  <strong className="text-slate-700">
                    +{user?.name || "Anda"}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCollabModal(null)}
                  disabled={savingCollab}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                {!collabModal.isLocked && (
                  <button
                    type="button"
                    disabled={savingCollab}
                    onClick={handleSaveCollabModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                    title="Simpan langsung ke database dan tampilkan di tabel"
                  >
                    {savingCollab ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:diskette-bold" width={16} />
                        <span>Simpan</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Data Excel */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                  <Icon icon="ri:file-excel-2-fill" width={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Import Data dari File Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tab:{" "}
                    <span className="font-semibold text-emerald-700">
                      {activeTab?.title}
                    </span>{" "}
                    {selectedMonthFilter !== "all"
                      ? `• Bulan: ${selectedMonthFilter}`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelFile(null);
                  setExcelParsedRows([]);
                  setExcelError(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            {/* Isi Modal */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Langkah 1: Unduh Format Template */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Unduh Format Template Excel
                    </h4>
                  </div>
                  <p className="text-[11px] text-emerald-800 ml-7">
                    Gunakan template ini agar susunan kolom sesuai dengan tab{" "}
                    <strong>{activeTab?.title}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition shrink-0"
                >
                  <Icon icon="solar:download-square-bold" width={16} />
                  <span>Unduh Template (.xlsx)</span>
                </button>
              </div>

              {/* Langkah 2: Mode Penyimpanan */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                    2
                  </span>
                  <label className="text-xs font-bold text-slate-800">
                    Pilih Strategi Penyimpanan:
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-7">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      excelMode === "append"
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="excelMode"
                      value="append"
                      checked={excelMode === "append"}
                      onChange={() => setExcelMode("append")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold">
                        Tambahkan Data (Append)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menambahkan baris dari file Excel tanpa menghapus data
                        yang sudah ada sebelumnya.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      excelMode === "replace"
                        ? "border-amber-500 bg-amber-50/50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="excelMode"
                      value="replace"
                      checked={excelMode === "replace"}
                      onChange={() => setExcelMode("replace")}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-xs font-bold">
                        Ganti Data (
                        {selectedMonthFilter !== "all"
                          ? `Bulan ${selectedMonthFilter}`
                          : "Semua Data"}
                        )
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menimpa data{" "}
                        {selectedMonthFilter !== "all"
                          ? `pada bulan ${selectedMonthFilter}`
                          : "pada seluruh tab ini"}{" "}
                        dengan baris baru dari Excel.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Langkah 3: Unggah File */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                    3
                  </span>
                  <label className="text-xs font-bold text-slate-800">
                    Unggah File Excel yang Telah Diisi:
                  </label>
                </div>
                <div className="ml-7">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/70 transition p-4">
                    <Icon
                      icon="ri:file-excel-2-line"
                      width={32}
                      className="text-emerald-600 mb-2"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {excelFile
                        ? excelFile.name
                        : "Klik atau seret file Excel ke sini (.xlsx, .xls, .csv)"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {excelFile
                        ? `${(excelFile.size / 1024).toFixed(1)} KB`
                        : "Mendukung pengisian banyak baris sekaligus"}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={handleExcelFileSelect}
                    />
                  </label>
                </div>
              </div>

              {/* Pesan Kesalahan File */}
              {excelError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 ml-7">
                  <Icon
                    icon="solar:danger-circle-bold"
                    width={16}
                    className="text-rose-600 shrink-0 mt-0.5"
                  />
                  <span>{excelError}</span>
                </div>
              )}

              {/* Tabel Pratinjau Baris Terbaca */}
              {excelParsedRows.length > 0 && (
                <div className="space-y-2 ml-7">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Icon
                        icon="solar:check-circle-bold"
                        width={15}
                        className="text-emerald-600"
                      />
                      Ditemukan {excelParsedRows.length} baris data siap diimpor
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Pratinjau {Math.min(3, excelParsedRows.length)} baris
                      pertama:
                    </span>
                  </div>
                  <div className="max-h-40 overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-white text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          {effectiveColumnsSchema.slice(0, 6).map((c) => (
                            <th
                              key={c.key}
                              className="px-2.5 py-1.5 font-semibold whitespace-nowrap"
                            >
                              {c.label}
                            </th>
                          ))}
                          {effectiveColumnsSchema.length > 6 && (
                            <th className="px-2.5 py-1.5 font-semibold text-slate-400">
                              ...
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {excelParsedRows.slice(0, 3).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            {effectiveColumnsSchema.slice(0, 6).map((c) => (
                              <td
                                key={c.key}
                                className="px-2.5 py-1 text-slate-600 max-w-[150px] truncate whitespace-nowrap"
                              >
                                {String(r.cells?.[c.key] ?? "-")}
                              </td>
                            ))}
                            {effectiveColumnsSchema.length > 6 && (
                              <td className="px-2.5 py-1 text-slate-400">
                                ...
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelFile(null);
                  setExcelParsedRows([]);
                  setExcelError(null);
                }}
                disabled={excelSaving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveExcelImport}
                disabled={excelParsedRows.length === 0 || excelSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {excelSaving ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-bold" width={15} />
                    <span>
                      Simpan{" "}
                      {excelParsedRows.length > 0
                        ? `${excelParsedRows.length} Baris `
                        : ""}
                      ke Database
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Peringatan Validasi Kendala & RTL Belum Diisi */}
      {validationModal && validationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-amber-50/70 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shrink-0">
                  <Icon icon="solar:danger-triangle-bold" width={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Kendala & RTL Belum Diisi
                  </h3>
                  <p className="text-[11px] font-semibold text-amber-700">
                    {validationModal.monthName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            {/* Isi Modal */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Penyimpanan data <strong>belum dapat diproses</strong> karena
                Anda telah menginputkan capaian data pada periode ini, namun
                kolom <strong>Kendala</strong> dan/atau{" "}
                <strong>Rencana Tindak Lanjut (RTL)</strong> belum diisi.
              </p>

              {/* Status Checklist Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">
                    Kolom Data Pengisian
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                    <Icon
                      icon="solar:check-circle-bold"
                      width={14}
                      className="text-emerald-600"
                    />
                    Sudah Diisi
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
                  <span className="font-medium text-slate-700">
                    Kolom Kendala
                  </span>
                  {validationModal.isKendalaMissing ? (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] animate-pulse">
                      <Icon
                        icon="solar:close-circle-bold"
                        width={14}
                        className="text-rose-600"
                      />
                      Belum Diisi (Wajib)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                      <Icon
                        icon="solar:check-circle-bold"
                        width={14}
                        className="text-emerald-600"
                      />
                      Sudah Terisi
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
                  <span className="font-medium text-slate-700">
                    Kolom Rencana Tindak Lanjut (RTL)
                  </span>
                  {validationModal.isRtlMissing ? (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] animate-pulse">
                      <Icon
                        icon="solar:close-circle-bold"
                        width={14}
                        className="text-rose-600"
                      />
                      Belum Diisi (Wajib)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                      <Icon
                        icon="solar:check-circle-bold"
                        width={14}
                        className="text-emerald-600"
                      />
                      Sudah Terisi
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <Icon
                  icon="solar:info-circle-bold"
                  width={16}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <p className="text-[11px] leading-relaxed">
                  Sesuai ketentuan pelaporan RHPK, saat melakukan pengisian data
                  realisasi pertama kali di bulan tersebut, Anda wajib
                  melengkapi kendala yang dihadapi serta rencana tindak lanjut
                  (RTL) penyelesaiannya. Jika Kendala dan RTL telah terisi, Anda
                  dapat menyimpan perubahan meskipun belum semua kolom dalam
                  sebaris selesai terisi.
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={() => setValidationModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetCol = validationModal.isKendalaMissing
                    ? validationModal.kendalaCol
                    : validationModal.rtlCol;
                  const rIdx = validationModal.rowIndex;
                  const rKey = validationModal.rowKey;
                  const mName = validationModal.monthName;
                  setValidationModal(null);

                  if (targetCol && activeTab) {
                    const row = activeTab.rows_data[rIdx];
                    const val = row?.cells?.[targetCol.key];
                    handleOpenCollabModal(
                      rKey,
                      targetCol,
                      val,
                      mName,
                      true,
                      rIdx,
                    );
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                <Icon icon="solar:pen-new-square-bold" width={15} />
                <span>
                  Lengkapi{" "}
                  {validationModal.isKendalaMissing ? "Kendala" : "RTL"}{" "}
                  Sekarang
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kontribusi Angka Kolaboratif Multi-Katim (Point 6) */}
      {collabNumModal && collabNumModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50/70 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 border border-indigo-200 shrink-0">
                  <Icon icon="solar:users-group-rounded-bold" width={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      Rincian Kontribusi Angka Katim
                    </h3>
                    {!collabNumModal.canEdit && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                        <Icon icon="solar:lock-bold" width={11} />
                        Terkunci (Mode Lihat)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-indigo-700">
                    {collabNumModal.col.label} &bull; {collabNumModal.monthName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCollabNumModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Kolom ini dikerjakan secara kolaboratif oleh beberapa Katim.
                Setiap Katim menginput angka kontribusinya masing-masing, dan
                sistem secara otomatis mengakumulasikan nilai akhirnya.
              </p>

              {/* Rincian Kontributor yang Terdaftar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Daftar Kontribusi per Katim:
                </label>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-slate-50/50 max-h-56 overflow-y-auto">
                  {collabNumModal.col.allowed_katim_ids &&
                  collabNumModal.col.allowed_katim_ids.length > 0 ? (
                    collabNumModal.col.allowed_katim_ids.map(
                      (kId: string | number) => {
                        const strId = String(kId);
                        const katimProfile = katims.find(
                          (k: any) =>
                            String(k.user_id) === strId ||
                            String(k.id) === strId,
                        );
                        const contrib = collabNumModal.contributors[strId];
                        const isMe = user?.id && String(user.id) === strId;

                        return (
                          <div
                            key={strId}
                            className={`p-3 flex items-center justify-between text-xs ${isMe ? "bg-indigo-50/50 font-medium" : ""}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0">
                                {(
                                  katimProfile?.name ||
                                  contrib?.author ||
                                  "K"
                                ).charAt(0)}
                              </span>
                              <div>
                                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <span>
                                    {katimProfile?.name ||
                                      contrib?.author ||
                                      `Katim (${strId.substring(0, 8)}...)`}
                                  </span>
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 text-[9px] font-bold">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                {contrib?.updated_at && (
                                  <span className="text-[10px] text-slate-400">
                                    Diperbarui:{" "}
                                    {new Date(
                                      contrib.updated_at,
                                    ).toLocaleString("id-ID", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {contrib?.value !== undefined
                                  ? contrib.value
                                  : 0}
                              </span>
                            </div>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      Belum ada penugasan Katim spesifik.
                    </div>
                  )}
                </div>
              </div>

              {/* Input Bagian Saya atau Status Terkunci */}
              {collabNumModal.canEdit ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
                  <label className="block text-xs font-bold text-indigo-950">
                    Input / Ubah Angka Kontribusi Anda (
                    {user?.name || user?.call_name || "Katim"}):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={collabNumModal.myValue}
                      onChange={(e) =>
                        setCollabNumModal({
                          ...collabNumModal,
                          myValue: e.target.value,
                        })
                      }
                      placeholder="Masukkan angka..."
                      className="flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Icon icon="solar:lock-bold" width={14} className="text-amber-700" />
                    <span>Periode {collabNumModal.monthName} Terkunci (Mode Lihat Saja)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Data periode ini telah dikunci oleh Administrator / Tim Kerja TU sehingga Anda hanya dapat melihat rincian kontribusi tanpa mengubah angka.
                  </p>
                  {collabNumModal.myValue !== "" && (
                    <div className="pt-2 mt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-950">Kontribusi Anda Tercatat:</span>
                      <span className="font-mono font-bold text-amber-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
                        {collabNumModal.myValue}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Summary */}
              {(() => {
                const isCum = isCumulativeCol(collabNumModal.col);
                const myId = user?.id ? String(user.id) : "temp_me";
                const myVal =
                  parseFloat(
                    String(collabNumModal.myValue).replace(",", "."),
                  ) || 0;
                let monthSum = 0;
                Object.entries(collabNumModal.contributors).forEach(
                  ([k, c]: [string, any]) => {
                    if (k !== myId)
                      monthSum += parseFloat(String(c?.value || 0)) || 0;
                  },
                );
                monthSum += myVal;

                const prevCumulative =
                  isCum && activeTab?.rows_data && collabNumModal.rowIndex > 0
                    ? Number(
                        activeTab.rows_data[collabNumModal.rowIndex - 1]
                          ?.cells?.[collabNumModal.col.key] || 0,
                      )
                    : 0;
                const finalCumulative = isCum
                  ? prevCumulative + monthSum
                  : monthSum;

                return (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700">
                          Total Kontribusi Bulan Ini ({collabNumModal.monthName}
                          )
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Hasil penjumlahan kontribusi Anda + Katim lainnya pada
                          bulan ini
                        </p>
                      </div>
                      <span className="text-sm font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                        +{monthSum}
                      </span>
                    </div>

                    {isCum && collabNumModal.rowIndex > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-emerald-800">
                            Total Kumulatif Akhir s.d. Bulan Ini
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Akumulasi bulan lalu ({prevCumulative}) + Bulan ini
                            ({monthSum})
                          </p>
                        </div>
                        <span className="text-base font-extrabold font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                          ∑ {finalCumulative}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
              <button
                type="button"
                onClick={() => setCollabNumModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {collabNumModal.canEdit ? "Batal" : "Tutup"}
              </button>
              {collabNumModal.canEdit && (
                <button
                  type="button"
                  onClick={handleSaveCollabNumModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer"
                >
                  <Icon icon="solar:diskette-bold" width={16} />
                  <span>Simpan Kontribusi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload / Import Excel */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Icon icon="solar:file-smile-bold" width={22} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Unggah / Import File Excel
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeTab
                      ? `Tab Aktif: ${activeTab.title}`
                      : "Pilih file Excel (.xlsx / .xls)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                disabled={uploading}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Pilihan Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Lingkup Import:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode("tab")}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                      uploadMode === "tab"
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Icon
                        icon="solar:document-text-bold"
                        width={15}
                        className="text-emerald-600"
                      />
                      Sheet ke Tab Ini
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Hanya perbarui tab "{activeTab?.title || "aktif"}" (misal
                      KIE Medsos)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode("spreadsheet")}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                      uploadMode === "spreadsheet"
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Icon
                        icon="solar:folder-with-files-bold"
                        width={15}
                        className="text-emerald-600"
                      />
                      Dokumen Penuh
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Perbarui seluruh spreadsheet beserta semua sheet di
                      dalamnya
                    </span>
                  </button>
                </div>
              </div>

              {/* Area File Drop / Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  File Dokumen Excel (.xlsx / .xls):
                </label>
                <div className="relative rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 p-6 text-center transition">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    disabled={uploading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon
                      icon={
                        uploadFile
                          ? "solar:file-check-bold"
                          : "solar:cloud-upload-bold"
                      }
                      width={36}
                      className={
                        uploadFile ? "text-emerald-600" : "text-slate-400"
                      }
                    />
                    {uploadFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {uploadFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(uploadFile.size / 1024).toFixed(1)} KB • Klik atau
                          drag file lain untuk mengganti
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Tarik file ke sini atau{" "}
                          <span className="text-emerald-700 underline">
                            pilih dari komputer
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Format yang didukung: Microsoft Excel (.xlsx, .xls)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
                <Icon
                  icon="solar:info-circle-bold"
                  width={16}
                  className="text-blue-600 shrink-0 mt-0.5"
                />
                <p className="text-[11px] leading-relaxed">
                  Data yang diunggah akan otomatis disesuaikan dengan skema
                  kolom yang ada. Konfigurasi hak akses Katim dan formula
                  perhitungan otomatis tetap dipertahankan dengan aman.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                disabled={uploading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!uploadFile || uploading}
                onClick={handleUploadExcel}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:cloud-upload-bold" width={16} />
                    <span>Mulai Unggah</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
