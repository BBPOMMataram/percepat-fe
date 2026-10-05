import MobilKalender from "@/components/paula/mobil/MobilKalender";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kalender Mobil | PAULA - BBPOM di Mataram",
    description: "Kalender jadwal peminjaman kendaraan operasional BBPOM di Mataram",
};

export default function KalenderMobilPage() {
    return (
                <PaulaLayout>
                    <MobilKalender />
                </PaulaLayout>
            );
}