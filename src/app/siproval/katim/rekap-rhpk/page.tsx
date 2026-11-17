"use client";

import { Suspense, useState } from "react";
import { Icon } from "@iconify/react";
import RekapRhpkModule from "@/components/siproval/rekap-rhpk/RekapRhpkModule";
import TestLocalTableKatim from "@/components/siproval/katim/TestLocalTableKatim";

export default function KatimRekapRhpkPage() {
  const [activeTab, setActiveTab] = useState<"rekap" | "rekap_balai">("rekap");

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
        onClick={() => setActiveTab("rekap_balai")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
          activeTab === "rekap_balai"
            ? "bg-white text-[#005baa] shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Icon icon="solar:table-2-bold" width={14} />
        <span>Tabel File Rekap Balai</span>
      </button>
    </div>
  );

  return (
    <div className="w-full min-w-0">
      {activeTab === "rekap" ? (
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Memuat modul Rekap RHPK Katim...
            </div>
          }
        >
          <RekapRhpkModule
            actorMode="katim"
            activeView="rekap"
            onChangeView={(v) =>
              setActiveTab(v === "sheet" ? "rekap_balai" : "rekap")
            }
            sheetViewLabel="Tabel File Rekap Balai"
          />
        </Suspense>
      ) : (
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Memuat tabel file Rekap Data RHPK Balai (baca-saja)...
            </div>
          }
        >
          <TestLocalTableKatim
            isKabalaiReadOnly={true}
            rekapBalaiOnly={true}
            headerRightSlot={viewSwitcher}
          />
        </Suspense>
      )}
    </div>
  );
}
