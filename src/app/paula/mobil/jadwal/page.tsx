import MobilJadwal from "@/components/paula/mobil/MobilJadwal";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Jadwal Mobil | PAULA - BBPOM di Mataram",
    description: "Jadwal peminjaman kendaraan operasional BBPOM di Mataram",
};

export default function JadwalMobilPage() {
    return (
            <PaulaLayout>
                <MobilJadwal />
            </PaulaLayout>
        );
}