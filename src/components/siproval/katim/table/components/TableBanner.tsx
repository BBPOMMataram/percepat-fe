"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import type { SpreadsheetItem } from "../types/tableTypes";

export interface TableBannerProps {
  isRekapBalaiView: boolean;
  isKabalai: boolean;
  isTuView: boolean;
  isPicUser: boolean;
  isPicEffective: boolean;
  selectedYear: number;
  selectedSpId: number | null;
  spreadsheets: SpreadsheetItem[];
  activeSpreadsheet: SpreadsheetItem | null;
  dirtyCount: number;
  saving: boolean;
  headerRightSlot?: React.ReactNode;
  onOpenUploadModal: () => void;
  onSave: () => void;
  onExportExcel: (mode: "locked" | "all") => void;
}

export const TableBanner: React.FC<TableBannerProps> = ({
  isRekapBalaiView,
  isKabalai,
  isTuView,
  isPicUser,
  isPicEffective,
  selectedYear,
  selectedSpId,
  spreadsheets,
  activeSpreadsheet,
  dirtyCount,
  saving,
  headerRightSlot,
  onOpenUploadModal,
  onSave,
  onExportExcel,
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {isRekapBalaiView
              ? "Tabel File Rekap Balai"
              : isKabalai
                ? "Dokumen Lembar Kerja RHPK"
                : "Entry Data RHPK"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {isKabalai
              ? isRekapBalaiView
                ? "Tinjau seluruh sheet file Rekap Data RHPK Balai dalam mode baca-saja."
                : isTuView
                  ? "Tinjau seluruh dokumen lembar kerja IKSK dan detail capaian bulanan dalam mode baca."
                  : "Akses monitoring eksekutif Kepala Balai untuk meninjau seluruh dokumen lembar kerja IKSK 1 s.d. 28."
              : isPicUser
                ? "Pengisian data capaian target dan indikator bulanan seluruh file dokumen RHPK."
                : "Pengisian data capaian target dan indikator kegiatan bulanan Katim."}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-slate-600">
            <span className="font-semibold text-[#005baa]">
              {isKabalai
                ? isRekapBalaiView
                  ? "Mode Katim · Baca-Saja (File Rekap Balai)"
                  : isTuView
                    ? "Mode Tata Usaha · Hanya Baca"
                    : "Mode Kepala Balai · Hanya Baca"
                : isPicUser
                  ? "Mode PIC / Admin · Akses Penuh"
                  : "Mode Katim · IKSK Ampuan"}
            </span>
            <span className="text-slate-300">·</span>
            <span>Tahun {selectedYear}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {headerRightSlot}

          {/* Tombol Unggah / Import Excel (Khusus Katim / PIC) */}
          {!isKabalai &&
            selectedSpId &&
            (isPicUser ||
              !spreadsheets.find((s) => s.id === selectedSpId)?.is_readonly) && (
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                title="Unggah / Import data dari file Excel (.xlsx)"
              >
                <Icon
                  icon="solar:file-smile-linear"
                  width={15}
                  className="text-[#005baa]"
                />
                <span>Unggah Excel</span>
              </button>
            )}

          {isKabalai ? null : spreadsheets.find((s) => s.id === selectedSpId)
              ?.is_readonly && !isPicEffective ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800">
              <Icon
                icon="solar:eye-bold"
                width={15}
                className="text-amber-600"
              />
              <span>Mode Baca (Master Rekap Balai)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={saving || dirtyCount === 0}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer ${
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
                    Simpan Perubahan {dirtyCount > 0 ? `(${dirtyCount})` : ""}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Tombol Unduh Excel RHPK dengan Tanda Tangan Kabalai (Point 3) */}
          {activeSpreadsheet && (
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setShowExportDropdown((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition cursor-pointer"
                title="Unduh file Excel dokumen RHPK lengkap dengan format Tanda Tangan Kabalai"
              >
                <Icon
                  icon="solar:file-download-bold"
                  width={16}
                  className="text-emerald-600"
                />
                <span>Unduh Excel (RHPK)</span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  width={14}
                  className="text-slate-400"
                />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                    PILIH PERIODE UNDUH (RHPK)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportDropdown(false);
                      onExportExcel("locked");
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex flex-col gap-0.5 transition cursor-pointer"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Icon
                        icon="solar:lock-keyhole-bold"
                        width={13}
                        className="text-amber-500"
                      />
                      <span>Bulan Terkunci (Final)</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Khusus bulan final terkunci + Tanda Tangan Kabalai
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportDropdown(false);
                      onExportExcel("all");
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg flex flex-col gap-0.5 transition cursor-pointer"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Icon
                        icon="solar:calendar-bold"
                        width={13}
                        className="text-blue-500"
                      />
                      <span>Semua Bulan (1 - 12)</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Unduh seluruh 12 bulan + Tanda Tangan Kabalai
                    </span>
                  </button>
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
