"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu, Shield } from "lucide-react";
import HeaderUserArea from "@/components/main/user-area/Header";
import FooterUserArea from "@/components/main/user-area/Footer";
import { getUser } from "@/features/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import SidebarSimanris from "./SidebarSimanris";

interface SimanrisShellProps {
  children: React.ReactNode;
}

export default function SimanrisShell({ children }: SimanrisShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Tetap coba sinkronkan sesi Auth-BPOM bila cookie tersedia, tanpa memaksa redirect login.
    if (!user) {
      void dispatch(getUser());
    }
  }, [dispatch, user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SidebarSimanris
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="min-h-screen min-w-0 lg:ml-64 xl:ml-72 flex flex-col">
        <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/80 px-3.5 sm:px-5 lg:px-6 pt-3 pb-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex lg:hidden items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs hover:bg-slate-100"
                aria-label="Buka navigasi SIMANRIS"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-xs text-[#004281]">
                <Shield className="h-3.5 w-3.5 shrink-0 text-[#005baa]" />
                <span className="font-semibold">SIMANRIS</span>
                <span className="text-slate-400">|</span>
                <span className="truncate text-slate-600">
                  {user?.name
                    ? `Aktif sebagai ${user.name}`
                    : "Mode Pengembangan — Login Auth-BPOM ditangguhkan sementara"}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 max-w-xl">
              <HeaderUserArea
                user={user}
                callName={user?.name ? user.name.split(" ")[0] : "Pengguna"}
              />
            </div>
          </div>
        </div>

        <main className="flex-1 min-w-0 px-3.5 sm:px-5 lg:px-6 py-4">
          {children}
        </main>

        <div className="px-3.5 sm:px-5 lg:px-6 pb-4">
          <FooterUserArea />
        </div>
      </div>
    </div>
  );
}
