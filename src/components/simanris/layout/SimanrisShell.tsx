"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronRight,
  LogIn,
  Menu,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import HeaderUserArea from "@/components/main/user-area/Header";
import FooterUserArea from "@/components/main/user-area/Footer";
import { getUser } from "@/features/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import { setSimanrisActorHeaders } from "../lib/simanrisApi";
import SidebarSimanris, { resolveSimanrisPageMeta } from "./SidebarSimanris";

interface SimanrisShellProps {
  children: React.ReactNode;
}

export default function SimanrisShell({ children }: SimanrisShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading: isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const pageMeta = resolveSimanrisPageMeta(pathname);

  useEffect(() => {
    if (!user) {
      void dispatch(getUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      setSimanrisActorHeaders({
        id: user.id ?? null,
        name: user.name ?? null,
        email: user.email ?? null,
      });
    }
  }, [user]);

  const userDisplayName = user?.name || user?.email || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SidebarSimanris
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="min-h-screen min-w-0 lg:ml-64 xl:ml-72 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-3.5 sm:px-5 lg:px-6 py-3 shadow-2xs">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="mt-0.5 inline-flex lg:hidden items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs hover:bg-slate-100"
                aria-label="Buka navigasi SIMANRIS"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <nav
                  aria-label="Breadcrumb"
                  className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-slate-500"
                >
                  {pageMeta.breadcrumb.map((crumb, idx) => (
                    <span
                      key={crumb}
                      className="inline-flex items-center gap-1"
                    >
                      {idx > 0 && (
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                      )}
                      <span
                        className={
                          idx === pageMeta.breadcrumb.length - 1
                            ? "font-semibold text-[#005baa]"
                            : "text-slate-500"
                        }
                      >
                        {crumb}
                      </span>
                    </span>
                  ))}
                </nav>
                <h1 className="mt-0.5 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {pageMeta.title}
                </h1>
                <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                  {pageMeta.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 shrink-0">
              <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-xs text-[#004281]">
                {userDisplayName ? (
                  <></>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#005baa]" />
                    <span className="text-slate-600">
                      {isLoading
                        ? "Memeriksa sesi Auth-BPOM..."
                        : "Sesi Terbuka BPOM"}
                    </span>
                    {!isLoading && (
                      <Link
                        href="/login"
                        className="ml-1 inline-flex items-center gap-1 rounded-md bg-[#005baa] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#004281]"
                      >
                        <LogIn className="h-3 w-3" />
                        Login
                      </Link>
                    )}
                  </>
                )}
              </div>

              {user && (
                <div className="min-w-0 max-w-xs">
                  <HeaderUserArea
                    user={user}
                    callName={
                      userDisplayName
                        ? userDisplayName.split(" ")[0]
                        : "Pengguna"
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </header>

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
