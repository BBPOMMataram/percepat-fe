import MobilSecurity from "@/components/paula/mobil/MobilSecurity";
import PaulaLayout from "@/components/paula/layout/PaulaAulaLayout";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Pos Security (Gate Pass) | PAULA - BBPOM di Mataram",
    description: "Pemeriksaan keberangkatan dan kepulangan kendaraan dinas oleh Security",
};

export default function SecurityMobilPage() {
    return (
        <PaulaLayout>
            <MobilSecurity />
        </PaulaLayout>
    );
}

