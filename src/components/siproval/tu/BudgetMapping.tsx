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

    if (!spreadsheetUrlInput.trim()) {
      setModalError("Silakan masukkan Link atau ID Google Sheet baru yang sudah dibagikan ke service account.");
      return;
    }

    setCreateLoading(true);
    setModalError("");
    setModalSuccess("");

    try {
      const payload: Record<string, unknown> = {
        user_id: user?.id,
        year: newYearInput,
        name: newNameInput.trim() || `Mapping Anggaran ${newYearInput}`,
        source_year: sourceYearInput,
        spreadsheet_url: spreadsheetUrlInput.trim(),
      };

      await api.post(`${baseUrl}/api/budget-mapping/years`, payload);

      setModalSuccess(`Tahun anggaran ${newYearInput} beserta dokumen spreadsheet baru berhasil dibuat dengan data pagu kosong!`);
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

    if (uploadMode === "link" && !spreadsheetUrl.trim()) {
      setSubmitError("Silakan masukkan URL atau ID Google Spreadsheet.");
      return;
    }

    if (uploadMode === "file" && !selectedFile && !spreadsheetUrl.trim()) {
      setSubmitError("Silakan pilih file spreadsheet atau masukkan URL spreadsheet.");
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
              <p className="mt-2 text-base font-bold text-slate-900">Google Sheets</p>
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
            <span>Tambah File Spreadsheet</span>
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

              {/* Info Banner */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#005baa]">
                  <Icon icon="solar:info-circle-bold" width={18} className="shrink-0" />
                  <span>Petunjuk Pembuatan Spreadsheet Tahun Baru:</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-600">
                  Anda cukup membuat <strong>Google Spreadsheet Baru</strong> (bisa di dalam folder Drive mana pun yang Anda inginkan, atau buka <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-[#005baa] underline font-semibold">sheets.new</a>), lalu beri akses <strong>Editor</strong> ke email akun Siproval. Sistem akan <strong>otomatis menyalin format 28 IKSK lengkap dan mengosongkan seluruh nilai pagu & realisasinya</strong>.
                </p>
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#005baa] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#004b8d] transition"
                  >
                    <Icon icon="solar:file-smile-bold" width={14} />
                    1. Buat Spreadsheet Baru (sheets.new)
                    <Icon icon="solar:arrow-right-up-linear" width={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-50 transition"
                  >
                    <Icon icon={copiedEmail ? "solar:check-circle-bold" : "solar:clipboard-bold"} width={14} />
                    {copiedEmail ? "Email Berhasil Disalin!" : "2. Salin Email Service Account"}
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-500 italic">
                  *Catatan Folder: Jika menggunakan link salin Google Drive, Google otomatis menempatkan file di &quot;Drive Saya&quot;. Anda dapat memindahkannya (Move) ke folder tujuan di Google Drive kapan saja.
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Link / ID Google Sheet Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={spreadsheetUrlInput}
                  onChange={(e) => setSpreadsheetUrlInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Pastikan spreadsheet telah dibagikan dengan hak akses <strong>Editor</strong> ke: <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-700 select-all">{SERVICE_ACCOUNT_EMAIL}</code>
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

      {/* Modal Dialog 2: Tambah File Spreadsheet (Unggah File / Link Google Drive) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                  <Icon icon="solar:document-add-bold" width={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Tambah Spreadsheet Budget Mapping
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi otomatisasi potongan Sheet ID & sinkronisasi tab
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-bold" width={22} />
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
                    <p className="mt-0.5 font-mono text-[11px]">Sheet ID: {submitSuccess.sheetId}</p>
                  </div>
                </div>
              )}

              {/* Input Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Metode Penambahan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode("link")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold border transition ${
                      uploadMode === "link"
                        ? "border-[#005baa] bg-blue-50 text-[#005baa]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon icon="solar:link-circle-bold" width={18} />
                    <span>Tautan Google Drive / Sheets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold border transition ${
                      uploadMode === "file"
                        ? "border-[#005baa] bg-blue-50 text-[#005baa]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon icon="solar:file-smile-bold" width={18} />
                    <span>Unggah File Spreadsheet</span>
                  </button>
                </div>
              </div>

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

              {/* Mode 1: Tautan / ID Google Sheets */}
              {uploadMode === "link" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tautan (URL) atau Potongan Sheet ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={spreadsheetUrl}
                      onChange={(e) => setSpreadsheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/12JWKA8gxzJLwZC8JWh42L-AJAE.../edit"
                      required={uploadMode === "link"}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                    <Icon
                      icon="solar:link-bold"
                      className="absolute left-3 top-2.5 text-slate-400"
                      width={16}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Sistem akan otomatis mengekstrak potongan Sheet ID di antara <code>/d/</code> dan <code>/edit</code> untuk disimpan ke tabel <code>google_spreadsheets</code>.
                  </p>
                </div>
              )}

              {/* Mode 2: Unggah File Spreadsheet */}
              {uploadMode === "file" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih File (.xlsx, .xls, .csv)
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#005baa] hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tautan Google Drive / Sheet ID (Opsional jika file sudah di Google Drive)
                    </label>
                    <input
                      type="text"
                      value={spreadsheetUrl}
                      onChange={(e) => setSpreadsheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Instruksi Share Service Account */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Icon icon="solar:info-circle-bold" className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs text-amber-900 leading-relaxed">
                    <p className="font-semibold">Penting: Izin Akses Google Drive</p>
                    <p className="mt-0.5 text-amber-800">
                      Pastikan file spreadsheet di Google Drive sudah dibagikan (Share) dengan hak akses <strong>Editor</strong> atau <strong>Viewer</strong> ke email service account sistem:
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="rounded bg-white/80 px-2 py-1 font-mono text-[11px] font-bold text-amber-950 border border-amber-200">
                        {serviceAccountEmail}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
                      >
                        {copiedEmail ? "Disalin!" : "Salin Email"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Menyimpan & Sinkronisasi Tab...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:disk-bold" width={16} />
                      <span>Simpan & Sinkronisasi Tab</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
