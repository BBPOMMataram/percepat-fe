/**
 * Mesin Kalkulasi Formula dan Kumulatif Client-Side untuk Tabel RHPK SIPROVAL
 */

import type { ColumnSchema, RowData, RowFormulaContext } from "../types/tableTypes";
import { isHorizontalTable, isCumulativeCol } from "./tableDetection";

/**
 * Helper kalkulasi kolom kumulatif berjenjang: i = input + (i-1)
 */
export const recalculateCumulativeRows = (
  rows: RowData[],
  columns: ColumnSchema[],
  isHorizontal: boolean = false,
): RowData[] => {
  if (
    isHorizontal ||
    isHorizontalTable(columns) ||
    !rows ||
    rows.length === 0 ||
    !columns ||
    columns.length === 0
  )
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
        monthlyDelta =
          parseFloat(String(newRows[i].cells[inputKey]).replace(",", ".")) || 0;
        hasMonthActivity = true;
      } else if (
        !isEmpty &&
        !isNaN(Number(String(cellVal).replace(",", ".")))
      ) {
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

/**
 * Helper rekalkulasi kumulatif horizontal dan total per kolom khusus Data detil pengujian (IKSK 1)
 */
export const recalculateIksk1DetilPengujianRows = (
  rows: RowData[],
  columns: ColumnSchema[],
): RowData[] => {
  if (!rows || rows.length === 0) return rows;

  const newRows = rows.map((r) => ({
    ...r,
    cells: { ...r.cells },
  }));

  const commodityRowIndices: number[] = [];
  let subtotalRowIdx: number | null = null;
  let lainLainRowIdx: number | null = null;
  let totalRowIdx: number | null = null;

  newRows.forEach((r, idx) => {
    const c1 = String(r.cells?.col_1 || "").trim();
    const isTot =
      Boolean((r as any).is_total_row) ||
      Boolean(r.is_total) ||
      c1.toLowerCase() === "total";
    const isSubtot =
      Boolean((r as any).is_formula_row) || c1.toLowerCase().includes("subtotal");
    const isLainLain = c1.toLowerCase().includes("lain-lain (kasus");

    if (isTot) {
      totalRowIdx = idx;
    } else if (isSubtot) {
      subtotalRowIdx = idx;
    } else if (isLainLain) {
      lainLainRowIdx = idx;
    } else if (c1.startsWith("-")) {
      commodityRowIndices.push(idx);
    }
  });

  // 1. Evaluasi kumulatif horizontal per baris komoditi (4 metrik per bulan)
  commodityRowIndices.forEach((rIdx) => {
    for (let metric = 0; metric < 4; metric++) {
      let runningTotal = 0;
      let hasPrevCum = false;

      for (let m = 1; m <= 12; m++) {
        const colIdx = 3 + (m - 1) * 4 + metric;
        const colKey = `col_${colIdx}`;
        const inputKey = `${colKey}_input`;

        const hasInput =
          newRows[rIdx].cells[inputKey] !== undefined &&
          newRows[rIdx].cells[inputKey] !== null &&
          newRows[rIdx].cells[inputKey] !== "";

        const cellVal = newRows[rIdx].cells[colKey];
        const hasCellVal =
          cellVal !== undefined &&
          cellVal !== null &&
          cellVal !== "" &&
          !isNaN(Number(String(cellVal).replace(",", ".")));

        if (m === 1) {
          let monthlyDelta: number | null = null;
          if (hasInput) {
            monthlyDelta =
              parseFloat(String(newRows[rIdx].cells[inputKey]).replace(",", ".")) || 0;
          } else if (hasCellVal) {
            monthlyDelta =
              parseFloat(String(cellVal).replace(",", ".")) || 0;
            newRows[rIdx].cells[inputKey] = monthlyDelta;
          }

          if (monthlyDelta !== null) {
            runningTotal = monthlyDelta;
            newRows[rIdx].cells[colKey] = runningTotal;
            hasPrevCum = true;
          } else {
            newRows[rIdx].cells[colKey] = "";
          }
        } else {
          let monthlyDelta: number | null = null;
          if (hasInput) {
            monthlyDelta =
              parseFloat(String(newRows[rIdx].cells[inputKey]).replace(",", ".")) || 0;
          } else if (hasCellVal) {
            const currentVal =
              parseFloat(String(cellVal).replace(",", ".")) || 0;
            if (hasPrevCum && currentVal >= runningTotal && runningTotal > 0) {
              monthlyDelta = currentVal - runningTotal;
            } else {
              monthlyDelta = currentVal;
            }
            newRows[rIdx].cells[inputKey] = monthlyDelta;
          }

          if (monthlyDelta !== null) {
            runningTotal = Math.round((runningTotal + monthlyDelta) * 100) / 100;
            newRows[rIdx].cells[colKey] = runningTotal;
            hasPrevCum = true;
          } else {
            newRows[rIdx].cells[colKey] = "";
          }
        }
      }
    }
  });

  // 2. Subtotal Sampel lain2 (baris komoditi 7..11)
  const sampelLainIndices = commodityRowIndices.filter(
    (idx) => idx >= 7 && idx <= 11,
  );

  if (subtotalRowIdx !== null) {
    (newRows[subtotalRowIdx] as any).row_type = "formula";
    (newRows[subtotalRowIdx] as any).is_formula_row = true;
    newRows[subtotalRowIdx].can_edit_row = false;
    for (let c = 3; c <= 50; c++) {
      const colKey = `col_${c}`;
      let subSum = 0;
      let hasNum = false;
      sampelLainIndices.forEach((sIdx) => {
        const v = newRows[sIdx].cells[colKey];
        if (
          v !== undefined &&
          v !== null &&
          v !== "" &&
          !isNaN(Number(String(v).replace(",", ".")))
        ) {
          subSum += parseFloat(String(v).replace(",", "."));
          hasNum = true;
        }
      });
      const val = hasNum ? Math.round(subSum * 100) / 100 : "";
      newRows[subtotalRowIdx].cells[colKey] = val;
      if (lainLainRowIdx !== null) {
        newRows[lainLainRowIdx].cells[colKey] = val;
        (newRows[lainLainRowIdx] as any).row_type = "formula";
        (newRows[lainLainRowIdx] as any).is_formula_row = true;
        newRows[lainLainRowIdx].can_edit_row = false;
      }
    }
  }

  // 3. Baris Total (hanya menjumlahkan 20 baris komoditi)
  if (totalRowIdx !== null) {
    let tgtSum = 0;
    commodityRowIndices.forEach((cIdx) => {
      const v = newRows[cIdx].cells["col_2"];
      if (
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !isNaN(Number(String(v).replace(",", ".")))
      ) {
        tgtSum += parseFloat(String(v).replace(",", "."));
      }
    });
    newRows[totalRowIdx].cells["col_2"] = Math.round(tgtSum * 100) / 100;

    for (let c = 3; c <= 50; c++) {
      const colKey = `col_${c}`;
      let totSum = 0;
      let hasNum = false;
      commodityRowIndices.forEach((cIdx) => {
        const v = newRows[cIdx].cells[colKey];
        if (
          v !== undefined &&
          v !== null &&
          v !== "" &&
          !isNaN(Number(String(v).replace(",", ".")))
        ) {
          totSum += parseFloat(String(v).replace(",", "."));
          hasNum = true;
        }
      });
      newRows[totalRowIdx].cells[colKey] = hasNum
        ? Math.round(totSum * 100) / 100
        : "";
    }
  }

  return newRows;
};

/**
 * Angka dari isi sel: "87,5" -> 87.5, "1.234,5" -> 1234.5, "100%" -> 1 (rasio seperti Excel)
 */
export function cellNumber(raw: any): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  if (typeof raw === "boolean") return raw ? 1 : 0;
  let s = String(raw).trim().replace(/\s/g, "");
  const pct = s.endsWith("%");
  if (pct) s = s.slice(0, -1);
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  if (s === "" || isNaN(n)) return null;
  return pct ? n / 100 : n;
}

const A1_REF_RE = /\$?\b([A-Za-z]{1,3})\$?(\d+)\b/g;

/**
 * Resolusi string formula per baris
 */
export function resolveRowFormula(
  col: ColumnSchema,
  row?: RowFormulaContext | null,
): string | null {
  const hasRowFormulas =
    !!row && !!row.formulas && typeof row.formulas === "object";
  if (hasRowFormulas) {
    const f = (row!.formulas as Record<string, string>)[col.key];
    if (!f || typeof f !== "string") return null;
    if (f.includes("!")) return null; // rujukan sheet lain -> dihitung server
    const rowNum = Number(row!.excel_row || 0);
    let sameRow = true;
    f.replace(A1_REF_RE, (m, _l, n) => {
      if (!rowNum || Number(n) !== rowNum) sameRow = false;
      return m;
    });
    if (!sameRow || /[A-Za-z]{1,3}\$?\d+\s*:\s*\$?[A-Za-z]{1,3}\$?[A-Za-z]{1,3}\$?\d+/.test(f))
      return null; // rujukan baris lain / rentang -> dihitung server
    return f.replace(A1_REF_RE, (_m, l) => String(l).toUpperCase());
  }
  const tpl = (col.formula || "").trim();
  if (!tpl || tpl.includes("!")) return null;
  if (/\$?\b[A-Za-z]{1,3}\$?\d+\b/.test(tpl.replace(/^=/, ""))) return null;
  return tpl;
}

/**
 * Helper evaluasi rumus per baris data di browser
 */
export const recalculateRowFormulas = (
  cells: Record<string, any>,
  columns: ColumnSchema[],
  row?: RowFormulaContext | null,
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
    round: (v: number, d: number = 0) => {
      const p = Math.pow(10, d || 0);
      return Math.round(v * p) / p;
    },
    roundup: (v: number, d: number = 0) => {
      const p = Math.pow(10, d || 0);
      const scaled = Math.round(v * p * 1e6) / 1e6;
      return (v >= 0 ? Math.ceil(scaled) : Math.floor(scaled)) / p;
    },
    if: (cond: any, a: any, b: any) => (Boolean(cond) ? a : b),
    na: () => NaN,
    iserror: (val: any) =>
      typeof val !== "number" || isNaN(val) || !isFinite(val),
    iferror: (val: any, fallback: any) =>
      typeof val === "number" && !isNaN(val) && isFinite(val) ? val : fallback,
  };

  columns.forEach((col) => {
    if (col.type !== "formula" || (col as any).is_cumulative) return;
    const source = resolveRowFormula(col, row);
    if (!source) return;

    let expr = source.trim();
    if (expr.startsWith("=")) expr = expr.slice(1).trim();
    expr = expr.replace(/\$/g, "");

    // Excel memakai '=' / '<>' untuk perbandingan dan '&' untuk teks: di luar cakupan pratinjau
    if (/&|"/.test(expr)) return;
    expr = expr.replace(/<>/g, "!=").replace(/([^<>!=])=([^=])/g, "$1==$2");

    // 1. Persen: 20% -> (20/100), (A/B)% -> ((A/B)/100)
    expr = expr.replace(/(\d+(?:\.\d+)?|\))\s*%/g, "$1/100");

    // 2. Token huruf kolom & key kolom -> nilai sel baris ini
    const tokenMap: Record<string, string> = {};
    const errs: Record<string, string> = (row && row.errors) || {};
    columns.forEach((c) => {
      const letter = (c.col_letter || "").toUpperCase().trim();
      const n = cellNumber(updatedCells[c.key]);
      const isErr = Boolean(errs[c.key]) && (n === null || n === 0);
      const token = isErr ? "NaN" : String(n ?? 0);
      if (letter) tokenMap[letter] = token;
      tokenMap[c.key] = token;
    });
    const tokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
    for (const tok of tokens) {
      const regex = new RegExp(`\\b${tok}\\b(?!\\s*\\()`, "gi");
      expr = expr.replace(regex, `(${tokenMap[tok]})`);
    }

    // Pembagian dengan nol = galat #DIV/0! seperti Excel (termasuk di dalam kondisi IF)
    const divZeroRe = /\/\s*\(\s*-?0(\.0+)?\s*\)/g;
    const hasDivZero = divZeroRe.test(expr);
    expr = expr.replace(divZeroRe, "/(NaN)");
    const handlesErrors = /iferror|iserror/i.test(source);

    // 3. Fungsi Excel umum
    expr = expr
      .replace(/\biferror\s*\(/gi, "excelMathEnv.iferror(")
      .replace(/\biserror\s*\(/gi, "excelMathEnv.iserror(")
      .replace(/\bif\s*\(/gi, "excelMathEnv.if(")
      .replace(/\bna\s*\(\s*\)/gi, "excelMathEnv.na()")
      .replace(/\bsum\s*\(/gi, "excelMathEnv.sum(")
      .replace(/\baveragea?\s*\(/gi, "excelMathEnv.average(")
      .replace(/\bmin\s*\(/gi, "excelMathEnv.min(")
      .replace(/\bmax\s*\(/gi, "excelMathEnv.max(")
      .replace(/\babs\s*\(/gi, "excelMathEnv.abs(")
      .replace(/\broundup\s*\(/gi, "excelMathEnv.roundup(")
      .replace(/\bround\s*\(/gi, "excelMathEnv.round(");

    // 4. Hanya ekspresi aritmetika aman yang dievaluasi
    const sanitized = expr.replace(
      /excelMathEnv\.(iferror|iserror|if|na|sum|average|min|max|abs|roundup|round)/g,
      "",
    );
    if (!/^[\d\+\-\*/\(\)\,\.\s><=!]+$/.test(sanitized.replace(/NaN/g, "0")))
      return;
    if (hasDivZero && !handlesErrors) {
      updatedCells[col.key] = 0; // #DIV/0! -> 0 (sama dengan server)
      return;
    }
    try {
      const res = Function(
        "excelMathEnv",
        `"use strict"; return (${expr})`,
      )(excelMathEnv);
      if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
        const colLbl = `${col.label || ""} ${(col as any).sub_label || ""}`.toLowerCase();
        const isIksk16RoundUp =
          res > 0 &&
          (colLbl.includes("sarprod fortif") ||
            colLbl.includes("pangan fortifikasi"));
        updatedCells[col.key] = isIksk16RoundUp
          ? Math.ceil(Math.round(res * 10 * 1e6) / 1e6) / 10
          : res > 0 && res <= 1
            ? Math.round(res * 10000) / 10000
            : Math.round(res * 100) / 100;
      } else if (typeof res === "number") {
        updatedCells[col.key] = 0; // #DIV/0! -> 0 (sama dengan server)
      }
    } catch {
      // Ekspresi tidak dapat dihitung di browser: nilai dibiarkan, server menghitung saat simpan
    }
  });

  return updatedCells;
};
