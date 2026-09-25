import MasterPetugas from "@/components/e-sapa/master/petugas/MasterPetugas";
import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Master Petugas E-SAPA | BBPOM di Mataram",
    description: "Data Master Petugas Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function PetugasPage() {
    return (
        <LayoutESapa>
            <MasterPetugas />
        </LayoutESapa>
    );
}