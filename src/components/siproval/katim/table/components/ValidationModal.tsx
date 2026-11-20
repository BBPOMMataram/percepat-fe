"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { ValidationModalState, ColumnSchema, ActiveTabDetail } from "../types/tableTypes";

export interface ValidationModalProps {
  modal: ValidationModalState | null;
  activeTab: ActiveTabDetail | null;
  onClose: () => void;
  onCompleteMissing: (
    rowKey: number,
    col: ColumnSchema,
    cellValue: any,
    monthName: string,
    canEdit: boolean,
    rowIndex: number,
  ) => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  modal,
  activeTab,
  onClose,
  onCompleteMissing,
}) => {
  if (!modal || !modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-amber-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shrink-0">
              <Icon icon="solar:danger-triangle-bold" width={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Kendala & RTL Belum Diisi
              </h3>
              <p className="text-[11px] font-semibold text-amber-700">
                {modal.monthName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition"
          >
            <Icon icon="solar:close-circle-bold" width={20} />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Penyimpanan data <strong>belum dapat diproses</strong> karena Anda
            telah menginputkan capaian data pada periode ini, namun kolom{" "}
            <strong>Kendala</strong> dan/atau{" "}
            <strong>Rencana Tindak Lanjut (RTL)</strong> belum diisi.
          </p>

          {/* Status Checklist Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                Kolom Data Pengisian
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                <Icon
                  icon="solar:check-circle-bold"
                  width={14}
                  className="text-emerald-600"
                />
                Sudah Diisi
              </span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
              <span className="font-medium text-slate-700">
                Kolom Kendala
              </span>
              {modal.isKendalaMissing ? (
                <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] animate-pulse">
                  <Icon
                    icon="solar:close-circle-bold"
                    width={14}
                    className="text-rose-600"
                  />
                  Belum Diisi (Wajib)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                  <Icon
                    icon="solar:check-circle-bold"
                    width={14}
                    className="text-emerald-600"
                  />
                  Sudah Terisi
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
              <span className="font-medium text-slate-700">
                Kolom Rencana Tindak Lanjut (RTL)
              </span>
              {modal.isRtlMissing ? (
                <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] animate-pulse">
                  <Icon
                    icon="solar:close-circle-bold"
                    width={14}
                    className="text-rose-600"
                  />
                  Belum Diisi (Wajib)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                  <Icon
                    icon="solar:check-circle-bold"
                    width={14}
                    className="text-emerald-600"
                  />
                  Sudah Terisi
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            <Icon
              icon="solar:info-circle-bold"
              width={16}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <p className="text-[11px] leading-relaxed">
              Sesuai ketentuan pelaporan RHPK, saat melakukan pengisian data
              realisasi pertama kali di bulan tersebut, Anda wajib melengkapi
              kendala yang dihadapi serta rencana tindak lanjut (RTL)
              penyelesaiannya. Jika Kendala dan RTL telah terisi, Anda dapat
              menyimpan perubahan meskipun belum semua kolom dalam sebaris selesai
              terisi.
            </p>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={() => {
              const targetCol = modal.isKendalaMissing
                ? modal.kendalaCol
                : modal.rtlCol;
              const rIdx = modal.rowIndex;
              const rKey = modal.rowKey;
              const mName = modal.monthName;
              onClose();

              if (targetCol && activeTab) {
                const row = activeTab.rows_data[rIdx];
                const val = row?.cells?.[targetCol.key];
                onCompleteMissing(rKey, targetCol, val, mName, true, rIdx);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
          >
            <Icon icon="solar:pen-new-square-bold" width={15} />
            <span>
              Lengkapi {modal.isKendalaMissing ? "Kendala" : "RTL"} Sekarang
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;
