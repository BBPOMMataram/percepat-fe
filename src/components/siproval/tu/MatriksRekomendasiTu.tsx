"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

export type TuRisk = {
  id: number;
  iksk_id: number | null;
  iksk_name?: string | null;
  kode_risiko: string;
  peristiwa_risiko: string;
  is_active?: boolean;
};

export type IkskItem = {
  id: number;
  name: string;
};

export type MatriksRekomendasiItem = {
  id: number;
  year: number;
  quarter: string;
  no: number;
  indikator: string;
  kendala: string | null;
  rekomendasi: string | null;
  rencana_tindak_lanjut: string | null;
  timeline: string | null;
  is_risiko: string | null;
  is_risk?: boolean;
  tu_risk_id?: number | null;
  master_risiko_id?: number | null;
  kode_resiko: string | null;
  peristiwa_resiko: string | null;
  progres_selesai: string | null;
  progres_belum: string | null;
  timeline_aksi?: string | null;
  kondisi_akhir?: string | null;
  is_laporan?: boolean;
  tu_risk?: TuRisk | null;
  created_at?: string;
  updated_at?: string;
};

export type SheetTabItem = {
  id: number;
  sheet_name: string;
  quarter?: string | null;
  title: string;
  category: "laporan" | "tarikan";
  is_yellow: boolean;
  badge: string;
  total_rows: number;
};

export type ActiveSheetDetail = {
  id: number;
  sheet_name: string;
  title: string;
  category: "laporan" | "tarikan";
  is_yellow: boolean;
  badge: string;
  headers: string[];
  rows: string[][];
  total_rows: number;
};

type QuarterConfig = {
  key: string;
  label: string;
  tab_title: string;
  short: string;
};

const QUARTERS: QuarterConfig[] = [
  { key: "TW1", label: "Triwulan I (TW 1)", tab_title: "Kendala TW 1 2026", short: "TW I" },
  { key: "TW2", label: "Triwulan II (TW 2)", tab_title: "Kendala TW 2 2026", short: "TW II" },
  { key: "TW3", label: "Triwulan III (TW 3)", tab_title: "Kendala TW 3 2026", short: "TW III" },
  { key: "TW4", label: "Triwulan IV (TW 4)", tab_title: "Kendala TW 4 2026", short: "TW IV" },
];

export default function MatriksRekomendasiTu() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramQuarter = searchParams.get("quarter")?.toUpperCase();
  const paramTab = searchParams.get("tab") || "";
  const initialQuarter = ["TW1", "TW2", "TW3", "TW4"].includes(paramQuarter || "")
    ? (paramQuarter as string)
    : "TW2";

  const paramYear = Number(searchParams.get("year")) || 2026;
  const hasYearParam = Boolean(searchParams.get("year"));
  const [showYearList, setShowYearList] = useState<boolean>(!hasYearParam);
  const [selectedYear, setSelectedYear] = useState<number>(paramYear);
  const [availableYears, setAvailableYears] = useState<{ id: number; year: number; name?: string; file_name?: string }[]>([]);
  const [loadingYears, setLoadingYears] = useState<boolean>(true);

  // Active view mode: 'laporan' (yellow - official reports) or 'tarikan' (regular pulled sheet tabs)
  const [activeType, setActiveType] = useState<"laporan" | "tarikan">(paramTab ? "tarikan" : "laporan");
  const [selectedQuarter, setSelectedQuarter] = useState<string>(initialQuarter);
  const [selectedTarikanSheet, setSelectedTarikanSheet] = useState<string>(paramTab || "HTL TW 1 2026");

  // Tabs metadata
  const [availableTabs, setAvailableTabs] = useState<{
    laporan: SheetTabItem[];
    tarikan: SheetTabItem[];
  }>({
    laporan: [],
    tarikan: [],
  });

  // Data for active views
  const [items, setItems] = useState<MatriksRekomendasiItem[]>([]);
  const [activeSheetData, setActiveSheetData] = useState<ActiveSheetDetail | null>(null);
  const [tuRisks, setTuRisks] = useState<TuRisk[]>([]);
  const [iksks, setIksks] = useState<IkskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterRisiko, setFilterRisiko] = useState<string>("ALL");

  // Modal Tambah Tahun
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [newYearNumber, setNewYearNumber] = useState(new Date().getFullYear() + 1);
  const [newYearName, setNewYearName] = useState("");
  const [savingYear, setSavingYear] = useState(false);

  // Modal Upload Excel Matriks
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadQuarter, setUploadQuarter] = useState<string>(initialQuarter);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);

  // Focus Modal Popup State (For Laporan Item Input / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MatriksRekomendasiItem | null>(null);
  const [formData, setFormData] = useState({
    no: 1,
    indikator: "",
    kendala: "",
    rekomendasi: "",
    rencana_tindak_lanjut: "",
    timeline: "TW III 2026",
    is_risiko: "T", // 'Y' | 'T'
    tu_risk_id: null as number | null,
    kode_resiko: "-",
    peristiwa_resiko: "-",
    progres_selesai: "",
    progres_belum: "",
    timeline_aksi: "",
    kondisi_akhir: "",
  });

  // Modal Tambah Master Data Risiko (tu_risks) Baru
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);
  const [newRiskIkskId, setNewRiskIkskId] = useState<string>("");
  const [newRiskKode, setNewRiskKode] = useState<string>("");
  const [newRiskPeristiwa, setNewRiskPeristiwa] = useState<string>("");
  const [savingRisk, setSavingRisk] = useState<boolean>(false);

  const fetchYears = async () => {
    try {
      setLoadingYears(true);
      const query = user?.id ? `?user_id=${encodeURIComponent(String(user.id))}` : "";
      const res = await api.get(`${baseUrl}/api/tu/matriks-rekomendasi-years${query}`);
      if (res.data?.data && Array.isArray(res.data.data)) {
        setAvailableYears(res.data.data);
      }
    } catch (e) {
      console.warn("Gagal mengambil daftar tahun matriks:", e);
    } finally {
      setLoadingYears(false);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearNumber) return;
    setSavingYear(true);
    try {
      const res = await api.post(`${baseUrl}/api/tu/matriks-rekomendasi-years`, {
        year: newYearNumber,
        name: newYearName || `Matriks Rekomendasi ${newYearNumber}`,
      });
      setNotification({
        type: "success",
        message: res.data?.message || `Tahun ${newYearNumber} berhasil ditambahkan.`,
      });
      setIsYearModalOpen(false);
      setNewYearName("");
      await fetchYears();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Gagal menambahkan tahun baru.",
      });
    } finally {
      setSavingYear(false);
    }
  };

  const handleUploadExcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Silakan pilih file Excel terlebih dahulu.");
      return;
    }
    setUploadingExcel(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("year", String(selectedYear));
    fd.append("quarter", uploadQuarter);

    try {
      const res = await api.post(`${baseUrl}/api/tu/matriks-rekomendasi-upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNotification({
        type: "success",
        message: res.data?.message || "File Excel berhasil diunggah dan diimpor.",
      });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      if (activeType === "laporan") {
        await fetchLaporanMatriks(selectedQuarter);
      } else {
        await fetchTarikanSheet(selectedTarikanSheet);
      }
      await fetchYears();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Gagal mengunggah file Excel matriks.",
      });
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleOpenYearMatriks = (yr: number) => {
    setSelectedYear(yr);
    setShowYearList(false);
    router.replace(`/siproval/tu/matriks-rekomendasi?year=${yr}&quarter=${selectedQuarter}`, { scroll: false });
  };

  // Fetch official Laporan Matriks Rekomendasi (Yellow)
  const fetchLaporanMatriks = async (quarter: string) => {
    setLoading(true);
    setError("");
    try {
      const query = user?.id
        ? `?quarter=${encodeURIComponent(quarter)}&user_id=${encodeURIComponent(String(user.id))}`
        : `?quarter=${encodeURIComponent(quarter)}`;
      const res = await api.get(`${baseUrl}/api/tu/matriks-rekomendasi/${selectedYear}${query}`);

      if (res.data?.data) {
        setItems(res.data.data.records || []);
        setActiveType("laporan");
        if (res.data.data.available_tabs) {
          setAvailableTabs(res.data.data.available_tabs);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e.response?.data?.message || "Gagal memuat data matriks rekomendasi."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch regular pulled sheet tab (Non-Yellow / Tarikan)
  const fetchTarikanSheet = async (sheetName: string) => {
    setLoading(true);
    setError("");
    try {
      const query = user?.id
        ? `?tab=${encodeURIComponent(sheetName)}&user_id=${encodeURIComponent(String(user.id))}`
        : `?tab=${encodeURIComponent(sheetName)}`;
      const res = await api.get(`${baseUrl}/api/tu/matriks-rekomendasi/${selectedYear}${query}`);

      if (res.data?.data) {
        setActiveType("tarikan");
        setSelectedTarikanSheet(sheetName);
        setActiveSheetData(res.data.data.active_sheet || null);
        if (res.data.data.available_tabs) {
          setAvailableTabs(res.data.data.available_tabs);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e.response?.data?.message || `Gagal memuat tab tarikan ${sheetName}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTuRisks = async () => {
    try {
      const query = user?.id ? `?user_id=${encodeURIComponent(String(user.id))}` : "";
      const res = await api.get(`${baseUrl}/api/tu/risk${query}`);
      if (res.data?.data?.records) {
        setTuRisks(res.data.data.records);
      }
      if (res.data?.data?.iksks) {
        setIksks(res.data.data.iksks);
      }
    } catch {
      try {
        const resLegacy = await api.get(`${baseUrl}/api/tu/master-risiko`);
        if (resLegacy.data?.data?.records) {
          setTuRisks(resLegacy.data.data.records);
        }
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchYears();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      if (activeType === "laporan") {
        fetchLaporanMatriks(selectedQuarter);
      } else {
        fetchTarikanSheet(selectedTarikanSheet);
      }
      fetchTuRisks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuarter, selectedTarikanSheet, activeType, user?.id, selectedYear]);

  const handleSelectQuarter = (qKey: string) => {
    setActiveType("laporan");
    setSelectedQuarter(qKey);
    setSearchQuery("");
    router.replace(`/siproval/tu/matriks-rekomendasi?year=${selectedYear}&quarter=${qKey}`, { scroll: false });
  };

  const handleSelectTarikanTab = (sheetName: string) => {
    setActiveType("tarikan");
    setSelectedTarikanSheet(sheetName);
    setSearchQuery("");
    router.replace(`/siproval/tu/matriks-rekomendasi?year=${selectedYear}&tab=${encodeURIComponent(sheetName)}`, { scroll: false });
  };

  const handleSyncSheet = async () => {
    if (
      !confirm(
        `Sinkronkan data Matriks Rekomendasi untuk ${selectedQuarter}? Data yang ada di database akan disinkronkan.`
      )
    ) {
      return;
    }
    setSyncing(true);
    setError("");
    setNotification(null);
    try {
      const query = user?.id ? `?user_id=${encodeURIComponent(String(user.id))}` : "";
      const res = await api.post(`${baseUrl}/api/tu/matriks-rekomendasi/${selectedYear}/sync-sheet${query}`, {
        quarter: selectedQuarter,
      });
      if (res.data?.data?.records) {
        setItems(res.data.data.records);
      } else {
        await fetchLaporanMatriks(selectedQuarter);
      }
      setNotification({
        type: "success",
        message: `Sinkronisasi berhasil! Data matriks ${selectedQuarter} telah diperbarui.`,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        message: e.response?.data?.message || "Gagal sinkronisasi data matriks.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAddModal = () => {
    const nextNo = items.length > 0 ? Math.max(...items.map((i) => i.no || 0)) + 1 : 1;
    setEditingItem(null);
    setFormData({
      no: nextNo,
      indikator: "",
      kendala: "",
      rekomendasi: "",
      rencana_tindak_lanjut: "",
      timeline: selectedQuarter === "TW1" ? "TW II 2026" : selectedQuarter === "TW2" ? "TW III 2026" : "TW IV 2026",
      is_risiko: "T",
      tu_risk_id: null,
      kode_resiko: "-",
      peristiwa_resiko: "-",
      progres_selesai: "",
      progres_belum: "",
      timeline_aksi: "",
      kondisi_akhir: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MatriksRekomendasiItem) => {
    setEditingItem(item);
    const isY = item.is_risiko === "Y" || item.is_risiko === "Ya";
    setFormData({
      no: item.no,
      indikator: item.indikator || "",
      kendala: item.kendala || "",
      rekomendasi: item.rekomendasi || "",
      rencana_tindak_lanjut: item.rencana_tindak_lanjut || "",
      timeline: item.timeline || "",
      is_risiko: isY ? "Y" : "T",
      tu_risk_id: isY ? (item.tu_risk_id || item.master_risiko_id || null) : null,
      kode_resiko: isY ? (item.kode_resiko || "-") : "-",
      peristiwa_resiko: isY ? (item.peristiwa_resiko || "-") : "-",
      progres_selesai: item.progres_selesai || "",
      progres_belum: item.progres_belum || "",
      timeline_aksi: item.timeline_aksi || "",
      kondisi_akhir: item.kondisi_akhir || "",
    });
    setIsModalOpen(true);
  };

  const handleToggleIsRisiko = (newVal: string) => {
    if (newVal === "T" || newVal === "false") {
      setFormData((prev) => ({
        ...prev,
        is_risiko: "T",
        tu_risk_id: null,
        kode_resiko: "-",
        peristiwa_resiko: "-",
      }));
    } else {
      const matched = formData.tu_risk_id
        ? tuRisks.find((r) => r.id === formData.tu_risk_id)
        : tuRisks.length > 0
        ? tuRisks[0]
        : null;

      setFormData((prev) => ({
        ...prev,
        is_risiko: "Y",
        tu_risk_id: matched ? matched.id : null,
        kode_resiko: matched ? matched.kode_risiko : "-",
        peristiwa_resiko: matched ? matched.peristiwa_risiko : "-",
      }));
    }
  };

  const handleSelectTuRisk = (selectedRiskId: string) => {
    if (!selectedRiskId || selectedRiskId === "-") {
      setFormData((prev) => ({
        ...prev,
        tu_risk_id: null,
        kode_resiko: "-",
        peristiwa_resiko: "-",
      }));
      return;
    }

    const idNum = Number(selectedRiskId);
    const found = tuRisks.find((r) => r.id === idNum);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        is_risiko: "Y",
        tu_risk_id: found.id,
        kode_resiko: found.kode_risiko,
        peristiwa_resiko: found.peristiwa_risiko,
      }));
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);
    try {
      const isY = formData.is_risiko === "Y";
      const payload = {
        ...formData,
        is_risiko: isY ? "Y" : "T",
        is_risk: isY,
        tu_risk_id: isY ? formData.tu_risk_id : null,
        kode_resiko: isY ? formData.kode_resiko : "-",
        peristiwa_resiko: isY ? formData.peristiwa_resiko : "-",
        quarter: selectedQuarter,
      };

      const query = user?.id ? `?user_id=${encodeURIComponent(String(user.id))}` : "";
      if (editingItem) {
        const res = await api.put(
          `${baseUrl}/api/tu/matriks-rekomendasi/${editingItem.id}${query}`,
          payload
        );
        if (res.data?.data) {
          setItems((prev) =>
            prev.map((i) => (i.id === editingItem.id ? res.data.data : i))
          );
        }
        setNotification({
          type: "success",
          message: `Data No. ${formData.no} berhasil diperbarui.`,
        });
      } else {
        const res = await api.post(
          `${baseUrl}/api/tu/matriks-rekomendasi/${selectedYear}${query}`,
          payload
        );
        if (res.data?.data) {
          setItems((prev) => [...prev, res.data.data].sort((a, b) => a.no - b.no));
        }
        setNotification({
          type: "success",
          message: `Indikator rekomendasi baru berhasil ditambahkan.`,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTuRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskKode || !newRiskPeristiwa) return;
    setSavingRisk(true);
    try {
      const query = user?.id ? `?user_id=${encodeURIComponent(String(user.id))}` : "";
      const res = await api.post(`${baseUrl}/api/tu/risk${query}`, {
        kode_risiko: newRiskKode.trim().toUpperCase(),
        peristiwa_risiko: newRiskPeristiwa.trim(),
        iksk_id: newRiskIkskId ? Number(newRiskIkskId) : null,
      });

      if (res.data?.data) {
        const created: TuRisk = res.data.data;
        setTuRisks((prev) => {
          const filtered = prev.filter((r) => r.kode_risiko !== created.kode_risiko);
          return [...filtered, created].sort((a, b) => a.kode_risiko.localeCompare(b.kode_risiko));
        });
        setFormData((prev) => ({
          ...prev,
          is_risiko: "Y",
          tu_risk_id: created.id,
          kode_resiko: created.kode_risiko,
          peristiwa_resiko: created.peristiwa_risiko,
        }));
      }
      setIsRiskModalOpen(false);
      setNewRiskKode("");
      setNewRiskPeristiwa("");
      setNewRiskIkskId("");
      setNotification({
        type: "success",
        message: `Master data risiko ${newRiskKode} berhasil ditambahkan ke tabel tu_risks.`,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Gagal menyimpan master risiko.");
    } finally {
      setSavingRisk(false);
    }
  };

  const handleDeleteItem = async (id: number, no: number) => {
    if (!confirm(`Hapus baris rekomendasi No. ${no}?`)) return;
    try {
      const query = user?.id ? `?user_id=${encodeURIComponent(String(user.id))}` : "";
      await api.delete(`${baseUrl}/api/tu/matriks-rekomendasi/${id}${query}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setNotification({
        type: "success",
        message: `Data No. ${no} berhasil dihapus.`,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Gagal menghapus data.");
    }
  };

  // Filtered rows for Laporan
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (item.indikator && item.indikator.toLowerCase().includes(q)) ||
        (item.kendala && item.kendala.toLowerCase().includes(q)) ||
        (item.rekomendasi && item.rekomendasi.toLowerCase().includes(q)) ||
        (item.rencana_tindak_lanjut && item.rencana_tindak_lanjut.toLowerCase().includes(q)) ||
        (item.kode_resiko && item.kode_resiko.toLowerCase().includes(q));

      const isY = item.is_risiko === "Y" || item.is_risiko === "Ya";
      const matchRisiko =
        filterRisiko === "ALL"
          ? true
          : filterRisiko === "Y"
          ? isY
          : !isY;

      return matchSearch && matchRisiko;
    });
  }, [items, searchQuery, filterRisiko]);

  // Filtered rows for Tarikan
  const filteredSheetRows = useMemo(() => {
    if (!activeSheetData?.rows) return [];
    if (!searchQuery.trim()) return activeSheetData.rows;
    const q = searchQuery.toLowerCase();
    return activeSheetData.rows.filter((row) =>
      row.some((cell) => cell && cell.toLowerCase().includes(q))
    );
  }, [activeSheetData, searchQuery]);

  if (showYearList) {
    return (
      <div className="space-y-6">
        {/* Header Landing Hub */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <button
                type="button"
                onClick={() => {
                  setShowYearList(true);
                  router.replace("/siproval/tu/matriks-rekomendasi", { scroll: false });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Icon icon="solar:arrow-left-linear" width={14} />
                <span>Daftar Tahun</span>
              </button>
              <span>/</span>
              <span className="text-slate-800">Tahun {selectedYear}</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Matriks Rekomendasi & RTL
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Kelola daftar kendala, rekomendasi, tindak lanjut resmi laporan (header kuning) serta tab hasil tarikan spreadsheet lainnya.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsYearModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Icon icon="solar:calendar-add-bold" width={16} className="text-[#005baa]" />
              Buat Tahun Baru
            </button>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#004887] transition"
            >
              <Icon icon="solar:upload-track-2-bold" width={16} />
              Unggah File Excel Matriks
            </button>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Tahun Terdaftar
            </span>
            <span className="mt-2 block text-2xl font-black text-slate-900">
              {loadingYears ? "..." : `${availableYears.length} Tahun`}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Tahun anggaran aktif dalam sistem
            </span>
          </div>

          <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5 shadow-2xs">
            <span className="block text-xs font-bold uppercase tracking-wider text-amber-700">
              ⭐ Kategori Laporan (Kuning)
            </span>
            <span className="mt-2 block text-2xl font-black text-amber-950">
              3 Triwulan
            </span>
            <span className="text-xs text-amber-800 mt-1 block">
              Kendala TW 1, TW 2, TW 3 (Header #ffc000 Resmi LAPKIN)
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              📑 Tab Hasil Tarikan
            </span>
            <span className="mt-2 block text-2xl font-black text-[#005baa]">
              8 Tab Tarikan
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              HTL TW 1-2, RTL TW 4 2025, Rencana Aksi RO TW 1-3, dsb.
            </span>
          </div>
        </div>

        {/* Grid Kartu Tahun */}
        <div>
          <div className="mb-3.5">
            <h2 className="text-base font-bold text-slate-900">
              Daftar Tahun Matriks Rekomendasi
            </h2>
            <p className="text-xs text-slate-500">
              Pilih tahun anggaran yang ingin Anda kelola kendala dan tindak lanjutnya.
            </p>
          </div>

          {loadingYears ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              Memuat daftar tahun matriks rekomendasi...
            </div>
          ) : availableYears.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              Belum ada tahun matriks rekomendasi terdaftar. Klik &ldquo;Buat Tahun Baru&rdquo; atau unggah file Excel untuk memulai.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableYears.map((y) => (
                <div
                  key={y.year}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-[#005baa]/60 hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#005baa]">
                        Tahun {y.year}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Tahun Anggaran
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#005baa] transition">
                      {y.name || `Matriks Rekomendasi ${y.year}`}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Kendala, rekomendasi, RTL resmi laporan (kuning), dan pemetaan tab hasil tarikan tahun {y.year}.
                    </p>
                    {y.file_name && (
                      <p className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 truncate">
                        File: {y.file_name}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#005baa] group-hover:underline">
                      Buka Rincian Matriks &rarr;
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenYearMatriks(y.year)}
                      className="inline-flex items-center justify-center rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#004887] transition"
                    >
                      Buka Matriks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Buat Tahun Baru */}
        {isYearModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-slate-900">
                Buat Tahun Baru Matriks Rekomendasi
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Daftarkan tahun baru untuk pengelolaan kendala & rekomendasi.
              </p>

              <form onSubmit={handleCreateYear} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Anggaran *
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2050"
                    value={newYearNumber}
                    onChange={(e) => setNewYearNumber(parseInt(e.target.value) || 2026)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama / Deskripsi Dokumen (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                    placeholder="Contoh: Matriks Rekomendasi TU 2027"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsYearModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingYear}
                    className="rounded-xl bg-[#005baa] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#004887] disabled:opacity-50 transition"
                  >
                    {savingYear ? "Menyimpan..." : "Simpan Tahun"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <button
                type="button"
                onClick={() => setShowYearList(true)}
                className="hover:text-[#005baa] font-semibold"
              >
                Daftar Tahun
              </button>
              <span>/</span>
              <Link href="/siproval/tu" className="hover:text-[#005baa]">
                Dashboard TU
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-800">
                Matriks Rekomendasi {selectedYear}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Formulir & Matriks Rekomendasi {selectedYear}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Tabel <strong>Warna Kuning (Header #ffc000)</strong> adalah matriks resmi yang <strong>dipakai untuk Laporan Kinerja & Evaluasi Internal (LAPKIN)</strong>. Sisanya adalah <strong>tab biasa hasil tarikan spreadsheet</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <Icon icon="solar:upload-track-2-bold" width={16} className="text-emerald-600" />
              Unggah File Excel (.xlsx)
            </button>

            {activeType === "laporan" && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004b8d] disabled:opacity-50"
              >
                <Icon icon="solar:add-circle-bold" width={16} />
                Tambah Rekomendasi
              </button>
            )}

            <Link
              href={`/siproval/tu/laporan-evaluasi?quarter=${selectedQuarter}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-900"
            >
              <Icon icon="solar:printer-bold" width={16} />
              Lihat di Eksport Laporan
            </Link>
          </div>
        </div>

        {/* TWO DEDICATED TAB GROUPS */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          {/* GROUP 1: ⭐ Matriks Rekomendasi (Digunakan untuk Laporan - Warna Kuning/Gold #ffc000) */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-black tracking-wide text-amber-950 uppercase">
                <Icon icon="solar:star-circle-bold" width={16} className="text-amber-600" />
                Matriks Rekomendasi (Warna Kuning - Dipake Buat Laporan)
              </span>
              <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                ⭐ Digunakan untuk Laporan Evaluasi Internal & LAPKIN
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {QUARTERS.map((q) => {
                const active = activeType === "laporan" && selectedQuarter === q.key;
                return (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => handleSelectQuarter(q.key)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? "bg-[#ffc000] text-slate-950 shadow-xs ring-2 ring-amber-400 border border-amber-500 font-black"
                        : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/70"
                    }`}
                  >
                    <span>{q.short}</span>
                    <span className="text-[11px] opacity-80">({q.tab_title})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GROUP 2: 📑 Tab Biasa Hasil Tarikan Spreadsheet */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <Icon icon="solar:document-text-bold" width={16} className="text-slate-500" />
                Tab Biasa Hasil Tarikan (Monitoring & Evaluasi Lainnya)
              </span>
              <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                📑 Tab Hasil Tarikan Spreadsheet (Non-Laporan)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: "HTL TW 1 2026", short: "HTL TW 1" },
                { name: "HTL TW 2 2026", short: "HTL TW 2" },
                { name: "RTL TW 4 2025", short: "RTL TW 4 2025" },
                { name: "Rencana Aksi RO TW 1", short: "Aksi RO TW 1" },
                { name: "Rencana Aksi RO TW 2", short: "Aksi RO TW 2" },
                { name: "Rencana Aksi RO TW 3", short: "Aksi RO TW 3" },
                { name: "TW 1 2026", short: "Tarikan TW 1" },
                { name: "LAPKIN TW 3 2025", short: "LAPKIN TW 3" },
              ].map((tab) => {
                const active = activeType === "tarikan" && selectedTarikanSheet === tab.name;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => handleSelectTarikanTab(tab.name)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "bg-[#005baa] text-white shadow-xs ring-2 ring-[#005baa]/20"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold shadow-2xs ${
            notification.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon={
                notification.type === "success"
                  ? "solar:check-circle-bold"
                  : "solar:danger-circle-bold"
              }
              width={18}
            />
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <Icon icon="solar:close-circle-bold" width={16} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Search & Filter Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Icon
            icon="solar:magnifer-linear"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeType === "laporan"
                ? "Cari indikator, kendala, atau kode risiko..."
                : `Cari di seluruh kolom tab ${selectedTarikanSheet}...`
            }
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
          />
        </div>

        {activeType === "laporan" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status Risiko:</span>
            <select
              value={filterRisiko}
              onChange={(e) => setFilterRisiko(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#005baa] focus:outline-none"
            >
              <option value="ALL">Semua Indikator</option>
              <option value="Y">Risiko: YA (Y)</option>
              <option value="T">Bukan Risiko: TIDAK (T)</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span>
              Menampilkan <strong>{filteredSheetRows.length}</strong> dari {activeSheetData?.rows?.length || 0} baris data
            </span>
          </div>
        )}
      </div>

      {/* MAIN VIEW: KATEGORI LAPORAN (YELLOW HEADER #ffc000) */}
      {activeType === "laporan" && (
        <>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#005baa] border-r-transparent" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Memuat Matriks Rekomendasi Laporan {selectedQuarter}...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Icon
                icon="solar:clipboard-list-linear"
                className="mx-auto text-slate-400"
                width={48}
              />
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                Belum ada data Matriks Rekomendasi untuk {selectedQuarter}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Anda dapat menyinkronkan data atau menambahkannya secara manual.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncSheet}
                  className="rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#004b8d]"
                >
                  Tarik Data dari Spreadsheet
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Input Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-xs">
              {/* Table Header Accent banner with Gold/Amber Theme */}
              <div className="flex items-center justify-between border-b border-amber-300 bg-amber-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ffc000] ring-2 ring-amber-400" />
                  <span className="text-xs font-black text-slate-950">
                    ⭐ Tabel Matriks Rekomendasi Triwulan ({selectedQuarter} - {items.length} Indikator)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-200/90 px-2 py-0.5 text-[11px] font-bold text-amber-950 border border-amber-300">
                    ⭐ Digunakan untuk Laporan Kinerja & Evaluasi Internal (Header Kuning #ffc000)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-800 border-collapse">
                  <thead>
                    <tr className="bg-[#ffc000] text-slate-950 font-bold border-b border-black">
                      <th className="w-12 border border-black px-2 py-3 text-center align-middle">
                        No
                      </th>
                      <th className="min-w-[220px] border border-black px-3 py-3 text-center align-middle">
                        Indikator / Output
                      </th>
                      <th className="min-w-[240px] border border-black px-3 py-3 text-center align-middle">
                        Kendala / Permasalahan
                      </th>
                      <th className="min-w-[240px] border border-black px-3 py-3 text-center align-middle">
                        Rekomendasi
                      </th>
                      <th className="min-w-[240px] border border-black px-3 py-3 text-center align-middle">
                        Rencana Tindak Lanjut (RTL)
                      </th>
                      <th className="w-24 border border-black px-2 py-3 text-center align-middle">
                        Timeline
                      </th>
                      <th className="w-24 border border-black px-2 py-3 text-center align-middle">
                        Apakah Dikelola Risiko (Y/T)
                      </th>
                      <th className="w-24 border border-black px-2 py-3 text-center align-middle">
                        Kode Risiko
                      </th>
                      <th className="min-w-[220px] border border-black px-3 py-3 text-center align-middle">
                        Peristiwa Risiko
                      </th>
                      <th className="min-w-[180px] border border-black px-3 py-3 text-center align-middle">
                        Progres Rencana Aksi (Selesai)
                      </th>
                      <th className="min-w-[180px] border border-black px-3 py-3 text-center align-middle">
                        Progres Rencana Aksi (Belum)
                      </th>
                      <th className="min-w-[120px] border border-black px-2 py-3 text-center align-middle">
                        Timeline Aksi
                      </th>
                      <th className="w-20 border border-black px-2 py-3 text-center align-middle">
                        Kondisi Akhir
                      </th>
                      <th className="w-20 border border-black px-2 py-3 text-center align-middle">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredItems.map((item) => {
                      const isY = item.is_risiko === "Y" || item.is_risiko === "Ya";
                      const displayKode = isY ? (item.kode_resiko || "-") : "-";
                      const displayPeristiwa = isY ? (item.peristiwa_resiko || "-") : "-";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-amber-50/40 transition-colors"
                        >
                          <td className="border border-slate-300 px-2 py-2.5 text-center font-semibold align-top">
                            {item.no}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-900 align-top leading-snug">
                            {item.indikator}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 text-left whitespace-pre-line align-top leading-relaxed text-slate-700">
                            {item.kendala || "-"}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 text-left whitespace-pre-line align-top leading-relaxed text-slate-700">
                            {item.rekomendasi || "-"}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 text-left whitespace-pre-line align-top leading-relaxed text-slate-700">
                            {item.rencana_tindak_lanjut || "-"}
                          </td>
                          <td className="border border-slate-300 px-2 py-2.5 text-center align-top whitespace-nowrap text-slate-600 font-medium">
                            {item.timeline || "-"}
                          </td>
                          <td className="border border-slate-300 px-2 py-2.5 text-center align-top">
                            {isY ? (
                              <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                                Y (Ya)
                              </span>
                            ) : (
                              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                                T (Tidak)
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-2 py-2.5 text-center align-top font-mono">
                            {isY ? (
                              <span className="inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
                                {displayKode}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 text-left whitespace-pre-line align-top leading-relaxed text-slate-700">
                            {isY ? (
                              <div>
                                <div>{displayPeristiwa}</div>
                                {item.tu_risk?.iksk_name && (
                                  <div className="mt-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 inline-block">
                                    Indikator: {item.tu_risk.iksk_name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 text-left whitespace-pre-line align-top leading-relaxed text-slate-600">
                            {item.progres_selesai || "-"}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 text-left whitespace-pre-line align-top leading-relaxed text-slate-600">
                            {item.progres_belum || "-"}
                          </td>
                          <td className="border border-slate-300 px-2 py-2.5 text-center align-top whitespace-nowrap text-slate-600 font-medium">
                            {item.timeline_aksi || "-"}
                          </td>
                          <td className="border border-slate-300 px-2 py-2.5 text-center align-top">
                            {item.kondisi_akhir ? (
                              <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                item.kondisi_akhir.toLowerCase() === "closed"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-blue-100 text-blue-800 border border-blue-300"
                              }`}>
                                {item.kondisi_akhir}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-2 py-2.5 text-center align-top">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                                title="Edit data rekomendasi"
                              >
                                <Icon icon="solar:pen-new-square-bold" width={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, item.no)}
                                className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                                title="Hapus baris ini"
                              >
                                <Icon icon="solar:trash-bin-trash-bold" width={16} />
                              </button>
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
        </>
      )}

      {/* MAIN VIEW: TAB BIASA HASIL TARIKAN (NON-YELLOW SPREADSHEET VIEW) */}
      {activeType === "tarikan" && (
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xs">
          {/* Header Accent banner for Tarikan */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#005baa]" />
              <span className="text-xs font-bold text-slate-900">
                Tabel Tarikan Data: {activeSheetData?.sheet_name} ({filteredSheetRows.length} Baris Data)
              </span>
            </div>
            <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              📑 Tab Biasa Hasil Tarikan (Non-Laporan / Monitoring Lanjutan)
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#005baa] border-r-transparent" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Memuat tab tarikan {selectedTarikanSheet}...
              </p>
            </div>
          ) : !activeSheetData || filteredSheetRows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Tidak ada data ditemukan pada tab ini.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[750px]">
              <table className="w-full text-xs text-slate-800 border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100">
                  <tr className="border-b border-slate-300 text-slate-900 font-bold">
                    {activeSheetData.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="border border-slate-300 px-3 py-2.5 text-center align-middle whitespace-pre-line bg-slate-100 shadow-2xs text-[11px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSheetRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100/60"}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="border border-slate-300 px-3 py-2 text-left align-top leading-relaxed whitespace-pre-line text-[11px]"
                        >
                          {cell || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Focus Modal Popup Dialog for Input / Edit Form (Laporan Tabs) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Modal Header with gold accent border */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ffc000]" />
                  <h2 className="text-base font-bold text-slate-900">
                    {editingItem
                      ? `Edit Data Rekomendasi No. ${formData.no}`
                      : `Tambah Data Rekomendasi (${selectedQuarter})`}
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Formulir terstruktur kendala, rekomendasi, RTL, dan integrasi master data risiko (tabel tu_risks & IKSK)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-bold" width={22} />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveModal} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-xs text-slate-700">
                {/* No & Indikator */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700">No.</label>
                    <input
                      type="number"
                      required
                      value={formData.no}
                      onChange={(e) =>
                        setFormData({ ...formData, no: parseInt(e.target.value) || 1 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-10">
                    <label className="block font-bold text-slate-700">
                      Nama Indikator / Output <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.indikator}
                      onChange={(e) =>
                        setFormData({ ...formData, indikator: e.target.value })
                      }
                      placeholder="Masukkan nama indikator kinerja..."
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Kendala / Permasalahan */}
                <div>
                  <label className="block font-bold text-slate-700">
                    Kendala / Permasalahan
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Tulis kendala yang dihadapi (bisa berupa daftar bernomor 1, 2, 3...)
                  </p>
                  <textarea
                    rows={3}
                    value={formData.kendala}
                    onChange={(e) =>
                      setFormData({ ...formData, kendala: e.target.value })
                    }
                    placeholder="Contoh: 1. Aplikasi E-Meso belum bisa diakses..."
                    className="mt-1 w-full rounded-lg border border-slate-300 p-3 leading-relaxed text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>

                {/* Rekomendasi */}
                <div>
                  <label className="block font-bold text-slate-700">
                    Rekomendasi
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Tulis rekomendasi arahan atau solusi tindak lanjut
                  </p>
                  <textarea
                    rows={3}
                    value={formData.rekomendasi}
                    onChange={(e) =>
                      setFormData({ ...formData, rekomendasi: e.target.value })
                    }
                    placeholder="Contoh: Koordinasi dengan Balai Regional..."
                    className="mt-1 w-full rounded-lg border border-slate-300 p-3 leading-relaxed text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>

                {/* Rencana Tindak Lanjut */}
                <div>
                  <label className="block font-bold text-slate-700">
                    Rencana Tindak Lanjut (RTL)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Rencana langkah nyata tindak lanjut atas rekomendasi
                  </p>
                  <textarea
                    rows={3}
                    value={formData.rencana_tindak_lanjut}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rencana_tindak_lanjut: e.target.value,
                      })
                    }
                    placeholder="Contoh: Melakukan penyesuaian sampling..."
                    className="mt-1 w-full rounded-lg border border-slate-300 p-3 leading-relaxed text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>

                {/* Timeline & Relasi Master Risiko (tu_risks & IKSK) */}
                <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Icon icon="solar:shield-warning-bold" className="text-amber-600" width={18} />
                      Pengelolaan Risiko (Tabel tu_risks & IKSK) & Timeline
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRiskModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 shadow-2xs"
                    >
                      <Icon icon="solar:add-circle-bold" width={14} />
                      + Tambah ke Master tu_risk
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Timeline */}
                    <div>
                      <label className="block font-bold text-slate-700">
                        Timeline Target
                      </label>
                      <input
                        type="text"
                        value={formData.timeline}
                        onChange={(e) =>
                          setFormData({ ...formData, timeline: e.target.value })
                        }
                        placeholder="Contoh: TW III 2026"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                      />
                    </div>

                    {/* Apakah Sudah dikelola sebagai risiko (Y/T) */}
                    <div>
                      <label className="block font-bold text-slate-700">
                        Apakah Dikelola Risiko? (Y/T)
                      </label>
                      <select
                        value={formData.is_risiko}
                        onChange={(e) => handleToggleIsRisiko(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 font-bold focus:outline-none ${
                          formData.is_risiko === "Y"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : "border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <option value="T">T (Tidak / Bukan Risiko)</option>
                        <option value="Y">Y (Ya / Dikelola Sebagai Risiko)</option>
                      </select>
                    </div>

                    {/* Pilih dari Master tu_risks */}
                    <div>
                      <label className="block font-bold text-slate-700">
                        Pilih dari Master Risiko (tu_risks)
                      </label>
                      <select
                        disabled={formData.is_risiko !== "Y"}
                        value={formData.tu_risk_id || ""}
                        onChange={(e) => handleSelectTuRisk(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="-">-- Pilih Master Risiko --</option>
                        {tuRisks.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.kode_risiko} - {r.peristiwa_risiko.substring(0, 45)}...
                            {r.iksk_name ? ` [IKSK: ${r.iksk_name.substring(0, 20)}...]` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.is_risiko !== "Y" ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-100/80 p-3 text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Icon icon="solar:info-circle-bold" className="text-slate-500" width={16} />
                        Status: Bukan Risiko / Tidak Dikelola Sebagai Risiko
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Nilai <strong>Kode Risiko</strong> dan <strong>Peristiwa Risiko</strong> otomatis diset <code>&quot;-&quot;</code> (strip). Pilih <strong>&quot;Y (Ya)&quot;</strong> di atas jika permasalahan ini ditangani sebagai risiko.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1 border-t border-amber-200/60">
                      <div>
                        <label className="block font-bold text-slate-700">
                          Kode Risiko <span className="text-amber-700 font-mono">*</span>
                        </label>
                        <input
                          type="text"
                          required={formData.is_risiko === "Y"}
                          value={formData.kode_resiko}
                          onChange={(e) =>
                            setFormData({ ...formData, kode_resiko: e.target.value })
                          }
                          placeholder="Contoh: S-27"
                          className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-mono font-bold text-amber-900 focus:border-[#005baa] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700">
                          Peristiwa Risiko (Uraian Baku)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.peristiwa_resiko}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              peristiwa_resiko: e.target.value,
                            })
                          }
                          placeholder="Uraian peristiwa risiko baku..."
                          className="mt-1 w-full rounded-lg border border-amber-300 bg-white p-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Progres Rencana Aksi, Timeline Aksi & Kondisi Akhir */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-bold text-slate-700">
                      Progres Rencana Aksi (Selesai)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.progres_selesai}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          progres_selesai: e.target.value,
                        })
                      }
                      placeholder="Rencana aksi yang sudah selesai..."
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700">
                      Progres Rencana Aksi (Belum Selesai)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.progres_belum}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          progres_belum: e.target.value,
                        })
                      }
                      placeholder="Rencana aksi yang belum selesai..."
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700">
                      Timeline Rencana Aksi
                    </label>
                    <input
                      type="text"
                      value={formData.timeline_aksi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeline_aksi: e.target.value,
                        })
                      }
                      placeholder="Contoh: TW 1 Tahun 2026"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700">
                      Kondisi Akhir
                    </label>
                    <input
                      type="text"
                      value={formData.kondisi_akhir}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kondisi_akhir: e.target.value,
                        })
                      }
                      placeholder="Contoh: Open / Closed"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#004b8d] disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  )}
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Unggah File Excel Matriks */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Unggah Dokumen Matriks Rekomendasi (Excel / CSV)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Sistem otomatis membaca sheet resmi laporan (header kuning) dan seluruh sheet tarikan lainnya.
              </p>
            </div>

            <form onSubmit={handleUploadExcelSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Tahun Anggaran
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#005baa] focus:outline-none"
                  >
                    {availableYears.map((y) => (
                      <option key={y.year} value={y.year}>
                        Tahun {y.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Triwulan
                  </label>
                  <select
                    value={uploadQuarter}
                    onChange={(e) => setUploadQuarter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#005baa] focus:outline-none"
                  >
                    {QUARTERS.map((q) => (
                      <option key={q.key} value={q.key}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => document.getElementById("matriks-excel-upload-file-table")?.click()}
                onDragEnter={(e) => { e.preventDefault(); setIsDraggingExcel(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingExcel(false); }}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingExcel(true); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingExcel(false);
                  if (e.dataTransfer.files?.[0]) setUploadFile(e.dataTransfer.files[0]);
                }}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  isDraggingExcel ? "border-[#005baa] bg-blue-50/50" : "border-slate-200 hover:border-[#005baa]/60 hover:bg-slate-50/50"
                }`}
              >
                <input
                  id="matriks-excel-upload-file-table"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                  }}
                  className="hidden"
                />

                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs font-bold">
                    ⭐
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l3 3m0-3l-3 3m5-3h4m-4 3h4"></path>
                    </svg>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#005baa] shadow-2xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-800">
                  Pilih atau seret file ke area ini
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Format didukung: <strong>.xlsx, .xls, .csv</strong> (Maksimal 25 MB)
                </p>
              </div>

              {uploadFile && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
                  <span className="font-bold text-slate-800 truncate">
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadFile(null)}
                    className="text-red-500 font-bold hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  File akan langsung diekstrak ke Matriks Laporan dan Tab Tarikan {selectedYear}.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingExcel || !uploadFile}
                    className="rounded-xl bg-[#005baa] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#004887] disabled:opacity-50 transition"
                  >
                    {uploadingExcel ? "Mengimpor Data..." : "Proses & Simpan Data"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mini Modal Tambah Master Data Risiko */}
      {isRiskModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Icon icon="solar:shield-warning-bold" className="text-amber-500" width={18} />
                Tambah Master Risiko Baru (Tabel tu_risks)
              </h3>
              <button
                type="button"
                onClick={() => setIsRiskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTuRisk} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700">
                  Relasi ke Indikator (IKSK) <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-1">
                  Pilih salah satu dari daftar 29 Indikator Kinerja Sasaran Kegiatan (IKSK)
                </p>
                <select
                  value={newRiskIkskId}
                  onChange={(e) => setNewRiskIkskId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                >
                  <option value="">-- Tanpa / Belum Ditautkan ke IKSK Tertentu --</option>
                  {iksks.map((iksk) => (
                    <option key={iksk.id} value={iksk.id}>
                      [{iksk.id}] {iksk.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Kode Risiko *</label>
                <input
                  type="text"
                  required
                  value={newRiskKode}
                  onChange={(e) => setNewRiskKode(e.target.value.toUpperCase())}
                  placeholder="Contoh: S-28, S-29, O-01"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono text-slate-800 focus:border-[#005baa] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Peristiwa Risiko *</label>
                <textarea
                  rows={3}
                  required
                  value={newRiskPeristiwa}
                  onChange={(e) => setNewRiskPeristiwa(e.target.value)}
                  placeholder="Uraian baku peristiwa risiko..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-[#005baa] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRiskModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRisk}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#005baa] px-4 py-1.5 font-semibold text-white shadow-xs hover:bg-[#004b8d] disabled:opacity-50"
                >
                  {savingRisk && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  )}
                  {savingRisk ? "Menyimpan..." : "Simpan Master Risiko"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
