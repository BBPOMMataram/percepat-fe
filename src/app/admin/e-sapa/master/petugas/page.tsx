import AdminESapa from "@/components/admin/e-sapa/AdminESapa";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Master Petugas Admin E-SAPA | BBPOM di Mataram",
    description: "Pengelolaan Data Master Petugas E-SAPA",
};

export default function Page() {
    return <AdminESapa />;
}
