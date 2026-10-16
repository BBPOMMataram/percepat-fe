"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

function columnNumberToLetter(colNum: number): string {
  let temp = colNum;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

function columnLetterToNumber(letter: string): number {
  let result = 0;
  const upper = letter.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    result = result * 26 + (upper.charCodeAt(i) - 64);
  }
  return result;
}

type IkskOption = {
  id: number;
  name: string;
};

type SpreadsheetOption = {
  id: number;
  name: string;
  spreadsheet_id: string;
  iksk_id?: number;
};

type TabOption = {
  id: number;
  title: string;
  header_row?: number;
  data_start_row?: number;
  data_end_row?: number;
};

type SheetRow = {
  row_number: number;
  values: string[];
};

type ColumnPermission = {
  column: string;
  type: string;
  is_editable: boolean;
  is_formula: boolean;
  is_collaborative?: boolean;
  user_count?: number;
  user_names?: string[];
  header_name?: string;
  has_access: boolean;
};

type NoteItem = {
  num: number;
  text: string;
  author: string;
};

type CollabModalState = {
  isOpen: boolean;
  cellCoord: string;
  colLetter: string;
  rowNumber: number;
  monthName: string;
  headerName: string;
  assignedUsers: string[];
  isLocked: boolean;
  notes: NoteItem[];
  newNoteText: string;
  editingIndex: number | null;
  editingText: string;
};

function parseNotes(raw: unknown): NoteItem[] {
  const rawText = String(raw ?? "").trim();
  if (!rawText || rawText === "-" || rawText === "/") {
    return [];
  }
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: NoteItem[] = [];
  lines.forEach((line, idx) => {
    const match = line.match(/^(?:(\d+)[\.\)]\s*)?(.*?)(?:\s*\(([^\(\)]+)\))?$/);
    if (match) {
      const body = (match[2] || "").trim();
      const author = (match[3] || "").trim();
      if (body) {
        result.push({
          num: match[1] ? parseInt(match[1], 10) : idx + 1,
          text: body,
          author: author,
        });
      }
    } else if (line) {
      result.push({
        num: idx + 1,
        text: line,
        author: "",
      });
    }
  });
  return result;
}

function formatNotes(notes: NoteItem[]): string {
  return notes
    .map((n, idx) => {
      const authorPart = n.author ? ` (${n.author})` : "";
      return `${idx + 1}. ${n.text}${authorPart}`;
    })
    .join("\n");
}

type RowMeta = {
  row_number: number;
  month_index: number | null;
  month_name: string | null;
  is_locked: boolean;
  status: "locked" | "current" | "future" | "open" | "unlocked_by_admin";
};

export default function GoogleSheetKatim() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();

  const paramIkskId = searchParams.get("iksk_id") || searchParams.get("iksk");
  const paramSpreadsheetId = searchParams.get("spreadsheet") || searchParams.get("spreadsheet_id");
  const paramTabId = searchParams.get("tab") || searchParams.get("tab_id");

  const [iksks, setIksks] = useState<IkskOption[]>([]);
  const [selectedIksk, setSelectedIksk] = useState<number | null>(
    paramIkskId ? Number(paramIkskId) : null
  );

  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetOption[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<number | null>(
    paramSpreadsheetId ? Number(paramSpreadsheetId) : null
  );

  const [tabs, setTabs] = useState<TabOption[]>([]);
  const [selectedTab, setSelectedTab] = useState<number | null>(
    paramTabId ? Number(paramTabId) : null
  );

  const [headerRows, setHeaderRows] = useState<string[][]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);

  const [columnPermissions, setColumnPermissions] = useState<Record<string, ColumnPermission>>({});
  const [rowMetadata, setRowMetadata] = useState<Record<number, RowMeta>>({});
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);

  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [collabModal, setCollabModal] = useState<CollabModalState | null>(null);
  const [savingCollab, setSavingCollab] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingTabs, setSyncingTabs] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState("");
  const [focusMyColumns, setFocusMyColumns] = useState<boolean>(true);

  const fetchSheetData = async (
    ikskId?: number | null,
    spreadsheetId?: number | null,
    tabId?: number | null
  ) => {
    setLoading(true);
    setErrorMsg("");
    setApiNotice("");
    try {
      const queryParams = new URLSearchParams();
      if (user?.id) queryParams.set("user_id", String(user.id));
      if (ikskId) queryParams.set("iksk_id", String(ikskId));
      if (spreadsheetId) queryParams.set("spreadsheet", String(spreadsheetId));
      if (tabId) queryParams.set("tab", String(tabId));

      const res = await api.get(
        `${baseUrl}/api/katim/test-google-sheet?${queryParams.toString()}`
      );
      const data = res.data;
      const payload = data.data || data;

      // 1. IKSK list
      const ikskList: IkskOption[] = payload.iksks || [];
      setIksks(ikskList);
      const chosenIksk = payload.selectedIksk || payload.selectedIkskId;
      const chosenIkskId = typeof chosenIksk === "object" ? chosenIksk?.id : chosenIksk;
      if (chosenIkskId) {
        setSelectedIksk(Number(chosenIkskId));
      } else if (ikskList.length > 0 && !ikskId) {
        setSelectedIksk(ikskList[0].id);
      }

      // 2. Spreadsheets
      const spList: SpreadsheetOption[] = payload.spreadsheets || [];
      setSpreadsheets(spList);
      const chosenSp = payload.selectedSpreadsheet || payload.spreadsheet;
      if (chosenSp) {
        setSelectedSpreadsheet(chosenSp.id);
      } else if (spList.length > 0 && !spreadsheetId) {
        setSelectedSpreadsheet(spList[0].id);
      }

      // 3. Tabs
      const tabList: TabOption[] = payload.tabs || [];
      setTabs(tabList);
      const chosenTab = payload.targetTab || payload.tab;
      if (chosenTab) {
        setSelectedTab(chosenTab.id);
      } else if (tabList.length > 0 && !tabId) {
        setSelectedTab(tabList[0].id);
      }

      // 4. Permission & Row Metadata
      if (payload.columnPermissions) {
        setColumnPermissions(payload.columnPermissions);
      } else {
        setColumnPermissions({});
      }

      if (payload.rowMetadata) {
        setRowMetadata(payload.rowMetadata);
      } else {
        setRowMetadata({});
      }

      if (payload.current_month) {
        setCurrentMonth(payload.current_month);
      }

      const err = payload.googleSheetError;
      if (err) setApiNotice(err);

      // 5. Header Values & Rows
      const headers = payload.headerValues;
      if (Array.isArray(headers) && headers.length > 0) {
        setHeaderRows([headers]);
      } else {
        setHeaderRows([]);
      }

      const vals = payload.values;
      const rowData = payload.row_data;
      const dataStartRow = Number(chosenTab?.data_start_row || 2);

      if (Array.isArray(rowData) && rowData.length > 0) {
        setRows(
          rowData.map((item: { row_number: number; values: unknown[] }) => ({
            row_number: Number(item.row_number),
            values: Array.isArray(item.values) ? item.values.map((cell) => String(cell ?? "")) : [],
          }))
        );
      } else if (Array.isArray(vals) && vals.length > 0) {
        setRows(
          vals.map((v: unknown[], idx: number) => ({
            row_number: dataStartRow + idx,
            values: Array.isArray(v) ? v.map((cell) => String(cell ?? "")) : [],
          }))
        );
      } else {
        setRows([]);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal memuat data Google Sheet dari backend."
      );
      setRows([]);
      setHeaderRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const initialIksk = paramIkskId ? Number(paramIkskId) : null;
      const initialSpreadsheet = paramSpreadsheetId ? Number(paramSpreadsheetId) : null;
      const initialTab = paramTabId ? Number(paramTabId) : null;

      if (initialIksk) setSelectedIksk(initialIksk);
      if (initialSpreadsheet) setSelectedSpreadsheet(initialSpreadsheet);
      if (initialTab) setSelectedTab(initialTab);

      fetchSheetData(initialIksk, initialSpreadsheet, initialTab);
    }
  }, [user?.id, paramIkskId, paramSpreadsheetId, paramTabId]);

  const handleIkskChange = (newIkskId: number) => {
    setSelectedIksk(newIkskId);
    setSelectedTab(null);
    setEditedCells({});
    // Temukan spreadsheet yang cocok dengan IKSK ini (via iksk_id atau angka depan nama)
    const matchedSp = spreadsheets.find(
      (s) =>
        s.iksk_id === newIkskId ||
        s.name.trim().startsWith(`${newIkskId}.`) ||
        s.name.trim().startsWith(`${newIkskId} `)
    );
    const targetSpId = matchedSp ? matchedSp.id : null;
    if (targetSpId) {
      setSelectedSpreadsheet(targetSpId);
    }
    fetchSheetData(newIkskId, targetSpId, null);
  };

  const handleSpreadsheetChange = (newSpId: number) => {
    setSelectedSpreadsheet(newSpId);
    setSelectedTab(null);
    setEditedCells({});
    // Temukan IKSK terkait dari spreadsheet yang dipilih
    const chosenSp = spreadsheets.find((s) => s.id === newSpId);
    let targetIkskId = chosenSp?.iksk_id;
    if (!targetIkskId && chosenSp?.name) {
      const matchNum = chosenSp.name.match(/^([0-9]+)/);
      if (matchNum) {
        targetIkskId = Number(matchNum[1]);
      }
    }
    if (targetIkskId) {
      setSelectedIksk(targetIkskId);
      fetchSheetData(targetIkskId, newSpId, null);
    } else {
      fetchSheetData(selectedIksk, newSpId, null);
    }
  };

  const handleTabChange = (newTabId: number) => {
    setSelectedTab(newTabId);
    setEditedCells({});
    fetchSheetData(selectedIksk, selectedSpreadsheet, newTabId);
  };

  const handleCellChange = (cellCoord: string, value: string) => {
    setEditedCells((prev) => ({
      ...prev,
      [cellCoord]: value,
    }));
  };

  const handleSyncTabs = async () => {
    if (!selectedSpreadsheet) return;
    setSyncingTabs(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await api.post(`${baseUrl}/api/katim/test-google-sheet/sync-tabs`, {
        google_spreadsheet_id: selectedSpreadsheet,
      });
      setSuccessMsg(res.data?.message || "Tab spreadsheet berhasil disinkronkan ulang!");
      fetchSheetData(selectedIksk, selectedSpreadsheet, selectedTab);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal menyinkronkan tab Google Sheet.");
    } finally {
      setSyncingTabs(false);
    }
  };

  const handleOpenCollabModal = (
    cellCoord: string,
    colLetter: string,
    rowNumber: number,
    currentVal: string,
    colPerm?: ColumnPermission,
    rowMeta?: RowMeta
  ) => {
    const isRowLocked = rowMeta?.is_locked ?? false;
    const isColEditable = colPerm?.is_editable ?? false;
    const isColFormula = colPerm?.is_formula ?? false;
    const canEdit = !isRowLocked && isColEditable && !isColFormula;

    const parsed = parseNotes(currentVal);

    setCollabModal({
      isOpen: true,
      cellCoord,
      colLetter,
      rowNumber,
      monthName: rowMeta?.month_name || `Baris ${rowNumber}`,
      headerName: colPerm?.header_name || `Kolom ${colLetter}`,
      assignedUsers: colPerm?.user_names || [],
      isLocked: !canEdit,
      notes: parsed,
      newNoteText: "",
      editingIndex: null,
      editingText: "",
    });
  };

  const handleAddCollabNote = () => {
    if (!collabModal || !collabModal.newNoteText.trim()) return;
    const author = user?.name || "Katim";
    const newNote: NoteItem = {
      num: collabModal.notes.length + 1,
      text: collabModal.newNoteText.trim(),
      author,
    };
    const updatedNotes = [...collabModal.notes, newNote];
    setCollabModal({
      ...collabModal,
      notes: updatedNotes,
      newNoteText: "",
    });
  };

  const handleDeleteCollabNote = (index: number) => {
    if (!collabModal) return;
    const updatedNotes = collabModal.notes
      .filter((_, idx) => idx !== index)
      .map((n, idx) => ({ ...n, num: idx + 1 }));
    setCollabModal({
      ...collabModal,
      notes: updatedNotes,
      editingIndex: null,
    });
  };

  const handleSaveEditedCollabNote = (index: number) => {
    if (!collabModal || !collabModal.editingText.trim()) return;
    const updatedNotes = [...collabModal.notes];
    updatedNotes[index] = {
      ...updatedNotes[index],
      text: collabModal.editingText.trim(),
    };
    setCollabModal({
      ...collabModal,
      notes: updatedNotes,
      editingIndex: null,
      editingText: "",
    });
  };

  const handleApplyCollabModal = () => {
    if (!collabModal) return;
    const formatted = formatNotes(collabModal.notes);
    handleCellChange(collabModal.cellCoord, formatted);
    setCollabModal(null);
  };

  const handleDirectSaveCollabModal = async () => {
    if (!collabModal || !selectedSpreadsheet || !selectedTab) return;
    setSavingCollab(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formatted = formatNotes(collabModal.notes);
    const currentTabObj = tabs.find((t) => t.id === selectedTab);

    // Dapatkan nilai awal cell dari rows
    const cIdx = columnLetterToNumber(collabModal.colLetter) - 1;
    const foundRow = rows.find((r) => r.row_number === collabModal.rowNumber);
    const existingVal = foundRow && foundRow.values[cIdx] !== undefined ? foundRow.values[cIdx] : "";

    try {
      const res = await api.post(`${baseUrl}/api/katim/test-google-sheet/update`, {
        user_id: user?.id,
        spreadsheet: selectedSpreadsheet,
        tab: currentTabObj?.title || "",
        updates: [
          {
            cell: collabModal.cellCoord,
            value: formatted,
            existing_value: existingVal,
          },
        ],
      });

      setSuccessMsg(res.data?.message || "Catatan kendala/RTL berhasil disimpan ke Google Sheet!");
      handleCellChange(collabModal.cellCoord, formatted);
      setCollabModal(null);
      fetchSheetData(selectedIksk, selectedSpreadsheet, selectedTab);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal menyimpan catatan ke Google Sheet.");
    } finally {
      setSavingCollab(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateList = Object.entries(editedCells).map(([cell, value]) => {
      const match = cell.match(/^([A-Z]+)([0-9]+)$/);
      let existingVal = "";
      if (match) {
        const colL = match[1];
        const rowN = parseInt(match[2], 10);
        const cIdx = columnLetterToNumber(colL) - 1;
        const foundRow = rows.find((r) => r.row_number === rowN);
        if (foundRow && foundRow.values[cIdx] !== undefined) {
          existingVal = foundRow.values[cIdx];
        }
      }
      return {
        cell,
        value,
        existing_value: existingVal,
      };
    });

    if (updateList.length === 0) {
      setErrorMsg("Tidak ada sel yang diubah untuk disimpan.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const currentTabObj = tabs.find((t) => t.id === selectedTab);

    try {
      const res = await api.post(`${baseUrl}/api/katim/test-google-sheet/update`, {
        user_id: user?.id,
        spreadsheet: selectedSpreadsheet,
        tab: currentTabObj?.title || "",
        updates: updateList,
      });

      setSuccessMsg(
        res.data?.message ||
          `${updateList.length} sel berhasil disimpan ke Google Spreadsheet!`
      );
      setEditedCells({});
      fetchSheetData(selectedIksk, selectedSpreadsheet, selectedTab);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal menyimpan perubahan ke Google Sheet. Pastikan sel bukan pada bulan lampau atau formula."
      );
    } finally {
      setSaving(false);
    }
  };




  const handleDownloadExcel = async () => {
    if (!selectedSpreadsheet) {
      setErrorMsg("Pilih dokumen spreadsheet terlebih dahulu untuk mengunduh.");
      return;
    }
    setDownloading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const queryParams = new URLSearchParams();
      if (user?.id) queryParams.set("user_id", String(user.id));

      const downloadUrl = `${baseUrl}/api/katim/spreadsheet/${selectedSpreadsheet}/download?${queryParams.toString()}`;
      const res = await api.get(downloadUrl, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const currentSpObj = spreadsheets.find((s) => s.id === selectedSpreadsheet);
      const safeName = (currentSpObj?.name || "Spreadsheet_IKSK").replace(/[^a-zA-Z0-9_\-]/g, "_");
      link.setAttribute("download", `${safeName}.xlsx`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMsg("Spreadsheet berhasil diunduh dalam format Excel (.xlsx)!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal mengunduh spreadsheet dari Google Drive."
      );
    } finally {
      setDownloading(false);
    }
  };

  const pendingChanges = Object.keys(editedCells).length;


  const maxCols = useMemo(() => {
    let count = 0;
    headerRows.forEach((hr) => {
      if (hr.length > count) count = hr.length;
    });
    rows.forEach((r) => {
      if (r.values.length > count) count = r.values.length;
    });
    return Math.max(count, 8);
  }, [headerRows, rows]);

  // Filter kolom: Tampilkan identitas penting (Bulan, Indikator) dan tugas user (editable, formula, RTL/kendala)
  const isColVisible = useMemo(() => {
    return (cIdx: number): boolean => {
      if (!focusMyColumns) return true;

      const colLetter = columnNumberToLetter(cIdx + 1);
      const colPerm = columnPermissions[colLetter];

      // 1. Kolom tugas user: editable, formula, atau kolaboratif
      if (colPerm?.is_editable || colPerm?.is_formula || colPerm?.is_collaborative) {
        return true;
      }

      // 2. Kolom informasi penting: Nama/Kode Indikator dan Bulan
      const headerTexts = headerRows
        .map((hr) => (hr[cIdx] || "").toLowerCase().trim())
        .join(" ");
      const isMonthCol = headerTexts.includes("bulan");
      const isIndicatorCol = headerTexts.includes("indikator");

      if (isMonthCol || isIndicatorCol) {
        return true;
      }

      // Jika tab ini sama sekali tidak memiliki kolom editable/formula milik user (seluruh tab read-only)
      const hasAnyUserTask = Object.values(columnPermissions).some(
        (p) => p.is_editable || p.is_formula
      );
      if (!hasAnyUserTask) {
        return true;
      }

      return false;
    };
  }, [focusMyColumns, columnPermissions, headerRows]);

  const visibleColumnsCount = useMemo(() => {
    return Array.from({ length: maxCols }).filter((_, cIdx) => isColVisible(cIdx)).length;
  }, [maxCols, isColVisible]);

  // Nama bulan bahasa Indonesia
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonthName = monthNames[currentMonth - 1] || `Bulan ${currentMonth}`;
  const hasAnyEditableColumns = Object.values(columnPermissions).some((p) => p.is_editable);

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#005baa]">
              <Icon icon="solar:shield-user-bold" width={14} />
              PIC Katim: {user?.name || user?.email || "Ketua Tim"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Icon icon="solar:calendar-date-bold" width={14} />
              Bulan Berjalan: {currentMonthName}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Formulir Realisasi Capaian IKSK
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Pengisian data capaian indikator oleh Ketua Tim (Katim). Periode bulan lampau dikunci secara otomatis, sedangkan bulan berjalan dan mendatang dibuka untuk pengisian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={downloading || !selectedSpreadsheet}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            title="Download seluruh dokumen Google Spreadsheet dalam format Excel (.xlsx)"
          >
            <Icon
              icon={
                downloading
                  ? "solar:refresh-circle-linear"
                  : "solar:download-square-bold"
              }
              width={16}
              className={downloading ? "animate-spin text-emerald-600" : "text-emerald-700"}
            />
            {downloading ? "Mengunduh..." : "Download Excel (.xlsx)"}
          </button>

          <button
            type="button"
            onClick={handleSyncTabs}
            disabled={syncingTabs || !selectedSpreadsheet}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Icon
              icon={
                syncingTabs
                  ? "solar:refresh-circle-linear"
                  : "solar:refresh-line-duotone"
              }
              width={16}
              className={syncingTabs ? "animate-spin" : ""}
            />
            {syncingTabs ? "Sinkronisasi..." : "Sinkronkan Tab"}
          </button>


          <button
            type="button"
            onClick={handleSave}
            disabled={saving || pendingChanges === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              icon={saving ? "solar:refresh-circle-linear" : "solar:disk-bold"}
              width={16}
              className={saving ? "animate-spin" : ""}
            />
            {saving
              ? "Menyimpan..."
              : pendingChanges > 0
                ? `Simpan (${pendingChanges} Perubahan)`
                : "Simpan ke Google Sheet"}
          </button>
        </div>
      </div>

      {/* Status alerts */}
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
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-700">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {apiNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <Icon icon="solar:info-circle-bold" width={18} className="text-amber-600 shrink-0" />
          <span>{apiNotice}</span>
        </div>
      )}

      {/* Selectors Bar: IKSK -> Spreadsheet -> Tab */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        {/* IKSK Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>1. Pilihan IKSK Anda</span>
            <span className="text-[10px] font-normal text-slate-400">
              {iksks.length} IKSK Terhubung
            </span>
          </label>
          <select
            value={selectedIksk ?? ""}
            onChange={(e) => handleIkskChange(Number(e.target.value))}
            disabled={iksks.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            {iksks.length === 0 && (
              <option value="">Tidak ada IKSK terhubung</option>
            )}
            {iksks.map((i) => (
              <option key={i.id} value={i.id}>
                IKSK {i.id}: {i.name.length > 55 ? `${i.name.substring(0, 55)}...` : i.name}
              </option>
            ))}
          </select>
        </div>

        {/* Spreadsheet Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            2. Dokumen Spreadsheet
          </label>
          <select
            value={selectedSpreadsheet ?? ""}
            onChange={(e) => handleSpreadsheetChange(Number(e.target.value))}
            disabled={spreadsheets.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            {spreadsheets.length === 0 && (
              <option value="">Tidak ada spreadsheet</option>
            )}
            {spreadsheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            3. Tab Google Sheet
          </label>
          <select
            value={selectedTab ?? ""}
            onChange={(e) => handleTabChange(Number(e.target.value))}
            disabled={tabs.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            {tabs.length === 0 && (
              <option value="">Tidak ada tab tersedia</option>
            )}
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend & Policy Status Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-3 shadow-xs text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Icon icon="solar:shield-check-bold" width={18} className="text-[#005baa]" />
          <span>Aturan Hak Akses Pengisian:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-slate-600">
              <Icon icon="solar:lock-bold" width={12} />
            </span>
            <span className="font-medium text-slate-600">Bulan Lampau (Terkunci)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-100 text-sky-700">
              <Icon icon="solar:lock-unlocked-bold" width={12} />
            </span>
            <span className="font-medium text-sky-800">Dibuka Superadmin</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <Icon icon="solar:pen-bold" width={12} />
            </span>
            <span className="font-medium text-emerald-800">Bulan Ini & Mendatang</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
              fx
            </span>
            <span className="font-medium text-slate-600">Formula (Otomatis)</span>
          </div>
        </div>
      </div>




      {/* Spreadsheet Table Component */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <Icon icon="solar:table-bold" width={18} className="text-[#005baa]" />
            <h3 className="text-xs font-bold text-slate-800">
              Lembar Kerja Spreadsheet Aktif
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Fokus Kolom vs Semua Kolom */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFocusMyColumns(true)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                  focusMyColumns
                    ? "bg-white text-[#005baa] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tampilkan hanya kolom tugas pengisian Anda, formula indikator Anda, dan identitas Bulan/Indikator"
              >
                <Icon icon="solar:filter-bold" width={13} />
                <span>Fokus Kolom Tugas Saya ({visibleColumnsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFocusMyColumns(false)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                  !focusMyColumns
                    ? "bg-white text-[#005baa] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tampilkan seluruh kolom Google Spreadsheet (termasuk kolom tertutup)"
              >
                <Icon icon="solar:eye-bold" width={13} />
                <span>Semua Kolom ({maxCols})</span>
              </button>
            </div>

            {!loading && rows.length > 0 && !hasAnyEditableColumns && (
              <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">
                Mode Hanya Baca (Bukan Wewenang Anda)
              </span>
            )}

            {pendingChanges > 0 && (
              <span className="rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-700">
                ● {pendingChanges} Perubahan Sel
              </span>
            )}
          </div>
        </div>

        {!loading && rows.length > 0 && !hasAnyEditableColumns && (
          <div className="flex items-center gap-2.5 border-b border-amber-200 bg-amber-50/90 px-6 py-2.5 text-xs font-medium text-amber-800">
            <Icon icon="solar:info-circle-bold" width={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Mode Hanya Baca:</strong> Anda tidak memiliki wewenang pengisian pada tab ini (tab ini ditugaskan untuk Katim/PIC lain). Seluruh kolom ditampilkan hanya untuk dibaca.
            </span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat data dari Google Sheet...</p>
          </div>
        ) : rows.length === 0 && headerRows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Icon icon="solar:document-text-linear" width={32} className="mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Belum ada baris data pada tab Google Sheet ini</p>
            <p className="mt-1">Pastikan file kredensial Service Account terpasang di storage backend dan dokumen Google Sheet sudah dibagikan.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                {/* Column Letters with Permission Indicator */}
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="sticky left-0 z-20 w-16 min-w-16 border-r border-slate-200 bg-slate-200 py-2 text-center font-mono font-semibold">
                    Baris
                  </th>
                  {Array.from({ length: maxCols }).map((_, cIdx) => {
                    if (!isColVisible(cIdx)) return null;
                    const colLetter = columnNumberToLetter(cIdx + 1);
                    const colPerm = columnPermissions[colLetter];
                    const isEditableCol = colPerm?.is_editable;
                    const isFormulaCol = colPerm?.is_formula;

                    return (
                      <th
                        key={cIdx}
                        className={`min-w-36 border-r border-slate-200 px-3 py-2 text-center font-mono font-semibold ${
                          isEditableCol
                            ? "bg-blue-50/70 text-[#005baa]"
                            : isFormulaCol
                              ? "bg-amber-50/50 text-amber-800"
                              : "text-slate-600"
                        }`}
                        title={
                          isEditableCol
                            ? `Kolom ${colLetter}: Hak Akses Pengisian PIC`
                            : isFormulaCol
                              ? `Kolom ${colLetter}: Formula otomatis`
                              : `Kolom ${colLetter}`
                        }
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{colLetter}</span>
                          {isEditableCol && (
                            <Icon icon="solar:pen-linear" width={11} className="text-[#005baa]" />
                          )}
                          {isFormulaCol && (
                            <span className="rounded bg-amber-200/60 px-1 text-[9px] font-sans font-bold text-amber-900">
                              fx
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* Header Rows */}
                {headerRows.map((hRow, hIdx) => (
                  <tr
                    key={hIdx}
                    className="bg-[#d9edf4] font-bold text-slate-900 border-b border-slate-300"
                  >
                    <td className="sticky left-0 z-20 w-16 min-w-16 border-r border-slate-300 bg-[#c7e4ec] py-2 text-center font-mono text-slate-700">
                      H{hIdx + 1}
                    </td>
                    {Array.from({ length: maxCols }).map((_, cIdx) => {
                      if (!isColVisible(cIdx)) return null;
                      return (
                        <td
                          key={cIdx}
                          className="border-r border-slate-300 px-3 py-2 text-center text-[11px]"
                        >
                          {hRow[cIdx] || ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-slate-200">
                {rows.map((row) => {
                  const rowMeta = rowMetadata[row.row_number];
                  const isRowLocked = rowMeta?.is_locked ?? false;
                  const isCurrentRow = rowMeta?.status === "current";
                  const isUnlockedByAdmin = rowMeta?.status === "unlocked_by_admin";

                  return (
                    <tr
                      key={row.row_number}
                      className={`transition ${
                        isRowLocked
                          ? "bg-slate-50/80 hover:bg-slate-100/70"
                          : isUnlockedByAdmin
                            ? "bg-sky-50/30 hover:bg-sky-50/50"
                            : isCurrentRow
                              ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                              : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Sticky Row Number + Lock Indicator */}
                      <td
                        className={`sticky left-0 z-10 w-16 min-w-16 border-r border-slate-200 py-1.5 px-1 text-center font-mono text-[11px] font-medium ${
                          isRowLocked
                            ? "bg-slate-100 text-slate-400"
                            : isUnlockedByAdmin
                              ? "bg-sky-100 text-sky-900 font-bold"
                              : isCurrentRow
                                ? "bg-emerald-100 text-emerald-900 font-bold"
                                : "bg-slate-100 text-slate-600"
                        }`}
                        title={
                          isRowLocked
                            ? `Baris ${row.row_number}: ${rowMeta?.month_name || "Bulan lampau"} (Terkunci)`
                            : isUnlockedByAdmin
                              ? `Baris ${row.row_number}: ${rowMeta?.month_name || "Bulan lampau"} (Dibuka Akses oleh Superadmin)`
                              : isCurrentRow
                                ? `Baris ${row.row_number}: ${rowMeta?.month_name || "Bulan ini"} (Bulan Berjalan - Aktif)`
                                : `Baris ${row.row_number}`
                        }
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isRowLocked && (
                            <Icon icon="solar:lock-bold" width={11} className="text-slate-400" />
                          )}
                          {isUnlockedByAdmin && (
                            <Icon icon="solar:lock-unlocked-bold" width={11} className="text-sky-600" />
                          )}
                          {isCurrentRow && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          )}
                          <span>{row.row_number}</span>
                        </div>
                      </td>

                      {Array.from({ length: maxCols }).map((_, cIdx) => {
                        if (!isColVisible(cIdx)) return null;
                        const colLetter = columnNumberToLetter(cIdx + 1);
                        const cellCoord = `${colLetter}${row.row_number}`;
                        const rawVal =
                          editedCells[cellCoord] !== undefined
                            ? editedCells[cellCoord]
                            : row.values[cIdx] !== undefined && row.values[cIdx] !== null
                              ? row.values[cIdx]
                              : "";
                        const val = String(rawVal ?? "");
                        const valTrimmed = val.trim();
                        const isEdited = editedCells[cellCoord] !== undefined;

                        const colPerm = columnPermissions[colLetter];
                        const isColEditable = colPerm?.is_editable ?? false;
                        const isColFormula = colPerm?.is_formula ?? false;
                        const isCollaborative = Boolean(colPerm?.is_collaborative);
                        // Sel kolaboratif hanya berlaku untuk kolom teks narasi dan bukan sel berisi angka murni atau formula error
                        const isPureNumberOrFormula = valTrimmed !== "" && (!isNaN(Number(valTrimmed)) || valTrimmed.startsWith("#"));
                        const isCellCollaborative = isCollaborative && !isPureNumberOrFormula;

                        // ATURAN PENGUNCIAN:
                        // 1. Jika baris terkunci (bulan lampau) -> TIDAK BISA DIEDIT (read-only)
                        // 2. Jika kolom merupakan formula -> TIDAK BISA DIEDIT (read-only)
                        // 3. Hanya bisa diedit jika baris TIDAK TERKUNCI (bulan berjalan / mendatang) DAN kolom bertipe editable milik user
                        const canEditCell = !isRowLocked && isColEditable && !isColFormula;

                        return (
                          <td
                            key={cIdx}
                            className={`min-w-36 border-r border-slate-200 p-0 ${
                              isEdited
                                ? "bg-amber-100/70"
                                : isRowLocked
                                  ? "bg-slate-100/50"
                                  : isColFormula
                                    ? "bg-amber-50/20"
                                    : isCellCollaborative
                                      ? "bg-blue-50/15"
                                      : ""
                            }`}
                          >
                            {isCellCollaborative ? (
                              <div
                                className="group relative flex h-full min-h-[38px] w-full min-w-44 items-center justify-between px-2.5 py-1.5 transition hover:bg-blue-50/40 cursor-pointer"
                                onClick={() =>
                                  handleOpenCollabModal(
                                    cellCoord,
                                    colLetter,
                                    row.row_number,
                                    val,
                                    colPerm,
                                    rowMeta
                                  )
                                }
                                title={`Klik untuk melihat & mengedit catatan PIC (${colPerm?.header_name || "Kendala/RTL"})`}
                              >
                                <div className="flex-1 overflow-hidden pr-2">
                                  {valTrimmed !== "" && valTrimmed !== "-" && valTrimmed !== "/" ? (
                                    <div className="space-y-0.5">
                                      <div className="line-clamp-2 text-[11px] leading-tight text-slate-800 font-medium">
                                        {val}
                                      </div>
                                      <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                        <span className="font-bold text-[#005baa]">
                                          {parseNotes(val).length} Catatan PIC
                                        </span>
                                        <span>• Klik untuk kelola</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] italic text-slate-400 flex items-center gap-1">
                                      <Icon icon="solar:chat-round-line-linear" width={13} className="text-slate-300" />
                                      <span>{canEditCell ? "+ Tambah kendala / RTL" : "Kosong"}</span>
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  title={`Kelola Catatan PIC (${colPerm?.header_name || "Kendala/RTL"})`}
                                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 text-[#005baa] shadow-2xs hover:bg-[#005baa] hover:text-white transition"
                                >
                                  <Icon icon="solar:pen-new-square-bold" width={12} />
                                </button>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={val}
                                readOnly={!canEditCell}
                                disabled={!canEditCell}
                                onChange={(e) =>
                                  handleCellChange(cellCoord, e.target.value)
                                }
                                title={
                                  !canEditCell
                                    ? isRowLocked
                                      ? `Sel ${cellCoord}: Periode lampau (${rowMeta?.month_name || "Bulan lalu"}) telah dikunci.`
                                      : isColFormula
                                        ? `Sel ${cellCoord}: Kolom formula otomatis.`
                                        : `Sel ${cellCoord}: Bukan kolom pengisian Anda.`
                                    : `Sel ${cellCoord}: Buka untuk diedit`
                                }
                                className={`h-full w-full min-w-36 border-none px-3 py-2 text-xs outline-none transition ${
                                  !canEditCell
                                    ? "cursor-not-allowed bg-transparent text-slate-500 select-none"
                                    : "cursor-text bg-transparent text-slate-900 focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-[#005baa]"
                                } ${isEdited ? "font-bold text-amber-900" : ""}`}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Kelola Catatan Kolaboratif (Kendala & RTL PIC) */}
      {collabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#005baa] text-white">
                    <Icon icon="solar:chat-round-dots-bold" width={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Kelola Catatan PIC: {collabModal.headerName}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {collabModal.monthName} • Sel {collabModal.cellCoord} (Kolom {collabModal.colLetter}, Baris {collabModal.rowNumber})
                    </p>
                  </div>
                </div>

                {collabModal.assignedUsers.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">
                      PIC Berwenang:
                    </span>
                    {collabModal.assignedUsers.map((uName, uIdx) => (
                      <span
                        key={uIdx}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          user?.name && uName.toLowerCase().includes(user.name.toLowerCase())
                            ? "bg-blue-100 text-[#005baa]"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {uName}
                      </span>
                    ))}
                  </div>
                )}
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
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <Icon icon="solar:info-circle-bold" width={18} className="text-[#005baa] shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed text-[11px]">
                  <strong>Sistem Penanda Otomatis PIC:</strong> Setiap catatan yang ditambahkan akan otomatis diberi nomor urut dan penanda nama PIC <code className="bg-white/80 px-1 py-0.2 rounded font-mono font-semibold">(Nama Anda)</code> di akhir kalimat. Penambahan oleh PIC lain akan melanjutkan nomor berikutnya tanpa menghapus catatan sebelumnya.
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
                    <Icon icon="solar:document-text-linear" width={28} className="mx-auto mb-1.5 text-slate-300" />
                    Belum ada catatan pada periode bulan ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {collabModal.notes.map((note, nIdx) => {
                      const isCurrentUserAuthor =
                        user?.name &&
                        note.author &&
                        (note.author.toLowerCase().includes(user.name.toLowerCase()) ||
                          user.name.toLowerCase().includes(note.author.toLowerCase()));
                      const isEditingThis = collabModal.editingIndex === nIdx;

                      return (
                        <div
                          key={nIdx}
                          className={`rounded-xl border p-3.5 transition ${
                            isCurrentUserAuthor
                              ? "border-blue-200 bg-blue-50/30"
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
                                className="w-full rounded-lg border border-blue-300 p-2 text-xs text-slate-900 focus:border-[#005baa] focus:outline-none"
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
                                  onClick={() => handleSaveEditedCollabNote(nIdx)}
                                  className="rounded-lg bg-[#005baa] px-3 py-1 text-xs font-bold text-white hover:bg-[#004785]"
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
                                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#005baa]">
                                        <Icon icon="solar:user-bold" width={11} />
                                        Anda ({note.author || user?.name})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                        <Icon icon="solar:user-linear" width={11} />
                                        {note.author || "PIC"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {!collabModal.isLocked && (isCurrentUserAuthor || user?.role?.level === "superadmin") && (
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
                                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-[#005baa]"
                                  >
                                    <Icon icon="solar:pen-bold" width={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCollabNote(nIdx)}
                                    title="Hapus catatan ini"
                                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Icon icon="solar:trash-bin-trash-bold" width={14} />
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
                <div className="rounded-xl border border-blue-200 bg-blue-50/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Tambah Catatan Baru (Nomor #{collabModal.notes.length + 1})
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Disimpan atas nama: <strong className="text-slate-800">{user?.name || "Anda"}</strong>
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
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-[#005baa]"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!collabModal.newNoteText.trim()}
                      onClick={handleAddCollabNote}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#005baa] px-4 py-2 text-xs font-bold text-[#005baa] shadow-xs hover:bg-blue-50 transition disabled:opacity-40"
                    >
                      <Icon icon="solar:add-circle-bold" width={16} />
                      <span>Tambahkan ke Daftar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                  Periode ini terkunci. Anda hanya dapat melihat catatan yang ada.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4">
              <span className="text-[11px] text-slate-400">
                Total Catatan: <strong>{collabModal.notes.length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCollabModal(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>

                {!collabModal.isLocked && (
                  <>
                    <button
                      type="button"
                      onClick={handleApplyCollabModal}
                      className="rounded-xl border border-[#005baa] bg-white px-4 py-2 text-xs font-bold text-[#005baa] hover:bg-blue-50"
                    >
                      Terapkan ke Formulir
                    </button>

                    <button
                      type="button"
                      disabled={savingCollab}
                      onClick={handleDirectSaveCollabModal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#004785] disabled:opacity-50"
                    >
                      <Icon
                        icon={savingCollab ? "solar:refresh-circle-bold" : "solar:diskette-bold"}
                        width={16}
                        className={savingCollab ? "animate-spin" : ""}
                      />
                      <span>{savingCollab ? "Menyimpan..." : "Simpan Langsung ke Sheet"}</span>
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
