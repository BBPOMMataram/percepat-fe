import { Suspense } from "react";
import BudgetMappingTabs from "@/components/siproval/tu/BudgetMappingTabs";

export default function BudgetMappingYearPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Memuat tab anggaran...</div>}>
      <BudgetMappingTabs />
    </Suspense>
  );
}
