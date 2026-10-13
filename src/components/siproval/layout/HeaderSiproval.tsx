"use client";

import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";

type HeaderSiprovalProps = {
  title?: string;
  description?: string;
  userName?: string;
};

export default function HeaderSiproval({
  title,
  description,
  userName,
}: HeaderSiprovalProps) {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);

  const displayName = userName || user?.name || user?.call_name || "Pengguna";

  let computedTitle = title;
  let computedDesc = description;

  if (!computedTitle) {
    if (pathname.startsWith("/siproval/katim")) {
      computedTitle = "Dashboard Ketua Tim";
      computedDesc = computedDesc || "Monitoring capaian dan realisasi kegiatan tim";
    } else if (pathname.startsWith("/siproval/google-sheets")) {
      computedTitle = "Data Realisasi Google Sheet";
      computedDesc = computedDesc || "Pengisian dan pelaporan data capaian IKSK";
    } else if (pathname.startsWith("/siproval/monev") || pathname.startsWith("/siproval/show-monev")) {
      computedTitle = "Monitoring & Evaluasi RHPK";
      computedDesc = computedDesc || "Rekapitulasi Rencana Hasil Pelaksanaan Kegiatan per tahun";
    } else if (pathname.startsWith("/siproval/catatan")) {
      computedTitle = "Catatan Monev & Evaluasi";
      computedDesc = computedDesc || "Monitoring, evaluasi, dan review laporan IKSK";
    } else if (pathname.startsWith("/siproval/arahan-pimpinan")) {
      computedTitle = "Arahan Pimpinan";
      computedDesc = computedDesc || "Formulir penambahan arahan dan evaluasi Kepala Balai";
    } else if (pathname.startsWith("/siproval/rhpk")) {
      computedTitle = "Rekapitulasi RHPK";
      computedDesc = computedDesc || "Data pemantauan dan evaluasi tab RHPK";
    } else if (pathname.startsWith("/siproval/tu")) {
      computedTitle = "Dashboard Tata Usaha";
      computedDesc = computedDesc || "Pengelolaan anggaran dan pemetaan program kerja";
    } else if (pathname.startsWith("/siproval/budget-mapping")) {
      computedTitle = "Budget Mapping";
      computedDesc = computedDesc || "Pemetaan alokasi anggaran dan realisasi bulanan";
    } else if (pathname.startsWith("/siproval/admin/sinkronisasi-spreadsheet")) {
      computedTitle = "Sinkronisasi Spreadsheet";
      computedDesc = computedDesc || "Integrasi dokumen Google Spreadsheet ke sistem SIPROVAL";
    } else if (pathname.startsWith("/siproval/admin/sinkronisasi-tab")) {
      computedTitle = "Sinkronisasi Tab";
      computedDesc = computedDesc || "Pengelolaan tab dan konfigurasi pembacaan data spreadsheet";
    } else if (pathname.startsWith("/siproval/admin/permission")) {
      computedTitle = "Hak Akses & Permission";
      computedDesc = computedDesc || "Manajemen hak akses user terhadap tab Google Spreadsheet";
    } else {
      computedTitle = "Dashboard SIPROVAL";
      computedDesc = computedDesc || "Sistem Informasi Program dan Evaluasi BBPOM di Mataram";
    }
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm lg:px-8">
      {/* Judul halaman */}
      <div className="min-w-0">
        <h2 className="truncate text-xl font-bold text-slate-800">{computedTitle}</h2>

        {computedDesc && (
          <p className="mt-0.5 text-sm text-slate-500">{computedDesc}</p>
        )}
      </div>

      {/* Pengguna dan notifikasi */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-blue-700"
        >
          <Icon icon="solar:bell-bold" width={20} height={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-emerald-500" />
        </button>

        {displayName && (
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {displayName.trim().charAt(0).toUpperCase()}
            </div>

            <span className="max-w-40 truncate text-sm font-semibold text-slate-700">
              {displayName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
