import AulaRiwayat from "@/components/paula/aula/AulaRiwayat";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Riwayat | PAULA",
};

export default function Page() {
    return <AulaRiwayat />;
}