/**
 * Konstanta dan Konfigurasi Tabel RHPK SIPROVAL
 */

export const DEFAULT_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

export const MAX_EXCEL_SIZE_MB = 20;

/** Pilihan jumlah baris per halaman pada tabel RHPK. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const;

/** Nilai pilihan "Semua": seluruh baris ditampilkan tanpa dibagi halaman. */
export const PAGE_SIZE_ALL = 0;

/** Jumlah baris per halaman saat tabel pertama kali dibuka. */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Batas minimal baris agar pagination ditampilkan. Tabel di bawah batas ini (mis. tab bulanan
 * berisi 12 baris) langsung ditampilkan utuh tanpa kontrol halaman.
 */
export const PAGINATION_MIN_ROWS = 20;

/** Minimal jumlah bulan berbeda pada header kolom agar tabel dianggap berstruktur bulan horizontal. */
export const MIN_MONTH_COLUMN_GROUPS = 3;

/** Minimal jumlah baris agar penanda bulan pada baris dipakai untuk menyimpulkan tabel vertikal. */
export const MIN_ROWS_FOR_VERTICAL_MONTH = 6;

/** Label kolom bulan mandiri (tabel vertikal: satu baris per bulan). */
export const STANDALONE_MONTH_COLUMN_LABELS = [
  "bulan",
  "periode",
  "bulan pelaksanaan",
] as const;

export const STANDARD_MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const NUMERIC_HEADER_RE =
  /(jumlah|target|persentase|%|realisasi|skor|nilai|rasio|bobot|anggaran|total|\ba[1-9]\b|\bb[1-9]?\b|\bc[1-9]?\b)/i;

export const NARRATIVE_HEADER_RE =
  /(catatan|keterangan|deskripsi|uraian|rekomendasi)/i;

export type MonthColorConfig = {
  header: string;
  sub: string;
  dot: string;
};

export const DEFAULT_MONTH_COLOR: MonthColorConfig = {
  header: "bg-slate-100 text-slate-800 border-r border-slate-300",
  sub: "bg-slate-50 text-slate-700",
  dot: "bg-slate-500",
};

export const MONTH_COLOR_MAP: Record<string, MonthColorConfig> = {
  JANUARI: {
    header: "bg-[#fce8e6] text-[#991b1b] border-r border-rose-300",
    sub: "bg-[#fff5f5] text-slate-700",
    dot: "bg-[#e11d48]",
  },
  FEBRUARI: {
    header: "bg-[#f3e8fd] text-[#581c87] border-r border-purple-300",
    sub: "bg-[#faf5ff] text-slate-700",
    dot: "bg-[#9333ea]",
  },
  MARET: {
    header: "bg-[#fef7e0] text-[#78350f] border-r border-amber-300",
    sub: "bg-[#fffbeb] text-slate-700",
    dot: "bg-[#d97706]",
  },
  APRIL: {
    header: "bg-[#e6f4ea] text-[#064e3b] border-r border-emerald-300",
    sub: "bg-[#f0fdf4] text-slate-700",
    dot: "bg-[#059669]",
  },
  MEI: {
    header: "bg-[#e8f0fe] text-[#1e3a8a] border-r border-blue-300",
    sub: "bg-[#eff6ff] text-slate-700",
    dot: "bg-[#2563eb]",
  },
  JUNI: {
    header: "bg-[#ede9fe] text-[#3730a3] border-r border-indigo-300",
    sub: "bg-[#f5f3ff] text-slate-700",
    dot: "bg-[#4f46e5]",
  },
  JULI: {
    header: "bg-[#ffedd5] text-[#9a3412] border-r border-orange-300",
    sub: "bg-[#fff7ed] text-slate-700",
    dot: "bg-[#ea580c]",
  },
  AGUSTUS: {
    header: "bg-[#ccfbf1] text-[#115e59] border-r border-teal-300",
    sub: "bg-[#f0fdfa] text-slate-700",
    dot: "bg-[#0d9488]",
  },
  SEPTEMBER: {
    header: "bg-[#fef9c3] text-[#854d0e] border-r border-yellow-300",
    sub: "bg-[#fefce8] text-slate-700",
    dot: "bg-[#ca8a04]",
  },
  OKTOBER: {
    header: "bg-[#cffafe] text-[#155e75] border-r border-cyan-300",
    sub: "bg-[#ecfeff] text-slate-700",
    dot: "bg-[#0891b2]",
  },
  NOVEMBER: {
    header: "bg-[#e0f2fe] text-[#075985] border-r border-sky-300",
    sub: "bg-[#f0f9ff] text-slate-700",
    dot: "bg-[#0284c7]",
  },
  DESEMBER: {
    header: "bg-[#ffe4e6] text-[#9f1239] border-r border-rose-300",
    sub: "bg-[#fff1f2] text-slate-700",
    dot: "bg-[#e11d48]",
  },
};

export function getMonthColor(monthName?: string | null): MonthColorConfig {
  if (!monthName) return DEFAULT_MONTH_COLOR;
  let m = monthName.toUpperCase().trim();
  m = m.replace(/^S[\.\/]?D[\.\s]+/i, "").trim();
  if (m === "PEBRUARI") m = "FEBRUARI";
  if (m === "NOPEMBER") m = "NOVEMBER";
  return MONTH_COLOR_MAP[m] || DEFAULT_MONTH_COLOR;
}
