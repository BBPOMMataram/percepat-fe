"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { YearItem, IkskItem, SpreadsheetItem } from "../types/tableTypes";

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
}

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

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
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#005baa] focus:border-emerald-600 focus:bg-white focus:outline-none cursor-pointer"
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
                  className="rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:bg-white focus:outline-none max-w-xs md:max-w-sm truncate cursor-pointer"
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
                    <div
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-xs font-semibold text-slate-800 max-w-xs md:max-w-md truncate shadow-2xs"
                      title={spreadsheets[0].name}
                    >
                      <Icon
                        icon="solar:file-spreadsheet-bold"
                        width={16}
                        className="text-emerald-600 shrink-0"
                      />
                      <span className="truncate">{spreadsheets[0].name}</span>
                    </div>
                  ) : (
                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 italic">
                      Belum ada dokumen untuk IKSK ini
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Pilih Dokumen:
                  </label>
                  <select
                    value={selectedSpId ?? ""}
                    onChange={(e) => onSelectSpreadsheet(Number(e.target.value))}
                    className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:outline-none max-w-xs md:max-w-md truncate cursor-pointer shadow-2xs"
                  >
                    {spreadsheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {spreadsheets.find((s) => s.id === selectedSpId)?.is_readonly &&
                    !isPicEffective && (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                        <Icon icon="solar:lock-bold" width={11} />
                        Read-Only (Rekap Balai)
                      </span>
                    )}
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {spreadsheets.length} Dokumen
                  </span>
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
                <div
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-[#005baa] max-w-xs md:max-w-md truncate shadow-2xs"
                  title={spreadsheets[0]?.name || "REKAP DATA RHPK Mataram"}
                >
                  <Icon
                    icon="solar:file-spreadsheet-bold"
                    width={16}
                    className="text-[#005baa] shrink-0"
                  />
                  <span className="truncate">
                    {spreadsheets[0]?.name ||
                      `REKAP DATA RHPK ${selectedYear} Mataram`}
                  </span>
                </div>
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                  <Icon
                    icon="solar:lock-keyhole-minimalistic-bold"
                    width={11}
                  />
                  Baca-Saja
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
                    <option value="all">Semua Baris (28 IKSK + UPT)</option>
                    {assignedIkskIds.length > 0 && (
                      <option value="mine">
                        Hanya IKSK Ampuan Saya ({assignedIkskIds.length} IKSK)
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
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        Ampuan Saya ({assignedIkskIds.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <Icon
                    icon="solar:info-circle-linear"
                    width={14}
                    className="text-[#005baa]"
                  />
                  Filter per IKSK tersedia di sheet A. Capaian RAPK Mataram
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div>
            Bulan Berjalan:{" "}
            <strong className="text-slate-800">
              {currentMonth} ({MONTH_NAMES[currentMonth] || "Oktober"})
            </strong>
          </div>
          {isPicUser && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isCurrentMonthLocked
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <Icon
                  icon={
                    isCurrentMonthLocked
                      ? "solar:lock-bold"
                      : "solar:lock-unlocked-bold"
                  }
                  width={12}
                />
                {isCurrentMonthLocked
                  ? "Terkunci untuk Katim"
                  : "Terbuka untuk Katim"}
              </span>
              <button
                type="button"
                disabled={isTogglingLock}
                onClick={onToggleCurrentMonthLock}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  isCurrentMonthLocked
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-white hover:bg-red-50 text-red-600 border border-red-200"
                } disabled:opacity-50`}
              >
                <Icon
                  icon={
                    isTogglingLock
                      ? "solar:refresh-circle-linear"
                      : isCurrentMonthLocked
                        ? "solar:lock-unlocked-bold"
                        : "solar:lock-bold"
                  }
                  width={13}
                  className={isTogglingLock ? "animate-spin" : ""}
                />
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
      {selectedSpId && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {spreadsheets
            .find((s) => s.id === selectedSpId)
            ?.tabs?.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTab(t.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  selectedTabId === t.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
