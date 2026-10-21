"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

function formatRp(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatPct(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0%";
  return `${Number(num).toFixed(2).replace(/\.00$/, "")}%`;
}

type IkskInfo = {
  iksk_number: number;
  full_title: string;
  pct_col_idx: number;
  pct_col_letter: string;
  target_col_idx: number;
  target_col_letter: string;
  real_col_idx: number;
  real_col_letter: string;
};

type AllocationInfo = {
  iksk_number: number;
  percent: number;
  target: number;
  realisasi: number;
  pct_cell: string;
  target_cell: string;
  real_cell: string;
};

type KegiatanItem = {
  row_number: number;
  no: number;
  code: string;
  name: string;
  pagu: number;
  realisasi: number;
  pagu_cell: string;
  real_cell: string;
  allocations: Record<string, AllocationInfo>;
};

type SpreadsheetInfo = {
  id?: number;
  name?: string;
  spreadsheet_id?: string;
};

type SheetTabInfo = {
  id?: number;
  title?: string;
  google_sheet_id?: string | number | null;
};

export default function BudgetMappingTable() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const year = searchParams.get("year") || "2026";
  const tabId = searchParams.get("tab") || "171";

  const [tabTitle, setTabTitle] = useState("Budget Mapping Bulanan");
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [sheetTab, setSheetTab] = useState<SheetTabInfo | null>(null);
  const [apiNotice, setApiNotice] = useState("");

  const [iksks, setIksks] = useState<IkskInfo[]>([]);
  const [localKegiatans, setLocalKegiatans] = useState<KegiatanItem[]>([]);
  const [initialKegiatans, setInitialKegiatans] = useState<KegiatanItem[]>([]);

  const [displayMode, setDisplayMode] = useState<"single" | "all">("single");
  const [selectedKegiatanCodeForm, setSelectedKegiatanCodeForm] =
    useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Construct Direct Google Spreadsheet URL
  const spreadsheetUrl = useMemo(() => {
    if (!spreadsheet?.spreadsheet_id) return null;
    const gidParam =
      sheetTab?.google_sheet_id !== undefined &&
      sheetTab?.google_sheet_id !== null
        ? `#gid=${sheetTab.google_sheet_id}`
        : "";
    return `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheet_id}/edit${gidParam}`;
  }, [spreadsheet, sheetTab]);

  // Load Table Data from Server
  async function loadTable() {
    setLoading(true);
    setErrorMsg("");
    setApiNotice("");
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.get(
        `${baseUrl}/api/budget-mapping/${year}/tab/${tabId}${query}`,
      );

      if (res.data) {
        const data = res.data.data || res.data;
        if (data.sheetTab) {
          setSheetTab(data.sheetTab);
          if (data.sheetTab.title) setTabTitle(data.sheetTab.title);
        }

        if (data.spreadsheet) {
          setSpreadsheet(data.spreadsheet);
        }

        const err = data.googleSheetError;
        if (err) setApiNotice(err);

        if (Array.isArray(data.iksks)) {
          setIksks(data.iksks);
        }

        if (Array.isArray(data.kegiatans)) {
          const cloned: KegiatanItem[] = JSON.parse(
            JSON.stringify(data.kegiatans),
          );
          setLocalKegiatans(cloned);
          setInitialKegiatans(JSON.parse(JSON.stringify(data.kegiatans)));

          if (cloned.length > 0) {
            setSelectedKegiatanCodeForm((prev) =>
              prev && prev !== "" ? prev : String(cloned[0].row_number),
            );
          }
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal memuat rincian tabel anggaran dari backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadTable();
    }
  }, [year, tabId, user?.id]);

  // Overall budget summary
  const overallTotals = useMemo(() => {
    const totalPagu = localKegiatans.reduce(
      (sum, k) => sum + (Number(k.pagu) || 0),
      0,
    );
    const totalRealisasi = localKegiatans.reduce(
      (sum, k) => sum + (Number(k.realisasi) || 0),
      0,
    );
    const sisa = totalPagu - totalRealisasi;
    const serapan = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    let totalTargetIksk = 0;
    let totalRealIksk = 0;

    localKegiatans.forEach((keg) => {
      Object.values(keg.allocations || {}).forEach((alloc) => {
        totalTargetIksk += Number(alloc.target) || 0;
        totalRealIksk += Number(alloc.realisasi) || 0;
      });
    });

    return {
      totalPagu,
      totalRealisasi,
      sisa,
      serapan,
      totalTargetIksk,
      totalRealIksk,
    };
  }, [localKegiatans]);

  // Handle Pagu Change for a kegiatan
  const handlePaguChange = (kegIndex: number, newPagu: number) => {
    setLocalKegiatans((prev) => {
      const next = [...prev];
      const keg = { ...next[kegIndex] };
      keg.pagu = newPagu;

      const updatedAlloc: Record<string, AllocationInfo> = {};
      Object.entries(keg.allocations || {}).forEach(([ikskNum, alloc]) => {
        const pctDecimal = (alloc.percent || 0) / 100;
        updatedAlloc[ikskNum] = {
          ...alloc,
          target: Math.round(newPagu * pctDecimal),
        };
      });
      keg.allocations = updatedAlloc;
      next[kegIndex] = keg;
      return next;
    });
  };

  // Handle Realisasi Change for a kegiatan
  const handleRealisasiChange = (kegIndex: number, newReal: number) => {
    setLocalKegiatans((prev) => {
      const next = [...prev];
      const keg = { ...next[kegIndex] };
      keg.realisasi = newReal;

      const updatedAlloc: Record<string, AllocationInfo> = {};
      Object.entries(keg.allocations || {}).forEach(([ikskNum, alloc]) => {
        const pctDecimal = (alloc.percent || 0) / 100;
        updatedAlloc[ikskNum] = {
          ...alloc,
          realisasi: Math.round(newReal * pctDecimal),
        };
      });
      keg.allocations = updatedAlloc;
      next[kegIndex] = keg;
      return next;
    });
  };

  // Handle Allocation Percent Change
  const handlePercentChange = (
    kegIndex: number,
    ikskNum: number,
    newPercent: number,
  ) => {
    setLocalKegiatans((prev) => {
      const next = [...prev];
      const keg = { ...next[kegIndex] };
      const currentAlloc = keg.allocations?.[ikskNum];
      if (!currentAlloc) return prev;

      const pctDecimal = newPercent / 100;
      const updatedAlloc = {
        ...keg.allocations,
        [ikskNum]: {
          ...currentAlloc,
          percent: newPercent,
          target: Math.round((keg.pagu || 0) * pctDecimal),
          realisasi: Math.round((keg.realisasi || 0) * pctDecimal),
        },
      };
      keg.allocations = updatedAlloc;
      next[kegIndex] = keg;
      return next;
    });
  };

  // Add allocation for an IKSK
  const handleAddIkskAllocation = (kegIndex: number, ikskNum: number) => {
    const ikskMeta = iksks.find((i) => i.iksk_number === ikskNum);
    if (!ikskMeta) return;

    setLocalKegiatans((prev) => {
      const next = [...prev];
      const keg = { ...next[kegIndex] };
      const rowNum = keg.row_number;

      const newAlloc: AllocationInfo = {
        iksk_number: ikskNum,
        percent: 0,
        target: 0,
        realisasi: 0,
        pct_cell: `${ikskMeta.pct_col_letter}${rowNum}`,
        target_cell: `${ikskMeta.target_col_letter}${rowNum}`,
        real_cell: `${ikskMeta.real_col_letter}${rowNum}`,
      };

      keg.allocations = {
        ...keg.allocations,
        [ikskNum]: newAlloc,
      };
      next[kegIndex] = keg;
      return next;
    });
  };

  // Remove allocation for an IKSK
  const handleRemoveIkskAllocation = (kegIndex: number, ikskNum: number) => {
    setLocalKegiatans((prev) => {
      const next = [...prev];
      const keg = { ...next[kegIndex] };
      const updated = { ...keg.allocations };
      delete updated[ikskNum];
      keg.allocations = updated;
      next[kegIndex] = keg;
      return next;
    });
  };

  // Save changes from Form (or single kegiatan)
  const handleSaveForm = async (targetKegIndex?: number) => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const updateList: { cell: string; value: unknown }[] = [];
      const kegsToProcess =
        targetKegIndex !== undefined
          ? [localKegiatans[targetKegIndex]]
          : localKegiatans;

      kegsToProcess.forEach((keg) => {
        // Pagu & Realisasi cells
        updateList.push({ cell: keg.pagu_cell, value: keg.pagu || 0 });
        updateList.push({ cell: keg.real_cell, value: keg.realisasi || 0 });

        // Current allocations
        const currentKeys = Object.keys(keg.allocations || {});
        currentKeys.forEach((ikskNumStr) => {
          const alloc = keg.allocations[ikskNumStr];
          const pctFraction = (alloc.percent || 0) / 100;
          updateList.push({ cell: alloc.pct_cell, value: pctFraction });
          updateList.push({
            cell: alloc.target_cell,
            value: alloc.target || 0,
          });
          updateList.push({
            cell: alloc.real_cell,
            value: alloc.realisasi || 0,
          });
        });

        // Clear deleted allocations from Google Sheets
        const initialKeg = initialKegiatans.find((ik) => ik.code === keg.code);
        if (initialKeg) {
          Object.keys(initialKeg.allocations || {}).forEach((initIkskNum) => {
            if (!keg.allocations?.[initIkskNum]) {
              const deletedAlloc = initialKeg.allocations[initIkskNum];
              updateList.push({ cell: deletedAlloc.pct_cell, value: "" });
              updateList.push({ cell: deletedAlloc.target_cell, value: "" });
              updateList.push({ cell: deletedAlloc.real_cell, value: "" });
            }
          });
        }
      });

      if (updateList.length === 0) {
        setErrorMsg("Tidak ada data sel yang perlu disimpan.");
        return;
      }

      await api.post(
        `${baseUrl}/api/budget-mapping/${year}/tab/${tabId}/update`,
        { user_id: user?.id, updates: updateList },
      );

      setSuccessMsg(
        targetKegIndex !== undefined
          ? `Alokasi kegiatan berhasil disimpan dan disinkronkan ke Google Sheets!`
          : `Seluruh data alokasi (${updateList.length} sel) berhasil disimpan dan disinkronkan ke Google Sheets!`,
      );
      await loadTable();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal menyimpan data ke Google Sheets. Pastikan akun service account memiliki wewenang Editor.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Navigation helpers for Single Kegiatan Form View
  const formKegiatanIndex = useMemo(() => {
    return localKegiatans.findIndex(
      (k) =>
        String(k.row_number) === String(selectedKegiatanCodeForm) ||
        k.code === selectedKegiatanCodeForm,
    );
  }, [localKegiatans, selectedKegiatanCodeForm]);

  const handlePrevKegiatan = () => {
    if (formKegiatanIndex > 0) {
      setSelectedKegiatanCodeForm(
        String(localKegiatans[formKegiatanIndex - 1].row_number),
      );
    }
  };

  const handleNextKegiatan = () => {
    if (formKegiatanIndex < localKegiatans.length - 1) {
      setSelectedKegiatanCodeForm(
        String(localKegiatans[formKegiatanIndex + 1].row_number),
      );
    }
  };

  const displayedKegiatans = useMemo(() => {
    if (displayMode === "all") {
      return localKegiatans;
    }
    const found = localKegiatans.find(
      (k) =>
        String(k.row_number) === String(selectedKegiatanCodeForm) ||
        k.code === selectedKegiatanCodeForm,
    );
    return found
      ? [found]
      : localKegiatans.length > 0
        ? [localKegiatans[0]]
        : [];
  }, [displayMode, localKegiatans, selectedKegiatanCodeForm]);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link
              href="/siproval/budget-mapping"
              className="transition hover:text-[#005baa]"
            >
              Budget Mapping
            </Link>
            <span>/</span>
            <Link
              href={`/siproval/budget-mapping/year?year=${year}`}
              className="transition hover:text-[#005baa]"
            >
              Tahun {year}
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">{tabTitle}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {tabTitle}
            </h1>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#005baa]">
              Input Data Anggaran
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kelola pagu, realisasi belanja, dan tentukan persentase alokasi tiap
            kegiatan ke sasaran IKSK.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/siproval/budget-mapping/year?year=${year}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <Icon icon="solar:arrow-left-linear" width={16} />
            Daftar Bulan
          </Link>

          {/* Direct link to external Google Spreadsheet */}
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
              title="Buka dokumen Google Spreadsheet secara langsung di tab baru"
            >
              <Icon
                icon="solar:link-square-bold"
                width={16}
                className="text-emerald-600"
              />
              <span>Buka Google Spreadsheet</span>
              <Icon
                icon="solar:arrow-right-up-linear"
                width={14}
                className="text-slate-400"
              />
            </a>
          )}

          {/* Link to New Data View Page */}
          <Link
            href={`/siproval/tu/rekapitulasi-anggaran?year=${year}&tab=${tabId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#005baa] shadow-xs transition hover:bg-blue-100"
          >
            <Icon icon="solar:chart-square-bold" width={16} />
            Lihat Rekap Data
          </Link>

          {/* Save All Button */}
          <button
            type="button"
            onClick={() => handleSaveForm()}
            disabled={saving || loading || localKegiatans.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004a8b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              icon={saving ? "solar:refresh-circle-linear" : "solar:disk-bold"}
              width={16}
              className={saving ? "animate-spin" : ""}
            />
            {saving ? "Menyimpan ke Sheets..." : "Simpan Semua Alokasi"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:check-circle-bold"
              width={18}
              className="text-emerald-600 shrink-0"
            />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:danger-triangle-bold"
              width={18}
              className="text-red-600 shrink-0"
            />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {apiNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
          <Icon
            icon="solar:info-circle-bold"
            width={18}
            className="text-amber-600 shrink-0"
          />
          <span>{apiNotice}</span>
        </div>
      )}

      {/* Calm & Restrained Summary Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-4 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          <div className="sm:px-4 first:pl-0">
            <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Pagu Kegiatan
            </span>
            <span className="mt-1 block text-xl font-bold text-slate-900">
              {formatRp(overallTotals.totalPagu)}
            </span>
            <span className="text-[11px] text-slate-400">
              {localKegiatans.length} Output / Kegiatan
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4">
            <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Realisasi Kegiatan
            </span>
            <span className="mt-1 block text-xl font-bold text-emerald-700">
              {formatRp(overallTotals.totalRealisasi)}
            </span>
            <span className="text-[11px] text-slate-500">
              Tingkat Serapan:{" "}
              <strong className="text-emerald-700">
                {formatPct(overallTotals.serapan)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Kegiatan Navigator & Selector Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label className="text-xs font-semibold text-slate-600 shrink-0">
            Pilih Kegiatan:
          </label>
          <select
            value={selectedKegiatanCodeForm}
            onChange={(e) => {
              setSelectedKegiatanCodeForm(e.target.value);
              setDisplayMode("single");
            }}
            className="w-full max-w-xl truncate rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            {localKegiatans.map((k, idx) => (
              <option
                key={`opt-${k.code}-${k.row_number}`}
                value={String(k.row_number)}
              >
                {idx + 1}. [{k.code}] {k.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {displayMode === "single" ? (
            <>
              <button
                type="button"
                onClick={handlePrevKegiatan}
                disabled={formKegiatanIndex <= 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon icon="solar:alt-arrow-left-linear" width={14} />
                Sebelumnya
              </button>
              <span className="text-xs font-semibold text-slate-500 px-1">
                {formKegiatanIndex + 1} / {localKegiatans.length}
              </span>
              <button
                type="button"
                onClick={handleNextKegiatan}
                disabled={formKegiatanIndex >= localKegiatans.length - 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Berikutnya
                <Icon icon="solar:alt-arrow-right-linear" width={14} />
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode("all")}
                className="ml-1 text-xs font-semibold text-[#005baa] hover:underline"
              >
                Tampilkan Semua
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setDisplayMode("single")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-slate-50 transition shadow-xs"
            >
              <Icon
                icon="solar:maximize-square-minimalistic-linear"
                width={14}
              />
              Kembali ke Mode Fokus (1 Kegiatan)
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Form Kegiatan */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-solid border-[#005baa] border-r-transparent" />
          <p className="mt-3 text-xs text-slate-500">
            Memuat formulir kegiatan...
          </p>
        </div>
      ) : displayedKegiatans.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          Tidak ada data kegiatan yang ditemukan pada tab ini.
        </div>
      ) : (
        <div className="space-y-4">
          {displayedKegiatans.map((keg) => {
            const kegIndex = localKegiatans.findIndex(
              (k) => k.row_number === keg.row_number,
            );
            const allocationsList = Object.values(keg.allocations || {});
            const totalAllocPercent = allocationsList.reduce(
              (sum, a) => sum + (Number(a.percent) || 0),
              0,
            );
            const allocatedIkskNums = new Set(
              allocationsList.map((a) => a.iksk_number),
            );
            const availableIksksToAdd = iksks.filter(
              (i) => !allocatedIkskNums.has(i.iksk_number),
            );

            const isComplete = Math.abs(totalAllocPercent - 100) < 0.01;
            const isOver = totalAllocPercent > 100.01;
            const sisaDana = (keg.pagu || 0) - (keg.realisasi || 0);
            const serapanKeg =
              keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0;

            return (
              <div
                key={`keg-card-${keg.code}-${keg.row_number}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                {/* Header Kegiatan */}
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="rounded-md bg-[#005baa] px-2.5 py-1 text-xs font-bold text-white shrink-0 mt-0.5">
                      {keg.code}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {keg.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Baris: {keg.row_number}</span>
                        <span>•</span>
                        <span>Sel Pagu: {keg.pagu_cell}</span>
                        <span>•</span>
                        <span>Sel Realisasi: {keg.real_cell}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        isComplete
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : isOver
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      Alokasi IKSK: {formatPct(totalAllocPercent)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveForm(kegIndex)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-100 transition shadow-xs"
                    >
                      <Icon icon="solar:disk-bold" width={14} />
                      Simpan Kegiatan Ini
                    </button>
                  </div>
                </div>

                {/* Form Input Pagu & Realisasi */}
                <div className="grid grid-cols-1 gap-4 p-4.5 sm:grid-cols-2 bg-white border-b border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAGU Kegiatan (Rp)
                    </label>
                    <input
                      type="number"
                      value={keg.pagu}
                      onChange={(e) =>
                        handlePaguChange(
                          kegIndex,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      {formatRp(keg.pagu)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Realisasi Kegiatan (Rp)
                    </label>
                    <input
                      type="number"
                      value={keg.realisasi}
                      onChange={(e) =>
                        handleRealisasiChange(
                          kegIndex,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-emerald-700">
                        {formatRp(keg.realisasi)}
                      </span>
                      <span className="text-slate-500">
                        Serapan:{" "}
                        <strong className="text-emerald-700">
                          {formatPct(serapanKeg)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Alokasi ke IKSK */}
                <div className="p-4.5 bg-slate-50/40">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Pembagian Alokasi ke IKSK
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Alokasikan anggaran belanja kegiatan ini ke satu atau
                        beberapa indikator IKSK.
                      </p>
                    </div>

                    {availableIksksToAdd.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val) {
                              handleAddIkskAllocation(kegIndex, val);
                              e.target.value = "";
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 font-semibold transition focus:border-[#005baa] focus:outline-none shadow-xs"
                        >
                          <option value="" disabled>
                            + Tambah Alokasi IKSK...
                          </option>
                          {availableIksksToAdd.map((i) => (
                            <option key={i.iksk_number} value={i.iksk_number}>
                              IKSK {i.iksk_number} - {i.full_title.slice(0, 48)}
                              ...
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {allocationsList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                      Belum ada pembagian IKSK untuk kegiatan ini. Gunakan menu
                      dropdown &quot;+ Tambah Alokasi IKSK&quot; di atas untuk
                      menambahkan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allocationsList.map((alloc) => {
                        const ikskInfo = iksks.find(
                          (i) => i.iksk_number === alloc.iksk_number,
                        );

                        return (
                          <div
                            key={alloc.iksk_number}
                            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                                  IKSK {alloc.iksk_number}
                                </span>
                                <span
                                  className="truncate text-xs font-semibold text-slate-800"
                                  title={ikskInfo?.full_title}
                                >
                                  {ikskInfo?.full_title ||
                                    `IKSK ${alloc.iksk_number}`}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <span>Sel %: {alloc.pct_cell}</span>
                                <span>•</span>
                                <span>Target: {alloc.target_cell}</span>
                                <span>•</span>
                                <span>Real: {alloc.real_cell}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                              {/* Persentase Input */}
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs font-medium text-slate-600">
                                  Alokasi:
                                </label>
                                <div className="relative w-20">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={alloc.percent}
                                    onChange={(e) =>
                                      handlePercentChange(
                                        kegIndex,
                                        alloc.iksk_number,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2 py-1 pr-5 text-xs font-bold text-slate-800 text-right transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                                  />
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                                    %
                                  </span>
                                </div>
                              </div>

                              {/* Target IKSK Auto-calculated */}
                              <div className="text-right min-w-28">
                                <span className="block text-[10px] font-medium uppercase text-slate-400">
                                  Target IKSK
                                </span>
                                <span className="text-xs font-bold text-[#005baa]">
                                  {formatRp(alloc.target)}
                                </span>
                              </div>

                              {/* Realisasi IKSK Auto-calculated */}
                              <div className="text-right min-w-28">
                                <span className="block text-[10px] font-medium uppercase text-slate-400">
                                  Realisasi IKSK
                                </span>
                                <span className="text-xs font-bold text-emerald-700">
                                  {formatRp(alloc.realisasi)}
                                </span>
                              </div>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveIkskAllocation(
                                    kegIndex,
                                    alloc.iksk_number,
                                  )
                                }
                                title="Hapus alokasi IKSK ini"
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  width={16}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spreadsheet Notice Link Footer */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon
            icon="solar:info-circle-linear"
            width={18}
            className="text-slate-500 shrink-0"
          />
          <span>
            Halaman ini khusus untuk penginputan alokasi dan realisasi anggaran.
            Untuk melihat rekapitulasi data secara menyeluruh, Anda dapat
            mengakses menu <strong>Rekapitulasi Anggaran</strong> di sidebar
            atau langsung membuka dokumen spreadsheet.
          </span>
        </div>
        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#005baa] hover:underline shrink-0"
          >
            Buka Spreadsheet Penuh
            <Icon icon="solar:arrow-right-up-linear" width={14} />
          </a>
        )}
      </div>
    </div>
  );
}
