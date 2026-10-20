import { Suspense } from "react";
import RekapitulasiAnggaran from "@/components/siproval/tu/RekapitulasiAnggaran";

export default function SiprovalRekapitulasiAnggaranPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-slate-500">
          Memuat rekapitulasi anggaran...
        </div>
      }
    >
      <RekapitulasiAnggaran />
    </Suspense>
  );
}
