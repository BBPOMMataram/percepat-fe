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
  isMultiIndicatorSheet: boolean;
  matchedIndicatorParent: string | null;
  headerGroups: HeaderGroup[];
  focusSelectedIksk: boolean;
  displayedColumnsSchema: ColumnSchema[];
  effectiveColumnsSchema: ColumnSchema[];
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
  isMultiIndicatorSheet,
  matchedIndicatorParent,
  headerGroups,
  focusSelectedIksk,
  displayedColumnsSchema,
  effectiveColumnsSchema,
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

  return (
    <>
      {/* Top Control Bar: Search, Filter Bulan & Navigasi Halaman Cepat */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-4 space-y-3">
        {/* Row 1: Filter Bulan Pills & Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {availableMonths.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Icon
                  icon="solar:calendar-bold"
                  width={14}
                  className="text-emerald-600"
                />
                Filter Bulan:
              </span>
              <button
                type="button"
                onClick={() => onSelectMonthFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                  selectedMonthFilter === "all"
                    ? "bg-emerald-600 text-white shadow-emerald-600/20"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Semua Bulan ({rawRowsCount})
              </button>
              {availableMonths.map((m) => {
                const isSelected =
                  selectedMonthFilter.toLowerCase() === m.name.toLowerCase();
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => onSelectMonthFilter(m.name)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-emerald-600/20"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {m.name} ({m.count})
                  </button>
                );
              })}
            </div>
          ) : (
            <div />
          )}

          {/* Tombol Aksi Tabel Vertikal: Tambah Baris */}
          {!isHorizontalMonthTable &&
            !spreadsheets.find((s) => s.id === selectedSpId)?.is_readonly && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {/* Tombol Hapus Baris Terakhir (Khusus PIC) */}
                {isPicEffective &&
                  activeTab?.rows_data &&
                  activeTab.rows_data.length > 0 && (
                    <button
                      type="button"
                      onClick={onDeleteLastRow}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 shadow-2xs cursor-pointer"
                      title="Hapus baris paling akhir/bawah dari tabel ini"
                    >
                      <Icon
                        icon="solar:trash-bin-trash-bold"
                        width={14}
                        className="text-rose-600"
                      />
                      <span>Hapus Baris Terakhir</span>
                    </button>
                  )}
                {/* Tombol Tambah Baris */}
                <button
                  type="button"
                  onClick={onAddRow}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-2xs cursor-pointer"
                  title="Tambah baris kegiatan baru pada bulan ini (urutan paling atas)"
                >
                  <Icon
                    icon="solar:add-circle-bold"
                    width={15}
                    className="text-emerald-700"
                  />
                  <span>
                    + Tambah Baris{" "}
                    {selectedMonthFilter !== "all"
                      ? `(${selectedMonthFilter})`
                      : ""}
                  </span>
                </button>
              </div>
            )}
        </div>

        {/* Row 2: Search input + Info baris + Top Pagination Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Icon
              icon="solar:magnifer-linear"
              width={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari di tabel (topik, akun, judul, dll)..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" width={14} />
              </button>
            )}
          </div>

          {/* Right: Info, Page Size, Navigation */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan{" "}
                <span className="font-bold text-slate-900">
                  {totalRows === 0
                    ? 0
                    : (safeCurrentPage - 1) * (pageSize || 1) + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(safeCurrentPage * (pageSize || 1), totalRows)}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-slate-900">{totalRows}</span>{" "}
                baris
                {selectedMonthFilter !== "all" && (
                  <span className="ml-1 text-emerald-700 font-semibold">
                    ({selectedMonthFilter})
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1.5 ml-1 border-l border-slate-300 pl-3">
                <span className="text-[11px] text-slate-500">Per Hal:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    onPageSizeChange(Number(e.target.value));
                    if (onScrollToTop) onScrollToTop();
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={0}>Semua ({totalRows})</option>
                </select>
              </div>
            </div>

            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => handlePageSelect(1)}
                  disabled={safeCurrentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  title="Halaman Pertama"
                >
                  <Icon icon="solar:double-alt-arrow-left-linear" width={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageSelect(Math.max(safeCurrentPage - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <Icon icon="solar:alt-arrow-left-linear" width={14} />
                </button>

                <span className="px-2 font-bold text-xs text-slate-700">
                  Hal {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handlePageSelect(Math.min(safeCurrentPage + 1, totalPages))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <Icon icon="solar:alt-arrow-right-linear" width={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageSelect(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  title="Halaman Terakhir"
                >
                  <Icon icon="solar:double-alt-arrow-right-linear" width={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keterangan Status & Petunjuk Pengisian */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-5 border-b border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Icon
              icon="solar:info-circle-bold"
              width={13}
              className="text-[#005baa]"
            />
            Keterangan:
          </span>
          <div
            className="flex items-center gap-1.5"
            title="Kolom bertanda dot hijau adalah kolom yang berhak Anda isi"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
            <span className="text-emerald-800 font-bold">
              Dot Hijau: Bisa di Edit
            </span>
          </div>
          <div
            className="flex items-center gap-1.5"
            title="Baris pada periode ini sudah memiliki data terisi"
          >
            <Icon
              icon="solar:check-circle-bold"
              width={14}
              className="text-emerald-600 shrink-0"
            />
            <span className="text-slate-600 font-medium">Sudah diisi</span>
          </div>
          <div
            className="flex items-center gap-1.5"
            title="Baris pada periode ini belum memiliki data"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-slate-300 ring-2 ring-slate-100 shrink-0" />
            <span className="text-slate-500 font-medium">Belum diisi</span>
          </div>

          {/* Penjelasan tanda ∑ (Akumulasi) vs tanpa ∑ */}
          <div
            className="flex items-center gap-1.5"
            title="Perbedaan kolom dengan penanda akumulasi (∑) dan tanpa akumulasi"
          >
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-blue-100 font-mono text-[10px] font-black text-blue-800 border border-blue-200 shrink-0">
              ∑
            </span>
            <span className="text-slate-700 font-medium">
              <strong className="text-slate-900">∑ (Akumulasi):</strong> Cukup
              input angka bulanan, sistem otomatis menjumlahkan.
            </span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-200/90 font-mono text-[10px] font-bold text-slate-800 border border-slate-300 shrink-0 ml-1.5">
              Tanpa ∑
            </span>
            <span className="text-slate-700 font-medium">
              <strong className="text-slate-900">Tanpa ∑:</strong> Input angka
              final kalkulasi.
            </span>
          </div>

          {/* Tombol Lihat (Multi-Katim / Mode Hanya Lihat) */}
          <div
            className="flex items-center gap-1.5"
            title="Tombol untuk melihat rincian pengisi antar-katim atau membuka data saat periode terkunci"
          >
            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
              <Icon
                icon="solar:eye-bold"
                width={12}
                className="text-indigo-600"
              />
              Lihat
            </span>
            <span className="text-slate-600 font-medium">
              Rincian kontributor / mode lihat saat periode terkunci
            </span>
          </div>
        </div>
      </div>

      {/* Banner Mode Multi-Indikator */}
      {isMultiIndicatorSheet && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/60 p-3.5 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#005baa] text-white shrink-0 shadow-xs">
              <Icon icon="solar:filter-bold-duotone" width={18} />
            </div>
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span>
                  Dokumen Gabungan RHPK Balai (13 Indikator Terpadu)
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                  61 Kolom
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                <span>Pilih Fokus Indikator:</span>
                <select
                  value={matchedIndicatorParent || ""}
                  onChange={(e) => {
                    onOverrideIndicatorParent(e.target.value);
                    onSetFocusSelectedIksk(true);
                  }}
                  className="rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs font-semibold text-[#005baa] shadow-2xs focus:border-[#005baa] focus:outline-hidden cursor-pointer"
                >
                  {headerGroups
                    ?.map((g) => g.parent)
                    .filter((p): p is string =>
                      Boolean(p && getMonthNumberFromText(p) === null),
                    )
                    .map((p, pIdx) => (
                      <option key={pIdx} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
                {focusSelectedIksk && (
                  <span className="text-emerald-700 font-medium">
                    ({displayedColumnsSchema.length} Kolom aktif termasuk
                    Identitas Unit & Bulan)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetFocusSelectedIksk(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs shadow-2xs cursor-pointer ${
                focusSelectedIksk
                  ? "bg-[#005baa] text-white ring-2 ring-blue-300"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon
                icon="solar:check-circle-bold"
                width={14}
                className={focusSelectedIksk ? "text-white" : "text-slate-400"}
              />
              <span>Fokus 1 Indikator</span>
            </button>
            <button
              type="button"
              onClick={() => onSetFocusSelectedIksk(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs shadow-2xs cursor-pointer ${
                !focusSelectedIksk
                  ? "bg-[#005baa] text-white ring-2 ring-blue-300"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon
                icon="solar:layers-bold"
                width={14}
                className={!focusSelectedIksk ? "text-white" : "text-slate-400"}
              />
              <span>
                Tampilkan Seluruh 13 Indikator ({effectiveColumnsSchema.length}{" "}
                Kolom)
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TableControlBar;
