import { Metadata } from "next";
import RiwayatPemeliharaanMain from "@/components/riwayat-pemeliharaan/RiwayatPemeliharaanMain";

export const metadata: Metadata = {
  title: "Riwayat Pemeliharaan Aset | BBPOM di Mataram",
  description:
    "Modul digital pencatatan dan monitoring riwayat pemeliharaan serta pemeriksaan aset fisik/BMN (Genset, AC, dll) BBPOM di Mataram.",
};

export default function RiwayatPemeliharaanPage() {
  return <RiwayatPemeliharaanMain />;
}

