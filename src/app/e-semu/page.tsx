import DashboardESemu from "@/components/e-semu/DashboardESemu";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "E-SEMU | BBPOM di Mataram",
    description: "Elektronik Sistem Manajemen Mutu BBPOM di Mataram",
};

export default function ESemuPage() {
    return <DashboardESemu />;
}