"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type {
  ActiveTabDetail,
  SpreadsheetItem,
  HeaderGroup,
  ColumnSchema,
} from "../types/tableTypes";
import { getMonthNumberFromText } from "../utils/tableFormatting";
import { PAGE_SIZE_ALL, PAGE_SIZE_OPTIONS } from "../constants/tableConstants";

export interface TableControlBarProps {
  activeTab: ActiveTabDetail | null;
  availableMonths: Array<{ name: string; count: number }>;
  selectedMonthFilter: string;
  rawRowsCount: number;
  isHorizontalMonthTable: boolean;
  spreadsheets: SpreadsheetItem[];
  selectedSpId: number | null;
  isPicEffective: boolean;
  searchQuery: string;
  totalRows: number;
  safeCurrentPage: number;
  pageSize: number;
  totalPages: number;
  /** false = baris sedikit: kontrol halaman disembunyikan, semua baris tampil. */
  isPaginationEnabled: boolean;
  rangeStart: number;
  rangeEnd: number;
  isMultiIndicatorSheet: boolean;
  matchedIndicatorParent: string | null;
  headerGroups: HeaderGroup[];
  focusSelectedIksk: boolean;
  displayedColumnsSchema: ColumnSchema[];
  effectiveColumnsSchema: ColumnSchema[];
  /** Mode baca-saja (mis. Kabalai): sembunyikan keterangan "Bisa diisi". */
  isReadOnly?: boolean;
  onSelectMonthFilter: (m: string) => void;
  onAddRow: () => void;
  onDeleteLastRow: () => void;
  onSearchChange: (q: string) => void;
  onPageSizeChange: (size: number) => void;
  onPageChange: (p: number) => void;
  onOverrideIndicatorParent: (parent: string) => void;
  onSetFocusSelectedIksk: (focus: boolean) => void;
  onScrollToTop?: () => void;
}

const navBtn =
  "flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";

export const TableControlBar: React.FC<TableControlBarProps> = ({
  activeTab,
  availableMonths,
  selectedMonthFilter,
  rawRowsCount,
  isHorizontalMonthTable,
  spreadsheets,
  selectedSpId,
  isPicEffective,
  searchQuery,
  totalRows,
  safeCurrentPage,
  pageSize,
  totalPages,
  isPaginationEnabled,
  rangeStart,
  rangeEnd,
  isMultiIndicatorSheet,
  matchedIndicatorParent,
  headerGroups,
  focusSelectedIksk,
  displayedColumnsSchema,
  effectiveColumnsSchema,
  isReadOnly = false,
  onSelectMonthFilter,
  onAddRow,
  onDeleteLastRow,
  onSearchChange,
  onPageSizeChange,
  onPageChange,
  onOverrideIndicatorParent,
  onSetFocusSelectedIksk,
  onScrollToTop,
}) => {
  if (!activeTab) return null;

  const handlePageSelect = (page: number) => {
    onPageChange(page);
    if (onScrollToTop) onScrollToTop();
  };

  // Daftar indikator pada file gabungan (header induk yang bukan nama bulan).
  const indicatorOptions = (headerGroups || [])
    .map((g) => g.parent)
    .filter((p): p is string =>
      Boolean(p && getMonthNumberFromText(p) === null),
    );

  const canEditRows =
    !isHorizontalMonthTable &&
    !spreadsheets.find((s) => s.id === selectedSpId)?.is_readonly;

  const segBtn = (active: boolean) =>
    `px-3 py-1 text-xs font-semibold transition cursor-pointer ${
      active
        ? "bg-[#005baa] text-white"
        : "bg-white text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <>
      {/* Pilihan indikator — hanya untuk file gabungan */}
      {isMultiIndicatorSheet && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-4 py-3 text-xs">
          <span className="font-semibold text-slate-700">
            File gabungan · {indicatorOptions.length} indikator
          </span>
          <label className="flex items-center gap-2 text-slate-500">
            Indikator
            <select
              value={matchedIndicatorParent || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                onOverrideIndicatorParent(e.target.value);
                onSetFocusSelectedIksk(true);
              }}
              className="max-w-[22rem] truncate rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-hidden cursor-pointer"
            >
              {indicatorOptions.map((p, pIdx) => (
                <option key={pIdx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 divide-x divide-slate-300">
            <button
              type="button"
              onClick={() => onSetFocusSelectedIksk(true)}
              className={segBtn(focusSelectedIksk)}
              aria-pressed={focusSelectedIksk}
            >
              Satu indikator
            </button>
            <button
              type="button"
              onClick={() => onSetFocusSelectedIksk(false)}
              className={segBtn(!focusSelectedIksk)}
              aria-pressed={!focusSelectedIksk}
            >
              Semua indikator
            </button>
          </div>
          <span className="text-slate-400">
            {focusSelectedIksk
              ? displayedColumnsSchema.length
              : effectiveColumnsSchema.length}{" "}
            kolom
          </span>
        </div>
      )}

      {/* Toolbar: bulan, cari, halaman, tambah baris */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-xs">
        {availableMonths.length > 1 && (
          <label className="flex items-center gap-2 text-slate-500">
            Bulan
            <select
              value={selectedMonthFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSelectMonthFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none cursor-pointer"
            >
              <option value="all">Semua bulan ({rawRowsCount})</option>
              {availableMonths.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.count})
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="relative w-full max-w-xs sm:w-64">
          <Icon
            icon="solar:magnifer-linear"
            width={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            placeholder="Cari di tabel..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:ring-1 focus:ring-[#005baa] focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon icon="solar:close-circle-bold" width={14} />
            </button>
          )}
        </div>

        <span className="text-slate-500">
          {isPaginationEnabled && (
            <>
              {rangeStart}–{rangeEnd} dari{" "}
            </>
          )}
          <span className="font-semibold text-slate-800">{totalRows}</span>{" "}
          baris
        </span>

        {isPaginationEnabled && (
          <select
            value={pageSize}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              onPageSizeChange(Number(e.target.value));
              if (onScrollToTop) onScrollToTop();
            }}
            aria-label="Baris per halaman"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-[#005baa] focus:outline-none cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / hal
              </option>
            ))}
            <option value={PAGE_SIZE_ALL}>Semua</option>
          </select>
        )}

        {isPaginationEnabled && pageSize !== PAGE_SIZE_ALL && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageSelect(1)}
              disabled={safeCurrentPage === 1}
              className={navBtn}
              title="Halaman pertama"
            >
              <Icon icon="solar:double-alt-arrow-left-linear" width={14} />
            </button>
            <button
              type="button"
              onClick={() => handlePageSelect(Math.max(safeCurrentPage - 1, 1))}
              disabled={safeCurrentPage === 1}
              className={navBtn}
              title="Halaman sebelumnya"
            >
              <Icon icon="solar:alt-arrow-left-linear" width={14} />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                handlePageSelect(Math.min(safeCurrentPage + 1, totalPages))
              }
              disabled={safeCurrentPage === totalPages}
              className={navBtn}
              title="Halaman berikutnya"
            >
              <Icon icon="solar:alt-arrow-right-linear" width={14} />
            </button>
            <button
              type="button"
              onClick={() => handlePageSelect(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className={navBtn}
              title="Halaman terakhir"
            >
              <Icon icon="solar:double-alt-arrow-right-linear" width={14} />
            </button>
          </div>
        )}

        {canEditRows && (
          <div className="ml-auto flex items-center gap-2">
            {isPicEffective &&
              activeTab?.rows_data &&
              activeTab.rows_data.length > 0 && (
                <button
                  type="button"
                  onClick={onDeleteLastRow}
                  className="rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 cursor-pointer"
                  title="Hapus baris paling bawah dari tabel ini"
                >
                  Hapus Baris Terakhir
                </button>
              )}
            <button
              type="button"
              onClick={onAddRow}
              className="rounded-lg bg-[#005baa] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#004281] cursor-pointer"
              title="Tambah baris baru di paling atas"
            >
              + Tambah Baris
              {selectedMonthFilter !== "all" ? ` (${selectedMonthFilter})` : ""}
            </button>
          </div>
        )}
      </div>

      {/* Keterangan — satu baris, singkat. Detail ada di tooltip. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-600">
        {!isReadOnly && (
          <span
            className="flex items-center gap-1.5"
            title="Kolom bertanda titik hijau adalah kolom yang boleh Anda isi"
          >
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            Editable (bisa Anda isi)
          </span>
        )}
        <span
          className="flex items-center gap-1.5"
          title="Kolom milik PIC lain atau dilindungi sistem"
        >
          <Icon icon="solar:lock-bold" width={12} className="text-slate-400" />
          Terkunci
        </span>
        <span
          className="flex items-center gap-1.5"
          title="Nilai dihitung otomatis dari rumus"
        >
          <span className="rounded bg-purple-100 px-1 text-[9px] font-bold text-purple-800">
            Formula
          </span>
          Otomatis
        </span>
        <span
          className="flex items-center gap-1.5"
          title="Isi angka bulan ini saja, sistem menjumlahkan dengan bulan sebelumnya"
        >
          <span className="rounded border border-blue-200 bg-blue-100 px-1 font-mono text-[9px] font-black text-blue-800">
            ∑
          </span>
          Isi angka bulan ini saja
        </span>
        <span
          className="flex items-center gap-1.5"
          title="Kolom tanpa tanda ∑: isi nilai akhir (sudah dihitung)"
        >
          Tanpa ∑: isi nilai akhir
        </span>
        <span
          className="flex items-center gap-1.5"
          title="Baris pada periode ini sudah ada datanya"
        >
          <Icon
            icon="solar:check-circle-bold"
            width={13}
            className="shrink-0 text-emerald-600"
          />
          Sudah diisi
        </span>
        <span
          className="flex items-center gap-1.5"
          title="Baris pada periode ini belum ada datanya"
        >
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-300" />
          Belum diisi
        </span>
        <span
          className="flex items-center gap-1.5"
          title="Klik Lihat pada sel untuk melihat rincian pengisi antar-Katim, atau data saat periode terkunci"
        >
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500">
            <Icon icon="solar:pen-new-square-bold" width={11} />
            Lihat
          </span>
          Rincian pengisi
        </span>
      </div>
    </>
  );
};

export default TableControlBar;
