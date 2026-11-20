import { Metadata } from "next";
import { DashboardContent } from "@/components/simanris/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard Operasional | SIMANRIS BBPOM di Mataram",
  description:
    "Pemantauan analitik perkembangan risiko, sebaran per fungsi kerja, matriks inheren vs residual, dan prioritas risiko tinggi BBPOM di Mataram.",
};

export default function SimanrisDashboardPage() {
  return <DashboardContent />;
}
