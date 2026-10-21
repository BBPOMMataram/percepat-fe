import EditPengajuanPaulaAdmin from "@/components/admin/paula/EditPengajuanPaulaAdmin";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Edit Pengajuan Aula | Admin PAULA",
};

export default function Page() {
    return <EditPengajuanPaulaAdmin />;
}
