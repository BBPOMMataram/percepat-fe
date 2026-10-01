import DashboardPaulaAdmin from "@/components/admin/paula/DashboardPaulaAdmin";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard Admin | PAULA",
};

export default function Page() {
    return <DashboardPaulaAdmin />;
}