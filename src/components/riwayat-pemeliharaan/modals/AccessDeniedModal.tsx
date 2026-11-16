"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { AccessDeniedInfo } from "../types";

interface AccessDeniedModalProps {
  accessDeniedModal: AccessDeniedInfo | null;
  assetName: string;
  picName?: string;
  onClose: () => void;
  onSwitchAccount: () => void;
}

export default function AccessDeniedModal({
  accessDeniedModal,
  assetName,
  picName,
  onClose,
  onSwitchAccount,
}: AccessDeniedModalProps) {
  if (!accessDeniedModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print print:hidden">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-3.5">
          <Icon icon="solar:shield-warning-bold" width={32} />
        </div>

        <h3 className="text-base font-bold text-slate-900">Kewenangan Akses Terbatas</h3>
        <p className="text-xs text-slate-500 mt-0.5">SOP Pemeliharaan BMN POM-14.01/CFM.01/SOP.01</p>

        <div className="my-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
            Akun Terdeteksi (SSO):
          </span>
          <span className="font-bold text-slate-900 block mt-0.5">{accessDeniedModal.userName}</span>
          <span className="text-slate-500 block text-[11px]">
            {accessDeniedModal.userRole}
            {accessDeniedModal.userNip && accessDeniedModal.userNip !== "-"
              ? ` • NIP: ${accessDeniedModal.userNip}`
              : ""}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed text-left">
          Akun Anda <strong>tidak terdaftar</strong> dalam daftar Petugas Pemeliharaan yang berwenang untuk unit{" "}
          <strong>{assetName || "Aset BMN"}</strong>. Demi tertib administrasi BMN, pencatatan check-in pemeliharaan
          fisik hanya dapat dilakukan oleh teknisi resmi yang telah ditunjuk oleh PIC ({picName || "PIC BMN"}).
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#005baa] py-2.5 text-xs font-bold text-white hover:bg-[#004885] shadow-2xs transition"
          >
            Kembali ke Dashboard
          </button>
          <button
            type="button"
            onClick={onSwitchAccount}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Ganti Akun
          </button>
        </div>
      </div>
    </div>
  );
}

