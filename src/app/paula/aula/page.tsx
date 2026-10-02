import AulaDashboard from "@/components/paula/aula/AulaDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard Aula | PAULA",
};

export default function Page() {
    return <AulaDashboard />;
}