"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import { formatDisplayCellValue } from "@/components/siproval/katim/TestLocalTableKatim";

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
  iksk_id?: number | null;
  file_name: string | null;
  tabs: TabItem[];
};

type ColumnSchema = {
  key: string;
  col_letter: string;
  label: string;
  type: "readonly" | "editable" | "formula" | "editable_cumulative" | "editable_collab_cumulative";
  is_cumulative?: boolean;
  is_collab_numeric?: boolean;
  formula: string | null;
  allowed_katim_ids: string[];
  parent_header?: string | null;
  sub_label?: string | null;
  sub_parent?: string | null;
  hidden?: boolean;
  is_hidden?: boolean;
};

type RowData = {
  row_index: number;
  month: number;
  month_name: string;
  cells: Record<string, any>;
  row_name?: string;
  is_month_row?: boolean;
  is_total?: boolean;
  is_updated?: boolean;
};

export function getPageNumbers(current: number, total: number): (number | string)[] {
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
        dot: "bg-[#e11d48]"
      };
    case "FEBRUARI":
      return {
        header: "bg-[#f3e8fd] text-[#581c87] border-r border-purple-300",
        sub: "bg-[#faf5ff] text-slate-700",
        dot: "bg-[#9333ea]"
      };
    case "MARET":
      return {
        header: "bg-[#fef7e0] text-[#78350f] border-r border-amber-300",
        sub: "bg-[#fffbeb] text-slate-700",
        dot: "bg-[#d97706]"
      };
    case "APRIL":
      return {
        header: "bg-[#e6f4ea] text-[#064e3b] border-r border-emerald-300",
        sub: "bg-[#f0fdf4] text-slate-700",
        dot: "bg-[#059669]"
      };
    case "MEI":
      return {
        header: "bg-[#e8f0fe] text-[#1e3a8a] border-r border-blue-300",
        sub: "bg-[#eff6ff] text-slate-700",
        dot: "bg-[#2563eb]"
      };
    case "JUNI":
      return {
        header: "bg-[#ede9fe] text-[#3730a3] border-r border-indigo-300",
        sub: "bg-[#f5f3ff] text-slate-700",
        dot: "bg-[#4f46e5]"
      };
    case "JULI":
      return {
        header: "bg-[#ffedd5] text-[#9a3412] border-r border-orange-300",
        sub: "bg-[#fff7ed] text-slate-700",
        dot: "bg-[#ea580c]"
      };
    case "AGUSTUS":
      return {
        header: "bg-[#ccfbf1] text-[#115e59] border-r border-teal-300",
        sub: "bg-[#f0fdfa] text-slate-700",
        dot: "bg-[#0d9488]"
      };
    case "SEPTEMBER":
      return {
        header: "bg-[#fef9c3] text-[#854d0e] border-r border-yellow-300",
        sub: "bg-[#fefce8] text-slate-700",
        dot: "bg-[#ca8a04]"
      };
    case "OKTOBER":
      return {
        header: "bg-[#cffafe] text-[#155e75] border-r border-cyan-300",
        sub: "bg-[#ecfeff] text-slate-700",
        dot: "bg-[#0891b2]"
      };
    case "NOVEMBER":
      return {
        header: "bg-[#e0f2fe] text-[#075985] border-r border-sky-300",
        sub: "bg-[#f0f9ff] text-slate-700",
        dot: "bg-[#0284c7]"
      };
    case "DESEMBER":
      return {
        header: "bg-[#ffe4e6] text-[#9f1239] border-r border-rose-300",
        sub: "bg-[#fff1f2] text-slate-700",
        dot: "bg-[#e11d48]"
      };
    default:
      return {
        header: "bg-slate-100 text-slate-800 border-r border-slate-300",
        sub: "bg-slate-50 text-slate-700",
        dot: "bg-slate-500"
      };
  }
}

export const getMonthNumberFromText = (text?: string | null): number | null => {
  if (!text) return null;
  let t = String(text).trim().toLowerCase();
  if (!t) return null;
  // Bersihkan prefix awalan seperti "sd ", "s.d. ", "sampai dengan ", "periode "
  t = t.replace(/^(s[\.\/]?d[\.\s]+|sampai\s+dengan\s+|periode\s*:?\s*)/i, "").trim();

  // 1. Check Excel serial date numbers (e.g. 44000 to 48000 is years 2020-2031)
  const numVal = Number(t);
  if (!isNaN(numVal) && numVal >= 44000 && numVal <= 48000) {
    try {
      const date = new Date((numVal - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.getUTCMonth() + 1;
      }
    } catch {}
  }

  // 2. Check ISO or standard date formats (YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY)
  const isoMatch = t.match(/\b\d{4}[-\/](\d{1,2})[-\/]\d{1,2}\b/);
  if (isoMatch) {
    const m = parseInt(isoMatch[1], 10);
    if (m >= 1 && m <= 12) return m;
  }
  const dmyMatch = t.match(/\b\d{1,2}[-\/](\d{1,2})[-\/]\d{4}\b/);
  if (dmyMatch) {
    const m = parseInt(dmyMatch[1], 10);
    if (m >= 1 && m <= 12) return m;
  }

  // 3. Check Indonesian / English month names in text (matching word boundaries)
  const monthMap: [RegExp, number][] = [
    [/\b(januari|january|jan)\b/i, 1],
    [/\b(februari|february|pebruari|feb)\b/i, 2],
    [/\b(maret|march|mar)\b/i, 3],
    [/\b(april|apr)\b/i, 4],
    [/\b(mei|may)\b/i, 5],
    [/\b(juni|june|jun)\b/i, 6],
    [/\b(juli|july|jul)\b/i, 7],
    [/\b(agustus|august|agust|agst|ags|agu)\b/i, 8],
    [/\b(september|sept|sep)\b/i, 9],
    [/\b(oktober|october|okt|oct)\b/i, 10],
    [/\b(november|nopember|nov)\b/i, 11],
    [/\b(desember|december|des|dec)\b/i, 12],
  ];

  for (const [regex, num] of monthMap) {
    if (regex.test(t)) {
      return num;
    }
  }

  const map: Record<string, number> = {
    januari: 1, jan: 1, january: 1,
    februari: 2, feb: 2, pebruari: 2, february: 2,
    maret: 3, mar: 3, march: 3,
    april: 4, apr: 4,
    mei: 5, may: 5,
    juni: 6, jun: 6, june: 6,
    juli: 7, jul: 7, july: 7,
    agustus: 8, agu: 8, ags: 8, agst: 8, august: 8,
    september: 9, sep: 9, sept: 9,
    oktober: 10, okt: 10, oct: 10, october: 10,
    november: 11, nov: 11, nopember: 11,
    desember: 12, des: 12, dec: 12, december: 12,
  };

  // 1. Exact match (e.g. "Januari", "jan", "FEBRUARI")
  if (map[t]) return map[t];

  // 2. Starts with month followed by delimiter (e.g. "JANUARI - Jumlah Permohonan", "Januari (1)", "Januari 2026")
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

  // 3. Ends with month (e.g. "Bulan Januari", "Target Januari")
  for (const [key, num] of Object.entries(map)) {
    if (t.endsWith(" " + key) || t.endsWith("-" + key) || t.endsWith("/" + key)) {
      return num;
    }
  }

  return null;
};

type ActiveTabDetail = {
  id: number;
  title: string;
  columns_schema: ColumnSchema[];
  rows_data: RowData[];
};

type KatimOption = {
  user_id: string;
  name: string;
  email: string;
};

type IkskOption = {
  id: number;
  name: string;
};

type YearItem = {
  id: number;
  year_number: number;
  desc?: string;
  total_spreadsheets?: number;
};

export default function TestLocalTablePic() {
  const { user } = useSelector((state: RootState) => state.auth);
  const authQuery = user?.id ? `?user_id=${user.id}` : "";

  const [years, setYears] = useState<YearItem[]>([{ id: 1, year_number: 2026 }]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [selectedSpId, setSelectedSpId] = useState<number | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabDetail | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const [katims, setKatims] = useState<KatimOption[]>([]);
  const [iksks, setIksks] = useState<IkskOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal Tambah Tahun
  const [addYearModalOpen, setAddYearModalOpen] = useState(false);
  const [newYearNumber, setNewYearNumber] = useState<number | "">(new Date().getFullYear() + 1);
  const [newYearDesc, setNewYearDesc] = useState("");
  const [addingYear, setAddingYear] = useState(false);

  // Modal Duplikat Tahun
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSourceYear, setDuplicateSourceYear] = useState<number>(2026);
  const [duplicating, setDuplicating] = useState(false);

  // Upload Excel (Multi-file batch upload card)
  const [showUploadCard, setShowUploadCard] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal Atur Kolom (Enkapsulasi)
  const [colModalOpen, setColModalOpen] = useState(false);
  const [editingCols, setEditingCols] = useState<ColumnSchema[]>([]);
  const [selectedColIndex, setSelectedColIndex] = useState<number>(0);
  const [savingCols, setSavingCols] = useState(false);

  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  const [focusSelectedIksk, setFocusSelectedIksk] = useState<boolean>(true);
  const [overrideIndicatorParent, setOverrideIndicatorParent] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    setTableSearch("");
    setSelectedMonthFilter("all");
    setOverrideIndicatorParent(null);
  }, [activeTab?.id]);

  const activeSpreadsheet = useMemo(() => {
    return spreadsheets.find((s) => s.id === selectedSpId) || null;
  }, [spreadsheets, selectedSpId]);

  // Pastikan kolom bertingkat dan sub-label tetap terdeteksi dengan baik (sembunyikan kolom hidden)
  const effectiveColumnsSchema = useMemo<ColumnSchema[]>(() => {
    if (!activeTab?.columns_schema || activeTab.columns_schema.length === 0) return [];
    return activeTab.columns_schema
      .filter((c) => {
        if (c.hidden || (c as any).is_hidden) return false;
        const isKlb = (activeTab?.title || "").toLowerCase().includes("klb") || activeTab?.id === 90;
        if (isKlb && c.label?.trim().toLowerCase() === "pic") {
          return false;
        }
        return true;
      })
      .map((c) => {
        const isIdentityCol =
          c.key === "col_0" ||
          c.key === "col_1" ||
          c.key === "col_2" ||
          c.col_letter === "A" ||
          c.col_letter === "B" ||
          c.col_letter === "C" ||
          (c.label || "").toLowerCase().startsWith("kode unit") ||
          (c.label || "").toLowerCase().startsWith("nama unit") ||
          (c.label || "").toLowerCase().startsWith("bulan");

        // Ekstrak parentHeader dan subLabel jika ada " - " di luar kurung (misal: "Grup - Sub")
        // Cegah pemotongan palsu pada rentang waktu di dalam kurung seperti "(Jan - Feb)"
        let parsedParent: string | null = null;
        let parsedSub: string = c.label || "";

        if (!isIdentityCol && c.label) {
          let depth = 0;
          let splitPos = -1;
          for (let i = 0; i < c.label.length - 2; i++) {
            if (c.label[i] === "(") depth++;
            else if (c.label[i] === ")") depth--;
            else if (depth === 0 && c.label.substr(i, 3) === " - ") {
              splitPos = i;
              break;
            }
          }
          if (splitPos !== -1) {
            const p = c.label.substring(0, splitPos).trim();
            const s = c.label.substring(splitPos + 3).trim();
            if (p && s) {
              parsedParent = p;
              parsedSub = s;
            }
          }
        }

        const parentHeader = isIdentityCol
          ? null
          : (c.parent_header || parsedParent);

        const subLabel = isIdentityCol
          ? c.label
          : (c.sub_label || parsedSub);

        return {
          ...c,
          parent_header: parentHeader,
          sub_label: subLabel,
        };
      });
  }, [activeTab?.columns_schema]);

  const headerGroups = useMemo(() => {
    if (!effectiveColumnsSchema.length) return null;
    const hasGroups = effectiveColumnsSchema.some((c) => Boolean(c.parent_header));
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
        currentGroup = { parent: parentName, cols: [col] };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [effectiveColumnsSchema]);

  const isHorizontalMonthTable = useMemo(() => {
    const schema = effectiveColumnsSchema;
    if (!schema || schema.length === 0) return false;

    // 1. Jika tabel memiliki kolom 'Bulan' atau 'Periode', pasti tabel vertikal
    const hasBulanCol = schema.some((c) => {
      const l = (c.label || "").trim().toLowerCase();
      const sub = ((c as any).sub_label || "").trim().toLowerCase();
      const parent = ((c as any).parent_header || "").trim().toLowerCase();
      return (
        l === "bulan" ||
        l === "periode" ||
        l.startsWith("bulan") ||
        l.includes("bulan") ||
        l.includes("periode") ||
        sub === "bulan" ||
        sub.includes("bulan") ||
        parent.includes("bulan")
      );
    });
    if (hasBulanCol) return false;

    // 2. Jika baris data terdefinisi untuk 12 bulan (month 1..12), pasti tabel vertikal
    const rows = activeTab?.rows_data || [];
    if (rows.length >= 6 && rows.some((r) => r.month && r.month > 0 && r.month <= 12)) {
      return false;
    }

    // 3. Periksa parent_header (misal: JANUARI, FEBRUARI)
    const parentMonths = new Set<number>();
    schema.forEach((col) => {
      if (col.parent_header) {
        const pm = getMonthNumberFromText(col.parent_header);
        if (pm !== null) parentMonths.add(pm);
      }
    });
    if (parentMonths.size >= 3) return true;

    // 4. Periksa label kolom (hanya jika label kolom mandiri menunjukkan bulan)
    const labelMonths = new Set<number>();
    schema.forEach((col) => {
      const lm = getMonthNumberFromText(col.label);
      if (lm !== null) labelMonths.add(lm);
    });
    return labelMonths.size >= 3;
  }, [activeTab?.columns_schema, activeTab?.rows_data]);

  // Deteksi apakah sheet ini adalah sheet multi-indikator (HANYA berlaku untuk Dokumen Gabungan RHPK Balai)
  const isMultiIndicatorSheet = useMemo(() => {
    const spName = (activeSpreadsheet?.name || "").toLowerCase();
    const isCombinedDoc =
      spName.includes("capaian indikator balai") ||
      spName.includes("gabungan") ||
      spName.includes("13 indikator") ||
      Boolean((activeSpreadsheet as any)?.is_balai_rekap);

    if (!isCombinedDoc || !headerGroups) return false;

    const nonMonthParents = headerGroups.filter(
      (g) => g.parent && getMonthNumberFromText(g.parent) === null
    );
    return nonMonthParents.length >= 3;
  }, [headerGroups, activeSpreadsheet]);

  const matchedIndicatorParent = useMemo(() => {
    if (!isMultiIndicatorSheet || !headerGroups) return null;
    if (overrideIndicatorParent) return overrideIndicatorParent;

    const spText = (activeSpreadsheet?.name || "").toLowerCase();

    const topics: { key: string; words: string[] }[] = [
      { key: "lab", words: ["laboratorium", "lab pengujian", "kemampuan laboratorium"] },
      { key: "klb", words: ["klb", "keracunan pangan"] },
      { key: "kie", words: ["kie", "komunikasi", "edukasi"] },
      { key: "kejahatan", words: ["kejahatan", "penyidikan", "analisis kejahatan"] },
      { key: "pelayanan", words: ["pelayanan publik"] },
      { key: "zi", words: ["pembangunan zi", "zona integritas"] },
      { key: "akip", words: ["akip"] },
      { key: "anggaran", words: ["kinerja anggaran"] },
      { key: "risiko", words: ["manajemen risiko"] },
      { key: "kab_kota", words: ["kabupaten", "kota"] },
      { key: "faskes", words: ["fasilitas pelayanan kesehatan", "ktd", "eso"] },
      { key: "fortifikasi", words: ["fortifikasi"] },
      { key: "amr", words: ["amr", "antimikroba"] },
    ];

    let matchedTopic: string | null = null;
    for (const t of topics) {
      if (t.words.some((w) => spText.includes(w))) {
        matchedTopic = t.key;
        break;
      }
    }

    const nonMonthParents = headerGroups
      .map((g) => g.parent)
      .filter((p): p is string => Boolean(p && getMonthNumberFromText(p) === null));

    if (matchedTopic) {
      const tObj = topics.find((t) => t.key === matchedTopic);
      const found = nonMonthParents.find((p) => {
        const pLower = (p || "").toLowerCase();
        return tObj?.words?.some((w) => pLower.includes(w));
      });
      if (found) return found;
    }

    const words = spText.split(/\s+/).filter((w) => w.length > 3 && !w.startsWith("iksk"));
    const found = nonMonthParents.find((p) => {
      const pLower = (p || "").toLowerCase();
      return words.some((w) => pLower.includes(w));
    });

    return found || nonMonthParents[0] || null;
  }, [isMultiIndicatorSheet, headerGroups, activeSpreadsheet, overrideIndicatorParent]);

  const monthColKey = useMemo(() => {
    if (!activeTab?.columns_schema) return null;
    const col = activeTab.columns_schema.find((c) => {
      const l = (c.label || "").toLowerCase().trim();
      return (
        l === "bulan" ||
        l === "periode" ||
        l.includes("bulan") ||
        l.includes("periode")
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
    // 2. Cek kolom col_0 (seringkali PERIODE/Bulan/Tanggal)
    if (r.cells?.col_0 !== undefined) {
      const n = getMonthNumberFromText(String(r.cells.col_0));
      if (n !== null) return n;
    }
    // 3. Cek kolom col_2 (seringkali kolom Bulan pada tabel multi-baris)
    if (r.cells?.col_2 !== undefined) {
      const n = getMonthNumberFromText(String(r.cells.col_2));
      if (n !== null) return n;
    }
    // 4. Cek month_name
    if (r.month_name) {
      const n = getMonthNumberFromText(r.month_name);
      if (n !== null) return n;
    }
    // 5. Cek r.month jika bernilai 1..12 dan bukan 0
    if (typeof r.month === "number" && r.month >= 1 && r.month <= 12) {
      return r.month;
    }
    // 6. Cek kolom col_1
    if (r.cells?.col_1 !== undefined) {
      const n = getMonthNumberFromText(String(r.cells.col_1));
      if (n !== null) return n;
    }
    return null;
  };

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

    if (isHorizontalMonthTable && activeTab?.columns_schema) {
      const result: { name: string; count: number }[] = [];
      standardOrder.forEach((name) => {
        const targetNum = getMonthNumberFromText(name);
        const hasMonthCol = activeTab.columns_schema.some((c) => {
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

    const monthCounts: Record<number, number> = {};

    activeTab?.rows_data?.forEach((r) => {
      const mNum = getRowMonthNumber(r);
      if (mNum !== null) {
        monthCounts[mNum] = (monthCounts[mNum] || 0) + 1;
      }
    });

    const hasAnyMonthColOrData =
      Boolean(monthColKey) ||
      Boolean(activeTab?.columns_schema?.some((c) => (c.label || "").toLowerCase().includes("bulan"))) ||
      Object.keys(monthCounts).length > 0;

    const result: { name: string; count: number }[] = [];

    if (hasAnyMonthColOrData) {
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
  }, [activeTab?.rows_data, activeTab?.columns_schema, monthColKey, isHorizontalMonthTable]);

  const filteredRows = useMemo(() => {
    if (!activeTab?.rows_data) return [];
    let rows = activeTab.rows_data;

    if (selectedMonthFilter !== "all" && !isHorizontalMonthTable) {
      const targetMonthNum = getMonthNumberFromText(selectedMonthFilter);
      if (targetMonthNum !== null) {
        rows = rows.filter((r) => {
          return getRowMonthNumber(r) === targetMonthNum;
        });
      }
    }

    // Filter per Pencarian: Mencari di SEMUA kolom, terutama kolom Topik dan Judul Topik
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      rows = rows.filter((r) => {
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
        return tokens.every((token) => fullRowText.includes(token));
      });
    }

    return rows;
  }, [activeTab?.rows_data, selectedMonthFilter, isHorizontalMonthTable, tableSearch, monthColKey]);

  const displayedColumnsSchema = useMemo<ColumnSchema[]>(() => {
    let schema = effectiveColumnsSchema;

    // Filter fokus IKSK jika dokumen multi-indikator
    if (isMultiIndicatorSheet && focusSelectedIksk && matchedIndicatorParent) {
      schema = schema.filter((col) => {
        const isIdentity =
          col.key === "col_0" ||
          col.key === "col_1" ||
          col.key === "col_2" ||
          (!col.parent_header && (col.col_letter === "A" || col.col_letter === "B" || col.col_letter === "C"));
        const belongsToIndicator = col.parent_header === matchedIndicatorParent;
        return isIdentity || belongsToIndicator;
      });
    }

    if (!isHorizontalMonthTable || selectedMonthFilter === "all") {
      return schema;
    }
    const targetMonthNum = getMonthNumberFromText(selectedMonthFilter);
    if (!targetMonthNum) return schema;

    return schema.filter((col) => {
      const isFixedLeft = col.key === "col_0" || col.key === "col_1" || (!col.parent_header && getMonthNumberFromText(col.label) === null);
      const colMonthNum = getMonthNumberFromText(col.parent_header) || getMonthNumberFromText(col.label);
      return isFixedLeft || colMonthNum === targetMonthNum;
    });
  }, [
    effectiveColumnsSchema,
    isHorizontalMonthTable,
    selectedMonthFilter,
    isMultiIndicatorSheet,
    focusSelectedIksk,
    matchedIndicatorParent,
  ]);

  const hasSubParents = useMemo(() => {
    return displayedColumnsSchema.some((c) => Boolean(c.sub_parent));
  }, [displayedColumnsSchema]);

  const displayedHeaderGroups = useMemo(() => {
    if (!headerGroups) return null;
    let groups = headerGroups;

    // Filter fokus IKSK jika dokumen multi-indikator
    if (isMultiIndicatorSheet && focusSelectedIksk && matchedIndicatorParent) {
      groups = groups.filter((grp) => {
        if (!grp.parent) {
          return grp.cols.some(
            (c) =>
              c.key === "col_0" ||
              c.key === "col_1" ||
              c.key === "col_2" ||
              c.col_letter === "A" ||
              c.col_letter === "B" ||
              c.col_letter === "C"
          );
        }
        return grp.parent === matchedIndicatorParent;
      });
    }

    if (!isHorizontalMonthTable || selectedMonthFilter === "all") {
      return groups;
    }
    const targetMonthNum = getMonthNumberFromText(selectedMonthFilter);
    if (!targetMonthNum) return groups;

    return groups
      .map((grp) => {
        if (!grp.parent) {
          return grp;
        }
        const grpMonthNum = getMonthNumberFromText(grp.parent);
        if (grpMonthNum === targetMonthNum) {
          return grp;
        }
        return null;
      })
      .filter((grp): grp is NonNullable<typeof grp> => grp !== null);
  }, [
    headerGroups,
    isHorizontalMonthTable,
    selectedMonthFilter,
    isMultiIndicatorSheet,
    focusSelectedIksk,
    matchedIndicatorParent,
  ]);

  const rawRowsCount = activeTab?.rows_data?.length || 0;
  const totalRows = filteredRows.length;
  const isPaginationNeeded = rawRowsCount > 25 || availableMonths.length > 1;
  const effectivePageSize = pageSize === 0 ? totalRows : pageSize;
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalRows / effectivePageSize) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages || 1);

  const paginatedRows = useMemo(() => {
    if (!isPaginationNeeded || pageSize === 0) return filteredRows;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, isPaginationNeeded, safeCurrentPage, pageSize]);

  const columnTotals = useMemo(() => {
    if (!activeTab?.columns_schema || !activeTab?.rows_data) return {};
    const totals: Record<string, number | null> = {};
    activeTab.columns_schema.forEach((col) => {
      let isNumericCol = true;
      let sum = 0;
      let count = 0;
      for (const row of activeTab.rows_data) {
        const val = row.cells?.[col.key];
        if (val !== undefined && val !== null && val !== "") {
          if (typeof val === "number") {
            sum += val;
            count++;
          } else {
            isNumericCol = false;
            break;
          }
        }
      }
      totals[col.key] = isNumericCol && count > 0 ? Math.round(sum * 100) / 100 : null;
    });
    return totals;
  }, [activeTab]);

  const hasExplicitTotalRow = useMemo(() => {
    if (!activeTab?.rows_data) return false;
    return activeTab.rows_data.some(
      (r) => r.is_total || r.cells?.col_0 === "Total" || r.cells?.col_0 === "TOTAL"
    );
  }, [activeTab?.rows_data]);

  const fetchData = async (targetYear = selectedYear, spId?: number, tId?: number) => {
    setLoading(true);
    try {
      const qYear = `&year=${targetYear}`;
      const qSp = spId ? `&spreadsheet_id=${spId}` : "";
      const qTab = tId ? `&tab_id=${tId}` : "";
      const res = await api.get(
        `${baseUrl}/api/superadmin/test-local-table${authQuery}${qYear}${qSp}${qTab}`
      );
      const d = res.data?.data || {};

      if (Array.isArray(d.years) && d.years.length > 0) {
        setYears(d.years);
      }
      if (d.selected_year) {
        setSelectedYear(Number(d.selected_year));
      }
      setSpreadsheets(d.spreadsheets || []);
      setKatims(d.katims || []);
      setIksks(d.iksks || []);

      if (d.active_spreadsheet) {
        setSelectedSpId(d.active_spreadsheet.id);
      } else {
        setSelectedSpId(null);
      }
      if (d.active_tab) {
        setSelectedTabId(d.active_tab.id);
        setActiveTab(d.active_tab);
      } else {
        setSelectedTabId(null);
        setActiveTab(null);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal memuat data tabel lokal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData(selectedYear);
    }
  }, [user?.id, selectedYear]);

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    fetchData(year);
  };

  const handleSelectSpreadsheet = (id: number) => {
    setSelectedSpId(id);
    fetchData(selectedYear, id);
  };

  const handleSelectTab = (tId: number) => {
    setSelectedTabId(tId);
    if (selectedSpId) {
      fetchData(selectedYear, selectedSpId, tId);
    }
  };

  // Tambah Tahun Baru
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearNumber) return;
    setAddingYear(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.post(
        `${baseUrl}/api/superadmin/test-local-table/years${authQuery}`,
        {
          year_number: Number(newYearNumber),
          desc: newYearDesc || `Tahun Anggaran RHPK ${newYearNumber}`,
        }
      );
      setSuccessMsg(res.data?.message || `Tahun ${newYearNumber} berhasil ditambahkan.`);
      setAddYearModalOpen(false);
      setNewYearDesc("");
      const yr = Number(newYearNumber);
      setSelectedYear(yr);
      fetchData(yr);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menambahkan tahun.");
    } finally {
      setAddingYear(false);
    }
  };

  // Duplikat Format RHPK dari Tahun Asal ke Tahun Tujuan
  const handleDuplicateYear = async () => {
    setDuplicating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.post(
        `${baseUrl}/api/superadmin/test-local-table/duplicate-year${authQuery}`,
        {
          source_year: duplicateSourceYear,
          target_year: selectedYear,
        }
      );
      setSuccessMsg(res.data?.message || "Format RHPK berhasil diduplikasi.");
      setDuplicateModalOpen(false);
      fetchData(selectedYear);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menduplikasi RHPK.");
    } finally {
      setDuplicating(false);
    }
  };

  // Tambah file ke antrean upload
  const handleAddFiles = (newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter((f) =>
      /\.(xlsx|xls)$/i.test(f.name)
    );
    if (valid.length === 0) {
      setErrorMsg("Hanya file berformat Excel (.xlsx, .xls) yang didukung.");
      return;
    }
    setUploadFiles((prev) => {
      const map = new Map<string, File>();
      prev.forEach((f) => map.set(`${f.name}_${f.size}`, f));
      valid.forEach((f) => map.set(`${f.name}_${f.size}`, f));
      return Array.from(map.values()).slice(0, 15); // maks 15 file per batch
    });
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload Excel Batch
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      setErrorMsg("Silakan pilih atau seret setidaknya satu file Excel terlebih dahulu.");
      return;
    }
    const invalid = uploadFiles.find(
      (f) => !/\.(xlsx|xls)$/i.test(f.name) || f.size > 20 * 1024 * 1024,
    );
    if (invalid) {
      setErrorMsg(
        `File "${invalid.name}" tidak valid. Hanya file Excel (.xlsx / .xls) maksimal 20 MB yang didukung.`,
      );
      return;
    }
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengunggah ${uploadFiles.length} file Excel untuk Tahun ${selectedYear}?\n\n` +
        "Jika dokumen untuk IKSK yang sama sudah ada, datanya akan TERUPDATE sesuai isi file " +
        "(tab bulanan diperbarui per bulan, bukan ditambah baris baru).",
    );
    if (!confirmed) return;
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    uploadFiles.forEach((f) => {
      formData.append("files[]", f);
    });
    formData.append("year", String(selectedYear));

    try {
      const res = await api.post(
        `${baseUrl}/api/superadmin/test-local-table/upload${authQuery}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSuccessMsg(res.data?.message || "File Excel berhasil diunggah.");
      setShowUploadCard(false);
      setUploadFiles([]);
      fetchData(selectedYear, res.data?.data?.spreadsheet_id);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          (err.response
            ? `Gagal mengunggah file Excel (kesalahan server ${err.response.status}).`
            : "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi."),
      );
    } finally {
      setUploading(false);
    }
  };

  // Buka Modal Atur Kolom
  const handleOpenColModal = () => {
    if (!activeTab) return;
    setEditingCols(JSON.parse(JSON.stringify(activeTab.columns_schema || [])));
    setSelectedColIndex(0);
    setColModalOpen(true);
  };

  // Simpan Konfigurasi Kolom
  const handleSaveColumns = async () => {
    if (!activeTab) return;
    setSavingCols(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.post(
        `${baseUrl}/api/superadmin/test-local-table/tab/${activeTab.id}/columns${authQuery}`,
        { columns: editingCols }
      );
      setSuccessMsg(res.data?.message || "Konfigurasi kolom berhasil disimpan.");
      setColModalOpen(false);
      if (selectedSpId && selectedTabId) {
        fetchData(selectedSpId, selectedTabId);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menyimpan konfigurasi kolom.");
    } finally {
      setSavingCols(false);
    }
  };

  // Hapus Spreadsheet
  const handleDeleteSpreadsheet = async (id: number) => {
    if (!confirm("Hapus dokumen template tabel ini beserta semua tab-nya?")) return;
    setLoading(true);
    try {
      const res = await api.delete(
        `${baseUrl}/api/superadmin/test-local-table/${id}${authQuery}`
      );
      setSuccessMsg(res.data?.message || "Dokumen berhasil dihapus.");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menghapus dokumen.");
      setLoading(false);
    }
  };

  const handleDeleteTab = async (tId: number, tTitle: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Tab "${tTitle}"? Seluruh data tabel pada tab ini akan dihapus permanen.`)) return;
    setLoading(true);
    try {
      const res = await api.delete(
        `${baseUrl}/api/superadmin/test-local-table/tab/${tId}${authQuery}`
      );
      setSuccessMsg(res.data?.message || `Tab "${tTitle}" berhasil dihapus.`);
      setSelectedTabId(null);
      setActiveTab(null);
      fetchData(selectedYear, selectedSpId ?? undefined);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menghapus tab.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Clean & Minimal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kelola Akses RHPK
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUploadCard((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#004b8d]"
          >
            <span>{showUploadCard ? "Tutup Form Unggah" : "Unggah Dokumen Excel"}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-700 hover:text-red-900">
            &times;
          </button>
        </div>
      )}

      {/* Card Upload Dokumen Template RHPK (Sesuai Format Pengujian / Screenshot) */}
      {showUploadCard && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 transition-all">
          <div className="border-b border-slate-100 pb-3.5 mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Unggah Dokumen Template RHPK (Excel .xlsx / .xls)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Mendukung file Excel (.xlsx, .xls) template Pusat. Sistem otomatis membaca sheet/tab, rumus formulir, dan hak akses Katim.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit}>
            <div
              onClick={() => document.getElementById("pic-excel-upload-input")?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleAddFiles(e.dataTransfer.files);
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition cursor-pointer ${
                isDragging
                  ? "border-[#005baa] bg-blue-50/50"
                  : "border-slate-200 hover:border-[#005baa]/60 hover:bg-slate-50/50"
              }`}
            >
              <input
                id="pic-excel-upload-input"
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files) {
                    handleAddFiles(e.target.files);
                  }
                }}
                className="hidden"
              />

              {/* 3 Glyph Badges (Persis Sesuai Gambar Referensi) */}
              <div className="flex items-center justify-center gap-3 mb-3">
                {/* Excel Glyph */}
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l3 3m0-3l-3 3m5-3h4m-4 3h4"></path>
                  </svg>
                </div>
                {/* PDF Glyph */}
                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 11h6"></path>
                  </svg>
                </div>
                {/* CSV Glyph */}
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#005baa] shadow-2xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Pilih atau seret file ke area ini
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Format didukung: <strong>.xlsx, .xls</strong> (Maksimal 5 file per batch, hingga 25 MB)
                </p>
              </div>
            </div>

            {/* Antrean File yang Dipilih */}
            {uploadFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    File Terpilih ({uploadFiles.length} file):
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadFiles([])}
                    className="text-red-500 hover:underline font-semibold"
                  >
                    Hapus Semua
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {uploadFiles.map((file, idx) => {
                    const sizeKb = Math.round(file.size / 1024);
                    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

                    return (
                      <div
                        key={`${file.name}_${idx}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs transition hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            XLS
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {sizeStr} &bull; Siap diekstrak ke Tahun {selectedYear}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="text-slate-400 hover:text-red-600 transition p-1 text-base font-bold leading-none"
                          title="Hapus file ini"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Bar: Helper Text & Submit Button (Sesuai Gambar) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                File yang diunggah akan langsung dipetakan ke tabel di bawah ini.
              </p>

              <button
                type="submit"
                disabled={uploading || uploadFiles.length === 0}
                className="inline-flex items-center justify-center rounded-xl bg-[#005baa] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#004887] disabled:opacity-50 transition"
              >
                {uploading ? "Memproses Data Excel..." : "Proses & Generate Tabel RHPK"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Selector Dokumen & Tab */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {/* Row 1: Toolbar Tahun & Duplikasi Format */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Tahun Anggaran RHPK:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleSelectYear(Number(e.target.value))}
              className="rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-1.5 text-xs font-bold text-[#005baa] focus:border-[#005baa] focus:bg-white focus:outline-none"
            >
              {years.map((y) => (
                <option key={y.id} value={y.year_number}>
                  Tahun {y.year_number} {y.total_spreadsheets !== undefined ? `(${y.total_spreadsheets} Dokumen)` : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setNewYearNumber(selectedYear + 1);
                setNewYearDesc(`Tahun Anggaran RHPK ${selectedYear + 1}`);
                setAddYearModalOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              title="Tambah Tahun Baru"
            >
              <span>+ Tambah Tahun</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // Cari tahun sebelumnya
                const prev = years.find((y) => y.year_number < selectedYear);
                setDuplicateSourceYear(prev ? prev.year_number : 2026);
                setDuplicateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 shadow-2xs"
              title="Salin seluruh format, rumus, dan hak akses kolom Katim dari tahun lalu"
            >
              <span>Duplikat dari Tahun Lalu</span>
            </button>
          </div>
        </div>

        {/* Row 2: Selector Dokumen & Aksi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Pilih Dokumen:
            </label>
            <select
              value={selectedSpId ?? ""}
              onChange={(e) => handleSelectSpreadsheet(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:bg-white focus:outline-none max-w-xs md:max-w-md truncate"
            >
              {spreadsheets.length === 0 && (
                <option value="">Belum ada dokumen di tahun {selectedYear} (Klik Unggah Excel atau Duplikat)</option>
              )}
              {spreadsheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.tabs?.length || 0} Tab)
                </option>
              ))}
            </select>
          </div>

          {selectedSpId && (
            <div className="flex items-center gap-2">
              {activeSpreadsheet && (
                <Link
                  href={`/siproval/admin/entry-data-rhpk?iksk_id=${activeSpreadsheet.iksk_id || ""}&spreadsheet_id=${selectedSpId}&tab_id=${selectedTabId || ""}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                  title="Buka form input untuk memasukkan angka target dan data capaian RHPK"
                >
                  <Icon icon="solar:pen-new-square-bold" width={16} />
                  <span>Isi Data & Target RHPK</span>
                </Link>
              )}
              {activeSpreadsheet && (
                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    onClick={() => setShowExportDropdown((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 shadow-xs transition hover:bg-emerald-100"
                    title="Unduh file Excel RHPK dengan Tanda Tangan Kabalai"
                  >
                    <Icon icon="ri:file-excel-2-fill" width={16} className="text-emerald-700" />
                    <span>Unduh Excel (RHPK)</span>
                    <Icon icon="solar:alt-arrow-down-linear" width={14} className="text-emerald-700" />
                  </button>

                  {showExportDropdown && (
                    <div className="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                        PILIH PERIODE UNDUH (RHPK)
                      </div>
                      <a
                        href={`${baseUrl}/api/test-local-table/spreadsheet/${activeSpreadsheet.id}/export?mode=locked`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowExportDropdown(false)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex flex-col gap-0.5 transition block"
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Icon icon="solar:lock-keyhole-bold" width={13} className="text-amber-500" />
                          <span>Bulan Terkunci (Final)</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Khusus bulan final terkunci + Tanda Tangan Kabalai
                        </span>
                      </a>
                      <a
                        href={`${baseUrl}/api/test-local-table/spreadsheet/${activeSpreadsheet.id}/export?mode=all`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowExportDropdown(false)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg flex flex-col gap-0.5 transition block"
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Icon icon="solar:calendar-bold" width={13} className="text-blue-500" />
                          <span>Semua Bulan (1 - 12)</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Unduh seluruh 12 bulan + Tanda Tangan Kabalai
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenColModal}
                disabled={!activeTab}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#005baa] transition hover:bg-blue-100 disabled:opacity-50"
              >
                <Icon icon="solar:shield-user-bold" width={16} />
                Atur Hak Akses Kolom (Enkapsulasi)
              </button>
              {activeTab && (
                <button
                  type="button"
                  onClick={() => handleDeleteTab(activeTab.id, activeTab.title)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                  title={`Hapus Tab "${activeTab.title}"`}
                >
                  <Icon icon="solar:trash-bin-trash-bold" width={14} />
                  Hapus Tab
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteSpreadsheet(selectedSpId)}
                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                title="Hapus seluruh dokumen spreadsheet beserta semua tab-nya"
              >
                <Icon icon="solar:trash-bin-trash-bold" width={14} />
                Hapus Dokumen
              </button>
            </div>
          )}
        </div>

        {/* Tab Buttons (Pills Style Sesuai Standar TU) */}
        {selectedSpId && (
          <div className="pt-2.5 border-t border-slate-100">
            <div className="mb-2 text-xs font-semibold text-slate-500">
              Daftar Sheet / Tab ({spreadsheets.find((s) => s.id === selectedSpId)?.tabs?.length || 0} Tab):
            </div>
            <div className="flex flex-wrap gap-2">
              {spreadsheets
                .find((s) => s.id === selectedSpId)
                ?.tabs?.map((t) => {
                  const isSelected = selectedTabId === t.id;
                  return (
                    <div key={t.id} className="inline-flex items-center group relative">
                      <button
                        type="button"
                        onClick={() => handleSelectTab(t.id)}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-[#005baa] text-white shadow-xs font-bold ring-2 ring-[#005baa]/20 pr-8"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 pr-7"
                        }`}
                      >
                        <Icon
                          icon={isSelected ? "solar:document-bold" : "solar:document-linear"}
                          width={14}
                        />
                        <span>{t.title}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTab(t.id, t.title);
                        }}
                        className={`absolute right-1.5 p-1 rounded-lg transition opacity-60 hover:opacity-100 cursor-pointer ${
                          isSelected
                            ? "text-white/80 hover:text-white hover:bg-white/20"
                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-100"
                        }`}
                        title={`Hapus Tab "${t.title}"`}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={12} />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* TU-STYLE HEADER & KPI SUMMARY BAR (SEPERTI REKAPITULASI TU)   */}
      {/* ============================================================ */}
      {activeTab && (
        <div className="space-y-4">
          {/* Breadcrumbs & Document Info */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>RHPK</span>
                <span>/</span>
                <span>Tahun {selectedYear}</span>
                {activeSpreadsheet && (
                  <>
                    <span>/</span>
                    <span className="font-semibold text-slate-700 truncate max-w-xs">{activeSpreadsheet.name}</span>
                  </>
                )}
                <span>/</span>
                <span className="font-bold text-[#005baa]">{activeTab.title}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {activeTab.title}
                </h2>
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#005baa]">
                  Tahun Anggaran {selectedYear}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenColModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#004887]"
              >
                <Icon icon="solar:shield-user-bold" width={16} />
                <span>Atur Hak Akses Kolom (Enkapsulasi)</span>
              </button>
            </div>
          </div>

          {/* Main KPI Summary Bar: 4 Clear Stat Cards (Sesuai Layout TU) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="grid grid-cols-2 gap-4 divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
              <div className="sm:px-4 first:pl-0">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Total Kolom Tab
                </span>
                <span className="mt-1 block text-2xl font-bold text-slate-900">
                  {activeTab.columns_schema?.length || 0}
                </span>
                <span className="text-[11px] text-slate-400">
                  Struktur kolom tabel
                </span>
              </div>

              <div className="pt-3 sm:pt-0 sm:px-4">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Kolom Editable (PIC)
                </span>
                <span className="mt-1 block text-2xl font-bold text-emerald-600">
                  {activeTab.columns_schema?.filter((c) => c.type === "editable").length || 0}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Dapat diisi Ketua Tim
                </span>
              </div>

              <div className="pt-3 sm:pt-0 sm:px-4">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Kolom Formula
                </span>
                <span className="mt-1 block text-2xl font-bold text-purple-700">
                  {activeTab.columns_schema?.filter((c) => c.type === "formula").length || 0}
                </span>
                <span className="text-[11px] text-purple-700 font-medium">
                  Kalkulasi otomatis
                </span>
              </div>

              <div className="pt-3 sm:pt-0 sm:px-4">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Periode Isian
                </span>
                <span className="mt-1 block text-2xl font-bold text-[#005baa]">
                  12 Bulan
                </span>
                <span className="text-[11px] text-slate-500">
                  Januari s.d. Desember
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN DATA TABLE (DESAIN & POLISH SEPERTI TABEL TU)            */}
      {/* ============================================================ */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm space-y-0">
        {/* Table Top Controls, Filter Bulan & Search Bar */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 space-y-3">
          {/* Row 1: Filter Bulan Pills jika terdapat lebih dari 1 bulan */}
          {availableMonths.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Icon icon="solar:calendar-bold" width={14} className="text-[#005baa]" />
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
                    ? "bg-[#005baa] text-white shadow-blue-600/20"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Semua Bulan ({rawRowsCount})
              </button>
              {availableMonths.map((m) => {
                const isSelected =
                  selectedMonthFilter.toLowerCase() === m.name.toLowerCase();
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
                        ? "bg-[#005baa] text-white shadow-blue-600/20"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {m.name} ({m.count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 2: Search input + Info baris + Top Pagination Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Icon
                icon="solar:magnifer-linear"
                width={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari bulan atau data sel pada tabel..."
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:outline-none"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setTableSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Menampilkan{" "}
                  <strong className="text-slate-800">
                    {totalRows === 0
                      ? 0
                      : (safeCurrentPage - 1) * (pageSize || 1) + 1}
                  </strong>{" "}
                  -{" "}
                  <strong className="text-slate-800">
                    {Math.min(safeCurrentPage * (pageSize || 1), totalRows)}
                  </strong>{" "}
                  dari{" "}
                  <strong className="text-slate-800">{totalRows}</strong> baris
                  {selectedMonthFilter !== "all" && (
                    <span className="ml-1 text-[#005baa] font-semibold">
                      ({selectedMonthFilter})
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-1.5 ml-1 border-l border-slate-300 pl-3">
                  <span className="text-[11px] text-slate-500">Per Hal:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#005baa] focus:outline-none cursor-pointer"
                  >
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
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="Halaman Pertama"
                  >
                    <Icon icon="solar:double-alt-arrow-left-linear" width={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="Halaman Selanjutnya"
                  >
                    <Icon icon="solar:alt-arrow-right-linear" width={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="Halaman Terakhir"
                  >
                    <Icon icon="solar:double-alt-arrow-right-linear" width={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat tabel data...</p>
          </div>
        ) : !activeTab ? (
          <div className="p-16 text-center text-xs text-slate-400">
            Belum ada tabel yang dipilih. Silakan pilih dokumen atau unggah file Excel di atas.
          </div>
        ) : (
          <>
            {/* Banner Mode Multi-Indikator: Memungkinkan isolasi fokus pada IKSK yang dipilih tanpa terganggu 13 indikator lainnya */}
            {isMultiIndicatorSheet && (
              <div className="mx-6 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/60 p-3.5 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-[#005baa] text-white shrink-0 shadow-xs">
                    <Icon icon="solar:filter-bold-duotone" width={18} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>Dokumen Gabungan RHPK Balai (13 Indikator Terpadu)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        61 Kolom
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                      <span>Pilih Fokus Indikator:</span>
                      <select
                        value={matchedIndicatorParent || ""}
                        onChange={(e) => {
                          setOverrideIndicatorParent(e.target.value);
                          setFocusSelectedIksk(true);
                        }}
                        className="rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs font-semibold text-[#005baa] shadow-2xs focus:border-[#005baa] focus:outline-hidden"
                      >
                        {headerGroups
                          ?.map((g) => g.parent)
                          .filter((p): p is string => Boolean(p && getMonthNumberFromText(p) === null))
                          .map((p, pIdx) => (
                            <option key={pIdx} value={p}>
                              {p}
                            </option>
                          ))}
                      </select>
                      {focusSelectedIksk && (
                        <span className="text-emerald-700 font-medium">
                          ({displayedColumnsSchema.length} Kolom aktif termasuk Identitas Unit & Bulan)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFocusSelectedIksk(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs shadow-2xs ${
                      focusSelectedIksk
                        ? "bg-[#005baa] text-white ring-2 ring-blue-300"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Icon icon="solar:check-circle-bold" width={14} className={focusSelectedIksk ? "text-white" : "text-slate-400"} />
                    <span>Fokus 1 Indikator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusSelectedIksk(false)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs shadow-2xs ${
                      !focusSelectedIksk
                        ? "bg-[#005baa] text-white ring-2 ring-blue-300"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Icon icon="solar:layers-bold" width={14} className={!focusSelectedIksk ? "text-white" : "text-slate-400"} />
                    <span>Tampilkan Seluruh 13 Indikator ({effectiveColumnsSchema.length} Kolom)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs">
              {/* Sticky Table Header */}
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 sticky top-0 z-20">
                {displayedHeaderGroups ? (
                  <>
                    <tr className="border-b border-slate-200">
                      {displayedHeaderGroups.map((grp, gIdx) => {
                        if (!grp.parent) {
                          const numLeftCols = grp.cols.length;
                          return grp.cols.map((col, cIdx) => {
                            let stickyStyle = "bg-slate-50 text-slate-800";
                            if (cIdx === 0) {
                              stickyStyle =
                                numLeftCols > 1
                                  ? "sticky left-0 z-30 bg-slate-100 text-slate-900 w-[55px] min-w-[55px] max-w-[55px] text-center border-r border-slate-200"
                                  : "sticky left-0 z-30 bg-slate-100 shadow-r text-slate-900 min-w-[130px] border-r border-slate-200";
                            } else if (cIdx === 1 && numLeftCols > 1) {
                              stickyStyle =
                                "sticky left-[55px] z-30 bg-slate-100 shadow-r text-slate-900 min-w-[240px] max-w-[280px] border-r border-slate-200";
                            }

                            return (
                              <th
                                key={col.key}
                                rowSpan={hasSubParents ? 3 : 2}
                                className={`py-3 px-3.5 font-bold text-left ${stickyStyle}`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    [{col.col_letter}]
                                  </span>
                                  <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                                    Kunci
                                  </span>
                                </div>
                                <div className="text-xs font-bold leading-snug">
                                  {col.label}
                                </div>
                              </th>
                            );
                          });
                        }

                        const mColor = getMonthColor(grp.parent);
                        return (
                          <th
                            key={`grp-${gIdx}-${grp.parent}`}
                            colSpan={grp.cols.length}
                            className={`py-2 px-3 font-bold border-b border-r border-slate-300 text-center text-xs tracking-wider uppercase ${mColor.header}`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`size-2 rounded-full inline-block ${mColor.dot}`} />
                              <span>{grp.parent}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                    {hasSubParents && (
                      <tr className="border-b border-slate-200 bg-slate-100">
                        {displayedHeaderGroups.map((grp, gIdx) => {
                          if (!grp.parent) return null;
                          const subChunks: { sub_parent: string; count: number }[] = [];
                          grp.cols.forEach((col) => {
                            const sp = col.sub_parent || "";
                            if (subChunks.length > 0 && subChunks[subChunks.length - 1].sub_parent === sp) {
                              subChunks[subChunks.length - 1].count++;
                            } else {
                              subChunks.push({ sub_parent: sp, count: 1 });
                            }
                          });

                          return subChunks.map((chunk, cIdx) => (
                            <th
                              key={`subgrp-${gIdx}-${cIdx}-${chunk.sub_parent}`}
                              colSpan={chunk.count}
                              className="py-2 px-3 font-semibold text-center text-xs border-r border-b border-slate-200 bg-slate-100 text-slate-800 whitespace-pre-line leading-relaxed"
                            >
                              {chunk.sub_parent}
                            </th>
                          ));
                        })}
                      </tr>
                    )}
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {displayedHeaderGroups.map((grp) => {
                        if (!grp.parent) return null;
                        const mColor = getMonthColor(grp.parent);
                        return grp.cols.map((col) => {
                          const subTitle = col.sub_label || (col.label && col.label.includes(" - ") ? col.label.split(" - ").slice(1).join(" - ").trim() : col.label);
                          const katimNames = katims
                            .filter((k) => col.allowed_katim_ids?.includes(k.user_id))
                            .map((k) => k.name);

                          return (
                            <th
                              key={col.key}
                              className={`py-2 px-3 font-semibold border-r border-slate-200 last:border-r-0 min-w-[125px] ${mColor.sub}`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-[10px] text-slate-400">
                                  [{col.col_letter}]
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                    col.type === "editable"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : col.type === "formula"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {col.type}
                                </span>
                              </div>
                              <div className="text-[11px] font-bold leading-snug text-slate-800 line-clamp-2">
                                {subTitle}
                              </div>
                              {col.type === "formula" && col.formula && (
                                <div
                                  title={`Rumus: ${col.formula}`}
                                  className="mt-1 font-mono text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 truncate"
                                >
                                  fx {col.formula}
                                </div>
                              )}
                              {col.type === "editable" && (
                                <div className="mt-1 pt-0.5 border-t border-slate-200/60">
                                  {katimNames.length > 0 ? (
                                    <div
                                      title={`Hak isi: ${katimNames.join(", ")}`}
                                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-[#005baa] border border-blue-200 max-w-full truncate"
                                    >
                                      <Icon icon="solar:user-bold" width={10} className="shrink-0" />
                                      <span className="truncate">{katimNames.join(", ")}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] font-medium text-slate-400 italic">
                                      Semua Katim
                                    </span>
                                  )}
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
                    {/* Kolom Pertama [A] Bulan - Sticky Left */}
                    <th className="py-3 px-4 font-bold text-slate-800 border-r border-slate-200 sticky left-0 z-30 bg-slate-100 min-w-[130px] shadow-r">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] text-slate-500 font-bold">[A]</span>
                        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                          Kunci
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {displayedColumnsSchema?.[0]?.label || "Bulan"}
                      </div>
                    </th>

                    {/* Sisa Kolom-Kolom Tabel */}
                    {displayedColumnsSchema?.slice(1).map((col) => {
                      const katimNames = katims
                        .filter((k) => col.allowed_katim_ids?.includes(k.user_id))
                        .map((k) => k.name);

                      return (
                        <th
                          key={col.key}
                          className="py-3 px-4 font-bold text-slate-800 border-r border-slate-200 last:border-r-0 min-w-[150px] align-top bg-slate-50"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[10px] text-slate-400 font-bold">
                              [{col.col_letter}]
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                col.type === "editable"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : col.type === "formula"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {col.type}
                            </span>
                          </div>

                          <div className="text-xs text-slate-900 font-bold leading-snug">
                            {col.label}
                          </div>

                          {/* Formula Indicator fx */}
                          {col.type === "formula" && col.formula && (
                            <div
                              title={`Rumus: ${col.formula}`}
                              className="mt-1.5 font-mono text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/80 truncate font-semibold"
                            >
                              fx {col.formula}
                            </div>
                          )}

                          {/* Katim PIC Indicator */}
                          {col.type === "editable" && (
                            <div className="mt-1.5 pt-1 border-t border-slate-200/60">
                              {katimNames.length > 0 ? (
                                <div
                                  title={`Hak isi: ${katimNames.join(", ")}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#005baa] border border-blue-200 max-w-full truncate"
                                >
                                  <Icon icon="solar:user-bold" width={11} className="shrink-0" />
                                  <span className="truncate">{katimNames.join(", ")}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400 italic">
                                  Terbuka untuk semua Katim
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                )}
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displayedColumnsSchema?.length || 1}
                      className="py-12 text-center text-xs text-slate-400"
                    >
                      Tidak ada data yang cocok dengan pencarian &quot;{tableSearch}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => {
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
                        "%Capaian"
                      ].includes(row.cells?.col_1);
                    const isQuestionRow =
                      (row as any).row_type === "question" ||
                      (typeof row.cells?.col_1 === "string" && row.cells.col_1.startsWith("- "));
                    const isTotalRow = Boolean(
                      row.is_total ||
                      row.cells?.col_0 === "Total" ||
                      row.cells?.col_0 === "TOTAL" ||
                      isFormulaRow
                    );

                    const numLeftCols =
                      displayedHeaderGroups && !displayedHeaderGroups[0]?.parent
                        ? displayedHeaderGroups[0].cols.length
                        : 1;
                    const hasMultiLeftCols = Boolean(
                      displayedHeaderGroups && !displayedHeaderGroups[0]?.parent && numLeftCols > 1
                    );

                    const isRowFilled = Boolean(row.is_updated);

                    return (
                      <tr
                        key={`pic_row_${row.row_index ?? rIdx}_${row.cells?.[monthColKey || 'col_2'] ?? ''}_${row.cells?.col_0 ?? ''}_${rIdx}`}
                        className={`transition group ${
                          isSectionRow
                            ? "bg-slate-100 font-bold border-y border-slate-300 text-slate-900"
                            : isFormulaRow
                            ? "bg-emerald-50/70 border-y border-emerald-300 font-bold"
                            : isTotalRow
                            ? "bg-emerald-50/70 border-t-2 border-emerald-300 font-bold"
                            : isRowFilled
                            ? "bg-emerald-50/30 hover:bg-emerald-50/60"
                            : "bg-white hover:bg-slate-50/80"
                        }`}
                      >
                        {displayedColumnsSchema?.map((col, cIdx) => {
                          const val = row.cells?.[col.key] ?? "";
                          const isNum = typeof val === "number";

                          let stickyTdClass = "";
                          if (hasMultiLeftCols) {
                            if (cIdx === 0) {
                              stickyTdClass = `sticky left-0 z-10 w-[55px] min-w-[55px] max-w-[55px] text-center border-r border-slate-200 ${
                                isSectionRow
                                  ? "bg-slate-200 font-black text-slate-900"
                                  : (isFormulaRow || isTotalRow)
                                  ? "bg-emerald-100 text-emerald-950 font-bold"
                                  : isQuestionRow
                                  ? "bg-blue-50/80 font-bold text-blue-900"
                                  : "bg-white font-medium text-slate-700"
                              }`;
                            } else if (cIdx === 1) {
                              stickyTdClass = `sticky left-[55px] z-10 min-w-[240px] max-w-[280px] shadow-r border-r border-slate-200 ${
                                isSectionRow
                                  ? "bg-slate-100 font-black text-slate-900"
                                  : (isFormulaRow || isTotalRow)
                                  ? "bg-emerald-100 text-emerald-950 font-bold"
                                  : isQuestionRow
                                  ? "bg-blue-50/40 font-semibold text-blue-950"
                                  : "bg-white font-semibold text-slate-900"
                              }`;
                            }
                          } else if (cIdx === 0 && Boolean(displayedHeaderGroups)) {
                            stickyTdClass = `sticky left-0 z-10 min-w-[130px] shadow-r border-r border-slate-200 ${
                              isTotalRow
                                ? "bg-emerald-100 text-emerald-950 font-bold"
                                : "bg-white text-slate-900 font-bold"
                            }`;
                          }

                          // Section row: cIdx >= 2 renders empty dash
                          if (isSectionRow && cIdx >= 2) {
                            return (
                              <td
                                key={col.key}
                                className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 bg-slate-50/40 text-center text-slate-300 font-mono"
                              >
                                -
                              </td>
                            );
                          }

                          return (
                            <td
                              key={col.key}
                              className={`py-2.5 px-3.5 border-r border-slate-100 last:border-r-0 text-xs transition ${stickyTdClass} ${
                                isNum ? "text-right font-mono" : "text-left text-slate-700"
                              } ${
                                isFormulaRow
                                  ? "bg-slate-200 text-slate-950 font-bold border-b border-slate-300"
                                  : isQuestionRow && col.type === "formula"
                                  ? "bg-slate-200 text-slate-900 font-semibold"
                                  : isTotalRow
                                  ? "bg-slate-200 text-slate-950 font-bold border-b border-slate-300"
                                  : col.type === "formula"
                                  ? "bg-slate-200 text-slate-800 font-semibold"
                                  : col.type === "editable"
                                  ? isQuestionRow
                                    ? "bg-blue-50/30 text-blue-950 font-semibold"
                                    : "bg-white group-hover:bg-blue-50/20 text-slate-900"
                                  : "bg-slate-200/80 text-slate-600 font-medium"
                              }`}
                            >
                              {val !== "" ? formatDisplayCellValue(val, col) : <span className="text-slate-300 font-mono">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Rekapitulasi / Total Row (Hanya jika belum ada baris Total eksplisit) */}
              {activeTab.rows_data && activeTab.rows_data.length > 0 && !hasExplicitTotalRow && (
                <tfoot className="border-t-2 border-slate-300 bg-slate-50/90 font-bold text-xs sticky bottom-0 z-10">
                  <tr>
                    <td className="py-3 px-4 text-slate-900 border-r border-slate-200 sticky left-0 z-20 bg-slate-100 shadow-r">
                      <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">Total Rekap</span>
                    </td>

                    {displayedColumnsSchema?.slice(1).map((col) => {
                      const totalVal = columnTotals[col.key];

                      return (
                        <td
                          key={`total-${col.key}`}
                          className={`py-3 px-4 border-r border-slate-200 last:border-r-0 text-xs ${
                            totalVal !== null && totalVal !== undefined
                              ? "text-right font-mono font-bold text-slate-900"
                              : "text-center text-slate-400 font-mono"
                          }`}
                        >
                          {totalVal !== null && totalVal !== undefined
                            ? totalVal.toLocaleString("id-ID")
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Toolbar PIC */}
          {isPaginationNeeded && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-5 py-3.5">
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
                  dari <span className="font-bold text-slate-900">{totalRows}</span>{" "}
                  baris
                  {selectedMonthFilter !== "all" && (
                    <span className="ml-1 text-[#005baa] font-semibold">
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
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#005baa] focus:outline-none cursor-pointer"
                  >
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
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="Halaman Pertama"
                  >
                    <Icon icon="solar:double-alt-arrow-left-linear" width={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="Halaman Sebelumnya"
                  >
                    <Icon icon="solar:alt-arrow-left-linear" width={16} />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {getPageNumbers(safeCurrentPage, totalPages).map((p, pIdx) =>
                      p === "..." ? (
                        <span
                          key={`dots-${pIdx}`}
                          className="px-1 text-xs text-slate-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                              key={`page-${p}-${pIdx}`}
                          type="button"
                          onClick={() => setCurrentPage(Number(p))}
                          className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition shadow-2xs ${
                            safeCurrentPage === Number(p)
                              ? "bg-[#005baa] text-white shadow-blue-600/20"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="Halaman Selanjutnya"
                  >
                    <Icon icon="solar:alt-arrow-right-linear" width={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="Halaman Terakhir"
                  >
                    <Icon icon="solar:double-alt-arrow-right-linear" width={16} />
                  </button>
                </div>
              )}
            </div>
          )}
          </>
        )}

        {/* Note Alert jika tab Caput RO Sampel Obat dll */}
        {activeTab?.id === 70 && (
          <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2 shadow-xs">
            <Icon icon="solar:info-circle-bold" width={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Keterangan Dokumen: </span>
              Data Realisasi RO Sampel Obat, OBA, SK dan Kos dihitung dari data Realisasi Sampling tiap bulannya.
            </div>
          </div>
        )}

        {/* Legend untuk Indeks KIE */}
        {(activeTab?.id === 135 || activeTab?.title?.toLowerCase().includes("indeks kie")) && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-xs">
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
                  (Dihitung Otomatis: Indeks Tatap Muka, Indeks Media, Total Responden, Indeks Rata-rata, %Capaian)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Atur Hak Akses Kolom (Enkapsulasi - 100% Dropdown Based) */}
      {colModalOpen && editingCols.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Atur Hak Akses Kolom: {activeTab?.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih kolom melalui dropdown untuk mengatur tipe, hak akses PIC, atau rumus formulanya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setColModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 1. Selector Dropdown Kolom & Navigasi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Icon icon="solar:menu-dots-square-bold" width={16} className="text-[#005baa]" />
                    <span>1. Pilih Kolom yang Ingin Diatur:</span>
                  </label>
                  <select
                    value={selectedColIndex}
                    onChange={(e) => setSelectedColIndex(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#005baa] focus:outline-none shadow-sm"
                  >
                    {editingCols.map((c, i) => (
                      <option key={c.key} value={i}>
                        [{c.col_letter}] {c.label} ({c.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto pt-2 sm:pt-0">
                  <button
                    type="button"
                    disabled={selectedColIndex === 0}
                    onClick={() => setSelectedColIndex((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Icon icon="solar:arrow-left-linear" width={14} />
                    <span>Prev</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500 px-1">
                    {selectedColIndex + 1}/{editingCols.length}
                  </span>
                  <button
                    type="button"
                    disabled={selectedColIndex === editingCols.length - 1}
                    onClick={() =>
                      setSelectedColIndex((prev) =>
                        Math.min(editingCols.length - 1, prev + 1)
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <span>Next</span>
                    <Icon icon="solar:arrow-right-linear" width={14} />
                  </button>
                </div>
              </div>

              {/* 2. Form Konfigurasi Kolom Terpilih */}
              {editingCols[selectedColIndex] && (
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/20 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama / Judul Kolom:
                      </label>
                      <input
                        type="text"
                        value={editingCols[selectedColIndex].label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingCols((prev) =>
                            prev.map((c, i) =>
                              i === selectedColIndex ? { ...c, label: val } : c
                            )
                          );
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tipe Kolom (Dropdown):
                      </label>
                      <select
                        value={
                          editingCols[selectedColIndex].type === "editable_collab_cumulative"
                            ? "editable_collab_cumulative"
                            : editingCols[selectedColIndex].type === "editable_cumulative"
                            ? "editable_cumulative"
                            : (editingCols[selectedColIndex].is_collab_numeric && editingCols[selectedColIndex].is_cumulative)
                            ? "editable_collab_cumulative"
                            : (editingCols[selectedColIndex].is_cumulative && editingCols[selectedColIndex].type === "editable")
                            ? "editable_cumulative"
                            : editingCols[selectedColIndex].type
                        }
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setEditingCols((prev) =>
                            prev.map((c, i) => {
                              if (i !== selectedColIndex) return c;
                              if (val === "editable_cumulative") {
                                return { ...c, type: val, is_cumulative: true, is_collab_numeric: false };
                              } else if (val === "editable_collab_cumulative") {
                                return { ...c, type: val, is_cumulative: true, is_collab_numeric: true };
                              } else if (val === "editable") {
                                return { ...c, type: val, is_cumulative: false, is_collab_numeric: false };
                              } else {
                                return { ...c, type: val, is_cumulative: false, is_collab_numeric: false };
                              }
                            })
                          );
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none shadow-sm"
                      >
                        <option value="editable">Editable (Biasa / Input Mandiri)</option>
                        <option value="editable_cumulative">Editable dengan akumulasi input ditambah bulan sebelumnya</option>
                        <option value="editable_collab_cumulative">Editable dengan akumulasi nilai input katim dan bulan sebelumnya</option>
                        <option value="formula">Formula (Rumus Otomatis)</option>
                        <option value="readonly">Readonly (Terkunci / Header)</option>
                      </select>
                    </div>
                  </div>

                  {/* FORMULA INPUT: JIKA TIPE FORMULA, PIC BISA EDIT RUMUSNYA */}
                  {editingCols[selectedColIndex].type === "formula" && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white font-mono text-xs font-bold">
                          fx
                        </span>
                        <label className="text-xs font-bold text-purple-950">
                          Rumus / Formula Kolom (Bisa Diedit):
                        </label>
                      </div>
                      <input
                        type="text"
                        value={editingCols[selectedColIndex].formula || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingCols((prev) =>
                            prev.map((c, i) =>
                              i === selectedColIndex ? { ...c, formula: val } : c
                            )
                          );
                        }}
                        placeholder="Contoh: =C+D atau =(E/B)*100 atau =SUM(C2:D2)"
                        className="w-full font-mono text-xs font-bold rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-purple-950 focus:border-purple-600 focus:outline-none shadow-sm"
                      />
                      <p className="text-[11px] text-purple-800 leading-relaxed">
                        Tulis rumus menggunakan huruf kolom seperti di Excel (contoh: <code>=C+D</code> atau <code>=(E/B)*100</code>). Sistem otomatis menghitung nilainya untuk setiap baris bulan secara instan.
                      </p>
                    </div>
                  )}

                  {/* PIC DROPDOWN: JIKA TIPE EDITABLE */}
                  {(editingCols[selectedColIndex].type === "editable" || editingCols[selectedColIndex].type === "editable_cumulative" || editingCols[selectedColIndex].type === "editable_collab_cumulative") && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Pilih Katim Pengampu (Dropdown):
                        </label>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const cur = editingCols[selectedColIndex].allowed_katim_ids || [];
                            if (val === "ALL") {
                              setEditingCols((prev) =>
                                prev.map((c, i) =>
                                  i === selectedColIndex ? { ...c, allowed_katim_ids: [] } : c
                                )
                              );
                            } else if (!cur.includes(val)) {
                              setEditingCols((prev) =>
                                prev.map((c, i) =>
                                  i === selectedColIndex
                                    ? { ...c, allowed_katim_ids: [...cur, val] }
                                    : c
                                )
                              );
                            }
                            e.target.value = "";
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:bg-white focus:outline-none"
                        >
                          <option value="" disabled>+ Pilih Katim untuk Ditugaskan...</option>
                          <option value="ALL">-- Terbuka Untuk Semua Katim di IKSK Ini --</option>
                          {katims.map((k) => (
                            <option key={k.user_id} value={k.user_id}>
                              {k.name} ({k.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Badge Daftar Katim yang Ditugaskan */}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                          Daftar Katim yang Berhak Mengisi:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(editingCols[selectedColIndex].allowed_katim_ids || []).length === 0 ? (
                            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                              Semua Katim Berhak Mengisi (Universal)
                            </span>
                          ) : (
                            editingCols[selectedColIndex].allowed_katim_ids.map((uid) => {
                              const katim = katims.find((k) => k.user_id === uid);
                              return (
                                <span
                                  key={uid}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-[#005baa]"
                                >
                                  <Icon icon="solar:user-bold" width={12} />
                                  <span>{katim?.name || uid}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCols((prev) =>
                                        prev.map((c, i) =>
                                          i === selectedColIndex
                                            ? {
                                                ...c,
                                                allowed_katim_ids: (
                                                  c.allowed_katim_ids || []
                                                ).filter((id) => id !== uid),
                                              }
                                            : c
                                        )
                                      );
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-0.5"
                                  >
                                    <Icon icon="solar:close-circle-bold" width={14} />
                                  </button>
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Ringkasan Seluruh Kolom (Tabel Ringkas & Rapi) */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Ringkasan Seluruh Kolom di Tab Ini (Klik baris untuk berpindah):
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="py-1.5 px-3 w-16">Kolom</th>
                        <th className="py-1.5 px-3">Judul Kolom</th>
                        <th className="py-1.5 px-3 w-24">Tipe</th>
                        <th className="py-1.5 px-3">PIC / Formula</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editingCols.map((c, i) => {
                        const isSelected = i === selectedColIndex;
                        const katimNames = katims
                          .filter((k) => c.allowed_katim_ids?.includes(k.user_id))
                          .map((k) => k.name);

                        return (
                          <tr
                            key={c.key}
                            onClick={() => setSelectedColIndex(i)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? "bg-blue-50/70 font-semibold text-[#005baa]"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-1.5 px-3 font-mono font-bold">
                              [{c.col_letter}]
                            </td>
                            <td className="py-1.5 px-3 truncate max-w-xs">{c.label}</td>
                            <td className="py-1.5 px-3">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  c.type === "editable"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : c.type === "formula"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {c.type}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-[11px] truncate max-w-xs">
                              {c.type === "formula" ? (
                                <span className="font-mono text-purple-700 font-semibold">
                                  {c.formula || "-"}
                                </span>
                              ) : katimNames.length > 0 ? (
                                <span className="text-[#005baa] font-medium">
                                  {katimNames.join(", ")}
                                </span>
                              ) : c.type === "editable" ? (
                                <span className="text-slate-400 italic">Semua Katim</span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setColModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveColumns}
                disabled={savingCols}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-5 py-2 text-xs font-semibold text-white hover:bg-[#004b8d] disabled:opacity-50"
              >
                {savingCols && (
                  <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
                )}
                <span>{savingCols ? "Menyimpan..." : "Simpan Konfigurasi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Tahun Baru */}
      {addYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-[#005baa]">
                  <Icon icon="solar:calendar-add-bold" width={18} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Tambah Tahun Anggaran RHPK
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddYearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <form onSubmit={handleAddYear} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Tahun (Angka) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2099}
                  required
                  value={newYearNumber}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onChange={(e) => setNewYearNumber(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 2027"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#005baa] focus:bg-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Keterangan / Deskripsi
                </label>
                <input
                  type="text"
                  value={newYearDesc}
                  onChange={(e) => setNewYearDesc(e.target.value)}
                  placeholder="Contoh: Tahun Anggaran RHPK 2027"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-[#005baa] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddYearModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingYear || !newYearNumber}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-5 py-2 text-xs font-semibold text-white hover:bg-[#004b8d] disabled:opacity-50"
                >
                  {addingYear && (
                    <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
                  )}
                  <span>{addingYear ? "Menyimpan..." : "Simpan Tahun"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Duplikat Format RHPK dari Tahun Lalu */}
      {duplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="border-b border-amber-200 bg-amber-50/70 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <Icon icon="solar:copy-bold" width={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    Konfirmasi Duplikasi Format RHPK
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    Salin seluruh spreadsheet, tab, hak akses PIC, dan rumus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(false)}
                className="text-amber-800/60 hover:text-amber-950"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning Box */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 flex gap-3">
                <span className="shrink-0 text-amber-600 mt-0.5">
                  <Icon icon="solar:danger-triangle-bold" width={22} />
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 leading-snug">
                    Hak akses kolom Katim tahun lalu juga ikut tersalin, yakin?
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Sistem akan menduplikasi struktur dokumen, penamaan tab, tipe kolom, <strong>hak akses Katim per kolom (enkapsulasi)</strong>, dan seluruh <strong>rumus otomatis</strong> dari tahun asal.
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Isian bulan (Januari–Desember) pada tahun tujuan ({selectedYear}) akan diinisialisasi bersih sebagai formulir baru siap pakai.
                  </p>
                </div>
              </div>

              {/* Source & Target Year Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tahun Asal (Sumber):
                  </label>
                  <select
                    value={duplicateSourceYear}
                    onChange={(e) => setDuplicateSourceYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:bg-white focus:outline-none"
                  >
                    {years
                      .filter((y) => y.year_number !== selectedYear)
                      .map((y) => (
                        <option key={y.id} value={y.year_number}>
                          Tahun {y.year_number} {y.total_spreadsheets !== undefined ? `(${y.total_spreadsheets} Dokumen)` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tahun Tujuan (Target):
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`Tahun ${selectedYear} (Tahun Aktif)`}
                    className="w-full rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-bold text-[#005baa] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicateModalOpen(false)}
                  disabled={duplicating}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal (No)
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateYear}
                  disabled={duplicating || duplicateSourceYear === selectedYear}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {duplicating ? (
                    <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
                  ) : (
                    <Icon icon="solar:check-circle-bold" width={16} />
                  )}
                  <span>{duplicating ? "Menduplikasi..." : "Ya, Salin Hak Akses & Terapkan"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

