"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CircleCheck, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

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

type KegiatanItem = {
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
  const [spreadsheetDocId, setSpreadsheetDocId] = useState<string>("");
  const [tabGid, setTabGid] = useState<string | number>("");
  const [apiNotice, setApiNotice] = useState("");

  // Domain data
  const [iksks, setIksks] = useState<IkskInfo[]>([]);
  const [localKegiatans, setLocalKegiatans] = useState<KegiatanItem[]>([]);
  const [selectedKegiatanCodeForm, setSelectedKegiatanCodeForm] =
    useState<string>("");

  // Status & Notifications
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Direct Google Spreadsheet Link to exact tab
  const spreadsheetDirectUrl = useMemo(() => {
    if (!spreadsheetDocId) return null;
    return `https://docs.google.com/spreadsheets/d/${spreadsheetDocId}/edit#gid=${tabGid ?? 0}`;
  }, [spreadsheetDocId, tabGid]);

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
        if (sTab?.google_sheet_id !== undefined && sTab?.google_sheet_id !== null) {
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
          if (data.kegiatans.length > 0 && !selectedKegiatanCodeForm) {
            setSelectedKegiatanCodeForm(String(data.kegiatans[0].row_number));
          }
        }
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(
        errObj.response?.data?.message ||
          errObj.message ||
          "Gagal memuat data spreadsheet dari server."
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

  // Handle changing Pagu for a kegiatan
  const handlePaguChange = (kegIndex: number, newPagu: number) => {
    setLocalKegiatans((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as KegiatanItem[];
      const targetKeg = clone[kegIndex];
      if (!targetKeg) return prev;

      targetKeg.pagu = newPagu;

      // Recalculate target for each assigned IKSK
      Object.keys(targetKeg.allocations || {}).forEach((ikskNumStr) => {
        const alloc = targetKeg.allocations[ikskNumStr];
        alloc.target = Math.round(newPagu * ((alloc.percent || 0) / 100));
      });

      return clone;
    });
  };

  // Handle changing Realisasi for a kegiatan
  const handleRealisasiChange = (kegIndex: number, newReal: number) => {
    setLocalKegiatans((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as KegiatanItem[];
      const targetKeg = clone[kegIndex];
      if (!targetKeg) return prev;

      targetKeg.realisasi = newReal;

      // Recalculate realisasi for each assigned IKSK
      Object.keys(targetKeg.allocations || {}).forEach((ikskNumStr) => {
        const alloc = targetKeg.allocations[ikskNumStr];
        alloc.realisasi = Math.round(newReal * ((alloc.percent || 0) / 100));
      });

      return clone;
    });
  };

  // Handle changing Allocation Percentage
  const handlePercentChange = (
    kegIndex: number,
    ikskNum: number,
    newPercent: number
  ) => {
    setLocalKegiatans((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as KegiatanItem[];
      const targetKeg = clone[kegIndex];
      if (!targetKeg) return prev;

      const ikskKey = String(ikskNum);
      if (targetKeg.allocations?.[ikskKey]) {
        targetKeg.allocations[ikskKey].percent = newPercent;
        targetKeg.allocations[ikskKey].target = Math.round(
          (targetKeg.pagu || 0) * (newPercent / 100)
        );
        targetKeg.allocations[ikskKey].realisasi = Math.round(
          (targetKeg.realisasi || 0) * (newPercent / 100)
        );
      }

      return clone;
    });
  };

  // Handle adding an IKSK allocation to a kegiatan
  const handleAddIkskAllocation = (kegIndex: number, ikskNum: number) => {
    const ikskInfo = iksks.find((i) => i.iksk_number === ikskNum);
    if (!ikskInfo) return;

    setLocalKegiatans((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as KegiatanItem[];
      const targetKeg = clone[kegIndex];
      if (!targetKeg) return prev;

      if (!targetKeg.allocations) {
        targetKeg.allocations = {};
      }

      const ikskKey = String(ikskNum);
      if (!targetKeg.allocations[ikskKey]) {
        const row = targetKeg.row_number;
        targetKeg.allocations[ikskKey] = {
          iksk_number: ikskNum,
          pct_cell: `${ikskInfo.pct_col_letter}${row}`,
          target_cell: `${ikskInfo.target_col_letter}${row}`,
          real_cell: `${ikskInfo.real_col_letter}${row}`,
          percent: 0,
          target: 0,
          realisasi: 0,
        };
      }

      return clone;
    });
  };

  // Handle removing an IKSK allocation
  const handleRemoveIkskAllocation = (kegIndex: number, ikskNum: number) => {
    setLocalKegiatans((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as KegiatanItem[];
      const targetKeg = clone[kegIndex];
      if (!targetKeg || !targetKeg.allocations) return prev;

      delete targetKeg.allocations[String(ikskNum)];
      return clone;
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

        // Clear cells for removed IKSKs
        iksks.forEach((iksk) => {
          if (!currentKeys.includes(String(iksk.iksk_number))) {
            const row = keg.row_number;
            updateList.push({ cell: `${iksk.pct_col_letter}${row}`, value: "" });
            updateList.push({ cell: `${iksk.target_col_letter}${row}`, value: "" });
            updateList.push({ cell: `${iksk.real_col_letter}${row}`, value: "" });
          }
        });
      });

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

  // Overall totals for summary card
  const overallTotals = useMemo(() => {
    const totalPagu = localKegiatans.reduce(
      (sum, k) => sum + (Number(k.pagu) || 0),
      0
    );
    const totalRealisasi = localKegiatans.reduce(
      (sum, k) => sum + (Number(k.realisasi) || 0),
      0
    );
    const serapan = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    return {
      totalPagu,
      totalRealisasi,
      serapan,
    };
  }, [localKegiatans]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Header */}
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
            <span className="font-semibold text-foreground">{tabTitle}</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-foreground">{tabTitle}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Formulir alokasi pagu, serapan realisasi, dan pembagian target IKSK kegiatan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/siproval/budget-mapping/year?year=${year}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-accent transition"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} />
            <span>Kembali ke Tab</span>
          </Link>

          <Link
            href={`/siproval/tu/rekapitulasi?year=${year}&tab=${tabId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-semibold text-violet-800 shadow-xs hover:bg-violet-100 transition"
            title="Lihat Rekapitulasi IKSK & Kegiatan"
          >
            <Icon icon="solar:chart-2-bold" width={16} className="text-violet-700" />
            <span>Lihat Rekapitulasi</span>
          </Link>

          {spreadsheetDirectUrl && (
            <a
              href={spreadsheetDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition"
              title="Buka langsung tab ini di Google Spreadsheet"
            >
              <Icon icon="solar:document-bold" width={16} className="text-emerald-700" />
              <span>Buka di Spreadsheet</span>
              <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
            </a>
          )}

          <Button
            type="button"
            onClick={() => handleSaveForm()}
            disabled={saving || loading}
            className="h-9 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Icon
              icon={saving ? "solar:refresh-circle-linear" : "solar:disk-bold"}
              width={16}
              className={saving ? "animate-spin mr-1.5" : "mr-1.5"}
            />
            {saving ? "Menyimpan ke Sheets..." : "Simpan Semua Alokasi"}
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="font-bold">x</button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive shadow-xs">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" width={18} className="text-destructive" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="font-bold">x</button>
        </div>
      )}

      {apiNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 shadow-xs">
          <Icon icon="solar:info-circle-bold" width={18} className="text-amber-600 shrink-0" />
          <span>{apiNotice}</span>
        </div>
      )}

      {/* FORMULIR ALOKASI & REALISASI KEGIATAN (WHITE MODE 2-COLUMN) */}
      <div className="mt-2">
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-16 text-center shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-3 text-sm text-muted-foreground font-medium">Memuat formulir alokasi & realisasi...</p>
          </div>
        ) : displayedKegiatansForm.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground shadow-xs">
            Tidak ada data kegiatan yang dipilih.
          </div>
        ) : (
          <div className="space-y-8">
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
                  className="rounded-xl border border-border bg-card p-6 shadow-xs"
                >
                  {/* Header: Title & Selector */}
                  <div className="flex flex-col gap-4 pb-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold text-primary border-primary/30">
                            {keg.code}
                          </Badge>
                          <h3 className="text-lg font-semibold text-foreground">
                            {keg.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Baris Sheet: {keg.row_number} &bull; Sel Pagu: {keg.pagu_cell} &bull; Sel Realisasi: {keg.real_cell}
                        </p>
                      </div>

                      {selectedKegiatanCodeForm !== "ALL" && (
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrevKegiatanForm}
                            disabled={formKegiatanIndex <= 0}
                            className="h-8 px-2.5 text-xs"
                          >
                            <ChevronLeft className="h-4 w-4 mr-0.5" />
                            Sebelumnya
                          </Button>
                          <span className="text-xs font-semibold text-muted-foreground px-1">
                            {formKegiatanIndex + 1} / {localKegiatans.length}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleNextKegiatanForm}
                            disabled={formKegiatanIndex >= localKegiatans.length - 1}
                            className="h-8 px-2.5 text-xs"
                          >
                            Berikutnya
                            <ChevronRight className="h-4 w-4 ml-0.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Dropdown Kegiatan Selector */}
                    <div className="pt-2">
                      <Label htmlFor={`select-kegiatan-${keg.row_number}`} className="text-xs font-medium text-muted-foreground mb-1 block">
                        Pilih Kegiatan yang Ingin Diisi / Dikelola
                      </Label>
                      <select
                        id={`select-kegiatan-${keg.row_number}`}
                        value={selectedKegiatanCodeForm}
                        onChange={(e) => setSelectedKegiatanCodeForm(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

                  {/* 2-Column Grid Layout */}
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 pt-6">
                    {/* Left Column: Form Inputs */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Pagu & Realisasi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor={`pagu-${keg.row_number}`} className="font-medium text-xs">
                            PAGU Kegiatan (Rp)
                          </Label>
                          <Input
                            id={`pagu-${keg.row_number}`}
                            type="number"
                            value={keg.pagu || 0}
                            onChange={(e) =>
                              handlePaguChange(
                                kegIndex,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="font-medium text-sm"
                          />
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatRp(keg.pagu)}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`realisasi-${keg.row_number}`} className="font-medium text-xs">
                            Realisasi Kegiatan (Rp)
                          </Label>
                          <Input
                            id={`realisasi-${keg.row_number}`}
                            type="number"
                            value={keg.realisasi || 0}
                            onChange={(e) =>
                              handleRealisasiChange(
                                kegIndex,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="font-medium text-sm"
                          />
                          <p className="text-xs text-emerald-600 font-mono">
                            {formatRp(keg.realisasi)}
                          </p>
                        </div>
                      </div>

                      {/* Pembagian Alokasi IKSK */}
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <Label className="text-sm font-semibold text-foreground">
                              Pembagian Alokasi ke IKSK
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Bagi persentase anggaran kegiatan ke masing-masing target IKSK.
                            </p>
                          </div>

                          {availableIksksToAdd.length > 0 && (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val) {
                                  handleAddIkskAllocation(kegIndex, val);
                                  e.target.value = "";
                                }
                              }}
                              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="" disabled>+ Tambah Alokasi IKSK...</option>
                              {availableIksksToAdd.map((i) => (
                                <option key={i.iksk_number} value={i.iksk_number}>
                                  IKSK {i.iksk_number} - {i.full_title.slice(0, 40)}...
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {allocationsList.length === 0 ? (
                          <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                            Belum ada alokasi IKSK untuk kegiatan ini. Gunakan menu &quot;+ Tambah Alokasi IKSK&quot; di atas.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {allocationsList.map((alloc) => {
                              const ikskInfo = iksks.find(
                                (i) => i.iksk_number === alloc.iksk_number
                              );

                              return (
                                <div
                                  key={alloc.iksk_number}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-border bg-card p-3 shadow-xs hover:border-slate-300 transition"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs font-semibold shrink-0">
                                        IKSK {alloc.iksk_number}
                                      </Badge>
                                      <span className="truncate text-xs font-medium text-foreground" title={ikskInfo?.full_title}>
                                        {ikskInfo?.full_title || `IKSK ${alloc.iksk_number}`}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <Label className="text-xs text-muted-foreground">Alokasi:</Label>
                                      <div className="relative w-20">
                                        <Input
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
                                          className="h-8 pr-5 text-right text-xs font-medium"
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                          %
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-right min-w-[95px]">
                                      <span className="block text-[10px] uppercase text-muted-foreground">Target</span>
                                      <span className="text-xs font-semibold text-primary">{formatRp(alloc.target)}</span>
                                    </div>

                                    <div className="text-right min-w-[95px]">
                                      <span className="block text-[10px] uppercase text-muted-foreground">Realisasi</span>
                                      <span className="text-xs font-semibold text-emerald-600">{formatRp(alloc.realisasi)}</span>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        handleRemoveIkskAllocation(
                                          kegIndex,
                                          alloc.iksk_number
                                        )
                                      }
                                      title="Hapus alokasi IKSK ini"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Clean Summary Card */}
                    <div className="lg:col-span-5">
                      <Card className="bg-muted border border-border">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">
                              Status Alokasi Kegiatan
                            </h4>
                            <Badge
                              variant={isComplete ? "secondary" : isOver ? "destructive" : "outline"}
                              className={
                                isComplete
                                  ? "bg-emerald-100 text-emerald-800 border-transparent text-xs"
                                  : isOver
                                  ? "bg-red-100 text-red-800 border-transparent text-xs"
                                  : "bg-amber-100 text-amber-800 border-transparent text-xs"
                              }
                            >
                              {isComplete ? "Valid (100%)" : isOver ? "Lebih dari 100%" : "Belum Lengkap"}
                            </Badge>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            Pastikan total alokasi terbagi tepat 100% untuk sinkronisasi anggaran yang akurat.
                          </p>

                          <div className="mt-4 space-y-2.5 rounded-md border border-border/80 bg-background/90 p-3.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Total Alokasi Terbagi:</span>
                              <span className={`font-semibold ${isComplete ? "text-emerald-600" : isOver ? "text-red-600" : "text-amber-600"}`}>
                                {formatPct(totalAllocPercent)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Sisa Dana Kegiatan:</span>
                              <span className="font-semibold text-foreground">
                                {formatRp((keg.pagu || 0) - (keg.realisasi || 0))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Persentase Serapan:</span>
                              <span className="font-semibold text-emerald-600">
                                {formatPct(keg.pagu > 0 ? (keg.realisasi / keg.pagu) * 100 : 0)}
                              </span>
                            </div>
                          </div>

                          <Separator className="my-5" />

                          <h5 className="text-xs font-semibold text-foreground mb-2">
                            Ringkasan Total Anggaran Tab
                          </h5>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Total Pagu:</span>
                              <span className="font-medium text-foreground">{formatRp(overallTotals.totalPagu)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Realisasi:</span>
                              <span className="font-medium text-emerald-600">{formatRp(overallTotals.totalRealisasi)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Serapan Keseluruhan:</span>
                              <span className="font-medium text-foreground">{formatPct(overallTotals.serapan)}</span>
                            </div>
                          </div>

                          <Separator className="my-5" />

                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2 text-foreground">
                              <CircleCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>Target & realisasi IKSK dikalkulasi otomatis dari persentase.</span>
                            </li>
                            <li className="flex items-start gap-2 text-foreground">
                              <CircleCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>Perubahan tersimpan langsung ke Google Spreadsheet target.</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <Separator className="my-6" />
                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      {saving ? "Menyimpan data ke server..." : "Periksa data sebelum menyimpan."}
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={loadTable}
                        disabled={saving || loading}
                        className="h-9 px-4 text-xs"
                      >
                        Reset
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSaveForm(kegIndex)}
                        disabled={saving}
                        className="h-9 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {saving ? "Menyimpan..." : "Simpan Kegiatan Ini"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
