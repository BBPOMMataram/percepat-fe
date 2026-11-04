import MobilSecurity from "@/components/paula/mobil/MobilSecurity";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Pos Jaga Security & Servis Armada | PAULA - BBPOM di Mataram",
    description: "Monitoring status servis armada, penanganan kerusakan, dan pemeriksaan Gate Pass kendaraan dinas",
};

export default function ServisMobilPage() {
    return (
        <PaulaLayout>
            <MobilSecurity initialTab="servis" />
        </PaulaLayout>
    );
}

