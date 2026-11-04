import ETamuGuestBook from "@/components/e-tamu/ETamuGuestBook";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "E-Tamu | BBPOM di Mataram",
    description: "Buku Tamu Digital Balai Besar POM di Mataram",
};

export default function ETamuPage() {
    return <ETamuGuestBook />;
}