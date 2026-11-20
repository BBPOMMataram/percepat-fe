import { Metadata } from "next";
import { SimanrisLandingView } from "@/components/simanris/landing/simanris-landing-view";

export const metadata: Metadata = {
  title: "SIMANRIS | Sistem Informasi Manajemen Risiko BBPOM di Mataram",
  description:
    "Portal resmi Sistem Informasi Manajemen Risiko Balai Besar Pengawas Obat dan Makanan di Mataram. Tata kelola risiko terintegrasi dan akuntabel.",
};

export default function SimanrisLandingPage() {
  return <SimanrisLandingView />;
}
