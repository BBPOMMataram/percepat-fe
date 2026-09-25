import DashboardESapa from "@/components/e-sapa/DashboardESapa";
import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard E-SAPA | BBPOM di Mataram",
    description: "Dashboard Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function DashboardESapaPage() {
    return (
        <LayoutESapa>
            <DashboardESapa />
        </LayoutESapa>
    );
}