import PengujianMain from "@/components/pengujian/PengujianMain";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Laboratorium Pengujian BBPOM di Mataram - Upload & Generator QR Code PDF",
    description:
        "Sistem Pengolahan Dokumen & Generator QR Code Laporan Pengujian",
};

export default function PengujianPage() {
    return <PengujianMain />;
}
