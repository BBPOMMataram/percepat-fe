"use client";

import { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
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
};

type SheetRow = {
  row_number: number;
  values: string[];
};

export default function GoogleSheetKatim() {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetOption[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<number | null>(null);

  const [tabs, setTabs] = useState<TabOption[]>([]);
  const [selectedTab, setSelectedTab] = useState<number | null>(null);

  const [headerRows, setHeaderRows] = useState<string[][]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);

  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingTabs, setSyncingTabs] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState("");

  const fetchSheetData = async (spreadsheetId?: number | null, tabId?: number | null) => {
    setLoading(true);
    setErrorMsg("");
    setApiNotice("");
    try {
      const queryParams = new URLSearchParams();
      if (spreadsheetId) queryParams.set("spreadsheet", String(spreadsheetId));
      if (tabId) queryParams.set("tab", String(tabId));

      const res = await api.get(
        `${baseUrl}/api/katim/test-google-sheet?${queryParams.toString()}`
      );
      const data = res.data;

      const spList: SpreadsheetOption[] =
        data.spreadsheets || data.data?.spreadsheets || [];
      setSpreadsheets(spList);

      const chosenSp =
        data.selectedSpreadsheet || data.data?.selectedSpreadsheet || spList[0];
      if (chosenSp && !spreadsheetId) {
        setSelectedSpreadsheet(chosenSp.id);
      }

      const tabList: TabOption[] = data.tabs || data.data?.tabs || [];
      setTabs(tabList);

      const chosenTab =
        data.targetTab || data.data?.targetTab || tabList[0];
      if (chosenTab && !tabId) {
        setSelectedTab(chosenTab.id);
      }

      const err = data.googleSheetError || data.data?.googleSheetError;
      if (err) setApiNotice(err);

      const headers = data.headerValues || data.data?.headerValues;
      if (Array.isArray(headers) && headers.length > 0) {
        setHeaderRows([headers]);
      } else {
        setHeaderRows([]);
      }

      const vals = data.values || data.data?.values;
      if (Array.isArray(vals) && vals.length > 0) {
        setRows(
          vals.map((v: string[], idx: number) => ({
            row_number: idx + 2,
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
  }, []);

  const handleSpreadsheetChange = (newSpId: number) => {
    setSelectedSpreadsheet(newSpId);
    setSelectedTab(null);
    fetchSheetData(newSpId, null);
  };

  const handleTabChange = (newTabId: number) => {
    setSelectedTab(newTabId);
    fetchSheetData(selectedSpreadsheet, newTabId);
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
      fetchSheetData(selectedSpreadsheet, selectedTab);
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
      const res = await api.post(`${baseUrl}/katim/test-google-sheet/update`, {
        spreadsheet: selectedSpreadsheet,
        tab: currentTabObj?.title || "",
        updates: updateList,
      });

      setSuccessMsg(
        res.data?.message ||
          `${updateList.length} sel berhasil disimpan ke Google Spreadsheet!`
      );
      setEditedCells({});
      fetchSheetData(selectedSpreadsheet, selectedTab);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal menyimpan perubahan ke Google Sheet."
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

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Data Realisasi IKSK (Google Sheets)
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Formulir pengisian capaian target dan realisasi kegiatan untuk Ketua Tim (PIC).
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
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600" />
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

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        {/* Spreadsheet Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Dokumen Spreadsheet
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
            Tab Google Sheet
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
              {/* Column Letters */}
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="sticky left-0 z-20 w-12 min-w-12 border-r border-slate-200 bg-slate-200 py-2 text-center font-mono font-semibold">
                  #
                </th>
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <th
                    key={cIdx}
                    className="min-w-36 border-r border-slate-200 px-3 py-2 text-center font-mono font-semibold"
                  >
                    {columnNumberToLetter(cIdx + 1)}
                  </th>
                ))}
              </tr>

              {/* Header Rows */}
              {headerRows.map((hRow, hIdx) => (
                <tr
                  key={hIdx}
                  className="bg-[#d9edf4] font-bold text-slate-900 border-b border-slate-300"
                >
                  <td className="sticky left-0 z-20 w-12 min-w-12 border-r border-slate-300 bg-[#c7e4ec] py-2 text-center font-mono text-slate-700">
                    H{hIdx + 1}
                  </td>
                  {Array.from({ length: maxCols }).map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="border-r border-slate-300 px-3 py-2 text-center"
                    >
                      {hRow[cIdx] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.row_number} className="hover:bg-slate-50">
                  <td className="sticky left-0 z-10 w-12 min-w-12 border-r border-slate-200 bg-slate-100 py-1.5 text-center font-mono font-medium text-slate-600">
                    {row.row_number}
                  </td>

                  {Array.from({ length: maxCols }).map((_, cIdx) => {
                    const colLetter = columnNumberToLetter(cIdx + 1);
                    const cellCoord = `${colLetter}${row.row_number}`;
                    const val =
                      editedCells[cellCoord] !== undefined
                        ? editedCells[cellCoord]
                        : row.values[cIdx] || "";
                    const isEdited = editedCells[cellCoord] !== undefined;

                    return (
                      <td
                        key={cIdx}
                        className={`min-w-36 border-r border-slate-200 p-0 ${
                          isEdited ? "bg-amber-50" : ""
                        }`}
                      >
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            handleCellChange(cellCoord, e.target.value)
                          }
                          title={`Sel ${cellCoord}`}
                          className={`h-full w-full min-w-36 border-none bg-transparent px-3 py-2 text-xs text-slate-900 outline-none transition focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-[#005baa] ${
                            isEdited ? "font-bold text-amber-900" : ""
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
}
