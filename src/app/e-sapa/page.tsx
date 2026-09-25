import ESapa from "@/components/e-sapa/ESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "E-SAPA | BBPOM di Mataram",
    description: "Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function ESapaLandingPage() {
    // Memanggil komponen landing page yang sudah kita buat sebelumnya
    return <ESapa />;
}