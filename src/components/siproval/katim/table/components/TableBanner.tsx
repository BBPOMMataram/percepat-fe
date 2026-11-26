"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import type { SpreadsheetItem } from "../types/tableTypes";

export interface TableBannerProps {
  isRekapBalaiView: boolean;
  isKabalai: boolean;
  isTuView: boolean;
  isPicUser: boolean;
  selectedYear: number;
  selectedSpId: number | null;
  spreadsheets: SpreadsheetItem[];
  activeSpreadsheet: SpreadsheetItem | null;
  headerRightSlot?: React.ReactNode;
  onOpenUploadModal: () => void;
  onExportExcel: (mode: "locked" | "all") => void;
}

/** Judul halaman Entry/Dokumen RHPK + aksi unggah & unduh. Tombol simpan ada di bawah tabel (TableSaveBar). */
export const TableBanner: React.FC<TableBannerProps> = ({
  isRekapBalaiView,
  isKabalai,
  isTuView,
  isPicUser,
  selectedYear,
  selectedSpId,
  spreadsheets,
  activeSpreadsheet,
  headerRightSlot,
  onOpenUploadModal,
  onExportExcel,
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const title = isRekapBalaiView
    ? "Tabel File Rekap Balai"
    : isKabalai
      ? "Dokumen Lembar Kerja RHPK"
      : "Entry Data RHPK";

  const description = isKabalai
    ? isRekapBalaiView || isTuView
      ? "Mode baca-saja."
      : "Pantau lembar kerja seluruh IKSK (baca-saja)."
    : isPicUser
      ? "Isi dan kelola seluruh dokumen RHPK."
      : "Isi capaian bulanan IKSK yang Anda ampu.";

  const canUpload =
    !isKabalai &&
    Boolean(selectedSpId) &&
    (isPicUser ||
      !spreadsheets.find((s) => s.id === selectedSpId)?.is_readonly);

  const exportOptions: Array<{ mode: "locked" | "all"; label: string; hint: string }> = [
    { mode: "locked", label: "Bulan final (terkunci)", hint: "Hanya bulan yang sudah dikunci" },
    { mode: "all", label: "Semua bulan", hint: "Seluruh bulan pada dokumen" },
  ];

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {description} Tahun {selectedYear}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {headerRightSlot}

          {canUpload && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              title="Unggah data dari file Excel (.xlsx)"
            >
              Unggah Excel
            </button>
          )}

          {activeSpreadsheet && (
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setShowExportDropdown((prev) => !prev)}
                aria-expanded={showExportDropdown}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#005baa] bg-white px-3.5 py-2 text-xs font-semibold text-[#005baa] transition hover:bg-blue-50 cursor-pointer"
              >
                Unduh Excel
                <Icon icon="solar:alt-arrow-down-linear" width={14} />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 z-50 mt-1.5 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {exportOptions.map((opt) => (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => {
                        setShowExportDropdown(false);
                        onExportExcel(opt.mode);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-blue-50 hover:text-[#005baa] cursor-pointer"
                    >
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="block text-[11px] text-slate-500">
                        {opt.hint}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TableBanner;
