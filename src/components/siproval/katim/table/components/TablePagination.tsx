"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { getPageNumbers } from "../utils/tableFormatting";
import { PAGE_SIZE_ALL, PAGE_SIZE_OPTIONS } from "../constants/tableConstants";

export interface TablePaginationProps {
  isPaginationNeeded: boolean;
  totalRows: number;
  safeCurrentPage: number;
  pageSize: number;
  totalPages: number;
  /** Nomor baris pertama & terakhir yang ditampilkan (dari computePagination). */
  rangeStart: number;
  rangeEnd: number;
  selectedMonthFilter: string;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onScrollToTop?: () => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  isPaginationNeeded,
  totalRows,
  safeCurrentPage,
  pageSize,
  totalPages,
  rangeStart,
  rangeEnd,
  selectedMonthFilter,
  onPageSizeChange,
  onPageChange,
  onScrollToTop,
}) => {
  if (!isPaginationNeeded) return null;

  const handlePageSelect = (page: number) => {
    onPageChange(page);
    if (onScrollToTop) onScrollToTop();
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-5 py-3.5 rounded-b-2xl">
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span>
          Menampilkan{" "}
          <span className="font-bold text-slate-900">{rangeStart}</span>{" "}
          -{" "}
          <span className="font-bold text-slate-900">{rangeEnd}</span>{" "}
          dari{" "}
          <span className="font-bold text-slate-900">{totalRows}</span> baris
          {selectedMonthFilter !== "all" && (
            <span className="ml-1 text-[#005baa] font-semibold">
              ({selectedMonthFilter})
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[11px] text-slate-500">Baris:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              if (onScrollToTop) onScrollToTop();
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#005baa] focus:outline-none cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
            <option value={PAGE_SIZE_ALL}>Semua ({totalRows})</option>
          </select>
        </div>
      </div>

      {pageSize !== PAGE_SIZE_ALL && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePageSelect(1)}
            disabled={safeCurrentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            title="Halaman Pertama"
          >
            <Icon icon="solar:double-alt-arrow-left-linear" width={16} />
          </button>
          <button
            type="button"
            onClick={() => handlePageSelect(Math.max(safeCurrentPage - 1, 1))}
            disabled={safeCurrentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} />
          </button>

          <div className="flex items-center gap-1 px-1">
            {getPageNumbers(safeCurrentPage, totalPages).map((p, pIdx) =>
              p === "..." ? (
                <span
                  key={`dots-${pIdx}`}
                  className="px-1 text-xs text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}-${pIdx}`}
                  type="button"
                  onClick={() => handlePageSelect(Number(p))}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                    safeCurrentPage === Number(p)
                      ? "bg-[#005baa] text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              handlePageSelect(Math.min(safeCurrentPage + 1, totalPages))
            }
            disabled={safeCurrentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            title="Halaman Selanjutnya"
          >
            <Icon icon="solar:alt-arrow-right-linear" width={16} />
          </button>
          <button
            type="button"
            onClick={() => handlePageSelect(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            title="Halaman Terakhir"
          >
            <Icon icon="solar:double-alt-arrow-right-linear" width={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TablePagination;
