"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  rhpkApiService,
  fetchTableData as apiFetchTableData,
  toggleMonthLock as apiToggleMonthLock,
  updateTab as apiUpdateTab,
  getSpreadsheetExportUrl as apiGetSpreadsheetExportUrl,
  importTabExcel as apiImportTabExcel,
  uploadExcel as apiUploadExcel,
} from "./table/services/rhpkApiService";

export {
  rhpkApiService,
  apiFetchTableData,
  apiToggleMonthLock,
  apiUpdateTab,
  apiGetSpreadsheetExportUrl,
  apiImportTabExcel,
  apiUploadExcel,
};
import * as XLSX from "xlsx";

import {
  DEFAULT_BASE_URL as baseUrl,
  MAX_EXCEL_SIZE_MB,
  STANDARD_MONTH_NAMES,
  NUMERIC_HEADER_RE,
  NARRATIVE_HEADER_RE,
  getMonthColor,
} from "./table/constants/tableConstants";

export { STANDARD_MONTH_NAMES, getMonthColor, MAX_EXCEL_SIZE_MB };

import type {
  TabItem,
  SpreadsheetItem,
  ColumnSchema,
  RowData,
  ActiveTabDetail,
  YearItem,
  IkskItem,
  NoteItem,
  IncompleteValidationModal,
  CollabModalState,
  ConfirmDialogState,
  RowFormulaContext,
  TestLocalTableKatimProps,
  CollabNumModalState,
  HeaderGroup,
} from "./table/types/tableTypes";

import {
  ConfirmDialogModal,
  ValidationModal,
  CollabNumModal,
  CollabNotesModal,
  ExcelUploadModal,
  ExcelTabImportModal,
  TableAlerts,
  TableLegendNotes,
  TablePagination,
  TableBanner,
  TableSpreadsheetSelector,
  TableControlBar,
} from "./table/components";

export {
  ConfirmDialogModal,
  ValidationModal,
  CollabNumModal,
  CollabNotesModal,
  ExcelUploadModal,
  ExcelTabImportModal,
  TableAlerts,
  TableLegendNotes,
  TablePagination,
  TableBanner,
  TableSpreadsheetSelector,
  TableControlBar,
};

export type {
  TabItem,
  SpreadsheetItem,
  ColumnSchema,
  RowData,
  ActiveTabDetail,
  YearItem,
  IkskItem,
  NoteItem,
  IncompleteValidationModal,
  CollabModalState,
  ConfirmDialogState,
  RowFormulaContext,
  TestLocalTableKatimProps,
  CollabNumModalState,
  HeaderGroup,
};

import {
  isKendalaCol,
  isRtlCol,
  isCellContentFilled,
  getOwnColumnHeader,
  isCollaborativeCol,
  isSummaryOrTotalRow,
  isCumulativeCol,
  isHorizontalTable,
  isIksk1DetilPengujianTab,
} from "./table/utils/tableDetection";

import {
  parseNotes,
  formatNotes,
  getPageNumbers,
  resolveRowMonthName,
  getApiErrorMessage,
  getMonthNumberFromText,
  getRowExplicitMonth,
  formatDisplayCellValue,
} from "./table/utils/tableFormatting";

export {
  isKendalaCol,
  isRtlCol,
  isCellContentFilled,
  getOwnColumnHeader,
  isCollaborativeCol,
  isSummaryOrTotalRow,
  isCumulativeCol,
  isHorizontalTable,
  isIksk1DetilPengujianTab,
  parseNotes,
  formatNotes,
  getPageNumbers,
  resolveRowMonthName,
  getApiErrorMessage,
  getMonthNumberFromText,
  getRowExplicitMonth,
  formatDisplayCellValue,
};

import {
  recalculateCumulativeRows,
  recalculateIksk1DetilPengujianRows,
  cellNumber,
  resolveRowFormula,
  recalculateRowFormulas,
} from "./table/utils/formulaEngine";

export {
  recalculateCumulativeRows,
  recalculateIksk1DetilPengujianRows,
  cellNumber,
  resolveRowFormula,
  recalculateRowFormulas,
};

export default function TestLocalTableKatim({
  isKabalaiReadOnly = false,
  rekapBalaiOnly = false,
  headerRightSlot,
}: TestLocalTableKatimProps = {}) {
  const { user } = useSelector((state: RootState) => state.auth);
  const authQuery = user?.id ? `?user_id=${user.id}` : "";

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isRekapBalaiView = Boolean(
    rekapBalaiOnly || pathname?.startsWith("/siproval/katim/rekap-rhpk"),
  );
  const isKabalai = Boolean(
    isKabalaiReadOnly ||
    isRekapBalaiView ||
    user?.employee?.group_jabatan_id === 1 ||
    pathname?.startsWith("/siproval/kabalai") ||
    pathname?.startsWith("/siproval/rhpk/entry-data"),
  );
  // Lembar RHPK lihat-saja untuk Tata Usaha (/siproval/tu/rhpk)
  const isTuView = Boolean(pathname?.startsWith("/siproval/tu/rhpk"));
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
  const [assignedIkskIds, setAssignedIkskIds] = useState<number[]>([]);
  const [rekapBalaiIkskFilter, setRekapBalaiIkskFilter] = useState<
    "all" | "mine" | number
  >("all");
  const isCapaianRapkTab = useMemo(() => {
    const title = (activeTab?.title || "").toLowerCase();
    return title.includes("capaian rapk");
  }, [activeTab?.title]);

  const activeSpreadsheet = useMemo(() => {
    return spreadsheets.find((s) => s.id === selectedSpId) || null;
  }, [spreadsheets, selectedSpId]);

  const isIksk1DetilPengujian = useMemo(() => {
    return isIksk1DetilPengujianTab(activeTab?.title, activeSpreadsheet?.name);
  }, [activeTab?.title, activeSpreadsheet?.name]);
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
  const [focusSelectedIksk, setFocusSelectedIksk] = useState<boolean>(true);
  const [overrideIndicatorParent, setOverrideIndicatorParent] = useState<
    string | null
  >(null);

  // Modal Kolaborasi Angka Multi-Katim (Point 6)
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
  const [checkingUpload, setCheckingUpload] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadInfo, setUploadInfo] = useState<string>("");

  // Pop-up konfirmasi umum ("Apakah Anda yakin?") untuk setiap aksi yang mengubah data
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );

  // Jumlah baris versi server (tanpa baris baru yang belum disimpan) untuk deteksi konflik di backend
  const getBaseRowCount = (rows: RowData[] | undefined) =>
    (rows || []).filter((r) => !r.is_new_client_row).length;

  // Tampilkan pop-up jika tabel sudah diubah pengguna lain (HTTP 409 TAB_STALE)
  const handleStaleTabError = (err: any): boolean => {
    if (err?.response?.status !== 409) return false;
    setConfirmDialog({
      tone: "amber",
      icon: "solar:refresh-circle-bold",
      title: "Data Tabel Sudah Berubah",
      message:
        err.response?.data?.message ||
        "Data tabel ini telah diubah oleh pengguna lain sejak Anda membukanya.",
      note: "Perubahan Anda BELUM tersimpan. Muat ulang tabel untuk mengambil data terbaru, lalu ulangi perubahan Anda.",
      confirmLabel: "Muat Ulang Tabel",
      cancelLabel: "Tutup",
      onConfirm: () => {
        fetchData(selectedYear, selectedIkskId, selectedSpId, selectedTabId);
      },
    });
    return true;
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadError("");
    setUploadInfo("");
  };

  // Validasi file Excel di sisi browser sebelum dikirim ke server
  const validateExcelFile = (file: File | null): string | null => {
    if (!file) return "Silakan pilih file Excel terlebih dahulu.";
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      return `Format file ".${ext}" tidak didukung. Gunakan file Microsoft Excel (.xlsx / .xls).`;
    }
    if (file.size === 0) return "File yang dipilih kosong (0 KB).";
    if (file.size > MAX_EXCEL_SIZE_MB * 1024 * 1024) {
      return `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)} MB melebihi batas maksimal ${MAX_EXCEL_SIZE_MB} MB.`;
    }
    return null;
  };

  // Jalankan aksi hanya setelah user mengonfirmasi bahwa perubahan yang belum disimpan boleh dibuang
  const guardUnsavedChanges = (action: () => void, targetLabel: string) => {
    const pending = Object.keys(dirtyUpdates).length;
    if (pending === 0) {
      action();
      return;
    }
    setConfirmDialog({
      tone: "amber",
      icon: "solar:danger-triangle-bold",
      title: "Perubahan Belum Disimpan",
      message: `Anda memiliki ${pending} perubahan yang belum disimpan. Jika Anda berpindah ke ${targetLabel}, perubahan tersebut akan HILANG.`,
      note: 'Klik "Batal" lalu tekan tombol "Simpan Perubahan" jika ingin menyimpannya terlebih dahulu.',
      confirmLabel: "Ya, Buang Perubahan",
      onConfirm: action,
    });
  };

  // Peringatan browser saat menutup / memuat ulang halaman dengan perubahan yang belum disimpan
  useEffect(() => {
    if (Object.keys(dirtyUpdates).length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyUpdates]);

  // Notifikasi sukses otomatis hilang setelah beberapa detik
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 8000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Jika user teridentifikasi sebagai murni PIC/Admin (dan BUKAN Katim) yang mengakses endpoint /siproval/katim/entry-data-rhpk,
  // alihkan secara halus ke endpoint resmi PIC: /siproval/admin/entry-data-rhpk
  useEffect(() => {
    const isKatimUser =
      user?.employee?.group_jabatan_id === 3 ||
      (Array.isArray(user?.katims) && user.katims.length > 0);

    if (
      !isKatimUser &&
      !isKabalai &&
      isPicUser &&
      pathname === "/siproval/katim/entry-data-rhpk"
    ) {
      const search = window.location.search || "";
      router.replace(`/siproval/admin/entry-data-rhpk${search}`);
    }
  }, [isPicUser, isKabalai, pathname, router, user]);

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
      const effectiveIkskId = isRekapBalaiView
        ? null
        : ikskId !== undefined && ikskId !== null
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
      const effectiveSpId = isRekapBalaiView
        ? null
        : spId !== undefined
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
              : !isRekapBalaiView && paramTabId
                ? Number(paramTabId)
                : null;
      const qTab = effectiveTabId ? `&tab_id=${effectiveTabId}` : "";

      const res = await rhpkApiService.fetchTableData({
        year: targetYear,
        ikskId: effectiveIkskId,
        spreadsheetId: effectiveSpId,
        tabId: effectiveTabId,
        isRekapBalaiView,
        isKabalai,
        userId: user?.id,
        baseUrl,
      });
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
      if (Array.isArray(d.assigned_iksk_ids)) {
        setAssignedIkskIds(d.assigned_iksk_ids.map(Number));
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
        if (
          isIksk1DetilPengujianTab(
            d.active_tab?.title,
            d.active_spreadsheet?.name,
          )
        ) {
          rows = recalculateIksk1DetilPengujianRows(rows, cols);
        } else {
          rows = recalculateCumulativeRows(rows, cols);
          rows = rows.map((r: any) => ({
            ...r,
            cells: recalculateRowFormulas(r.cells || {}, cols, r),
          }));
        }
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
      const initialIksk = isRekapBalaiView
        ? null
        : paramIkskId
          ? Number(paramIkskId)
          : selectedIkskId;
      const initialSp = isRekapBalaiView
        ? null
        : paramSpreadsheetId
          ? Number(paramSpreadsheetId)
          : selectedSpId;
      const initialTab = isRekapBalaiView
        ? selectedTabId
        : paramTabId
          ? Number(paramTabId)
          : selectedTabId;
      fetchData(selectedYear, initialIksk, initialSp, initialTab);
    }
  }, [
    user?.id,
    selectedYear,
    paramIkskId,
    paramSpreadsheetId,
    paramTabId,
    isRekapBalaiView,
  ]);

  const handleToggleCurrentMonthLock = () => {
    const monthName =
      STANDARD_MONTH_NAMES[currentMonth - 1] || `Bulan ${currentMonth}`;
    const willUnlock = isCurrentMonthLocked;
    setConfirmDialog({
      tone: willUnlock ? "emerald" : "amber",
      icon: willUnlock ? "solar:lock-unlocked-bold" : "solar:lock-bold",
      title: "Apakah Anda yakin?",
      message: willUnlock
        ? `Buka kunci pengisian ${monthName} ${selectedYear} untuk seluruh Katim?`
        : `Kunci pengisian ${monthName} ${selectedYear} untuk seluruh Katim?`,
      note: willUnlock
        ? "Setelah dibuka, Katim dapat mengubah data bulan ini dan data akan terupdate."
        : "Setelah dikunci, Katim tidak dapat lagi mengubah data bulan ini (termasuk lewat Unggah Excel).",
      confirmLabel: willUnlock ? "Ya, Buka Kunci" : "Ya, Kunci",
      onConfirm: () => {
        executeToggleCurrentMonthLock();
      },
    });
  };

  const executeToggleCurrentMonthLock = async () => {
    setIsTogglingLock(true);
    setErrorMsg("");
    try {
      const newUnlocked = isCurrentMonthLocked;
      const lockRes = await rhpkApiService.toggleMonthLock({
        month: currentMonth,
        year: selectedYear,
        isUnlocked: newUnlocked,
        note: newUnlocked
          ? `Bulan ${currentMonth} dibuka oleh PIC/Admin`
          : `Bulan ${currentMonth} dikunci oleh PIC/Admin`,
        userId: user?.id,
        baseUrl,
      });
      setIsCurrentMonthLocked(!newUnlocked);
      await fetchData();
      setSuccessMsg(
        lockRes.data?.message || "Status kunci bulan berhasil diperbarui.",
      );
    } catch (err: unknown) {
      console.error("Gagal mengubah status kunci bulan", err);
      setErrorMsg(getApiErrorMessage(err, "Gagal mengubah status kunci bulan"));
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleSelectYear = (year: number) =>
    guardUnsavedChanges(() => doSelectYear(year), `Tahun ${year}`);

  const doSelectYear = (year: number) => {
    setSelectedYear(year);
    fetchData(year, selectedIkskId);
  };

  const handleSelectIksk = (ikskId: number) =>
    guardUnsavedChanges(() => doSelectIksk(ikskId), "IKSK lain");

  const doSelectIksk = (ikskId: number) => {
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

  const handleSelectSpreadsheet = (id: number) =>
    guardUnsavedChanges(() => doSelectSpreadsheet(id), "dokumen lain");

  const doSelectSpreadsheet = (id: number) => {
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

  const handleSelectTab = (tId: number) =>
    guardUnsavedChanges(() => doSelectTab(tId), "tab lain");

  const doSelectTab = (tId: number) => {
    setSelectedTabId(tId);

    if (typeof window !== "undefined" && !isRekapBalaiView) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab_id", String(tId));
      window.history.replaceState({}, "", url.toString());
    }

    if (selectedSpId || isRekapBalaiView) {
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

      if (isIksk1DetilPengujian && /^col_(?:[3-9]|[1-4]\d|50)$/.test(colKey)) {
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
            return {
              ...r,
              cells: {
                ...r.cells,
                [`${colKey}_input`]: parsedVal,
              },
            };
          }
          return r;
        });

        newRows = recalculateIksk1DetilPengujianRows(
          newRows,
          effectiveColumnsSchema,
        );

        return {
          ...prev,
          rows_data: newRows,
        };
      }

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
          if (isCum && !isHorizontalMonthTable) {
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
            r,
          );
          return {
            ...r,
            cells: updatedCells,
          };
        }
        return r;
      });

      if (isCum && !isHorizontalMonthTable) {
        newRows = recalculateCumulativeRows(
          newRows,
          effectiveColumnsSchema,
          false,
        );
        newRows = newRows.map((r) => ({
          ...r,
          cells: recalculateRowFormulas(r.cells, effectiveColumnsSchema, r),
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
    if (
      isCumulativeCol(col) &&
      !isHorizontalMonthTable &&
      rowIdxNum !== undefined
    ) {
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
          const rowStrings = rawJson[r].map((c) =>
            String(c || "")
              .trim()
              .toLowerCase(),
          );
          const hasMonth = rowStrings.some(
            (s) => s.includes("bulan") || s === "periode",
          );
          const hasIndicator = rowStrings.some(
            (s) =>
              s.includes("indikator") ||
              s.includes("target") ||
              s.includes("realisasi"),
          );
          const nextRowHasJan =
            r + 1 < rawJson.length &&
            rawJson[r + 1].some((c) => {
              const s = String(c || "")
                .trim()
                .toLowerCase();
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
          const nextRowVals = rawJson[dataStartRowIdx].map((c) =>
            String(c || "").trim(),
          );
          const hasMonthInNext = nextRowVals.some(
            (v) => getMonthNumberFromText(v) !== null,
          );
          const hasUnitInNext = nextRowVals.some(
            (v) => v.toLowerCase().includes("balai besar") || v === "14A",
          );
          if (!hasMonthInNext && !hasUnitInNext) {
            const subKeywords = [
              "target",
              "realisasi",
              "kendala",
              "rekomendasi",
              "satuan",
              "tw i",
              "tw ii",
              "tw iii",
              "tw iv",
              "% capaian",
              "persentase",
              "jumlah",
            ];
            const subCount = nextRowVals.filter((v) =>
              subKeywords.some((sk) => v.toLowerCase().includes(sk)),
            ).length;
            if (
              subCount >= 2 ||
              (subCount >= 1 && nextRowVals.filter(Boolean).length <= 4)
            ) {
              subHeaderRowIdx = dataStartRowIdx;
              dataStartRowIdx++;
            }
          }
        }

        const excelHeaders = rawJson[headerRowIdx].map((h) =>
          String(h || "").trim(),
        );
        const subHeaders =
          subHeaderRowIdx !== null
            ? rawJson[subHeaderRowIdx].map((h) => String(h || "").trim())
            : [];
        const combinedHeaders = excelHeaders.map((h, i) => {
          const sub = subHeaders[i] || "";
          if (sub && h && sub.toLowerCase() !== h.toLowerCase())
            return `${h} - ${sub}`;
          return sub || h;
        });

        // Filter baris data: abaikan baris kosong, baris metadata permission ('editable', 'admin', 'formula'),
        // baris nama Katim/pegawai di luar bulan, dan catatan kaki
        const isMetadataRow = (rowVals: any[]) => {
          const nonEmpties = rowVals
            .map((c) => String(c || "").trim())
            .filter(Boolean);
          if (nonEmpties.length === 0) return true;

          const permKeywords = [
            "editable",
            "formula",
            "readonly",
            "admin",
            "permision",
            "permission",
          ];
          const permCount = nonEmpties.filter((val) =>
            permKeywords.includes(val.toLowerCase()),
          ).length;
          if (permCount > 0 && permCount / nonEmpties.length >= 0.3) {
            return true;
          }

          const firstVal = (nonEmpties[0] || "").toLowerCase();
          if (
            firstVal.startsWith("note:") ||
            firstVal.startsWith("catatan:") ||
            firstVal.startsWith("keterangan:") ||
            firstVal.startsWith("link data:") ||
            firstVal === "dst"
          ) {
            return true;
          }

          const hasMonth = nonEmpties.some(
            (val) => getMonthNumberFromText(val) !== null,
          );
          const staffKeywords = [
            "hilmi",
            "basuki",
            "sukma",
            "rosita",
            "apri",
            "dian",
            "suriyati",
            "suriati",
            "dion",
            "mita",
            "winartutik",
            "nanang",
            "fatimah",
            "hardiono",
            "wibisono",
            "paramita",
          ];
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
          const rMonth = r
            .map((c) => getMonthNumberFromText(String(c)))
            .find((m) => m !== null);
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
            if (
              /permission|permision|hak\s*akses|role/i.test(col.label || "")
            ) {
              cells[col.key] = "";
              return;
            }

            // Pemetaan nilai kolom:
            // 1. Secara default, gunakan urutan posisi kolom asli (colIdx) yang 1-ke-1 dengan kolom Excel
            let val = rowVals[colIdx] ?? "";

            // 2. Jika ada kecocokan nama header LENGKAP yang spesifik (bukan kata generik seperti Target/Realisasi/Kendala/Rekomendasi):
            const isGenericWord = (w: string) =>
              /^(target|realisasi|kendala|rekomendasi|satuan|bulan|periode|no|no\.)$/i.test(
                w.trim(),
              );

            if (col.label && !isGenericWord(col.label)) {
              const fullMatchIdx = combinedHeaders.findIndex(
                (ch) => ch.toLowerCase() === col.label.toLowerCase(),
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
            (r, idx) => getRowMonthNumber(r, idx) !== targetNum,
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

      const res = await rhpkApiService.updateTab(
        activeTab.id,
        { rows_data: finalRows },
        user?.id,
        baseUrl,
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

    // Validasi kunci periode: jika bulan terkunci dan bukan PIC, tolak penambahan baris
    if (
      !isPicUser &&
      targetMonthNum >= 1 &&
      targetMonthNum <= 12 &&
      Boolean(monthLocksMap[targetMonthNum])
    ) {
      setConfirmDialog({
        tone: "rose",
        icon: "solar:lock-bold",
        title: "Periode Terkunci",
        message: `Pengisian dan penambahan data untuk periode ${targetMonthName} sedang dikunci oleh Administrator / Tim Kerja TU.`,
        note: "Anda tidak dapat menambah baris baru pada bulan yang telah dikunci. Hubungi Tim Kerja TU jika periode ini perlu dibuka kembali.",
        confirmLabel: "Mengerti",
        hideCancel: true,
        onConfirm: () => {},
      });
      return;
    }

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
    }

    if (monthColKey) {
      newCells[monthColKey] = targetMonthName;
    } else if (!noCol) {
      newCells.col_0 = targetMonthName;
    } else {
      newCells.col_2 = targetMonthName;
    }

    // Default UPT untuk tabel vertikal jika ada kolom UPT/Balai
    const uptCol = effectiveColumnsSchema.find((c) => {
      const l = (c.label || "").toLowerCase();
      return l === "upt" || l.includes("balai");
    });
    if (uptCol && !newCells[uptCol.key]) {
      newCells[uptCol.key] = "BBPOM di Mataram";
    }

    const isTargetLocked =
      !isPicUser &&
      targetMonthNum >= 1 &&
      targetMonthNum <= 12 &&
      Boolean(monthLocksMap[targetMonthNum]);

    const newRow: RowData = {
      row_index: 0,
      month: targetMonthNum,
      month_name: targetMonthName,
      is_month_row: true,
      is_locked: isTargetLocked,
      is_current: targetMonthNum === currentMonth,
      can_edit_row: !isTargetLocked,
      is_new_client_row: true,
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

    const updateColKey = monthColKey || (!noCol ? "col_0" : "col_2");
    const updateVal = targetMonthName;

    // Baris baru disisipkan di indeks 0 sehingga seluruh baris lain bergeser +1:
    // geser juga row_index perubahan yang belum disimpan agar tidak menimpa baris yang salah
    setDirtyUpdates((prev) => {
      const shifted: typeof prev = {};
      Object.values(prev).forEach((up) => {
        const ri = up.row_index !== undefined ? up.row_index + 1 : undefined;
        const k =
          ri !== undefined ? `row_${ri}_${up.key}` : `m_${up.month}_${up.key}`;
        shifted[k] = { ...up, row_index: ri };
      });
      shifted[`row_0_${updateColKey}`] = {
        month: targetMonthNum,
        row_index: 0,
        key: updateColKey,
        value: updateVal,
      };
      return shifted;
    });

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

    setConfirmDialog({
      tone: "rose",
      icon: "solar:trash-bin-trash-bold",
      title: "Apakah Anda yakin?",
      message: `Hapus "${rowLabel}" (Baris ke-${targetIdx + 1}) dari tabel "${activeTab.title}"?`,
      note: "Baris akan langsung dihapus dan data di database akan TERUPDATE. Tindakan ini tidak dapat dibatalkan.",
      confirmLabel: "Ya, Hapus Baris",
      onConfirm: () => {
        executeDeleteRow(targetIdx, String(rowLabel));
      },
    });
  };

  const executeDeleteRow = async (targetIdx: number, rowLabel: string) => {
    if (!activeTab || !activeTab.rows_data) return;

    // Filter baris yang dihapus
    const remainingRows = activeTab.rows_data.filter(
      (_, idx) => idx !== targetIdx,
    );

    // Tata ulang nomor urut dan row_index
    let updatedRows = remainingRows.map((r, idx) => ({
      ...r,
      row_index: idx,
    }));

    // Hitung ulang kolom kumulatif jika ada
    updatedRows = recalculateCumulativeRows(
      updatedRows,
      effectiveColumnsSchema,
    ) as any;

    // Hitung ulang rumus formula pada setiap baris
    updatedRows = updatedRows.map((r) => ({
      ...r,
      cells: recalculateRowFormulas(r.cells, effectiveColumnsSchema, r),
    }));

    // Update state tabel seketika
    setActiveTab((prev) => (prev ? { ...prev, rows_data: updatedRows } : prev));
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await rhpkApiService.updateTab(
        activeTab.id,
        {
          rows_data: updatedRows,
          base_row_count: getBaseRowCount(activeTab.rows_data),
        },
        user?.id,
        baseUrl,
      );
      setSuccessMsg(`Baris "${rowLabel}" berhasil dihapus dari tabel.`);
      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev,
        );
      }
    } catch (err: any) {
      console.error("Gagal menghapus baris:", err);
      setErrorMsg(
        getApiErrorMessage(err, "Gagal menghapus baris dari server") +
          " Tabel dimuat ulang dari server.",
      );
      // Pulihkan kembali data tabel asli dari server jika terjadi kendala
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  // Tombol "Simpan Perubahan": tampilkan pop-up konfirmasi terlebih dahulu
  const handleSave = () => {
    if (!activeTab) return;
    const updatesList = Object.values(dirtyUpdates);
    if (updatesList.length === 0) {
      setSuccessMsg("Tidak ada perubahan yang perlu disimpan.");
      return;
    }

    const colLabel = (key: string) =>
      effectiveColumnsSchema.find((c) => c.key === key)?.label || key;
    const rowLabel = (up: { month?: number; row_index?: number }) => {
      if (up.month && up.month >= 1 && up.month <= 12) {
        return STANDARD_MONTH_NAMES[up.month - 1];
      }
      if (up.row_index !== undefined) return `Baris ${up.row_index + 1}`;
      return "-";
    };
    const formatVal = (v: any) => {
      if (v === null || v === undefined || v === "") return "(kosong)";
      if (typeof v === "object") return "(diperbarui)";
      const str = String(v);
      return str.length > 40 ? `${str.slice(0, 40)}…` : str;
    };
    const details = updatesList
      .slice(0, 6)
      .map(
        (up) =>
          `${rowLabel(up)} • ${colLabel(up.key)} → ${formatVal(up.value)}`,
      );
    if (updatesList.length > 6) {
      details.push(`…dan ${updatesList.length - 6} perubahan lainnya`);
    }

    setConfirmDialog({
      tone: "emerald",
      icon: "solar:diskette-bold",
      title: "Apakah Anda yakin?",
      message: `Anda akan menyimpan ${updatesList.length} perubahan pada tab "${activeTab.title}".`,
      note: "Data di database akan TERUPDATE sesuai perubahan yang Anda buat.",
      details,
      confirmLabel: "Ya, Simpan",
      onConfirm: () => {
        executeSave();
      },
    });
  };

  // Kirim data ke backend lokal (Simpan Massal)
  const executeSave = async () => {
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
              const res = await rhpkApiService.updateTab(
                activeTab.id,
                {
                  updates: updatesList,
                  rows_data: activeTab.rows_data,
                  base_row_count: getBaseRowCount(activeTab.rows_data),
                },
                user?.id,
                baseUrl,
              );
              setDirtyUpdates({});
              if (res.data?.data?.rows_data) {
                setActiveTab((prev) =>
                  prev ? { ...prev, rows_data: res.data.data.rows_data } : prev,
                );
              }
            } catch (saveErr: any) {
              console.error("Gagal menyimpan data:", saveErr);
              setSaving(false);
              if (handleStaleTabError(saveErr)) return;
              setErrorMsg(
                getApiErrorMessage(
                  saveErr,
                  "Gagal menyimpan data. Perubahan Anda belum tersimpan",
                ),
              );
              return;
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
      const res = await rhpkApiService.updateTab(
        activeTab.id,
        {
          updates: updatesList,
          rows_data: activeTab.rows_data,
          base_row_count: getBaseRowCount(activeTab.rows_data),
        },
        user?.id,
        baseUrl,
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
      if (handleStaleTabError(err)) return;
      setErrorMsg(
        getApiErrorMessage(
          err,
          "Gagal menyimpan data. Perubahan Anda belum tersimpan, silakan coba lagi",
        ),
      );
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
    const exportUrl = rhpkApiService.getSpreadsheetExportUrl(
      activeSpreadsheet.id,
      mode,
      user?.id,
      baseUrl,
    );
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

      if (isCum && !isHorizontalMonthTable) {
        newRows = recalculateCumulativeRows(
          newRows,
          effectiveColumnsSchema,
          false,
        );
      }
      newRows = newRows.map((r) => ({
        ...r,
        cells: recalculateRowFormulas(r.cells, effectiveColumnsSchema, r),
      }));

      return { ...prev, rows_data: newRows };
    });

    try {
      const res = await rhpkApiService.updateTab(
        activeTab.id,
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
        user?.id,
        baseUrl,
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
        fetchData();
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
      const res = await rhpkApiService.updateTab(
        activeTab.id,
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
        user?.id,
        baseUrl,
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

  // Tombol "Simpan" pada modal Unggah Excel:
  // 1) validasi file, 2) pratinjau perubahan (dry-run) di server, 3) pop-up "Apakah Anda yakin?"
  const handleRequestUploadExcel = async () => {
    setUploadError("");
    setUploadInfo("");
    const fileErr = validateExcelFile(uploadFile);
    if (fileErr || !uploadFile) {
      setUploadError(fileErr || "Silakan pilih file Excel terlebih dahulu.");
      return;
    }

    const pending = Object.keys(dirtyUpdates).length;
    const unsavedWarning =
      pending > 0
        ? [
            `Anda memiliki ${pending} perubahan yang belum disimpan pada tabel. Perubahan tersebut akan digantikan oleh data dari file Excel.`,
          ]
        : [];

    if (uploadMode === "tab") {
      if (!activeTab) {
        setUploadError("Pilih tab tabel terlebih dahulu sebelum mengunggah.");
        return;
      }
      setCheckingUpload(true);
      try {
        const res = await rhpkApiService.importTabExcel({
          tabId: activeTab.id,
          file: uploadFile,
          dryRun: true,
          userId: user?.id,
          baseUrl,
        });
        const summary = res.data?.data?.summary || {};
        const updated: string[] = summary.updated_months || [];
        const added: string[] = summary.added_months || [];
        const unchanged: string[] = summary.unchanged_months || [];
        const locked: string[] = summary.locked_months || [];
        const isUpdateMode = summary.mode === "update";

        if (isUpdateMode && updated.length === 0 && added.length === 0) {
          setUploadInfo(
            locked.length > 0
              ? `Tidak ada data yang dapat diperbarui: ${locked.length} bulan yang berubah sedang DIKUNCI (${locked.join(", ")}). Hubungi PIC/Admin untuk membuka kunci bulan.`
              : "Data pada file Excel sama persis dengan data di sistem. Tidak ada perubahan yang perlu disimpan.",
          );
          return;
        }

        const details: string[] = [];
        if (summary.sheet_title) {
          details.push(`Sheet yang dibaca: "${summary.sheet_title}"`);
        }
        if (isUpdateMode) {
          if (updated.length > 0)
            details.push(
              `${updated.length} bulan akan DIPERBARUI: ${updated.join(", ")}`,
            );
          if (added.length > 0)
            details.push(
              `${added.length} bulan baru akan ditambahkan: ${added.join(", ")}`,
            );
          if (unchanged.length > 0)
            details.push(`${unchanged.length} bulan tidak berubah`);
          details.push(
            `Jumlah baris tabel setelah disimpan: ${summary.final_row_count} (sebelumnya ${summary.previous_row_count})`,
          );
        } else {
          details.push(
            `${summary.final_row_count} baris dari file akan menggantikan ${summary.previous_row_count} baris lama`,
          );
        }

        const warnings: string[] = [
          ...(summary.warnings || []),
          ...unsavedWarning,
        ];
        if (locked.length > 0) {
          warnings.push(
            `${locked.length} bulan dilewati karena DIKUNCI: ${locked.join(", ")}`,
          );
        }

        setConfirmDialog({
          tone: "amber",
          icon: "solar:upload-square-bold",
          title: "Apakah Anda yakin?",
          message: `Data pada tab "${activeTab.title}" akan diperbarui menggunakan file "${uploadFile.name}".`,
          note: "Data yang sudah ada akan TERUPDATE (ditimpa) sesuai isi file Excel — bukan ditambahkan sebagai baris baru. Sel kosong pada file tidak menghapus isian yang sudah ada.",
          details,
          warnings,
          confirmLabel: "Ya, Simpan & Perbarui",
          onConfirm: () => {
            handleUploadExcel();
          },
        });
      } catch (err: any) {
        setUploadError(
          getApiErrorMessage(err, "Gagal memeriksa isi file Excel"),
        );
      } finally {
        setCheckingUpload(false);
      }
      return;
    }

    // Lingkup Dokumen Penuh
    const spName =
      spreadsheets.find((s) => s.id === selectedSpId)?.name || "dokumen ini";
    setConfirmDialog({
      tone: "rose",
      icon: "solar:folder-with-files-bold",
      title: "Apakah Anda yakin?",
      message: `Seluruh sheet pada file "${uploadFile.name}" akan digunakan untuk memperbarui dokumen "${spName}" (Tahun ${selectedYear}).`,
      note: "Data SELURUH tab pada dokumen akan TERUPDATE sesuai isi file. Tab bulanan diperbarui per bulan, tab daftar/detil akan diganti, dan tab yang tidak ada di file akan dihapus.",
      details: [
        "Hak akses Katim dan formula otomatis tetap dipertahankan.",
        "Untuk Katim, bulan yang sedang dikunci tidak akan diperbarui.",
      ],
      warnings: unsavedWarning,
      confirmLabel: "Ya, Perbarui Dokumen",
      onConfirm: () => {
        handleUploadExcel();
      },
    });
  };

  // Handler Upload / Import File Excel (dijalankan setelah user mengonfirmasi)
  const handleUploadExcel = async () => {
    const fileErr = validateExcelFile(uploadFile);
    if (fileErr || !uploadFile) {
      setUploadError(fileErr || "Silakan pilih file Excel terlebih dahulu.");
      return;
    }
    setUploading(true);
    setUploadError("");
    setUploadInfo("");
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (uploadMode === "tab" && activeTab) {
        // Import khusus ke tab ini (UPDATE per bulan, bukan menambah baris)
        const res = await rhpkApiService.importTabExcel({
          tabId: activeTab.id,
          file: uploadFile,
          userId: user?.id,
          baseUrl,
        });
        setSuccessMsg(
          res.data?.message || "Data tab berhasil diperbarui dari file Excel!",
        );
        // Muat ulang tab dari server agar rumus & data kumulatif konsisten
        await fetchData(
          selectedYear,
          selectedIkskId,
          selectedSpId,
          activeTab.id,
        );
      } else {
        // Upload/Perbarui seluruh dokumen
        const res = await rhpkApiService.uploadExcel({
          file: uploadFile,
          year: selectedYear,
          userId: user?.id,
          baseUrl,
        });
        setSuccessMsg(
          res.data?.message || "Dokumen Excel berhasil diunggah dan terupdate!",
        );
        if (user?.id) {
          await fetchData(
            selectedYear,
            selectedIkskId,
            selectedSpId,
            selectedTabId,
          );
        }
      }
      closeUploadModal();
    } catch (err: any) {
      // Modal tetap terbuka agar user dapat melihat pesan error & mencoba lagi
      const msg = getApiErrorMessage(err, "Gagal mengunggah file Excel");
      setUploadError(msg);
      setErrorMsg(msg);
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
        .map((c) => {
          // Suatu kolom adalah identity column (tanpa parent header grup/bulan) HANYA jika:
          // 1. Kolom tidak memiliki parent_header eksplisit di database
          // 2. Berupa col_0 (kolom pertama) atau berlabel "kode unit", "nama unit", "komoditi", "bulan", "periode"
          // JANGAN memaksakan col_1 (B) atau col_2 (C) menjadi identity column jika ber-parent JANUARI atau memuat ' - '
          const labelTrimmed = (c.label || "").trim();
          const labelLower = labelTrimmed.toLowerCase();
          const rawParentHeader = (c as any).parent_header;

          const isIdentityCol =
            !rawParentHeader &&
            (c.key === "col_0" ||
              labelLower === "komoditi" ||
              labelLower === "bulan" ||
              labelLower === "periode" ||
              labelLower.startsWith("kode unit") ||
              labelLower.startsWith("nama unit") ||
              ((c.key === "col_1" || c.col_letter === "B") &&
                (labelLower === "upt" ||
                  labelLower.includes("nama balai") ||
                  labelLower.includes("sarana"))));

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
            : (c as any).parent_header || parsedParent;

          const subLabel = isIdentityCol
            ? c.label
            : (c as any).sub_label || parsedSub;

          const colWithParent: ColumnSchema = {
            ...c,
            parent_header: parentHeader,
            sub_label: subLabel,
          };

          return {
            ...colWithParent,
            is_collaborative: isCollaborativeCol(colWithParent),
            is_kendala: isKendalaCol(subLabel) || isKendalaCol(c.label),
            is_rtl: isRtlCol(subLabel) || isRtlCol(c.label),
          };
        });
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

    // 1. Jika tabel memiliki kolom mandiri 'Bulan' atau 'Periode', pasti tabel vertikal
    const hasBulanCol = effectiveColumnsSchema.some((c) => {
      const l = (c.label || "").trim().toLowerCase();
      const sub = ((c as any).sub_label || "").trim().toLowerCase();
      return (
        l === "bulan" ||
        l === "periode" ||
        l === "bulan pelaksanaan" ||
        l.startsWith("bulan ") ||
        sub === "bulan" ||
        sub === "periode"
      );
    });
    if (hasBulanCol) return false;

    // 2. Jika baris data terdefinisi untuk 12 bulan (month 1..12), pasti tabel vertikal
    const rows = activeTab?.rows_data || [];
    if (
      rows.length >= 6 &&
      rows.some((r) => r.month && r.month > 0 && r.month <= 12)
    ) {
      return false;
    }

    // 3. Periksa parent_header atau sub_parent (misal: JANUARI, FEBRUARI)
    const parentMonths = new Set<number>();
    effectiveColumnsSchema.forEach((col) => {
      if (col.parent_header) {
        const pm = getMonthNumberFromText(col.parent_header);
        if (pm !== null) parentMonths.add(pm);
      }
      if ((col as any).sub_parent) {
        const sm = getMonthNumberFromText((col as any).sub_parent);
        if (sm !== null) parentMonths.add(sm);
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
      (g) => g.parent && getMonthNumberFromText(g.parent) === null,
    );
    return nonMonthParents.length >= 3;
  }, [headerGroups, activeSpreadsheet]);

  const matchedIndicatorParent = useMemo(() => {
    if (!isMultiIndicatorSheet || !headerGroups) return null;
    if (overrideIndicatorParent) return overrideIndicatorParent;

    const currentIksk = iksks.find(
      (i) =>
        String(i.id) === String(selectedIkskId) ||
        Number(i.id) === Number(selectedIkskId),
    );
    const ikskText = (
      (currentIksk ? currentIksk.name : "") +
      " " +
      (activeSpreadsheet?.name || "")
    ).toLowerCase();

    const topics: { key: string; words: string[] }[] = [
      {
        key: "lab",
        words: ["laboratorium", "lab pengujian", "kemampuan laboratorium"],
      },
      { key: "klb", words: ["klb", "keracunan pangan"] },
      { key: "kie", words: ["kie", "komunikasi", "edukasi"] },
      {
        key: "kejahatan",
        words: ["kejahatan", "penyidikan", "analisis kejahatan"],
      },
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
      if (t.words.some((w) => ikskText.includes(w))) {
        matchedTopic = t.key;
        break;
      }
    }

    const nonMonthParents = headerGroups
      .map((g) => g.parent)
      .filter((p): p is string =>
        Boolean(p && getMonthNumberFromText(p) === null),
      );

    if (matchedTopic) {
      const tObj = topics.find((t) => t.key === matchedTopic);
      const found = nonMonthParents.find((p) => {
        const pLower = (p || "").toLowerCase();
        return tObj?.words?.some((w) => pLower.includes(w));
      });
      if (found) return found;
    }

    const words = ikskText
      .split(/\s+/)
      .filter((w) => w.length > 3 && !w.startsWith("iksk"));
    const found = nonMonthParents.find((p) => {
      const pLower = (p || "").toLowerCase();
      return words.some((w) => pLower.includes(w));
    });

    return found || nonMonthParents[0] || null;
  }, [
    isMultiIndicatorSheet,
    headerGroups,
    selectedIkskId,
    iksks,
    activeSpreadsheet,
    overrideIndicatorParent,
  ]);

  // Deteksi kolom bulan jika ada
  const monthColKey = useMemo(() => {
    if (!activeTab?.columns_schema) return null;
    const col = activeTab.columns_schema.find((c) => {
      const l = (c.label || "").toLowerCase().trim();
      return (
        l === "bulan" ||
        l === "periode" ||
        l === "tanggal" ||
        l === "waktu" ||
        l.includes("bulan") ||
        l.includes("periode") ||
        l.includes("tanggal") ||
        l.includes("waktu")
      );
    });
    return col ? col.key : null;
  }, [activeTab?.columns_schema]);

  // Mapping setiap baris ke nomor bulannya (1..12) dengan Forward-Fill (propagasi ke bawah)
  // sesuai aturan RHPK: baris tanpa tanggal/bulan eksplisit mewarisi bulan dari baris di atasnya
  // hingga ditemukan baris dengan bulan baru (next_month).
  const rowMonthMap = useMemo(() => {
    const rawRows = activeTab?.rows_data || [];
    const objMap = new WeakMap<RowData, number>();
    const idxMap = new Map<number, number>();

    // Pada tabel horizontal (bulan ada di header kolom), baris tidak terikat pada satu bulan
    if (isHorizontalMonthTable) {
      return { objMap, idxMap };
    }

    let currentMonth: number | null = null;

    rawRows.forEach((r, idx) => {
      if (!r) return;

      const explicit = getRowExplicitMonth(r, monthColKey);
      if (explicit !== null) {
        // Ditemukan bulan baru atau baris awal (next_month)
        currentMonth = explicit;
      }

      // Selama dalam rentang suatu bulan dan bukan baris total/summary akhir
      if (currentMonth !== null && !isSummaryOrTotalRow(r)) {
        objMap.set(r, currentMonth);
        idxMap.set(idx, currentMonth);
      }
    });

    return { objMap, idxMap };
  }, [activeTab?.rows_data, isHorizontalMonthTable, monthColKey]);

  // Ekstrak nomor bulan (1..12) dari sebuah baris data dengan prioritas hasil forward-fill
  const getRowMonthNumber = (r: RowData, idx?: number): number | null => {
    if (!r) return null;
    if (rowMonthMap.objMap.has(r)) {
      return rowMonthMap.objMap.get(r)!;
    }
    if (idx !== undefined && rowMonthMap.idxMap.has(idx)) {
      return rowMonthMap.idxMap.get(idx)!;
    }
    return getRowExplicitMonth(r, monthColKey);
  };

  // Ekstrak daftar bulan yang ada di tab saat ini beserta jumlah barisnya
  const availableMonths = useMemo(() => {
    const rawCount = (activeTab?.rows_data || []).filter(
      (r) => !(r as any).is_hidden && !(r as any).hidden,
    ).length;
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
          const sNum = getMonthNumberFromText((c as any).sub_parent);
          const lNum = getMonthNumberFromText(c.label);
          return pNum === targetNum || sNum === targetNum || lNum === targetNum;
        });
        if (hasMonthCol) {
          result.push({ name, count: rawCount });
        }
      });
      return result;
    }

    // Default: tabel vertikal (bulan berada di baris)
    const monthCounts: Record<number, number> = {};

    activeTab?.rows_data?.forEach((r, idx) => {
      const mNum = getRowMonthNumber(r, idx);
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
    rowMonthMap,
  ]);

  const getRowIkskNum = (row: RowData): number | null => {
    const raw = row.cells?.col_3;
    if (raw === null || raw === undefined) return null;
    const str = String(raw).trim();
    if (!str) return null;
    const parsed = Number(str);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  // Filter baris berdasarkan Bulan, IKSK (mode Rekap Balai), dan Pencarian
  const filteredRows = useMemo(() => {
    if (!activeTab?.rows_data) return [];
    let rows = activeTab.rows_data.filter(
      (r) => !(r as any).is_hidden && !(r as any).hidden,
    );

    if (
      isRekapBalaiView &&
      isCapaianRapkTab &&
      rekapBalaiIkskFilter !== "all"
    ) {
      rows = rows.filter((r) => {
        const rowIkskNum = getRowIkskNum(r);
        if (rekapBalaiIkskFilter === "mine") {
          return rowIkskNum !== null && assignedIkskIds.includes(rowIkskNum);
        }
        return rowIkskNum === rekapBalaiIkskFilter;
      });
    }

    // Filter per Bulan (hanya jika tabel vertikal, karena pada tabel horizontal baris merupakan komoditi/item)
    if (selectedMonthFilter !== "all" && !isHorizontalMonthTable) {
      const targetMonthNum = getMonthNumberFromText(selectedMonthFilter);
      if (targetMonthNum !== null) {
        rows = rows.filter((r, idx) => {
          return getRowMonthNumber(r, idx) === targetMonthNum;
        });
      }
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
    isRekapBalaiView,
    isCapaianRapkTab,
    rekapBalaiIkskFilter,
    assignedIkskIds,
  ]);

  // Header groups yang ditampilkan saat ini
  const displayedHeaderGroups = useMemo(() => {
    if (!headerGroups) return null;
    let groups = headerGroups;

    // Filter fokus IKSK jika dokumen multi-indikator
    if (isMultiIndicatorSheet && focusSelectedIksk && matchedIndicatorParent) {
      groups = groups.filter((grp) => {
        if (!grp.parent) {
          // Hanya loloskan grup kolom identity yang ada di effectiveColumnsSchema
          return grp.cols.some(
            (c) =>
              c.key === "col_0" ||
              c.key === "col_1" ||
              c.key === "col_2" ||
              c.col_letter === "A" ||
              c.col_letter === "B" ||
              c.col_letter === "C",
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
          // Kolom tetap sebelah kiri (No, Rekomendasi/sertifikasi, dsb)
          return grp;
        }
        const grpMonthNum = getMonthNumberFromText(grp.parent);
        if (grpMonthNum === targetMonthNum) {
          return grp;
        }
        // Jika parent berupa grup payung (misal: "Realisasi s.d bulan", "Target Bulanan..."), filter kolom di dalamnya
        const matchingCols = grp.cols.filter((col) => {
          const colMonth =
            getMonthNumberFromText(col.parent_header) ||
            getMonthNumberFromText((col as any).sub_parent) ||
            getMonthNumberFromText(col.label);
          return colMonth === targetMonthNum;
        });
        if (matchingCols.length > 0) {
          return { ...grp, cols: matchingCols };
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

  // Kolom yang ditampilkan saat ini (sinkron 100% dengan displayedHeaderGroups jika menggunakan grup header)
  const displayedColumnsSchema = useMemo<ColumnSchema[]>(() => {
    // Jika tabel memiliki grup header bertingkat, body sel HARUS 100% presisi mengikuti kolom header yang aktif
    if (displayedHeaderGroups && displayedHeaderGroups.length > 0) {
      return displayedHeaderGroups.flatMap((grp) => grp.cols);
    }

    let schema = effectiveColumnsSchema;

    // Filter fokus IKSK jika dokumen multi-indikator
    if (isMultiIndicatorSheet && focusSelectedIksk && matchedIndicatorParent) {
      schema = schema.filter((col) => {
        const isIdentity =
          col.key === "col_0" ||
          col.key === "col_1" ||
          col.key === "col_2" ||
          (!col.parent_header &&
            (col.col_letter === "A" ||
              col.col_letter === "B" ||
              col.col_letter === "C"));
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
      const isFixedLeft =
        col.key === "col_0" ||
        col.key === "col_1" ||
        col.key === "col_2" ||
        (!col.parent_header && getMonthNumberFromText(col.label) === null);
      const colMonthNum =
        getMonthNumberFromText(col.parent_header) ||
        getMonthNumberFromText((col as any).sub_parent) ||
        getMonthNumberFromText(col.label);
      return isFixedLeft || colMonthNum === targetMonthNum;
    });
  }, [
    displayedHeaderGroups,
    effectiveColumnsSchema,
    isHorizontalMonthTable,
    selectedMonthFilter,
    isMultiIndicatorSheet,
    focusSelectedIksk,
    matchedIndicatorParent,
  ]);

  // Deteksi jumlah dan style kolom sticky freeze kiri
  // Deteksi tab bertema cyan seperti KLB KP (sesuai template Excel asli)
  const isCyanHeader = useMemo(() => {
    const title = (activeTab?.title || "").toLowerCase();
    return title.includes("klb") || activeTab?.id === 90;
  }, [activeTab?.title, activeTab?.id]);

  // Deteksi tabel ber-header 3 tingkat (memiliki sub_parent rumus)
  const hasSubParents = useMemo(() => {
    return displayedColumnsSchema.some(
      (c) =>
        Boolean(c.sub_parent) || (c.label && c.label.split(" - ").length >= 3),
    );
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
    <div className="w-full min-w-0 space-y-5">
      {/* Banner Katim / Kabalai */}
      <TableBanner
        isRekapBalaiView={isRekapBalaiView}
        isKabalai={isKabalai}
        isTuView={isTuView}
        isPicUser={isPicUser}
        isPicEffective={isPicEffective}
        selectedYear={selectedYear}
        selectedSpId={selectedSpId}
        spreadsheets={spreadsheets}
        activeSpreadsheet={activeSpreadsheet}
        dirtyCount={dirtyCount}
        saving={saving}
        headerRightSlot={headerRightSlot}
        onOpenUploadModal={() => setShowUploadModal(true)}
        onSave={handleSave}
        onExportExcel={handleExportExcel}
      />

      {/* Alerts (menempel di atas layar agar tetap terlihat saat tabel di-scroll) */}
      <TableAlerts
        successMsg={successMsg}
        errorMsg={errorMsg}
        onClearSuccess={() => setSuccessMsg("")}
        onClearError={() => setErrorMsg("")}
      />

      {/* Selector Spreadsheet & Tab */}
      <TableSpreadsheetSelector
        selectedYear={selectedYear}
        years={years}
        isRekapBalaiView={isRekapBalaiView}
        selectedIkskId={selectedIkskId}
        iksks={iksks}
        spreadsheets={spreadsheets}
        selectedSpId={selectedSpId}
        isPicEffective={isPicEffective}
        isCapaianRapkTab={isCapaianRapkTab}
        rekapBalaiIkskFilter={rekapBalaiIkskFilter}
        assignedIkskIds={assignedIkskIds}
        currentMonth={currentMonth}
        isPicUser={isPicUser}
        isCurrentMonthLocked={isCurrentMonthLocked}
        isTogglingLock={isTogglingLock}
        selectedTabId={selectedTabId}
        onSelectYear={handleSelectYear}
        onSelectIksk={handleSelectIksk}
        onSelectSpreadsheet={handleSelectSpreadsheet}
        onSelectTab={handleSelectTab}
        onToggleCurrentMonthLock={handleToggleCurrentMonthLock}
        onFilterChange={(v) => {
          setRekapBalaiIkskFilter(v === "all" || v === "mine" ? v : Number(v));
          setCurrentPage(1);
        }}
      />

      {/* Main Table Entry */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {activeTab ? activeTab.title : "Tabel Formulir"}
            </h2>
            <p className="text-xs text-slate-500">
              {isKabalai
                ? "Tabel ditampilkan dalam mode baca-saja. Nilai tidak dapat diubah dari halaman ini."
                : "Kolom dengan latar hijau adalah kolom yang dapat Anda isi. Kolom terkunci dilindungi sistem."}
            </p>
          </div>

          {activeTab && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
                Dot Hijau: Kolom Hak Akses Anda (Editable)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Icon
                  icon="solar:lock-bold"
                  width={12}
                  className="text-slate-400"
                />
                Kolom Terkunci / PIC Lain
              </span>
              <span className="flex items-center gap-1.5 text-purple-700 font-medium">
                <span className="rounded bg-purple-100 px-1 py-0.2 text-[9px] font-bold text-purple-800">
                  Formula
                </span>
                Otomatis
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
            {/* Top Control Bar, Keterangan & Multi-Indikator Banner */}
            <TableControlBar
              activeTab={activeTab}
              availableMonths={availableMonths}
              selectedMonthFilter={selectedMonthFilter}
              rawRowsCount={rawRowsCount}
              isHorizontalMonthTable={isHorizontalMonthTable}
              spreadsheets={spreadsheets}
              selectedSpId={selectedSpId}
              isPicEffective={isPicEffective}
              searchQuery={searchQuery}
              totalRows={totalRows}
              safeCurrentPage={safeCurrentPage}
              pageSize={pageSize}
              totalPages={totalPages}
              isMultiIndicatorSheet={isMultiIndicatorSheet}
              matchedIndicatorParent={matchedIndicatorParent}
              headerGroups={headerGroups || []}
              focusSelectedIksk={focusSelectedIksk}
              displayedColumnsSchema={displayedColumnsSchema}
              effectiveColumnsSchema={effectiveColumnsSchema}
              onSelectMonthFilter={(m) => {
                setSelectedMonthFilter(m);
                setCurrentPage(1);
              }}
              onAddRow={handleAddRow}
              onDeleteLastRow={() => {
                if (activeTab?.rows_data && activeTab.rows_data.length > 0) {
                  handleDeleteRow(activeTab.rows_data.length - 1);
                }
              }}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              onPageChange={(newPage) => {
                setCurrentPage(newPage);
              }}
              onOverrideIndicatorParent={(parent) => {
                setOverrideIndicatorParent(parent);
              }}
              onSetFocusSelectedIksk={(focus) => {
                setFocusSelectedIksk(focus);
              }}
              onScrollToTop={scrollToTableTop}
            />

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
                                  {(() => {
                                    const isColAllowedForMe =
                                      isPicUser ||
                                      !col.allowed_katim_ids ||
                                      col.allowed_katim_ids.length === 0 ||
                                      col.allowed_katim_ids.some(
                                        (id: string | number) =>
                                          String(id) === String(user?.id),
                                      ) ||
                                      Boolean(
                                        selectedIkskId &&
                                          assignedIkskIds.includes(selectedIkskId),
                                      );
                                    const isEditableForMe =
                                      !isKabalai &&
                                      col.can_edit &&
                                      isColAllowedForMe;
                                    return (
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`font-mono text-[10px] ${isCyanHeader ? "text-cyan-800 font-bold" : "text-slate-400"}`}
                                          >
                                            [{col.col_letter}]
                                          </span>
                                          {isEditableForMe && (
                                            <span
                                              className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0"
                                              title="Kolom ini berhak Anda isi (Editable)"
                                            />
                                          )}
                                        </div>
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
                                    );
                                  })()}
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
                              {(() => {
                                const groupHasEditableForMe = grp.cols.some(
                                  (c) => {
                                    const isColAllowed =
                                      isPicUser ||
                                      !c.allowed_katim_ids ||
                                      c.allowed_katim_ids.length === 0 ||
                                      c.allowed_katim_ids.some(
                                        (id: string | number) =>
                                          String(id) === String(user?.id),
                                      ) ||
                                      Boolean(
                                        selectedIkskId &&
                                          assignedIkskIds.includes(selectedIkskId),
                                      );
                                    return c.can_edit && isColAllowed;
                                  },
                                );
                                return (
                                  <div className="flex items-center justify-center gap-1.5">
                                    {groupHasEditableForMe ? (
                                      <span
                                        className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0"
                                        title="Kelompok kolom ini berhak Anda isi (Editable)"
                                      />
                                    ) : !isCyanHeader ? (
                                      <span
                                        className={`size-2 rounded-full inline-block ${mColor.dot}`}
                                      />
                                    ) : null}
                                    <span>{grp.parent}</span>
                                    {isGrpLocked && (
                                      <span className="inline-flex items-center gap-0.5 rounded bg-slate-200/90 text-slate-700 px-1.5 py-0.5 text-[9px] font-bold lowercase tracking-normal">
                                        <Icon
                                          icon="solar:lock-bold"
                                          width={10}
                                        />
                                        terkunci
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </th>
                          );
                        })}
                      </tr>

                      {/* Baris 2: Sub-Parent Cara Perhitungan jika ada (Tier 2 untuk IKSK 4 KLB, IKSK 1 Detil Pengujian, dsb) */}
                      {hasSubParents && (
                        <tr
                          className={`border-b ${isCyanHeader ? "bg-cyan-100 border-cyan-400" : "bg-slate-100 border-slate-200"}`}
                        >
                          {displayedHeaderGroups.map((grp, gIdx) => {
                            if (!grp.parent) return null;
                            // Kelompokkan kolom-kolom berurutan berdasarkan sub_parent yang sama
                            const subChunks: {
                              sub_parent: string;
                              count: number;
                              isLeaf: boolean;
                            }[] = [];
                            grp.cols.forEach((col) => {
                              const sp =
                                col.sub_parent ||
                                (col.label && col.label.split(" - ").length >= 3
                                  ? col.label.split(" - ")[1].trim()
                                  : "");
                              const isColLeaf =
                                !col.sub_label ||
                                col.sub_label === col.sub_parent;
                              if (
                                subChunks.length > 0 &&
                                subChunks[subChunks.length - 1].sub_parent ===
                                  sp
                              ) {
                                subChunks[subChunks.length - 1].count++;
                                if (!isColLeaf) {
                                  subChunks[subChunks.length - 1].isLeaf =
                                    false;
                                }
                              } else {
                                subChunks.push({
                                  sub_parent: sp,
                                  count: 1,
                                  isLeaf: isColLeaf,
                                });
                              }
                            });

                            return subChunks.map((chunk, cIdx) => (
                              <th
                                key={`subgrp-${gIdx}-${cIdx}-${chunk.sub_parent}`}
                                colSpan={chunk.count}
                                rowSpan={chunk.isLeaf ? 2 : 1}
                                className={`py-2 px-3 font-semibold text-center text-xs border-r border-b whitespace-pre-line leading-relaxed ${
                                  isCyanHeader
                                    ? "bg-cyan-100 text-cyan-950 border-cyan-400 shadow-inner"
                                    : "bg-slate-100 text-slate-800 border-slate-200"
                                }`}
                              >
                                {chunk.sub_parent}
                              </th>
                            ));
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
                            if (
                              hasSubParents &&
                              (!col.sub_label ||
                                col.sub_label === col.sub_parent)
                            ) {
                              return null;
                            }
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
                              ) ||
                              Boolean(
                                selectedIkskId &&
                                  assignedIkskIds.includes(selectedIkskId),
                              );
                            const isEditableForMe =
                              col.can_edit &&
                              isColAllowedForUser &&
                              !isColMonthLocked;
                            const subTitle = hasSubParents
                              ? col.sub_label ||
                                (col.label && col.label.split(" - ").length >= 3
                                  ? col.label
                                      .split(" - ")
                                      .slice(2)
                                      .join(" - ")
                                      .trim()
                                  : col.label && col.label.includes(" - ")
                                    ? col.label
                                        .split(" - ")
                                        .slice(1)
                                        .join(" - ")
                                        .trim()
                                    : col.label)
                              : col.sub_label ||
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
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`font-mono text-[10px] ${isCyanHeader ? "text-cyan-800 font-bold" : "text-slate-400"}`}
                                    >
                                      [{col.col_letter}]
                                    </span>
                                    {isEditableForMe && (
                                      <span
                                        className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0"
                                        title="Kolom ini berhak Anda isi (Editable)"
                                      />
                                    )}
                                  </div>
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
                                {!hasSubParents &&
                                  col.sub_label &&
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
                        const isColAllowedForMe =
                          isPicUser ||
                          !col.allowed_katim_ids ||
                          col.allowed_katim_ids.length === 0 ||
                          col.allowed_katim_ids.some(
                            (id: string | number) =>
                              String(id) === String(user?.id),
                          ) ||
                          Boolean(
                            selectedIkskId &&
                              assignedIkskIds.includes(selectedIkskId),
                          );
                        const isEditableForMe =
                          !isKabalai && col.can_edit && isColAllowedForMe;
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
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-slate-400">
                                  [{col.col_letter}]
                                </span>
                                {isEditableForMe && (
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0"
                                    title="Kolom ini berhak Anda isi (Editable)"
                                  />
                                )}
                              </div>
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
                      const rowKey = isMultiRowTable
                        ? row.row_index !== undefined
                          ? row.row_index
                          : originalIdx
                        : row.month !== undefined &&
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

                      const rMonthNum = getRowMonthNumber(row, originalIdx);
                      const effectiveMonth =
                        rMonthNum !== null && rMonthNum >= 1 && rMonthNum <= 12
                          ? rMonthNum
                          : row.month !== undefined &&
                              row.month >= 1 &&
                              row.month <= 12
                            ? row.month
                            : 0;
                      const isMonthRow =
                        !isHorizontalMonthTable &&
                        effectiveMonth >= 1 &&
                        effectiveMonth <= 12 &&
                        !isTotalRow &&
                        !isFormulaRow &&
                        !isSectionRow;
                      const isMonthLocked =
                        !isPicUser &&
                        isMonthRow &&
                        Boolean(
                          row.is_locked ||
                          (effectiveMonth > 0 && monthLocksMap[effectiveMonth]),
                        );
                      const isCurrent =
                        isMonthRow &&
                        (row.is_current || effectiveMonth === currentMonth);
                      const rowAllowed = (row as any).allowed_katim_ids;
                      const isUserAllowedForThisRow =
                        isPicUser ||
                        !rowAllowed ||
                        rowAllowed.length === 0 ||
                        rowAllowed.some(
                          (id: string | number) => String(id) === String(user?.id),
                        ) ||
                        Boolean(selectedIkskId && assignedIkskIds.includes(selectedIkskId));

                      const canEditThisRow =
                        !isKabalai &&
                        !isTotalRow &&
                        !isFormulaRow &&
                        !isSectionRow &&
                        (row.can_edit_row !== false || isUserAllowedForThisRow) &&
                        !isMonthLocked;

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
                      const hasActualData = displayedColumnsSchema.some((c) => {
                        if (
                          c.type === "readonly" ||
                          c.key === "col_0" ||
                          c.key === monthColKey
                        )
                          return false;
                        const cellVal = row.cells?.[c.key];
                        return isCellContentFilled(cellVal);
                      });
                      const isRowFilled =
                        hasActualData || isUpdatedRow || isDirtyRow;

                      return (
                        <tr
                          key={`row-${originalIdx}-${row.month ?? 0}`}
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
                                    : isMonthLocked || !canEditThisRow
                                      ? "bg-slate-100/90 text-slate-600 border-l-4 border-l-slate-400"
                                      : isRowFilled
                                        ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] border-l-4 border-l-emerald-500"
                                        : "bg-white hover:bg-slate-50/80 border-l-4 border-l-slate-200"
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

                            // Aturan khusus Tab Caput RO Spl Pangan (Tab 86):
                            // 1. Baris PIRT pada kolom "dievaluasi Penandaan" dapat diedit manual untuk Jan s.d. Des
                            // 2. Baris Pangan Olahan berasal dari rujukan 3A -> tidak boleh diedit manual
                            // 3. Baris Total dihitung dari SUM -> tidak boleh diedit manual
                            const isCaputRoSplPangan =
                              activeTab?.id === 86 ||
                              Boolean(
                                activeTab?.title
                                  ?.toLowerCase()
                                  .includes("caput ro spl pangan"),
                              );
                            const isPenandaanCol =
                              isCaputRoSplPangan &&
                              Boolean(
                                (col.label || "")
                                  .toLowerCase()
                                  .includes("dievaluasi penandaan") ||
                                (col.sub_label || "")
                                  .toLowerCase()
                                  .includes("dievaluasi penandaan"),
                              );
                            const isPirtRow =
                              isCaputRoSplPangan &&
                              (row.row_name === "PIRT" ||
                                row.cells?.col_0 === "PIRT");
                            const isPanganOlahanRow =
                              isCaputRoSplPangan &&
                              (row.row_name === "Pangan Olahan" ||
                                row.cells?.col_0 === "Pangan Olahan");

                            const canEditCaputRoCell =
                              isCaputRoSplPangan && isPirtRow && isPenandaanCol;

                            const isUserAllowedForCol =
                              isPicUser ||
                              !col.allowed_katim_ids ||
                              col.allowed_katim_ids.length === 0 ||
                              col.allowed_katim_ids.some(
                                (id: string | number) =>
                                  String(id) === String(user?.id),
                              ) ||
                              Boolean(
                                selectedIkskId &&
                                  assignedIkskIds.includes(selectedIkskId),
                              );

                            const canEditCell =
                              (canEditCaputRoCell ||
                                ((col.can_edit ||
                                  (isPicEffective &&
                                    col.type !== "formula" &&
                                    !isMonthLocked)) &&
                                  !isPanganOlahanRow &&
                                  (!isTotalRow || isIndeksKieEditableRow) &&
                                  (!isFormulaRow || isIndeksKieEditableRow))) &&
                              isUserAllowedForCol &&
                              !isMonthLocked &&
                              !isColMonthLocked &&
                              canEditThisRow &&
                              !isSectionRow &&
                              (!isTotalRow || isIndeksKieEditableRow);
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
                                    : isMonthLocked || !canEditThisRow
                                      ? "bg-slate-200"
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
                            if (
                              isCollab &&
                              col.type !== "formula" &&
                              col.type !== "readonly"
                            ) {
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
                              // kolom teks (link/URL data dukung, bukti, dokumen) bukan angka kolaboratif
                              !/(link|url|tautan|data\s*dukung|bukti|dokumen|nama|alamat|uraian)/i.test(
                                col.label || "",
                              ) &&
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
                                          ? formatDisplayCellValue(val, col)
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
                                      const isDetilCol =
                                        isIksk1DetilPengujian &&
                                        /^col_(?:[3-9]|[1-4]\d|50)$/.test(
                                          col.key,
                                        );
                                      const isCum =
                                        (!isHorizontalMonthTable &&
                                          isCumulativeCol(col)) ||
                                        isDetilCol;
                                      const rawInput =
                                        row.cells?.[col.key + "_input"];
                                      const cellVal = row.cells?.[col.key];

                                      let displayVal: any = val;
                                      let cumulativeVal: any = null;

                                      if (isDetilCol) {
                                        const colIdxNum = parseInt(
                                          col.key.replace("col_", ""),
                                          10,
                                        );
                                        const m =
                                          Math.floor((colIdxNum - 3) / 4) + 1;
                                        const prevColKey =
                                          m > 1 ? `col_${colIdxNum - 4}` : null;
                                        const prevVal = prevColKey
                                          ? Number(row.cells?.[prevColKey] || 0)
                                          : 0;

                                        if (m === 1) {
                                          displayVal =
                                            rawInput !== undefined &&
                                            rawInput !== null &&
                                            rawInput !== ""
                                              ? rawInput
                                              : (cellVal ?? "");
                                          cumulativeVal = cellVal ?? displayVal;
                                        } else {
                                          displayVal =
                                            rawInput !== undefined &&
                                            rawInput !== null &&
                                            rawInput !== ""
                                              ? rawInput
                                              : Number(cellVal) >= prevVal &&
                                                  prevVal > 0
                                                ? Number(cellVal) - prevVal
                                                : (cellVal ?? "");
                                          cumulativeVal =
                                            cellVal !== undefined &&
                                            cellVal !== null &&
                                            cellVal !== ""
                                              ? cellVal
                                              : displayVal !== ""
                                                ? prevVal + Number(displayVal)
                                                : "";
                                        }
                                      } else {
                                        const prevVal =
                                          !isHorizontalMonthTable &&
                                          activeTab?.rows_data &&
                                          rowIdxNum !== undefined &&
                                          rowIdxNum > 0
                                            ? Number(
                                                activeTab.rows_data[
                                                  rowIdxNum - 1
                                                ]?.cells?.[col.key] || 0,
                                              )
                                            : 0;
                                        displayVal = isCum
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
                                        cumulativeVal = isCum
                                          ? (cellVal ?? displayVal)
                                          : null;
                                      }

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
                                            (isDetilCol
                                              ? true
                                              : rowIdxNum !== undefined &&
                                                rowIdxNum > 0) && (
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
                              : cIdx === 0 || col.key === "col_0";
                            const showLockedBadge =
                              isMonthLocked && isMonthRow && isTheMonthCol;

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
                                          : isMonthLocked ||
                                              isColMonthLocked ||
                                              !col.can_edit
                                            ? "bg-slate-200/90 text-slate-600 font-medium border-slate-300"
                                            : "bg-slate-200/70 text-slate-600 font-medium border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>
                                      {formatDisplayCellValue(val, col)}
                                    </span>
                                    {showStatusBadge &&
                                      (isRowFilled ? (
                                        <span
                                          className="inline-flex items-center text-emerald-600 shrink-0"
                                          title="Baris pada periode ini sudah memiliki data"
                                        >
                                          <Icon
                                            icon="solar:check-circle-bold"
                                            width={14}
                                          />
                                        </span>
                                      ) : (
                                        <span
                                          className="inline-flex items-center shrink-0"
                                          title="Baris pada periode ini belum memiliki isian"
                                        >
                                          <span className="inline-block h-2 w-2 rounded-full bg-slate-300 ring-2 ring-slate-100" />
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

            {/* Catatan Dokumen (Caput RO) & Legend (Indeks KIE) */}
            <TableLegendNotes activeTab={activeTab} />

            {/* Pagination Toolbar */}
            <TablePagination
              isPaginationNeeded={isPaginationNeeded}
              totalRows={totalRows}
              safeCurrentPage={safeCurrentPage}
              pageSize={pageSize}
              totalPages={totalPages}
              selectedMonthFilter={selectedMonthFilter}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              onPageChange={(newPage) => {
                setCurrentPage(newPage);
              }}
              onScrollToTop={scrollToTableTop}
            />
          </>
        )}
      </div>

      {/* Modal Kelola Catatan Kolaboratif (Kendala & RTL PIC) */}
      <CollabNotesModal
        modal={collabModal}
        user={user}
        isPicUser={isPicUser}
        savingCollab={savingCollab}
        onClose={() => setCollabModal(null)}
        onUpdateModal={setCollabModal}
        onSaveEditedNote={handleSaveEditedCollabNote}
        onDeleteNote={handleDeleteCollabNote}
        onSave={handleSaveCollabModal}
      />

      {/* Modal Import Data Excel (Tab) */}
      <ExcelTabImportModal
        isOpen={showExcelModal}
        activeTab={activeTab}
        selectedMonthFilter={selectedMonthFilter}
        effectiveColumnsSchema={effectiveColumnsSchema}
        excelFile={excelFile}
        excelParsedRows={excelParsedRows}
        excelMode={excelMode}
        excelSaving={excelSaving}
        excelError={excelError}
        onClose={() => {
          setShowExcelModal(false);
          setExcelFile(null);
          setExcelParsedRows([]);
          setExcelError(null);
        }}
        onDownloadTemplate={handleDownloadExcelTemplate}
        onFileSelect={handleExcelFileSelect}
        onModeChange={setExcelMode}
        onSave={handleSaveExcelImport}
      />

      {/* Modal Peringatan Validasi Kendala & RTL Belum Diisi */}
      <ValidationModal
        modal={validationModal}
        activeTab={activeTab}
        onClose={() => setValidationModal(null)}
        onCompleteMissing={(rKey, targetCol, val, mName, canEdit, rIdx) => {
          handleOpenCollabModal(rKey, targetCol, val, mName, canEdit, rIdx);
        }}
      />

      {/* Modal Kontribusi Angka Kolaboratif Multi-Katim */}
      <CollabNumModal
        modal={collabNumModal}
        katims={katims}
        user={user}
        activeTab={activeTab}
        onClose={() => setCollabNumModal(null)}
        onMyValueChange={(val) => {
          if (collabNumModal) {
            setCollabNumModal({
              ...collabNumModal,
              myValue: val,
            });
          }
        }}
        onSave={handleSaveCollabNumModal}
      />

      {/* Modal Upload / Import Excel (Dokumen / Tab) */}
      <ExcelUploadModal
        isOpen={showUploadModal}
        activeTab={activeTab}
        uploadMode={uploadMode}
        uploadFile={uploadFile}
        uploadError={uploadError}
        uploadInfo={uploadInfo}
        uploading={uploading}
        checkingUpload={checkingUpload}
        onClose={closeUploadModal}
        onModeChange={(mode) => {
          setUploadMode(mode);
          setUploadError("");
          setUploadInfo("");
        }}
        onFileSelect={(picked, fileErr) => {
          setUploadInfo("");
          if (fileErr) {
            setUploadFile(null);
            setUploadError(fileErr);
            return;
          }
          setUploadError("");
          setUploadFile(picked);
        }}
        onSubmit={handleRequestUploadExcel}
      />

      {/* Pop-up Konfirmasi Dialog */}
      <ConfirmDialogModal
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
}
