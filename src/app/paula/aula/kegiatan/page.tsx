import AulaKegiatan from "@/components/paula/AulaKegiatan";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Daftar Kegiatan | PAULA",
};

export default function Page() {
    return <AulaKegiatan />;
}