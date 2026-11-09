import { Suspense } from "react";
import TestLocalTableKatim from "@/components/siproval/katim/TestLocalTableKatim";

// Lembar RHPK untuk TU: hanya lihat (perubahan data dilakukan Katim/PIC)
export default function TuRhpkViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          Memuat lembar RHPK (lihat saja)...
        </div>
      }
    >
      <TestLocalTableKatim isKabalaiReadOnly={true} />
    </Suspense>
  );
}
