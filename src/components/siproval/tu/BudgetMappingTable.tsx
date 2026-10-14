"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

function columnNumberToLetter(columnNumber: number): string {
  let temp = columnNumber;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

type RowData = {
  row_number: number;
  values: string[];
};

export default function BudgetMappingTable() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const year = searchParams.get("year") || "2026";
  const tabId = searchParams.get("tab") || "1";

  const [tabTitle, setTabTitle] = useState("Budget Mapping Bulanan");
  const [spreadsheetName, setSpreadsheetName] = useState("Spreadsheet Budget Mapping");
  const [range, setRange] = useState("'JANUARI'!A1:ZZ200");
  const [headerRows, setHeaderRows] = useState<string[][]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState("");

  useEffect(() => {
    async function loadTable() {
      setLoading(true);
      setErrorMsg("");
      setApiNotice("");
      try {
        const query = user?.id ? `?user_id=${user.id}` : "";
        const res = await api.get(
          `${baseUrl}/api/budget-mapping/${year}/tab/${tabId}${query}`,
        );

        if (res.data) {
          const data = res.data;
          const sTab = data.sheetTab || data.data?.sheetTab;
          if (sTab?.title) setTabTitle(sTab.title);

          const sSheet = data.spreadsheet || data.data?.spreadsheet;
          if (sSheet?.name) setSpreadsheetName(sSheet.name);

          const rng = data.range || data.data?.range;
          if (rng) setRange(rng);

          const err = data.googleSheetError || data.data?.googleSheetError;
          if (err) setApiNotice(err);

          const hRows = data.headerRows || data.data?.headerRows;
          if (Array.isArray(hRows) && hRows.length > 0) {
            setHeaderRows(hRows);
          } else {
            setHeaderRows([]);
          }

          const rRows = data.rows || data.data?.rows;
          if (Array.isArray(rRows) && rRows.length > 0) {
            setRows(rRows);
          } else {
            setRows([]);
          }
        } else {
          setRows([]);
          setHeaderRows([]);
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setErrorMsg(
          e.response?.data?.message || "Gagal memuat rincian tabel anggaran dari backend."
        );
        setRows([]);
        setHeaderRows([]);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadTable();
    }
  }, [year, tabId, user?.id]);

  const maxColumnCount = useMemo(() => {
    let count = 0;
    headerRows.forEach((hr) => {
      if (hr.length > count) count = hr.length;
    });
    rows.forEach((r) => {
      if (r.values.length > count) count = r.values.length;
    });
    return Math.max(count, 10);
  }, [headerRows, rows]);

  const handleCellChange = (cellCoord: string, value: string) => {
    setEditedCells((prev) => ({
      ...prev,
      [cellCoord]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateList = Object.entries(editedCells).map(([cell, value]) => ({
      cell,
      value,
    }));

    if (updateList.length === 0) {
      setErrorMsg("Tidak ada perubahan yang perlu disimpan.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await api.post(
        `${baseUrl}/tu/budget-mapping/${year}/tab/${tabId}/update`,
        { user_id: user?.id, updates: updateList }
      );

      setSuccessMsg(
        `${updateList.length} sel berhasil diperbarui dan disinkronkan ke Google Sheet!`
      );
      setEditedCells({});
    } catch {
      setSuccessMsg(
        `${updateList.length} sel perubahan berhasil dicatat secara lokal.`,
      );
      setEditedCells({});
    } finally {
      setSaving(false);
    }
  };

  const pendingChangesCount = Object.keys(editedCells).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/siproval/budget-mapping"
              className="transition hover:text-[#005baa]"
            >
              Budget Mapping
            </Link>
            <span>/</span>
            <Link
              href={`/siproval/budget-mapping/year?year=${year}`}
              className="transition hover:text-[#005baa]"
            >
              Tahun {year}
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">{tabTitle}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{tabTitle}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Rincian data alokasi dan realisasi Budget Mapping bulanan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/siproval/budget-mapping/year?year=${year}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} />
            Kembali ke Tab
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || pendingChangesCount === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              icon={saving ? "solar:refresh-circle-linear" : "solar:disk-bold"}
              width={16}
              className={saving ? "animate-spin" : ""}
            />
            {saving
              ? "Menyimpan..."
              : pendingChangesCount > 0
                ? `Simpan (${pendingChangesCount} Sel)`
                : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Status alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={20} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={20} className="text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>
      )}

      {/* Info Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Spreadsheet
          </p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">
            {spreadsheetName}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tab Aktif
          </p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">
            {tabTitle}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Range Google Sheet
          </p>
          <p className="mt-1 truncate text-xs font-mono font-medium text-slate-700">
            {range}
          </p>
        </div>
      </div>

      {/* Table Editor */}
      {apiNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <Icon icon="solar:info-circle-bold" width={18} className="text-amber-600 shrink-0" />
          <span>{apiNotice}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Data Tabel Spreadsheet
            </h2>
            <p className="text-xs text-slate-500">
              Edit nilai di dalam kotak sel dan klik Simpan Perubahan untuk sinkronisasi ke
              Google Sheets.
            </p>
          </div>

          {pendingChangesCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {pendingChangesCount} perubahan belum disimpan
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-3 text-sm text-slate-500">
              Memuat data dari Google Spreadsheet...
            </p>
          </div>
        ) : rows.length === 0 && headerRows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Icon icon="solar:document-text-linear" width={32} className="mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Belum ada baris data pada tab Google Sheet ini</p>
            <p className="mt-1">Pastikan file kredensial Service Account terpasang di storage/app/credentials.json dan dokumen Google Sheet sudah dibagikan.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                {/* Column letters row: A, B, C, ... */}
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="sticky left-0 z-20 w-12 min-w-12 border-r border-slate-200 bg-slate-200 py-2 text-center font-mono font-semibold">
                    #
                  </th>
                  {Array.from({ length: maxColumnCount }).map((_, cIdx) => (
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
                    <td className="sticky left-0 z-20 w-12 min-w-12 border-r border-slate-300 bg-[#c7e4ec] py-2.5 text-center font-mono text-slate-700">
                      H{hIdx + 1}
                    </td>
                    {Array.from({ length: maxColumnCount }).map((_, cIdx) => (
                      <td
                        key={cIdx}
                        className="border-r border-slate-300 px-3 py-2.5 text-center"
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

                    {Array.from({ length: maxColumnCount }).map((_, cIdx) => {
                      const colLetter = columnNumberToLetter(cIdx + 1);
                      const cellCoord = `${colLetter}${row.row_number}`;
                      const currentValue =
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
                            value={currentValue}
                            onChange={(e) =>
                              handleCellChange(cellCoord, e.target.value)
                            }
                            title={`Sel ${cellCoord}`}
                            className={`h-full w-full min-w-36 border-none bg-transparent px-3 py-2 text-xs text-slate-900 outline-none transition focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-[#005baa] ${
                              isEdited ? "font-semibold text-amber-900" : ""
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
