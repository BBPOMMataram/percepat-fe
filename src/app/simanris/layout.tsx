"use client";

import { usePathname } from "next/navigation";
import SimanrisShell from "@/components/simanris/layout/SimanrisShell";

export default function SimanrisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/simanris";

  if (isLandingPage) {
    return <>{children}</>;
  }

  return <SimanrisShell>{children}</SimanrisShell>;
}
