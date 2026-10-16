import { Suspense } from "react";
import GoogleSheetKatim from "@/components/siproval/katim/GoogleSheetKatim";

export default function GoogleSheetsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          Memuat formulir Google Sheet...
        </div>
      }
    >
      <GoogleSheetKatim />
    </Suspense>
  );
}
