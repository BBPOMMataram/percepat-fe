"use client";

import { AlertTriangle, CheckCircle2, FileWarning, SearchCheck } from "lucide-react";
import type { DataQualityData } from "../types";
import { ChartLoadingState } from "../shared/ChartLoadingState";

interface DataQualityCardProps {
  data: DataQualityData | null;
  loading: boolean;
  onOpenModal: () => void;
}

export function DataQualityCard({
  data,
  loading,
  onOpenModal,
}: DataQualityCardProps) {
  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <ChartLoadingState heightClass="h-52" label="Memuat status kualitas data..." />
      </div>
    );
  }

  const s = data?.summary;
  const recon = data?.reconciliation_summary;

  const metrics = [
    { label: "Anomali Matriks Excel", value: s?.matrix_anomalies ?? 0, accent: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "Kode Risiko Ganda (Dipertahankan)", value: s?.duplicate_candidates ?? 0, accent: "text-purple-700 bg-purple-50 border-purple-200" },
    { label: "Kode Kosong / Tidak Lengkap", value: (s?.missing_risk_codes ?? 0) + (s?.incomplete_risk_codes ?? 0), accent: "text-orange-700 bg-orange-50 border-orange-200" },
    { label: "Selisih Rekonsiliasi Sheet", value: s?.reconciliation_issues ?? 0, accent: "text-rose-700 bg-rose-50 border-rose-200" },
    { label: "Fungsi / Kategori Belum Termapping", value: (s?.missing_functions ?? 0) + (s?.missing_categories ?? 0), accent: "text-slate-700 bg-slate-50 border-slate-200" },
    { label: "Penilaian Inheren/Residual Kosong", value: s?.missing_assessments ?? 0, accent: "text-slate-700 bg-slate-50 border-slate-200" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Kualitas Data &amp; Rekonsiliasi Workbook
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Anomali dicatat transparan tanpa mengubah skor asli Excel atau menghapus baris.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenModal}
            disabled={!data || !data.batch_id}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#005baa]/25 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-100 disabled:opacity-50"
          >
            <SearchCheck className="h-3.5 w-3.5" />
            Rincian Temuan ({(s?.total_errors ?? 0) + (s?.total_warnings ?? 0)})
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {metrics.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={onOpenModal}
              disabled={!data?.batch_id}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-xs disabled:opacity-60 ${m.accent}`}
            >
              <div className="text-lg font-extrabold leading-none">{m.value}</div>
              <div className="mt-1.5 text-[11px] font-medium leading-tight">
                {m.label}
              </div>
            </button>
          ))}
        </div>

        {recon && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              {Number(recon.kompilasi_count ?? 0) ===
              Number(recon.function_sheets_total ?? 0) ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <FileWarning className="h-4 w-4 text-amber-600" />
              )}
              Ringkasan Rekonsiliasi Lintas Sheet
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
              {recon.kompilasi_count !== undefined && (
                <span>
                  Kompilasi: <b>{recon.kompilasi_count}</b> baris
                </span>
              )}
              {recon.function_sheets_total !== undefined && (
                <span>
                  Total Sheet Fungsi: <b>{recon.function_sheets_total}</b> baris
                </span>
              )}
              {recon.sheet8_total !== undefined && recon.sheet8_total !== null && (
                <span>
                  Ringkasan Sheet8: <b>{recon.sheet8_total}</b>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {data && data.batch_id && (s?.total_errors ?? 0) > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Terdapat {s?.total_errors} temuan error pada batch ini. Klik &ldquo;Rincian Temuan&rdquo; untuk audit.
        </div>
      )}
    </div>
  );
}
