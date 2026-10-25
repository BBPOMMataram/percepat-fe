import { Suspense } from "react";
import RealisasiRoTable from "@/components/siproval/tu/RealisasiRoTable";

export const metadata = {
  title: "Realisasi RO | SIPROVAL BBPOM Mataram",
  description: "Pemantauan dan Pengelolaan Data Realisasi Rincian Output (RO) BBPOM di Mataram",
};

export default function RealisasiRoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Memuat data Realisasi RO...</div>}>
      <RealisasiRoTable />
    </Suspense>
  );
}
