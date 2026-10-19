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
};

type ApiResponse = {
  status?: string;
  success?: boolean;
  data?: {
    spreadsheet?: {
      name?: string;
    };
    years?: BudgetYear[] | number[];
  } | BudgetYear[] | number[];
  spreadsheet?: {
    name?: string;
  };
  years?: BudgetYear[] | number[];
  message?: string;
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
      if (typeof item === "number") return item;
      if (item && typeof item === "object" && "year" in item) {
        return Number((item as { year: unknown }).year);
      }
      return NaN;
    })
    .filter((year) => Number.isInteger(year) && year > 0)
    .map((year) => ({ year }));

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

  // Create Year Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState<number>(new Date().getFullYear() + 1);
  const [newNameInput, setNewNameInput] = useState<string>("");
  const [sourceYearInput, setSourceYearInput] = useState<number>(2026);
  const [spreadsheetUrlInput, setSpreadsheetUrlInput] = useState<string>("");
  const [createLoading, setCreateLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const SERVICE_ACCOUNT_EMAIL = "siproval-sheets@siproval.iam.gserviceaccount.com";
  const TEMPLATE_COPY_URL = "https://docs.google.com/spreadsheets/d/12JWKA8gxzJLwZC8JWh42L-AJAE-LQaPTU_GFRTMPC1Y/copy";

  async function fetchYearsList() {
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
      await fetchYearsList();

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
      fetchYearsList();
    }
  }, [user?.id]);

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

      {/* Header section with Action Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Daftar Tahun Mapping Anggaran
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilih tahun yang ingin kamu kelola untuk melihat tab dan rincian bulanan.
          </p>
        </div>

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
          Buat Tahun Baru
        </button>
      </div>

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
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#005baa] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004b8d]"
          >
            Muat Ulang
          </button>
        </div>
      ) : years.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Belum ada tahun mapping anggaran yang terdaftar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {years.map(({ year }) => (
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
                <p className="mt-1 text-xs text-slate-500">
                  Klik untuk membuka rincian tab spreadsheet
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-[#005baa]">
                <span>Buka Rincian</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  className="h-4 w-4 transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Dialog Buat Tahun Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
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
    </div>
  );
}
