"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { PhotoGalleryPreview } from "../types";

interface PhotoPreviewModalProps {
  previewPhoto: PhotoGalleryPreview | null;
  onClose: () => void;
}

export default function PhotoPreviewModal({
  previewPhoto,
  onClose,
}: PhotoPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (previewPhoto) {
      setCurrentIndex(previewPhoto.initialIndex || 0);
    }
  }, [previewPhoto]);

  if (!previewPhoto || !previewPhoto.urls || previewPhoto.urls.length === 0) {
    return null;
  }

  const urls = previewPhoto.urls;
  const safeIndex = Math.min(Math.max(0, currentIndex), urls.length - 1);
  const currentUrl = urls[safeIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4 no-print print:hidden">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="truncate font-bold">
              {previewPhoto.caption || "Dokumentasi Bukti Pemeliharaan"}
            </span>
            {urls.length > 1 && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#005baa] shrink-0">
                Foto {safeIndex + 1} / {urls.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <Icon icon="solar:close-circle-bold" width={22} />
          </button>
        </div>

        {/* Area Gambar Utama + Navigasi Kiri/Kanan */}
        <div className="relative bg-slate-900 flex items-center justify-center p-2 min-h-[280px]">
          {urls.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length)
              }
              className="absolute left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition"
              title="Foto Sebelumnya"
            >
              <Icon icon="solar:alt-arrow-left-bold" width={18} />
            </button>
          )}

          <img
            src={currentUrl}
            alt={`${previewPhoto.caption} - ${safeIndex + 1}`}
            className="max-h-[62vh] w-auto rounded-lg object-contain"
          />

          {urls.length > 1 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % urls.length)}
              className="absolute right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition"
              title="Foto Berikutnya"
            >
              <Icon icon="solar:alt-arrow-right-bold" width={18} />
            </button>
          )}
        </div>

        {/* Thumbnail Strip jika ada > 1 foto */}
        {urls.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto bg-slate-100 px-3.5 py-2.5 border-t border-slate-200">
            {urls.map((u, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                  idx === safeIndex
                    ? "border-[#005baa] ring-2 ring-[#005baa]/30"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={u}
                  alt={`Thumb ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 flex items-center justify-between border-t border-slate-200/80">
          <span className="text-[11px] text-slate-500">
            {urls.length > 1
              ? "Gunakan tombol panah atau klik thumbnail untuk berpindah foto."
              : "Dokumentasi foto bukti pemeliharaan aset BMN."}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
