import { Suspense } from "react";
import GoogleSheetKatim from "@/components/siproval/katim/GoogleSheetKatim";

export default function GoogleSheetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat data Google Sheet...</div>}>
      <GoogleSheetKatim />
    </Suspense>
  );
}
