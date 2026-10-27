"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

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

type RoYearItem = {
  id?: number;
  year: number;
  spreadsheet_name?: string;
  original_filename?: string;
  file_size_formatted?: string;
  uploaded_at_formatted?: string;
  is_locked?: boolean;
};

type FileInfo = {
  is_locked: boolean;
  original_filename?: string;
  file_path?: string;
  uploaded_at?: string;
  uploaded_at_formatted?: string;
  file_size_formatted?: string;
  status_label?: string;
};

export default function RealisasiRoTable() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  const yearParam = searchParams.get("year");

  const [activeYear, setActiveYear] = useState<number>(
    yearParam ? Number(yearParam) : 2026
  );
  const [showYearList, setShowYearList] = useState<boolean>(!yearParam);

  const [roYears, setRoYears] = useState<RoYearItem[]>([
    {
      year: 2026,
      spreadsheet_name: "REKAP DATA RHPK 2026 Mataram (Tab Realisasi RO)",
      original_filename: "REKAP_DATA_RHPK_2026_Mataram_Realisasi_RO.xlsx",
      uploaded_at_formatted: "26 Oktober 2026, 15:30 WITA",
      is_locked: false,
    },
  ]);

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);

  // Modal Buat Tahun Baru
  const [showCreateYearModal, setShowCreateYearModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState<number>(2027);
  const [newYearName, setNewYearName] = useState("");
  const [creatingYear, setCreatingYear] = useState(false);

  // Modal Upload File Excel
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadYear, setUploadYear] = useState<number>(2026);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("JANUARI");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthHeaders, setMonthHeaders] = useState<MonthColumnHeader[]>([]);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "tercapai" | "belum" | "edited"
  >("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState("");

  const fetchRoYears = async () => {
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.get(`${baseUrl}/api/tu/realisasi-ro-years${query}`);
      const list = res.data?.data?.years || res.data?.years || [];
      if (Array.isArray(list) && list.length > 0) {
        setRoYears(list);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchRoYears();
  }, [user?.id]);

  const handleCreateYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput || newYearInput < 2020 || newYearInput > 2099) {
      setErrorMsg("Masukkan tahun anggaran yang valid.");
      return;
    }
    setCreatingYear(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.post(`${baseUrl}/api/tu/realisasi-ro-years${query}`, {
        year: newYearInput,
        name: newYearName || `Realisasi RO ${newYearInput}`,
      });
      setSuccessMsg(res.data?.message || "Tahun anggaran Realisasi RO berhasil ditambahkan.");
      setShowCreateYearModal(false);
      await fetchRoYears();
      setActiveYear(newYearInput);
      setShowYearList(false);
      router.push(`/siproval/tu/realisasi-ro?year=${newYearInput}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal menambahkan tahun anggaran baru.");
    } finally {
      setCreatingYear(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg("Silakan pilih file Excel (.xlsx / .xls) terlebih dahulu.");
      return;
    }
    setUploadingFile(true);
    setErrorMsg("");
    setSuccessMsg("");
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("year", String(uploadYear));
    if (uploadDocName) formData.append("name", uploadDocName);
    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.post(`${baseUrl}/api/tu/realisasi-ro-upload${query}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMsg(res.data?.message || "File Excel Realisasi RO berhasil diunggah.");
      setShowUploadModal(false);
      setUploadFile(null);
      await fetchRoYears();
      setActiveYear(uploadYear);
      setShowYearList(false);
      router.push(`/siproval/tu/realisasi-ro?year=${uploadYear}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Gagal mengunggah file Excel.");
    } finally {
      setUploadingFile(false);
    }
  };
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    "https://docs.google.com/spreadsheets/d/1KXN2ukZTcDUZ-9kfc3BbM-qi3VumvcHUSELK91nGqnU/edit#gid=17060817",
  );

  const fetchData = async (month: string, targetYear: number = activeYear) => {
    setLoading(true);
    setApiNotice("");
    try {
      const query = user?.id
        ? `?month=${month}&user_id=${user.id}`
        : `?month=${month}`;
      const res = await api.get(`${baseUrl}/api/tu/realisasi-ro/${targetYear}${query}`);

      if (res.data && res.data.data) {
        const d = res.data.data;
        setMonthHeaders(d.month_columns_header || d.columns || []);
        setRows(d.rows || []);
        if (d.file_info) {
          setFileInfo(d.file_info);
        }
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
        e.response?.data?.message ||
          "Gagal memuat data Realisasi RO dari server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showYearList) {
      fetchData(selectedMonth, activeYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, activeYear, showYearList, user?.id]);

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
          Object.values(r.month_columns || (r as any).month_data || {}).some((c: any) => c?.cell === cell),
      );

      const isTargetTahunan = matchedRow?.target_tahunan.cell === cell;

      return {
        cell,
        value,
        previous_value: isTargetTahunan
          ? matchedRow?.target_tahunan.value
          : undefined,
        kode_ro: matchedRow?.kode_ro,
      };
    });

    try {
      const res = await api.post(`${baseUrl}/api/tu/realisasi-ro/update`, {
        year: activeYear,
        month: selectedMonth,
        user_id: user?.id,
        user_name: user?.name,
        user_email: user?.email,
        updates: updateList,
      });

      const message =
        res.data?.message ||
        `${updateList.length} sel Realisasi RO berhasil disimpan ke database mandiri!`;
      setSuccessMsg(message);

      // Refresh data agar audit log tersinkronisasi
      await fetchData(selectedMonth, activeYear);
      setEditedCells({});
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal menyimpan perubahan ke database.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Batalkan seluruh perubahan lokal
  const handleReset = () => {
    if (
      confirm(
        "Apakah Anda yakin ingin membatalkan semua perubahan yang belum disimpan?",
      )
    ) {
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
        const matchKendala = (getCellValue(r.month_columns?.kendala || (r as any).month_data?.kendala) || "")
          .toLowerCase()
          .includes(q);
        const matchRtl = (getCellValue(r.month_columns?.rtl || (r as any).month_data?.rtl) || "")
          .toLowerCase()
          .includes(q);
        if (!matchKode && !matchNama && !matchKendala && !matchRtl) {
          return false;
        }
      }

      if (filterStatus === "tercapai") return r.status === "tercapai";
      if (filterStatus === "belum") return r.status === "belum";
      if (filterStatus === "edited") {
        const hasEditedTarget = isCellEdited(r.target_tahunan?.cell);
        const hasEditedMonth = Object.values(r.month_columns || (r as any).month_data || {}).some((c: any) =>
          isCellEdited(c?.cell),
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

  const renderUploadModal = () => {
    if (!showUploadModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Unggah File Excel Realisasi RO
            </h3>
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Anggaran *
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2099}
                  value={uploadYear}
                  onChange={(e) => setUploadYear(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-[#005baa] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Dokumen (Opsional)
                </label>
                <input
                  type="text"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  placeholder={`Realisasi RO ${uploadYear}`}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none"
                />
              </div>
            </div>

            {/* Dropzone Area Sesuai Format Referensi Gambar */}
            <div
              onClick={() => document.getElementById("ro-file-input")?.click()}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setUploadFile(e.dataTransfer.files[0]);
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                isDragging ? "border-[#005baa] bg-blue-50/50" : "border-slate-200 hover:border-[#005baa]/60 hover:bg-slate-50/50"
              }`}
            >
              <input
                id="ro-file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* 3 Glyph Badges */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l3 3m0-3l-3 3m5-3h4m-4 3h4"></path>
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"></polyline>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 11h6"></path>
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#005baa] shadow-2xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-800">
                {uploadFile ? uploadFile.name : "Pilih atau seret file ke area ini"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Format didukung: <strong>.xlsx, .xls</strong> (Maksimal 25 MB)
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                File yang diunggah akan langsung dipetakan ke tabel di bawah ini.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile || !uploadFile}
                  className="rounded-xl bg-[#005baa] px-5 py-2 text-xs font-bold text-white hover:bg-[#004b8d] disabled:opacity-50"
                >
                  {uploadingFile ? "Mengunggah..." : "Proses & Simpan File"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (showYearList) {
    return (
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/siproval/tu" className="hover:text-[#005baa]">
            Tata Usaha
          </Link>
          <Icon icon="solar:alt-arrow-right-linear" width={14} className="text-slate-400" />
          <span className="font-bold text-slate-800">Realisasi RO</span>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900 font-bold">
              &times;
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-red-700 hover:text-red-900 font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Overview Cards (Sama persis seperti Budget Mapping) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Tahun
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {roYears.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                <Icon icon="solar:calendar-bold" width={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Realisasi RO
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">Per Tahun</p>
                <p className="mt-1 text-xs text-slate-500">
                  Data capaian output dan target tahunan
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon icon="solar:chart-square-bold" width={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sumber Data
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">Spreadsheet / Excel</p>
                <p className="mt-1 text-xs text-slate-500 truncate max-w-44">
                  Dokumen Realisasi RO
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Icon icon="solar:database-bold" width={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Header section with Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Daftar Tahun Realisasi RO
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih tahun yang ingin kamu kelola untuk melihat rincian capaian output dan target bulanan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const nextYear = roYears.length > 0 ? Math.max(...roYears.map((y) => y.year)) + 1 : 2027;
                setNewYearInput(nextYear);
                setNewYearName(`Realisasi RO ${nextYear}`);
                setShowCreateYearModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#004b8d]"
            >
              <Icon icon="solar:calendar-add-bold" width={18} />
              <span>Buat Tahun Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowUploadModal(true);
                setUploadYear(activeYear);
                setUploadFile(null);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <Icon icon="solar:cloud-upload-bold" width={18} className="text-[#005baa]" />
              <span>Tambah File Excel RO</span>
            </button>
          </div>
        </div>

        {/* Grid of Year Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roYears.map((item) => (
            <div
              key={item.year}
              onClick={() => {
                setActiveYear(item.year);
                setShowYearList(false);
                fetchData(selectedMonth, item.year);
                router.push(`/siproval/tu/realisasi-ro?year=${item.year}`);
              }}
              className="group block cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-blue-50 px-3 py-1 text-sm font-bold text-[#005baa]">
                  {item.year}
                </span>
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Tahun Anggaran
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#005baa]">
                    Realisasi RO {item.year}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <Icon icon="solar:lock-bold" width={11} />
                    File Fix
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {item.spreadsheet_name || "Pemantauan Rincian Output & Target"}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <Icon icon="solar:calendar-date-bold" width={14} className="text-[#005baa]" />
                  <span>Diunggah: {item.uploaded_at_formatted || "26 Oktober 2026, 15:30 WITA"}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-[#005baa]">
                <span>Buka Rincian RO &rarr;</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadYear(item.year);
                      setUploadDocName(`Realisasi RO ${item.year}`);
                      setUploadFile(null);
                      setShowUploadModal(true);
                    }}
                    title={`Unggah / Perbarui file Excel Realisasi RO ${item.year}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                  >
                    <Icon icon="solar:upload-track-2-bold" width={13} className="text-[#00a651]" />
                    <span>Perbarui Excel</span>
                  </button>
                  <Icon icon="solar:arrow-right-linear" width={16} className="transition group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal 1: Buat Tahun Baru */}
        {showCreateYearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Buat Tahun Baru Realisasi RO
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateYearModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateYearSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Anggaran *
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2099}
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama / Deskripsi Dokumen
                  </label>
                  <input
                    type="text"
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                    placeholder={`Realisasi RO ${newYearInput}`}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateYearModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={creatingYear}
                    className="rounded-xl bg-[#005baa] px-5 py-2 text-xs font-bold text-white hover:bg-[#004b8d] disabled:opacity-50"
                  >
                    {creatingYear ? "Menyimpan..." : "Simpan Tahun"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Upload File Excel RO */}
        {renderUploadModal()}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header Ringkas */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <Link
              href="/siproval/tu"
              className="hover:text-[#005baa] transition"
            >
              Tata Usaha
            </Link>
            <Icon
              icon="solar:alt-arrow-right-linear"
              width={14}
              className="text-slate-400"
            />
            <span className="font-semibold text-slate-800">Realisasi RO</span>
            <Icon
              icon="solar:alt-arrow-right-linear"
              width={14}
              className="text-slate-400"
            />
            <span className="font-bold text-[#005baa]">Tahun {activeYear}</span>
          </nav>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowYearList(true);
                router.push("/siproval/tu/realisasi-ro");
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              <Icon icon="solar:arrow-left-linear" width={14} />
              <span>Daftar Tahun</span>
            </button>
            <h1 className="text-xl font-bold text-slate-900">
              Realisasi Rincian Output (RO) {activeYear}
            </h1>
            <select
              value={activeYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setActiveYear(y);
                fetchData(selectedMonth, y);
                router.push(`/siproval/tu/realisasi-ro?year=${y}`);
              }}
              className="rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-xs font-bold text-[#005baa] focus:outline-none"
            >
              {roYears.map((ry) => (
                <option key={ry.year} value={ry.year}>
                  Tahun {ry.year}
                </option>
              ))}
            </select>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
              <Icon icon="solar:pen-new-square-bold" width={13} className="text-[#00a651]" />
              Mode Edit Terbuka
            </span>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Simpan Perubahan (Saat ada perubahan sel) */}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              title="Simpan perubahan tabel ke database"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00a651] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#008f45] transition shadow-2xs"
            >
              {saving ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
              ) : (
                <Icon icon="solar:diskette-bold" width={16} />
              )}
              Simpan Perubahan ({pendingCount})
            </button>
          )}

          {/* Tombol Eksport Laporan Berita Acara */}
          <Link
            href={`/siproval/tu/laporan-evaluasi?month=${encodeURIComponent(selectedMonth || "APRIL")}`}
            title="Eksport Laporan Berita Acara Evaluasi Internal"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#004b8d] transition shadow-2xs"
          >
            <Icon icon="solar:printer-bold" width={16} />
            Eksport Laporan
          </Link>

          {/* Tombol Tambah File Excel RO */}
          <button
            type="button"
            onClick={() => {
              setUploadYear(activeYear);
              setShowUploadModal(true);
            }}
            title="Unggah file Excel Realisasi RO (.xlsx / .xls)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
          >
            <Icon
              icon="solar:upload-track-2-bold"
              width={16}
              className="text-[#00a651]"
            />
            Tambah File Excel RO
          </button>

          {/* Tombol Refresh Data */}
          <button
            type="button"
            onClick={() => fetchData(selectedMonth)}
            disabled={loading}
            title="Segarkan data Realisasi RO"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#005baa] hover:bg-blue-100 transition shadow-2xs disabled:opacity-60"
          >
            <Icon
              icon="solar:refresh-linear"
              width={16}
              className={
                loading ? "animate-spin text-[#005baa]" : "text-[#005baa]"
              }
            />
            <span>{loading ? "Memuat..." : "Refresh Data"}</span>
          </button>
        </div>
      </div>

      {/* Banner Info Berkas RO & Tanggal Diunggah ke Sistem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-slate-50 to-emerald-50/70 p-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005baa] text-white shadow-xs">
            <Icon icon="solar:document-bold" width={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {fileInfo?.original_filename || `Realisasi_RO_${activeYear}_Final.xlsx`}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold border border-emerald-300">
                <Icon icon="solar:pen-new-square-bold" width={12} />
                Mode Edit Terbuka
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Data Realisasi RO terbuka untuk diperbarui oleh seluruh anggota tim Tata Usaha (TU). Ubah nilai pada tabel lalu klik Simpan Perubahan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <div className="rounded-xl border border-blue-200 bg-white px-3.5 py-2 shadow-2xs text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tanggal Diunggah ke Sistem
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#005baa] mt-0.5">
              <Icon icon="solar:calendar-date-bold" width={15} />
              <span>{fileInfo?.uploaded_at_formatted || "26 Oktober 2026, 15:30 WITA"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini KPI Ringkas */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-blue-200/70 bg-blue-50/40 px-3.5 py-2 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#005baa]">
              Total RO
            </p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">
              {totalRO}
            </p>
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
            <p className="text-xl font-extrabold text-[#00a651] leading-tight">
              {tercapaiCount}
            </p>
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
            <p className="text-xl font-extrabold text-amber-600 leading-tight">
              {belumTercapaiCount}
            </p>
          </div>
          <div className="rounded-lg bg-amber-100/70 p-1.5 text-amber-600">
            <Icon icon="solar:clock-circle-bold" width={20} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Status Mode
            </p>
            <p className="text-sm font-extrabold text-emerald-800 leading-tight mt-0.5 flex items-center gap-1">
              <Icon icon="solar:pen-bold" width={14} className="text-[#00a651]" />
              Terbuka (Dapat Diedit)
            </p>
          </div>
          <div className="rounded-lg bg-emerald-100/70 p-1.5 text-[#00a651]">
            <Icon icon="solar:pen-new-square-bold" width={20} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {apiNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Icon
            icon="solar:info-circle-bold"
            width={18}
            className="shrink-0 text-amber-600"
          />
          <span>{apiNotice}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:check-circle-bold"
              width={18}
              className="shrink-0 text-[#00a651]"
            />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600"
          >
            <Icon icon="solar:close-circle-bold" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:danger-triangle-bold"
              width={18}
              className="shrink-0 text-rose-600"
            />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="text-rose-600"
          >
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
              <Icon
                icon="solar:calendar-bold"
                className="text-[#005baa]"
                width={18}
              />
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
            <Icon
              icon="solar:restart-bold"
              className="animate-spin text-[#005baa]"
              width={34}
            />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              Memuat data Realisasi RO dari database mandiri...
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-16 text-center">
            <Icon
              icon="solar:document-medicine-bold"
              className="mx-auto text-slate-300"
              width={32}
            />
            <h3 className="mt-2 text-xs font-bold text-slate-700">
              Tidak ada data indikator RO
            </h3>
            <p className="text-[11px] text-slate-400">
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}".`
                : "Belum ada baris data di tab ini."}
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
                        <div
                          className={`flex items-center ${isCap || isReal || isTgt ? "justify-center" : "justify-between"}`}
                        >
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
                      <td className="sticky left-[410px] z-20 bg-white group-hover:bg-[#f8fafc] p-2 border-r-2 border-slate-300 shadow-[4px_0_12px_rgba(0,0,0,0.12)] align-middle text-center w-[140px] min-w-[140px] max-w-[140px]">
                        <input
                          type="text"
                          value={tgtTahunanVal}
                          onChange={(e) =>
                            handleCellChange(tgtTahunanCellCoord, e.target.value)
                          }
                          className={`w-full rounded-lg border text-center font-mono text-xs font-extrabold px-2 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-[#005baa] ${
                            isTgtTahunanEdited
                              ? "bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400"
                              : isTargetChanged
                                ? "bg-blue-50/60 border-blue-200 text-blue-900 font-bold"
                                : "bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300"
                          }`}
                          title={`Edit Target Tahunan (${tgtTahunanCellCoord})`}
                        />
                      </td>

                      {/* 4. Kolom-kolom Dinamis Bulan (Scrollable - Mode Edit Aktif) */}
                      {monthHeaders.map((col) => {
                        const monthCols = row.month_columns || (row as any).month_data || {};
                        const cellData = monthCols[col.key];
                        const cellCoord = cellData?.cell || `${col.col_letter}${row.row_number}`;
                        const cellVal = getCellValue(cellData);
                        const isEdited = isCellEdited(cellCoord);
                        const isFormula =
                          cellData?.is_formula || col.key === "capaian";

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

                        // JIKA KOLOM RUMUS (CAPAIAN %) -> BADGE (Hitung Real-Time jika ada edit)
                        if (isFormula) {
                          const tgtNum = parseFloat(tgtTahunanVal) || 0;
                          const realNum = parseFloat(getCellValue(monthCols["realisasi"])) || 0;
                          let displayCap = cellVal;
                          let dynTercapai = isTercapai;
                          if (tgtNum > 0) {
                            const pct = ((realNum / tgtNum) * 100).toFixed(2);
                            displayCap = pct;
                            dynTercapai = parseFloat(pct) >= 100;
                          }

                          return (
                            <td
                              key={col.col_index}
                              className="px-3 py-2 border-r border-slate-200 align-middle text-center bg-white group-hover:bg-[#f8fafc]"
                            >
                              <div className="flex items-center justify-center py-1">
                                <span
                                  className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                                    dynTercapai
                                      ? "bg-emerald-100 text-[#00a651]"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                  title={`Formula Capaian (${cellCoord}) = (Realisasi / Target Tahunan) * 100%`}
                                >
                                  {displayCap ? `${displayCap}%` : "0%"}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // JIKA KOLOM NUMERIK (TARGET / REALISASI) -> INPUT EDITABLE
                        if (isNumericCol) {
                          return (
                            <td
                              key={col.col_index}
                              className="p-2 border-r border-slate-200 align-middle text-center bg-white group-hover:bg-[#f8fafc]"
                            >
                              <input
                                type="text"
                                value={cellVal}
                                onChange={(e) =>
                                  handleCellChange(cellCoord, e.target.value)
                                }
                                className={`w-full rounded-lg border text-center font-mono text-xs font-bold px-2 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-[#005baa] ${
                                  isEdited
                                    ? "bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400"
                                    : "bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300"
                                }`}
                                title={`Edit ${col.label} (${cellCoord})`}
                              />
                            </td>
                          );
                        }

                        // JIKA KOLOM TEKS PANJANG (KENDALA, REKOMENDASI, RTL, UPAYA, ARAHAN) -> TEXTAREA EDITABLE
                        if (isLongText) {
                          return (
                            <td
                              key={col.col_index}
                              className="p-2 border-r border-slate-200 align-top bg-white group-hover:bg-[#f8fafc]"
                            >
                              <textarea
                                rows={2}
                                value={cellVal === "-" ? "" : cellVal}
                                onChange={(e) =>
                                  handleCellChange(cellCoord, e.target.value)
                                }
                                placeholder="Isi catatan..."
                                className={`w-full rounded-lg border text-xs px-2.5 py-1.5 leading-relaxed transition resize-y focus:outline-none focus:ring-2 focus:ring-[#005baa] ${
                                  isEdited
                                    ? "bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                }`}
                                title={`Edit ${col.label} (${cellCoord})`}
                              />
                            </td>
                          );
                        }

                        // KOLOM UMUM -> INPUT EDITABLE
                        return (
                          <td
                            key={col.col_index}
                            className="p-2 border-r border-slate-200 align-middle bg-white group-hover:bg-[#f8fafc]"
                          >
                            <input
                              type="text"
                              value={cellVal === "-" ? "" : cellVal}
                              onChange={(e) =>
                                handleCellChange(cellCoord, e.target.value)
                              }
                              className={`w-full rounded-lg border text-xs px-2 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-[#005baa] ${
                                isEdited
                                  ? "bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                              title={`Edit ${col.label} (${cellCoord})`}
                            />
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
          <span>
            Menampilkan {filteredRows.length} dari {totalRO} Rincian Output
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Tercapai (&ge; 100%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Belum (&lt; 100%)
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
              <Icon icon="solar:pen-new-square-bold" width={13} className="text-[#00a651]" />
              Mode Edit Terbuka (Semua Anggota TU)
            </span>
          </div>
        </div>
      </div>

      {/* Floating Save Notification Bar */}
      {pendingCount > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-slate-900/95 text-white px-5 py-3.5 shadow-2xl backdrop-blur-md border border-slate-700 max-w-xl w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 shrink-0">
                <Icon icon="solar:pen-new-square-bold" width={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {pendingCount} Perubahan Sel Belum Disimpan
                </p>
                <p className="text-[11px] text-slate-300">
                  Data dapat diubah oleh seluruh anggota TU. Klik simpan untuk menerapkan ke sistem.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="rounded-xl border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00a651] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#008f45] shadow-md transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-bold" width={16} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload File Excel RO */}
      {renderUploadModal()}
    </div>
  );
}
