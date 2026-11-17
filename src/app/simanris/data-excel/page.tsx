import { Suspense } from "react";
import { DataExcelView } from "@/components/simanris/data-excel/data-excel-view";
import { ChartLoadingState } from "@/components/simanris/shared/ChartLoadingState";

export const metadata = {
  title: "Data Excel — SIMANRIS BBPOM di Mataram",
  description:
    "Kelola unggahan dan riwayat file manajemen risiko berdasarkan periode dan tahun.",
};

export default function SimanrisDataExcelPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ChartLoadingState
            heightClass="h-72"
            label="Menyiapkan halaman Data Excel..."
          />
        </div>
      }
    >
      <DataExcelView />
    </Suspense>
  );
}
