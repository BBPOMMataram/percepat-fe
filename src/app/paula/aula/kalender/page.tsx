import AulaKalender from "@/components/paula/aula/AulaKalender";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kalender Kegiatan | PAULA",
};

export default function Page() {
    return <AulaKalender />;
}