"use client";

import { usePathname } from "next/navigation";
import ListMutations from "./ListMutations";
import FormMutation from "./FormMutation";
import LaporanMutasi from "./LaporanMutasi";
import FormLaporan from "./FormLaporan";

export default function Mutasi() {
    const pathname = usePathname();

    const isFormMutasi = pathname.startsWith("/sismora/mutasi/form");
    const isFormLaporan = pathname.startsWith("/sismora/mutasi/laporan/form");
    const isLaporan = pathname.startsWith("/sismora/mutasi/laporan");
    const isList = pathname === "/sismora/mutasi";

    const renderContent = () => {
        if (isFormMutasi) return <FormMutation />;
        if (isFormLaporan) return <FormLaporan />;
        if (isLaporan) return <LaporanMutasi />;
        if (isList) return <ListMutations />;
        return null;
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 uppercase">Mutasi Ruangan</h1>
            {renderContent()}
        </div>
    );
}
