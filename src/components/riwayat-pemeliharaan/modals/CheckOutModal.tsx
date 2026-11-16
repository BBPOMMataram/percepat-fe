"use client";

import { Icon } from "@iconify/react";
import type { ActiveMaintenanceSession, MaintenanceRecord } from "../types";
import { getActivityBadge } from "../helpers";

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: ActiveMaintenanceSession | null;
  checkOutTimeCaptured: {
    timeStr: string;
    displayStr: string;
    duration: number;
  };
  checkOutStatusAfter: MaintenanceRecord["statusAfter"];
  onChangeStatusAfter: (s: MaintenanceRecord["statusAfter"]) => void;
  checkOutNotes: string;
  onChangeNotes: (v: string) => void;
  checkOutPhotoUrl: string;
  onChangePhotoUrl: (v: string) => void;
  onPhotoFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CheckOutModal({
  isOpen,
  onClose,
  activeSession,
  checkOutTimeCaptured,
  checkOutStatusAfter,
  onChangeStatusAfter,
  checkOutNotes,
  onChangeNotes,
  checkOutPhotoUrl,
  onChangePhotoUrl,
  onPhotoFileChange,
  isSubmitting,
  onSubmit,
}: CheckOutModalProps) {
  if (!isOpen || !activeSession) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 no-print print:hidden">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Langkah 2: Check-out (Selesaikan Kegiatan)
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              Selesaikan & Simpan Riwayat
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
          {/* Ringkasan Kegiatan */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                JENIS KEGIATAN:
              </span>
              <span className="font-bold text-slate-900">
                {getActivityBadge(activeSession.activityType).label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Pelaksana:</span>
              <span className="font-semibold text-slate-800">
                {activeSession.executorName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Waktu Mulai:</span>
              <span className="font-mono font-semibold text-slate-800">
                {activeSession.startTime} WITA
              </span>
            </div>
          </div>

          {/* Waktu Selesai & Durasi Terhitung Otomatis */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 sm:p-3">
              <span className="block text-[9px] sm:text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                WAKTU SELESAI
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-950 font-mono">
                {checkOutTimeCaptured.timeStr} WITA
              </span>
              <span className="block text-[10px] text-emerald-700 mt-0.5">
                Tercatat otomatis
              </span>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 sm:p-3">
              <span className="block text-[9px] sm:text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">
                DURASI TOTAL
              </span>
              <span className="text-xs sm:text-sm font-bold text-blue-950 font-mono">
                {checkOutTimeCaptured.duration} Menit
              </span>
              <span className="block text-[10px] text-blue-700 mt-0.5">
                Dihitung otomatis
              </span>
            </div>
          </div>

          {/* Kondisi Aset Akhir */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kondisi Aset Akhir Setelah Kegiatan{" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={checkOutStatusAfter}
              onChange={(e) =>
                onChangeStatusAfter(
                  e.target.value as MaintenanceRecord["statusAfter"]
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
            >
              <option value="standby">
                🟢 Siaga (Standby - Siap Digunakan Kapan Pun)
              </option>
              <option value="need_followup">
                🟡 Butuh Tindak Lanjut / Pengawasan
              </option>
              <option value="trouble">
                🔴 Tidak Siap Pakai / Ditemukan Kerusakan
              </option>
            </select>
          </div>

          {/* Catatan & Hasil Pemeriksaan Akhir */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan / Hasil Pemeriksaan Akhir{" "}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contoh: Pemanasan 15 menit berjalan normal, suara mesin halus, voltase stabil, level solar cukup..."
              value={checkOutNotes}
              onChange={(e) => onChangeNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
            />
          </div>

          {/* Upload Foto Bukti Akhir */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Foto Bukti Akhir (Panel Jam Operasi / Fisik Aset)
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              {checkOutPhotoUrl ? (
                <div className="relative inline-block group">
                  <img
                    src={checkOutPhotoUrl}
                    alt="Foto Bukti Akhir"
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
                    id="checkOutPhotoInput"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => onPhotoFileChange(e, onChangePhotoUrl)}
                  />
                  <label
                    htmlFor="checkOutPhotoInput"
                    className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all duration-150 group"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs mb-2">
                      <Icon icon="solar:camera-bold" width={22} />
                    </div>
                    <span className="block font-semibold text-slate-800 text-xs group-hover:text-emerald-700 transition">
                      Ambil Foto Panel Kontrol Akhir
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
              Kembali
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span>Simpan & Selesaikan Kegiatan (Check-out)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

