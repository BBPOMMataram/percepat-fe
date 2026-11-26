import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_ALL,
  PAGINATION_MIN_ROWS,
} from "../constants/tableConstants";

export interface PaginationOptions {
  /** Batas minimal baris agar pagination aktif (bawaan: PAGINATION_MIN_ROWS). */
  minRows?: number;
  /** Paksa pagination nonaktif, mis. untuk tabel bulan horizontal. */
  disabled?: boolean;
}

export interface PaginationResult {
  /** Pagination ditampilkan atau tidak. */
  isEnabled: boolean;
  /** Jumlah baris per halaman yang berlaku (sama dengan total baris bila semua ditampilkan). */
  pageSize: number;
  totalPages: number;
  /** Halaman aktif yang sudah dibatasi ke rentang 1..totalPages. */
  currentPage: number;
  /** Indeks baris pertama di halaman aktif (inklusif). */
  startIndex: number;
  /** Indeks setelah baris terakhir di halaman aktif (eksklusif). */
  endIndex: number;
  /** Nomor baris pertama yang ditampilkan (1-based, 0 bila tabel kosong). */
  rangeStart: number;
  /** Nomor baris terakhir yang ditampilkan. */
  rangeEnd: number;
}

export const isPaginationEnabled = (
  totalRows: number,
  { minRows = PAGINATION_MIN_ROWS, disabled = false }: PaginationOptions = {},
): boolean => !disabled && totalRows >= minRows;

/**
 * Hitung status pagination secara murni (tanpa state React) agar bisa dipakai ulang
 * oleh tabel Ketua Tim maupun PIC.
 */
export const computePagination = (
  totalRows: number,
  requestedPageSize: number = DEFAULT_PAGE_SIZE,
  requestedPage: number = 1,
  options: PaginationOptions = {},
): PaginationResult => {
  const total = Math.max(0, Math.floor(totalRows || 0));
  const isEnabled = isPaginationEnabled(total, options);
  const showAll =
    !isEnabled ||
    requestedPageSize === PAGE_SIZE_ALL ||
    !Number.isFinite(requestedPageSize) ||
    requestedPageSize < 0;
  const pageSize = showAll ? total : Math.floor(requestedPageSize);
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const currentPage = Math.min(
    Math.max(Math.floor(requestedPage) || 1, 1),
    totalPages,
  );
  const startIndex = showAll ? 0 : (currentPage - 1) * pageSize;
  const endIndex = showAll ? total : Math.min(startIndex + pageSize, total);

  return {
    isEnabled,
    pageSize,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    rangeStart: total === 0 ? 0 : startIndex + 1,
    rangeEnd: endIndex,
  };
};

/** Ambil baris untuk halaman aktif sesuai hasil computePagination. */
export const paginateRows = <T>(rows: T[], pagination: PaginationResult): T[] =>
  pagination.startIndex === 0 && pagination.endIndex >= rows.length
    ? rows
    : rows.slice(pagination.startIndex, pagination.endIndex);
