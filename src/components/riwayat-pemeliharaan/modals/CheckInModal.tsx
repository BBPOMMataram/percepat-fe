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
  checkInPhotoUrl: string;
  onChangePhotoUrl: (v: string) => void;
  onPhotoFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => void;
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
  checkInPhotoUrl,
  onChangePhotoUrl,
  onPhotoFileChange,
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
              Mulai Pemeliharaan {assetName || "Aset"}
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
                *Dicatat saat tombol mulai dibuka. Waktu selesai akan otomatis
                dicatat saat Anda melakukan check-out nanti.
              </span>
            </div>
          </div>

          {/* Identitas Petugas Pelaksana */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Petugas Pelaksana (Terverifikasi Resmi)
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700 font-semibold">
              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:user-bold"
                  width={14}
                  className="text-[#005baa]"
                />
                <span>
                  {currentUser?.name || "Petugas"} (
                  {currentUser?.role || "Petugas Pemeliharaan"})
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
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
                🟡 Pemanasan Rutin (Warming-up / Panasin Mesin)
              </option>
              <option value="routine_service">
                🟠 Servis Berkala / Pengecekan Fisik (Radiator, Oli & Aki)
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

          {/* Detail / Uraian Kegiatan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Detail / Uraian Kegiatan Yang Akan Dilakukan{" "}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Tuliskan detail pemeriksaan atau pekerjaan yang akan dilakukan..."
              value={checkInDetails}
              onChange={(e) => onChangeDetails(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
            />
          </div>

          {/* Upload Foto Bukti Awal */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Foto Bukti Awal (Panel Instrumen / Kondisi Awal Mesin)
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              {checkInPhotoUrl ? (
                <div className="relative inline-block group">
                  <img
                    src={checkInPhotoUrl}
                    alt="Foto Bukti Awal"
                    className="h-28 w-auto rounded-lg object-cover mx-auto border border-slate-200 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => onChangePhotoUrl("")}
                    className="absolute -top-2 -right-2 rounded-full bg-rose-600 text-white p-1 hover:bg-rose-700 shadow-sm transition"
                    title="Hapus Foto"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={14} />
                  </button>
                  <div className="mt-1 text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <Icon
                      icon="solar:check-circle-bold"
                      width={12}
                      className="text-emerald-600"
                    />
                    <span>Foto tersimpan</span>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="checkInPhotoInput"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => onPhotoFileChange(e, onChangePhotoUrl)}
                  />
                  <label
                    htmlFor="checkInPhotoInput"
                    className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#005baa] hover:bg-blue-50/50 transition-all duration-150 group"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#005baa] group-hover:bg-[#005baa] group-hover:text-white transition-all shadow-2xs mb-2">
                      <Icon icon="solar:camera-bold" width={22} />
                    </div>
                    <span className="block font-semibold text-slate-800 text-xs group-hover:text-[#005baa] transition">
                      Ambil Foto Panel Kontrol Awal
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Ketuk untuk buka kamera HP atau upload file foto
                    </span>
                  </label>
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

