"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import {
  MONTH_NAMES,
  MonitoringHistoryRecord,
  MonitoringItem,
} from "./types";

interface Props {
  year: number;
  month: number;
  canEdit: boolean;
  monitoringItems: MonitoringItem[];
  monitoringHistory: MonitoringHistoryRecord[];
  savingId: number | null;
  onSaveMonitoring: (payload: {
    kendala_record_id: number;
    reporting_year: number;
    reporting_month: number;
    progress_status: "sudah" | "belum";
    progress_note: string;
    new_timeline_date: string | null;
  }) => Promise<void>;
}

interface DraftRowState {
  progress_status: "sudah" | "belum";
  progress_note: string;
  new_timeline_date: string;
}

export default function RekapRhpkMonitoringSection({
  year,
  month,
  canEdit,
  monitoringItems,
  monitoringHistory,
  savingId,
  onSaveMonitoring,
}: Props) {
  const [drafts, setDrafts] = useState<Record<number, DraftRowState>>({});
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const initial: Record<number, DraftRowState> = {};
    monitoringItems.forEach((item) => {
      initial[item.id] = {
        progress_status:
          item.current_month_update?.progress_status ||
          (item.status === "resolved" ? "sudah" : "belum"),
        progress_note: item.current_month_update?.progress_note || "",
        new_timeline_date:
          item.current_month_update?.new_timeline_date ||
          item.current_timeline_date ||
          item.initial_timeline_date ||
          "",
      };
    });
    setDrafts(initial);
  }, [monitoringItems, month, year]);

  const updateDraft = (id: number, patch: Partial<DraftRowState>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          progress_status: "belum",
          progress_note: "",
          new_timeline_date: "",
        }),
        ...patch,
      },
    }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200 overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
              8
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monitoring Progress Penyelesaian Kendala (Bulan Sebelumnya)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kendala sebelum{" "}
                <span className="font-semibold text-slate-700">
                  {MONTH_NAMES[month - 1]} {year}
                </span>{" "}
                tetap dipantau sampai statusnya dinyatakan{" "}
                <span className="font-semibold text-emerald-700">
                  Sudah Selesai
                </span>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
          >
            <Icon icon="solar:clipboard-list-bold" width={15} />
            {showHistory
              ? "Tutup Riwayat"
              : `Lihat Riwayat (${monitoringHistory.length})`}
          </button>
        </div>

        {month === 1 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
            Bulan Januari merupakan awal periode pelaporan tahun {year}; belum ada
            kendala bulan sebelumnya pada tahun berjalan.
          </div>
        ) : monitoringItems.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" width={17} />
            Tidak ada kendala terbuka dari bulan sebelumnya untuk{" "}
            {MONTH_NAMES[month - 1]} {year}.
          </div>
        ) : (
          <div className="space-y-3">
            {monitoringItems.map((item) => {
              const draft = drafts[item.id] || {
                progress_status: "belum",
                progress_note: "",
                new_timeline_date: item.current_timeline_date || "",
              };
              const editable = canEdit && item.can_update;
              const isSaving = savingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                        Asal: {MONTH_NAMES[item.origin_month - 1]} {year}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                        PIC: {item.owner_name}
                      </span>
                      {item.current_timeline_date && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                          <Icon icon="solar:calendar-bold" width={12} />
                          Timeline: {item.current_timeline_date}
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        item.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {item.status === "resolved"
                        ? `Selesai (${MONTH_NAMES[(item.resolved_month || month) - 1]})`
                        : "Belum Terselesaikan"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-slate-200/80 text-xs space-y-1.5">
                    <div>
                      <span className="font-semibold text-slate-500">
                        Kendala:{" "}
                      </span>
                      <span className="text-slate-800 whitespace-pre-line">
                        {item.kendala_text}
                      </span>
                    </div>
                    {item.rtl_text && (
                      <div>
                        <span className="font-semibold text-slate-500">
                          RTL Sebelumnya:{" "}
                        </span>
                        <span className="text-slate-700 whitespace-pre-line">
                          {item.rtl_text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Penyelesaian (Radio Bullet Terisi) */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-xs font-semibold text-slate-700">
                        Status di Bulan {MONTH_NAMES[month - 1]}:
                      </span>

                      <label
                        className={`inline-flex items-center gap-2 text-xs font-medium ${
                          editable ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`mon-status-${item.id}`}
                          className="sr-only"
                          disabled={!editable}
                          checked={draft.progress_status === "sudah"}
                          onChange={() =>
                            updateDraft(item.id, { progress_status: "sudah" })
                          }
                        />
                        <span
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            draft.progress_status === "sudah"
                              ? "border-emerald-600"
                              : "border-slate-300"
                          }`}
                        >
                          {draft.progress_status === "sudah" && (
                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          )}
                        </span>
                        <span className="text-emerald-800 font-semibold">
                          Sudah Selesai
                        </span>
                      </label>

                      <label
                        className={`inline-flex items-center gap-2 text-xs font-medium ${
                          editable ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`mon-status-${item.id}`}
                          className="sr-only"
                          disabled={!editable}
                          checked={draft.progress_status === "belum"}
                          onChange={() =>
                            updateDraft(item.id, { progress_status: "belum" })
                          }
                        />
                        <span
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            draft.progress_status === "belum"
                              ? "border-amber-600"
                              : "border-slate-300"
                          }`}
                        >
                          {draft.progress_status === "belum" && (
                            <span className="h-2 w-2 rounded-full bg-amber-600" />
                          )}
                        </span>
                        <span className="text-amber-800 font-semibold">
                          Belum Selesai (Perpanjang / Lanjutkan)
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {draft.progress_status === "belum" && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Timeline Penyelesaian Baru{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            disabled={!editable}
                            value={draft.new_timeline_date}
                            onChange={(e) =>
                              updateDraft(item.id, {
                                new_timeline_date: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-100"
                          />
                        </div>
                      )}

                      <div
                        className={
                          draft.progress_status === "belum"
                            ? "sm:col-span-2"
                            : "sm:col-span-3"
                        }
                      >
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Catatan Progres Tindak Lanjut
                        </label>
                        <input
                          type="text"
                          disabled={!editable}
                          placeholder="Tuliskan progres atau kendala lanjutan di bulan ini..."
                          value={draft.progress_note}
                          onChange={(e) =>
                            updateDraft(item.id, {
                              progress_note: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-100"
                        />
                      </div>
                    </div>

                    {editable ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-500">
                          {item.current_month_update?.updated_at
                            ? `Terakhir diperbarui oleh ${item.current_month_update.updated_by_name}`
                            : "Belum disimpan untuk bulan ini"}
                        </span>
                        <button
                          type="button"
                          disabled={
                            isSaving ||
                            (draft.progress_status === "belum" &&
                              !draft.new_timeline_date)
                          }
                          onClick={() =>
                            onSaveMonitoring({
                              kendala_record_id: item.id,
                              reporting_year: year,
                              reporting_month: month,
                              progress_status: draft.progress_status,
                              progress_note: draft.progress_note,
                              new_timeline_date:
                                draft.progress_status === "belum"
                                  ? draft.new_timeline_date
                                  : null,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#005baa] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#004687] disabled:opacity-50"
                        >
                          <Icon
                            icon={
                              isSaving
                                ? "solar:refresh-circle-bold"
                                : "solar:diskette-bold"
                            }
                            width={14}
                            className={isSaving ? "animate-spin" : ""}
                          />
                          {isSaving ? "Menyimpan..." : "Simpan Progress"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] italic text-slate-500">
                        {canEdit
                          ? "Catatan monitoring milik rekan Katim lain (hanya baca)."
                          : "Mode hanya baca."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Audit Timeline Monitoring */}
      {showHistory && (
        <div className="p-5 bg-slate-50/40 space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
            <Icon
              icon="solar:clock-circle-bold"
              width={17}
              className="text-[#005baa]"
            />
            Riwayat Lengkap Kendala &amp; Monitoring Tahun {year}
          </h4>

          {monitoringHistory.length === 0 ? (
            <p className="text-xs text-slate-500">
              Belum ada riwayat kendala yang tercatat pada indikator ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {monitoringHistory.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-slate-800">
                      Bulan Asal: {MONTH_NAMES[rec.origin_month - 1]} {year}
                      {rec.owner_name ? ` — ${rec.owner_name}` : ""}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        rec.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : rec.status === "superseded"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rec.status === "resolved"
                        ? `Selesai (${
                            rec.resolved_month
                              ? MONTH_NAMES[rec.resolved_month - 1]
                              : "-"
                          })`
                        : rec.status === "superseded"
                        ? "Diperbarui / Dibatalkan"
                        : "Aktif Dipantau"}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-line">
                    {rec.kendala_text}
                  </p>
                  <div className="text-[11px] text-slate-500">
                    Timeline Awal: {rec.initial_timeline_date || "-"} &rarr;
                    Timeline Terkini: {rec.current_timeline_date || "-"}
                  </div>
                  {rec.monitoring_histories &&
                    rec.monitoring_histories.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 space-y-1">
                        {rec.monitoring_histories.map((step, i) => (
                          <div
                            key={i}
                            className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600"
                          >
                            <span className="font-semibold text-slate-700">
                              {MONTH_NAMES[step.reporting_month - 1]}{" "}
                              {step.reporting_year}:
                            </span>
                            <span
                              className={
                                step.progress_status === "sudah"
                                  ? "font-semibold text-emerald-700"
                                  : "font-semibold text-amber-700"
                              }
                            >
                              {step.progress_status === "sudah"
                                ? "Sudah Selesai"
                                : "Belum"}
                            </span>
                            {step.new_timeline_date && (
                              <span className="text-slate-500">
                                (Perpanjang s.d. {step.new_timeline_date})
                              </span>
                            )}
                            {step.progress_note && (
                              <span>— {step.progress_note}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
