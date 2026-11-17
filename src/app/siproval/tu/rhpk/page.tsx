"use client";

import { Suspense, useState } from "react";
import { Icon } from "@iconify/react";
import TestLocalTableKatim from "@/components/siproval/katim/TestLocalTableKatim";
import RekapRhpkModule from "@/components/siproval/rekap-rhpk/RekapRhpkModule";

// Modul Rekap RHPK TU (baca-saja seluruh 28 IKSK) sekaligus mempertahankan Lembar Kerja RHPK (Lihat) existing
export default function TuRhpkViewPage() {
  const [activeTab, setActiveTab] = useState<"rekap" | "lembar">("rekap");

  const viewSwitcher = (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => setActiveTab("rekap")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
          activeTab === "rekap"
            ? "bg-white text-[#005baa] shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Icon icon="solar:clipboard-check-bold" width={14} />
        <span>Rekap RHPK Digital</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("lembar")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
          activeTab === "lembar"
            ? "bg-white text-[#005baa] shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Icon icon="solar:table-2-bold" width={14} />
        <span>Lembar Kerja RHPK</span>
      </button>
    </div>
  );

  return (
    <div className="w-full min-w-0">
      {activeTab === "rekap" ? (
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Memuat Rekap RHPK seluruh IKSK...
            </div>
          }
        >
          <RekapRhpkModule
            actorMode="tu"
            activeView="rekap"
            onChangeView={(v) => setActiveTab(v === "sheet" ? "lembar" : "rekap")}
            sheetViewLabel="Lembar Kerja RHPK"
          />
        </Suspense>
      ) : (
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Memuat lembar RHPK (lihat saja)...
            </div>
          }
        >
          <TestLocalTableKatim
            isKabalaiReadOnly={true}
            headerRightSlot={viewSwitcher}
          />
        </Suspense>
      )}
    </div>
  );
}
