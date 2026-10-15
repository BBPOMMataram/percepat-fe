"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { logout } from "@/features/authSlice";
import { showAlert } from "@/features/alertSlice";
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
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = userName || user?.name || user?.call_name || "Pengguna";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
      dispatch(
        showAlert({
          type: "success",
          message: "Anda telah berhasil keluar dari akun SIPROVAL.",
          description: "Sesi telah diakhiri. Silakan login kembali jika diperlukan.",
        })
      );
    } catch {
      // jika error, tetap redirect ke login
    } finally {
      router.push("/login");
    }
  };

  let computedTitle = title;
  let computedDesc = description;

  if (!computedTitle) {
    if (pathname.startsWith("/siproval/katim/rhpk")) {
      computedTitle = "Pengisian Data RHPK";
      computedDesc = computedDesc || "Pengisian capaian realisasi, target bulanan, kendala, dan tindak lanjut RHPK";
    } else if (pathname.startsWith("/siproval/katim/arahan-pimpinan")) {
      computedTitle = "Arahan Pimpinan";
      computedDesc = computedDesc || "Daftar arahan dan evaluasi Kepala Balai untuk tim Anda";
    } else if (pathname.startsWith("/siproval/katim/anggota")) {
      computedTitle = "Anggota Tim IKSK";
      computedDesc = computedDesc || "Daftar staf dan pelaksana yang bertugas pada IKSK Anda";
    } else if (pathname.startsWith("/siproval/katim")) {
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

      {/* Pengguna dan Tombol Logout */}
      <div className="flex shrink-0 items-center gap-3">
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

        {/* Tombol Logout (Menggantikan Tombol Notifikasi) */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Keluar dari Aplikasi"
          title="Keluar dari Akun SIPROVAL"
          className="group flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-sm transition-all hover:bg-rose-100 hover:border-rose-300 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? (
            <span className="loading loading-spinner loading-xs text-rose-600"></span>
          ) : (
            <Icon
              icon="solar:logout-2-bold"
              width={18}
              height={18}
              className="text-rose-600 transition-transform group-hover:translate-x-0.5"
            />
          )}
          <span className="inline">
            {isLoggingOut ? "Keluar..." : "Keluar"}
          </span>
        </button>
      </div>
    </header>
  );
}
