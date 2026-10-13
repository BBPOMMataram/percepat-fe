"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

type Actor = "katim" | "kabalai" | "tu" | "superadmin";

const menus = {
  katim: [
    {
      name: "Dashboard",
      icon: "solar:widget-5-bold",
      url: "/siproval/katim",
      active: "/siproval/katim",
    },
    {
      name: "Google Sheet",
      icon: "solar:document-text-bold",
      url: "/siproval/google-sheets",
      active: "/siproval/google-sheets",
    },
  ],
  kabalai: [
    {
      name: "Monitoring & Evaluasi",
      icon: "solar:chart-square-bold",
      url: "/siproval/monev",
      active: "/siproval/monev",
    },
    {
      name: "Catatan Monev",
      icon: "solar:clipboard-text-bold",
      url: "/siproval/catatan",
      active: "/siproval/catatan",
    },
    {
      name: "Arahan Pimpinan",
      icon: "solar:notes-bold",
      url: "/siproval/arahan-pimpinan",
      active: "/siproval/arahan-pimpinan",
    },
    {
      name: "RHPK",
      icon: "solar:chart-2-bold",
      url: "/siproval/rhpk/2026",
      active: "/siproval/rhpk",
    },
  ],
  tu: [
    {
      name: "Dashboard",
      icon: "solar:widget-5-bold",
      url: "/siproval/tu",
      active: "/siproval/tu",
    },
    {
      name: "Budget Mapping",
      icon: "solar:pie-chart-2-bold",
      url: "/siproval/budget-mapping",
      active: "/siproval/budget-mapping",
    },
  ],
  superadmin: [
    {
      name: "Sinkronisasi Spreadsheet",
      icon: "solar:cloud-upload-bold",
      url: "/siproval/admin/sinkronisasi-spreadsheet",
      active: "/siproval/admin/sinkronisasi-spreadsheet",
    },
    {
      name: "Sinkronisasi Tab",
      icon: "solar:layers-bold",
      url: "/siproval/admin/sinkronisasi-tab",
      active: "/siproval/admin/sinkronisasi-tab",
    },
    {
      name: "Permission",
      icon: "solar:lock-keyhole-bold",
      url: "/siproval/admin/permission",
      active: "/siproval/admin/permission",
    },
  ],
} satisfies Record<
  Actor,
  {
    name: string;
    icon: string;
    url: string;
    active: string;
  }[]
>;

type Props = {
  actor?: Actor;
};

export default function SidebarSiproval({ actor }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  let resolvedActor: Actor = actor || "katim";
  if (!actor) {
    if (pathname.startsWith("/siproval/admin")) {
      resolvedActor = "superadmin";
    } else if (
      pathname.startsWith("/siproval/tu") ||
      pathname.startsWith("/siproval/budget-mapping")
    ) {
      resolvedActor = "tu";
    } else if (
      pathname.startsWith("/siproval/monev") ||
      pathname.startsWith("/siproval/show-monev") ||
      pathname.startsWith("/siproval/catatan") ||
      pathname.startsWith("/siproval/arahan-pimpinan") ||
      pathname.startsWith("/siproval/rhpk")
    ) {
      resolvedActor = "kabalai";
    } else {
      resolvedActor = "katim";
    }
  }

  const actorMenus = menus[resolvedActor] ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka menu"
        className="fixed left-4 top-4 z-40 rounded-lg bg-[#014083] p-2 text-white lg:hidden"
      >
        <Icon icon="solar:hamburger-menu-bold" width={24} />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col bg-[#014083] p-6 text-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/assets/images/bpom_without_label.webp"
            width={40}
            height={40}
            alt="Logo BBPOM"
            className="h-10 w-10 object-contain"
          />

          <div className="leading-tight">
            <p className="text-lg font-bold">SI MANDALIKA</p>
            <p className="text-xs uppercase tracking-widest text-white/60">
              SIPROVAL
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
            Aktor
          </p>
          <p className="mt-1 text-sm font-semibold capitalize">{resolvedActor}</p>
        </div>

        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Menu
        </p>

        <ul className="flex-1 space-y-2 overflow-y-auto">
          {actorMenus.length > 0 ? (
            actorMenus.map((menu) => {
              const active =
                pathname === menu.active ||
                pathname.startsWith(`${menu.active}/`);

              return (
                <li key={menu.url}>
                  <Link
                    href={menu.url}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon icon={menu.icon} width={24} height={24} />
                    <span className="text-sm font-medium">{menu.name}</span>
                  </Link>
                </li>
              );
            })
          ) : (
            <li className="rounded-xl bg-white/5 px-4 py-3 text-xs text-white/50">
              Belum ada menu untuk aktor ini.
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
