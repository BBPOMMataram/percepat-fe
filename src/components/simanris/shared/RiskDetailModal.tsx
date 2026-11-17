"use client";

import { useEffect, useState } from "react";
import { X, FileSpreadsheet, AlertTriangle, CheckCircle2, ClipboardList, ShieldCheck } from "lucide-react";
import { simanrisApi, extractApiErrorMessage } from "../lib/simanrisApi";
import type { RiskDetailData } from "../types";
import { RiskLevelBadge } from "./RiskLevelBadge";
import { ChartLoadingState } from "./ChartLoadingState";

interface RiskDetailModalProps {
  riskId: number | null;
  highMin?: number;
  onClose: () => void;
}

export function RiskDetailModal({
  riskId,
  highMin = 16,
  onClose,
}: RiskDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RiskDetailData | null>(null);

  useEffect(() => {
    if (!riskId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    simanrisApi
      .getRiskDetail(riskId)
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [riskId]);

  if (!riskId) return null;

  const r = detail?.record;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#004281] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-blue-200">
              Detail Identifikasi & Penelusuran Risiko
            </p>
            <h3 className="text-base font-bold">
              {r?.risk_code || "Kode Tidak Tercantum"} —{" "}
              {r?.risk_function?.name || r?.raw_unit_name || "Unit/Fungsi"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-100 hover:bg-white/15"
            aria-label="Tutup modal detail"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {loading && <ChartLoadingState heightClass="h-48" label="Mengambil detail risiko..." />}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && r && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#005baa]" />
                  Sheet: {r.source_sheet || "-"} | Baris Excel: {r.source_row ?? "-"}
                </span>
                {r.risk_category?.name || r.raw_category_name ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-[#005baa]">
                    Kategori: {r.risk_category?.name || r.raw_category_name}
                  </span>
                ) : null}
                {r.risk_source && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    Sumber: {r.risk_source}
                  </span>
                )}
                {r.has_matrix_anomaly && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Anomali Matriks Excel
                  </span>
                )}
                {r.is_duplicate_code_candidate && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 font-semibold text-purple-800">
                    Kandidat Kode Ganda
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Skor Inheren (Sebelum Pengendalian)
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-600 space-x-3">
                      <span>Kemungkinan: <b>{r.inherent_likelihood ?? "-"}</b></span>
                      <span>Dampak: <b>{r.inherent_impact ?? "-"}</b></span>
                    </div>
                    <RiskLevelBadge level={r.inherent_level} highMin={highMin} />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Skor Residual (Setelah Pengendalian)
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-600 space-x-3">
                      <span>Kemungkinan: <b>{r.residual_likelihood ?? "-"}</b></span>
                      <span>Dampak: <b>{r.residual_impact ?? "-"}</b></span>
                    </div>
                    <RiskLevelBadge level={r.residual_level} highMin={highMin} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Peristiwa Risiko (Risk Event)
                  </h4>
                  <p className="mt-1 font-medium text-slate-900">
                    {r.risk_event || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Proses Bisnis</h4>
                    <p className="mt-0.5 text-slate-700">{r.business_process || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Sasaran / Tujuan</h4>
                    <p className="mt-0.5 text-slate-700">{r.objective || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Penyebab Risiko</h4>
                    <p className="mt-0.5 text-slate-700">{r.risk_cause || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Dampak</h4>
                    <p className="mt-0.5 text-slate-700">{r.risk_impact_desc || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Pengendalian Existing</h4>
                    <p className="mt-0.5 text-slate-700">{r.existing_control || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Efektivitas Pengendalian</h4>
                    <p className="mt-0.5 text-slate-700">{r.control_effectiveness || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Relasi Data Pendukung */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#004281]">
                    <ClipboardList className="h-4 w-4" />
                    Rencana Tindak Pengendalian ({detail?.treatment_plans.length || 0})
                  </div>
                  {detail?.treatment_plans.length ? (
                    <ul className="mt-2 space-y-2 text-xs text-slate-700">
                      {detail.treatment_plans.map((rtp) => (
                        <li key={rtp.id} className="rounded-lg bg-slate-50 p-2">
                          <div className="font-semibold">
                            {rtp.treatment_plan || rtp.action_plan || "Tindak lanjut"}
                          </div>
                          {(rtp.pic || rtp.target_timeline) && (
                            <div className="mt-1 text-[11px] text-slate-500">
                              PIC: {rtp.pic || "-"} · Target: {rtp.target_timeline || "-"}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Tidak ada RTP tertaut kode ini.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#004281]">
                    <ShieldCheck className="h-4 w-4" />
                    Pengujian Pengendalian ({detail?.control_testings.length || 0})
                  </div>
                  {detail?.control_testings.length ? (
                    <ul className="mt-2 space-y-2 text-xs text-slate-700">
                      {detail.control_testings.map((ct) => (
                        <li key={ct.id} className="rounded-lg bg-slate-50 p-2">
                          <div className="font-semibold">{ct.control_name || "Pengujian"}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            Hasil: {ct.testing_result || "-"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Belum ada data pengujian.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#004281]">
                    <CheckCircle2 className="h-4 w-4" />
                    Reviu Manajemen ({detail?.reviews.length || 0})
                  </div>
                  {detail?.reviews.length ? (
                    <ul className="mt-2 space-y-2 text-xs text-slate-700">
                      {detail.reviews.map((rv) => (
                        <li key={rv.id} className="rounded-lg bg-slate-50 p-2">
                          <div className="font-semibold">{rv.review_result || "Catatan reviu"}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {rv.reviewer || "-"} {rv.review_date ? `(${rv.review_date})` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Belum ada catatan reviu.</p>
                  )}
                </div>
              </div>

              {r.raw_data && (
                <details className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <summary className="cursor-pointer font-semibold text-slate-700">
                    Lihat Raw Snapshot Baris Excel (Traceability)
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] text-slate-100">
                    {JSON.stringify(r.raw_data, null, 2)}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
