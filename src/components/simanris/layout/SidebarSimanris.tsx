"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardPlus,
  ShieldAlert,
  FileUp,
  History,
  GitCompareArrows,
  ArrowLeft,
  X,
} from "lucide-react";

interface SidebarSimanrisProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const MENU_ITEMS = [
  {
    href: "/simanris",
    label: "Dashboard Eksekutif",
    sub: "Ringkasan & Peta Risiko",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/simanris/entry-risiko",
    label: "Entry Risiko",
    sub: "Input & Formulir Dinamis",
    icon: ClipboardPlus,
    exact: false,
  },
  {
    href: "/simanris/data-risiko",
    label: "Data Risiko",
    sub: "Eksplorasi Risk Register",
    icon: ShieldAlert,
    exact: false,
  },
  {
    href: "/simanris/upload",
    label: "Upload Excel",
    sub: "Import & Preview Workbook",
    icon: FileUp,
    exact: false,
  },
  {
    href: "/simanris/import-history",
    label: "Riwayat Import",
    sub: "Snapshot & Aktivasi Dataset",
    icon: History,
    exact: false,
  },
  {
    href: "/simanris/analytics",
    label: "Analisis Semester",
    sub: "Perbandingan & Data Pendukung",
    icon: GitCompareArrows,
    exact: false,
  },
];

export default function SidebarSimanris({
  mobileOpen = false,
  onCloseMobile,
}: SidebarSimanrisProps) {
  const pathname = usePathname();

  const isItemActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-[#004281] text-white">
      <div>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#04a451] text-xs font-extrabold tracking-wider text-white shadow-sm">
                MR
              </span>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">
                  SIMANRIS
                </h1>
                <p className="text-[11px] text-blue-200">
                  BBPOM di Mataram
                </p>
              </div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10 lg:hidden"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="px-3 pt-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-200/75">
            Manajemen Risiko
          </p>
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    active
                      ? "bg-white text-[#004281] shadow-sm"
                      : "text-blue-50 hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      active ? "text-[#005baa]" : "text-blue-200 group-hover:text-white"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight">
                      {item.label}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] leading-tight ${
                        active ? "text-slate-500" : "text-blue-200/80"
                      }`}
                    >
                      {item.sub}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="rounded-xl bg-white/10 px-3 py-2.5 text-[11px] text-blue-100">
          <div className="font-semibold text-white">Sumber Resmi: Excel SAPA APIP</div>
          <p className="mt-0.5 text-blue-200/90 leading-relaxed">
            Perhitungan matriks & skor inheren/residual menggunakan dataset terpublikasi di server.
          </p>
        </div>
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Portal Percepat
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 xl:w-72 shadow-xl">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
