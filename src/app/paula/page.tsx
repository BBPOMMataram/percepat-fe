import PaulaHome from "@/components/paula/PaulaHome";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PAULA | BBPOM di Mataram",
    description: "Aplikasi Peminjaman Aula dan Mobil BBPOM di Mataram",
};

export default function PaulaPage() {
    return <PaulaHome />;
}