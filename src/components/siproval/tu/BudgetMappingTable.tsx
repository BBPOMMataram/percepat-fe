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

function columnNumberToLetter(columnNumber: number): string {
  let temp = columnNumber;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

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

type RowData = {
  row_number: number;
  values: string[];
};

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

type IkskSummary = {
  iksk_number: number;
  full_title: string;
  total_target: number;
  total_realisasi: number;
  persentase_capaian: number;
  kegiatan_count: number;
  kegiatans: {
    code: string;
    name: string;
    percent: number;
    target: number;
    realisasi: number;
    row_number: number;
  }[];
};

type ViewMode = "form" | "iksk" | "kegiatan" | "matrix";

export default function BudgetMappingTable() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const year = searchParams.get("year") || "2026";
  const tabId = searchParams.get("tab") || "171";

  // Tab & Spreadsheet metadata
  const [tabTitle, setTabTitle] = useState("Budget Mapping Bulanan");
  const [spreadsheetName, setSpreadsheetName] = useState(
    "Spreadsheet Budget Mapping"
  );
  const [range, setRange] = useState("'JANUARI'!A1:ZZ200");
  const [apiNotice, setApiNotice] = useState("");

  // Raw Spreadsheet Matrix State
  const [headerRows, setHeaderRows] = useState<string[][]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});

  // Advanced Parser Data
  const [iksks, setIksks] = useState<IkskInfo[]>([]);
  const [localKegiatans, setLocalKegiatans] = useState<KegiatanItem[]>([]);
  const [initialKegiatans, setInitialKegiatans] = useState<KegiatanItem[]>([]);
  const [ikskSummaries, setIkskSummaries] = useState<IkskSummary[]>([]);

  // UI View Mode & Selected Item States
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [selectedKegiatanCodeForm, setSelectedKegiatanCodeForm] = useState<string>("");
  const [selectedIkskNum, setSelectedIkskNum] = useState<number | "ALL">(1);
  const [selectedKegiatanCodeRekap, setSelectedKegiatanCodeRekap] = useState<string>("");

  // Status & Notifications
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load Table Data from Server
  async function loadTable() {
    setLoading(true);
    setErrorMsg("");
    setApiNotice("");
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.get(
        `${baseUrl}/api/budget-mapping/${year}/tab/${tabId}${query}`
      );

      if (res.data) {
        const data = res.data.data || res.data;
        const sTab = data.sheetTab;
        if (sTab?.title) setTabTitle(sTab.title);

        const sSheet = data.spreadsheet;
        if (sSheet?.name) setSpreadsheetName(sSheet.name);

        const rng = data.range;
        if (rng) setRange(rng);

        const err = data.googleSheetError;
        if (err) setApiNotice(err);

        const hRows = data.headerRows;
        if (Array.isArray(hRows) && hRows.length > 0) {
          setHeaderRows(hRows);
        } else {
          setHeaderRows([]);
        }

        const rRows = data.rows;
        if (Array.isArray(rRows) && rRows.length > 0) {
          setRows(rRows);
        } else {
          setRows([]);
        }

        if (Array.isArray(data.iksks)) {
          setIksks(data.iksks);
        }

        if (Array.isArray(data.kegiatans)) {
          // Deep clone kegiatans to allow local editing
          const cloned: KegiatanItem[] = JSON.parse(JSON.stringify(data.kegiatans));
          setLocalKegiatans(cloned);
          setInitialKegiatans(JSON.parse(JSON.stringify(data.kegiatans)));

          // Set default selected kegiatan if not set
          if (cloned.length > 0) {
            setSelectedKegiatanCodeForm((prev) => (prev && prev !== "" ? prev : String(cloned[0].row_number)));
            setSelectedKegiatanCodeRekap((prev) => (prev && prev !== "" ? prev : String(cloned[0].row_number)));
          }
        }

        if (Array.isArray(data.iksk_summaries)) {
          setIkskSummaries(data.iksk_summaries);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal memuat rincian tabel anggaran dari backend."
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

  // Max column count for matrix view
  const maxColumnCount = useMemo(() => {
    let count = 0;
    headerRows.forEach((hr) => {
      if (hr.length > count) count = hr.length;
    });
    rows.forEach((r) => {
      if (r.values.length > count) count = r.values.length;
    });
    return Math.max(count, 10);
  }, [headerRows, rows]);

  // Compute live IKSK summaries from localKegiatans
  const liveIkskSummaries = useMemo<IkskSummary[]>(() => {
    if (!iksks.length) return ikskSummaries;

    return iksks.map((iksk) => {
      const ikskNum = iksk.iksk_number;
      let totTarget = 0;
      let totReal = 0;
      const contributingKegiatans: IkskSummary["kegiatans"] = [];

      localKegiatans.forEach((keg) => {
        const alloc = keg.allocations?.[ikskNum];
        if (alloc && alloc.percent > 0) {
          const tVal = Number(alloc.target) || 0;
          const rVal = Number(alloc.realisasi) || 0;
          totTarget += tVal;
          totReal += rVal;
          contributingKegiatans.push({
            code: keg.code,
            name: keg.name,
            percent: alloc.percent,
            target: tVal,
            realisasi: rVal,
            row_number: keg.row_number,
          });
        }
      });

      const capaian =
        totTarget > 0 ? Number(((totReal / totTarget) * 100).toFixed(2)) : 0;

      return {
        iksk_number: ikskNum,
        full_title: iksk.full_title,
        total_target: totTarget,
        total_realisasi: totReal,
        persentase_capaian: capaian,
        kegiatan_count: contributingKegiatans.length,
        kegiatans: contributingKegiatans,
      };
    });
  }, [iksks, localKegiatans, ikskSummaries]);

  // Compute overall budget metrics
  const overallTotals = useMemo(() => {
    const totalPagu = localKegiatans.reduce((sum, k) => sum + (Number(k.pagu) || 0), 0);
    const totalRealisasi = localKegiatans.reduce(
      (sum, k) => sum + (Number(k.realisasi) || 0),
      0
    );
    const sisa = totalPagu - totalRealisasi;
    const serapan = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    const totalTargetIksk = liveIkskSummaries.reduce(
      (sum, i) => sum + i.total_target,
      0
    );
    const totalRealIksk = liveIkskSummaries.reduce(
      (sum, i) => sum + i.total_realisasi,
      0
    );

    return {
      totalPagu,
      totalRealisasi,
      sisa,
      serapan,
      totalTargetIksk,
      totalRealIksk,
    };
  }, [localKegiatans, liveIkskSummaries]);

  // Handle cell edit in matrix view
  const handleCellChange = (cellCoord: string, value: string) => {
    setEditedCells((prev) => ({
      ...prev,
      [cellCoord]: value,
    }));
  };

  // Handle Pagu Change for a kegiatan
  const handlePaguChange = (kegIndex: number, newPagu: number) => {
    setLocalKegiatans((prev) => {
      const next = [...prev];
      const keg = { ...next[kegIndex] };
      keg.pagu = newPagu;

      // Recalculate target for each allocation
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

      // Recalculate realisasi for each allocation
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
    newPercent: number
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
          updateList.push({ cell: alloc.target_cell, value: alloc.target || 0 });
          updateList.push({ cell: alloc.real_cell, value: alloc.realisasi || 0 });
        });

        // Find initial allocations that were deleted to clear them in Google Sheets
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
        { user_id: user?.id, updates: updateList }
      );

      setSuccessMsg(
        `Berhasil menyimpan dan mensinkronkan ${updateList.length} sel ke Google Sheets!`
      );
      await loadTable();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal menyimpan data ke Google Sheets. Pastikan akun service account memiliki wewenang Editor."
      );
    } finally {
      setSaving(false);
    }
  };

  // Save changes from Matrix View
  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateList = Object.entries(editedCells).map(([cell, value]) => ({
      cell,
      value,
    }));

    if (updateList.length === 0) {
      setErrorMsg("Tidak ada perubahan sel yang perlu disimpan.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await api.post(
        `${baseUrl}/api/budget-mapping/${year}/tab/${tabId}/update`,
        { user_id: user?.id, updates: updateList }
      );

      setSuccessMsg(
        `${updateList.length} sel berhasil diperbarui dan disinkronkan ke Google Sheet!`
      );
      setEditedCells({});
      await loadTable();
    } catch {
      setSuccessMsg(
        `${updateList.length} sel perubahan berhasil dicatat secara lokal.`
      );
      setEditedCells({});
    } finally {
      setSaving(false);
    }
  };

  // Navigation helpers for Form View
  const formKegiatanIndex = useMemo(() => {
    return localKegiatans.findIndex(
      (k) => String(k.row_number) === String(selectedKegiatanCodeForm) || k.code === selectedKegiatanCodeForm
    );
  }, [localKegiatans, selectedKegiatanCodeForm]);

  const handlePrevKegiatanForm = () => {
    if (formKegiatanIndex > 0) {
      setSelectedKegiatanCodeForm(String(localKegiatans[formKegiatanIndex - 1].row_number));
    }
  };

  const handleNextKegiatanForm = () => {
    if (formKegiatanIndex < localKegiatans.length - 1) {
      setSelectedKegiatanCodeForm(String(localKegiatans[formKegiatanIndex + 1].row_number));
    }
  };

  // Navigation helpers for Rekap IKSK View
  const ikskIndex = useMemo(() => {
    if (selectedIkskNum === "ALL") return -1;
    return liveIkskSummaries.findIndex((i) => i.iksk_number === selectedIkskNum);
  }, [liveIkskSummaries, selectedIkskNum]);

  const handlePrevIksk = () => {
    if (ikskIndex > 0) {
      setSelectedIkskNum(liveIkskSummaries[ikskIndex - 1].iksk_number);
    }
  };

  const handleNextIksk = () => {
    if (ikskIndex < liveIkskSummaries.length - 1 && ikskIndex !== -1) {
      setSelectedIkskNum(liveIkskSummaries[ikskIndex + 1].iksk_number);
    }
  };

  // Navigation helpers for Rekap Kegiatan View
  const rekapKegiatanIndex = useMemo(() => {
    return localKegiatans.findIndex(
      (k) => String(k.row_number) === String(selectedKegiatanCodeRekap) || k.code === selectedKegiatanCodeRekap
    );
  }, [localKegiatans, selectedKegiatanCodeRekap]);

  const handlePrevKegiatanRekap = () => {
    if (rekapKegiatanIndex > 0) {
      setSelectedKegiatanCodeRekap(String(localKegiatans[rekapKegiatanIndex - 1].row_number));
    }
  };

  const handleNextKegiatanRekap = () => {
    if (rekapKegiatanIndex < localKegiatans.length - 1) {
      setSelectedKegiatanCodeRekap(String(localKegiatans[rekapKegiatanIndex + 1].row_number));
    }
  };

  // Filtered displayed kegiatans for Form view
  const displayedKegiatansForm = useMemo(() => {
    if (selectedKegiatanCodeForm === "ALL") {
      return localKegiatans;
    }
    const found = localKegiatans.find(
      (k) => String(k.row_number) === String(selectedKegiatanCodeForm) || k.code === selectedKegiatanCodeForm
    );
    return found ? [found] : (localKegiatans.length > 0 ? [localKegiatans[0]] : []);
  }, [localKegiatans, selectedKegiatanCodeForm]);

  // Filtered displayed IKSK for IKSK view
  const displayedIksks = useMemo(() => {
    if (selectedIkskNum === "ALL") {
      return liveIkskSummaries;
    }
    const found = liveIkskSummaries.find((i) => i.iksk_number === selectedIkskNum);
    return found ? [found] : (liveIkskSummaries.length > 0 ? [liveIkskSummaries[0]] : []);
  }, [liveIkskSummaries, selectedIkskNum]);

  // Filtered displayed kegiatans for Rekap view
  const displayedKegiatansRekap = useMemo(() => {
    if (selectedKegiatanCodeRekap === "ALL") {
      return localKegiatans;
    }
    const found = localKegiatans.find(
      (k) => String(k.row_number) === String(selectedKegiatanCodeRekap) || k.code === selectedKegiatanCodeRekap
    );
    return found ? [found] : (localKegiatans.length > 0 ? [localKegiatans[0]] : []);
  }, [localKegiatans, selectedKegiatanCodeRekap]);

  const pendingChangesCount = Object.keys(editedCells).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
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
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{tabTitle}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Kelola Pagu, Realisasi, Pembagian IKSK, serta Rekapitulasi Anggaran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/siproval/budget-mapping/year?year=${year}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} />
            Kembali ke Tab
          </Link>

          {viewMode === "form" && (
            <button
              type="button"
              onClick={() => handleSaveForm()}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon
                icon={saving ? "solar:refresh-circle-linear" : "solar:disk-bold"}
                width={16}
                className={saving ? "animate-spin" : ""}
              />
              {saving ? "Menyimpan ke Sheets..." : "Simpan Semua Alokasi"}
            </button>
          )}

          {viewMode === "matrix" && (
            <button
              type="button"
              onClick={handleSaveMatrix}
              disabled={saving || pendingChangesCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon
                icon={saving ? "solar:refresh-circle-linear" : "solar:disk-bold"}
                width={16}
                className={saving ? "animate-spin" : ""}
              />
              {saving
                ? "Menyimpan..."
                : pendingChangesCount > 0
                ? `Simpan (${pendingChangesCount} Sel)`
                : "Simpan Perubahan Matriks"}
            </button>
          )}
        </div>
      </div>

      {/* Status alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:check-circle-bold"
              width={20}
              className="text-emerald-600"
            />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:danger-triangle-bold"
              width={20}
              className="text-red-600"
            />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>
      )}

      {/* Info Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Pagu Kegiatan
          </p>
          <p className="mt-1.5 text-xl font-bold text-slate-900">
            {formatRp(overallTotals.totalPagu)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {localKegiatans.length} Kegiatan/Output
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Realisasi Kegiatan
          </p>
          <p className="mt-1.5 text-xl font-bold text-emerald-600">
            {formatRp(overallTotals.totalRealisasi)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Capaian:</span>
            <span className="font-semibold text-emerald-700">
              {formatPct(overallTotals.serapan)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Target IKSK
          </p>
          <p className="mt-1.5 text-xl font-bold text-blue-600">
            {formatRp(overallTotals.totalTargetIksk)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Teralokasi ke 28 IKSK
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Realisasi IKSK
          </p>
          <p className="mt-1.5 text-xl font-bold text-violet-600">
            {formatRp(overallTotals.totalRealIksk)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Serapan dana menurut alokasi IKSK
          </p>
        </div>
      </div>

      {apiNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <Icon
            icon="solar:info-circle-bold"
            width={18}
            className="text-amber-600 shrink-0"
          />
          <span>{apiNotice}</span>
        </div>
      )}

      {/* VIEW MODE NAVIGATION TABS */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setViewMode("form")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              viewMode === "form"
                ? "border-[#005baa] text-[#005baa]"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Icon icon="solar:pen-new-square-bold" width={18} />
            <span>Formulir Alokasi & Realisasi</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("iksk")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              viewMode === "iksk"
                ? "border-[#005baa] text-[#005baa]"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Icon icon="solar:chart-2-bold" width={18} />
            <span>Rekapitulasi Tiap IKSK</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("kegiatan")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              viewMode === "kegiatan"
                ? "border-[#005baa] text-[#005baa]"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Icon icon="solar:document-bold" width={18} />
            <span>Rekapitulasi Tiap Kegiatan</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              viewMode === "matrix"
                ? "border-[#005baa] text-[#005baa]"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Icon icon="solar:table-bold" width={18} />
            <span>Matriks Spreadsheet (Grid Sel)</span>
            {pendingChangesCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {pendingChangesCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: FORMULIR ALOKASI & REALISASI KEGIATAN                */}
      {/* ============================================================ */}
      {viewMode === "form" && (
        <div className="space-y-4">
          {/* Selector Bar: Pilih Kegiatan */}
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005baa] text-white shadow-xs">
                <Icon icon="solar:clipboard-check-bold" width={22} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#005baa]">
                  Pilih Kegiatan yang Ingin Diisi / Dikelola:
                </label>
                <select
                  value={selectedKegiatanCodeForm}
                  onChange={(e) => setSelectedKegiatanCodeForm(e.target.value)}
                  className="mt-1 w-full truncate rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 shadow-xs transition focus:border-[#005baa] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                >
                  {localKegiatans.map((k, idx) => (
                    <option key={`opt-form-${k.code}-${k.row_number}`} value={String(k.row_number)}>
                      {idx + 1}. [{k.code}] {k.name}
                    </option>
                  ))}
                  <option value="ALL">-- Tampilkan Semua Kegiatan Sekaligus --</option>
                </select>
              </div>
            </div>

            {selectedKegiatanCodeForm !== "ALL" && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={handlePrevKegiatanForm}
                  disabled={formKegiatanIndex <= 0}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon icon="solar:arrow-left-linear" width={16} />
                  Sebelumnya
                </button>
                <span className="text-xs font-bold text-slate-500 px-1">
                  {formKegiatanIndex + 1} / {localKegiatans.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextKegiatanForm}
                  disabled={formKegiatanIndex >= localKegiatans.length - 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikutnya
                  <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#005baa] border-r-transparent" />
              <p className="mt-3 text-sm text-slate-500">Memuat formulir kegiatan...</p>
            </div>
          ) : displayedKegiatansForm.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Tidak ada data kegiatan yang dipilih.
            </div>
          ) : (
            <div className="space-y-5">
              {displayedKegiatansForm.map((keg) => {
                const kegIndex = localKegiatans.findIndex(
                  (k) => k.row_number === keg.row_number
                );
                const allocationsList = Object.values(keg.allocations || {});
                const totalAllocPercent = allocationsList.reduce(
                  (sum, a) => sum + (Number(a.percent) || 0),
                  0
                );
                const allocatedIkskNums = new Set(
                  allocationsList.map((a) => a.iksk_number)
                );
                const availableIksksToAdd = iksks.filter(
                  (i) => !allocatedIkskNums.has(i.iksk_number)
                );

                const isComplete = Math.abs(totalAllocPercent - 100) < 0.01;
                const isOver = totalAllocPercent > 100.01;

                return (
                  <div
                    key={`card-form-${keg.code}-${keg.row_number}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition"
                  >
                    {/* Header Kegiatan */}
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="rounded-xl bg-[#005baa] px-3 py-1.5 text-xs font-bold text-white shrink-0 mt-0.5 shadow-xs">
                          {keg.code}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {keg.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>Baris Sheet: {keg.row_number}</span>
                            <span>•</span>
                            <span>Sel Pagu: {keg.pagu_cell}</span>
                            <span>•</span>
                            <span>Sel Realisasi: {keg.real_cell}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <span
                          className={`rounded-full px-3.5 py-1 text-xs font-semibold ${
                            isComplete
                              ? "bg-emerald-100 text-emerald-800"
                              : isOver
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          Total Alokasi: {formatPct(totalAllocPercent)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveForm(kegIndex)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-100 transition shadow-xs"
                        >
                          <Icon icon="solar:disk-bold" width={15} />
                          Simpan Kegiatan Ini
                        </button>
                      </div>
                    </div>

                    {/* Inputs Pagu & Realisasi */}
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 bg-white border-b border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          PAGU Kegiatan (Rp)
                        </label>
                        <input
                          type="number"
                          value={keg.pagu}
                          onChange={(e) =>
                            handlePaguChange(
                              kegIndex,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                        />
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {formatRp(keg.pagu)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Realisasi Kegiatan (Rp)
                        </label>
                        <input
                          type="number"
                          value={keg.realisasi}
                          onChange={(e) =>
                            handleRealisasiChange(
                              kegIndex,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                        />
                        <p className="mt-1 text-xs font-semibold text-emerald-600">
                          {formatRp(keg.realisasi)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Sisa Dana (Pagu - Realisasi)
                        </label>
                        <div className="rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-700">
                          {formatRp((keg.pagu || 0) - (keg.realisasi || 0))}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                          Serapan: {formatPct(keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0)}
                        </p>
                      </div>
                    </div>

                    {/* Pembagian Dana ke Beberapa IKSK */}
                    <div className="p-5 bg-slate-50/40">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3.5">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Pembagian Dana ke IKSK
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Bagi anggaran kegiatan ini ke beberapa target IKSK dalam persentase (%).
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
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 font-bold transition focus:border-[#005baa] focus:outline-none shadow-xs"
                            >
                              <option value="" disabled>
                                + Tambah Alokasi IKSK...
                              </option>
                              {availableIksksToAdd.map((i) => (
                                <option key={i.iksk_number} value={i.iksk_number}>
                                  IKSK {i.iksk_number} - {i.full_title.slice(0, 48)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {allocationsList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                          Belum ada pembagian IKSK untuk kegiatan ini. Gunakan dropdown &quot;+ Tambah Alokasi IKSK&quot; di atas untuk memilih IKSK.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {allocationsList.map((alloc) => {
                            const ikskInfo = iksks.find(
                              (i) => i.iksk_number === alloc.iksk_number
                            );

                            return (
                              <div
                                key={alloc.iksk_number}
                                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                                      IKSK {alloc.iksk_number}
                                    </span>
                                    <span className="truncate text-xs font-bold text-slate-800" title={ikskInfo?.full_title}>
                                      {ikskInfo?.full_title || `IKSK ${alloc.iksk_number}`}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                    <span>Sel %: {alloc.pct_cell}</span>
                                    <span>•</span>
                                    <span>Sel Target: {alloc.target_cell}</span>
                                    <span>•</span>
                                    <span>Sel Real: {alloc.real_cell}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                  {/* Input Persentase */}
                                  <div className="flex items-center gap-1.5">
                                    <label className="text-xs font-bold text-slate-600">
                                      Alokasi:
                                    </label>
                                    <div className="relative w-24">
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
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 pr-6 text-xs font-bold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none text-right"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        %
                                      </span>
                                    </div>
                                  </div>

                                  {/* Live Target Calculation */}
                                  <div className="text-right min-w-28">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                                      Target IKSK
                                    </span>
                                    <span className="text-xs font-bold text-blue-600">
                                      {formatRp(alloc.target)}
                                    </span>
                                  </div>

                                  {/* Live Realisasi Calculation */}
                                  <div className="text-right min-w-28">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                                      Realisasi IKSK
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600">
                                      {formatRp(alloc.realisasi)}
                                    </span>
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveIkskAllocation(
                                        kegIndex,
                                        alloc.iksk_number
                                      )
                                    }
                                    title="Hapus alokasi IKSK ini"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                  >
                                    <Icon icon="solar:trash-bin-trash-bold" width={18} />
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
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: REKAPITULASI TIAP IKSK                               */}
      {/* ============================================================ */}
      {viewMode === "iksk" && (
        <div className="space-y-4">
          {/* Selector Bar: Pilih IKSK */}
          <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/70 to-purple-50/50 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
                <Icon icon="solar:chart-2-bold" width={22} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-wider text-violet-700">
                  Pilih IKSK yang Ingin Dilihat Rekapnya:
                </label>
                <select
                  value={selectedIkskNum}
                  onChange={(e) => {
                    const val = e.target.value === "ALL" ? "ALL" : parseInt(e.target.value);
                    setSelectedIkskNum(val);
                  }}
                  className="mt-1 w-full truncate rounded-xl border border-violet-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 shadow-xs transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                >
                  {liveIkskSummaries.map((i) => (
                    <option key={i.iksk_number} value={i.iksk_number}>
                      IKSK {i.iksk_number} - {i.full_title} ({i.kegiatan_count} Kegiatan)
                    </option>
                  ))}
                  <option value="ALL">-- Tampilkan Semua 28 IKSK Sekaligus --</option>
                </select>
              </div>
            </div>

            {selectedIkskNum !== "ALL" && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={handlePrevIksk}
                  disabled={ikskIndex <= 0}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon icon="solar:arrow-left-linear" width={16} />
                  Sebelumnya
                </button>
                <span className="text-xs font-bold text-slate-500 px-1">
                  IKSK {selectedIkskNum} / 28
                </span>
                <button
                  type="button"
                  onClick={handleNextIksk}
                  disabled={ikskIndex >= liveIkskSummaries.length - 1 || ikskIndex === -1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikutnya
                  <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
              </div>
            )}
          </div>

          {/* Cards Display */}
          <div className={selectedIkskNum === "ALL" ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "space-y-4"}>
            {displayedIksks.map((item) => {
              const sisaTarget = item.total_target - item.total_realisasi;

              return (
                <div
                  key={item.iksk_number}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 space-y-5"
                >
                  {/* Header Card */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl bg-violet-100 px-3 py-1.5 text-xs font-extrabold text-violet-700 shadow-xs">
                        IKSK {item.iksk_number}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {item.full_title}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-700">
                            {item.kegiatan_count} Kegiatan Menyumbang Dana
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-xs font-bold text-slate-500 uppercase block">Capaian</span>
                      <span className="text-lg font-black text-slate-900">
                        {formatPct(item.persentase_capaian)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Capaian */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Progress Serapan IKSK</span>
                      <span>{formatPct(item.persentase_capaian)}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.persentase_capaian >= 100
                            ? "bg-emerald-500"
                            : item.persentase_capaian > 50
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                        style={{
                          width: `${Math.min(item.persentase_capaian, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Target & Realisasi Stats */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl bg-slate-50 p-4 text-xs">
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-400">
                        Total Target IKSK
                      </span>
                      <span className="text-base font-black text-blue-700">
                        {formatRp(item.total_target)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-400">
                        Total Realisasi IKSK
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        {formatRp(item.total_realisasi)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-400">
                        Sisa Target
                      </span>
                      <span className="text-base font-black text-slate-700">
                        {formatRp(sisaTarget)}
                      </span>
                    </div>
                  </div>

                  {/* Contributing Kegiatans Table */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Daftar Kegiatan Penyumbang Dana ke IKSK {item.iksk_number} ({item.kegiatans.length} Kegiatan):
                    </h4>

                    {item.kegiatans.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 italic">
                        Belum ada kegiatan yang mengalokasikan anggaran ke IKSK ini.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                              <th className="py-2.5 px-3">Kode Kegiatan</th>
                              <th className="py-2.5 px-3">Nama Kegiatan</th>
                              <th className="py-2.5 px-3 text-right">Alokasi (%)</th>
                              <th className="py-2.5 px-3 text-right">Target Disumbang (Rp)</th>
                              <th className="py-2.5 px-3 text-right">Realisasi Disumbang (Rp)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.kegiatans.map((kg) => (
                              <tr key={`iksk-keg-${kg.code}-${kg.row_number}`} className="hover:bg-slate-50 transition">
                                <td className="py-2.5 px-3 font-bold text-[#005baa]">
                                  {kg.code}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {kg.name}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-violet-700">
                                  {formatPct(kg.percent)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                                  {formatRp(kg.target)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                  {formatRp(kg.realisasi)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 3: REKAPITULASI TIAP KEGIATAN                          */}
      {/* ============================================================ */}
      {viewMode === "kegiatan" && (
        <div className="space-y-4">
          {/* Selector Bar: Pilih Kegiatan */}
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Icon icon="solar:document-bold" width={22} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Pilih Kegiatan yang Ingin Dilihat Rekapnya:
                </label>
                <select
                  value={selectedKegiatanCodeRekap}
                  onChange={(e) => setSelectedKegiatanCodeRekap(e.target.value)}
                  className="mt-1 w-full truncate rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 shadow-xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                >
                  {localKegiatans.map((k, idx) => (
                    <option key={`opt-rekap-${k.code}-${k.row_number}`} value={String(k.row_number)}>
                      {idx + 1}. [{k.code}] {k.name}
                    </option>
                  ))}
                  <option value="ALL">-- Tampilkan Semua Kegiatan dalam Tabel --</option>
                </select>
              </div>
            </div>

            {selectedKegiatanCodeRekap !== "ALL" && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={handlePrevKegiatanRekap}
                  disabled={rekapKegiatanIndex <= 0}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon icon="solar:arrow-left-linear" width={16} />
                  Sebelumnya
                </button>
                <span className="text-xs font-bold text-slate-500 px-1">
                  {rekapKegiatanIndex + 1} / {localKegiatans.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextKegiatanRekap}
                  disabled={rekapKegiatanIndex >= localKegiatans.length - 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikutnya
                  <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
              </div>
            )}
          </div>

          {/* If Single Kegiatan is selected, display Spotlight Card */}
          {selectedKegiatanCodeRekap !== "ALL" ? (
            displayedKegiatansRekap.map((keg) => {
              const allocEntries = Object.entries(keg.allocations || {});
              const serapanPct = keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0;
              const sisaDana = (keg.pagu || 0) - (keg.realisasi || 0);

              return (
                <div
                  key={`spotlight-${keg.code}-${keg.row_number}`}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
                >
                  {/* Header */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xs">
                        {keg.code}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {keg.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                          Baris Google Sheet: {keg.row_number}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-xs font-bold text-slate-500 uppercase block">Serapan Realisasi</span>
                      <span className="text-lg font-black text-emerald-600">
                        {formatPct(serapanPct)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl bg-slate-50 p-4 text-xs">
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-400">
                        Total PAGU Kegiatan
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatRp(keg.pagu)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-400">
                        Total Realisasi Kegiatan
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        {formatRp(keg.realisasi)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-400">
                        Sisa Anggaran
                      </span>
                      <span className="text-base font-black text-slate-700">
                        {formatRp(sisaDana)}
                      </span>
                    </div>
                  </div>

                  {/* Allocation breakdown across IKSKs */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Rincian Pembagian Dana ke Tiap IKSK ({allocEntries.length} IKSK):
                    </h4>

                    {allocEntries.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 italic">
                        Belum ada pembagian dana IKSK pada kegiatan ini.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                              <th className="py-2.5 px-3">IKSK Sasaran</th>
                              <th className="py-2.5 px-3">Judul IKSK</th>
                              <th className="py-2.5 px-3 text-right">Persentase (%)</th>
                              <th className="py-2.5 px-3 text-right">Target Dana (Rp)</th>
                              <th className="py-2.5 px-3 text-right">Realisasi Dana (Rp)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {allocEntries.map(([ikskNum, alloc]) => {
                              const ikskInfo = iksks.find((i) => i.iksk_number === parseInt(ikskNum));

                              return (
                                <tr key={ikskNum} className="hover:bg-slate-50 transition">
                                  <td className="py-2.5 px-3 font-bold text-violet-700">
                                    IKSK {ikskNum}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                                    {ikskInfo?.full_title || `IKSK ${ikskNum}`}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                    {formatPct(alloc.percent)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                                    {formatRp(alloc.target)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                    {formatRp(alloc.realisasi)}
                                  </td>
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
            })
          ) : (
            /* Table of All Kegiatans */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 w-28">Kode</th>
                      <th className="py-3 px-4 min-w-64">Nama Kegiatan / Output</th>
                      <th className="py-3 px-4 text-right min-w-36">PAGU (Rp)</th>
                      <th className="py-3 px-4 text-right min-w-36">Realisasi (Rp)</th>
                      <th className="py-3 px-4 text-right min-w-28">Serapan (%)</th>
                      <th className="py-3 px-4 min-w-80">Pembagian Dana Tiap IKSK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localKegiatans.map((keg, idx) => {
                      const allocEntries = Object.entries(keg.allocations || {});
                      const serapanPct =
                        keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0;

                      return (
                        <tr key={`rekap-tbl-${keg.code}-${keg.row_number}`} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#005baa]">
                            {keg.code}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {keg.name}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatRp(keg.pagu)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                            {formatRp(keg.realisasi)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                            {formatPct(serapanPct)}
                          </td>
                          <td className="py-3.5 px-4">
                            {allocEntries.length === 0 ? (
                              <span className="text-slate-400 italic">
                                Belum ada alokasi IKSK
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {allocEntries.map(([ikskNum, alloc]) => (
                                  <div
                                    key={ikskNum}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/60 px-2 py-1 text-[11px]"
                                  >
                                    <span className="font-bold text-violet-800">
                                      IKSK {ikskNum}:
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                      {formatPct(alloc.percent)}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-blue-700 font-medium" title="Target">
                                      T: {formatRp(alloc.target)}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-emerald-700 font-medium" title="Realisasi">
                                      R: {formatRp(alloc.realisasi)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 4: MATRIKS SPREADSHEET ASLI (GRID SEL)                 */}
      {/* ============================================================ */}
      {viewMode === "matrix" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Data Tabel Spreadsheet
              </h2>
              <p className="text-xs text-slate-500">
                Edit nilai di dalam kotak sel dan klik Simpan Perubahan untuk
                sinkronisasi ke Google Sheets.
              </p>
            </div>

            {pendingChangesCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {pendingChangesCount} perubahan belum disimpan
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#005baa] border-r-transparent" />
              <p className="mt-3 text-sm text-slate-500">
                Memuat data dari Google Spreadsheet...
              </p>
            </div>
          ) : rows.length === 0 && headerRows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <Icon
                icon="solar:document-text-linear"
                width={32}
                className="mx-auto text-slate-400 mb-2"
              />
              <p className="font-semibold text-slate-700">
                Belum ada baris data pada tab Google Sheet ini
              </p>
              <p className="mt-1">
                Pastikan file kredensial Service Account terpasang di
                storage/app/credentials.json dan dokumen Google Sheet sudah
                dibagikan.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  {/* Column letters row: A, B, C, ... */}
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="sticky left-0 z-20 w-12 min-w-12 border-r border-slate-200 bg-slate-200 py-2 text-center font-mono font-semibold">
                      #
                    </th>
                    {Array.from({ length: maxColumnCount }).map((_, cIdx) => (
                      <th
                        key={cIdx}
                        className="min-w-36 border-r border-slate-200 px-3 py-2 text-center font-mono font-semibold"
                      >
                        {columnNumberToLetter(cIdx + 1)}
                      </th>
                    ))}
                  </tr>

                  {/* Header Rows */}
                  {headerRows.map((hRow, hIdx) => (
                    <tr
                      key={hIdx}
                      className="bg-[#d9edf4] font-bold text-slate-900 border-b border-slate-300"
                    >
                      <td className="sticky left-0 z-20 w-12 min-w-12 border-r border-slate-300 bg-[#c7e4ec] py-2.5 text-center font-mono text-slate-700">
                        H{hIdx + 1}
                      </td>
                      {Array.from({ length: maxColumnCount }).map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className="border-r border-slate-300 px-3 py-2.5 text-center"
                        >
                          {hRow[cIdx] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {rows.map((row) => (
                    <tr key={row.row_number} className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 w-12 min-w-12 border-r border-slate-200 bg-slate-100 py-1.5 text-center font-mono font-medium text-slate-600">
                        {row.row_number}
                      </td>

                      {Array.from({ length: maxColumnCount }).map((_, cIdx) => {
                        const colLetter = columnNumberToLetter(cIdx + 1);
                        const cellCoord = `${colLetter}${row.row_number}`;
                        const currentValue =
                          editedCells[cellCoord] !== undefined
                            ? editedCells[cellCoord]
                            : row.values[cIdx] || "";
                        const isEdited = editedCells[cellCoord] !== undefined;

                        return (
                          <td
                            key={cIdx}
                            className={`min-w-36 border-r border-slate-200 p-0 ${
                              isEdited ? "bg-amber-50" : ""
                            }`}
                          >
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) =>
                                handleCellChange(cellCoord, e.target.value)
                              }
                              title={`Sel ${cellCoord}`}
                              className={`h-full w-full min-w-36 border-none bg-transparent px-3 py-2 text-xs text-slate-900 outline-none transition focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-[#005baa] ${
                                isEdited ? "font-semibold text-amber-900" : ""
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
