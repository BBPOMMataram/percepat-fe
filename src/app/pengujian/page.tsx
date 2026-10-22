import PengujianMain from "@/components/pengujian/PengujianMain";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Laboratorium Pengujian",
    description:
        "Sistem Pengujian Laboratorium Terpadu BBPOM di Mataram - Upload Excel & Generator QR Code PDF",
};

export default function PengujianPage() {
    return <PengujianMain />;
}
