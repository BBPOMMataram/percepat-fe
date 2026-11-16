"use client";

import { Icon } from "@iconify/react";
import type { AuthUser, MaintenanceRecord } from "../types";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetName: string;
  currentUser: AuthUser | null;
  checkInTimeCaptured: {
    dateStr: string;
    timeStr: string;
    displayStr: string;
    timestamp: number;
  };
  checkInActivityType: MaintenanceRecord["activityType"];
  onChangeActivityType: (t: MaintenanceRecord["activityType"]) => void;
  checkInCustomType: string;
  onChangeCustomType: (v: string) => void;
  checkInDetails: string;
  onChangeDetails: (v: string) => void;
  checkInPhotos: string[];
  onAddPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CheckInModal({
  isOpen,
  onClose,
  assetName,
  currentUser,
  checkInTimeCaptured,
  checkInActivityType,
  onChangeActivityType,
  checkInCustomType,
  onChangeCustomType,
  checkInDetails,
  onChangeDetails,
  checkInPhotos,
  onAddPhotos,
  onRemovePhoto,
  isSubmitting,
  onSubmit,
}: CheckInModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 no-print print:hidden">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#005baa] uppercase tracking-wider">
              Langkah 1: Check-in (Mulai Kegiatan)
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              Mulai Pemeliharaan {assetName || "Aset BMN"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon icon="solar:close-circle-bold" width={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs"
        >
          {/* Info Waktu Mulai Otomatis */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#005baa] text-white shrink-0">
              <Icon icon="solar:clock-circle-bold" width={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                WAKTU MULAI (TERCATAT OTOMATIS)
              </span>
              <span className="text-xs font-bold text-slate-900 block font-mono">
                {checkInTimeCaptured.displayStr}
              </span>
              <span className="text-[10px] text-slate-500">
                *Dicatat saat tombol mulai dibuka. Waktu selesai akan otomatis dicatat saat Anda melakukan check-out nanti.
              </span>
            </div>
          </div>

          {/* Info Petugas */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Petugas Pelaksana (Terverifikasi Resmi)
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  icon="solar:user-check-rounded-bold"
                  width={16}
                  className="text-[#005baa] shrink-0"
                />
                <span className="font-bold text-slate-900 truncate">
                  {currentUser?.name} ({currentUser?.role})
                </span>
              </div>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                Terdaftar di PIC
              </span>
            </div>
          </div>

          {/* Pilihan Jenis Kegiatan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Jenis Kegiatan <span className="text-rose-500">*</span>
            </label>
            <select
              value={checkInActivityType}
              onChange={(e) =>
                onChangeActivityType(
                  e.target.value as MaintenanceRecord["activityType"]
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
            >
              <option value="warming_up">
                🟡 Pemanasan Rutin (Warming-up / Pemeriksaan Rutin)
              </option>
              <option value="module_check">
                🔷 Pengecekan Modul (Panel Kontrol / Modul Instrumen)
              </option>
              <option value="routine_service">
                🟢 Pemeliharaan / Servis Berkala (Oli, Filter, Aki, Air)
              </option>
              <option value="fuel_refill">
                🟣 Pengisian Bahan Bakar (BBM Solar)
              </option>
              <option value="emergency_run">
                🔵 Pengoperasian Darurat (Mati Lampu PLN)
              </option>
              <option value="load_test">🔵 Uji Beban Listrik (Load Test)</option>
              <option value="repair">🔴 Perbaikan / Troubleshooting</option>
              <option value="other">⚪ Lainnya (Tuliskan Sendiri)</option>
            </select>
          </div>

          {checkInActivityType === "other" && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Kegiatan Khusus <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kuras tangki solar dan ganti dinamo starter"
                value={checkInCustomType}
                onChange={(e) => onChangeCustomType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
              />
            </div>
          )}

          {/* Detail / Uraian Kegiatan (Opsional) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Detail / Uraian Kegiatan Yang Akan Dilakukan{" "}
              <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Tuliskan detail pemeriksaan atau pekerjaan yang akan dilakukan (opsional)..."
              value={checkInDetails}
              onChange={(e) => onChangeDetails(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
            />
          </div>

          {/* Upload Multi-Foto Bukti Sebelum (Wajib) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Foto Bukti Sebelum (Bisa Upload Beberapa Foto){" "}
                <span className="text-rose-500">*</span>
              </label>
              {checkInPhotos.length > 0 && (
                <span className="text-[10px] font-bold text-[#005baa]">
                  {checkInPhotos.length} foto dilampirkan
                </span>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              {/* Input untuk Galeri / File (Tanpa atribut capture agar Galeri selalu muncul di HP) */}
              <input
                type="file"
                id="checkInGalleryInput"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onAddPhotos}
              />
              {/* Input khusus Kamera HP */}
              <input
                type="file"
                id="checkInCameraInput"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onAddPhotos}
              />

              {checkInPhotos.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {checkInPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square shadow-2xs"
                      >
                        <img
                          src={url}
                          alt={`Foto Sebelum ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onRemovePhoto(idx)}
                          className="absolute top-1 right-1 rounded-full bg-rose-600/90 text-white p-1 hover:bg-rose-700 shadow-xs transition"
                          title="Hapus Foto Ini"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={12} />
                        </button>
                        <span className="absolute bottom-1 left-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Tombol Tambah Lagi dari Galeri atau Kamera */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label
                      htmlFor="checkInGalleryInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-bold text-[#005baa] hover:bg-blue-50 transition shadow-2xs"
                    >
                      <Icon icon="solar:gallery-bold" width={15} />
                      <span>+ Pilih dari Galeri</span>
                    </label>
                    <label
                      htmlFor="checkInCameraInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    >
                      <Icon icon="solar:camera-bold" width={15} className="text-[#005baa]" />
                      <span>+ Ambil Kamera</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 text-center space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#005baa] shadow-2xs">
                    <Icon icon="solar:gallery-wide-bold" width={20} />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-800 text-xs">
                      Lampirkan Foto Bukti Sebelum Kegiatan
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Pilih beberapa foto dari galeri HP atau ambil langsung dari kamera
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label
                      htmlFor="checkInGalleryInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#004885] transition shadow-2xs"
                    >
                      <Icon icon="solar:gallery-bold" width={15} />
                      <span>Pilih dari Galeri</span>
                    </label>
                    <label
                      htmlFor="checkInCameraInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <Icon icon="solar:camera-bold" width={15} className="text-[#005baa]" />
                      <span>Buka Kamera</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#005baa] px-5 py-2 font-bold text-white shadow-2xs hover:bg-[#004885] active:scale-95 transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span>Mulai Kegiatan (Check-in) &rarr;</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
