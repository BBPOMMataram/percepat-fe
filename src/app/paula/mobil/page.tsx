import MobilDashboard from "@/components/paula/mobil/MobilDashboard";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard Peminjaman Mobil | PAULA",
    description: "Dashboard untuk pengelolaan peminjaman kendaraan dinas BBPOM di Mataram.",
};

export default function MobilDashboardPage() {
    return (
        <PaulaLayout>
            <MobilDashboard />
        </PaulaLayout>
    );
}