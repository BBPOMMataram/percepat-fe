import MasterKegiatan from "@/components/e-sapa/master/kegiatan/MasterKegiatan";
import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Master Kegiatan E-SAPA | BBPOM di Mataram",
    description: "Data Master Kegiatan Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function KegiatanPage() {
    return (
        <LayoutESapa>
            <MasterKegiatan />
        </LayoutESapa>
    );
}