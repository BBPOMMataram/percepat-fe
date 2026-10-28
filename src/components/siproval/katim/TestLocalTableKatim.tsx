"use client";

import { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

type TabItem = {
  id: number;
  spreadsheet_id: number;
  title: string;
};

type SpreadsheetItem = {
  id: number;
  name: string;
  year: number;
  tabs: TabItem[];
};

type ColumnSchema = {
  key: string;
  col_letter: string;
  label: string;
  type: "readonly" | "editable" | "formula";
  formula: string | null;
  can_edit: boolean;
};

type RowData = {
  row_index?: number;
  month?: number;
  month_name?: string;
  is_locked: boolean;
  is_current: boolean;
  can_edit_row?: boolean;
  pic_name?: string;
  cells: Record<string, any>;
};

type ActiveTabDetail = {
  id: number;
  title: string;
  columns_schema: ColumnSchema[];
  rows_data: RowData[];
};

type YearItem = {
  id: number;
  year_number: number;
  desc?: string;
};

type IkskItem = {
  id: number;
  name: string;
};

export default function TestLocalTableKatim() {
  const { user } = useSelector((state: RootState) => state.auth);
  const authQuery = user?.id ? `?user_id=${user.id}` : "";

  const [years, setYears] = useState<YearItem[]>([{ id: 1, year_number: 2026 }]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [iksks, setIksks] = useState<IkskItem[]>([]);
  const [selectedIkskId, setSelectedIkskId] = useState<number | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [selectedSpId, setSelectedSpId] = useState<number | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabDetail | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Tracking dirty edits before saving
  const [dirtyUpdates, setDirtyUpdates] = useState<
    Record<string, { month: number; key: string; value: any }>
  >({});

  const fetchData = async (
    targetYear = selectedYear,
    ikskId?: number | null,
    spId?: number | null,
    tId?: number | null
  ) => {
    setLoading(true);
    try {
      const qYear = `&year=${targetYear}`;
      const effectiveIkskId = ikskId !== undefined ? ikskId : selectedIkskId;
      const qIksk = effectiveIkskId ? `&iksk_id=${effectiveIkskId}` : "";
      const qSp = spId ? `&spreadsheet_id=${spId}` : "";
      const qTab = tId ? `&tab_id=${tId}` : "";
      const res = await api.get(
        `${baseUrl}/api/test-local-table${authQuery}${qYear}${qIksk}${qSp}${qTab}`
      );
      const d = res.data?.data || {};

      if (Array.isArray(d.years) && d.years.length > 0) {
        setYears(d.years);
      }
      if (d.selected_year) {
        setSelectedYear(Number(d.selected_year));
      }
      if (Array.isArray(d.my_iksks)) {
        setIksks(d.my_iksks);
      }
      if (d.selected_iksk_id) {
        setSelectedIkskId(Number(d.selected_iksk_id));
      }
      setSpreadsheets(d.spreadsheets || []);
      setCurrentMonth(d.current_month || new Date().getMonth() + 1);

      if (d.active_spreadsheet) {
        setSelectedSpId(d.active_spreadsheet.id);
      } else {
        setSelectedSpId(null);
      }

      if (d.active_tab) {
        setSelectedTabId(d.active_tab.id);
        setActiveTab(d.active_tab);
      } else {
        setSelectedTabId(null);
        setActiveTab(null);
      }
      setDirtyUpdates({});
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal memuat formulir tabel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData(selectedYear);
    }
  }, [user?.id, selectedYear]);

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    fetchData(year, selectedIkskId);
  };

  const handleSelectIksk = (ikskId: number) => {
    setSelectedIkskId(ikskId);
    setSelectedSpId(null);
    setSelectedTabId(null);
    fetchData(selectedYear, ikskId, null, null);
  };

  const handleSelectSpreadsheet = (id: number) => {
    setSelectedSpId(id);
    fetchData(selectedYear, selectedIkskId, id);
  };

  const handleSelectTab = (tId: number) => {
    setSelectedTabId(tId);
    if (selectedSpId) {
      fetchData(selectedYear, selectedIkskId, selectedSpId, tId);
    }
  };

  // Handle cell edit lokal
  const handleCellChange = (month: number, colKey: string, val: string) => {
    if (!activeTab) return;

    // Convert numeric if possible
    const parsedVal = val === "" ? "" : isNaN(Number(val)) ? val : Number(val);

    // Update state activeTab lokal
    setActiveTab((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows_data: prev.rows_data.map((r) => {
          if (r.month === month) {
            return {
              ...r,
              cells: {
                ...r.cells,
                [colKey]: parsedVal,
              },
            };
          }
          return r;
        }),
      };
    });

    // Catat ke dirtyUpdates
    const updateKey = `${month}_${colKey}`;
    setDirtyUpdates((prev) => ({
      ...prev,
      [updateKey]: {
        month,
        key: colKey,
        value: parsedVal,
      },
    }));
  };

  // Kirim data ke backend lokal
  const handleSave = async () => {
    if (!activeTab) return;
    const updatesList = Object.values(dirtyUpdates);
    if (updatesList.length === 0) {
      setSuccessMsg("Tidak ada perubahan yang perlu disimpan.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.post(
        `${baseUrl}/api/test-local-table/tab/${activeTab.id}/update${authQuery}`,
        { updates: updatesList }
      );
      setSuccessMsg(res.data?.message || "Data berhasil disimpan.");
      setDirtyUpdates({});

      if (res.data?.data?.rows_data) {
        setActiveTab((prev) =>
          prev ? { ...prev, rows_data: res.data.data.rows_data } : prev
        );
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = Object.keys(dirtyUpdates).length;

  // Pastikan tabel yang belum memiliki konfigurasi tetap menampilkan seluruh kolom
  const effectiveColumnsSchema = useMemo<ColumnSchema[]>(() => {
    if (activeTab?.columns_schema && activeTab.columns_schema.length > 0) {
      return activeTab.columns_schema;
    }
    if (activeTab?.rows_data && activeTab.rows_data.length > 0) {
      const firstCells = activeTab.rows_data[0].cells || {};
      return Object.keys(firstCells).map((k, idx) => {
        const letter = String.fromCharCode(65 + (idx % 26));
        const isBulan = k === "col_0" || idx === 0;
        return {
          key: k,
          col_letter: letter,
          label: isBulan ? "Bulan" : `Kolom ${letter}`,
          type: isBulan ? "readonly" : "editable",
          formula: null,
          can_edit: !isBulan,
        };
      });
    }
    return [];
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Banner Katim */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Icon icon="solar:pen-new-square-bold" width={20} />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Entry Data RHPK
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Tahun {selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Pengisian data capaian target dan indikator kegiatan bulanan Katim secara langsung ke sistem internal BBPOM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dirtyCount > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl animate-pulse">
                {dirtyCount} sel belum disimpan
              </span>
            )}
            {selectedSpId && (
              <a
                href={`${baseUrl}/api/test-local-table/spreadsheet/${selectedSpId}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                title="Unduh dokumen Excel lengkap berisi seluruh tabs dan hasil isian terbaru"
              >
                <Icon icon="ri:file-excel-2-fill" width={16} className="text-emerald-700" />
                <span>Unduh Excel (.xlsx)</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || dirtyCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
            >
              {saving ? (
                <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
              ) : (
                <Icon icon="solar:diskette-bold" width={16} />
              )}
              <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-700">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {/* Selector Spreadsheet & Tab */}
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
                onChange={(e) => handleSelectYear(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#005baa] focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.year_number}>
                    {y.year_number}
                  </option>
                ))}
              </select>
            </div>

            {/* IKSK Selector (Hanya IKSK yang diampu Katim) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                IKSK:
              </label>
              <select
                value={selectedIkskId ?? ""}
                onChange={(e) => handleSelectIksk(Number(e.target.value))}
                className="rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:bg-white focus:outline-none max-w-xs md:max-w-sm truncate"
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

            {/* Document Info / Selector: jika hanya 1 file cukup info tanpa dropdown, jika >= 2 file baru muncul dropdown pilihan */}
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
                    <Icon icon="solar:file-spreadsheet-bold" width={16} className="text-emerald-600 shrink-0" />
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
                  onChange={(e) => handleSelectSpreadsheet(Number(e.target.value))}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:outline-none max-w-xs md:max-w-md truncate cursor-pointer shadow-2xs"
                >
                  {spreadsheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {spreadsheets.length} Dokumen
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Bulan Berjalan: <strong className="text-slate-800">{currentMonth} (Oktober)</strong>
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
                  onClick={() => handleSelectTab(t.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
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

      {/* Main Table Entry */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {activeTab ? activeTab.title : "Tabel Formulir"}
            </h2>
            <p className="text-xs text-slate-500">
              Kolom dengan latar hijau adalah kolom yang dapat Anda isi. Kolom terkunci dilindungi sistem.
            </p>
          </div>

          {activeTab && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Editable (Bisa Diisi)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Kolom Terkunci / Formula
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-emerald-600 border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat tabel isian...</p>
          </div>
        ) : !activeTab ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Pilih dokumen dan tab di atas untuk mulai mengisi data.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {effectiveColumnsSchema.map((col) => {
                    const isEditableForMe = col.can_edit;
                    return (
                      <th
                        key={col.key}
                        className={`py-3 px-3.5 font-bold border-r border-slate-200 last:border-r-0 min-w-[130px] ${
                          isEditableForMe
                            ? "bg-emerald-50/60 text-emerald-950"
                            : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] text-slate-400">
                            [{col.col_letter}]
                          </span>
                          {isEditableForMe ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                              Editable
                            </span>
                          ) : col.type === "formula" ? (
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800">
                              Formula
                            </span>
                          ) : (
                            <Icon
                              icon="solar:lock-bold"
                              width={12}
                              className="text-slate-400"
                            />
                          )}
                        </div>
                        <div className="text-xs leading-tight">{col.label}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTab.rows_data?.map((row, rIdx) => {
                  const rowKey = row.month ?? (row.row_index ?? rIdx + 1);
                  const isMonthLocked = row.is_locked;
                  const isCurrent = row.is_current;
                  const canEditThisRow = row.can_edit_row !== false;

                  return (
                    <tr
                      key={rowKey}
                      className={`transition ${
                        isCurrent
                          ? "bg-blue-50/20 font-medium"
                          : isMonthLocked
                          ? "bg-slate-50/40"
                          : !canEditThisRow
                          ? "bg-slate-50/20 opacity-80"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {effectiveColumnsSchema.map((col) => {
                        const val = row.cells?.[col.key] ?? "";
                        const canEditCell = col.can_edit && !isMonthLocked && canEditThisRow;
                        const isNum = typeof val === "number";

                        if (canEditCell) {
                          return (
                            <td
                              key={col.key}
                              className="p-1 border-r border-slate-100 last:border-r-0 bg-emerald-50/20"
                            >
                              <input
                                type={isNum ? "number" : "text"}
                                value={val}
                                onChange={(e) =>
                                  handleCellChange(rowKey, col.key, e.target.value)
                                }
                                placeholder="0"
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                              />
                            </td>
                          );
                        }

                        const isBulanCol = col.label?.toLowerCase() === 'bulan' || col.label?.toLowerCase().includes('bulan');
                        const showLockedBadge = isMonthLocked && (
                          isBulanCol ||
                          (!effectiveColumnsSchema.some((c) => c.label?.toLowerCase().includes('bulan')) && col.key === "col_0")
                        );

                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3.5 border-r border-slate-100 last:border-r-0 text-xs ${
                              isNum ? "text-right font-mono" : "text-left text-slate-700"
                            } ${
                              col.type === "formula"
                                ? "bg-purple-50/20 text-purple-900 font-semibold"
                                : "text-slate-500"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{val !== "" ? String(val) : "-"}</span>
                              {showLockedBadge && (
                                <span className="rounded bg-slate-200 px-1 py-0.2 text-[9px] text-slate-600">
                                  Terkunci
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

