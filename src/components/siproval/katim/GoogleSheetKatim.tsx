"use client";

import { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

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

type IkskOption = {
  id: number;
  name: string;
};

type SpreadsheetOption = {
  id: number;
  name: string;
  spreadsheet_id: string;
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
  has_access: boolean;
};

type RowMeta = {
  row_number: number;
  month_index: number | null;
  month_name: string | null;
  is_locked: boolean;
  status: "locked" | "current" | "future" | "open";
};

export default function GoogleSheetKatim() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [iksks, setIksks] = useState<IkskOption[]>([]);
  const [selectedIksk, setSelectedIksk] = useState<number | null>(null);

  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetOption[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<number | null>(null);

  const [tabs, setTabs] = useState<TabOption[]>([]);
  const [selectedTab, setSelectedTab] = useState<number | null>(null);

  const [headerRows, setHeaderRows] = useState<string[][]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);

  const [columnPermissions, setColumnPermissions] = useState<Record<string, ColumnPermission>>({});
  const [rowMetadata, setRowMetadata] = useState<Record<number, RowMeta>>({});
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);

  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingTabs, setSyncingTabs] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState("");

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
      const chosenSp = payload.selectedSpreadsheet || spList[0];
      if (chosenSp && !spreadsheetId) {
        setSelectedSpreadsheet(chosenSp.id);
      }

      // 3. Tabs
      const tabList: TabOption[] = payload.tabs || [];
      setTabs(tabList);
      const chosenTab = payload.targetTab || tabList[0];
      if (chosenTab && !tabId) {
        setSelectedTab(chosenTab.id);
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
      const dataStartRow = Number(chosenTab?.data_start_row || 2);
      if (Array.isArray(vals) && vals.length > 0) {
        setRows(
          vals.map((v: string[], idx: number) => ({
            row_number: dataStartRow + idx,
            values: v,
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
    fetchSheetData();
  }, [user?.id]);

  const handleIkskChange = (newIkskId: number) => {
    setSelectedIksk(newIkskId);
    setSelectedSpreadsheet(null);
    setSelectedTab(null);
    setEditedCells({});
    fetchSheetData(newIkskId, null, null);
  };

  const handleSpreadsheetChange = (newSpId: number) => {
    setSelectedSpreadsheet(newSpId);
    setSelectedTab(null);
    setEditedCells({});
    fetchSheetData(selectedIksk, newSpId, null);
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
      const res = await api.post(`${baseUrl}/superadmin/sinkronisasi-tab`, {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateList = Object.entries(editedCells).map(([cell, value]) => ({
      cell,
      value,
    }));

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

  // Nama bulan bahasa Indonesia
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonthName = monthNames[currentMonth - 1] || `Bulan ${currentMonth}`;

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
            <span className="font-medium text-slate-600">Bulan Lampau (Terkunci / Hanya Baca)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <Icon icon="solar:pen-bold" width={12} />
            </span>
            <span className="font-medium text-emerald-800">Bulan Ini & Mendatang (Dapat Diisi)</span>
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
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <Icon icon="solar:table-bold" width={18} className="text-[#005baa]" />
            <h3 className="text-xs font-bold text-slate-800">
              Lembar Kerja Spreadsheet Aktif
            </h3>
          </div>

          {pendingChanges > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-700">
              ● {pendingChanges} Perubahan Sel
            </span>
          )}
        </div>

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
                    {Array.from({ length: maxCols }).map((_, cIdx) => (
                      <td
                        key={cIdx}
                        className="border-r border-slate-300 px-3 py-2 text-center text-[11px]"
                      >
                        {hRow[cIdx] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-slate-200">
                {rows.map((row) => {
                  const rowMeta = rowMetadata[row.row_number];
                  const isRowLocked = rowMeta?.is_locked ?? false;
                  const isCurrentRow = rowMeta?.status === "current";

                  return (
                    <tr
                      key={row.row_number}
                      className={`transition ${
                        isRowLocked
                          ? "bg-slate-50/80 hover:bg-slate-100/70"
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
                            : isCurrentRow
                              ? "bg-emerald-100 text-emerald-900 font-bold"
                              : "bg-slate-100 text-slate-600"
                        }`}
                        title={
                          isRowLocked
                            ? `Baris ${row.row_number}: ${rowMeta?.month_name || "Bulan lampau"} (Terkunci)`
                            : isCurrentRow
                              ? `Baris ${row.row_number}: ${rowMeta?.month_name || "Bulan ini"} (Bulan Berjalan - Aktif)`
                              : `Baris ${row.row_number}`
                        }
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isRowLocked && (
                            <Icon icon="solar:lock-bold" width={11} className="text-slate-400" />
                          )}
                          {isCurrentRow && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          )}
                          <span>{row.row_number}</span>
                        </div>
                      </td>

                      {Array.from({ length: maxCols }).map((_, cIdx) => {
                        const colLetter = columnNumberToLetter(cIdx + 1);
                        const cellCoord = `${colLetter}${row.row_number}`;
                        const val =
                          editedCells[cellCoord] !== undefined
                            ? editedCells[cellCoord]
                            : row.values[cIdx] || "";
                        const isEdited = editedCells[cellCoord] !== undefined;

                        const colPerm = columnPermissions[colLetter];
                        const isColEditable = colPerm?.is_editable ?? false;
                        const isColFormula = colPerm?.is_formula ?? false;

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
                                    : ""
                            }`}
                          >
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
    </div>
  );
}
