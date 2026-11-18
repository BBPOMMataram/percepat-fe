"use client";

import { useState } from "react";
import type { PaginatedData, TestingListItem } from "../types";
import { RiskLevelBadge } from "../shared/RiskLevelBadge";
import { TestingStatusBadge } from "./testing-status-badge";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Paperclip,
  User,
} from "lucide-react";

interface TestingListTableProps {
  records: PaginatedData<TestingListItem>;
  loading?: boolean;
  onSelectRisk: (riskRecordId: number) => void;
  onPageChange: (page: number) => void;
}

export function TestingListTable({
  records,
  loading = false,
  onSelectRisk,
  onPageChange,
}: TestingListTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const list = records?.data || [];

  if (!loading && list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#005baa]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-800">
          Tidak Ada Aktivitas Pengendalian yang Memenuhi Kriteria
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Sistem hanya menampilkan risiko dengan{" "}
          <b>Level Risiko Inheren ≥ 16</b> pada dataset aktif. Silakan pilih
          periode lain atau sesuaikan filter pencarian.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th className="py-3.5 px-4 w-32">Kode Risiko</th>
              <th className="py-3.5 px-4 w-40">Unit / Fungsi</th>
              <th className="py-3.5 px-4 w-28 text-center">Level Inheren</th>
              <th className="py-3.5 px-4 min-w-65">Aktivitas Pengendalian (Kolom O)</th>
              <th className="py-3.5 px-4 w-32 text-center">Status</th>
              <th className="py-3.5 px-4 w-44">Hasil Pengujian</th>
              <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm text-[#005baa]"></span>
                    <span>Memuat daftar aktivitas pengendalian...</span>
                  </div>
                </td>
              </tr>
            ) : (
              list.map((r, idx) => {
                const isExpanded = !!expandedRows[r.id];
                const status = r.testing_status;
                const t = r.testing;
                const rowNum =
                  (records.current_page - 1) * records.per_page + idx + 1;

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Row Num */}

                    <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                      {rowNum}
                    </td>

                    {/* Kode Risiko */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#004281] block">
                        {r.risk_code || "-"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Baris {r.source_row} ({r.source_sheet})
                      </span>
                    </td>

                    {/* Fungsi */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">
                        {r.function_name}
                      </span>
                      {r.category_name && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                          {r.category_name}
                        </span>
                      )}
                    </td>

                    {/* Inherent Level */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <RiskLevelBadge level={r.inherent_level} />
                        <span className="text-[10px] text-slate-400">
                          K: {r.inherent_likelihood ?? "-"} × D:{" "}
                          {r.inherent_impact ?? "-"}
                        </span>
                      </div>
                    </td>

                    {/* Aktivitas Pengendalian */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <p
                          className={`text-slate-800 leading-relaxed font-medium whitespace-pre-line ${
                            !isExpanded ? "line-clamp-2" : ""
                          }`}
                        >
                          {r.existing_controls || (
                            <span className="text-slate-400 italic">
                              Belum tersedia di file Excel
                            </span>
                          )}
                        </p>

                        {/* Collapsible toggle & Atribut Pengendalian preview */}
                        {r.control_attributes && (
                          <div className="pt-1">
                            {isExpanded ? (
                              <div className="rounded-lg bg-indigo-50/60 p-2.5 border border-indigo-100 mt-2 text-[11px] text-indigo-900">
                                <span className="font-bold block mb-0.5">
                                  Atribut Pengendalian (Kolom P):
                                </span>
                                <p className="whitespace-pre-line">
                                  {r.control_attributes}
                                </p>
                              </div>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => toggleExpand(r.id)}
                              className="text-[11px] font-bold text-[#005baa] hover:underline inline-flex items-center gap-0.5 mt-0.5"
                            >
                              {isExpanded ? (
                                <>
                                  Tutup detail <ChevronUp className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  Lihat selengkapnya{" "}
                                  <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <TestingStatusBadge status={status} size="sm" />
                    </td>

                    {/* Hasil Pengujian */}
                    <td className="py-3.5 px-4 text-[11px]">
                      {t &&
                      t.sample_count !== null &&
                      t.sample_count !== undefined ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            Sampel: <b>{t.sample_count}</b> (
                            {t.compliant_sample_count ?? 0} sesuai,{" "}
                            <span
                              className={
                                (t.non_compliant_sample_count ?? 0) > 0
                                  ? "text-amber-700 font-bold"
                                  : "text-slate-500"
                              }
                            >
                              {t.non_compliant_sample_count ?? 0} deviasi
                            </span>
                            )
                          </div>
                          {t.control_effectiveness_conclusion && (
                            <div className="text-[10px] text-emerald-700 font-bold">
                              {t.control_effectiveness_conclusion}
                            </div>
                          )}
                          {(r.supporting_link ||
                            (r.supporting_files_count ?? 0) > 0 ||
                            (t as any)?.supporting_link) && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold mt-0.5">
                              <Paperclip className="h-3 w-3 text-[#005baa] shrink-0" />
                              <span>
                                {(r.supporting_files_count ?? 0) > 0
                                  ? `${r.supporting_files_count} berkas data dukung`
                                  : "Tautan data dukung"}
                              </span>
                            </div>
                          )}
                          {(t.updated_by || (t as any)?.created_by) && (
                            <div className="text-[10px] text-slate-600 font-semibold flex items-center gap-1 mt-1 pt-1 border-t border-slate-100">
                              <User className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                              <span
                                className="truncate max-w-[130px]"
                                title={`Petugas entry: ${t.updated_by || (t as any)?.created_by}`}
                              >
                                {t.updated_by || (t as any)?.created_by}
                              </span>
                            </div>
                          )}
                          {t.updated_at && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              <span>{t.updated_at.split(" ")[0]}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Belum ada pengujian
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-center">
                      {r.can_edit === false ? (
                        <button
                          type="button"
                          onClick={() => onSelectRisk(r.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
                          title="Lihat Detail (Read-only — Bukan fungsi unit kerja Anda)"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Lihat</span>
                        </button>
                      ) : status === "completed" ? (
                        <button
                          type="button"
                          onClick={() => onSelectRisk(r.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Edit / Tinjau Hasil Pengujian"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      ) : status === "draft" ? (
                        <button
                          type="button"
                          onClick={() => onSelectRisk(r.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                          title="Lanjutkan Pengisian Draft"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Lanjut</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectRisk(r.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#004281] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#005baa] shadow-2xs transition-colors"
                          title="Mulai Isi Pengujian Aktivitas Pengendalian"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Isi Uji</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {records.total > records.per_page && (
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 gap-2 text-xs text-slate-600">
          <div>
            Menampilkan <b>{records.from ?? 0}</b> – <b>{records.to ?? 0}</b>{" "}
            dari <b>{records.total}</b> aktivitas pengendalian
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={records.current_page <= 1}
              onClick={() => onPageChange(records.current_page - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="px-2 font-bold text-[#004281]">
              Hal {records.current_page} dari {records.last_page}
            </span>
            <button
              type="button"
              disabled={records.current_page >= records.last_page}
              onClick={() => onPageChange(records.current_page + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
