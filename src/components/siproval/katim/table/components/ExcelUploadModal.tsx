"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { ActiveTabDetail } from "../types/tableTypes";
import { MAX_EXCEL_SIZE_MB } from "../constants/tableConstants";

export interface ExcelUploadModalProps {
  isOpen: boolean;
  activeTab: ActiveTabDetail | null;
  uploadMode: "tab" | "spreadsheet";
  uploadFile: File | null;
  uploadError: string;
  uploadInfo: string;
  uploading: boolean;
  checkingUpload: boolean;
  onClose: () => void;
  onModeChange: (mode: "tab" | "spreadsheet") => void;
  onFileSelect: (file: File | null, error?: string | null) => void;
  onSubmit: () => void;
}

export const validateExcelFile = (file: File | null): string | null => {
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

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  activeTab,
  uploadMode,
  uploadFile,
  uploadError,
  uploadInfo,
  uploading,
  checkingUpload,
  onClose,
  onModeChange,
  onFileSelect,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Icon icon="solar:file-smile-bold" width={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Unggah / Import File Excel
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeTab
                  ? `Tab Aktif: ${activeTab.title}`
                  : "Pilih file Excel (.xlsx / .xls)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading || checkingUpload}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <Icon icon="solar:close-circle-bold" width={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Pilihan Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Lingkup Import:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onModeChange("tab")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                  uploadMode === "tab"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Icon
                    icon="solar:document-text-bold"
                    width={15}
                    className="text-emerald-600"
                  />
                  Sheet ke Tab Ini
                </span>
                <span className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Hanya perbarui tab &quot;{activeTab?.title || "aktif"}&quot; (misal
                  KIE Medsos)
                </span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange("spreadsheet")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                  uploadMode === "spreadsheet"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Icon
                    icon="solar:folder-with-files-bold"
                    width={15}
                    className="text-emerald-600"
                  />
                  Dokumen Penuh
                </span>
                <span className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Perbarui seluruh spreadsheet beserta semua sheet di dalamnya
                </span>
              </button>
            </div>
          </div>

          {/* Area File Drop / Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              File Dokumen Excel (.xlsx / .xls):
            </label>
            <div className="relative rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 p-6 text-center transition">
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={uploading || checkingUpload}
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  e.target.value = "";
                  if (!picked) return;
                  const fileErr = validateExcelFile(picked);
                  onFileSelect(picked, fileErr);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <Icon
                  icon={
                    uploadFile
                      ? "solar:file-check-bold"
                      : "solar:cloud-upload-bold"
                  }
                  width={36}
                  className={uploadFile ? "text-emerald-600" : "text-slate-400"}
                />
                {uploadFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {uploadFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {(uploadFile.size / 1024).toFixed(1)} KB • Klik atau drag
                      file lain untuk mengganti
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Tarik file ke sini atau{" "}
                      <span className="text-emerald-700 underline">
                        pilih dari komputer
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format yang didukung: Microsoft Excel (.xlsx, .xls)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
            <Icon
              icon="solar:info-circle-bold"
              width={16}
              className="text-blue-600 shrink-0 mt-0.5"
            />
            <p className="text-[11px] leading-relaxed">
              Unggah Excel bersifat <strong>UPDATE</strong>: data bulan yang
              sudah ada akan diperbarui sesuai isi file (bukan ditambahkan sebagai
              baris baru). Hanya data BBPOM Mataram yang diambil. Hak akses
              Katim dan formula otomatis tetap dipertahankan.
            </p>
          </div>

          {uploadError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            >
              <Icon
                icon="solar:danger-circle-bold"
                width={16}
                className="text-rose-600 shrink-0 mt-0.5"
              />
              <span className="text-[11px] leading-relaxed">
                {uploadError}
              </span>
            </div>
          )}

          {uploadInfo && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
            >
              <Icon
                icon="solar:info-circle-bold"
                width={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <span className="text-[11px] leading-relaxed">
                {uploadInfo}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading || checkingUpload}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!uploadFile || uploading || checkingUpload}
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
          >
            {uploading || checkingUpload ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                <span>
                  {uploading ? "Menyimpan..." : "Memeriksa file..."}
                </span>
              </>
            ) : (
              <>
                <Icon icon="solar:diskette-bold" width={16} />
                <span>Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;
