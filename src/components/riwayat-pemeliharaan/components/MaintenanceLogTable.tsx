"use client";

import { Icon } from "@iconify/react";
import type { AuthUser, MaintenanceRecord } from "../types";
import { formatDateDisplay, getActivityBadge } from "../helpers";

interface MaintenanceLogTableProps {
  assetName: string;
  records: MaintenanceRecord[];
  filteredRecords: MaintenanceRecord[];
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  currentUser: AuthUser | null;
  verifyingLogId: number | null;
  onVerifyLog: (id: number) => void;
  onPreviewPhoto: (photo: { url: string; caption: string }) => void;
  onRedirectLogin: () => void;
  onShowToast: (msg: string) => void;
}

export default function MaintenanceLogTable({
  assetName,
  records,
  filteredRecords,
  searchQuery,
  onChangeSearch,
  currentUser,
  verifyingLogId,
  onVerifyLog,
  onPreviewPhoto,
  onRedirectLogin,
  onShowToast,
}: MaintenanceLogTableProps) {
  return (
    <>
      {/* Toolbar Kontrol: Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Icon
              icon="solar:magnifer-linear"
              width={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari kegiatan, teknisi, catatan..."
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-[#005baa] shadow-2xs"
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
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto font-medium">
          <span className="text-[11px] text-slate-400">
            Total: <strong>{filteredRecords.length}</strong> catatan
          </span>
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
              Geser ke samping untuk melihat pelaksana, foto & paraf PIC &rarr;
            </span>
          </span>
          <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded-md font-mono text-slate-600 border border-blue-200 shrink-0">
            {filteredRecords.length} Data
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
                <th className="px-4 py-3 min-w-[260px]">AKTIFITAS & WAKTU</th>
                <th className="px-4 py-3 w-40 text-center">
                  PELAKSANA (NAMA & TTD)
                </th>
                <th className="px-4 py-3 min-w-[180px]">KETERANGAN</th>
                <th className="px-3 py-3 w-24 text-center">FOTO BUKTI</th>
                <th className="px-3.5 py-3 w-36 text-center">AKSI PIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Icon
                        icon="solar:clipboard-list-linear"
                        width={32}
                        className="text-slate-300"
                      />
                      <span className="font-semibold text-xs">
                        Tidak ada data yang sesuai filter pencarian.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const typeBadge = getActivityBadge(item.activityType);
                  const isEmergency = item.activityType === "emergency_run";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isEmergency ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block font-mono">
                          {formatDateDisplay(item.date)}
                        </span>
                      </td>
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
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block text-center">
                          <span className="font-bold text-slate-900 block">
                            {item.executorName}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.executorRole || "Teknisi"}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200">
                            <Icon icon="solar:check-circle-bold" width={10} />
                            TTD Valid (SSO)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {item.notes ? (
                          <p className="line-clamp-2 leading-relaxed">
                            {item.notes}
                          </p>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.initialPhotoUrl || item.finalPhotoUrl ? (
                          <div className="flex items-center justify-center gap-1">
                            {item.initialPhotoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  onPreviewPhoto({
                                    url: item.initialPhotoUrl!,
                                    caption: `Foto Awal: ${typeBadge.label} (${formatDateDisplay(
                                      item.date
                                    )})`,
                                  })
                                }
                                className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:opacity-80 transition"
                                title="Lihat foto awal panel"
                              >
                                <img
                                  src={item.initialPhotoUrl}
                                  alt="Awal"
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            )}
                            {item.finalPhotoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  onPreviewPhoto({
                                    url: item.finalPhotoUrl!,
                                    caption: `Foto Akhir: ${typeBadge.label} (${formatDateDisplay(
                                      item.date
                                    )})`,
                                  })
                                }
                                className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:opacity-80 transition"
                                title="Lihat foto akhir panel"
                              >
                                <img
                                  src={item.finalPhotoUrl}
                                  alt="Akhir"
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        {item.isVerified ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
                              <Icon
                                icon="solar:check-circle-bold"
                                width={14}
                                className="text-emerald-600"
                              />
                              <span>Disetujui PIC</span>
                            </span>
                            {item.verifiedAt && (
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                {item.verifiedAt}
                              </span>
                            )}
                          </div>
                        ) : currentUser?.isPic ? (
                          <button
                            type="button"
                            disabled={verifyingLogId === item.id}
                            onClick={() => onVerifyLog(item.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                            title="Klik untuk menyetujui & verifikasi data ini sebagai PIC"
                          >
                            <Icon
                              icon={
                                verifyingLogId === item.id
                                  ? "solar:refresh-circle-bold"
                                  : "solar:check-circle-bold"
                              }
                              width={15}
                              className={
                                verifyingLogId === item.id ? "animate-spin" : ""
                              }
                            />
                            <span>
                              {verifyingLogId === item.id
                                ? "Memproses..."
                                : "Centang Setujui"}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser) {
                                onRedirectLogin();
                                return;
                              } else {
                                onShowToast(
                                  "⚠️ Akun saat ini bukan PIC. Hanya PIC yang berwenang menekan persetujuan."
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-700 hover:bg-white transition"
                            title="Menunggu verifikasi PIC. Klik untuk login sebagai PIC."
                          >
                            <Icon
                              icon="solar:clock-circle-bold"
                              width={13}
                              className="text-amber-500"
                            />
                            <span>Menunggu PIC</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Table */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <span>
            Menampilkan <strong>{filteredRecords.length}</strong> dari{" "}
            <strong>{records.length}</strong> catatan pemeliharaan {assetName}.
          </span>
        </div>
      </div>
    </>
  );
}

