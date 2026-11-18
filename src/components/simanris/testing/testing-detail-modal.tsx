"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Save,
  HelpCircle,
  FileCheck,
  Calculator,
  ArrowLeft,
  Info,
  Paperclip,
  Link2,
  Upload,
  Download,
  Trash2,
  Loader2,
  FileText,
  Image as ImageIcon,
  Lock,
  ExternalLink,
  ShieldAlert,
  User,
  Clock,
} from "lucide-react";
import { simanrisApi, extractApiErrorMessage } from "../lib/simanrisApi";
import type {
  TestingAttachmentItem,
  TestingDetailResponse,
  TestingPayload,
} from "../types";
import { RiskLevelBadge } from "../shared/RiskLevelBadge";
import { TestingStatusBadge } from "./testing-status-badge";
import { ChartLoadingState } from "../shared/ChartLoadingState";

interface TestingDetailModalProps {
  riskRecordId: number | null;
  onClose: () => void;
  onSuccess: (updatedTesting: any) => void;
}

function getFileIcon(ext: string) {
  const clean = (ext || "").toLowerCase().replace(/^\./, "");
  if (clean === "pdf") {
    return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
  }
  if (["xlsx", "xls", "csv"].includes(clean)) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  if (["png", "jpg", "jpeg", "webp"].includes(clean)) {
    return <ImageIcon className="h-4 w-4 text-indigo-500 shrink-0" />;
  }
  return <Paperclip className="h-4 w-4 text-slate-500 shrink-0" />;
}

export function TestingDetailModal({
  riskRecordId,
  onClose,
  onSuccess,
}: TestingDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TestingDetailResponse | null>(null);

  // Form State
  const [sampleCount, setSampleCount] = useState<string>("");
  const [compliantCount, setCompliantCount] = useState<string>("");
  const [nonCompliantCount, setNonCompliantCount] = useState<string>("");
  const [nonComplianceDesc, setNonComplianceDesc] = useState<string>("");
  const [controlWeakness, setControlWeakness] = useState<string>("");
  const [controlEffectiveness, setControlEffectiveness] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [testingMethod, setTestingMethod] = useState<string>("Reviu dokumen");
  const [notes, setNotes] = useState<string>("");

  // Data Dukung State (Link & Unggah Berkas Maks 5)
  const [supportingLink, setSupportingLink] = useState<string>("");
  const [supportingFiles, setSupportingFiles] = useState<TestingAttachmentItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Hak Akses Edit
  const canEdit = data?.can_edit !== false;

  // Load detail
  useEffect(() => {
    if (!riskRecordId) {
      setData(null);
      return;
    }

    let isSubscribed = true;
    setLoading(true);
    setError(null);
    setUploadError(null);

    simanrisApi
      .getTestingDetail(riskRecordId)
      .then((res) => {
        if (!isSubscribed) return;
        setData(res);
        const t = res.testing;
        if (t) {
          setSampleCount(
            t.sample_count !== null && t.sample_count !== undefined
              ? String(t.sample_count)
              : ""
          );
          setCompliantCount(
            t.compliant_sample_count !== null && t.compliant_sample_count !== undefined
              ? String(t.compliant_sample_count)
              : ""
          );
          setNonCompliantCount(
            t.non_compliant_sample_count !== null &&
              t.non_compliant_sample_count !== undefined
              ? String(t.non_compliant_sample_count)
              : ""
          );
          setNonComplianceDesc(t.non_compliance_description || "");
          setControlWeakness(t.control_weakness_assessment || "");
          setControlEffectiveness(t.control_effectiveness_conclusion || "");
          setRecommendation(t.recommendation || "");
          setTestingMethod(t.testing_method || "Reviu dokumen");
          setNotes(t.notes || "");
          setSupportingLink(t.supporting_link || "");
          setSupportingFiles(
            Array.isArray(t.supporting_files) ? t.supporting_files : []
          );
        } else {
          // Default awal
          setSampleCount("");
          setCompliantCount("");
          setNonCompliantCount("");
          setNonComplianceDesc("");
          setControlWeakness("Kelemahan Tidak Signifikan");
          setControlEffectiveness("Efektif");
          setRecommendation("Rancangan Pengendalian Telah Efektif");
          setTestingMethod("Reviu dokumen");
          setNotes("");
          setSupportingLink("");
          setSupportingFiles([]);
        }
        setHasChanges(false);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setError(extractApiErrorMessage(err));
      })
      .finally(() => {
        if (!isSubscribed) return;
        setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [riskRecordId]);

  // Realtime calculated values & validation
  const numSample = sampleCount === "" ? null : Number(sampleCount);
  const numCompliant = compliantCount === "" ? null : Number(compliantCount);
  const numNonCompliant = nonCompliantCount === "" ? null : Number(nonCompliantCount);

  const percentage = useMemo(() => {
    if (numSample !== null && numSample > 0 && numNonCompliant !== null) {
      return ((numNonCompliant / numSample) * 100).toFixed(2);
    }
    if (numSample === 0) return "0.00";
    return "—";
  }, [numSample, numNonCompliant]);

  const mathValid = useMemo(() => {
    if (numSample === null && numCompliant === null && numNonCompliant === null) return true;
    if (numSample !== null && numCompliant !== null && numNonCompliant !== null) {
      return numSample === numCompliant + numNonCompliant;
    }
    return false;
  }, [numSample, numCompliant, numNonCompliant]);

  const handleFieldChange = () => {
    if (!canEdit) return;
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges && canEdit) {
      const confirmLeave = window.confirm(
        "Perubahan yang belum disimpan akan hilang. Yakin ingin menutup formulir?"
      );
      if (!confirmLeave) return;
    }
    onClose();
  };

  // Upload file data dukung (Maks 5 file, batasi PDF, Excel, Gambar)
  const handleFileUpload = async (files: FileList | null) => {
    if (!canEdit) {
      setUploadError("Anda tidak memiliki izin mengunggah data dukung pada risiko fungsi ini.");
      return;
    }
    if (!files || files.length === 0) return;
    setUploadError(null);

    const availableSlots = 5 - supportingFiles.length;
    if (availableSlots <= 0) {
      setUploadError("Maksimal 5 berkas data dukung telah tercapai.");
      return;
    }

    if (files.length > availableSlots) {
      setUploadError(
        `Anda hanya dapat mengunggah ${availableSlots} berkas lagi (maksimal 5 berkas per pengujian).`
      );
      return;
    }

    const allowedExtensions = ["pdf", "xlsx", "xls", "png", "jpg", "jpeg"];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB per berkas sesuai instruksi master prompt

    const filesToUpload: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (!allowedExtensions.includes(ext)) {
        setUploadError(
          `Berkas "${file.name}" tidak diizinkan. Hanya berkas PDF (.pdf), Excel (.xlsx, .xls), dan Gambar (.jpg, .jpeg, .png) yang didukung.`
        );
        return;
      }

      if (file.size > maxSizeBytes) {
        setUploadError(
          `Ukuran berkas "${file.name}" melebihi batas maksimal 10 MB.`
        );
        return;
      }

      filesToUpload.push(file);
    }

    setIsUploading(true);
    try {
      const uploadedResults: TestingAttachmentItem[] = [];
      for (const file of filesToUpload) {
        const item = await simanrisApi.uploadTestingAttachment(file);
        uploadedResults.push(item);
      }

      setSupportingFiles((prev) => [...prev, ...uploadedResults]);
      setHasChanges(true);
    } catch (err) {
      setUploadError(extractApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    if (!canEdit) return;
    setSupportingFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setHasChanges(true);
    setUploadError(null);
  };

  const buildPayload = (): TestingPayload => ({
    sample_count: sampleCount !== "" ? Math.max(0, parseInt(sampleCount, 10)) : null,
    compliant_sample_count:
      compliantCount !== "" ? Math.max(0, parseInt(compliantCount, 10)) : null,
    non_compliant_sample_count:
      nonCompliantCount !== "" ? Math.max(0, parseInt(nonCompliantCount, 10)) : null,
    non_compliance_description: nonComplianceDesc.trim() || null,
    control_weakness_assessment: controlWeakness || null,
    control_effectiveness_conclusion: controlEffectiveness || null,
    recommendation: recommendation.trim() || null,
    testing_method: testingMethod || null,
    notes: notes.trim() || null,
    supporting_link: supportingLink.trim() || null,
    supporting_files: supportingFiles,
  });

  const handleSaveDraft = async () => {
    if (!riskRecordId || !canEdit) return;
    setSaving(true);
    setError(null);

    try {
      const res = await simanrisApi.saveTestingDraft(riskRecordId, buildPayload());
      setHasChanges(false);
      setData((prev) => (prev ? { ...prev, testing: { ...prev.testing, ...res } } : prev));
      onSuccess(res);
      alert("Draft pengujian aktivitas pengendalian berhasil disimpan.");
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!riskRecordId || !canEdit) return;

    // Client-side validations
    if (sampleCount === "" || compliantCount === "" || nonCompliantCount === "") {
      setError(
        "Jumlah Sampel, Sampel Sesuai, dan Sampel Tidak Sesuai wajib diisi sebelum menandai selesai."
      );
      return;
    }

    if (!mathValid) {
      setError(
        `Rumus sampel tidak seimbang: Jumlah Sampel (${numSample ?? 0}) harus sama dengan Sampel Sesuai (${numCompliant ?? 0}) + Sampel Tidak Sesuai (${numNonCompliant ?? 0}).`
      );
      return;
    }

    if ((numNonCompliant ?? 0) > 0 && !nonComplianceDesc.trim()) {
      setError(
        "Uraian Ketidaksesuaian wajib diisi karena terdapat sampel yang tidak sesuai rancangan pengendalian."
      );
      return;
    }

    if (!controlWeakness || !controlEffectiveness || !recommendation.trim()) {
      setError(
        "Seluruh field Resume Pengujian (Penilaian Kelemahan, Simpulan Efektivitas, dan Rekomendasi) wajib diisi."
      );
      return;
    }

    if (!testingMethod) {
      setError("Metode Pengujian wajib dipilih.");
      return;
    }

    const confirmComplete = window.confirm(
      "Apakah Anda yakin data pengujian sudah lengkap dan sesuai formulir kertas kerja? Pengujian akan ditandai Selesai."
    );
    if (!confirmComplete) return;

    setSaving(true);
    setError(null);

    try {
      const res = await simanrisApi.completeTesting(riskRecordId, buildPayload());
      setHasChanges(false);
      setData((prev) => (prev ? { ...prev, testing: { ...prev.testing, ...res } } : prev));
      onSuccess(res);
      alert("Pengujian aktivitas pengendalian berhasil diselesaikan!");
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!riskRecordId) return null;

  const r = data?.risk_record;
  const currentStatus = data?.testing?.status || "not_started";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex h-full max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#004281] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1 text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
              title="Kembali"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Formulir Kertas Kerja Pengujian
                </span>
                <TestingStatusBadge status={currentStatus} />
                {!canEdit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 border border-amber-300/30">
                    <Lock className="h-3 w-3" /> Read-only
                  </span>
                )}
                {data?.testing && (data.testing.updated_by || data.testing.created_by) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-100 border border-white/20">
                    <User className="h-3 w-3 text-blue-200" />
                    Petugas: {data.testing.updated_by || data.testing.created_by}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Pengujian Aktivitas Pengendalian — {r?.risk_code || "Memuat..."}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
              title="Tutup Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {loading && (
            <ChartLoadingState heightClass="h-64" label="Memuat kertas kerja pengujian..." />
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {!loading && r && (
            <>
              {/* Permission Banner for Read-Only Mode */}
              {!canEdit && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">Mode Hanya Baca (Read-only)</p>
                    <p className="mt-0.5 leading-relaxed text-amber-800">
                      Anda terdaftar pada unit/fungsi{" "}
                      <b>{data?.user_actor?.fungsi_name || "Lain"}</b>. Anda dapat meninjau hasil pengujian dan mengunduh berkas data dukung, namun pengisian atau perubahan formulir ini hanya dapat dilakukan oleh pemilik risiko (<b>{r.function_name}</b>).
                    </p>
                  </div>
                </div>
              )}

              {/* Outdated Dataset Warning */}
              {r.is_dataset_outdated && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-center gap-2.5">
                  <Info className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <b>Pemberitahuan Dataset:</b> Risiko ini tercatat pada batch unggahan terdahulu (
                    {r.batch?.file_name || "Versi Lama"}). Periode ini telah memiliki versi pembaruan Excel terbaru.
                  </span>
                </div>
              )}

              {/* ===================================================================
                  SECTION A: INFORMASI RISIKO DAN AKTIVITAS PENGENDALIAN (READ-ONLY)
                  =================================================================== */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-[#005baa]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Bagian A — Informasi Risiko dan Aktivitas Pengendalian Sumber
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                    Sumber: Sheet {r.source_sheet || "Kompilasi"} (Baris {r.source_row})
                  </span>
                </div>

                {/* Grid Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Periode</p>
                    <p className="font-bold text-slate-800 mt-0.5">{r.period.period_name}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Kode Risiko</p>
                    <p className="font-bold text-[#004281] mt-0.5">{r.risk_code || "-"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Unit / Fungsi</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{r.function_name || "-"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Level Inheren</p>
                    <div className="mt-1 flex items-center gap-2">
                      <RiskLevelBadge level={r.inherent_level} />
                      <span className="text-[11px] text-slate-500">
                        (K: {r.inherent_likelihood ?? "-"}, D: {r.inherent_impact ?? "-"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Event */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Peristiwa Risiko (Risk Event)
                  </p>
                  <p className="mt-1 text-slate-800 leading-relaxed font-medium">
                    {r.risk_event || "-"}
                  </p>
                </div>

                {/* 2 Column: Aktivitas Pengendalian & Atribut Pengendalian */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Aktivitas Pengendalian */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-[#004281]">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Aktivitas Pengendalian Saat Ini (Kolom O)</span>
                    </div>
                    <div className="whitespace-pre-line text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-blue-100">
                      {r.existing_controls || (
                        <span className="text-slate-400 italic">
                          Aktivitas pengendalian belum tersedia pada data sumber.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Atribut Pengendalian */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <FileCheck className="h-4 w-4" />
                      <span>Atribut Pengendalian (Kolom P)</span>
                    </div>
                    <div className="whitespace-pre-line text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-indigo-100">
                      {r.control_attributes || (
                        <span className="text-slate-400 italic">
                          Atribut pengendalian belum tersedia pada data sumber.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tracking Info Penguji */}
                {data?.testing && (data.testing.updated_by || data.testing.created_by) ? (
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="h-4 w-4 text-[#005baa] shrink-0" />
                      <span>
                        Petugas Pengentry: <b className="text-slate-900">{data.testing.updated_by || data.testing.created_by}</b>
                      </span>
                    </div>
                    {data.testing.updated_at && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Terakhir disimpan: {data.testing.updated_at}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  canEdit && (
                    <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-2.5 flex items-center gap-2 text-xs text-blue-800">
                      <User className="h-4 w-4 text-[#005baa] shrink-0" />
                      <span>
                        Anda mengisi sebagai: <b>{data?.user_actor?.name || "Pegawai BBPOM"}</b> ({data?.user_actor?.fungsi_name || r.function_name}). Nama Anda akan tercatat di sistem pada saat data disimpan.
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* ===================================================================
                  SECTION B: HASIL PENGUJIAN (INPUT / READ-ONLY)
                  =================================================================== */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#005baa]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Bagian B — Hasil Pengujian Sampel
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Aturan: Jumlah Sampel = Sampel Sesuai + Sampel Tidak Sesuai
                  </span>
                </div>

                {/* 3 Input Sampel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Jumlah Sampel */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jumlah Sampel {canEdit && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!canEdit}
                      value={sampleCount}
                      onChange={(e) => {
                        setSampleCount(e.target.value);
                        handleFieldChange();
                      }}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Total berkas/transaksi yang diuji</p>
                  </div>

                  {/* Sampel Sesuai */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sampel Sesuai Rancangan {canEdit && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!canEdit}
                      value={compliantCount}
                      onChange={(e) => {
                        setCompliantCount(e.target.value);
                        handleFieldChange();
                      }}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-700 shadow-2xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Memenuhi atribut SOP & pengendalian</p>
                  </div>

                  {/* Sampel Tidak Sesuai */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sampel Tidak Sesuai Rancangan {canEdit && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!canEdit}
                      value={nonCompliantCount}
                      onChange={(e) => {
                        setNonCompliantCount(e.target.value);
                        handleFieldChange();
                      }}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-amber-700 shadow-2xs focus:border-amber-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Ditemukan deviasi atau ketidaksesuaian</p>
                  </div>
                </div>

                {/* Validation Status & Percentage Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Inline Math Verification */}
                  <div
                    className={`rounded-xl border p-3 flex items-center gap-2.5 text-xs font-semibold ${
                      sampleCount === "" && compliantCount === "" && nonCompliantCount === ""
                        ? "border-slate-200 bg-slate-50 text-slate-500"
                        : mathValid
                        ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {mathValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span>
                      {sampleCount === "" && compliantCount === "" && nonCompliantCount === ""
                        ? "Verifikasi rumus keseimbangan sampel."
                        : mathValid
                        ? `Rumus Seimbang: ${numSample} = ${numCompliant} + ${numNonCompliant} ✓`
                        : `Ketidakseimbangan: Total (${numSample ?? 0}) ≠ Sesuai (${numCompliant ?? 0}) + Tidak Sesuai (${numNonCompliant ?? 0})`}
                    </span>
                  </div>

                  {/* Persentase Ketidaksesuaian */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase font-bold text-slate-500">
                        Persentase Ketidaksesuaian (Otomatis)
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Formula: (Sampel Tidak Sesuai / Jumlah Sampel) × 100%
                      </p>
                    </div>
                    <span className="text-base font-black text-[#004281] bg-white px-3 py-1 rounded-lg border border-slate-200">
                      {percentage === "—" ? "—" : `${percentage}%`}
                    </span>
                  </div>
                </div>

                {/* Uraian Ketidaksesuaian */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Uraian Ketidaksesuaian{" "}
                      {(numNonCompliant ?? 0) > 0 ? (
                        <span className="text-red-500 font-extrabold">
                          * (Wajib diisi karena ada sampel tidak sesuai)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">
                          (Opsional jika tidak ada temuan)
                        </span>
                      )}
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={nonComplianceDesc}
                    onChange={(e) => {
                      setNonComplianceDesc(e.target.value);
                      handleFieldChange();
                    }}
                    placeholder={
                      (numNonCompliant ?? 0) > 0
                        ? "Jelaskan rincian temuan ketidaksesuaian rancangan pengendalian pada sampel yang diuji..."
                        : "Tidak terdapat ketidaksesuaian / seluruh sampel telah sesuai dengan SOP dan rancangan pengendalian."
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed shadow-2xs focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ===================================================================
                  SECTION C: RESUME PENGUJIAN (INPUT / READ-ONLY)
                  =================================================================== */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#005baa]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Bagian C — Resume Pengujian
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Penilaian Kelemahan Pengendalian */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hasil Penilaian Kelemahan Pengendalian {canEdit && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={controlWeakness}
                      disabled={!canEdit}
                      onChange={(e) => {
                        setControlWeakness(e.target.value);
                        handleFieldChange();
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Penilaian Kelemahan...</option>
                      {data?.options.weakness_options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Simpulan Efektivitas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Simpulan Efektivitas Pengendalian {canEdit && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={controlEffectiveness}
                      disabled={!canEdit}
                      onChange={(e) => {
                        setControlEffectiveness(e.target.value);
                        handleFieldChange();
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Simpulan Efektivitas...</option>
                      {data?.options.effectiveness_options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rekomendasi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rekomendasi {canEdit && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={recommendation}
                    onChange={(e) => {
                      setRecommendation(e.target.value);
                      handleFieldChange();
                    }}
                    placeholder="Contoh: Rancangan Pengendalian Telah Efektif, atau usulan perbaikan/eskalasi risiko..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed shadow-2xs focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ===================================================================
                  SECTION D: METODE PENGUJIAN & KETERANGAN (INPUT / READ-ONLY)
                  =================================================================== */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#005baa]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Bagian D — Metode Pengujian
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Metode */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Metode Pengujian {canEdit && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={testingMethod}
                      disabled={!canEdit}
                      onChange={(e) => {
                        setTestingMethod(e.target.value);
                        handleFieldChange();
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {data?.options.method_options.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Keterangan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Keterangan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        handleFieldChange();
                      }}
                      placeholder="Catatan penunjang jika ada"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* ===================================================================
                  SECTION E: DATA DUKUNG PENGUJIAN (LINK & UNGGAH BERKAS MAKS 5)
                  =================================================================== */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-[#005baa]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Bagian E — Data Dukung Pengujian
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Maks. 5 Berkas ({supportingFiles.length}/5)
                  </span>
                </div>

                {/* Baris Kolom Link & Berkas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Kolom 1: Link Data Dukung */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Link / Tautan Data Dukung <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        disabled={!canEdit}
                        value={supportingLink}
                        onChange={(e) => {
                          setSupportingLink(e.target.value);
                          handleFieldChange();
                        }}
                        placeholder="Contoh: https://drive.google.com/... atau tautan cloud storage"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-[#005baa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    {supportingLink && (
                      <a
                        href={supportingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005baa] hover:underline mt-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Buka Tautan Data Dukung di Tab Baru
                      </a>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Tautkan folder Google Drive, Dropbox, atau repositori data dukung fungsi terkait.
                    </p>
                  </div>

                  {/* Kolom 2: Upload File Bukti Dukung Batch (Maks 5) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Unggah Berkas Data Dukung <span className="text-slate-400 font-normal">(Maks. 5 berkas)</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        PDF (.pdf), Excel (.xlsx, .xls), Gambar (.jpg, .png)
                      </span>
                    </div>

                    {canEdit ? (
                      <div className="relative">
                        <input
                          type="file"
                          id="modal-supporting-files"
                          multiple
                          accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                          disabled={supportingFiles.length >= 5 || isUploading}
                          onChange={(e) => {
                            handleFileUpload(e.target.files);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="modal-supporting-files"
                          className={`flex items-center justify-center gap-2 rounded-xl border border-dashed p-2.5 text-center cursor-pointer transition-all ${
                            supportingFiles.length >= 5
                              ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                              : isUploading
                              ? "border-blue-300 bg-blue-50/50 text-[#005baa] cursor-wait"
                              : "border-slate-300 bg-slate-50/50 hover:bg-blue-50/30 hover:border-[#005baa] text-slate-700"
                          }`}
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#005baa]" />
                          ) : (
                            <Upload className="h-4 w-4 text-[#005baa]" />
                          )}
                          <span className="text-xs font-semibold">
                            {isUploading
                              ? "Mengunggah berkas..."
                              : supportingFiles.length >= 5
                              ? "Batas maksimal 5 berkas tercapai"
                              : "Pilih / Drag & Drop Berkas (PDF, Excel, Gambar)"}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center text-xs text-slate-400 font-medium">
                        Unggah berkas dinonaktifkan pada mode pratinjau.
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" /> {uploadError}
                      </p>
                    )}
                  </div>
                </div>

                {/* List Berkas yang telah diunggah */}
                {supportingFiles.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Daftar Berkas Terlampir ({supportingFiles.length}/5):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {supportingFiles.map((f, idx) => (
                        <div
                          key={f.id || idx}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs shadow-2xs hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            {getFileIcon(f.extension)}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 truncate" title={f.name}>
                                {f.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {f.size_formatted || `${Math.round(f.size / 1024)} KB`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {f.file_name && (
                              <a
                                href={simanrisApi.getAttachmentDownloadUrl(f.file_name, f.name)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                                title="Unduh / Buka Berkas"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Unduh</span>
                              </a>
                            )}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(idx)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-white px-6 py-4 gap-3">
          <div className="text-xs text-slate-500">
            {canEdit ? (
              <div className="flex flex-col">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  Petugas:{" "}
                  <b className="text-slate-900">
                    {data?.testing?.updated_by || data?.testing?.created_by || data?.user_actor?.name || "Pegawai BBPOM"}
                  </b>
                </span>
                {hasChanges && (
                  <span className="text-amber-600 font-bold text-[11px] mt-0.5">• Ada perubahan belum disimpan</span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Mode Pratinjau (Hanya Pemilik Risiko yang dapat mengubah data)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {canEdit ? "Batal" : "Tutup"}
            </button>

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving || loading || isUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan Draft"}
                </button>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={saving || loading || isUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#005baa] to-[#004281] px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving ? "Memproses..." : "Tandai Selesai"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
