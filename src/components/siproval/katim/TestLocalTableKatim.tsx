"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
};

type RowData = {
  row_index?: number;
  month?: number;
  month_name?: string;
  is_locked: boolean;
  is_current: boolean;
  can_edit_row?: boolean;
  pic_name?: string;
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

  // Pagination state untuk tabel dengan banyak baris (misal KIE Medsos)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [isPicUser, setIsPicUser] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
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

  // Pastikan tabel yang belum memiliki konfigurasi tetap menampilkan seluruh kolom
  const effectiveColumnsSchema = useMemo<ColumnSchema[]>(() => {
    if (activeTab?.columns_schema && activeTab.columns_schema.length > 0) {
      return activeTab.columns_schema.map((c) => ({
        ...c,
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

  const allRows = activeTab?.rows_data || [];
  const totalRows = allRows.length;
  const isPaginationNeeded = totalRows > 25;
  const effectivePageSize = pageSize === 0 ? totalRows : pageSize;
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalRows / effectivePageSize) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages || 1);

  const paginatedRows = useMemo(() => {
    if (!isPaginationNeeded || pageSize === 0) return allRows;
    const start = (safeCurrentPage - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, isPaginationNeeded, safeCurrentPage, pageSize]);

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

          <div className="text-xs text-slate-500">
            Bulan Berjalan: <strong className="text-slate-800">{currentMonth} (Oktober)</strong>
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
            <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50">
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
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((row, rIdx) => {
                  const originalIdx =
                    isPaginationNeeded && pageSize > 0
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
                  const isMonthLocked = row.is_locked;
                  const isCurrent = row.is_current;
                  const canEditThisRow = row.can_edit_row !== false;

                  return (
                    <tr
                      key={rowKey}
                      className={`transition ${
                        isCurrent
                          ? "bg-blue-50/20 font-medium"
                          : isMonthLocked
                          ? "bg-slate-50/40"
                          : !canEditThisRow
                          ? "bg-slate-50/20 opacity-80"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {effectiveColumnsSchema.map((col) => {
                        const val = row.cells?.[col.key] ?? "";
                        const canEditCell =
                          col.can_edit && !isMonthLocked && canEditThisRow;
                        const isNum = typeof val === "number";
                        const isCollab = isCollaborativeCol(col);

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
                              className="p-1 border-r border-slate-100 last:border-r-0 bg-emerald-50/20"
                            >
                              <input
                                type={isNum ? "number" : "text"}
                                value={val}
                                onChange={(e) =>
                                  handleCellChange(
                                    Number(rowKey),
                                    col.key,
                                    e.target.value,
                                    rowIdxNum
                                  )
                                }
                                placeholder="0"
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                              />
                            </td>
                          );
                        }

                        const isBulanCol =
                          col.label?.toLowerCase() === "bulan" ||
                          col.label?.toLowerCase().includes("bulan");
                        const showLockedBadge =
                          isMonthLocked &&
                          (isBulanCol ||
                            (!effectiveColumnsSchema.some((c) =>
                              c.label?.toLowerCase().includes("bulan")
                            ) &&
                              col.key === "col_0"));

                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3.5 border-r border-slate-100 last:border-r-0 text-xs ${
                              isNum
                                ? "text-right font-mono"
                                : "text-left text-slate-700"
                            } ${
                              col.type === "formula"
                                ? "bg-purple-50/20 text-purple-900 font-semibold"
                                : "text-slate-500"
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
                })}
              </tbody>
            </table>
          </div>

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
