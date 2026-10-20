import { Suspense } from "react";
import BudgetMappingRekap from "@/components/siproval/tu/BudgetMappingRekap";

export default function BudgetMappingRekapPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">
          Memuat rekapitulasi anggaran...
        </div>
      }
    >
      <BudgetMappingRekap />
    </Suspense>
  );
}

