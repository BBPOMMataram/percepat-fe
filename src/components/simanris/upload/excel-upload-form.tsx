"use client";

import { useState, type DragEvent } from "react";
import {
  FileUp,
  FileSpreadsheet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { extractApiErrorMessage, simanrisApi } from "../lib/simanrisApi";
import type {
  DuplicateDetectedPayload,
  ImportBatchItem,
  MasterOptionsData,
} from "../types";

interface ExcelUploadFormProps {
  options: MasterOptionsData | null;
  onOptionsUpdated: () => Promise<void> | void;
  onUploaded: (batch: ImportBatchItem) => void;
}

export function ExcelUploadForm({
  options,
  onOptionsUpdated,
  onUploaded,
}: ExcelUploadFormProps) {
  const [periodId, setPeriodId] = useState<number | "">(
    options?.periods[0]?.id ?? ""
  );
  const [sourceType, setSourceType] = useState<
    "master_compilation" | "function_workbook"
  >("master_compilation");
  const [functionId, setFunctionId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] =
    useState<DuplicateDetectedPayload | null>(null);

  // Form tambah periode baru inline
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [newYear, setNewYear] = useState(2026);
  const [newSemester, setNewSemester] = useState<1 | 2>(1);
  const [creatingPeriod, setCreatingPeriod] = useState(false);

  const effectivePeriodId = periodId || options?.periods[0]?.id || "";

  const handleFilePick = (picked: File | null) => {
    if (!picked) return;
    const lower = picked.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      setError("Format file harus Excel (.xlsx atau .xls).");
      return;
    }
    setError(null);
    setDuplicateInfo(null);
    setFile(picked);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    handleFilePick(dropped);
  };

  const handleCreatePeriod = async () => {
    setCreatingPeriod(true);
    setError(null);
    try {
      const created = await simanrisApi.createPeriod({
        year: newYear,
        semester: newSemester,
      });
      await onOptionsUpdated();
      setPeriodId(created.id);
      setShowNewPeriod(false);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setCreatingPeriod(false);
    }
  };

  const submitUpload = async (allowDuplicate = false) => {
    if (!effectivePeriodId) {
      setError("Pilih atau buat periode semester terlebih dahulu.");
      return;
    }
    if (!file) {
      setError("Pilih file Excel SAPA APIP (.xlsx / .xls) untuk diunggah.");
      return;
    }
    if (sourceType === "function_workbook" && !functionId) {
      setError("Untuk upload per fungsi, pilih Fungsi/Unit pengirim workbook.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("period_id", String(effectivePeriodId));
      fd.append("source_type", sourceType);
      if (sourceType === "function_workbook" && functionId) {
        fd.append("function_id", String(functionId));
      }
      if (allowDuplicate) {
        fd.append("allow_duplicate", "1");
      }
      fd.append("file", file);

      const batch = await simanrisApi.uploadImport(fd, setProgress);
      setDuplicateInfo(null);
      onUploaded(batch);
    } catch (err) {
      const anyErr = err as {
        response?: {
          status?: number;
          data?: { status?: string; data?: DuplicateDetectedPayload; message?: string };
        };
      };
      if (
        anyErr.response?.status === 409 &&
        anyErr.response.data?.status === "duplicate_detected" &&
        anyErr.response.data.data
      ) {
        setDuplicateInfo(anyErr.response.data.data);
      } else {
        setError(extractApiErrorMessage(err));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">
          Langkah 1 — Unggah Workbook Manajemen Risiko (.xlsx / .xls)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Data akan diparsing ke staging preview terlebih dahulu untuk pemeriksaan sheet,
          validasi kode/matriks, dan cek rekonsiliasi sebelum dipublikasikan ke dashboard.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {duplicateInfo && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">File Excel Identik (SHA-256) Terdeteksi</p>
              <p className="mt-0.5">
                Hash berkas ini sama dengan {duplicateInfo.existing_batches.length}{" "}
                batch sebelumnya:
              </p>
              <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-[11px]">
                {duplicateInfo.existing_batches.slice(0, 3).map((eb) => (
                  <li key={eb.id}>
                    Batch #{eb.id} — <b>{eb.file_name}</b> ({eb.status})
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => void submitUpload(true)}
              className="rounded-lg bg-amber-600 px-3.5 py-1.5 font-semibold text-white hover:bg-amber-700"
            >
              Tetap Unggah Sebagai Batch Baru
            </button>
            <button
              type="button"
              onClick={() => setDuplicateInfo(null)}
              className="rounded-lg border border-amber-300 bg-white px-3.5 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Periode Semester
            </label>
            <button
              type="button"
              onClick={() => setShowNewPeriod((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005baa] hover:underline"
            >
              <Plus className="h-3 w-3" />
              {showNewPeriod ? "Tutup Form Periode" : "Buat Periode Baru"}
            </button>
          </div>
          <select
            value={effectivePeriodId}
            onChange={(e) =>
              setPeriodId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
          >
            <option value="">-- Pilih Periode --</option>
            {options?.periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.period_name}
              </option>
            ))}
          </select>

          {showNewPeriod && (
            <div className="mt-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 space-y-2.5">
              <p className="text-[11px] font-bold text-[#004281]">
                Tambah Periode Baru
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={2020}
                  max={2040}
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                />
                <select
                  value={newSemester}
                  onChange={(e) =>
                    setNewSemester(Number(e.target.value) as 1 | 2)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value={1}>Semester I</option>
                  <option value={2}>Semester II</option>
                </select>
                <button
                  type="button"
                  disabled={creatingPeriod}
                  onClick={() => void handleCreatePeriod()}
                  className="rounded-lg bg-[#005baa] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004281] disabled:opacity-60"
                >
                  {creatingPeriod ? "Menyimpan..." : "Simpan Periode"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Sumber Workbook
            </label>
            <select
              value={sourceType}
              onChange={(e) =>
                setSourceType(
                  e.target.value as "master_compilation" | "function_workbook"
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
            >
              <option value="master_compilation">
                Kompilasi Master BBPOM (Resmi Dashboard)
              </option>
              <option value="function_workbook">
                Workbook Per Fungsi / Unit Kerja
              </option>
            </select>
          </div>

          {sourceType === "function_workbook" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fungsi / Unit Pengirim
              </label>
              <select
                value={functionId}
                onChange={(e) =>
                  setFunctionId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-[#005baa] focus:outline-none"
              >
                <option value="">-- Pilih Fungsi --</option>
                {options?.functions.map((fn) => (
                  <option key={fn.id} value={fn.id}>
                    {fn.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-[#005baa] bg-blue-50/70"
            : file
            ? "border-emerald-300 bg-emerald-50/40"
            : "border-slate-300 bg-slate-50/60 hover:border-slate-400"
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            <div className="text-sm font-bold text-slate-900">{file.name}</div>
            <div className="text-xs text-slate-500">
              Ukuran {(file.size / 1024).toFixed(1)} KB · Siap diparsing
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="mt-1 text-xs font-semibold text-red-600 hover:underline"
            >
              Ganti File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="h-10 w-10 text-[#005baa]" />
            <p className="text-sm font-semibold text-slate-800">
              Seret &amp; lepas file Excel di sini, atau pilih dari komputer
            </p>
            <p className="text-xs text-slate-500">
              Mendukung format template SAPA APIP (.xlsx / .xls), termasuk workbook multi-sheet Semester I &amp; II.
            </p>
            <label className="mt-2 cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50">
              <FileUp className="h-4 w-4 text-[#005baa]" />
              Pilih File Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Mengunggah &amp; memparsing workbook...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-[#005baa] transition-all duration-200"
              style={{ width: `${Math.max(progress, 15)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={uploading || !file}
          onClick={() => void submitUpload(false)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#004281] disabled:opacity-50 transition-colors"
        >
          <FileUp className="h-4 w-4" />
          {uploading ? "Memproses Workbook..." : "Upload & Lihat Preview Staging"}
        </button>
      </div>
    </div>
  );
}
