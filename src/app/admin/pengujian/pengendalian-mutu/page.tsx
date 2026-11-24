import type { Metadata } from "next";
import AdminPengendalianMutu from "@/components/admin/pengujian/pengendalian-mutu/AdminPengendalianMutu";

export const metadata: Metadata = {
    title: "Master Data Pengendalian Mutu | BBPOM di Mataram",
    description: "Pengelolaan data master penyelia dan konfigurasi pengendalian mutu laboratorium mikrobiologi.",
};

export default function AdminPengendalianMutuPage() {
    return <AdminPengendalianMutu />;
}
