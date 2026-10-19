import AdminESapa from "@/components/admin/e-sapa/AdminESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin E-SAPA | BBPOM di Mataram",
    description: "Panel Administrasi Master Data E-SAPA BBPOM di Mataram",
};

export default function AdminESapaDashboardPage() {
    return <AdminESapa />;
}
