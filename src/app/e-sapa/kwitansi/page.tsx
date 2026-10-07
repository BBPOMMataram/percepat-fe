import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import Kwitansi from "@/components/e-sapa/kwitansi/Kwitansi";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kwitansi E-SAPA | BBPOM di Mataram",
    description: "Kwitansi Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function KwitansiPage() {
    return (
        <LayoutESapa>
            <Kwitansi />
        </LayoutESapa>
    );
}
