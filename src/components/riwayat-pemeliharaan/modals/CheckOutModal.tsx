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
  checkOutPhotos: string[];
  onAddPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
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
  checkOutPhotos,
  onAddPhotos,
  onRemovePhoto,
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
              Selesaikan & Catat Hasil Pemeliharaan
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
          {/* Ringkasan Waktu Mulai -> Selesai & Durasi */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                RINGKASAN WAKTU & DURASI OTOMATIS
              </span>
              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                Durasi: {checkOutTimeCaptured.duration} Menit
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px] font-sans">
                  Mulai (Check-in):
                </span>
                <strong className="text-slate-800">{activeSession.startTime} WITA</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-sans">
                  Selesai (Check-out):
                </span>
                <strong className="text-emerald-700">
                  {checkOutTimeCaptured.timeStr} WITA
                </strong>
              </div>
            </div>
          </div>

          {/* Info Kegiatan yang Sedang Diselesaikan */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                KEGIATAN YANG DILAKUKAN:
              </span>
              <span className="text-[10px] font-semibold text-[#005baa]">
                {getActivityBadge(activeSession.activityType).label}
              </span>
            </div>
            <p className="text-slate-800 font-medium">
              {activeSession.activityDetails}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Pelaksana: <strong>{activeSession.executorName}</strong>
            </p>
          </div>

          {/* Status Kesiapan Akhir */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Status Kondisi Aset Setelah Kegiatan{" "}
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

          {/* Upload Multi-Foto Bukti Sesudah (Akhir) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Foto Bukti Sesudah (Bisa Upload Beberapa Foto)
              </label>
              {checkOutPhotos.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-700">
                  {checkOutPhotos.length} foto dilampirkan
                </span>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              {/* Input untuk Galeri / File (Tanpa atribut capture agar Galeri selalu muncul di HP) */}
              <input
                type="file"
                id="checkOutGalleryInput"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onAddPhotos}
              />
              {/* Input khusus Kamera HP */}
              <input
                type="file"
                id="checkOutCameraInput"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onAddPhotos}
              />

              {checkOutPhotos.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {checkOutPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square shadow-2xs"
                      >
                        <img
                          src={url}
                          alt={`Foto Sesudah ${idx + 1}`}
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
                      htmlFor="checkOutGalleryInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-2xs"
                    >
                      <Icon icon="solar:gallery-bold" width={15} />
                      <span>+ Pilih dari Galeri</span>
                    </label>
                    <label
                      htmlFor="checkOutCameraInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    >
                      <Icon icon="solar:camera-bold" width={15} className="text-emerald-600" />
                      <span>+ Ambil Kamera</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 text-center space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shadow-2xs">
                    <Icon icon="solar:gallery-wide-bold" width={20} />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-800 text-xs">
                      Lampirkan Foto Bukti Sesudah Kegiatan
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Pilih beberapa foto dari galeri HP atau ambil langsung dari kamera
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label
                      htmlFor="checkOutGalleryInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                    >
                      <Icon icon="solar:gallery-bold" width={15} />
                      <span>Pilih dari Galeri</span>
                    </label>
                    <label
                      htmlFor="checkOutCameraInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <Icon icon="solar:camera-bold" width={15} className="text-emerald-600" />
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
