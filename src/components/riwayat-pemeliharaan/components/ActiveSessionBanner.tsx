"use client";

import { Icon } from "@iconify/react";
import type { ActiveMaintenanceSession } from "../types";
import { getActivityBadge } from "../helpers";

interface ActiveSessionBannerProps {
  activeSession: ActiveMaintenanceSession;
  runningMinutes: number;
  onCancelSession: () => void;
  onOpenCheckOutModal: () => void;
}

export default function ActiveSessionBanner({
  activeSession,
  runningMinutes,
  onCancelSession,
  onOpenCheckOutModal,
}: ActiveSessionBannerProps) {
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 p-3.5 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
            <Icon
              icon="solar:hourglass-bold"
              width={20}
              className="animate-spin text-white"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-amber-600 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                Kegiatan Berlangsung
              </span>
              <span className="text-xs font-mono font-bold text-amber-900">
                ⏱️ Berjalan: {runningMinutes} Menit
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              {getActivityBadge(activeSession.activityType).label}
            </h3>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 mt-0.5 flex-wrap">
              <span>
                Pelaksana: <strong>{activeSession.executorName}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Mulai: <strong>{activeSession.startTime} WITA</strong>
              </span>
            </div>
            {activeSession.activityDetails && (
              <p className="mt-2 text-xs text-amber-900 bg-white/90 p-2 sm:p-2.5 rounded-lg border border-amber-200/80 leading-relaxed">
                <strong>Uraian Kegiatan:</strong> {activeSession.activityDetails}
              </p>
            )}
          </div>
        </div>

        {/* Tombol Aksi Check-out */}
        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/80 shrink-0">
          <button
            type="button"
            onClick={onCancelSession}
            className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition text-center"
            title="Batalkan sesi ini jika salah tekan"
          >
            Batalkan
          </button>
          <button
            type="button"
            onClick={onOpenCheckOutModal}
            className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
          >
            <Icon icon="solar:check-circle-bold" width={16} />
            <span>Selesaikan (Check-out)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

