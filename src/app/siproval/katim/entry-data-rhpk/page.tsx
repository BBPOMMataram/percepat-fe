import { Suspense } from "react";
import TestLocalTableKatim from "@/components/siproval/katim/TestLocalTableKatim";

export default function EntryDataRhpkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          Memuat formulir tabel RHPK...
        </div>
      }
    >
      <TestLocalTableKatim />
    </Suspense>
  );
}
