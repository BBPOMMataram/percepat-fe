"use client";

import { Icon } from "@iconify/react";
import type {
  ActiveMaintenanceSession,
  AssetMetadata,
  MaintenanceOfficer,
  MaintenanceRecord,
} from "../types";
import { formatDateDisplay, getActivityDynamicStatus } from "../helpers";

interface AssetHeroCardProps {
  assetStatus: "loading" | "found" | "not_found";
  assetInfo: AssetMetadata;
  availableAssets: AssetMetadata[];
  activeSession: ActiveMaintenanceSession | null;
  officers: MaintenanceOfficer[];
  latestRecord?: MaintenanceRecord;
  isPic?: boolean;
  onSelectAssetToken: (qrToken: string) => void;
  onOpenManagePicModal: (defaultTab: "assets" | "officers") => void;
}

export default function AssetHeroCard({
  assetStatus,
  assetInfo,
  availableAssets,
  activeSession,
  officers,
  latestRecord,
  isPic,
  onSelectAssetToken,
  onOpenManagePicModal,
}: AssetHeroCardProps) {
  if (assetStatus === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#005baa]">
          <Icon icon="solar:refresh-circle-bold" width={26} className="animate-spin" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">
          Memuat Data Aset Pemeliharaan...
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Menghubungkan ke database SIMPEL BMN
        </p>
      </div>
    );
  }

  if (assetStatus === "not_found") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-2xs">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon icon="solar:box-minimalistic-linear" width={30} />
        </div>
        <h2 className="text-base font-bold text-slate-800">
          Belum Ada Data Aset Pemeliharaan
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
          Saat ini belum ada aset pemeliharaan yang terdaftar di database SIMPEL BMN.
          {isPic
            ? " Sebagai PIC SIMPEL BMN, Anda dapat langsung menambahkan aset pemeliharaan baru melalui tombol di bawah ini."
            : " Silakan hubungi PIC SIMPEL BMN untuk menambahkan aset pemeliharaan."}
        </p>

        {isPic && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => onOpenManagePicModal("assets")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#004885] active:scale-95 transition"
            >
              <Icon icon="solar:add-circle-bold" width={16} />
              <span>+ Tambah Aset Pemeliharaan Baru</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#072448] via-[#0b3c68] to-[#005baa] p-4 sm:p-6 text-white shadow-md">
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-blue-400/10 blur-2xl" />
      <div className="pointer-events-none absolute right-24 bottom-0 h-40 w-40 rounded-full bg-sky-300/10 blur-xl" />

      {/* Baris Atas: Status Kesiapan Aset & Pilihan Aset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {activeSession ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-amber-200 border border-amber-300/40 backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Kondisi: {getActivityDynamicStatus(activeSession.activityType)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-emerald-200 border border-emerald-300/30 backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Kondisi: Siaga (Standby - Siap Digunakan)
            </span>
          )}

          {/* Jika ada lebih dari 1 aset di database, sediakan dropdown ganti aset */}
          {availableAssets.length > 1 && (
            <select
              value={assetInfo.qr_token}
              onChange={(e) => onSelectAssetToken(e.target.value)}
              className="rounded-lg bg-white/15 border border-white/25 px-2.5 py-1 text-[11px] font-semibold text-white focus:outline-none focus:ring-1 focus:ring-sky-300"
              title="Ganti aset pemeliharaan yang ditampilkan"
            >
              {availableAssets.map((a) => (
                <option key={a.id} value={a.qr_token} className="text-slate-900">
                  [{a.asset_code}] {a.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <span className="text-[10px] sm:text-[11px] font-mono text-sky-200/90 tracking-wide">
          KODE BMN: {assetInfo.asset_code} &bull; {assetInfo.category.toUpperCase()}
        </span>
      </div>

      {/* Baris Tengah: Judul Aset & Petugas Resmi */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/15">
        <div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase leading-tight">
            {assetInfo.name}
          </h2>
          {/* Petugas Resmi yang Ditugaskan */}
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-sky-200/90 flex-wrap">
            <span className="font-semibold text-white flex items-center gap-1">
              <Icon icon="solar:shield-check-bold" width={14} className="text-emerald-300" />
              Petugas Ditunjuk PIC:
            </span>
            <span className="bg-white/15 px-2 py-0.5 rounded-md font-mono text-white text-[10px]">
              {officers.length > 0 ? officers.map((o) => o.name).join(", ") : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Baris Bawah: Catatan Operasional Terakhir */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 text-[11px] sm:text-xs text-sky-100/90">
        <div className="flex items-start sm:items-center gap-2">
          <Icon
            icon="solar:info-circle-bold"
            width={15}
            className="text-amber-300 shrink-0 mt-0.5 sm:mt-0"
          />
          <span className="leading-relaxed">
            {latestRecord ? (
              <>
                <strong>Catatan Operasional:</strong> Aset terakhir dipelihara pada{" "}
                <strong>{formatDateDisplay(latestRecord.date)}</strong> oleh{" "}
                <strong>{latestRecord.executorName}</strong> selama{" "}
                <strong>{latestRecord.durationMinutes}</strong> menit.
              </>
            ) : (
              <>
                <strong>Catatan Operasional:</strong> Belum ada catatan pemeliharaan
                tercatat di sistem. Aset dalam kondisi siaga (standby).
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-emerald-300 shrink-0 self-start sm:self-auto">
          <Icon icon="solar:check-circle-bold" width={14} />
          <span>Kepatuhan Mingguan: Normal</span>
        </div>
      </div>
    </div>
  );
}

