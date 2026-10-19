import { Suspense } from "react";
import LaporanEvaluasiTu from "@/components/siproval/tu/LaporanEvaluasiTu";

export default function LaporanEvaluasiTuPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">
          Memuat Berita Acara Evaluasi Internal...
        </div>
      }
    >
      <LaporanEvaluasiTu />
    </Suspense>
  );
}

