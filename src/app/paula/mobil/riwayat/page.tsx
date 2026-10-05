import MobilRiwayat from "@/components/paula/mobil/MobilRiwayat";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Riwayat Peminjaman Mobil | PAULA",
    description: "Riwayat pengajuan peminjaman kendaraan dinas.",
};

export default function RiwayatMobilPage() {
    return (
        <PaulaLayout>
            <MobilRiwayat />
        </PaulaLayout>
    );
}