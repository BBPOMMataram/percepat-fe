"use client";

import { usePathname } from "next/navigation";
import LayoutSiproval from "@/components/siproval/layout/LayoutSiproval";
import SidebarSiproval from "@/components/siproval/layout/SidebarSiproval";
import HeaderSiproval from "@/components/siproval/layout/HeaderSiproval";

export default function SiprovalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOutsideSystem =
    pathname === "/siproval" || pathname?.startsWith("/siproval/whats-new");

  // Halaman luar (Landing Page portal & What's New) TIDAK memakai LayoutSiproval internal
  if (isOutsideSystem) {
    return <>{children}</>;
  }

  return (
    <LayoutSiproval>
      <div className="min-h-screen bg-slate-50">
        <SidebarSiproval />

        <div className="min-h-screen min-w-0 lg:ml-64 xl:ml-72 flex flex-col">
          <HeaderSiproval />
          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 min-w-0">{children}</main>
        </div>
      </div>
    </LayoutSiproval>
  );
}
