"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

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
  tabs: TabItem[];
};

type ColumnSchema = {
  key: string;
  col_letter: string;
  label: string;
  type: "readonly" | "editable" | "formula";
  formula: string | null;
  can_edit: boolean;
  is_collaborative?: boolean;
  is_kendala?: boolean;
  is_rtl?: boolean;
  parent_header?: string | null;
  sub_label?: string | null;
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

export function isKendalaCol(headerName?: string): boolean {
  const h = (headerName || "").toLowerCase();
  return h.includes("kendala");
}

export function isRtlCol(headerName?: string): boolean {
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

export function isCollaborativeCol(col: ColumnSchema): boolean {
  if (col.is_collaborative) return true;
  const label = (col.label || "").toLowerCase();
  if (isKendalaCol(label) || isRtlCol(label)) return true;
  const isNumericHeader =
    /(jumlah|target|persentase|%|realisasi|skor|nilai|rasio|bobot|anggaran|total|\ba[1-9]\b|\bb[1-9]?\b|\bc[1-9]?\b)/i.test(
      label
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

export function parseNotes(raw: unknown): NoteItem[] {
  const rawText = String(raw ?? "").trim();
  if (!rawText || rawText === "-" || rawText === "/") return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: NoteItem[] = [];

  lines.forEach((line, idx) => {
    // 1. Check (+ Name) or (Name) at end
    let match = line.match(
      /^(?:(\d+)[\.\)]\s*)?(.*?)(?:\s*\(\+?\s*([^\(\)]+)\))$/
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
      /^(?:(\d+)[\.\)]\s*)?(.*?)(?:\s*\+\s*([a-zA-Z\s\.,]+))$/
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

type CollabModalState = {
  isOpen: boolean;
  rowKey: number;
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

  const [years, setYears] = useState<YearItem[]>([{ id: 1, year_number: 2026 }]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [iksks, setIksks] = useState<IkskItem[]>([]);
  const [selectedIkskId, setSelectedIkskId] = useState<number | null>(
    paramIkskId ? Number(paramIkskId) : null
  );
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [selectedSpId, setSelectedSpId] = useState<number | null>(
    paramSpreadsheetId ? Number(paramSpreadsheetId) : null
  );
  const [selectedTabId, setSelectedTabId] = useState<number | null>(
    paramTabId ? Number(paramTabId) : null
  );
  const [activeTab, setActiveTab] = useState<ActiveTabDetail | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth() + 1
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
    Record<string, { month?: number; row_index?: number; key: string; value: any }>
  >({});

  // Pagination & Filter state untuk tabel dengan banyak baris (misal KIE Medsos)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  const [isPicUser, setIsPicUser] = useState(false);
  const [isCurrentMonthLocked, setIsCurrentMonthLocked] = useState(false);
  const [monthLocksMap, setMonthLocksMap] = useState<Record<number, boolean>>({});
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  // Jika user teridentifikasi sebagai PIC/Admin dan mengakses endpoint /siproval/katim/entry-data-rhpk,
  // alihkan secara halus ke endpoint resmi PIC: /siproval/admin/entry-data-rhpk
  useEffect(() => {
    if (isPicUser && pathname === "/siproval/katim/entry-data-rhpk") {
      const search = window.location.search || "";
      router.replace(`/siproval/admin/entry-data-rhpk${search}`);
    }
  }, [isPicUser, pathname, router]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setSelectedMonthFilter("all");
  }, [activeTab?.id]);

  const fetchData = async (
    targetYear = selectedYear,
    ikskId?: number | null,
    spId?: number | null,
    tId?: number | null
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

      const effectiveSpId =
        spId !== undefined && spId !== null
          ? spId
          : selectedSpId !== null
          ? selectedSpId
          : paramSpreadsheetId
          ? Number(paramSpreadsheetId)
          : null;
      const qSp = effectiveSpId ? `&spreadsheet_id=${effectiveSpId}` : "";

      const effectiveTabId =
        tId !== undefined && tId !== null
          ? tId
          : selectedTabId !== null
          ? selectedTabId
          : paramTabId
          ? Number(paramTabId)
          : null;
      const qTab = effectiveTabId ? `&tab_id=${effectiveTabId}` : "";

      const res = await api.get(
        `${baseUrl}/api/test-local-table${authQuery}${qYear}${qIksk}${qSp}${qTab}`
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
        setActiveTab(d.active_tab);
      } else {
        setSelectedTabId(null);
        setActiveTab(null);
      }
      setDirtyUpdates({});
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal memuat formulir tabel.");
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
      await api.post(`${baseUrl}/api/test-local-table/toggle-month-lock${authQuery}`, {
        month: currentMonth,
        year: selectedYear,
        is_unlocked: newUnlocked,
        note: newUnlocked
          ? `Bulan ${currentMonth} dibuka oleh PIC/Admin`
          : `Bulan ${currentMonth} dikunci oleh PIC/Admin`,
      });
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

  // Handle cell edit lokal
  const handleCellChange = (
    rowId: number,
    colKey: string,
    val: string | number,
    rowIdx?: number
  ) => {
    if (!activeTab) return;

    // Convert numeric if possible and not empty string
    const parsedVal =
      val === "" ? "" : isNaN(Number(val)) ? val : Number(val);

    // Update state activeTab lokal
    setActiveTab((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows_data: prev.rows_data.map((r, idx) => {
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
            return {
              ...r,
              cells: {
                ...r.cells,
                [colKey]: parsedVal,
              },
            };
          }
          return r;
        }),
      };
    });

    // Catat ke dirtyUpdates
    const updateKey = `${rowId}_${rowIdx ?? ""}_${colKey}`;
    setDirtyUpdates((prev) => ({
      ...prev,
      [updateKey]: {
        month: rowId,
        row_index: rowIdx ?? rowId,
        key: colKey,
        value: parsedVal,
      },
    }));
  };

  // Kirim data ke backend lokal (Simpan Massal)
  const handleSave = async () => {
    if (!activeTab) return;
    const updatesList = Object.values(dirtyUpdates);
    if (updatesList.length === 0) {
      setSuccessMsg("Tidak ada perubahan yang perlu disimpan.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        { updates: updatesList }
      );
      setSuccessMsg(res.data?.message || "Data berhasil disimpan.");
      setDirtyUpdates({});

      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev
        );
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  // Handlers untuk Modal Catatan Kolaboratif (Kendala / RTL PIC)
  const handleOpenCollabModal = (
    rowKey: number,
    col: ColumnSchema,
    currentVal: any,
    monthName: string,
    canEdit: boolean
  ) => {
    const parsed = parseNotes(currentVal);
    setCollabModal({
      isOpen: true,
      rowKey,
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

  const handleAddCollabNote = () => {
    if (!collabModal || !collabModal.newNoteText.trim()) return;
    const author = user?.name || user?.call_name || "PIC Katim";
    const newNote: NoteItem = {
      num: collabModal.notes.length + 1,
      text: collabModal.newNoteText.trim(),
      author,
    };
    setCollabModal({
      ...collabModal,
      notes: [...collabModal.notes, newNote],
      newNoteText: "",
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

  const handleApplyCollabModal = () => {
    if (!collabModal) return;
    const formatted = formatNotes(collabModal.notes);
    handleCellChange(collabModal.rowKey, collabModal.colKey, formatted);
    setCollabModal(null);
  };

  // Fitur simpan instan ke database dari modal
  const handleDirectSaveCollabModal = async () => {
    if (!collabModal || !activeTab) return;
    setSavingCollab(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formatted = formatNotes(collabModal.notes);
    try {
      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        {
          updates: [
            {
              month: collabModal.rowKey,
              row_index: collabModal.rowKey,
              key: collabModal.colKey,
              value: formatted,
            },
          ],
        }
      );
      setSuccessMsg(res.data?.message || "Catatan kendala/RTL berhasil disimpan!");
      handleCellChange(collabModal.rowKey, collabModal.colKey, formatted);
      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev
        );
      }
      setCollabModal(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menyimpan catatan.");
    } finally {
      setSavingCollab(false);
    }
  };

  const dirtyCount = Object.keys(dirtyUpdates).length;

  const getMonthNumberFromText = (text?: string | null): number | null => {
    if (!text) return null;
    const t = text.trim().toLowerCase();
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
    for (const [key, num] of Object.entries(map)) {
      if (t.includes(key)) return num;
    }
    return null;
  };

  // Pastikan tabel yang belum memiliki konfigurasi tetap menampilkan seluruh kolom
  const effectiveColumnsSchema = useMemo<ColumnSchema[]>(() => {
    if (activeTab?.columns_schema && activeTab.columns_schema.length > 0) {
      return activeTab.columns_schema.map((c) => ({
        ...c,
        parent_header: (c as any).parent_header || (c.label && c.label.includes(" - ") ? c.label.split(" - ")[0].trim() : null),
        sub_label: (c as any).sub_label || (c.label && c.label.includes(" - ") ? c.label.split(" - ").slice(1).join(" - ").trim() : c.label),
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
        currentGroup = {
          parent: parentName,
          cols: [col],
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [effectiveColumnsSchema]);

  // Deteksi kolom bulan jika ada
  const monthColKey = useMemo(() => {
    if (!activeTab?.columns_schema) return null;
    const col = activeTab.columns_schema.find(
      (c) => (c.label || "").toLowerCase().trim() === "bulan"
    );
    return col ? col.key : null;
  }, [activeTab?.columns_schema]);

  // Ekstrak daftar bulan yang ada di tab saat ini beserta jumlah barisnya
  const availableMonths = useMemo(() => {
    if (!activeTab?.rows_data || activeTab.rows_data.length === 0) return [];
    const monthsMap: Record<string, number> = {};

    activeTab.rows_data.forEach((r) => {
      let m = "";
      if (monthColKey && r.cells?.[monthColKey]) {
        m = String(r.cells[monthColKey]).trim();
      } else if (r.month_name && typeof r.month_name === "string" && r.month_name.trim()) {
        m = r.month_name.trim();
      } else if (r.cells?.col_2 && typeof r.cells.col_2 === "string") {
        const val = r.cells.col_2.trim();
        if (
          /(januari|februari|pebruari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)/i.test(
            val
          )
        ) {
          m = val;
        }
      }
      if (m) {
        const normalized = m.charAt(0).toUpperCase() + m.slice(1);
        monthsMap[normalized] = (monthsMap[normalized] || 0) + 1;
      }
    });

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

    const result: { name: string; count: number }[] = [];
    standardOrder.forEach((name) => {
      const matchKey = Object.keys(monthsMap).find(
        (k) =>
          k.toLowerCase() === name.toLowerCase() ||
          (name === "Februari" && k.toLowerCase() === "pebruari") ||
          (name === "November" && k.toLowerCase() === "nopember")
      );
      if (matchKey) {
        result.push({ name: matchKey, count: monthsMap[matchKey] });
      }
    });

    Object.keys(monthsMap).forEach((k) => {
      if (!result.some((item) => item.name.toLowerCase() === k.toLowerCase())) {
        result.push({ name: k, count: monthsMap[k] });
      }
    });

    return result;
  }, [activeTab?.rows_data, monthColKey]);

  // Filter baris berdasarkan Bulan dan Pencarian
  const filteredRows = useMemo(() => {
    if (!activeTab?.rows_data) return [];
    let rows = activeTab.rows_data;

    // Filter per Bulan
    if (selectedMonthFilter !== "all") {
      const filterLower = selectedMonthFilter.toLowerCase();
      rows = rows.filter((r) => {
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

    // Filter per Pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((r) => {
        if (r.cells) {
          const match = Object.values(r.cells).some(
            (val) =>
              val !== null &&
              val !== undefined &&
              String(val).toLowerCase().includes(q)
          );
          if (match) return true;
        }
        if (r.row_name && r.row_name.toLowerCase().includes(q)) return true;
        if (r.month_name && r.month_name.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return rows;
  }, [activeTab?.rows_data, selectedMonthFilter, searchQuery, monthColKey]);

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
                    Simpan Perubahan{" "}
                    {dirtyCount > 0 ? `(${dirtyCount})` : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600" />
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
                    <Icon icon="solar:file-spreadsheet-bold" width={16} className="text-emerald-600 shrink-0" />
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
                  onChange={(e) => handleSelectSpreadsheet(Number(e.target.value))}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:outline-none max-w-xs md:max-w-md truncate cursor-pointer shadow-2xs"
                >
                  {spreadsheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {spreadsheets.length} Dokumen
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div>
              Bulan Berjalan: <strong className="text-slate-800">{currentMonth} ({["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][currentMonth] || "Oktober"})</strong>
            </div>
            {isPicUser && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isCurrentMonthLocked
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  <Icon icon={isCurrentMonthLocked ? "solar:lock-bold" : "solar:lock-unlocked-bold"} width={12} />
                  {isCurrentMonthLocked ? "Terkunci untuk Katim" : "Terbuka untuk Katim"}
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
              Kolom dengan latar hijau adalah kolom yang dapat Anda isi. Kolom terkunci dilindungi sistem.
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
            {activeTab && (isPaginationNeeded || availableMonths.length > 0) && (
              <div className="border-b border-slate-200 bg-slate-50/70 p-4 space-y-3">
                {/* Row 1: Filter Bulan Pills jika terdapat lebih dari 1 bulan */}
                {availableMonths.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                      <Icon icon="solar:calendar-bold" width={14} className="text-emerald-600" />
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
                              ? "bg-emerald-600 text-white shadow-emerald-600/20"
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
                          {Math.min(safeCurrentPage * (pageSize || 1), totalRows)}
                        </span>{" "}
                        dari{" "}
                        <span className="font-bold text-slate-900">{totalRows}</span>{" "}
                        baris
                        {selectedMonthFilter !== "all" && (
                          <span className="ml-1 text-emerald-700 font-semibold">
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
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer"
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
            )}

            <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
                {headerGroups ? (
                  <>
                    <tr className="border-b border-slate-200">
                      {headerGroups.map((grp, gIdx) => {
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
                                rowSpan={2}
                                className={`py-3 px-3 font-bold text-left ${stickyStyle}`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    [{col.col_letter}]
                                  </span>
                                  {col.can_edit ? (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                      Editable
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
                                <div className="text-xs font-bold leading-tight">{col.label}</div>
                              </th>
                            );
                          });
                        }

                        const mColor = getMonthColor(grp.parent);
                        const grpMonthNum = getMonthNumberFromText(grp.parent);
                        const isGrpLocked = !isPicUser && grpMonthNum !== null && Boolean(monthLocksMap[grpMonthNum]);
                        return (
                          <th
                            key={`grp-${gIdx}-${grp.parent}`}
                            colSpan={grp.cols.length}
                            className={`py-2 px-3 font-bold border-b border-r border-slate-300 text-center text-xs tracking-wider uppercase ${mColor.header}`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`size-2 rounded-full inline-block ${mColor.dot}`} />
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
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {headerGroups.map((grp) => {
                        if (!grp.parent) return null;
                        const mColor = getMonthColor(grp.parent);
                        const grpMonthNum = getMonthNumberFromText(grp.parent);
                        const isGrpLocked = !isPicUser && grpMonthNum !== null && Boolean(monthLocksMap[grpMonthNum]);
                        return grp.cols.map((col) => {
                          const colMonthNum = grpMonthNum || getMonthNumberFromText(col.label);
                          const isColMonthLocked = !isPicUser && colMonthNum !== null && Boolean(monthLocksMap[colMonthNum]);
                          const isEditableForMe = col.can_edit && !isColMonthLocked;
                          const subTitle = col.sub_label || col.label;
                          return (
                            <th
                              key={col.key}
                              className={`py-2 px-3 font-semibold border-r border-slate-200 last:border-r-0 min-w-[125px] ${
                                isEditableForMe
                                  ? "bg-emerald-50/60 text-emerald-950"
                                  : mColor.sub
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-[10px] text-slate-400">
                                  [{col.col_letter}]
                                </span>
                                {isEditableForMe ? (
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                    Editable
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
                              <div className="text-[11px] leading-tight font-medium">{subTitle}</div>
                            </th>
                          );
                        });
                      })}
                    </tr>
                  </>
                ) : (
                  <tr>
                    {effectiveColumnsSchema.map((col) => {
                      const isEditableForMe = col.can_edit;
                      return (
                        <th
                          key={col.key}
                          className={`py-3 px-3.5 font-bold border-r border-slate-200 last:border-r-0 min-w-[130px] ${
                            isEditableForMe
                              ? "bg-emerald-50/60 text-emerald-950"
                              : "text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[10px] text-slate-400">
                              [{col.col_letter}]
                            </span>
                            {isEditableForMe ? (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                Editable
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
                          <div className="text-xs leading-tight">{col.label}</div>
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
                      colSpan={effectiveColumnsSchema.length || 1}
                      className="py-12 text-center text-xs text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Icon icon="solar:magnifer-linear" width={24} className="text-slate-400" />
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
                    const originalIdx =
                      row.row_index !== undefined
                        ? row.row_index
                        : isPaginationNeeded && pageSize > 0
                        ? (safeCurrentPage - 1) * pageSize + rIdx
                        : rIdx;
                    const rowKey =
                      row.month !== undefined && row.month !== null && row.month !== 0
                        ? row.month
                        : row.row_index !== undefined
                        ? row.row_index
                        : originalIdx;
                    const rowIdxNum =
                      row.row_index !== undefined ? row.row_index : originalIdx;
                  const isMonthRow = !((row as any).is_month_row === false || (row.month !== undefined && row.month === 0));
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
                      "%Capaian"
                    ].includes(row.cells?.col_1);
                  const isQuestionRow =
                    (row as any).row_type === "question" ||
                    (typeof row.cells?.col_1 === "string" && row.cells.col_1.startsWith("- "));
                  const isTotalRow = Boolean(
                    row.is_total ||
                    row.row_name === "Total" ||
                    row.cells?.col_0 === "Total" ||
                    (typeof row.cells?.col_0 === "string" && row.cells.col_0.toLowerCase() === "total") ||
                    isFormulaRow
                  );

                  const numLeftCols =
                    headerGroups && !headerGroups[0]?.parent
                      ? headerGroups[0].cols.length
                      : 1;
                  const hasMultiLeftCols = Boolean(
                    headerGroups && !headerGroups[0]?.parent && numLeftCols > 1
                  );

                  return (
                    <tr
                      key={rowKey}
                      className={`transition ${
                        isSectionRow
                          ? "bg-slate-100 font-bold border-y border-slate-300 text-slate-900"
                          : isFormulaRow
                          ? "bg-emerald-50/70 font-bold border-y border-emerald-300 text-slate-900 hover:bg-emerald-100/60"
                          : isTotalRow
                          ? "bg-emerald-50/70 font-bold border-t-2 border-emerald-300 text-slate-900 hover:bg-emerald-100/60"
                          : isCurrent
                          ? "bg-blue-50/20 font-medium"
                          : isMonthLocked
                          ? "bg-slate-50/40"
                          : !canEditThisRow
                          ? "bg-slate-50/20 opacity-80"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {effectiveColumnsSchema.map((col, cIdx) => {
                        const val = row.cells?.[col.key] ?? "";
                        const colMonthNum = getMonthNumberFromText(col.parent_header) || getMonthNumberFromText(col.label);
                        const isColMonthLocked = !isPicUser && colMonthNum !== null && Boolean(monthLocksMap[colMonthNum]);
                        const canEditCell =
                          col.can_edit &&
                          !isMonthLocked &&
                          !isColMonthLocked &&
                          canEditThisRow &&
                          !isTotalRow &&
                          !isFormulaRow &&
                          !isSectionRow;
                        const isNum = typeof val === "number";
                        const isCollab = isCollaborativeCol(col);

                        let stickyTdClass = "";
                        if (hasMultiLeftCols) {
                          if (cIdx === 0) {
                            stickyTdClass = `sticky left-0 z-10 w-[55px] min-w-[55px] max-w-[55px] text-center border-r border-slate-200 ${
                              isSectionRow
                                ? "bg-slate-200 font-black text-slate-900"
                                : isFormulaRow
                                ? "bg-emerald-100 text-emerald-950 font-bold"
                                : isQuestionRow
                                ? "bg-blue-50/80 font-bold text-blue-900"
                                : "bg-white font-medium text-slate-700"
                            }`;
                          } else if (cIdx === 1) {
                            stickyTdClass = `sticky left-[55px] z-10 min-w-[240px] max-w-[280px] shadow-r border-r border-slate-200 ${
                              isSectionRow
                                ? "bg-slate-100 font-black text-slate-900"
                                : isFormulaRow
                                ? "bg-emerald-50 text-emerald-950 font-bold"
                                : isQuestionRow
                                ? "bg-blue-50/40 font-semibold text-blue-950"
                                : "bg-white font-semibold text-slate-900"
                            }`;
                          }
                        } else if (cIdx === 0 && Boolean(headerGroups)) {
                          stickyTdClass = `sticky left-0 z-10 min-w-[130px] shadow-r border-r border-slate-200 ${
                            isTotalRow
                              ? "bg-emerald-100 text-emerald-950 font-bold"
                              : "bg-white text-slate-900 font-bold"
                          }`;
                        }

                        // Untuk baris section header (cIdx >= 2 tampil kosong)
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

                        // Render khusus untuk kolom Catatan Kolaboratif (Kendala / Rencana Tindak Lanjut)
                        if (isCollab) {
                          const notes = parseNotes(val);
                          const rowMonthName =
                            row.month_name || `Bulan ${rowKey}`;

                          return (
                            <td
                              key={col.key}
                              className={`p-2 border-r border-slate-100 last:border-r-0 min-w-[240px] max-w-[340px] align-top ${
                                canEditCell ? "bg-emerald-50/15" : "bg-slate-50/20"
                              }`}
                            >
                              <div
                                onClick={() =>
                                  handleOpenCollabModal(
                                    Number(rowKey),
                                    col,
                                    val,
                                    rowMonthName,
                                    canEditCell
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
                                    {canEditCell ? "Kelola Catatan" : "Lihat"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Kolom standar editable (input angka/teks)
                        if (canEditCell) {
                          return (
                            <td
                              key={col.key}
                              className={`p-1 border-r border-slate-100 last:border-r-0 ${
                                isQuestionRow ? "bg-blue-50/25" : "bg-emerald-50/20"
                              }`}
                            >
                              <input
                                type="text"
                                inputMode="decimal"
                                value={val}
                                onChange={(e) =>
                                  handleCellChange(
                                    Number(rowKey),
                                    col.key,
                                    e.target.value,
                                    rowIdxNum
                                  )
                                }
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                placeholder="0"
                                className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  isQuestionRow
                                    ? "border border-blue-300 bg-white text-blue-950 focus:border-blue-600 focus:ring-blue-600 font-semibold text-right"
                                    : "border border-slate-200 bg-white text-slate-900 focus:border-emerald-600 focus:ring-emerald-600 font-medium"
                                }`}
                              />
                            </td>
                          );
                        }

                        const isBulanCol =
                          col.label?.toLowerCase() === "bulan" ||
                          col.label?.toLowerCase().includes("bulan");
                        const showLockedBadge =
                          isMonthLocked &&
                          isMonthRow &&
                          (isBulanCol ||
                            (!effectiveColumnsSchema.some((c) =>
                              c.label?.toLowerCase().includes("bulan")
                            ) &&
                              col.key === "col_0"));

                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3.5 border-r border-slate-100 last:border-r-0 text-xs ${stickyTdClass} ${
                              isNum
                                ? "text-right font-mono"
                                : "text-left text-slate-700"
                            } ${
                              isFormulaRow
                                ? "bg-emerald-50/50 text-emerald-950 font-bold"
                                : isQuestionRow && col.type === "formula"
                                ? "bg-blue-50/20 text-blue-900 font-semibold"
                                : isTotalRow
                                ? "bg-emerald-50/50 text-emerald-950 font-bold"
                                : col.type === "formula"
                                ? "bg-purple-50/20 text-purple-900 font-semibold"
                                : "text-slate-600"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{val !== "" ? String(val) : "-"}</span>
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
                }))}
              </tbody>
            </table>
          </div>

          {/* Catatan Dokumen (khususnya untuk Caput RO) */}
          {(activeTab?.id === 70 || activeTab?.title?.toLowerCase().includes("caput ro")) && (
            <div className="m-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 shadow-2xs">
              <Icon icon="solar:info-circle-bold" className="size-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold text-blue-950">Catatan Dokumen:</strong> Data Realisasi RO Sampel Obat, OBA, SK dan Kos dihitung dari data Realisasi Sampling tiap bulannya.
              </div>
            </div>
          )}

          {/* Legend untuk Indeks KIE */}
          {(activeTab?.id === 135 || activeTab?.title?.toLowerCase().includes("indeks kie")) && (
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
                    (Dihitung Otomatis: Indeks Tatap Muka, Indeks Media, Total Responden, Indeks Rata-rata, %Capaian)
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
                  dari <span className="font-bold text-slate-900">{totalRows}</span>{" "}
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
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer"
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
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(Number(p))}
                          className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition shadow-2xs ${
                            safeCurrentPage === Number(p)
                              ? "bg-emerald-600 text-white shadow-emerald-600/20"
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
                  yang ditambahkan akan otomatis diberi nomor urut dan penanda nama
                  PIC{" "}
                  <code className="bg-white/90 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800">
                    + {user?.name || "Nama Anda"}
                  </code>{" "}
                  di akhir kalimat. Penambahan oleh PIC lain akan melanjutkan nomor
                  berikutnya secara aman tanpa menghapus catatan sebelumnya.
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
                              .includes(note.author.toLowerCase()))
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

                              {!collabModal.isLocked &&
                                (isCurrentUserAuthor ||
                                  user?.role?.level === "superadmin") && (
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
                                      onClick={() =>
                                        handleDeleteCollabNote(nIdx)
                                      }
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
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Tambah Catatan Baru (Nomor #{collabModal.notes.length + 1})
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
                    placeholder="Tuliskan rincian kendala atau rencana tindak lanjut baru di sini..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!collabModal.newNoteText.trim()}
                      onClick={handleAddCollabNote}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Icon icon="solar:add-circle-bold" width={16} />
                      + Tambah Catatan (+ {user?.name || "PIC"})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                  Kolom atau bulan ini sedang dalam status terkunci, hanya dapat
                  melihat catatan terdaftar.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <div className="text-xs text-slate-600">
                Total Catatan: <strong>{collabModal.notes.length}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCollabModal(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Tutup
                </button>
                {!collabModal.isLocked && (
                  <>
                    <button
                      type="button"
                      onClick={handleApplyCollabModal}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                      title="Terapkan perubahan ke tabel sebelum disimpan secara massal"
                    >
                      <Icon icon="solar:check-read-linear" width={15} />
                      Terapkan ke Tabel
                    </button>
                    <button
                      type="button"
                      disabled={savingCollab}
                      onClick={handleDirectSaveCollabModal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                      title="Simpan langsung ke database sekarang"
                    >
                      {savingCollab ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:diskette-bold" width={15} />
                          <span>Simpan Langsung ke Database</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
