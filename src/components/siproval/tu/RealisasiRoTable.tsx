"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

const MONTHS = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

type MonthColumnHeader = {
  col_index: number;
  col_letter: string;
  label: string;
  key: string;
};

type CellData = {
  col_letter: string;
  cell: string;
  value: string;
  label?: string;
  key?: string;
  is_editable: boolean;
  is_formula?: boolean;
};

type TargetTahunanData = CellData & {
  is_changed?: boolean;
  previous_value?: string | null;
  changed_by?: string | null;
  changed_at?: string | null;
};

type RowItem = {
  row_number: number;
  no: string | number;
  kode_ro: string;
  nama_ro: string;
  kode_ppk?: string;
  pagu?: string;
  status: "tercapai" | "belum";
  capaian_val: number | null;
  target_tahunan: TargetTahunanData;
  month_columns: Record<string, CellData>;
};

export default function RealisasiRoTable() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedMonth, setSelectedMonth] = useState("JANUARI");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthHeaders, setMonthHeaders] = useState<MonthColumnHeader[]>([]);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "tercapai" | "belum" | "edited">("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    "https://docs.google.com/spreadsheets/d/1KXN2ukZTcDUZ-9kfc3BbM-qi3VumvcHUSELK91nGqnU/edit#gid=17060817"
  );

  const fetchData = async (month: string) => {
    setLoading(true);
    setApiNotice("");
    try {
      const query = user?.id ? `?month=${month}&user_id=${user.id}` : `?month=${month}`;
      const res = await api.get(`${baseUrl}/api/tu/realisasi-ro/2026${query}`);

      if (res.data && res.data.data) {
        const d = res.data.data;
        setMonthHeaders(d.month_columns_header || []);
        setRows(d.rows || []);
        if (d.google_sheet_url) {
          setGoogleSheetUrl(d.google_sheet_url);
        }
        if (d.googleSheetError) {
          setApiNotice(d.googleSheetError);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal memuat data Realisasi RO dari server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, user?.id]);

  // Handle cell edit
  const handleCellChange = (cellCoord: string, value: string) => {
    setEditedCells((prev) => ({
      ...prev,
      [cellCoord]: value,
    }));
  };

  // Helper untuk mendapatkan nilai sel
  const getCellValue = (cellData?: CellData): string => {
    if (!cellData) return "";
    if (Object.prototype.hasOwnProperty.call(editedCells, cellData.cell)) {
      return editedCells[cellData.cell];
    }
    return cellData.value ?? "";
  };

  const isCellEdited = (cellCoord?: string): boolean => {
    if (!cellCoord) return false;
    return Object.prototype.hasOwnProperty.call(editedCells, cellCoord);
  };

  // Simpan batch ke Google Sheets
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(editedCells).length === 0) {
      setErrorMsg("Tidak ada perubahan yang perlu disimpan.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const updateList = Object.entries(editedCells).map(([cell, value]) => {
      // Temukan data baris terkait
      const matchedRow = rows.find(
        (r) =>
          r.target_tahunan.cell === cell ||
          Object.values(r.month_columns || {}).some((c) => c.cell === cell)
      );

      const isTargetTahunan = matchedRow?.target_tahunan.cell === cell;

      return {
        cell,
        value,
        previous_value: isTargetTahunan ? matchedRow?.target_tahunan.value : undefined,
        kode_ro: matchedRow?.kode_ro,
      };
    });

    try {
      const res = await api.post(`${baseUrl}/api/tu/realisasi-ro/update`, {
        user_id: user?.id,
        user_name: user?.name,
        user_email: user?.email,
        updates: updateList,
      });

      const message =
        res.data?.message ||
        `${updateList.length} sel Realisasi RO berhasil disimpan ke Google Sheet!`;
      setSuccessMsg(message);

      // Refresh data agar audit log dan formula sheet tersinkronisasi
      await fetchData(selectedMonth);
      setEditedCells({});
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || "Gagal menyimpan perubahan ke Google Sheet."
      );
    } finally {
      setSaving(false);
    }
  };

  // Batalkan seluruh perubahan lokal
  const handleReset = () => {
    if (confirm("Apakah Anda yakin ingin membatalkan semua perubahan yang belum disimpan?")) {
      setEditedCells({});
      setSuccessMsg("");
      setErrorMsg("");
    }
  };

  // Filtering & Search
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKode = (r.kode_ro || "").toLowerCase().includes(q);
        const matchNama = (r.nama_ro || "").toLowerCase().includes(q);
        const matchKendala = (getCellValue(r.month_columns?.kendala) || "").toLowerCase().includes(q);
        const matchRtl = (getCellValue(r.month_columns?.rtl) || "").toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchKendala && !matchRtl) {
          return false;
        }
      }

      if (filterStatus === "tercapai") return r.status === "tercapai";
      if (filterStatus === "belum") return r.status === "belum";
      if (filterStatus === "edited") {
        const hasEditedTarget = isCellEdited(r.target_tahunan?.cell);
        const hasEditedMonth = Object.values(r.month_columns || {}).some((c) =>
          isCellEdited(c.cell)
        );
        return hasEditedTarget || hasEditedMonth;
      }

      return true;
    });
  }, [rows, searchQuery, filterStatus, editedCells]);

  // Statistik
  const totalRO = rows.length;
  const tercapaiCount = rows.filter((r) => r.status === "tercapai").length;
  const belumTercapaiCount = totalRO - tercapaiCount;
  const pendingCount = Object.keys(editedCells).length;

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header Ringkas */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/siproval/tu" className="hover:text-[#005baa] transition">
              Tata Usaha
            </Link>
            <Icon icon="solar:alt-arrow-right-linear" width={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Realisasi RO</span>
            <Icon icon="solar:alt-arrow-right-linear" width={14} className="text-slate-400" />
            <span className="font-bold text-[#005baa]">Tahun 2026</span>
          </nav>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              Realisasi Rincian Output (RO)
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tab 155 Live
            </span>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Langsung ke Google Sheet */}
          <a
            href={googleSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Spreadsheet Tab Realisasi RO di tab baru"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
          >
            <Icon icon="solar:document-text-bold" width={16} className="text-[#00a651]" />
            Buka Google Sheet
            <Icon icon="solar:arrow-right-up-linear" width={14} className="text-emerald-600" />
          </a>

          {/* Tombol Refresh Data */}
          <button
            type="button"
            onClick={() => fetchData(selectedMonth)}
            disabled={loading || saving}
            title="Segarkan data dari Google Sheet"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#005baa] hover:bg-blue-100 transition shadow-2xs disabled:opacity-60"
          >
            <Icon
              icon="solar:refresh-linear"
              width={16}
              className={loading ? "animate-spin text-[#005baa]" : "text-[#005baa]"}
            />
            <span>{loading ? "Memuat..." : "Refresh Data"}</span>
          </button>

          {/* Reset Perubahan */}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              <Icon icon="solar:restart-linear" width={15} />
              Reset ({pendingCount})
            </button>
          )}

          {/* Simpan Perubahan */}
          <button
            type="button"
            onClick={handleSave}
            disabled={pendingCount === 0 || saving}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
              pendingCount > 0
                ? "bg-[#00a651] text-white hover:bg-emerald-700 ring-2 ring-emerald-500/30"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Icon icon="solar:restart-bold" className="animate-spin" width={16} />
                Menyimpan...
              </>
            ) : (
              <>
                <Icon icon="solar:diskette-bold" width={16} />
                Simpan {pendingCount > 0 ? `(${pendingCount} Perubahan)` : "Perubahan"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mini KPI Ringkas */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-blue-200/70 bg-blue-50/40 px-3.5 py-2 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#005baa]">Total RO</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">{totalRO}</p>
          </div>
          <div className="rounded-lg bg-blue-100/70 p-1.5 text-[#005baa]">
            <Icon icon="solar:folder-with-files-bold" width={20} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-3.5 py-2 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00a651]">
              Tercapai ({selectedMonth})
            </p>
            <p className="text-xl font-extrabold text-[#00a651] leading-tight">{tercapaiCount}</p>
          </div>
          <div className="rounded-lg bg-emerald-100/70 p-1.5 text-[#00a651]">
            <Icon icon="solar:check-circle-bold" width={20} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/40 px-3.5 py-2 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Belum ({selectedMonth})
            </p>
            <p className="text-xl font-extrabold text-amber-600 leading-tight">{belumTercapaiCount}</p>
          </div>
          <div className="rounded-lg bg-amber-100/70 p-1.5 text-amber-600">
            <Icon icon="solar:clock-circle-bold" width={20} />
          </div>
        </div>
        <div
          className={`flex items-center justify-between rounded-xl border px-3.5 py-2 transition shadow-2xs ${
            pendingCount > 0
              ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400/50"
              : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                pendingCount > 0 ? "text-amber-800 font-extrabold" : "text-slate-500"
              }`}
            >
              Pending Simpan
            </p>
            <p
              className={`text-xl font-extrabold leading-tight ${
                pendingCount > 0 ? "text-amber-600" : "text-slate-700"
              }`}
            >
              {pendingCount}
            </p>
          </div>
          <div
            className={`rounded-lg p-1.5 ${
              pendingCount > 0 ? "bg-amber-200/70 text-amber-800" : "bg-slate-200/60 text-slate-500"
            }`}
          >
            <Icon icon="solar:diskette-bold" width={20} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {apiNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Icon icon="solar:info-circle-bold" width={18} className="shrink-0 text-amber-600" />
          <span>{apiNotice}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={18} className="shrink-0 text-[#00a651]" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg("")} className="text-emerald-600">
            <Icon icon="solar:close-circle-bold" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={18} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg("")} className="text-rose-600">
            <Icon icon="solar:close-circle-bold" width={16} />
          </button>
        </div>
      )}

      {/* CARD UTAMA: Pilihan Bulan Tepat di Atas Tabel & Filter Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {/* PILIHAN BULAN (TEPAT DI ATAS TABEL) */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:px-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="solar:calendar-bold" className="text-[#005baa]" width={18} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pilih Bulan:
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {MONTHS.map((m) => {
                const isActive = selectedMonth === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? "bg-[#005baa] text-white shadow-xs scale-102 ring-2 ring-blue-500/30"
                        : "bg-white text-slate-600 hover:bg-blue-50 hover:text-[#005baa] border border-slate-200"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toolbar Pencarian & Filter Status */}
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Icon
              icon="solar:magnifer-linear"
              width={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode RO, nama rincian output..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-[#005baa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#005baa]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-bold" width={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                filterStatus === "all"
                  ? "bg-slate-200 text-slate-800"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Semua ({totalRO})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("tercapai")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                filterStatus === "tercapai"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              Tercapai ({tercapaiCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("belum")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                filterStatus === "belum"
                  ? "bg-amber-600 text-white"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              Belum ({belumTercapaiCount})
            </button>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus("edited")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  filterStatus === "edited"
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                Diubah ({pendingCount})
              </button>
            )}
          </div>
        </div>

        {/* Tabel Data (Kolom NO Dihilangkan, Kode RO, Nama RO & Target Tahunan Beku/Sticky) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Icon icon="solar:restart-bold" className="animate-spin text-[#005baa]" width={34} />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              Memuat data Realisasi RO dari Google Sheet...
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-16 text-center">
            <Icon icon="solar:document-medicine-bold" className="mx-auto text-slate-300" width={32} />
            <h3 className="mt-2 text-xs font-bold text-slate-700">Tidak ada data indikator RO</h3>
            <p className="text-[11px] text-slate-400">
              {searchQuery ? `Tidak ada hasil untuk "${searchQuery}".` : "Belum ada baris data di tab ini."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[720px] relative scrollbar-thin scrollbar-thumb-slate-200">
            <table className="border-collapse text-left text-xs table-fixed min-w-[1700px] w-full">
              {/* Kolom Width Rigid Enforced */}
              <colgroup>
                <col style={{ width: "90px" }} />
                <col style={{ width: "320px" }} />
                <col style={{ width: "140px" }} />
                {monthHeaders.map((col) => {
                  const isCap = col.key === "capaian";
                  const isReal = col.key === "realisasi";
                  const isTgt = col.key === "target";
                  const isTimeline = col.key === "timeline";
                  const isLongText =
                    col.key === "kendala" ||
                    col.key === "rtl" ||
                    col.key === "rekomendasi" ||
                    col.key === "upaya" ||
                    col.key === "arahan_pimpinan";

                  let w = "160px";
                  if (isTgt || isReal || isCap) w = "105px";
                  if (isTimeline) w = "120px";
                  if (isLongText) w = "260px";

                  return <col key={col.col_index} style={{ width: w }} />;
                })}
              </colgroup>

              {/* Header Tabel */}
              <thead className="sticky top-0 z-40 bg-[#f1f5f9] text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-300">
                <tr>
                  {/* 1. KODE RO (Sticky Left: 0px, w: 90px) - Solid Opaque Background */}
                  <th
                    rowSpan={2}
                    className="sticky left-0 top-0 z-50 bg-[#e2e8f0] px-3 py-3 border-r border-slate-300 w-[90px] min-w-[90px] max-w-[90px] align-middle font-extrabold text-slate-800"
                  >
                    Kode RO
                  </th>

                  {/* 2. PROGRAM / KEGIATAN / OUTPUT RO (Sticky Left: 90px, w: 320px) - Solid Opaque Background */}
                  <th
                    rowSpan={2}
                    className="sticky left-[90px] top-0 z-50 bg-[#e2e8f0] px-4 py-3 border-r border-slate-300 w-[320px] min-w-[320px] max-w-[320px] align-middle font-extrabold text-slate-800"
                  >
                    Program / Kegiatan / Output RO
                  </th>

                  {/* 3. TARGET TAHUNAN (Sticky Left: 410px, w: 140px) - Solid Opaque Background + Divider Shadow */}
                  <th
                    rowSpan={2}
                    className="sticky left-[410px] top-0 z-50 bg-[#e2e8f0] px-3 py-3 text-center border-r-2 border-slate-300 shadow-[4px_0_12px_rgba(0,0,0,0.12)] w-[140px] min-w-[140px] max-w-[140px] align-middle font-extrabold text-slate-800"
                  >
                    Target Tahunan
                  </th>

                  {/* Group header bulan terpilih (Scrollable Horizontal) */}
                  <th
                    colSpan={monthHeaders.length}
                    className="sticky top-0 z-30 px-4 py-2 text-center bg-[#f0f9ff] text-[#005baa] border-b border-blue-200 font-extrabold"
                  >
                    Periode: {selectedMonth}
                  </th>
                </tr>

                {/* Sub-Header Kolom Bulan */}
                <tr className="bg-[#f8fafc] border-b border-slate-200">
                  {monthHeaders.map((col) => {
                    const isCap = col.key === "capaian";
                    const isReal = col.key === "realisasi";
                    const isTgt = col.key === "target";

                    return (
                      <th
                        key={col.col_index}
                        className={`sticky top-[37px] z-30 px-3 py-2 border-r border-slate-200 font-semibold ${
                          isCap
                            ? "bg-emerald-50 text-emerald-800 text-center"
                            : isReal
                            ? "bg-blue-50 text-blue-800 text-center"
                            : isTgt
                            ? "bg-slate-50 text-slate-700 text-center"
                            : "bg-[#f8fafc] text-slate-700"
                        }`}
                      >
                        <div className={`flex items-center ${isCap || isReal || isTgt ? "justify-center" : "justify-between"}`}>
                          <span>{col.label}</span>
                          {isCap && (
                            <span className="ml-1 text-[10px] lowercase font-normal text-emerald-600 bg-white px-1 rounded border border-emerald-200">
                              rumus
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body Tabel */}
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRows.map((row) => {
                  const isTercapai = row.status === "tercapai";

                  // Target Tahunan (Col F)
                  const tgtTahunanCellCoord = row.target_tahunan.cell;
                  const tgtTahunanVal = getCellValue(row.target_tahunan);
                  const isTgtTahunanEdited = isCellEdited(tgtTahunanCellCoord);
                  const isTargetChanged = row.target_tahunan.is_changed;

                  return (
                    <tr
                      key={row.row_number}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      {/* 1. KODE RO (Sticky Left: 0px, w: 90px) - Solid Opaque Background */}
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-[#f8fafc] px-3 py-3 font-mono font-bold text-blue-700 border-r border-slate-200 align-top w-[90px] min-w-[90px] max-w-[90px] whitespace-nowrap">
                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs text-[#005baa]">
                          {row.kode_ro || "-"}
                        </span>
                      </td>

                      {/* 2. PROGRAM / KEGIATAN / OUTPUT RO (Sticky Left: 90px, w: 320px) - Solid Opaque Background */}
                      <td className="sticky left-[90px] z-20 bg-white group-hover:bg-[#f8fafc] px-4 py-3 border-r border-slate-200 align-top w-[320px] min-w-[320px] max-w-[320px]">
                        <p className="font-semibold text-slate-900 leading-snug break-words">
                          {row.nama_ro}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                          {row.kode_ppk && <span>PPK: {row.kode_ppk}</span>}
                          {row.pagu && <span>| Pagu: {row.pagu}</span>}
                        </div>
                      </td>

                      {/* 3. TARGET TAHUNAN (Sticky Left: 410px, w: 140px) - Solid Opaque Background + Divider Shadow */}
                      <td
                        className={`sticky left-[410px] z-20 bg-white group-hover:bg-[#f8fafc] px-3 py-2 border-r-2 border-slate-300 shadow-[4px_0_12px_rgba(0,0,0,0.12)] align-top w-[140px] min-w-[140px] max-w-[140px] transition ${
                          isTgtTahunanEdited ? "!bg-amber-50 ring-1 ring-amber-400" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            value={tgtTahunanVal}
                            onChange={(e) =>
                              handleCellChange(tgtTahunanCellCoord, e.target.value)
                            }
                            className={`w-full rounded-lg border px-2 py-1 text-center text-xs font-bold transition focus:outline-none focus:ring-1 ${
                              isTgtTahunanEdited
                                ? "border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500"
                                : isTargetChanged
                                ? "border-blue-300 bg-blue-50/50 text-[#005baa] focus:border-[#005baa] focus:ring-[#005baa]"
                                : "border-slate-200 bg-slate-50/40 text-slate-800 hover:border-slate-300 focus:border-[#005baa] focus:bg-white focus:ring-[#005baa]"
                            }`}
                            placeholder="0"
                          />

                          {/* Penanda jika sedang diubah (belum disimpan) */}
                          {isTgtTahunanEdited ? (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                              <Icon icon="solar:pen-new-square-bold" width={11} className="shrink-0" />
                              <span className="truncate">Semula: {row.target_tahunan.value || "0"}</span>
                            </div>
                          ) : isTargetChanged ? (
                            /* Penanda jika sudah pernah diganti (menampilkan nilai semula & akun yang mengubahnya) */
                            <div className="flex flex-col gap-0.5 text-left text-[10px] leading-tight">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 line-through">
                                  {row.target_tahunan.previous_value}
                                </span>
                                <span className="rounded bg-blue-100 text-blue-800 px-1 font-bold text-[9px]">
                                  Diubah
                                </span>
                              </div>
                              <span
                                className="truncate text-slate-500 text-[9px]"
                                title={`Diubah oleh ${row.target_tahunan.changed_by || "User"} (${row.target_tahunan.changed_at || ""})`}
                              >
                                Oleh: <strong className="text-slate-700">{row.target_tahunan.changed_by || "User"}</strong>
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* 4. Kolom-kolom Dinamis Bulan (Scrollable) */}
                      {monthHeaders.map((col) => {
                        const cellData = row.month_columns[col.key];
                        const cellCoord = cellData?.cell || `${col.col_letter}${row.row_number}`;
                        const cellVal = getCellValue(cellData);
                        const isEdited = isCellEdited(cellCoord);
                        const isFormula = cellData?.is_formula || col.key === "capaian";

                        const isNumericCol =
                          col.key === "target" ||
                          col.key === "realisasi" ||
                          col.key === "capaian";
                        const isLongText =
                          col.key === "kendala" ||
                          col.key === "rtl" ||
                          col.key === "rekomendasi" ||
                          col.key === "upaya" ||
                          col.key === "arahan_pimpinan";

                        // JIKA KOLOM RUMUS (CAPAIAN %) -> READONLY SAJA
                        if (isFormula) {
                          return (
                            <td
                              key={col.col_index}
                              className="px-3 py-2 border-r border-slate-200 align-top text-center bg-white group-hover:bg-[#f8fafc]"
                            >
                              <div className="flex items-center justify-center py-1">
                                <span
                                  className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                                    isTercapai
                                      ? "bg-emerald-100 text-[#00a651]"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {cellVal ? `${cellVal}%` : "0%"}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // JIKA KOLOM INPUT MANUAL
                        return (
                          <td
                            key={col.col_index}
                            className={`px-2 py-1.5 border-r border-slate-200 align-top transition bg-white group-hover:bg-[#f8fafc] ${
                              isEdited ? "!bg-amber-50 ring-1 ring-amber-400" : ""
                            }`}
                          >
                            {isLongText ? (
                              <textarea
                                rows={2}
                                value={cellVal}
                                onChange={(e) =>
                                  handleCellChange(cellCoord, e.target.value)
                                }
                                placeholder={`Isi ${col.label}...`}
                                className={`w-full rounded-lg border px-2.5 py-1 text-xs transition resize-y focus:outline-none focus:ring-1 ${
                                  isEdited
                                    ? "border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500 font-medium"
                                    : "border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300 focus:border-[#005baa] focus:bg-white focus:ring-[#005baa]"
                                }`}
                              />
                            ) : (
                              <input
                                type="text"
                                value={cellVal}
                                onChange={(e) =>
                                  handleCellChange(cellCoord, e.target.value)
                                }
                                placeholder="0"
                                className={`w-full rounded-lg border px-2 py-1 text-xs transition focus:outline-none focus:ring-1 ${
                                  isNumericCol ? "text-center font-semibold" : ""
                                } ${
                                  isEdited
                                    ? "border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500 font-bold"
                                    : "border-slate-200 bg-slate-50/40 text-slate-800 hover:border-slate-300 focus:border-[#005baa] focus:bg-white focus:ring-[#005baa]"
                                }`}
                              />
                            )}
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

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
          <span>Menampilkan {filteredRows.length} dari {totalRO} Rincian Output</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Tercapai (&ge; 100%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Belum (&lt; 100%)
            </span>
            {pendingCount > 0 && (
              <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                {pendingCount} Sel Belum Disimpan
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
