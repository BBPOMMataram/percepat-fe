"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Check,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
};

type KegiatanData = {
  row_number: number;
  code: string;
  name: string;
  pagu: number;
  realisasi: number;
  pagu_cell: string;
  real_cell: string;
  allocations: Record<
    string,
    {
      iksk_number: number;
      pct_cell: string;
      target_cell: string;
      real_cell: string;
      percent: number;
      target: number;
      realisasi: number;
    }
  >;
};

type SpreadsheetTab = {
  id: number;
  title: string;
  google_sheet_id?: string | number | null;
  is_active?: number;
};

export default function BudgetMappingRekap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);

  const year = searchParams.get("year") || "2026";
  const initialTabId = searchParams.get("tab") || "";

  const [availableTabs, setAvailableTabs] = useState<SpreadsheetTab[]>([]);
  const [selectedTabId, setSelectedTabId] = useState<string>(initialTabId);

  // Tab & Spreadsheet metadata
  const [tabTitle, setTabTitle] = useState("Budget Mapping Bulanan");
  const [spreadsheetName, setSpreadsheetName] = useState(
    "Spreadsheet Budget Mapping",
  );
  const [spreadsheetDocId, setSpreadsheetDocId] = useState<string>("");
  const [tabGid, setTabGid] = useState<string | number>("");

  // Domain data
  const [iksks, setIksks] = useState<IkskInfo[]>([]);
  const [localKegiatans, setLocalKegiatans] = useState<KegiatanData[]>([]);

  // State view mode: "iksk" | "kegiatan"
  const [rekapTab, setRekapTab] = useState<"iksk" | "kegiatan">("iksk");

  // Selection state
  const [selectedIkskNum, setSelectedIkskNum] = useState<number | "ALL">(1);
  const [selectedKegiatanCodeRekap, setSelectedKegiatanCodeRekap] =
    useState<string>("ALL");

  const [loadingTabs, setLoadingTabs] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState("");

  // Direct Spreadsheet Link
  const spreadsheetDirectUrl = useMemo(() => {
    if (!spreadsheetDocId) return null;
    return `https://docs.google.com/spreadsheets/d/${spreadsheetDocId}/edit#gid=${tabGid ?? 0}`;
  }, [spreadsheetDocId, tabGid]);

  // 1. Fetch available tabs for the selected year
  useEffect(() => {
    async function fetchYearTabs() {
      if (!user?.id) return;
      setLoadingTabs(true);
      try {
        const query = user?.id ? `?user_id=${user.id}` : "";
        const res = await api.get(
          `${baseUrl}/api/budget-mapping/${year}/tabs${query}`,
        );
        const data = res.data.data || res.data;
        const list: SpreadsheetTab[] = data.tabs || [];
        setAvailableTabs(list);

        if (list.length > 0 && !selectedTabId) {
          const firstTab = list[0];
          setSelectedTabId(String(firstTab.id));
        }
      } catch (err) {
        console.error("Gagal memuat daftar tab bulan:", err);
      } finally {
        setLoadingTabs(false);
      }
    }

    fetchYearTabs();
  }, [year, user?.id]);

  // Update selectedTabId if url query changes
  useEffect(() => {
    if (initialTabId && initialTabId !== selectedTabId) {
      setSelectedTabId(initialTabId);
    }
  }, [initialTabId]);

  // 2. Load Table & Rekap Data from Server
  async function loadTable(tabToLoad: string) {
    if (!tabToLoad || !user?.id) return;
    setLoadingData(true);
    setErrorMsg("");
    setApiNotice("");
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.get(
        `${baseUrl}/api/budget-mapping/${year}/tab/${tabToLoad}${query}`,
      );

      if (res.data) {
        const data = res.data.data || res.data;
        const sTab = data.sheetTab;
        if (sTab?.title) setTabTitle(sTab.title);
        if (
          sTab?.google_sheet_id !== undefined &&
          sTab?.google_sheet_id !== null
        ) {
          setTabGid(sTab.google_sheet_id);
        }

        const sSheet = data.spreadsheet;
        if (sSheet?.name) setSpreadsheetName(sSheet.name);
        if (sSheet?.spreadsheet_id) setSpreadsheetDocId(sSheet.spreadsheet_id);

        const err = data.googleSheetError;
        if (err) setApiNotice(err);

        if (Array.isArray(data.iksks)) {
          setIksks(data.iksks);
        }

        if (Array.isArray(data.kegiatans)) {
          setLocalKegiatans(data.kegiatans);
          if (
            data.kegiatans.length > 0 &&
            selectedKegiatanCodeRekap === "ALL"
          ) {
            // Keep ALL or selected
          }
        }
      }
    } catch (err: unknown) {
      const errObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMsg(
        errObj.response?.data?.message ||
          errObj.message ||
          "Gagal memuat data rekapitulasi dari spreadsheet.",
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (selectedTabId) {
      loadTable(selectedTabId);
    }
  }, [year, selectedTabId, user?.id]);

  // Handle Tab Switch
  const handleTabChange = (newTabId: string) => {
    setSelectedTabId(newTabId);
    router.replace(`/siproval/tu/rekapitulasi?year=${year}&tab=${newTabId}`);
  };

  // Live IKSK summary calculation
  const liveIkskSummaries = useMemo(() => {
    return iksks.map((iksk) => {
      let totalTarget = 0;
      let totalReal = 0;
      const contributingKegiatans: {
        code: string;
        name: string;
        percent: number;
        target: number;
        realisasi: number;
      }[] = [];

      localKegiatans.forEach((keg) => {
        const alloc = keg.allocations?.[String(iksk.iksk_number)];
        if (alloc && Number(alloc.percent) > 0) {
          totalTarget += Number(alloc.target) || 0;
          totalReal += Number(alloc.realisasi) || 0;
          contributingKegiatans.push({
            code: keg.code,
            name: keg.name,
            percent: alloc.percent,
            target: alloc.target,
            realisasi: alloc.realisasi,
          });
        }
      });

      const capaian = totalTarget > 0 ? (totalReal / totalTarget) * 100 : 0;

      return {
        iksk_number: iksk.iksk_number,
        full_title: iksk.full_title,
        total_target: totalTarget,
        total_realisasi: totalReal,
        persentase_capaian: capaian,
        kegiatan_count: contributingKegiatans.length,
        kegiatans: contributingKegiatans,
      };
    });
  }, [iksks, localKegiatans]);

  // Overall totals
  const overallTotals = useMemo(() => {
    const totalPagu = localKegiatans.reduce(
      (sum, k) => sum + (Number(k.pagu) || 0),
      0,
    );
    const totalRealisasi = localKegiatans.reduce(
      (sum, k) => sum + (Number(k.realisasi) || 0),
      0,
    );
    const serapan = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    const totalTargetIksk = liveIkskSummaries.reduce(
      (sum, i) => sum + i.total_target,
      0,
    );
    const totalRealIksk = liveIkskSummaries.reduce(
      (sum, i) => sum + i.total_realisasi,
      0,
    );

    return {
      totalPagu,
      totalRealisasi,
      serapan,
      totalTargetIksk,
      totalRealIksk,
    };
  }, [localKegiatans, liveIkskSummaries]);

  // Displayed IKSK for IKSK tab
  const displayedIksks = useMemo(() => {
    if (selectedIkskNum === "ALL") {
      return liveIkskSummaries;
    }
    const found = liveIkskSummaries.find(
      (i) => i.iksk_number === selectedIkskNum,
    );
    return found ? [found] : [];
  }, [liveIkskSummaries, selectedIkskNum]);

  // IKSK Navigation
  const ikskIndex = useMemo(() => {
    if (selectedIkskNum === "ALL") return -1;
    return liveIkskSummaries.findIndex(
      (i) => i.iksk_number === selectedIkskNum,
    );
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

  // Displayed Kegiatans for Kegiatan tab
  const displayedKegiatansRekap = useMemo(() => {
    if (selectedKegiatanCodeRekap === "ALL") {
      return localKegiatans;
    }
    const found = localKegiatans.find(
      (k) =>
        String(k.row_number) === String(selectedKegiatanCodeRekap) ||
        k.code === selectedKegiatanCodeRekap,
    );
    return found ? [found] : localKegiatans;
  }, [localKegiatans, selectedKegiatanCodeRekap]);

  const rekapKegiatanIndex = useMemo(() => {
    if (selectedKegiatanCodeRekap === "ALL") return -1;
    return localKegiatans.findIndex(
      (k) =>
        String(k.row_number) === String(selectedKegiatanCodeRekap) ||
        k.code === selectedKegiatanCodeRekap,
    );
  }, [localKegiatans, selectedKegiatanCodeRekap]);

  const handlePrevKegiatanRekap = () => {
    if (rekapKegiatanIndex > 0) {
      setSelectedKegiatanCodeRekap(
        String(localKegiatans[rekapKegiatanIndex - 1].row_number),
      );
    }
  };

  const handleNextKegiatanRekap = () => {
    if (
      rekapKegiatanIndex < localKegiatans.length - 1 &&
      rekapKegiatanIndex !== -1
    ) {
      setSelectedKegiatanCodeRekap(
        String(localKegiatans[rekapKegiatanIndex + 1].row_number),
      );
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/siproval/budget-mapping"
              className="hover:text-primary transition"
            >
              Budget Mapping
            </Link>
            <span>/</span>
            <Link
              href={`/siproval/budget-mapping/year?year=${year}`}
              className="hover:text-primary transition"
            >
              Tahun {year}
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Rekapitulasi</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Rekapitulasi & Riwayat Anggaran
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Pantau ringkasan alokasi dan capaian realisasi berdasarkan Target
            IKSK maupun Rincian Kegiatan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {selectedTabId && (
            <Link
              href={`/siproval/budget-mapping/year/tab?year=${year}&tab=${selectedTabId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-accent transition"
            >
              <Icon
                icon="solar:pen-new-square-bold"
                width={16}
                className="text-primary"
              />
              <span>Ke Formulir Alokasi</span>
            </Link>
          )}

          {spreadsheetDirectUrl && (
            <a
              href={spreadsheetDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition"
              title="Buka langsung tab ini di Google Spreadsheet"
            >
              <Icon
                icon="solar:document-bold"
                width={16}
                className="text-emerald-700"
              />
              <span>Buka di Spreadsheet</span>
              <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
            </a>
          )}
        </div>
      </div>

      {/* Month / Tab Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Icon
            icon="solar:calendar-bold"
            width={20}
            className="text-primary"
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pilih Bulan / Tab:
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedTabId}
            onChange={(e) => handleTabChange(e.target.value)}
            disabled={loadingTabs}
            className="flex-1 sm:w-72 h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {availableTabs.map((t) => (
              <option key={t.id} value={String(t.id)}>
                Tab: {t.title}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadTable(selectedTabId)}
            disabled={loadingData}
            className="h-9 px-3 text-xs"
            title="Muat ulang data"
          >
            <Icon
              icon="solar:refresh-linear"
              width={16}
              className={loadingData ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </div>

      {/* Error & Notice Alerts */}
      {errorMsg && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="font-bold">
            x
          </button>
        </div>
      )}

      {apiNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <Icon
            icon="solar:info-circle-bold"
            width={18}
            className="text-amber-600 shrink-0"
          />
          <span>{apiNotice}</span>
        </div>
      )}

      {/* 4 Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Pagu Kegiatan
          </p>
          <p className="mt-1.5 text-xl font-bold text-foreground">
            {formatRp(overallTotals.totalPagu)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {localKegiatans.length} Kegiatan/Output
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Realisasi Kegiatan
          </p>
          <p className="mt-1.5 text-xl font-bold text-emerald-600">
            {formatRp(overallTotals.totalRealisasi)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Capaian:</span>
            <span className="font-semibold text-emerald-700">
              {formatPct(overallTotals.serapan)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Target IKSK
          </p>
          <p className="mt-1.5 text-xl font-bold text-blue-600">
            {formatRp(overallTotals.totalTargetIksk)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Teralokasi ke 28 IKSK
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Realisasi IKSK
          </p>
          <p className="mt-1.5 text-xl font-bold text-violet-600">
            {formatRp(overallTotals.totalRealIksk)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Serapan dana menurut alokasi IKSK
          </p>
        </div>
      </div>

      {/* 2 TABS NAVIGATION: IKSK vs Kegiatan */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setRekapTab("iksk")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              rekapTab === "iksk"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <Icon icon="solar:chart-2-bold" width={18} />
            <span>Rekapitulasi Tiap IKSK</span>
          </button>

          <button
            type="button"
            onClick={() => setRekapTab("kegiatan")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              rekapTab === "kegiatan"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <Icon icon="solar:document-bold" width={18} />
            <span>Rekapitulasi Tiap Kegiatan</span>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT 1: REKAPITULASI TIAP IKSK */}
      {rekapTab === "iksk" && (
        <div className="space-y-4">
          {/* Selector Bar: Pilih IKSK */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-xs">
                <Icon icon="solar:chart-2-bold" width={20} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold uppercase tracking-wider text-violet-700">
                  Filter Target IKSK:
                </label>
                <select
                  value={selectedIkskNum}
                  onChange={(e) => {
                    const val =
                      e.target.value === "ALL"
                        ? "ALL"
                        : parseInt(e.target.value);
                    setSelectedIkskNum(val);
                  }}
                  className="mt-1 w-full truncate rounded-lg border border-input bg-background px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {liveIkskSummaries.map((i) => (
                    <option key={i.iksk_number} value={i.iksk_number}>
                      IKSK {i.iksk_number} - {i.full_title} ({i.kegiatan_count}{" "}
                      Kegiatan)
                    </option>
                  ))}
                  <option value="ALL">
                    -- Tampilkan Semua 28 IKSK Sekaligus --
                  </option>
                </select>
              </div>
            </div>

            {selectedIkskNum !== "ALL" && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevIksk}
                  disabled={ikskIndex <= 0}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-4 w-4 mr-0.5" /> Sebelumnya
                </Button>
                <span className="text-xs font-semibold text-muted-foreground px-1">
                  IKSK {selectedIkskNum} / 28
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextIksk}
                  disabled={
                    ikskIndex >= liveIkskSummaries.length - 1 ||
                    ikskIndex === -1
                  }
                  className="h-8 px-2.5 text-xs"
                >
                  Berikutnya <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
              </div>
            )}
          </div>

          {loadingData ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground shadow-xs">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="mt-3">Memuat rekapitulasi IKSK...</p>
            </div>
          ) : (
            <div
              className={
                selectedIkskNum === "ALL"
                  ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
                  : "space-y-4"
              }
            >
              {displayedIksks.map((item) => {
                const sisaTarget = item.total_target - item.total_realisasi;

                return (
                  <div
                    key={`iksk-card-${item.iksk_number}`}
                    className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4"
                  >
                    {/* Header IKSK */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-3">
                      <div className="flex items-start gap-3">
                        <Badge
                          variant="secondary"
                          className="px-2.5 py-1 text-xs font-bold text-violet-700 bg-violet-100 shrink-0 mt-0.5"
                        >
                          IKSK {item.iksk_number}
                        </Badge>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground leading-snug">
                            {item.full_title}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.kegiatan_count} Kegiatan Terkait
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                          Capaian Serapan
                        </span>
                        <span className="text-base font-bold text-emerald-600">
                          {formatPct(item.persentase_capaian)}
                        </span>
                      </div>
                    </div>

                    {/* Metric Rows */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 rounded-lg bg-muted p-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Total Target IKSK
                        </span>
                        <span className="font-bold text-blue-600 text-sm">
                          {formatRp(item.total_target)}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Total Realisasi
                        </span>
                        <span className="font-bold text-emerald-600 text-sm">
                          {formatRp(item.total_realisasi)}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Sisa Target
                        </span>
                        <span className="font-bold text-foreground text-sm">
                          {formatRp(sisaTarget)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1 font-medium">
                        <span>Realisasi terhadap Target</span>
                        <span>{formatPct(item.persentase_capaian)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(Math.max(item.persentase_capaian, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Contributing Kegiatans Table */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Rincian Kontribusi Kegiatan ({item.kegiatans.length}):
                      </h4>

                      {item.kegiatans.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1">
                          Belum ada kegiatan yang mengalokasikan anggarannya ke
                          IKSK ini.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-muted text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 font-semibold">
                                  Kode
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                  Nama Kegiatan
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Alokasi (%)
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Target (Rp)
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Realisasi (Rp)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {item.kegiatans.map((k, kIdx) => (
                                <tr
                                  key={`iksk-keg-${k.code}-${kIdx}`}
                                  className="hover:bg-accent/40"
                                >
                                  <td className="px-3 py-2 font-mono font-semibold text-primary">
                                    {k.code}
                                  </td>
                                  <td
                                    className="px-3 py-2 font-medium text-foreground max-w-xs truncate"
                                    title={k.name}
                                  >
                                    {k.name}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-foreground">
                                    {formatPct(k.percent)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-blue-600">
                                    {formatRp(k.target)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                                    {formatRp(k.realisasi)}
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
          )}
        </div>
      )}

      {/* TAB CONTENT 2: REKAPITULASI TIAP KEGIATAN */}
      {rekapTab === "kegiatan" && (
        <div className="space-y-4">
          {/* Selector Bar: Pilih Kegiatan */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Icon icon="solar:document-bold" width={20} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Filter Rincian Kegiatan:
                </label>
                <select
                  value={selectedKegiatanCodeRekap}
                  onChange={(e) => setSelectedKegiatanCodeRekap(e.target.value)}
                  className="mt-1 w-full truncate rounded-lg border border-input bg-background px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="ALL">
                    -- Tampilkan Semua Kegiatan Sekaligus (Tabel) --
                  </option>
                  {localKegiatans.map((k, idx) => (
                    <option
                      key={`opt-rekap-${k.code}-${k.row_number}`}
                      value={String(k.row_number)}
                    >
                      {idx + 1}. [{k.code}] {k.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedKegiatanCodeRekap !== "ALL" && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevKegiatanRekap}
                  disabled={rekapKegiatanIndex <= 0}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-4 w-4 mr-0.5" /> Sebelumnya
                </Button>
                <span className="text-xs font-semibold text-muted-foreground px-1">
                  {rekapKegiatanIndex + 1} / {localKegiatans.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextKegiatanRekap}
                  disabled={rekapKegiatanIndex >= localKegiatans.length - 1}
                  className="h-8 px-2.5 text-xs"
                >
                  Berikutnya <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
              </div>
            )}
          </div>

          {loadingData ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground shadow-xs">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="mt-3">Memuat rekapitulasi kegiatan...</p>
            </div>
          ) : selectedKegiatanCodeRekap !== "ALL" ? (
            /* Single Activity Spotlight View */
            displayedKegiatansRekap.map((keg) => {
              const allocEntries = Object.entries(keg.allocations || {});
              const serapanPct =
                keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0;
              const sisaDana = (keg.pagu || 0) - (keg.realisasi || 0);

              return (
                <div
                  key={`spotlight-${keg.code}-${keg.row_number}`}
                  className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-3">
                    <div className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className="font-bold text-primary border-primary/30"
                      >
                        {keg.code}
                      </Badge>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {keg.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground font-mono">
                          Baris Sheet: {keg.row_number}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                        Serapan Realisasi
                      </span>
                      <span className="text-base font-bold text-emerald-600">
                        {formatPct(serapanPct)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-lg bg-muted p-3.5 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Pagu Kegiatan
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {formatRp(keg.pagu)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Realisasi
                      </span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {formatRp(keg.realisasi)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Sisa Dana
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {formatRp(sisaDana)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Pembagian Alokasi ke IKSK ({allocEntries.length}{" "}
                      Indikator):
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-semibold">IKSK</th>
                            <th className="px-3 py-2 font-semibold">
                              Judul Indikator
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Alokasi (%)
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Target (Rp)
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Realisasi (Rp)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {allocEntries.map(([ikskNum, alloc]) => {
                            const ikskInfo = iksks.find(
                              (i) => String(i.iksk_number) === String(ikskNum),
                            );
                            return (
                              <tr
                                key={`spot-alloc-${ikskNum}`}
                                className="hover:bg-accent/40"
                              >
                                <td className="px-3 py-2 font-semibold text-violet-700">
                                  IKSK {ikskNum}
                                </td>
                                <td
                                  className="px-3 py-2 text-foreground font-medium max-w-sm truncate"
                                  title={ikskInfo?.full_title}
                                >
                                  {ikskInfo?.full_title || `IKSK ${ikskNum}`}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-foreground">
                                  {formatPct(alloc.percent)}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-blue-600">
                                  {formatRp(alloc.target)}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                                  {formatRp(alloc.realisasi)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Full Activities Table View */
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">No</th>
                      <th className="px-4 py-3 font-semibold">Kode</th>
                      <th className="px-4 py-3 font-semibold">
                        Nama Kegiatan / Output
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Pagu (Rp)
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Realisasi (Rp)
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Sisa (Rp)
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Serapan (%)
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Pembagian IKSK
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {localKegiatans.map((keg, idx) => {
                      const serapanPct =
                        keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0;
                      const sisaDana = (keg.pagu || 0) - (keg.realisasi || 0);
                      const allocEntries = Object.entries(
                        keg.allocations || {},
                      );
                      const totalPercent = allocEntries.reduce(
                        (s, [, a]) => s + (Number(a.percent) || 0),
                        0,
                      );

                      return (
                        <tr
                          key={`rekap-all-${keg.code}-${keg.row_number}`}
                          className="hover:bg-accent/40"
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary font-mono">
                            {keg.code}
                          </td>
                          <td
                            className="px-4 py-3 font-medium text-foreground max-w-sm truncate"
                            title={keg.name}
                          >
                            {keg.name}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatRp(keg.pagu)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                            {formatRp(keg.realisasi)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                            {formatRp(sisaDana)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            {formatPct(serapanPct)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {allocEntries.map(([ikskNum, a]) => (
                                <Badge
                                  key={ikskNum}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0.5"
                                >
                                  IKSK {ikskNum}: {formatPct(a.percent)}
                                </Badge>
                              ))}
                              {allocEntries.length === 0 && (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Belum ada
                                </span>
                              )}
                            </div>
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
    </div>
  );
}
