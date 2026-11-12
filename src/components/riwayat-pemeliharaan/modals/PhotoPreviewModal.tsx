"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface PhotoPreviewModalProps {
  previewPhoto: { url: string; caption: string } | null;
  onClose: () => void;
}

export default function PhotoPreviewModal({ previewPhoto, onClose }: PhotoPreviewModalProps) {
  if (!previewPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 no-print print:hidden">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800">
          <span className="truncate pr-2">{previewPhoto.caption || "Dokumentasi Bukti Pemeliharaan"}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <Icon icon="solar:close-circle-bold" width={20} />
          </button>
        </div>
        <div className="bg-slate-900 flex items-center justify-center p-2">
          <img
            src={previewPhoto.url}
            alt={previewPhoto.caption}
            className="max-h-[65vh] w-auto rounded-lg object-contain"
          />
        </div>
        <div className="p-3 bg-slate-50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

