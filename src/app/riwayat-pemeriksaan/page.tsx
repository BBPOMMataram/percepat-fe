import { Metadata } from "next";
import RiwayatPemeriksaanMain from "@/components/riwayat-pemeriksaan/RiwayatPemeriksaanMain";

export const metadata: Metadata = {
  title: "Riwayat Pemeliharaan Aset | BBPOM di Mataram",
  description:
    "Modul digital pencatatan dan monitoring riwayat pemeliharaan serta pemeriksaan aset fisik/BMN (Genset, AC, dll) BBPOM di Mataram.",
};

export default function RiwayatPemeriksaanPage() {
  return <RiwayatPemeriksaanMain />;
}

