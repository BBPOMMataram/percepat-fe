import MasterWilayah from "@/components/e-sapa/master/wilayah/MasterWilayah";
import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Master Wilayah E-SAPA | BBPOM di Mataram",
    description: "Data Master Wilayah Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function WilayahPage() {
    return (
        <LayoutESapa>
            <MasterWilayah />
        </LayoutESapa>
    );
}