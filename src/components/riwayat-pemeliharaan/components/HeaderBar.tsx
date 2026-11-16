"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import type { ActiveMaintenanceSession, AuthUser } from "../types";

interface HeaderBarProps {
  currentUser: AuthUser | null;
  activeSession: ActiveMaintenanceSession | null;
  assetFound: boolean;
  onOpenManagePicModal: (defaultTab?: "assets" | "officers") => void;
  onLogout: () => void;
  onRedirectLogin: () => void;
  onOpenQrModal: () => void;
  onPrintTable: () => void;
  onInitiateNewActivity: () => void;
}

export default function HeaderBar({
  currentUser,
  activeSession,
  assetFound,
  onOpenManagePicModal,
  onLogout,
  onRedirectLogin,
  onOpenQrModal,
  onPrintTable,
  onInitiateNewActivity,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md no-print print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3 gap-2">
        {/* Sisi Kiri: Tombol Back & Judul Halaman */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            title="Kembali ke Beranda"
          >
            <Icon icon="solar:arrow-left-linear" width={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              Riwayat Pemeliharaan
            </h1>
          </div>
        </div>

        {/* Sisi Kanan: Status Petugas, Kelola Aset & Petugas (PIC), & Tombol Aksi */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tombol Khusus PIC: Kelola Aset & Petugas */}
          {currentUser?.isPic && (
            <button
              type="button"
              onClick={() => onOpenManagePicModal(assetFound ? "officers" : "assets")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/90 px-2.5 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition active:scale-95"
              title="Kelola aset pemeliharaan dan petugas yang berwenang"
            >
              <Icon icon="solar:settings-minimalistic-bold" width={15} />
              <span className="hidden md:inline">Kelola Aset & Petugas</span>
              <span className="md:hidden">Kelola</span>
            </button>
          )}

          {/* Akun Petugas / PIC */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/70 p-1 sm:px-2.5 sm:py-1 text-xs">
              <span
                className={`flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-lg text-white font-bold text-xs sm:text-[10px] ${
                  currentUser.isPic ? "bg-emerald-600" : "bg-[#005baa]"
                }`}
              >
                {currentUser.name.charAt(0)}
              </span>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 block leading-tight">
                    {currentUser.name}
                  </span>
                  {currentUser.isPic && (
                    <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-extrabold text-emerald-800 border border-emerald-300">
                      PIC
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-blue-700 block leading-tight">
                  {currentUser.role}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-600 transition"
                title="Keluar Akun"
              >
                <Icon icon="solar:logout-2-linear" width={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRedirectLogin}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
              title="Login sebagai Teknisi atau PIC"
            >
              <Icon icon="solar:user-bold" width={14} className="text-[#005baa]" />
              <span className="hidden sm:inline">Login Petugas</span>
              <span className="sm:hidden text-[11px]">Login</span>
            </button>
          )}

          {/* Tombol Stiker Barcode QR */}
          {assetFound && (
            <button
              type="button"
              onClick={onOpenQrModal}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-auto sm:w-auto sm:gap-1.5 rounded-xl border border-slate-200 bg-white sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              title="Buka stiker QR barcode siap tempel di fisik aset"
            >
              <Icon icon="solar:qr-code-bold" width={16} className="text-[#005baa]" />
              <span className="hidden md:inline">Stiker QR</span>
            </button>
          )}

          {/* Tombol Cetak Form (Hanya Cetak Tabel Lembar Kendali) */}
          {assetFound && (
            <button
              type="button"
              onClick={onPrintTable}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-auto sm:w-auto sm:gap-1.5 rounded-xl border border-slate-200 bg-white sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              title="Cetak lembar riwayat pemeliharaan (Hanya Tabel)"
            >
              <Icon icon="solar:printer-bold" width={16} className="text-slate-500" />
              <span className="hidden md:inline">Cetak</span>
            </button>
          )}

          {/* Tombol Utama: Catat Kegiatan Baru */}
          {assetFound && (
            <button
              type="button"
              onClick={onInitiateNewActivity}
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 ${
                activeSession
                  ? "bg-amber-600 hover:bg-amber-700 animate-pulse"
                  : "bg-[#005baa] hover:bg-[#004885]"
              }`}
            >
              <Icon
                icon={activeSession ? "solar:hourglass-bold" : "solar:pen-bold"}
                width={14}
              />
              <span className="hidden sm:inline">
                {activeSession ? "Kegiatan Berjalan..." : "+ Catat Kegiatan Baru"}
              </span>
              <span className="sm:hidden">
                {activeSession ? "Berjalan..." : "+ Catat"}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

