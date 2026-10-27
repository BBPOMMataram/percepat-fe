"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

type BudgetYear = {
  year: number;
  spreadsheet_id?: number;
  spreadsheet_name?: string;
  google_sheet_id?: string;
};

function normalizeYears(rawInput: unknown): BudgetYear[] {
  let list: unknown[] = [];

  if (Array.isArray(rawInput)) {
    list = rawInput;
  } else if (rawInput && typeof rawInput === "object") {
    const obj = rawInput as Record<string, unknown>;
    if (Array.isArray(obj.years)) {
      list = obj.years;
    } else if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>;
      if (Array.isArray(dataObj.years)) {
        list = dataObj.years;
      } else if (Array.isArray(obj.data)) {
        list = obj.data;
      }
    }
  }

  const normalized = list
    .map((item) => {
      if (typeof item === "number") return { year: item };
      if (item && typeof item === "object" && "year" in item) {
        return {
          year: Number((item as { year: unknown }).year),
          spreadsheet_id: (item as { spreadsheet_id?: number }).spreadsheet_id,
          spreadsheet_name: (item as { spreadsheet_name?: string }).spreadsheet_name,
          google_sheet_id: (item as { google_sheet_id?: string }).google_sheet_id,
        };
      }
      return null;
    })
    .filter((item): item is BudgetYear => item !== null && Number.isInteger(item.year) && item.year > 0);

  const unique = Array.from(
    new Map(normalized.map((item) => [item.year, item])).values(),
  ).sort((a, b) => b.year - a.year);

  return unique;
}

export default function BudgetMapping() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [years, setYears] = useState<BudgetYear[]>([]);
  const [spreadsheetName, setSpreadsheetName] = useState<string>("Spreadsheet Terintegrasi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Year Modal State (Template Kosong)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState<number>(new Date().getFullYear() + 1);
  const [newNameInput, setNewNameInput] = useState<string>("");
  const [sourceYearInput, setSourceYearInput] = useState<number>(2026);
  const [spreadsheetUrlInput, setSpreadsheetUrlInput] = useState<string>("");
  const [createLoading, setCreateLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Add/Upload Existing Spreadsheet Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState<{
    message: string;
    sheetId: string;
    tabsCount: number;
    tabs: string[];
  } | null>(null);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const serviceAccountEmail = "siproval-sheets@siproval.iam.gserviceaccount.com";
  const SERVICE_ACCOUNT_EMAIL = serviceAccountEmail;

  async function fetchYears() {
    try {
      setLoading(true);
      setError("");

      const query = user?.id ? `?user_id=${user.id}` : "";
      const response = await api.get(`${baseUrl}/api/budget-mapping/years${query}`);

      const raw = response.data;
      const normalized = normalizeYears(raw);
      setYears(normalized);
      setError("");

      const sName = raw?.spreadsheet?.name || raw?.data?.spreadsheet?.name;
      if (sName) {
        setSpreadsheetName(sName);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Gagal memuat daftar tahun mapping anggaran.");
    } finally {
      setLoading(false);
    }
  }

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput || newYearInput < 2020 || newYearInput > 2099) {
      setModalError("Masukkan tahun anggaran yang valid (contoh: 2027).");
      return;
    }

    // Tidak memerlukan URL Google Sheets lagi (mandiri lokal)

    setCreateLoading(true);
    setModalError("");
    setModalSuccess("");

    try {
      const payload: Record<string, unknown> = {
        user_id: user?.id,
        year: newYearInput,
        name: newNameInput.trim() || `Mapping Anggaran ${newYearInput}`,
        source_year: sourceYearInput,
      };
      if (spreadsheetUrlInput.trim()) {
        payload.spreadsheet_url = spreadsheetUrlInput.trim();
      }

      await api.post(`${baseUrl}/api/budget-mapping/years`, payload);

      setModalSuccess(`Tahun anggaran ${newYearInput} berhasil dibuat dengan data pagu kosong!`);
      await fetchYears();

      setTimeout(() => {
        setShowCreateModal(false);
        setModalSuccess("");
        setSpreadsheetUrlInput("");
      }, 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e.response?.data?.message || "Gagal membuat tahun anggaran baru.");
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchYears();
    }
  }, [user?.id]);

  function handleCopyEmail() {
    navigator.clipboard.writeText(serviceAccountEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }

  async function handleStoreSpreadsheet(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(null);

    if (!selectedFile && !spreadsheetUrl.trim()) {
      setSubmitError("Silakan pilih file spreadsheet (.xlsx / .xls).");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("year", String(selectedYear));
      if (docName.trim()) {
        formData.append("name", docName.trim());
      }
      if (spreadsheetUrl.trim()) {
        formData.append("spreadsheet_url", spreadsheetUrl.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await api.post(
        `${baseUrl}/api/budget-mapping/store-spreadsheet`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const resData = response.data;
      setSubmitSuccess({
        message: resData.message || "Spreadsheet berhasil disimpan dan disinkronisasi.",
        sheetId: resData.data?.sheet_id || "",
        tabsCount: resData.data?.tabs_synced_count || 0,
        tabs: resData.data?.tabs || [],
      });

      // Reset form fields
      setSpreadsheetUrl("");
      setDocName("");
      setSelectedFile(null);

      // Refresh years list
      await fetchYears();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSubmitError(
        e.response?.data?.message || "Gagal menambahkan spreadsheet. Periksa format URL atau file."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Tahun
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : years.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:calendar-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mapping Anggaran
              </p>
              <p className="mt-2 text-base font-bold text-slate-900">Per Tahun</p>
              <p className="mt-1 text-xs text-slate-500">
                Data alokasi anggaran dan serapan
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon icon="solar:table-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sumber Data
              </p>
              <p className="mt-2 text-base font-bold text-slate-900">Database Lokal Mandiri</p>
              <p className="mt-1 text-xs text-slate-500 truncate max-w-44" title={spreadsheetName}>
                {spreadsheetName}
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
            Daftar Tahun Mapping Anggaran
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilih tahun yang ingin kamu kelola untuk melihat tab dan rincian bulanan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const nextYear = years.length > 0 ? Math.max(...years.map((y) => y.year)) + 1 : 2027;
              setNewYearInput(nextYear);
              setNewNameInput(`Mapping Anggaran ${nextYear}`);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004b8d]"
          >
            <Icon icon="solar:calendar-add-bold" width={20} />
            <span>Buat Tahun Baru</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddModal(true);
              setSubmitError("");
              setSubmitSuccess(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon icon="solar:cloud-upload-bold" width={20} className="text-[#005baa]" />
            <span>Tambah File Excel</span>
          </button>
        </div>
      </div>

      {/* Success Banner if recently submitted */}
      {submitSuccess && !showAddModal && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Icon icon="solar:check-circle-bold" className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900">{submitSuccess.message}</p>
              <p className="mt-1 text-xs text-emerald-700">
                Potongan Sheet ID: <code className="font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded text-emerald-950 font-bold">{submitSuccess.sheetId}</code>
              </p>
              {submitSuccess.tabs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {submitSuccess.tabs.map((tab, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-emerald-200/70 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSubmitSuccess(null)}
              className="text-emerald-500 hover:text-emerald-800"
              aria-label="Tutup"
            >
              <Icon icon="solar:close-circle-bold" width={18} />
            </button>
          </div>
        </div>
      )}

      {/* List / Grid of Years */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : error && years.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-10 text-center shadow-sm">
          <h3 className="font-semibold text-red-700">
            Gagal memuat data mapping anggaran
          </h3>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => fetchYears()}
            className="mt-4 rounded-lg bg-[#005baa] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004b8d]"
          >
            Muat Ulang
          </button>
        </div>
      ) : years.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Belum ada tahun mapping anggaran yang terdaftar.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004b8d]"
            >
              <Icon icon="solar:calendar-add-bold" width={18} />
              <span>Buat Tahun Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Icon icon="solar:cloud-upload-bold" width={18} />
              <span>Tambah File Spreadsheet</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {years.map(({ year, spreadsheet_name, google_sheet_id }) => (
            <Link
              key={year}
              href={`/siproval/budget-mapping/year?year=${year}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-blue-50 px-3 py-1 text-sm font-bold text-[#005baa]">
                  {year}
                </span>
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Tahun Anggaran
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#005baa]">
                  Budget Mapping {year}
                </h3>
                <p className="mt-1 text-xs text-slate-500 truncate" title={spreadsheet_name || "Maping Anggaran"}>
                  {spreadsheet_name || "Klik untuk membuka rincian tab spreadsheet"}
                </p>
                {google_sheet_id && (
                  <p className="mt-1 text-[10px] text-slate-400 font-mono truncate" title={google_sheet_id}>
                    ID: {google_sheet_id}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-[#005baa]">
                <span>Buka Rincian Tab</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  className="h-4 w-4 transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Dialog 1: Buat Tahun Baru (Template Kosong) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                  <Icon icon="solar:calendar-add-bold" width={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Buat Tahun Anggaran Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Spreadsheet baru berdampingan dengan tahun sebelumnya
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!createLoading) {
                    setShowCreateModal(false);
                    setModalError("");
                    setModalSuccess("");
                  }
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="mt-5 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <Icon icon="solar:danger-triangle-bold" width={16} className="shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  <Icon icon="solar:check-circle-bold" width={16} className="shrink-0 text-emerald-600" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Info Banner Lokal Mandiri */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-slate-700">
                <p className="font-bold text-[#005baa]">Pembuatan Tahun Anggaran Mandiri (Tanpa Google API)</p>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  Tahun baru akan otomatis terdaftar di database lokal SIPROVAL. Anda dapat menyalin struktur kegiatan dari tahun sebelumnya atau mengunggah file template Excel baru (.xlsx).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tahun Anggaran Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2099"
                  required
                  value={newYearInput}
                  onChange={(e) => {
                    const yr = parseInt(e.target.value) || 2027;
                    setNewYearInput(yr);
                    setNewNameInput(`Mapping Anggaran ${yr}`);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                  placeholder="Contoh: 2027"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama / Label Mapping <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                  placeholder="Contoh: Mapping Anggaran 2027"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Salin Susunan Kegiatan Dari Tahun
                </label>
                <select
                  value={sourceYearInput}
                  onChange={(e) => setSourceYearInput(parseInt(e.target.value) || 2026)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y.year} value={y.year}>
                      Tahun {y.year} (Acuan)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Format header dan nama kegiatan akan disalin, namun seluruh nilai pagu dan realisasinya dikosongkan.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={createLoading}
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#004b8d] transition disabled:opacity-50"
                >
                  {createLoading ? (
                    <>
                      <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
                      Membuat Tahun Baru...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-bold" width={16} />
                      Simpan & Buat Tahun Baru
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog 2: Tambah File Spreadsheet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Unggah Dokumen Budget Mapping (Excel / CSV)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mendukung file Excel (.xlsx, .xls) atau CSV. Sistem otomatis memetakan seluruh tab alokasi ke database mandiri SIPROVAL.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStoreSpreadsheet} className="mt-5 space-y-4">
              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                  <Icon icon="solar:danger-circle-bold" className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{submitSuccess.message}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-emerald-700">Status: Tersimpan di Database Mandiri ({submitSuccess.tabsCount} tab)</p>
                  </div>
                </div>
              )}

              {/* Tahun Anggaran & Nama Dokumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Anggaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2099}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#005baa] focus:outline-none"
                    placeholder="Contoh: 2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Dokumen (Opsional)
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#005baa] focus:outline-none"
                    placeholder={`Mapping Anggaran ${selectedYear}`}
                  />
                </div>
              </div>

              {/* Upload Dropzone Sesuai Gambar Referensi */}
              <div>
                <div
                  onClick={() => document.getElementById("bm-file-input")?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#005baa]/60 hover:bg-slate-50/50 p-6 text-center cursor-pointer transition"
                >
                  <input
                    id="bm-file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
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
                    {selectedFile ? selectedFile.name : "Pilih atau seret file ke area ini"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedFile
                      ? `Ukuran: ${(selectedFile.size / 1024).toFixed(1)} KB`
                      : "Format didukung: .xlsx, .xls, .csv (Maksimal 25 MB)"}
                  </p>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  File yang diunggah akan langsung dipetakan ke tabel di bawah ini.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedFile}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#004b8d] disabled:opacity-50"
                  >
                    {submitting ? "Mengunggah & Menyimpan..." : "Proses & Simpan File"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
