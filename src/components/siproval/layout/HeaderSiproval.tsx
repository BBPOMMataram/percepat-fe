"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { logout } from "@/features/authSlice";
import { showAlert } from "@/features/alertSlice";
import { Icon } from "@iconify/react";
import { resolveSiprovalPageMeta } from "./SidebarSiproval";

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

  const resolvedMeta = resolveSiprovalPageMeta(pathname);
  const computedTitle = title || resolvedMeta.title;
  const computedDesc = description || resolvedMeta.description;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-7 py-3 shadow-xs">
      {/* Judul halaman */}
      <div className="min-w-0">
        <h2 className="truncate text-lg sm:text-xl font-bold text-slate-800">{computedTitle}</h2>

        {computedDesc && (
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 truncate">{computedDesc}</p>
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

        {/* Tombol Kembali ke Portal */}
        <Link
          href="/siproval"
          title="Kembali ke Portal SIPROVAL"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-100 hover:text-[#014083]"
        >
          <Icon icon="solar:home-2-bold" width={16} height={16} className="text-[#005baa]" />
          <span className="hidden sm:inline">Portal</span>
        </Link>

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
