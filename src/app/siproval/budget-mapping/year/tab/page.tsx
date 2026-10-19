import { Suspense } from "react";
import BudgetMappingTable from "@/components/siproval/tu/BudgetMappingTable";

export default function BudgetMappingTabTablePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Memuat tabel anggaran...</div>}>
      <BudgetMappingTable />
    </Suspense>
  );
}
