"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type {
  AuthUser,
  MaintenanceRecord,
  PhotoGalleryPreview,
} from "../types";
import { formatDateDisplay, getActivityBadge } from "../helpers";

const MONTH_OPTIONS = [
  { value: "all", label: "Semua Bulan" },
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const ACTIVITY_TYPE_OPTIONS: {
  value: "all" | MaintenanceRecord["activityType"];
  label: string;
}[] = [
  { value: "all", label: "Semua Jenis Kegiatan" },
  { value: "warming_up", label: "Pemanasan Rutin" },
  { value: "module_check", label: "Pengecekan Modul" },
  { value: "routine_service", label: "Servis Berkala" },
  { value: "fuel_refill", label: "Pengisian Solar / BBM" },
  { value: "emergency_run", label: "Darurat (PLN Padam)" },
  { value: "load_test", label: "Uji Beban (Load Test)" },
  { value: "repair", label: "Perbaikan / Troubleshoot" },
  { value: "other", label: "Pemeliharaan Lainnya" },
];

interface MaintenanceLogTableProps {
  assetName: string;
  records: MaintenanceRecord[];
  filteredRecords: MaintenanceRecord[];
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  selectedMonth: string;
  onChangeMonth: (m: string) => void;
  selectedYear: string;
  onChangeYear: (y: string) => void;
  availableYears: string[];
  selectedActivityType: string;
  onChangeActivityType: (t: string) => void;
  onResetFilters: () => void;
  currentUser: AuthUser | null;
  picSignatureUrl?: string | null;
  resolveExecutorSignature: (item: MaintenanceRecord) => string | null;
  canDeleteRecord: (item: MaintenanceRecord) => boolean;
  verifyingLogId: number | null;
  deletingLogId: number | null;
  onVerifyLog: (id: number) => void;
  onDeleteLog: (id: number) => void;
  onPreviewPhoto: (photo: PhotoGalleryPreview) => void;
}

export default function MaintenanceLogTable({
  assetName,
  records,
  filteredRecords,
  searchQuery,
  onChangeSearch,
  selectedMonth,
  onChangeMonth,
  selectedYear,
  onChangeYear,
  availableYears,
  selectedActivityType,
  onChangeActivityType,
  onResetFilters,
  currentUser,
  picSignatureUrl,
  resolveExecutorSignature,
  canDeleteRecord,
  verifyingLogId,
  deletingLogId,
  onVerifyLog,
  onDeleteLog,
  onPreviewPhoto,
}: MaintenanceLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset ke halaman 1 setiap kali filter atau aset berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedMonth,
    selectedYear,
    selectedActivityType,
    assetName,
    rowsPerPage,
  ]);

  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    selectedMonth !== "all" ||
    selectedYear !== "all" ||
    selectedActivityType !== "all";

  return (
    <>
      {/* Toolbar Kontrol: Pencarian + Filter Kombinasi (Bulan, Tahun, Jenis Kegiatan) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
          {/* Pencarian Teks */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Icon
              icon="solar:magnifer-linear"
              width={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari uraian kegiatan, petugas, atau catatan..."
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:bg-white focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-bold" width={14} />
              </button>
            )}
          </div>

          {/* Filter Bulan */}
          <div className="lg:col-span-2">
            <select
              value={selectedMonth}
              onChange={(e) => onChangeMonth(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 focus:border-[#005baa] focus:bg-white focus:outline-none transition"
              title="Filter berdasarkan Bulan"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div className="lg:col-span-2">
            <select
              value={selectedYear}
              onChange={(e) => onChangeYear(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 focus:border-[#005baa] focus:bg-white focus:outline-none transition"
              title="Filter berdasarkan Tahun"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Kegiatan */}
          <div className="lg:col-span-3">
            <select
              value={selectedActivityType}
              onChange={(e) => onChangeActivityType(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 focus:border-[#005baa] focus:bg-white focus:outline-none transition"
              title="Filter berdasarkan Jenis Kegiatan"
            >
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Reset / Info Total */}
          <div className="lg:col-span-1 flex items-center justify-end">
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="h-9 w-full inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition"
                title="Reset semua filter"
              >
                <Icon icon="solar:restart-bold" width={13} />
                <span>Reset</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                Total: <strong className="text-slate-700">{totalItems}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Lembar Kendali Pemeliharaan (Responsif Mobile) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        {/* Petunjuk Geser Horizontal Khusus Mobile */}
        <div className="md:hidden flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/70 border-b border-blue-100 text-[11px] text-blue-800 font-medium">
          <span className="flex items-center gap-1.5">
            <Icon
              icon="solar:round-arrow-right-bold"
              width={14}
              className="text-[#005baa] animate-pulse shrink-0"
            />
            <span>
              Geser tabel ke samping untuk melihat foto, status & aksi &rarr;
            </span>
          </span>
          <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded-md font-mono text-slate-600 border border-blue-200 shrink-0">
            {totalItems} Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-3 py-3 w-12 text-center">NO</th>
                <th className="px-3.5 py-3 w-28 text-center whitespace-nowrap">
                  TANGGAL
                </th>
                <th className="px-4 py-3 min-w-[230px]">AKTIFITAS & WAKTU</th>
                <th className="px-4 py-3 w-44 text-center">
                  PELAKSANA (NAMA & TTD)
                </th>
                <th className="px-4 py-3 min-w-[170px]">KETERANGAN</th>
                <th className="px-3 py-3 w-28 text-center whitespace-nowrap">
                  FOTO SEBELUM
                </th>
                <th className="px-3 py-3 w-28 text-center whitespace-nowrap">
                  FOTO SESUDAH
                </th>
                <th className="px-3.5 py-3 w-36 text-center">STATUS</th>
                <th className="px-3.5 py-3 w-32 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Icon
                        icon="solar:clipboard-list-linear"
                        width={32}
                        className="text-slate-300"
                      />
                      <span className="font-semibold text-xs">
                        Tidak ada catatan pemeliharaan yang sesuai filter.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item, idx) => {
                  const rowNo = startIndex + idx + 1;
                  const typeBadge = getActivityBadge(item.activityType);
                  const isEmergency = item.activityType === "emergency_run";
                  const execSigUrl = resolveExecutorSignature(item);
                  const verifSigUrl =
                    item.verifierSignatureUrl || picSignatureUrl || null;
                  const allowDelete = canDeleteRecord(item);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isEmergency ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* 1. NO */}
                      <td className="px-3 py-3 text-center text-slate-400 font-medium">
                        {rowNo}
                      </td>

                      {/* 2. TANGGAL */}
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block font-mono">
                          {formatDateDisplay(item.date)}
                        </span>
                      </td>

                      {/* 3. AKTIFITAS & WAKTU */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${typeBadge.color}`}
                            >
                              {typeBadge.label}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 font-medium">
                              {item.startTime} - {item.endTime} (
                              {item.durationMinutes} menit)
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 leading-snug">
                            {item.activityDetails || typeBadge.label}
                          </p>
                        </div>
                      </td>

                      {/* 4. PELAKSANA (NAMA & TTD DARI AUTH) */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-900 block">
                            {item.executorName}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.executorRole || "Petugas"}
                          </span>
                          {execSigUrl ? (
                            <div className="mt-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 shadow-2xs">
                              <img
                                src={execSigUrl}
                                alt={`TTD ${item.executorName}`}
                                className="h-8 max-w-[95px] object-contain mx-auto"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          ) : (
                            <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200">
                              <Icon icon="solar:check-circle-bold" width={10} />
                              Terverifikasi SSO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. KETERANGAN */}
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {item.notes ? (
                          <p className="line-clamp-2 leading-relaxed">
                            {item.notes}
                          </p>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>

                      {/* 6. FOTO SEBELUM */}
                      <td className="px-3 py-3 text-center">
                        {item.initialPhotos && item.initialPhotos.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewPhoto({
                                urls: item.initialPhotos,
                                initialIndex: 0,
                                caption: `Foto Sebelum: ${typeBadge.label} (${formatDateDisplay(
                                  item.date
                                )})`,
                              })
                            }
                            className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-[#005baa]/40 transition group"
                            title={`Lihat ${item.initialPhotos.length} foto bukti sebelum`}
                          >
                            <img
                              src={item.initialPhotos[0]}
                              alt="Foto Sebelum"
                              className="h-full w-full object-cover"
                            />
                            {item.initialPhotos.length > 1 && (
                              <span className="absolute bottom-0 right-0 rounded-tl-md bg-[#005baa]/90 px-1 py-0.2 text-[9px] font-bold text-white">
                                +{item.initialPhotos.length - 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic">
                            -
                          </span>
                        )}
                      </td>

                      {/* 7. FOTO SESUDAH */}
                      <td className="px-3 py-3 text-center">
                        {item.finalPhotos && item.finalPhotos.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewPhoto({
                                urls: item.finalPhotos,
                                initialIndex: 0,
                                caption: `Foto Sesudah: ${typeBadge.label} (${formatDateDisplay(
                                  item.date
                                )})`,
                              })
                            }
                            className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-emerald-600/40 transition group"
                            title={`Lihat ${item.finalPhotos.length} foto bukti sesudah`}
                          >
                            <img
                              src={item.finalPhotos[0]}
                              alt="Foto Sesudah"
                              className="h-full w-full object-cover"
                            />
                            {item.finalPhotos.length > 1 && (
                              <span className="absolute bottom-0 right-0 rounded-tl-md bg-emerald-600/90 px-1 py-0.2 text-[9px] font-bold text-white">
                                +{item.finalPhotos.length - 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic">
                            -
                          </span>
                        )}
                      </td>

                      {/* 8. STATUS */}
                      <td className="px-3.5 py-3 text-center">
                        {item.isVerified ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
                              <Icon
                                icon="solar:check-circle-bold"
                                width={13}
                                className="text-emerald-600"
                              />
                              <span>Disetujui PIC</span>
                            </span>
                            {verifSigUrl && (
                              <img
                                src={verifSigUrl}
                                alt="TTD PIC"
                                className="h-7 max-w-[80px] object-contain mx-auto mt-1"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                            {item.verifiedAt && (
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                {item.verifiedAt}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            <Icon
                              icon="solar:clock-circle-bold"
                              width={12}
                              className="text-amber-500"
                            />
                            <span>Menunggu PIC</span>
                          </span>
                        )}
                      </td>

                      {/* 9. AKSI (Setujui untuk PIC | Hapus untuk Petugas sebelum disetujui) */}
                      <td className="px-3.5 py-3 text-center">
                        {currentUser?.isPic ? (
                          !item.isVerified ? (
                            <button
                              type="button"
                              disabled={verifyingLogId === item.id}
                              onClick={() => onVerifyLog(item.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                              title="Klik untuk menyetujui & verifikasi catatan ini"
                            >
                              <Icon
                                icon={
                                  verifyingLogId === item.id
                                    ? "solar:refresh-circle-bold"
                                    : "solar:check-circle-bold"
                                }
                                width={14}
                                className={
                                  verifyingLogId === item.id
                                    ? "animate-spin"
                                    : ""
                                }
                              />
                              <span>
                                {verifyingLogId === item.id
                                  ? "Proses..."
                                  : "Setujui"}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              Terverifikasi
                            </span>
                          )
                        ) : !item.isVerified && allowDelete ? (
                          <button
                            type="button"
                            disabled={deletingLogId === item.id}
                            onClick={() => onDeleteLog(item.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 active:scale-95 transition disabled:opacity-50"
                            title="Hapus catatan ini (hanya bisa dihapus sebelum disetujui PIC)"
                          >
                            <Icon
                              icon="solar:trash-bin-trash-bold"
                              width={13}
                            />
                            <span>
                              {deletingLogId === item.id
                                ? "Menghapus..."
                                : "Hapus"}
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">
                            {item.isVerified ? "Terkunci" : "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Table + Pagination */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-3.5 py-3 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Menampilkan{" "}
              <strong>
                {totalItems === 0 ? 0 : startIndex + 1} -{" "}
                {Math.min(startIndex + rowsPerPage, totalItems)}
              </strong>{" "}
              dari <strong>{totalItems}</strong> catatan (Total keseluruhan:{" "}
              <strong>{records.length}</strong>)
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Baris:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-[#005baa] focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Kontrol Halaman (Pagination) */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <Icon icon="solar:alt-arrow-left-linear" width={13} />
                <span>Prev</span>
              </button>

              <span className="px-2.5 text-[11px] font-semibold text-slate-700">
                Hal {safePage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <span>Next</span>
                <Icon icon="solar:alt-arrow-right-linear" width={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
