import { Suspense } from "react";
import MatriksRekomendasiTu from "@/components/siproval/tu/MatriksRekomendasiTu";

export default function MatriksRekomendasiTuPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">
          Memuat Matriks Rekomendasi Triwulan...
        </div>
      }
    >
      <MatriksRekomendasiTu />
    </Suspense>
  );
}

