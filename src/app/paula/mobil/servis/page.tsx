import MobilServis from "@/components/paula/mobil/MobilServis";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Monitoring Servis & Kerusakan | PAULA - BBPOM di Mataram",
    description: "Jadwal servis berkala dan penanganan laporan kerusakan mobil dinas",
};

export default function ServisMobilPage() {
    return (
        <PaulaLayout>
            <MobilServis />
        </PaulaLayout>
    );
}

