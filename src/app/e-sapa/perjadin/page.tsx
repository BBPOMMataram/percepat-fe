import PerjadinComponent from "@/components/e-sapa/perjadin/Perjadin";
import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Perjadin E-SAPA | BBPOM di Mataram",
    description: "Data Perjalanan Dinas Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function PerjadinPage() {
    return (
        <LayoutESapa>
            <PerjadinComponent />
        </LayoutESapa>
    );
}