import LayoutESapa from "@/components/e-sapa/layout/LayoutESapa";
import Spd from "@/components/e-sapa/spd/Spd";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "SPD E-SAPA | BBPOM di Mataram",
    description: "Surat Perjalanan Dinas Elektronik Sistem Akuntabilitas Pertanggungjawaban Anggaran",
};

export default function SpdPage() {
    return (
        <LayoutESapa>
            <Spd />
        </LayoutESapa>
    );
}
