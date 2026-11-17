"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { MONTH_NAMES, PeerEntryItem, RekapDetailData } from "./types";

interface Props {
  detail: RekapDetailData;
  saving: boolean;
  pulling: boolean;
  resolvingField: string | null;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (payload: {
    year: number;
    iksk_id: number;
    month: number;
    target_owner_scope?: string;
    has_kendala: boolean;
    has_rtl: boolean;
    rekap_kendala_text: string;
    rekap_rtl_text: string;
    rekomendasi_text: string;
    analisis_text: string;
    analisis_type: "keberhasilan" | "kegagalan" | "mixed";
    timeline_date: string | null;
  }) => Promise<void>;
  onPullFromExcel: () => Promise<void>;
  onResolveConflict: (payload: {
    entry_id: number;
    field: "kendala" | "rtl";
    resolution: "use_source" | "keep_rekap";
  }) => Promise<void>;
}

const fmtNum = (val: number | null) => {
  if (val === null || Number.isNaN(val)) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(val);
};

function StepHeader({
  step,
  title,
  subtitle,
  right,
}: {
  step: number;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005baa] text-xs font-bold text-white">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

function BinaryRadioGroup({
  name,
  value,
  disabled,
  trueLabel,
  falseLabel,
  onChange,
}: {
  name: string;
  value: boolean;
  disabled: boolean;
  trueLabel: string;
  falseLabel: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label
        className={`inline-flex items-center gap-2 text-xs font-semibold ${
          disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
        }`}
      >
        <input
          type="radio"
          name={name}
          className="sr-only"
          disabled={disabled}
          checked={value}
          onChange={() => onChange(true)}
        />
        <span
          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
            value ? "border-[#005baa]" : "border-slate-300"
          }`}
        >
          {value && <span className="h-2 w-2 rounded-full bg-[#005baa]" />}
        </span>
        <span className="text-slate-800">{trueLabel}</span>
      </label>

      <label
        className={`inline-flex items-center gap-2 text-xs font-semibold ${
          disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
        }`}
      >
        <input
          type="radio"
          name={name}
          className="sr-only"
          disabled={disabled}
          checked={!value}
          onChange={() => onChange(false)}
        />
        <span
          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
            !value ? "border-emerald-600" : "border-slate-300"
          }`}
        >
          {!value && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
        </span>
        <span className="text-emerald-700">{falseLabel}</span>
      </label>
    </div>
  );
}

function ConflictCompareCard({
  title,
  sourceText,
  rekapText,
  resolving,
  onUseSource,
  onKeepRekap,
}: {
  title: string;
  sourceText: string;
  rekapText: string;
  resolving: boolean;
  onUseSource: () => void;
  onKeepRekap: () => void;
}) {
  return (
    <div className="rounded-lg bg-white border border-rose-200 p-3 space-y-2 text-xs">
      <div className="font-bold text-slate-800">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="rounded bg-blue-50/70 p-2.5 border border-blue-100">
          <div className="text-[10px] font-bold uppercase text-blue-700 mb-1">
            Versi File RHPK Lokal
          </div>
          <p className="text-slate-800 whitespace-pre-line">{sourceText || "-"}</p>
        </div>
        <div className="rounded bg-amber-50/70 p-2.5 border border-amber-100">
          <div className="text-[10px] font-bold uppercase text-amber-800 mb-1">
            Versi Data Rekap Existing
          </div>
          <p className="text-slate-800 whitespace-pre-line">{rekapText || "-"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={resolving}
          onClick={onUseSource}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Gunakan Data File RHPK
        </button>
        <button
          type="button"
          disabled={resolving}
          onClick={onKeepRekap}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Pertahankan Data Rekap
        </button>
      </div>
    </div>
  );
}

export default function RekapRhpkForm({
  detail,
  saving,
  pulling,
  resolvingField,
  onDirtyChange,
  onSave,
  onPullFromExcel,
  onResolveConflict,
}: Props) {
  const { actor_context: ctx, indicator, performance, own_entry, peer_entries } =
    detail;
  const canEdit = ctx.can_edit;
  const isReadOnlyViewer = !canEdit;

  const [hasKendala, setHasKendala] = useState<boolean>(own_entry.has_kendala);
  const [hasRtl, setHasRtl] = useState<boolean>(own_entry.has_rtl);
  const [kendalaText, setKendalaText] = useState<string>(
    own_entry.rekap_kendala_text
  );
  const [rtlText, setRtlText] = useState<string>(own_entry.rekap_rtl_text);
  const [rekomendasiText, setRekomendasiText] = useState<string>(
    own_entry.rekomendasi_text
  );
  const [analisisText, setAnalisisText] = useState<string>(
    own_entry.analisis_text
  );
  const [analisisType, setAnalisisType] = useState<
    "keberhasilan" | "kegagalan" | "mixed"
  >(own_entry.analisis_type || performance.suggested_analisis_type || "kegagalan");
  const [timelineDate, setTimelineDate] = useState<string>(
    own_entry.timeline_date || ""
  );
  const [editingScope, setEditingScope] = useState<string>(
    own_entry.owner_scope || ctx.user_id
  );
  const [showExcelRef, setShowExcelRef] = useState<boolean>(true);

  useEffect(() => {
    setHasKendala(own_entry.has_kendala);
    setHasRtl(own_entry.has_rtl);
    setKendalaText(own_entry.rekap_kendala_text || "");
    setRtlText(own_entry.rekap_rtl_text || "");
    setRekomendasiText(own_entry.rekomendasi_text || "");
    setAnalisisText(own_entry.analisis_text || "");
    setAnalisisType(
      own_entry.analisis_type || performance.suggested_analisis_type || "kegagalan"
    );
    setTimelineDate(own_entry.timeline_date || "");
    setEditingScope(own_entry.owner_scope || ctx.user_id);
  }, [
    detail.year,
    detail.iksk_id,
    detail.month,
    own_entry.id,
    own_entry.updated_at,
    own_entry.rekap_kendala_text,
    own_entry.rekap_rtl_text,
    own_entry.has_kendala_conflict,
    own_entry.has_rtl_conflict,
  ]);

  const isDirty = useMemo(() => {
    if (!canEdit) return false;
    if (editingScope !== (own_entry.owner_scope || ctx.user_id)) return true;
    return (
      hasKendala !== own_entry.has_kendala ||
      hasRtl !== own_entry.has_rtl ||
      kendalaText !== (own_entry.rekap_kendala_text || "") ||
      rtlText !== (own_entry.rekap_rtl_text || "") ||
      rekomendasiText !== (own_entry.rekomendasi_text || "") ||
      analisisText !== (own_entry.analisis_text || "") ||
      analisisType !==
        (own_entry.analisis_type ||
          performance.suggested_analisis_type ||
          "kegagalan") ||
      timelineDate !== (own_entry.timeline_date || "")
    );
  }, [
    canEdit,
    editingScope,
    own_entry,
    ctx.user_id,
    hasKendala,
    hasRtl,
    kendalaText,
    rtlText,
    rekomendasiText,
    analisisText,
    analisisType,
    timelineDate,
    performance.suggested_analisis_type,
  ]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleLoadPeerAsAdmin = (peer: PeerEntryItem) => {
    if (!ctx.is_pic_or_admin || !canEdit) return;
    setEditingScope(peer.owner_scope);
    setHasKendala(peer.has_kendala);
    setHasRtl(peer.has_rtl);
    setKendalaText(peer.rekap_kendala_text || "");
    setRtlText(peer.rekap_rtl_text || "");
    setRekomendasiText(peer.rekomendasi_text || "");
    setAnalisisText(peer.analisis_text || "");
    setAnalisisType(
      peer.analisis_type || performance.suggested_analisis_type || "kegagalan"
    );
    setTimelineDate(peer.timeline_date || "");
  };

  const handleCopySourceToDraft = () => {
    const srcKendala = detail.excel_source.combined_kendala || "";
    const srcRtl = detail.excel_source.combined_rtl || "";
    const srcRekom = detail.excel_source.combined_rekomendasi || "";
    if (srcKendala && !kendalaText) {
      setHasKendala(true);
      setKendalaText(srcKendala);
    }
    if (srcRtl && !rtlText) {
      setHasRtl(true);
      setRtlText(srcRtl);
    }
    if (srcRekom && !rekomendasiText) {
      setRekomendasiText(srcRekom);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      year: detail.year,
      iksk_id: detail.iksk_id,
      month: detail.month,
      target_owner_scope: editingScope,
      has_kendala: hasKendala,
      has_rtl: hasRtl,
      rekap_kendala_text: hasKendala ? kendalaText : "",
      rekap_rtl_text: hasRtl ? rtlText : "",
      rekomendasi_text: rekomendasiText,
      analisis_text: analisisText,
      analisis_type: analisisType,
      timeline_date: timelineDate || null,
    });
  };

  const isSuccess = performance.status === "tercapai";
  const hasExcelSource = Boolean(
    detail.excel_source.combined_kendala ||
      detail.excel_source.combined_rtl ||
      detail.excel_source.combined_rekomendasi
  );
  const hasConflict = Boolean(
    canEdit &&
      own_entry.id &&
      (own_entry.has_kendala_conflict || own_entry.has_rtl_conflict)
  );
  const showEditableOrOwnForm =
    canEdit || peer_entries.length === 0 || !own_entry.is_draft;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200 overflow-hidden">
      {/* Bagian Identitas Indikator & Strip Kinerja Ringkas */}
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#003d73] px-2.5 py-0.5 text-xs font-bold text-white">
              IKSK {indicator.iksk_id}
            </span>
            {indicator.sasaran_kode && (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {indicator.sasaran_kode}
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {MONTH_NAMES[detail.month - 1]} {detail.year}
            </span>
            {detail.is_multi_katim && (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                <Icon icon="solar:users-group-rounded-bold" width={12} />
                Multi-Katim ({detail.assigned_katims.length} Kontributor)
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {indicator.iksk_name}
          </h2>
          {detail.assigned_katims.length > 0 && (
            <p className="text-xs text-slate-500">
              PIC / Katim:{" "}
              <span className="font-medium text-slate-700">
                {detail.assigned_katims.map((k) => k.name).join(", ")}
              </span>
            </p>
          )}
        </div>

        {/* Strip Kinerja Tunggal (menggantikan 5 kartu terpisah) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 rounded-xl border border-slate-200 bg-slate-50/80 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
          <div className="px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-500">
              Target Tahunan
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {fmtNum(performance.target_tahunan)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-500">
              Target {MONTH_NAMES[detail.month - 1]}
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {fmtNum(performance.target_bulan)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-500">
              Realisasi
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {fmtNum(performance.realisasi)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-500">
              % Capaian Bulan
            </div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                isSuccess ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {performance.capaian_bulan !== null
                ? `${fmtNum(performance.capaian_bulan)}%`
                : "-"}
            </div>
          </div>
          <div className="px-3 py-2.5 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-semibold uppercase text-slate-500">
              Status
            </div>
            <div
              className={`text-xs font-bold mt-1 ${
                isSuccess ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {isSuccess ? "Tercapai (>=100%)" : "Perlu Evaluasi (<100%)"}
            </div>
          </div>
        </div>

        {!canEdit && ctx.actor === "katim" && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
            <Icon
              icon="solar:lock-bold"
              width={15}
              className="text-amber-600 mt-0.5 shrink-0"
            />
            <span>
              <strong>Mode Hanya Lihat:</strong> IKSK ini bukan bagian dari IKSK
              yang Anda ampu, sehingga seluruh isian dan monitoring terkunci.
            </span>
          </div>
        )}
      </div>

      {/* Langkah 1: Sumber Data File Excel RHPK, Resolusi Konflik, & Catatan Kontributor */}
      <div className="p-5 space-y-3 bg-slate-50/30">
        <StepHeader
          step={1}
          title="Tarik Data File Excel RHPK Lokal"
          subtitle="Referensi kendala dan RTL yang terbaca dari file RHPK yang diunggah ke SIPROVAL."
          right={
            <div className="flex flex-wrap items-center gap-2">
              {hasExcelSource && (
                <button
                  type="button"
                  onClick={() => setShowExcelRef((v) => !v)}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1"
                >
                  {showExcelRef ? "Sembunyikan Referensi" : "Lihat Referensi Excel"}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={onPullFromExcel}
                  disabled={pulling}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-100 disabled:opacity-50"
                >
                  <Icon
                    icon="solar:cloud-download-bold"
                    width={15}
                    className={pulling ? "animate-bounce" : ""}
                  />
                  {pulling ? "Menarik Data..." : "Tarik Ulang dari File RHPK"}
                </button>
              )}
            </div>
          }
        />

        {hasConflict && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 space-y-3">
            <div className="flex items-start gap-2">
              <Icon
                icon="solar:danger-triangle-bold"
                width={18}
                className="text-rose-600 shrink-0 mt-0.5"
              />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  Perbedaan Terdeteksi antara File RHPK Lokal &amp; Data Rekap Existing
                </h4>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Pilih versi data resmi yang ingin digunakan agar tidak terjadi
                  penimpaan otomatis.
                </p>
              </div>
            </div>

            {own_entry.has_kendala_conflict && (
              <ConflictCompareCard
                title="Konflik Kolom Kendala"
                sourceText={own_entry.source_kendala_text}
                rekapText={own_entry.rekap_kendala_text}
                resolving={resolvingField === "kendala"}
                onUseSource={() =>
                  onResolveConflict({
                    entry_id: own_entry.id!,
                    field: "kendala",
                    resolution: "use_source",
                  })
                }
                onKeepRekap={() =>
                  onResolveConflict({
                    entry_id: own_entry.id!,
                    field: "kendala",
                    resolution: "keep_rekap",
                  })
                }
              />
            )}

            {own_entry.has_rtl_conflict && (
              <ConflictCompareCard
                title="Konflik Kolom Rencana Tindak Lanjut (RTL)"
                sourceText={own_entry.source_rtl_text}
                rekapText={own_entry.rekap_rtl_text}
                resolving={resolvingField === "rtl"}
                onUseSource={() =>
                  onResolveConflict({
                    entry_id: own_entry.id!,
                    field: "rtl",
                    resolution: "use_source",
                  })
                }
                onKeepRekap={() =>
                  onResolveConflict({
                    entry_id: own_entry.id!,
                    field: "rtl",
                    resolution: "keep_rekap",
                  })
                }
              />
            )}
          </div>
        )}

        {!hasExcelSource ? (
          <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-300 bg-white px-3.5 py-2.5">
            Belum ada teks kendala, RTL, atau rekomendasi pada file Excel RHPK bulan ini.
            Anda dapat langsung mengisi formulir di bawah ini.
          </p>
        ) : (
          showExcelRef && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#003d73]">
                  Hasil Tarikan File RHPK Lokal
                </span>
                {canEdit && (!kendalaText || !rtlText || !rekomendasiText) && (
                  <button
                    type="button"
                    onClick={handleCopySourceToDraft}
                    className="text-[11px] font-semibold text-[#005baa] hover:underline"
                  >
                    + Salin Referensi ke Formulir
                  </button>
                )}
              </div>
              <div className="space-y-1.5 rounded-lg bg-white border border-blue-100 p-3 text-slate-700">
                {detail.excel_source.combined_kendala && (
                  <div>
                    <span className="font-semibold text-slate-500">Kendala (Excel): </span>
                    <span className="whitespace-pre-line">
                      {detail.excel_source.combined_kendala}
                    </span>
                  </div>
                )}
                {detail.excel_source.combined_rtl && (
                  <div>
                    <span className="font-semibold text-slate-500">RTL (Excel): </span>
                    <span className="whitespace-pre-line">
                      {detail.excel_source.combined_rtl}
                    </span>
                  </div>
                )}
                {detail.excel_source.combined_rekomendasi && (
                  <div>
                    <span className="font-semibold text-slate-500">
                      Rekomendasi (Tab UPT):{" "}
                    </span>
                    <span className="whitespace-pre-line">
                      {detail.excel_source.combined_rekomendasi}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* Multi-Katim (Opsi A): Catatan Kontributor Lain / Rincian Kontributor TU */}
        {peer_entries.length > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Icon icon="solar:users-group-two-rounded-bold" width={15} />
              {isReadOnlyViewer
                ? `Catatan Kontributor Rekap RHPK (${peer_entries.length} Entri)`
                : `Catatan Rekan Katim pada IKSK ${indicator.iksk_id} (Hanya Baca)`}
            </div>
            <div className="space-y-2">
              {peer_entries.map((peer) => (
                <div
                  key={peer.id}
                  className="rounded-lg border border-indigo-200/80 bg-white p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                    <span className="font-bold text-indigo-800">{peer.owner_name}</span>
                    {ctx.is_pic_or_admin && canEdit && (
                      <button
                        type="button"
                        onClick={() => handleLoadPeerAsAdmin(peer)}
                        className="text-[11px] font-semibold text-[#005baa] hover:underline"
                      >
                        Sunting sebagai PIC
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Kendala: </span>
                    <span className="text-slate-800 whitespace-pre-line">
                      {peer.has_kendala
                        ? peer.rekap_kendala_text || "-"
                        : "Tidak Ada Kendala"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">RTL: </span>
                    <span className="text-slate-800 whitespace-pre-line">
                      {peer.has_rtl ? peer.rekap_rtl_text || "-" : "Tidak Ada RTL"}
                    </span>
                  </div>
                  {peer.rekomendasi_text && (
                    <div>
                      <span className="font-semibold text-slate-500">
                        Rekomendasi:{" "}
                      </span>
                      <span className="text-slate-800 whitespace-pre-line">
                        {peer.rekomendasi_text}
                      </span>
                    </div>
                  )}
                  {peer.analisis_text && (
                    <div>
                      <span className="font-semibold text-slate-500">Analisis: </span>
                      <span className="text-slate-800 whitespace-pre-line">
                        {peer.analisis_text}
                      </span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500">
                    Timeline: {peer.timeline_date || "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Langkah 2: Arahan Pimpinan (Selalu Read-Only) */}
      <div className="p-5">
        <StepHeader
          step={2}
          title="Arahan Pimpinan (Kepala Balai)"
          right={
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
              <Icon icon="solar:lock-bold" width={11} />
              Hanya Baca — Diisi Kabalai
            </span>
          }
        />
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 whitespace-pre-line min-h-[48px]">
          {detail.arahan_pimpinan_text ||
            "Belum ada arahan pimpinan pada bulan pelaporan ini."}
        </div>
      </div>

      {/* Langkah 3–7: Formulir Tunggal Scroll ke Bawah */}
      {showEditableOrOwnForm && (
        <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
          {canEdit && editingScope !== ctx.user_id && ctx.is_pic_or_admin && (
            <div className="px-5 py-2.5 bg-amber-50 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-amber-900">
                Sedang menyunting entri kontributor:{" "}
                <strong>{editingScope}</strong>
              </span>
              <button
                type="button"
                onClick={() => setEditingScope(ctx.user_id)}
                className="font-semibold text-amber-800 hover:underline"
              >
                Kembali ke Entri Saya
              </button>
            </div>
          )}

          {/* Langkah 3: Kendala */}
          <div className="p-5 space-y-3">
            <StepHeader
              step={3}
              title="Kendala"
              right={
                <BinaryRadioGroup
                  name="rekap-has-kendala"
                  value={hasKendala}
                  disabled={!canEdit}
                  trueLabel="Ada Kendala"
                  falseLabel="Tidak Ada Kendala"
                  onChange={setHasKendala}
                />
              }
            />
            {hasKendala && (
              <textarea
                rows={3}
                disabled={!canEdit}
                value={kendalaText}
                onChange={(e) => setKendalaText(e.target.value)}
                placeholder="Uraikan kendala yang dihadapi pada periode ini..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-50"
              />
            )}
          </div>

          {/* Langkah 4: Rencana Tindak Lanjut (RTL) */}
          <div className="p-5 space-y-3">
            <StepHeader
              step={4}
              title="Rencana Tindak Lanjut (RTL)"
              right={
                <BinaryRadioGroup
                  name="rekap-has-rtl"
                  value={hasRtl}
                  disabled={!canEdit}
                  trueLabel="Ada RTL"
                  falseLabel="Tidak Ada RTL"
                  onChange={setHasRtl}
                />
              }
            />
            {hasRtl && (
              <textarea
                rows={3}
                disabled={!canEdit}
                value={rtlText}
                onChange={(e) => setRtlText(e.target.value)}
                placeholder="Tuliskan rencana tindak lanjut yang akan dilaksanakan..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-50"
              />
            )}
          </div>

          {/* Langkah 5: Rekomendasi */}
          <div className="p-5 space-y-2.5">
            <StepHeader step={5} title="Rekomendasi" />
            <textarea
              rows={3}
              disabled={!canEdit}
              value={rekomendasiText}
              onChange={(e) => setRekomendasiText(e.target.value)}
              placeholder="Tuliskan rekomendasi perbaikan atau dukungan yang diperlukan..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-50"
            />
          </div>

          {/* Langkah 6: Analisis Keberhasilan / Kegagalan */}
          <div className="p-5 space-y-3">
            <StepHeader
              step={6}
              title={
                analisisType === "keberhasilan"
                  ? "Analisis Keberhasilan"
                  : analisisType === "kegagalan"
                  ? "Analisis Kegagalan"
                  : "Analisis Keberhasilan & Kegagalan"
              }
              subtitle="Pergantian jenis analisis hanya mengubah label dan tidak menghapus teks yang sudah Anda ketik."
              right={
                <div className="flex items-center gap-1.5 text-[11px]">
                  {(["keberhasilan", "kegagalan", "mixed"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setAnalisisType(t)}
                      className={`rounded-md px-2.5 py-1 font-semibold border transition ${
                        analisisType === t
                          ? t === "keberhasilan"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : t === "kegagalan"
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-[#005baa] text-white border-[#005baa]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {t === "keberhasilan"
                        ? "Keberhasilan"
                        : t === "kegagalan"
                        ? "Kegagalan"
                        : "Gabungan"}
                    </button>
                  ))}
                </div>
              }
            />
            <textarea
              rows={3}
              disabled={!canEdit}
              value={analisisText}
              onChange={(e) => setAnalisisText(e.target.value)}
              placeholder={
                analisisType === "keberhasilan"
                  ? "Jelaskan faktor pendorong keberhasilan capaian >= 100%..."
                  : "Jelaskan akar penyebab target belum tercapai..."
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-50"
            />
          </div>

          {/* Langkah 7: Timeline Penyelesaian & Simpan */}
          <div className="p-5 space-y-4 bg-slate-50/50">
            <StepHeader step={7} title="Timeline Penyelesaian & Simpan" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="sm:w-64">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Tanggal Penyelesaian
                </label>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={timelineDate}
                  onChange={(e) => setTimelineDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-[#005baa] focus:outline-none disabled:bg-slate-100"
                />
              </div>

              {canEdit && (
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2 sm:pt-4">
                  {isDirty && (
                    <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                      <Icon icon="solar:pen-bold" width={13} />
                      Ada perubahan belum disimpan
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003d73] to-[#005baa] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
                  >
                    <Icon
                      icon={
                        saving ? "solar:refresh-circle-bold" : "solar:diskette-bold"
                      }
                      width={17}
                      className={saving ? "animate-spin" : ""}
                    />
                    {saving ? "Menyimpan..." : "Simpan Rekap RHPK"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
