"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { ConfirmDialogState } from "../types/tableTypes";

export interface ConfirmDialogModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  dialog,
  onClose,
}) => {
  if (!dialog) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                dialog.tone === "rose"
                  ? "bg-rose-100 text-rose-700"
                  : dialog.tone === "amber"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <Icon icon={dialog.icon} width={22} />
            </span>
            <div className="space-y-1">
              <h3
                id="confirm-dialog-title"
                className="text-sm font-bold text-slate-900"
              >
                {dialog.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {dialog.message}
              </p>
            </div>
          </div>

          {dialog.note && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 text-[11px] font-semibold leading-relaxed ${
                dialog.tone === "rose"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : dialog.tone === "amber"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              <Icon
                icon="solar:danger-triangle-bold"
                width={15}
                className="shrink-0 mt-0.5"
              />
              <span>{dialog.note}</span>
            </div>
          )}

          {dialog.details && dialog.details.length > 0 && (
            <ul className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700 max-h-48 overflow-y-auto">
              {dialog.details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Icon
                    icon="solar:check-read-linear"
                    width={13}
                    className="text-slate-400 shrink-0 mt-0.5"
                  />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}

          {dialog.warnings && dialog.warnings.length > 0 && (
            <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900">
              {dialog.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Icon
                    icon="solar:info-circle-bold"
                    width={13}
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
          {!dialog.hideCancel && (
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              {dialog.cancelLabel || "Batal"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const action = dialog.onConfirm;
              onClose();
              action();
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer ${
              dialog.tone === "rose"
                ? "bg-rose-600 hover:bg-rose-700"
                : dialog.tone === "amber"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialogModal;
