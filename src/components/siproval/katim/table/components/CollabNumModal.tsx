"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { CollabNumModalState, ActiveTabDetail } from "../types/tableTypes";
import { isCumulativeCol } from "../utils/tableDetection";

export interface CollabNumModalProps {
  modal: CollabNumModalState | null;
  katims: any[];
  user: any;
  activeTab: ActiveTabDetail | null;
  onClose: () => void;
  onMyValueChange: (val: string) => void;
  onSave: () => void;
}

export const CollabNumModal: React.FC<CollabNumModalProps> = ({
  modal,
  katims,
  user,
  activeTab,
  onClose,
  onMyValueChange,
  onSave,
}) => {
  if (!modal || !modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 border border-indigo-200 shrink-0">
              <Icon icon="solar:users-group-rounded-bold" width={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Rincian Kontribusi Angka Katim
                </h3>
                {!modal.canEdit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    <Icon icon="solar:lock-bold" width={11} />
                    Terkunci (Mode Lihat)
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-indigo-700">
                {modal.col.label} &bull; {modal.monthName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition cursor-pointer"
          >
            <Icon icon="solar:close-circle-bold" width={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Kolom ini dikerjakan secara kolaboratif oleh beberapa Katim. Setiap
            Katim menginput angka kontribusinya masing-masing, dan sistem secara
            otomatis mengakumulasikan nilai akhirnya.
          </p>

          {/* Rincian Kontributor yang Terdaftar */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Daftar Kontribusi per Katim:
            </label>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-slate-50/50 max-h-56 overflow-y-auto">
              {modal.col.allowed_katim_ids &&
              modal.col.allowed_katim_ids.length > 0 ? (
                modal.col.allowed_katim_ids.map((kId: string | number) => {
                  const strId = String(kId);
                  const katimProfile = katims.find(
                    (k: any) =>
                      String(k.user_id) === strId || String(k.id) === strId,
                  );
                  const contrib = modal.contributors[strId];
                  const isMe = user?.id && String(user.id) === strId;

                  return (
                    <div
                      key={strId}
                      className={`p-3 flex items-center justify-between text-xs ${isMe ? "bg-indigo-50/50 font-medium" : ""}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0">
                          {(
                            katimProfile?.name ||
                            contrib?.author ||
                            "K"
                          ).charAt(0)}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>
                              {katimProfile?.name ||
                                contrib?.author ||
                                `Katim (${strId.substring(0, 8)}...)`}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 text-[9px] font-bold">
                                Anda
                              </span>
                            )}
                          </div>
                          {contrib?.updated_at && (
                            <span className="text-[10px] text-slate-400">
                              Diperbarui:{" "}
                              {new Date(contrib.updated_at).toLocaleString(
                                "id-ID",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {contrib?.value !== undefined ? contrib.value : 0}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-xs text-slate-400 text-center">
                  Belum ada penugasan Katim spesifik.
                </div>
              )}
            </div>
          </div>

          {/* Input Bagian Saya atau Status Terkunci */}
          {modal.canEdit ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
              <label className="block text-xs font-bold text-indigo-950">
                Input / Ubah Angka Kontribusi Anda (
                {user?.name || user?.call_name || "Katim"}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={modal.myValue}
                  onChange={(e) => onMyValueChange(e.target.value)}
                  placeholder="Masukkan angka..."
                  className="flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Icon
                  icon="solar:lock-bold"
                  width={14}
                  className="text-amber-700"
                />
                <span>
                  Periode {modal.monthName} Terkunci (Mode Lihat Saja)
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Data periode ini telah dikunci oleh Administrator / Tim Kerja TU
                sehingga Anda hanya dapat melihat rincian kontribusi tanpa
                mengubah angka.
              </p>
              {modal.myValue !== "" && (
                <div className="pt-2 mt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-950">
                    Kontribusi Anda Tercatat:
                  </span>
                  <span className="font-mono font-bold text-amber-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
                    {modal.myValue}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Total Summary */}
          {(() => {
            const isCum = isCumulativeCol(modal.col);
            const myId = user?.id ? String(user.id) : "temp_me";
            const myVal =
              parseFloat(String(modal.myValue).replace(",", ".")) || 0;
            let monthSum = 0;
            Object.entries(modal.contributors).forEach(
              ([k, c]: [string, any]) => {
                if (k !== myId)
                  monthSum += parseFloat(String(c?.value || 0)) || 0;
              },
            );
            monthSum += myVal;

            const prevCumulative =
              isCum && activeTab?.rows_data && modal.rowIndex > 0
                ? Number(
                    activeTab.rows_data[modal.rowIndex - 1]?.cells?.[
                      modal.col.key
                    ] || 0,
                  )
                : 0;
            const finalCumulative = isCum
              ? prevCumulative + monthSum
              : monthSum;

            return (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700">
                      Total Kontribusi Bulan Ini ({modal.monthName})
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Hasil penjumlahan kontribusi Anda + Katim lainnya pada
                      bulan ini
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                    +{monthSum}
                  </span>
                </div>

                {isCum && modal.rowIndex > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-800">
                        Total Kumulatif Akhir s.d. Bulan Ini
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Akumulasi bulan lalu ({prevCumulative}) + Bulan ini (
                        {monthSum})
                      </p>
                    </div>
                    <span className="text-base font-extrabold font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      ∑ {finalCumulative}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {modal.canEdit ? "Batal" : "Tutup"}
          </button>
          {modal.canEdit && (
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer"
            >
              <Icon icon="solar:diskette-bold" width={16} />
              <span>Simpan Kontribusi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollabNumModal;
