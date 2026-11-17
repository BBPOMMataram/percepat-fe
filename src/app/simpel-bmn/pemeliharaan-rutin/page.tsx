import { Metadata } from "next";
import RiwayatPemeliharaanMain from "@/components/riwayat-pemeliharaan/RiwayatPemeliharaanMain";

export const metadata: Metadata = {
  title: "Pemeliharaan Rutin & Riwayat Aset | SIMPEL BMN | BBPOM di Mataram",
  description:
    "Modul digital pencatatan dan monitoring riwayat pemeliharaan serta pemeriksaan aset fisik/BMN BBPOM di Mataram.",
};

export default function PemeliharaanRutinSimpelBmnPage() {
  return <RiwayatPemeliharaanMain />;
}

