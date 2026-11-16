"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { AssetMetadata } from "../types";

interface QrStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetInfo: AssetMetadata;
  onPrintSticker: () => void;
}

export default function QrStickerModal({
  isOpen,
  onClose,
  assetInfo,
  onPrintSticker,
}: QrStickerModalProps) {
  if (!isOpen) return null;

  const tokenParam = assetInfo.qr_token || "bpom-genset-mataram-01";
  const baseOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://bbpommataram.id";

  const qrTargetUrl = `${baseOrigin}/riwayat-pemeliharaan?token=${encodeURIComponent(tokenParam)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print print:hidden">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl text-center p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-bold text-[#005baa] uppercase tracking-wider truncate pr-2">
            Stiker QR Fisik: {assetInfo.name || "Aset BMN"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <Icon icon="solar:close-circle-bold" width={20} />
          </button>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 bg-slate-50/40">
          <div className="mx-auto h-36 w-36 sm:h-40 sm:w-40 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrTargetUrl)}`}
              alt="QR Code Aset BBPOM"
              className="h-full w-full object-contain"
            />
          </div>

          <p className="mt-3 text-[10px] font-mono text-slate-600 bg-white border border-slate-200 py-1 px-2 rounded-lg truncate">
            {qrTargetUrl}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Arahkan kamera HP ke QR di atas untuk membuka riwayat aset seketika
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={onPrintSticker}
            className="flex-1 rounded-xl bg-[#005baa] py-2 text-xs font-semibold text-white hover:bg-[#004885] shadow-2xs transition"
          >
            Cetak Stiker
          </button>
        </div>
      </div>
    </div>
  );
}

