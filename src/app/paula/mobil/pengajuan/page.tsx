import MobilDashboard from "@/components/paula/mobil/MobilPengajuan";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Form Peminjaman Mobil | PAULA",
    description: "Form untuk mengajukan peminjaman kendaraan dinas BBPOM di Mataram.",
};

export default function MobilDashboardPage() {
    return (
        <PaulaLayout>
            <MobilDashboard />
        </PaulaLayout>
    );
}