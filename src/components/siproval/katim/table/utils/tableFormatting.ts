/**
 * Pure Utility Formatting Functions untuk Tabel RHPK SIPROVAL
 */

import type { NoteItem, RowData } from "../types/tableTypes";
import { MAX_EXCEL_SIZE_MB, STANDARD_MONTH_NAMES } from "../constants/tableConstants";

/**
 * Parsing teks catatan berstruktur multi-baris (Kendala / RTL) menjadi array NoteItem
 */
export function parseNotes(raw: unknown): NoteItem[] {
  const rawText = String(raw ?? "").trim();
  if (!rawText || rawText === "-" || rawText === "/") return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const result: NoteItem[] = [];

  lines.forEach((line, idx) => {
    // 1. Check (+ Name) or (Name) at end
    let match = line.match(
      /^(?:(\d+)[\.\)]\s*)?(.*?)(?:\s*\(\+?\s*([^\(\)]+)\))$/,
    );
    if (match && match[2]) {
      result.push({
        num: match[1] ? parseInt(match[1], 10) : idx + 1,
        text: match[2].trim(),
        author: match[3].trim().replace(/^\+\s*/, ""),
      });
      return;
    }
    // 2. Check + Name at end
    match = line.match(
      /^(?:(\d+)[\.\)]\s*)?(.*?)(?:\s*\+\s*([a-zA-Z\s\.,]+))$/,
    );
    if (match && match[2] && match[3]) {
      result.push({
        num: match[1] ? parseInt(match[1], 10) : idx + 1,
        text: match[2].trim(),
        author: match[3].trim().replace(/^\+\s*/, ""),
      });
      return;
    }
    // 3. Fallback without author
    match = line.match(/^(?:(\d+)[\.\)]\s*)?(.*)$/);
    result.push({
      num: match && match[1] ? parseInt(match[1], 10) : idx + 1,
      text: (match && match[2] ? match[2] : line).trim(),
      author: "",
    });
  });

  return result;
}

/**
 * Format array NoteItem menjadi teks berbaris dengan nomor urut dan atribusi nama Katim/PIC
 */
export function formatNotes(notes: NoteItem[]): string {
  return notes
    .filter((n) => n.text.trim())
    .map((n, idx) => {
      const cleanAuthor = (n.author || "").replace(/^\+\s*/, "").trim();
      const authorPart = cleanAuthor ? ` (+ ${cleanAuthor})` : "";
      return `${idx + 1}. ${n.text.trim()}${authorPart}`;
    })
    .join("\n");
}

/**
 * Kalkulasi array nomor halaman untuk komponen paginasi tabel (1, 2, 3... total)
 */
export function getPageNumbers(
  current: number,
  total: number,
): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

/**
 * Resolusi nama bulan dari data baris (cells, month_name, atau nomor month)
 */
export function resolveRowMonthName(
  r: RowData,
  monthColKey?: string | null,
): string {
  if (
    monthColKey &&
    r.cells?.[monthColKey] &&
    String(r.cells[monthColKey]).trim()
  ) {
    return String(r.cells[monthColKey]).trim();
  }
  if (r.month_name && typeof r.month_name === "string" && r.month_name.trim()) {
    return r.month_name.trim();
  }
  if (r.cells?.col_2 && typeof r.cells.col_2 === "string") {
    const val = r.cells.col_2.trim();
    if (
      /(januari|februari|pebruari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)/i.test(
        val,
      )
    ) {
      return val;
    }
  }
  if (r.cells?.col_0 && typeof r.cells.col_0 === "string") {
    const val = r.cells.col_0.trim();
    if (
      /(januari|februari|pebruari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)/i.test(
        val,
      )
    ) {
      return val;
    }
  }
  if (r.month && r.month >= 1 && r.month <= 12) {
    return STANDARD_MONTH_NAMES[r.month - 1];
  }
  return "";
}

/**
 * Terjemahkan error Axios API menjadi pesan yang ramah pengguna
 */
export function getApiErrorMessage(err: any, fallback: string): string {
  if (!err?.response) {
    if (err?.code === "ECONNABORTED") {
      return "Permintaan ke server melebihi batas waktu. Periksa koneksi lalu coba lagi.";
    }
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.";
  }
  const status = err.response.status;
  const data = err.response.data;
  if (data?.message && typeof data.message === "string") {
    // Pesan validasi Laravel (422) kadang menyertakan detail per-field
    if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
      const first = Object.values(data.errors).flat()[0];
      if (typeof first === "string") return first;
    }
    return data.message;
  }
  if (status === 401) return "Sesi Anda telah berakhir. Silakan login kembali.";
  if (status === 403) return "Anda tidak memiliki hak akses untuk melakukan aksi ini.";
  if (status === 404) return "Data tidak ditemukan. Muat ulang halaman lalu coba lagi.";
  if (status === 413) return `Ukuran file terlalu besar untuk diterima server (maks. ${MAX_EXCEL_SIZE_MB} MB).`;
  if (status >= 500) return `${fallback} (kesalahan server ${status}). Data di sistem tidak berubah.`;
  return fallback;
}

/**
 * Ekstrak nomor bulan (1..12) dari string teks nama bulan, serial Excel, atau format tanggal
 */
export function getMonthNumberFromText(text?: string | null): number | null {
  if (!text) return null;
  let t = String(text).trim().toLowerCase();
  if (!t) return null;
  t = t.replace(/^(s[\.\/]?d[\.\s]+|sampai\s+dengan\s+|periode\s*:?\s*)/i, "").trim();

  // 1. Check Excel serial date numbers (e.g. 44000 to 48000 is years 2020-2031)
  const numVal = Number(t);
  if (!isNaN(numVal) && numVal >= 44000 && numVal <= 48000) {
    try {
      const date = new Date((numVal - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.getUTCMonth() + 1;
      }
    } catch {}
  }

  // 2. Check ISO or standard date formats (YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY)
  const isoMatch = t.match(/\b\d{4}[-\/](\d{1,2})[-\/]\d{1,2}\b/);
  if (isoMatch) {
    const m = parseInt(isoMatch[1], 10);
    if (m >= 1 && m <= 12) return m;
  }
  const dmyMatch = t.match(/\b\d{1,2}[-\/](\d{1,2})[-\/]\d{4}\b/);
  if (dmyMatch) {
    const m = parseInt(dmyMatch[1], 10);
    if (m >= 1 && m <= 12) return m;
  }

  // 3. Check Indonesian / English month names in text (matching word boundaries)
  const monthMap: [RegExp, number][] = [
    [/\b(januari|january|jan)\b/i, 1],
    [/\b(februari|february|pebruari|feb)\b/i, 2],
    [/\b(maret|march|mar)\b/i, 3],
    [/\b(april|apr)\b/i, 4],
    [/\b(mei|may)\b/i, 5],
    [/\b(juni|june|jun)\b/i, 6],
    [/\b(juli|july|jul)\b/i, 7],
    [/\b(agustus|august|agust|agst|ags|agu)\b/i, 8],
    [/\b(september|sept|sep)\b/i, 9],
    [/\b(oktober|october|okt|oct)\b/i, 10],
    [/\b(november|nopember|nov)\b/i, 11],
    [/\b(desember|december|des|dec)\b/i, 12],
  ];

  for (const [regex, num] of monthMap) {
    if (regex.test(t)) {
      return num;
    }
  }

  const map: Record<string, number> = {
    januari: 1,
    jan: 1,
    january: 1,
    februari: 2,
    feb: 2,
    pebruari: 2,
    february: 2,
    maret: 3,
    mar: 3,
    march: 3,
    april: 4,
    apr: 4,
    mei: 5,
    may: 5,
    juni: 6,
    jun: 6,
    june: 6,
    juli: 7,
    jul: 7,
    july: 7,
    agustus: 8,
    agu: 8,
    ags: 8,
    agst: 8,
    agust: 8,
    august: 8,
    september: 9,
    sep: 9,
    sept: 9,
    oktober: 10,
    okt: 10,
    oct: 10,
    october: 10,
    november: 11,
    nov: 11,
    nopember: 11,
    desember: 12,
    des: 12,
    dec: 12,
    december: 12,
  };

  if (map[t]) return map[t];

  for (const [key, num] of Object.entries(map)) {
    if (
      t.startsWith(key + " ") ||
      t.startsWith(key + " -") ||
      t.startsWith(key + "-") ||
      t.startsWith(key + ":") ||
      t.startsWith(key + "/") ||
      t.startsWith(key + "(")
    ) {
      return num;
    }
  }

  for (const [key, num] of Object.entries(map)) {
    if (
      t.endsWith(" " + key) ||
      t.endsWith("-" + key) ||
      t.endsWith("/" + key)
    ) {
      return num;
    }
  }

  return null;
}

/**
 * Ekstrak nomor bulan (1..12) dari sebuah baris data secara eksplisit (tanpa forward-fill)
 */
export function getRowExplicitMonth(
  r?: RowData | null,
  monthColKey?: string | null,
): number | null {
  if (!r) return null;

  // 1. Cek dari kolom bulan jika header terdeteksi
  if (monthColKey && r.cells?.[monthColKey] !== undefined) {
    const n = getMonthNumberFromText(String(r.cells[monthColKey]));
    if (n !== null) return n;
  }

  // 2. Cek kolom col_0 (standar utama kolom Periode/Tanggal/Bulan di RHPK vertikal)
  if (r.cells?.col_0 !== undefined) {
    const val0 = String(r.cells.col_0).trim();
    if (val0) {
      const n = getMonthNumberFromText(val0);
      if (n !== null) return n;
    }
  }

  // 3. Cek month_name bawaan dari database/metadata
  if (r.month_name) {
    const n = getMonthNumberFromText(r.month_name);
    if (n !== null) return n;
  }

  // 4. Cek r.month jika bernilai 1..12
  if (typeof r.month === "number" && r.month >= 1 && r.month <= 12) {
    return r.month;
  }

  // 5. Cek kolom col_1, col_2, col_3 HANYA jika teks pendek (<= 30 karakter)
  // dan BUKAN teks sampel/produk (menghindari salah deteksi expired date 'ED 16 Januari' sebagai bulan baris)
  for (const k of ["col_1", "col_2", "col_3"]) {
    if (r.cells?.[k] !== undefined) {
      const val = String(r.cells[k]).trim();
      if (val && val.length <= 30) {
        if (!/\b(ed|exp|kadaluarsa|expired|sampel|klb|mbg)\b/i.test(val)) {
          const n = getMonthNumberFromText(val);
          if (n !== null) return n;
        }
      }
    }
  }

  return null;
}

/**
 * Format tampilan nilai sel (persentase, rasio, angka, atau '-')
 */
export const formatDisplayCellValue = (val: any, col?: any): string => {
  if (val === null || val === undefined || val === "") return "-";

  if (col) {
    // Kolom berformat persen di Excel menyimpan rasio (1 = 100%, 1.05 = 105%)
    if ((col as any).percent_scale === "ratio" && !isNaN(Number(val))) {
      const pct = Math.round(Number(val) * 100 * 100) / 100;
      return `${pct.toFixed(2)}%`;
    }
    const lbl = (col.label || "").toLowerCase();
    const sub = ((col as any).sub_label || "").toLowerCase();
    const numFormat = ((col as any).number_format || "").toLowerCase();

    // Kolom-kolom realisasi media cetak/online/penyiaran/luar ruang adalah persentase murni
    const isMediaRealisasi =
      lbl.includes("realisasi media") || sub.includes("realisasi media");

    const isWeightedScore =
      lbl.includes("(40%)") ||
      lbl.includes("(20%)") ||
      lbl.includes("(10%)") ||
      lbl.includes("(70%)") ||
      lbl.includes("pemenuhan target") ||
      lbl.includes("proporsi media") ||
      lbl.includes("waktu pelaporan");

    const isExplicitPercentage =
      !isWeightedScore &&
      (isMediaRealisasi ||
        numFormat.includes("%") ||
        Boolean((col as any).is_percentage));

    if (isExplicitPercentage && !isNaN(Number(val))) {
      const num = Number(val);
      // Jika nilai berupa rasio desimal 0 s.d. 1 (misal 1 -> 100.00%, 0.875 -> 87.50%, 0.9 -> 90.00%)
      if (num <= 1 && num > 0) {
        const pct = num * 100;
        const rounded = Math.round(pct * 100) / 100;
        return `${rounded.toFixed(2)}%`;
      }
      // Jika nilai sudah berupa persentase 0..100 (misal 100 -> 100.00%, 87.5 -> 87.50%)
      if (num > 1) {
        const rounded = Math.round(num * 100) / 100;
        return `${rounded.toFixed(2)}%`;
      }
      if (num === 0) {
        return "0.00%";
      }
    }
  }

  return String(val);
};
