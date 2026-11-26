"use client";

import React from "react";
import type { YearItem, IkskItem, SpreadsheetItem } from "../types/tableTypes";
import { STANDARD_MONTH_NAMES } from "../constants/tableConstants";

export interface TableSpreadsheetSelectorProps {
  selectedYear: number;
  years: YearItem[];
  isRekapBalaiView: boolean;
  selectedIkskId: number | null;
  iksks: IkskItem[];
  spreadsheets: SpreadsheetItem[];
  selectedSpId: number | null;
  isPicEffective: boolean;
  isCapaianRapkTab: boolean;
  rekapBalaiIkskFilter: string | number;
  assignedIkskIds: number[];
  currentMonth: number;
  isPicUser: boolean;
  isCurrentMonthLocked: boolean;
  isTogglingLock: boolean;
  selectedTabId: number | null;
  onSelectYear: (year: number) => void;
  onSelectIksk: (id: number) => void;
  onSelectSpreadsheet: (id: number) => void;
  onSelectTab: (id: number) => void;
  onToggleCurrentMonthLock: () => void;
  onFilterChange: (val: string | number) => void;
  /** Sembunyikan deretan tombol tab (dipakai saat hanya satu tab yang boleh dilihat). */
  hideTabButtons?: boolean;
}

export const TableSpreadsheetSelector: React.FC<TableSpreadsheetSelectorProps> = ({
  selectedYear,
  years,
  isRekapBalaiView,
  selectedIkskId,
  iksks,
  spreadsheets,
  selectedSpId,
  isPicEffective,
  isCapaianRapkTab,
  rekapBalaiIkskFilter,
  assignedIkskIds,
  currentMonth,
  isPicUser,
  isCurrentMonthLocked,
  isTogglingLock,
  selectedTabId,
  onSelectYear,
  onSelectIksk,
  onSelectSpreadsheet,
  onSelectTab,
  onToggleCurrentMonthLock,
  onFilterChange,
  hideTabButtons = false,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => onSelectYear(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#005baa] focus:border-[#005baa] focus:bg-white focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y.id} value={y.year_number}>
                  {y.year_number}
                </option>
              ))}
            </select>
          </div>

          {!isRekapBalaiView ? (
            <>
              {/* IKSK Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  IKSK:
                </label>
                <select
                  value={selectedIkskId ?? ""}
                  onChange={(e) => onSelectIksk(Number(e.target.value))}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none max-w-xs md:max-w-sm truncate cursor-pointer"
                >
                  {iksks.length === 0 ? (
                    <option value="">Tidak ada IKSK diampu</option>
                  ) : (
                    iksks.map((i) => (
                      <option key={i.id} value={i.id}>
                        IKSK {i.id}. {i.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Document Info / Selector */}
              {spreadsheets.length <= 1 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Dokumen:
                  </span>
                  {spreadsheets.length === 1 ? (
                    <span
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 max-w-xs md:max-w-md truncate"
                      title={spreadsheets[0].name}
                    >
                      {spreadsheets[0].name}
                    </span>
                  ) : (
                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 italic">
                      Belum ada dokumen untuk IKSK ini
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Dokumen:
                  </label>
                  <select
                    value={selectedSpId ?? ""}
                    onChange={(e) => onSelectSpreadsheet(Number(e.target.value))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none max-w-xs md:max-w-md truncate cursor-pointer"
                  >
                    {spreadsheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {spreadsheets.find((s) => s.id === selectedSpId)?.is_readonly &&
                    !isPicEffective && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Baca-saja
                      </span>
                    )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Info File Master Rekap Balai (Baca-Saja) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Dokumen:
                </span>
                <span
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 max-w-xs md:max-w-md truncate"
                  title={spreadsheets[0]?.name || ""}
                >
                  {spreadsheets[0]?.name || "-"}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Baca-saja
                </span>
              </div>

              {/* Filter IKSK pada sheet A. Capaian RAPK Mataram */}
              {isCapaianRapkTab ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Filter IKSK:
                  </label>
                  <select
                    value={
                      typeof rekapBalaiIkskFilter === "number"
                        ? String(rekapBalaiIkskFilter)
                        : rekapBalaiIkskFilter
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      onFilterChange(v === "all" || v === "mine" ? v : Number(v));
                    }}
                    className="rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-[#003d73] focus:border-[#005baa] focus:outline-none max-w-xs md:max-w-sm truncate shadow-2xs cursor-pointer"
                  >
                    <option value="all">Semua IKSK</option>
                    {assignedIkskIds.length > 0 && (
                      <option value="mine">
                        IKSK ampuan saya ({assignedIkskIds.length})
                      </option>
                    )}
                    {iksks.map((i) => (
                      <option key={i.id} value={i.id}>
                        IKSK {i.id}
                        {assignedIkskIds.includes(i.id) ? " (Ampuan)" : ""} —{" "}
                        {i.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onFilterChange("all")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                        rekapBalaiIkskFilter === "all"
                          ? "bg-[#005baa] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Semua
                    </button>
                    {assignedIkskIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onFilterChange(
                            rekapBalaiIkskFilter === "mine" ? "all" : "mine",
                          )
                        }
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                          rekapBalaiIkskFilter === "mine"
                            ? "bg-[#005baa] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Ampuan Saya ({assignedIkskIds.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Filter IKSK tersedia di tab A. Capaian RAPK Mataram
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div>
            Bulan berjalan:{" "}
            <strong className="text-slate-800">
              {STANDARD_MONTH_NAMES[currentMonth - 1] ?? currentMonth}
            </strong>
          </div>
          {isPicUser && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isCurrentMonthLocked
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-[#004281] border border-blue-200"
                }`}
              >
                {isCurrentMonthLocked
                  ? "Terkunci untuk Katim"
                  : "Terbuka untuk Katim"}
              </span>
              <button
                type="button"
                disabled={isTogglingLock}
                onClick={onToggleCurrentMonthLock}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isCurrentMonthLocked
                    ? "bg-[#005baa] hover:bg-[#004281] text-white"
                    : "bg-white hover:bg-red-50 text-red-600 border border-red-200"
                } disabled:opacity-50`}
              >
                <span>
                  {isTogglingLock
                    ? "Menyimpan..."
                    : isCurrentMonthLocked
                      ? "Buka Akses Katim"
                      : "Kunci Akses Katim"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Buttons */}
      {selectedSpId && !hideTabButtons && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {spreadsheets
            .find((s) => s.id === selectedSpId)
            ?.tabs?.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTab(t.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedTabId === t.id
                    ? "bg-[#005baa] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#005baa]"
                }`}
              >
                {t.title}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default TableSpreadsheetSelector;
