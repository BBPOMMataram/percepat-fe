import RiwayatPengajuan from "@/components/paula/PaulaUserDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Riwayat | PAULA",
};

export default function Page() {
    return <RiwayatPengajuan />;
}