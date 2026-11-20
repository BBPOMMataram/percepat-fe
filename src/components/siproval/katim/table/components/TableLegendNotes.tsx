"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { ActiveTabDetail } from "../types/tableTypes";

export interface TableLegendNotesProps {
  activeTab: ActiveTabDetail | null;
}

export const TableLegendNotes: React.FC<TableLegendNotesProps> = ({
  activeTab,
}) => {
  const isCaputRo =
    activeTab?.id === 70 ||
    activeTab?.title?.toLowerCase().includes("caput ro");

  const isIndeksKie =
    activeTab?.id === 135 ||
    activeTab?.title?.toLowerCase().includes("indeks kie");

  if (!isCaputRo && !isIndeksKie) return null;

  return (
    <>
      {isCaputRo && (
        <div className="m-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 shadow-2xs">
          <Icon
            icon="solar:info-circle-bold"
            className="size-4 shrink-0 text-blue-600 mt-0.5"
          />
          <div className="leading-relaxed">
            <strong className="font-bold text-blue-950">
              Catatan Dokumen:
            </strong>{" "}
            Data Realisasi RO Sampel Obat, OBA, SK dan Kos dihitung dari
            data Realisasi Sampling tiap bulannya.
          </div>
        </div>
      )}

      {isIndeksKie && (
        <div className="m-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Keterangan Dokumen:
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-4 rounded bg-[#418ab3] shadow-xs inline-block" />
              <span className="font-bold text-[#1f4e78]">Ibu Win</span>
              <span className="text-slate-500 text-[11px]">
                (Evaluasi Survey Tatap Muka & Media - Skala 4)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-4 rounded bg-[#70ad47] shadow-xs inline-block" />
              <span className="font-bold text-[#385723]">Rumus</span>
              <span className="text-slate-500 text-[11px]">
                (Dihitung Otomatis: Indeks Tatap Muka, Indeks Media, Total
                Responden, Indeks Rata-rata, %Capaian)
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableLegendNotes;
