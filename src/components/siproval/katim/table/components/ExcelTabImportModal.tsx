"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { ActiveTabDetail, RowData, ColumnSchema } from "../types/tableTypes";

export interface ExcelTabImportModalProps {
  isOpen: boolean;
  activeTab: ActiveTabDetail | null;
  selectedMonthFilter: string;
  effectiveColumnsSchema: ColumnSchema[];
  excelFile: File | null;
  excelParsedRows: RowData[];
  excelMode: "append" | "replace";
  excelSaving: boolean;
  excelError: string | null;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onModeChange: (mode: "append" | "replace") => void;
  onSave: () => void;
}

export const ExcelTabImportModal: React.FC<ExcelTabImportModalProps> = ({
  isOpen,
  activeTab,
  selectedMonthFilter,
  effectiveColumnsSchema,
  excelFile,
  excelParsedRows,
  excelMode,
  excelSaving,
  excelError,
  onClose,
  onDownloadTemplate,
  onFileSelect,
  onModeChange,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
              onClick={onDownloadTemplate}
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
                  onChange={() => onModeChange("append")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-xs font-bold">
                    Tambahkan Data (Append)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menambahkan baris dari file Excel tanpa menghapus data yang
                    sudah ada sebelumnya.
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
                  onChange={() => onModeChange("replace")}
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
                  onChange={onFileSelect}
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
                  Pratinjau {Math.min(3, excelParsedRows.length)} baris pertama:
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
            onClick={onClose}
            disabled={excelSaving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
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
  );
};

export default ExcelTabImportModal;
