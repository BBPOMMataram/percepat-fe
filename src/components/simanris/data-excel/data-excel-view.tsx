"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileUp,
  History,
  Info,
  RefreshCw,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import { extractApiErrorMessage, simanrisApi } from "../lib/simanrisApi";
import type {
  DuplicateDetectedPayload,
  ImportBatchItem,
  MasterOptionsData,
  PaginatedData,
  PeriodItem,
} from "../types";
import { ImportPreview } from "../upload/import-preview";
import { ChartLoadingState } from "../shared/ChartLoadingState";

export function DataExcelView() {
  const searchParams = useSearchParams();
  const initialBatchParam = searchParams.get("batch_id");

  const [options, setOptions] = useState<MasterOptionsData | null>(null);

  // Form Unggah Data Excel (hanya Tahun, Semester, File Excel, Keterangan opsional)
  const [year, setYear] = useState<number>(2026);
  const [semester, setSemester] = useState<1 | 2>(2);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] =
    useState<DuplicateDetectedPayload | null>(null);

  // Preview Batch Aktif
  const [previewBatchId, setPreviewBatchId] = useState<number | null>(
    initialBatchParam ? Number(initialBatchParam) : null
  );

  // Filter & State Riwayat Unggah Excel
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterSemester, setFilterSemester] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] =
    useState<PaginatedData<ImportBatchItem> | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [busyBatchId, setBusyBatchId] = useState<number | null>(null);
  const [downloadingBatchId, setDownloadingBatchId] = useState<number | null>(
    null
  );

  const loadMasterAndHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [opt, hist] = await Promise.all([
        simanrisApi.getMasterOptions(),
        simanrisApi.listImports({
          year: filterYear,
          semester: filterSemester,
          status: filterStatus || undefined,
          per_page: 15,
          page: historyPage,
        }),
      ]);
      setOptions(opt);
      setHistoryData(hist);
    } catch (err) {
      setUploadError(extractApiErrorMessage(err));
    } finally {
      setLoadingHistory(false);
    }
  }, [filterYear, filterSemester, filterStatus, historyPage]);

  useEffect(() => {
    void loadMasterAndHistory();
  }, [loadMasterAndHistory]);

  // Cek apakah periode (Tahun + Semester) yang dipilih sudah memiliki dataset aktif
  const selectedPeriodObj: PeriodItem | undefined = options?.periods.find(
    (p) => p.year === year && p.semester === semester
  );
  const existingActiveBatch = selectedPeriodObj?.active_import_batch ?? null;

  const submitUpload = async (allowDuplicate = false) => {
    if (!file) {
      setUploadError("Pilih file Excel (.xlsx atau .xls) terlebih dahulu.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccessMsg(null);
    setDuplicateInfo(null);

    const formData = new FormData();
    if (selectedPeriodObj?.id) {
      formData.append("period_id", String(selectedPeriodObj.id));
    }
    formData.append("year", String(year));
    formData.append("semester", String(semester));
    formData.append("source_type", "master_compilation");
    if (notes.trim()) {
      formData.append("notes", notes.trim());
    }
    if (allowDuplicate) {
      formData.append("allow_duplicate", "1");
    }
    if (autoPublish) {
      formData.append("auto_publish", "1");
    }
    formData.append("file", file);

    try {
      const batch = await simanrisApi.uploadImport(formData, setUploadProgress);
      setFile(null);
      setNotes("");
      setPreviewBatchId(batch.id);
      setUploadSuccessMsg(
        batch.status === "published"
          ? `File "${batch.file_name}" berhasil diunggah, seluruh tab dibaca (${batch.total_rows} baris risiko utama), dan langsung diaktifkan untuk Semester ${semester === 1 ? "I" : "II"} ${year}.`
          : `File "${batch.file_name}" berhasil diunggah ke staging. Silakan tinjau preview tab di bawah dan klik Publikasikan.`
      );
      await loadMasterAndHistory();
    } catch (err: unknown) {
      const anyErr = err as {
        response?: { status?: number; data?: { data?: DuplicateDetectedPayload } };
      };
      if (anyErr.response?.status === 409 && anyErr.response.data?.data) {
        setDuplicateInfo(anyErr.response.data.data);
      } else {
        setUploadError(extractApiErrorMessage(err));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleActivateBatch = async (batch: ImportBatchItem) => {
    setBusyBatchId(batch.id);
    setUploadError(null);
    try {
      if (batch.status === "published") {
        await simanrisApi.activatePeriodBatch(batch.period_id, batch.id);
      } else {
        await simanrisApi.publishImport(batch.id, true);
      }
      setUploadSuccessMsg(
        `Dataset "${batch.file_name}" berhasil dijadikan dataset aktif untuk ${batch.period?.period_name || `Periode #${batch.period_id}`}.`
      );
      await loadMasterAndHistory();
    } catch (err) {
      setUploadError(extractApiErrorMessage(err));
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleDownloadOriginal = async (batch: ImportBatchItem) => {
    setDownloadingBatchId(batch.id);
    setUploadError(null);
    try {
      await simanrisApi.downloadImportExcel(batch.id, batch.file_name);
    } catch (err) {
      setUploadError(extractApiErrorMessage(err));
    } finally {
      setDownloadingBatchId(null);
    }
  };

  const historyRows = historyData?.data || [];

  return (
    <div className="space-y-6">
      {/* Notifikasi Sukses / Error */}
      {uploadSuccessMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Pemrosesan Data Excel Berhasil</div>
              <p className="mt-0.5 text-emerald-800">{uploadSuccessMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadSuccessMsg(null)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Kendala Pemrosesan</div>
              <p className="mt-0.5">{uploadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="rounded-lg p-1 text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* BAGIAN ATAS — UNGGAH DATA EXCEL */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Unggah Data Excel
              </h2>
              <p className="text-xs text-slate-500">
                Sistem otomatis mendeteksi struktur workbook dan membaca seluruh tab (Daftar Risiko / Kompilasi, RTP, Pengujian Pengendalian, Reviu, Risiko Positif, Piagam &amp; Konteks).
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-[#04a451]" />
            Auto-Detect Semua Tab Excel
          </span>
        </div>

        {/* Info bila periode sudah memiliki dataset aktif */}
        {existingActiveBatch && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                Periode Semester {semester === 1 ? "I" : "II"} {year} sudah memiliki dataset aktif:
              </span>{" "}
              <span className="font-semibold underline">
                {existingActiveBatch.file_name}
              </span>{" "}
              ({existingActiveBatch.total_rows ?? 0} baris). Mengunggah file baru akan memperbarui dataset aktif periode ini tanpa menghapus riwayat maupun file Excel versi sebelumnya.
            </div>
          </div>
        )}

        {/* Konfirmasi Duplikat SHA-256 */}
        {duplicateInfo && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2.5">
            <div className="flex items-start gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                File dengan isi/checksum SHA-256 yang sama persis sudah pernah diunggah sebelumnya.
              </span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-800">
              {duplicateInfo.existing_batches.map((b) => (
                <li key={b.id}>
                  Batch #{b.id} — <b>{b.file_name}</b> (Status: {b.status})
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={uploading}
                onClick={() => void submitUpload(true)}
                className="rounded-xl bg-amber-600 px-3.5 py-1.5 font-semibold text-white hover:bg-amber-700"
              >
                Tetap Unggah Sebagai Versi Baru
              </button>
              <button
                type="button"
                onClick={() => setDuplicateInfo(null)}
                className="rounded-xl border border-amber-300 bg-white px-3.5 py-1.5 font-semibold text-amber-800 hover:bg-amber-100"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitUpload(false);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tahun <span className="text-red-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:outline-none"
              >
                <option value={1}>Semester I (Januari – Juni)</option>
                <option value={2}>Semester II (Juli – Desember)</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Keterangan / Catatan Versi (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pembaruan hasil reviu kompilasi akhir Semester II..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8">
              <label className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 cursor-pointer hover:border-[#005baa] hover:bg-blue-50/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <FileSpreadsheet className="h-8 w-8 text-[#005baa] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {file
                        ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
                        : "Pilih File Workbook Excel (.xlsx atau .xls)"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Seluruh sheet/tab di dalam file akan dibaca dan disimpan secara utuh di server.
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
                  Telusuri File
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-2.5">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#005baa]"
                />
                <span>Langsung publikasikan &amp; aktifkan bila valid</span>
              </label>

              <button
                type="submit"
                disabled={uploading || !file}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#004281] disabled:opacity-50 transition-colors"
              >
                <FileUp className="h-4 w-4" />
                {uploading
                  ? `Mengunggah & Memproses (${uploadProgress}%)...`
                  : existingActiveBatch
                    ? `Unggah & Perbarui Semester ${semester === 1 ? "I" : "II"} ${year}`
                    : "Unggah Data Excel"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* PANEL PREVIEW MULTI-TAB (Muncul saat user mengunggah atau mengklik Preview pada tabel riwayat) */}
      {previewBatchId && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#005baa]" />
              Detail Pembacaan Seluruh Tab Workbook (Batch #{previewBatchId})
            </h3>
            <button
              type="button"
              onClick={() => setPreviewBatchId(null)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" /> Tutup Preview
            </button>
          </div>
          <ImportPreview
            batchId={previewBatchId}
            onPublished={() => {
              void loadMasterAndHistory();
            }}
            onCancelled={() => {
              setPreviewBatchId(null);
              void loadMasterAndHistory();
            }}
          />
        </section>
      )}

      {/* BAGIAN BAWAH — RIWAYAT UNGGAH EXCEL */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Riwayat Unggah Excel
              </h2>
              <p className="text-xs text-slate-500">
                Daftar seluruh versi file Excel yang pernah diunggah beserta status dataset aktif dan tautan unduh file asli.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterYear}
              onChange={(e) => {
                setHistoryPage(1);
                setFilterYear(e.target.value ? Number(e.target.value) : "");
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="">Semua Tahun</option>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>

            <select
              value={filterSemester}
              onChange={(e) => {
                setHistoryPage(1);
                setFilterSemester(e.target.value ? Number(e.target.value) : "");
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="">Semua Semester</option>
              <option value={1}>Semester I</option>
              <option value={2}>Semester II</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setHistoryPage(1);
                setFilterStatus(e.target.value);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="">Semua Status</option>
              <option value="published">Terpublikasi</option>
              <option value="ready_to_publish">Siap Publikasi</option>
              <option value="validation_failed">Validasi Gagal</option>
              <option value="cancelled">Dibatalkan</option>
            </select>

            <button
              type="button"
              onClick={() => void loadMasterAndHistory()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Segarkan
            </button>
          </div>
        </div>

        {loadingHistory && !historyData ? (
          <ChartLoadingState
            heightClass="h-64"
            label="Memuat riwayat unggahan Excel..."
          />
        ) : historyRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
            Belum ada riwayat unggahan file Excel pada filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3">Nama File &amp; Tab</th>
                  <th className="px-3 py-3">Tahun</th>
                  <th className="px-3 py-3">Semester</th>
                  <th className="px-3 py-3">Versi</th>
                  <th className="px-3 py-3">Total Data</th>
                  <th className="px-3 py-3">Uploaded By</th>
                  <th className="px-3 py-3">Tanggal Upload</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Status Dataset</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyRows.map((b) => {
                  const pYear = b.period?.year ?? "-";
                  const pSem =
                    b.period?.semester === 1
                      ? "Semester I"
                      : b.period?.semester === 2
                        ? "Semester II"
                        : b.period?.period_name || "-";
                  const uploader =
                    b.uploaded_by || b.uploaded_by_name || "Pegawai BBPOM";
                  const tabCount = b.detected_sheets?.length ?? 0;

                  return (
                    <tr
                      key={b.id}
                      className={
                        b.is_active ? "bg-emerald-50/35" : "hover:bg-slate-50"
                      }
                    >
                      <td className="px-3 py-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-[#005baa] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {b.file_name}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                              <span>Batch #{b.id}</span>
                              {tabCount > 0 && (
                                <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-[#005baa]">
                                  {tabCount} Tab Terbaca
                                </span>
                              )}
                            </div>
                            {b.notes && (
                              <div className="mt-1 text-[11px] italic text-slate-600 line-clamp-1">
                                &ldquo;{b.notes}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-800">
                        {pYear}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700">
                        {pSem}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                          v{b.version ?? 1}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {b.total_rows} risiko
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {b.warning_rows} warning · {b.error_rows} error
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-700">
                        {uploader}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                        {new Date(b.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            b.status === "published"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "ready_to_publish"
                                ? "bg-blue-100 text-[#004281]"
                                : b.status === "validation_failed" ||
                                    b.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {b.status === "published"
                            ? "Terpublikasi"
                            : b.status === "ready_to_publish"
                              ? "Siap Publikasi"
                              : b.status === "validation_failed"
                                ? "Validasi Gagal"
                                : b.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {b.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#04a451] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                            <CheckCircle2 className="h-3 w-3" /> Terbaru / Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                            Arsip Riwayat
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={downloadingBatchId === b.id}
                            onClick={() => void handleDownloadOriginal(b)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#005baa] hover:bg-blue-100 disabled:opacity-50"
                            title="Unduh file Excel asli yang diunggah"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {downloadingBatchId === b.id
                              ? "Mengunduh..."
                              : "Unduh Excel"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPreviewBatchId(b.id);
                              window.scrollTo({ top: 240, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview Tab
                          </button>

                          {!b.is_active &&
                            (b.status === "published" ||
                              b.status === "ready_to_publish") &&
                            b.error_rows === 0 && (
                              <button
                                type="button"
                                disabled={busyBatchId === b.id}
                                onClick={() => void handleActivateBatch(b)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#04a451] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <Rocket className="h-3.5 w-3.5" />
                                {busyBatchId === b.id
                                  ? "Memproses..."
                                  : "Jadikan Aktif"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {historyData && historyData.last_page > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Menampilkan {historyData.from ?? 0}–{historyData.to ?? 0} dari{" "}
              {historyData.total} unggahan
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={historyData.current_page <= 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="font-semibold text-slate-700">
                {historyData.current_page} / {historyData.last_page}
              </span>
              <button
                type="button"
                disabled={historyData.current_page >= historyData.last_page}
                onClick={() => setHistoryPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
