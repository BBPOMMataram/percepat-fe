import { Suspense } from "react";
import { UploadWorkflow } from "@/components/simanris/upload/upload-workflow";
import { ChartLoadingState } from "@/components/simanris/shared/ChartLoadingState";

export default function SimanrisUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ChartLoadingState heightClass="h-72" label="Menyiapkan modul upload Excel..." />
        </div>
      }
    >
      <UploadWorkflow />
    </Suspense>
  );
}
