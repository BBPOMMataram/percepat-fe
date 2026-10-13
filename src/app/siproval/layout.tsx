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
  const isLanding = pathname === "/siproval";

  return (
    <LayoutSiproval>
      {isLanding ? (
        children
      ) : (
        <div className="min-h-screen bg-slate-50">
          <SidebarSiproval />

          <div className="min-h-screen min-w-0 lg:ml-72 flex flex-col">
            <HeaderSiproval />
            <main className="flex-1 p-6 lg:p-8">{children}</main>
          </div>
        </div>
      )}
    </LayoutSiproval>
  );
}
