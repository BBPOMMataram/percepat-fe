import MasterSuratTugas from "@/components/e-sapa/surat-tugas/SuratTugas";
import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Master Surat Tugas E-SAPA | BBPOM di Mataram",
    description: "Data Master Surat Tugas Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function SuratTugasPage() {
    return (
        <LayoutESapa>
            <MasterSuratTugas />
        </LayoutESapa>
    );
}