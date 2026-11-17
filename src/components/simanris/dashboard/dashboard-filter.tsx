"use client";

import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { MasterOptionsData, SimanrisDashboardFilters } from "../types";

interface DashboardFilterProps {
  options: MasterOptionsData | null;
  filters: SimanrisDashboardFilters;
  onChange: (next: SimanrisDashboardFilters) => void;
  onReset: () => void;
}

export function DashboardFilter({
  options,
  filters,
  onChange,
  onReset,
}: DashboardFilterProps) {
  const update = (patch: Partial<SimanrisDashboardFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const hasSubFilters = Boolean(
    filters.function_id ||
      filters.risk_category_id ||
      filters.risk_source ||
      filters.inherent_level ||
      filters.residual_level ||
      filters.search
  );

  const selectedFunction = options?.functions.find(
    (f) => f.id === Number(filters.function_id)
  );
  const selectedCategory = options?.categories.find(
    (c) => c.id === Number(filters.risk_category_id)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <SlidersHorizontal className="h-4 w-4 text-[#005baa]" />
          Filter Global Dashboard & Tabel
        </div>
        {hasSubFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Periode Semester
          </label>
          <select
            value={filters.period_id ?? ""}
            onChange={(e) =>
              update({
                period_id: e.target.value ? Number(e.target.value) : "",
                batch_id: "",
              })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
          >
            <option value="">Otomatis (Periode Aktif Terbaru)</option>
            {options?.periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.period_name}
                {p.active_import_batch_id ? " (Dataset Aktif)" : " (Kosong)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Fungsi / Unit
          </label>
          <select
            value={filters.function_id ?? ""}
            onChange={(e) =>
              update({
                function_id: e.target.value ? Number(e.target.value) : "",
              })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
          >
            <option value="">Semua Fungsi</option>
            {options?.functions.map((fn) => (
              <option key={fn.id} value={fn.id}>
                {fn.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Kategori Risiko
          </label>
          <select
            value={filters.risk_category_id ?? ""}
            onChange={(e) =>
              update({
                risk_category_id: e.target.value ? Number(e.target.value) : "",
              })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            {options?.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.code} — {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Sumber Risiko
          </label>
          <select
            value={filters.risk_source ?? ""}
            onChange={(e) => update({ risk_source: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
          >
            <option value="">Semua Sumber</option>
            <option value="Internal">Internal</option>
            <option value="Eksternal">Eksternal</option>
            <option value="Internal & Eksternal">Internal &amp; Eksternal</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Filter Level Residual
          </label>
          <select
            value={filters.residual_level ?? ""}
            onChange={(e) => update({ residual_level: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
          >
            <option value="">Semua Level Residual</option>
            <option value="high">Hanya Risiko Tinggi (≥ Batas High)</option>
            {[25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(
              (lvl) => (
                <option key={lvl} value={String(lvl)}>
                  Level Tepat = {lvl}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Pencarian Kata Kunci
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={filters.search ?? ""}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Kode, risk event, penyebab..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#005baa] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {hasSubFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          <span className="text-slate-500 font-medium">Drill-down aktif:</span>
          {selectedFunction && (
            <button
              type="button"
              onClick={() => update({ function_id: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-[#005baa] hover:bg-blue-100"
            >
              Fungsi: {selectedFunction.name}
              <X className="h-3 w-3" />
            </button>
          )}
          {selectedCategory && (
            <button
              type="button"
              onClick={() => update({ risk_category_id: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-[#005baa] hover:bg-blue-100"
            >
              Kategori: {selectedCategory.name}
              <X className="h-3 w-3" />
            </button>
          )}
          {filters.risk_source && (
            <button
              type="button"
              onClick={() => update({ risk_source: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Sumber: {filters.risk_source}
              <X className="h-3 w-3" />
            </button>
          )}
          {filters.inherent_level && (
            <button
              type="button"
              onClick={() => update({ inherent_level: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-800 hover:bg-amber-100"
            >
              Inheren: {filters.inherent_level}
              <X className="h-3 w-3" />
            </button>
          )}
          {filters.residual_level && (
            <button
              type="button"
              onClick={() => update({ residual_level: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 font-semibold text-red-700 hover:bg-red-100"
            >
              Residual: {filters.residual_level}
              <X className="h-3 w-3" />
            </button>
          )}
          {filters.search && (
            <button
              type="button"
              onClick={() => update({ search: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700 hover:bg-slate-200"
            >
              Cari: &ldquo;{filters.search}&rdquo;
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
