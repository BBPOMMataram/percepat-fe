import AulaKalender from "@/components/paula/AulaKalender";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kalender Kegiatan | PAULA",
};

export default function Page() {
    return <AulaKalender />;
}