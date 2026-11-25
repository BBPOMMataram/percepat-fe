"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import api from "@/utils/api";
import { confirmWarning, isAlertOpen } from "@/utils/alerts";
import RekapRhpkForm from "./RekapRhpkForm";
import RekapRhpkMonitoringSection from "./RekapRhpkMonitoringSection";
import {
  DynamicTableColumn,
  IndicatorSummaryItem,
  MONTH_NAMES,
  RekapDetailData,
  RekapIndexData,
} from "./types";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

interface Props {
  actorMode: "katim" | "tu";
  activeView?: "rekap" | "sheet";
  onChangeView?: (view: "rekap" | "sheet") => void;
  sheetViewLabel?: string;
}

type FilterTab =
  | "all"
  | "assigned"
  | "unfilled"
  | "tercapai"
  | "belum"
  | "monitoring"
  | "conflict";

const COLUMN_GROUP_LABELS: Record<DynamicTableColumn["group"], string> = {
  core: "Identitas",
  capaian: "Target & Capaian",
  narasi: "Narasi Rekap RHPK",
  monitoring: "Monitoring Lintas Bulan",
  status: "Status Pengisian",
};

const fmtNum = (val: number | null | undefined) => {
  if (val === null || val === undefined || Number.isNaN(val)) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(val);
};

const fmtPct = (val: number | null | undefined) => {
  if (val === null || val === undefined || Number.isNaN(val)) return "-";
  return `${fmtNum(val)}%`;
};

function buildFallbackColumns(
  year: number,
  month: number,
  canEdit: boolean
): DynamicTableColumn[] {
  const monthLabel = MONTH_NAMES[month - 1] || `Bulan ${month}`;
  return [
    { key: "iksk", label: "Indikator (IKSK)", group: "core", editable: false, default_visible: true, available: true },
    { key: "target_tahunan", label: `Target ${year}`, group: "capaian", editable: false, default_visible: false, available: true },
    { key: "target_bulan", label: `Target ${monthLabel}`, group: "capaian", editable: false, default_visible: true, available: true },
    { key: "realisasi", label: `Realisasi ${monthLabel}`, group: "capaian", editable: false, default_visible: true, available: true },
    { key: "capaian_bulan", label: `% Capaian ${monthLabel}`, group: "capaian", editable: false, default_visible: true, available: true },
    { key: "capaian_tahun", label: `% Capaian ${year}`, group: "capaian", editable: false, default_visible: false, available: true },
    { key: "kendala", label: "Kendala", group: "narasi", editable: canEdit, default_visible: false, available: true },
    { key: "rtl", label: "RTL", group: "narasi", editable: canEdit, default_visible: false, available: true },
    { key: "rekomendasi", label: "Rekomendasi", group: "narasi", editable: canEdit, default_visible: false, available: true },
    { key: "analisis", label: "Analisis Capaian", group: "narasi", editable: canEdit, default_visible: false, available: true },
    { key: "timeline", label: "Timeline", group: "narasi", editable: canEdit, default_visible: false, available: true },
    { key: "arahan", label: "Arahan Pimpinan", group: "narasi", editable: canEdit, default_visible: false, available: true },
    { key: "monitoring", label: "Monitoring Kendala", group: "monitoring", editable: canEdit, default_visible: month > 1, available: month > 1 },
    { key: "status_rekap", label: "Status Rekap", group: "status", editable: false, default_visible: true, available: true },
  ];
}

function renderNarrativeCell(text: string | undefined) {
  const cleaned = (text || "").trim();
  if (!cleaned || cleaned === "-") {
    return <span className="text-xs text-slate-400">-</span>;
  }
  return (
    <p
      className="max-w-[230px] text-xs text-slate-700 line-clamp-2 leading-relaxed"
      title={cleaned}
    >
      {cleaned}
    </p>
  );
}

export default function RekapRhpkModule({
  actorMode,
  activeView = "rekap",
  onChangeView,
  sheetViewLabel,
}: Props) {
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const [indexData, setIndexData] = useState<RekapIndexData | null>(null);
  const [selectedIkskId, setSelectedIkskId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<RekapDetailData | null>(null);

  const [userColumnOverrides, setUserColumnOverrides] = useState<
    Record<string, boolean>
  >({});
  const [colMenuOpen, setColMenuOpen] = useState<boolean>(false);
  const colMenuRef = useRef<HTMLDivElement | null>(null);

  const [loadingIndex, setLoadingIndex] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [savingForm, setSavingForm] = useState<boolean>(false);
  const [pullingExcel, setPullingExcel] = useState<boolean>(false);
  const [resolvingField, setResolvingField] = useState<string | null>(null);
  const [savingMonitoringId, setSavingMonitoringId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  }, []);

  // Konfirmasi (toast react-toastify) bila ada perubahan yang belum disimpan.
  const confirmLeaveIfDirty = useCallback(async (): Promise<boolean> => {
    if (!hasUnsavedChanges) return true;
    return confirmWarning({
      title: "Perubahan Belum Disimpan",
      text: "Masih ada perubahan Rekap RHPK yang belum disimpan. Lanjutkan dan abaikan perubahan?",
      confirmButtonText: "Ya, Abaikan Perubahan",
      cancelButtonText: "Kembali",
      destructive: true,
    });
  }, [hasUnsavedChanges]);

  const fetchIndex = useCallback(
    async (targetYear: number, targetMonth: number) => {
      setLoadingIndex(true);
      try {
        const res = await api.get(`${baseUrl}/api/rekap-rhpk/index`, {
          params: { year: targetYear, month: targetMonth, context: actorMode },
        });
        const data: RekapIndexData | undefined = res.data?.data;
        if (data) {
          setIndexData(data);
          setSelectedIkskId((prev) =>
            prev !== null && data.indicators.some((i) => i.iksk_id === prev)
              ? prev
              : null
          );
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Gagal memuat daftar indikator Rekap RHPK.";
        showToast("error", msg);
      } finally {
        setLoadingIndex(false);
      }
    },
    [actorMode, showToast]
  );

  const fetchDetail = useCallback(
    async (targetYear: number, ikskId: number, targetMonth: number) => {
      setLoadingDetail(true);
      try {
        const res = await api.get(`${baseUrl}/api/rekap-rhpk/detail`, {
          params: {
            year: targetYear,
            iksk_id: ikskId,
            month: targetMonth,
            context: actorMode,
          },
        });
        if (res.data?.data) {
          setDetailData(res.data.data);
          setHasUnsavedChanges(false);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Gagal memuat detail Rekap RHPK.";
        showToast("error", msg);
      } finally {
        setLoadingDetail(false);
      }
    },
    [actorMode, showToast]
  );

  useEffect(() => {
    fetchIndex(year, month);
  }, [year, month, fetchIndex]);

  useEffect(() => {
    if (selectedIkskId) {
      fetchDetail(year, selectedIkskId, month);
    } else {
      setDetailData(null);
    }
  }, [year, month, selectedIkskId, fetchDetail]);

  useEffect(() => {
    if (!colMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        colMenuRef.current &&
        !colMenuRef.current.contains(event.target as Node)
      ) {
        setColMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [colMenuOpen]);

  const handleCloseModal = useCallback(async () => {
    if (!(await confirmLeaveIfDirty())) return;
    setSelectedIkskId(null);
    setDetailData(null);
    setHasUnsavedChanges(false);
  }, [confirmLeaveIfDirty]);

  useEffect(() => {
    if (selectedIkskId === null && !colMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape saat pop-up terbuka hanya menutup pop-up, bukan modal di belakangnya.
      if (isAlertOpen()) return;
      if (colMenuOpen) {
        setColMenuOpen(false);
        return;
      }
      if (selectedIkskId !== null) {
        void handleCloseModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIkskId, colMenuOpen, handleCloseModal]);

  useEffect(() => {
    if (selectedIkskId === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedIkskId]);

  const ctx = indexData?.actor_context;
  const canEdit = ctx?.can_edit ?? actorMode === "katim";

  const availableColumns = useMemo<DynamicTableColumn[]>(() => {
    const raw =
      indexData?.columns && indexData.columns.length > 0
        ? indexData.columns
        : buildFallbackColumns(year, month, canEdit);
    return raw.filter((col) => col.available);
  }, [indexData?.columns, year, month, canEdit]);

  const visibleColumns = useMemo<DynamicTableColumn[]>(() => {
    return availableColumns.filter((col) => {
      if (col.key === "iksk") return true;
      return col.key in userColumnOverrides
        ? userColumnOverrides[col.key]
        : col.default_visible;
    });
  }, [availableColumns, userColumnOverrides]);

  const allIndicators = useMemo(
    () => indexData?.indicators || [],
    [indexData]
  );

  const assignedCount = useMemo(
    () =>
      allIndicators.filter((i) => i.is_assigned ?? i.can_edit ?? canEdit)
        .length,
    [allIndicators, canEdit]
  );

  const unfilledCount = useMemo(
    () => allIndicators.filter((i) => !i.is_filled).length,
    [allIndicators]
  );

  const readOnlyCount = useMemo(
    () => Math.max(0, allIndicators.length - assignedCount),
    [allIndicators.length, assignedCount]
  );

  const showScopeFilter =
    ctx?.actor === "katim" || (canEdit && readOnlyCount > 0);

  const filteredIndicators = useMemo<IndicatorSummaryItem[]>(() => {
    const q = search.trim().toLowerCase();
    const cleanNum = q.replace(/^iksk\s*/i, "").trim();

    return allIndicators.filter((item) => {
      // 1. Pencarian Teks / Nomor IKSK / Katim
      if (q) {
        const matchesNum = cleanNum && String(item.iksk_id) === cleanNum;
        const matchesText =
          String(item.iksk_id).includes(q) ||
          item.iksk_name.toLowerCase().includes(q) ||
          item.sasaran_kode.toLowerCase().includes(q) ||
          item.assigned_katims.some(
            (k) =>
              k.name.toLowerCase().includes(q) ||
              k.call_name.toLowerCase().includes(q)
          );
        if (!matchesNum && !matchesText) return false;
      }

      // 2. Tab Filter Terpadu
      if (filterTab === "assigned") {
        return Boolean(item.can_edit ?? canEdit);
      }
      if (filterTab === "unfilled") {
        return !item.is_filled;
      }
      if (filterTab === "tercapai") {
        return item.performance.status === "tercapai";
      }
      if (filterTab === "belum") {
        return item.performance.status === "belum";
      }
      if (filterTab === "monitoring") {
        return item.unresolved_monitoring_count > 0;
      }
      if (filterTab === "conflict") {
        return item.has_conflict;
      }

      return true;
    });
  }, [allIndicators, canEdit, filterTab, search]);

  const currentIdxInFiltered = useMemo(
    () => filteredIndicators.findIndex((i) => i.iksk_id === selectedIkskId),
    [filteredIndicators, selectedIkskId]
  );

  const activeSummary = useMemo(
    () => allIndicators.find((i) => i.iksk_id === selectedIkskId) || null,
    [allIndicators, selectedIkskId]
  );

  const activeRowCanEdit = Boolean(
    canEdit &&
      (detailData
        ? detailData.actor_context.can_edit
        : activeSummary?.can_edit ?? false)
  );

  const handleOpenModal = async (ikskId: number) => {
    if (!ikskId || ikskId === selectedIkskId) return;
    if (!(await confirmLeaveIfDirty())) return;
    setSelectedIkskId(ikskId);
  };

  const handleChangeMonth = async (nextMonth: number) => {
    if (nextMonth === month) return;
    if (!(await confirmLeaveIfDirty())) return;
    setMonth(nextMonth);
  };

  const handleChangeYear = async (nextYear: number) => {
    if (nextYear === year) return;
    if (!(await confirmLeaveIfDirty())) return;
    setYear(nextYear);
  };

  const toggleColumn = (col: DynamicTableColumn) => {
    if (col.key === "iksk") return;
    setUserColumnOverrides((prev) => {
      const current = col.key in prev ? prev[col.key] : col.default_visible;
      return { ...prev, [col.key]: !current };
    });
  };


  const handleSaveForm = async (
    payload: Parameters<typeof RekapRhpkForm>[0]["onSave"] extends (
      p: infer T
    ) => Promise<void>
      ? T
      : never
  ) => {
    setSavingForm(true);
    try {
      const res = await api.post(`${baseUrl}/api/rekap-rhpk/save`, {
        ...payload,
        context: actorMode,
      });
      if (res.data?.data) {
        setDetailData(res.data.data);
        setHasUnsavedChanges(false);
      }
      showToast("success", res.data?.message || "Rekap RHPK berhasil disimpan.");
      fetchIndex(year, month);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menyimpan data Rekap RHPK.";
      showToast("error", msg);
    } finally {
      setSavingForm(false);
    }
  };

  const handlePullFromExcel = async () => {
    if (!selectedIkskId) return;
    setPullingExcel(true);
    try {
      const res = await api.post(`${baseUrl}/api/rekap-rhpk/pull-from-excel`, {
        year,
        iksk_id: selectedIkskId,
        month,
        context: actorMode,
      });
      if (res.data?.data) {
        setDetailData(res.data.data);
      }
      showToast("success", res.data?.message || "Data sumber berhasil diperbarui.");
      fetchIndex(year, month);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menarik data dari file Excel RHPK.";
      showToast("error", msg);
    } finally {
      setPullingExcel(false);
    }
  };

  const handleResolveConflict = async (payload: {
    entry_id: number;
    field: "kendala" | "rtl";
    resolution: "use_source" | "keep_rekap";
  }) => {
    setResolvingField(payload.field);
    try {
      const res = await api.post(`${baseUrl}/api/rekap-rhpk/resolve-conflict`, {
        ...payload,
        context: actorMode,
      });
      if (res.data?.data) {
        setDetailData(res.data.data);
      }
      showToast("success", res.data?.message || "Konflik berhasil diselesaikan.");
      fetchIndex(year, month);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menyelesaikan konflik.";
      showToast("error", msg);
    } finally {
      setResolvingField(null);
    }
  };

  const handleSaveMonitoring = async (payload: {
    kendala_record_id: number;
    reporting_year: number;
    reporting_month: number;
    progress_status: "sudah" | "belum";
    progress_note: string;
    new_timeline_date: string | null;
  }) => {
    setSavingMonitoringId(payload.kendala_record_id);
    try {
      const res = await api.post(`${baseUrl}/api/rekap-rhpk/monitoring`, {
        ...payload,
        context: actorMode,
      });
      if (res.data?.data) {
        setDetailData(res.data.data);
      }
      showToast("success", res.data?.message || "Progress monitoring tersimpan.");
      fetchIndex(year, month);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menyimpan progress monitoring.";
      showToast("error", msg);
    } finally {
      setSavingMonitoringId(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get(`${baseUrl}/api/rekap-rhpk/export`, {
        params: { year, month, context: actorMode },
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const disposition = res.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename =
        match?.[1] || `REKAP_DATA_RHPK_${year}_${MONTH_NAMES[month - 1]}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", `File ${filename} berhasil diunduh.`);
    } catch {
      showToast("error", "Gagal mengekspor file Excel Rekap RHPK.");
    } finally {
      setExporting(false);
    }
  };

  const renderCell = (colKey: string, item: IndicatorSummaryItem) => {
    const perf = item.performance;
    switch (colKey) {
      case "iksk":
        return (
          <div className="min-w-[260px] max-w-[420px] space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-[#005baa]">
                IKSK {item.iksk_id}
              </span>
              {item.sasaran_kode && (
                <span className="text-[11px] font-medium text-slate-400">
                  · {item.sasaran_kode}
                </span>
              )}
              {showScopeFilter && (item.can_edit ?? canEdit) && (
                <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#005baa] border border-blue-200/70">
                  Ampuan Anda
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-snug">
              {item.iksk_name}
            </p>
            {item.assigned_katims.length > 0 && (
              <p className="text-[11px] text-slate-500 truncate">
                PIC:{" "}
                {item.assigned_katims
                  .map((k) => k.call_name || k.name)
                  .join(", ")}
              </p>
            )}
          </div>
        );

      case "target_tahunan":
        return (
          <span className="tabular-nums text-xs text-slate-700 whitespace-nowrap">
            {fmtNum(perf.target_tahunan)}
          </span>
        );

      case "target_bulan":
        return (
          <span className="tabular-nums text-xs font-medium text-slate-700 whitespace-nowrap">
            {fmtNum(perf.target_bulan)}
          </span>
        );

      case "realisasi":
        return (
          <span className="tabular-nums text-xs font-bold text-slate-900 whitespace-nowrap">
            {fmtNum(perf.realisasi)}
          </span>
        );

      case "capaian_bulan": {
        const cap = perf.capaian_bulan;
        const badgeCls =
          cap === null
            ? "bg-slate-100 text-slate-500"
            : perf.status === "tercapai"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-amber-50 text-amber-800 border border-amber-200";
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums whitespace-nowrap ${badgeCls}`}
          >
            {fmtPct(cap)}
          </span>
        );
      }

      case "capaian_tahun":
        return (
          <span className="tabular-nums text-xs font-semibold text-slate-700 whitespace-nowrap">
            {fmtPct(perf.capaian_tahun)}
          </span>
        );

      case "kendala":
        return renderNarrativeCell(item.kendala_preview);

      case "rtl":
        return renderNarrativeCell(item.rtl_preview);

      case "rekomendasi":
        return renderNarrativeCell(item.rekomendasi_preview);

      case "analisis":
        return renderNarrativeCell(item.analisis_preview);

      case "timeline":
        return item.timeline_date ? (
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
            {item.timeline_date}
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        );

      case "arahan":
        return renderNarrativeCell(item.arahan_pimpinan_preview);

      case "monitoring":
        return item.unresolved_monitoring_count > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800 whitespace-nowrap">
            {item.unresolved_monitoring_count} terbuka
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        );

      case "status_rekap":
        return (
          <div className="flex flex-col gap-0.5 min-w-[110px]">
            <span
              className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                item.is_filled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }`}
            >
              {item.is_filled ? "Terisi" : "Belum diisi"}
            </span>
            {(item.has_conflict || item.has_kendala) && (
              <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                {item.has_conflict ? (
                  <span className="text-rose-600 font-semibold">Perlu resolusi</span>
                ) : (
                  "Ada catatan kendala"
                )}
              </span>
            )}
          </div>
        );

      default:
        return <span className="text-xs text-slate-400">-</span>;
    }
  };

  const summary = indexData?.summary;
  const configurableColumns = availableColumns.filter((c) => c.key !== "iksk");
  const groupedConfigColumns = useMemo(() => {
    const groups: Array<{
      group: DynamicTableColumn["group"];
      label: string;
      cols: DynamicTableColumn[];
    }> = [];
    const order: DynamicTableColumn["group"][] = [
      "capaian",
      "narasi",
      "monitoring",
      "status",
    ];
    for (const g of order) {
      const cols = configurableColumns.filter((c) => c.group === g);
      if (cols.length > 0) {
        groups.push({ group: g, label: COLUMN_GROUP_LABELS[g], cols });
      }
    }
    return groups;
  }, [configurableColumns]);

  return (
    <div className="w-full min-w-0">
      {/* Section 1: Page Header & Informasi Rekap */}
      <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Rekap RHPK Digital
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Pantau dan kelola target, realisasi, kendala, serta data pendukung RHPK Balai.
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-slate-600">
              <span className="font-semibold text-[#005baa]">
                {!canEdit
                  ? "Mode Tata Usaha (Hanya Baca)"
                  : showScopeFilter
                    ? `Mode Katim · IKSK Ampuan (${assignedCount} IKSK)`
                    : "Mode PIC / Admin"}
              </span>
              <span className="text-slate-300">·</span>
              <span>{allIndicators.length || 28} IKSK</span>
              <span className="text-slate-300">·</span>
              <span>
                Periode {MONTH_NAMES[month - 1]} {year}
              </span>
              {summary && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>
                    Terisi {summary.filled_rekap_count}/{summary.total_iksk}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onChangeView && (
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => onChangeView("rekap")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeView === "rekap"
                      ? "bg-white text-[#005baa] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon icon="solar:clipboard-check-bold" width={14} />
                  <span>Rekap RHPK Digital</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeView("sheet")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeView === "sheet"
                      ? "bg-white text-[#005baa] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon icon="solar:table-2-bold" width={14} />
                  <span>{sheetViewLabel || "Tabel File Rekap Balai"}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || allIndicators.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#005baa] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#004687] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Icon
                icon={exporting ? "solar:refresh-circle-bold" : "solar:export-bold"}
                width={15}
                className={exporting ? "animate-spin" : ""}
              />
              <span>{exporting ? "Menyiapkan..." : "Export Excel"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Inline Page Toast (when modal closed) */}
      {toast && selectedIkskId === null && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Section 2: Area Tabel Rekap & Toolbar Filter Terpadu */}
      <section className="mt-5 w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Toolbar Filter & Kontrol Tabel */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 sm:px-5 py-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Periode Selector (Bulan & Tahun) */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs w-fit">
              <Icon icon="solar:calendar-date-bold" width={15} className="text-[#005baa] shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Bulan:</span>
                <select
                  value={month}
                  onChange={(e) => handleChangeMonth(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Tahun:</span>
                <select
                  value={year}
                  onChange={(e) => handleChangeYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {(indexData?.available_years || [2026]).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search & Pengaturan Kolom */}
            <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
              <div className="relative flex-1">
                <Icon
                  icon="solar:magnifer-linear"
                  width={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor IKSK, sasaran, atau Katim..."
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#005baa] focus:outline-none transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <Icon icon="solar:close-circle-bold" width={14} />
                  </button>
                )}
              </div>

              <div className="relative shrink-0" ref={colMenuRef}>
                <button
                  type="button"
                  onClick={() => setColMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Sesuaikan Kolom Tabel"
                >
                  <Icon
                    icon="solar:slider-vertical-bold"
                    width={14}
                    className="text-[#005baa]"
                  />
                  <span>Kolom ({visibleColumns.length})</span>
                </button>

                {colMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl p-3.5 z-40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Kolom Tabel
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Periode: {MONTH_NAMES[month - 1]} {year}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUserColumnOverrides({})}
                        className="text-[11px] font-semibold text-[#005baa] hover:underline cursor-pointer"
                      >
                        Reset Default
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                      {groupedConfigColumns.map((grp) => (
                        <div key={grp.group} className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {grp.label}
                          </p>
                          {grp.cols.map((col) => {
                            const checked =
                              col.key in userColumnOverrides
                                ? userColumnOverrides[col.key]
                                : col.default_visible;
                            return (
                              <label
                                key={col.key}
                                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
                              >
                                <span className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleColumn(col)}
                                    className="rounded border-slate-300 text-[#005baa] focus:ring-[#005baa]"
                                  />
                                  <span className="font-medium">{col.label}</span>
                                </span>
                                {col.editable && (
                                  <span className="text-[10px] rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-[#005baa]">
                                    Edit di pop-up
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Cakupan & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  filterTab === "all"
                    ? "bg-[#005baa] text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Semua ({allIndicators.length})
              </button>

              {showScopeFilter && (
                <button
                  type="button"
                  onClick={() => setFilterTab("assigned")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    filterTab === "assigned"
                      ? "bg-[#005baa] text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Ampuan Saya ({assignedCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setFilterTab("unfilled")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  filterTab === "unfilled"
                    ? "bg-[#005baa] text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Belum Diisi ({unfilledCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("tercapai")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  filterTab === "tercapai"
                    ? "bg-[#005baa] text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Tercapai ({summary?.tercapai ?? 0})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("belum")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  filterTab === "belum"
                    ? "bg-[#005baa] text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Belum Tercapai ({summary?.belum_tercapai ?? 0})
              </button>

              {month > 1 && (summary?.unresolved_monitoring ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab("monitoring")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    filterTab === "monitoring"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  Monitoring ({summary?.unresolved_monitoring})
                </button>
              )}

              {(summary?.conflict_count ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab("conflict")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    filterTab === "conflict"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  Konflik ({summary?.conflict_count})
                </button>
              )}
            </div>

            {(filterTab !== "all" || search) && (
              <button
                type="button"
                onClick={() => {
                  setFilterTab("all");
                  setSearch("");
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-[#005baa] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Icon icon="solar:restart-bold" width={12} />
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Area Tabel Data Rekap */}
        {loadingIndex && !indexData ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Memuat tabel Rekap RHPK...
          </div>
        ) : filteredIndicators.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada indikator IKSK yang sesuai dengan filter.
            </p>
            {(search || filterTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterTab("all");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Icon icon="solar:restart-bold" width={13} />
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {visibleColumns.map((col) => (
                    <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIndicators.map((item) => {
                  const isSelected = item.iksk_id === selectedIkskId;
                  const rowCanEdit = Boolean(canEdit && (item.can_edit ?? true));
                  return (
                    <tr
                      key={item.iksk_id}
                      onClick={() => handleOpenModal(item.iksk_id)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        isSelected ? "bg-blue-50/60" : "bg-white"
                      }`}
                    >
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 align-top"
                        >
                          {renderCell(col.key, item)}
                        </td>
                      ))}
                      <td
                        className="px-4 py-3 align-top text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item.iksk_id)}
                          className={
                            rowCanEdit
                              ? "inline-flex items-center gap-1.5 rounded-lg bg-[#005baa] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004687] cursor-pointer"
                              : "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          }
                        >
                          <Icon
                            icon={
                              rowCanEdit
                                ? "solar:pen-new-square-bold"
                                : "solar:eye-bold"
                            }
                            width={14}
                          />
                          {rowCanEdit ? "Isi / Edit" : "Lihat Detail"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Wide Modal Pop-up (Hosts 1-Column Vertical Workflow) */}
      {selectedIkskId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[1px] p-2 sm:p-5"
          onClick={handleCloseModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-50 shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Modal Header */}
            <div className="bg-gradient-to-r from-[#003d73] to-[#005baa] px-4 sm:px-6 py-3.5 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                    IKSK {selectedIkskId}
                  </span>
                  <span className="text-[11px] font-medium text-blue-100">
                    {activeRowCanEdit
                      ? ctx?.actor === "pic_admin"
                        ? "Mode Edit PIC / Admin"
                        : "Mode Edit Katim (Ampuan)"
                      : ctx?.actor === "tu"
                        ? "Mode Baca-Saja (TU)"
                        : "Mode Baca-Saja (Bukan Ampuan)"}{" "}
                    · {MONTH_NAMES[month - 1]} {year}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                      Belum disimpan
                    </span>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-bold truncate">
                  {activeSummary?.iksk_name ||
                    detailData?.indicator?.iksk_name ||
                    "Memuat Indikator..."}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  title="IKSK Sebelumnya"
                  disabled={currentIdxInFiltered <= 0}
                  onClick={() =>
                    handleOpenModal(
                      filteredIndicators[currentIdxInFiltered - 1]?.iksk_id
                    )
                  }
                  className="rounded-lg bg-white/15 p-2 text-white hover:bg-white/25 disabled:opacity-35"
                >
                  <Icon icon="solar:alt-arrow-left-linear" width={16} />
                </button>
                <button
                  type="button"
                  title="IKSK Berikutnya"
                  disabled={
                    currentIdxInFiltered < 0 ||
                    currentIdxInFiltered >= filteredIndicators.length - 1
                  }
                  onClick={() =>
                    handleOpenModal(
                      filteredIndicators[currentIdxInFiltered + 1]?.iksk_id
                    )
                  }
                  className="rounded-lg bg-white/15 p-2 text-white hover:bg-white/25 disabled:opacity-35"
                >
                  <Icon icon="solar:alt-arrow-right-linear" width={16} />
                </button>
                <button
                  type="button"
                  title="Tutup Pop-up"
                  onClick={handleCloseModal}
                  className="ml-1 rounded-lg bg-white/15 p-2 text-white hover:bg-rose-500/80 transition-colors"
                >
                  <Icon icon="solar:close-circle-bold" width={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {toast && (
                <div
                  className={`rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 ${
                    toast.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  <span>{toast.text}</span>
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className="text-xs font-bold opacity-70 hover:opacity-100"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {loadingDetail ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                  Memuat formulir Rekap RHPK dan monitoring...
                </div>
              ) : !detailData ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                  Detail indikator tidak tersedia.
                </div>
              ) : (
                <>
                  <RekapRhpkForm
                    detail={detailData}
                    saving={savingForm}
                    pulling={pullingExcel}
                    resolvingField={resolvingField}
                    onDirtyChange={setHasUnsavedChanges}
                    onSave={handleSaveForm}
                    onPullFromExcel={handlePullFromExcel}
                    onResolveConflict={handleResolveConflict}
                  />

                  <RekapRhpkMonitoringSection
                    year={detailData.year}
                    month={detailData.month}
                    canEdit={detailData.actor_context.can_edit}
                    monitoringItems={detailData.monitoring_items}
                    monitoringHistory={detailData.monitoring_history}
                    savingId={savingMonitoringId}
                    onSaveMonitoring={handleSaveMonitoring}
                  />
                </>
              )}
            </div>

            {/* Sticky Modal Footer */}
            <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0">
              <span className="text-slate-500">
                {currentIdxInFiltered >= 0
                  ? `Menampilkan IKSK ${currentIdxInFiltered + 1} dari ${filteredIndicators.length}`
                  : `IKSK ${selectedIkskId}`}
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
