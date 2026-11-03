import MobilSecurity from "@/components/paula/mobil/MobilSecurity";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Pos Jaga Security & Servis Armada | PAULA - BBPOM di Mataram",
    description: "Pemeriksaan Gate Pass keberangkatan & kepulangan, serta pemantauan servis berkala armada mobil dinas",
};

export default function SecurityMobilPage() {
    return (
        <PaulaLayout>
            <MobilSecurity />
        </PaulaLayout>
    );
}

