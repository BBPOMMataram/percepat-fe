"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  FileText,
  LockKeyhole,
  Upload,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const BYTES_PER_MB = 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadPdf(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = objectUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export default function CompressPdfPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [targetMb, setTargetMb] = useState("2");
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState("");
  const [pendingDownload, setPendingDownload] = useState<{
    blob: Blob;
    filename: string;
    resultSize: number;
    targetSize: number;
    targetMb: string;
    aggressiveAttempted: boolean;
  } | null>(null);

  const selectFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("File yang dipilih bukan PDF. Silakan pilih file dengan format .pdf.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Ukuran file melebihi batas maksimum 100 MB.");
      return;
    }

    setError("");
    setResult("");
    setPendingDownload(null);
    setFile(selectedFile);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isCompressing) selectFile(event.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    setError("");
    setResult("");
    setPendingDownload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCompress = async (aggressive = false) => {
    if (!file) {
      setError("Pilih file PDF terlebih dahulu.");
      return;
    }

    const retry = aggressive ? pendingDownload : null;
    if (aggressive && !retry) {
      setError("Hasil kompresi untuk diproses ulang tidak tersedia.");
      return;
    }

    const sourceFile = retry?.blob ?? file;
    const requestedTargetMb = retry?.targetMb ?? targetMb;
    const target = Number(requestedTargetMb);
    if (!Number.isFinite(target) || target <= 0 || target > 100) {
      setError("Target ukuran harus lebih dari 0 dan maksimal 100 MB.");
      return;
    }

    setError("");
    setResult("");
    if (!aggressive) setPendingDownload(null);
    setIsCompressing(true);

    try {
      const formData = new FormData();
      formData.append("file", sourceFile, file?.name || "document.pdf");
      formData.append("target_mb", String(target));
      if (aggressive) formData.append("aggressive", "true");

      const response = await fetch("/api/pdf/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody: { detail?: string } = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || "Kompresi PDF gagal. Silakan coba lagi.");
      }

      const compressedPdf = await response.blob();
      if (compressedPdf.type !== "application/pdf") {
        throw new Error("Layanan mengembalikan file yang bukan PDF.");
      }

      const disposition = response.headers.get("content-disposition");
      const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
        || `${file.name.replace(/\.pdf$/i, "")}_compressed.pdf`;
      const targetReached = response.headers.get("x-compression-target-reached");

      if (targetReached === "false") {
        const resultSizeHeader = response.headers.get("x-compression-result-size");
        const targetSizeHeader = response.headers.get("x-compression-target-size");
        const resultSize = Number(resultSizeHeader);
        const targetSize = Number(targetSizeHeader);
        if (
          !resultSizeHeader ||
          !targetSizeHeader ||
          !Number.isSafeInteger(resultSize) ||
          resultSize <= 0 ||
          !Number.isSafeInteger(targetSize) ||
          targetSize <= 0
        ) {
          throw new Error("Informasi ukuran hasil kompresi dari layanan tidak valid.");
        }

        setPendingDownload({
          blob: compressedPdf,
          filename,
          resultSize,
          targetSize,
          targetMb: String(requestedTargetMb),
          aggressiveAttempted: aggressive,
        });
        return;
      }

      setPendingDownload(null);
      downloadPdf(compressedPdf, filename);
      setResult(`File berhasil dikompres dan diunduh (${formatFileSize(compressedPdf.size)}).`);
    } catch (compressionError) {
      setError(
        compressionError instanceof Error
          ? compressionError.message
          : "Terjadi kesalahan saat mengompres PDF.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const continueDownload = () => {
    if (!pendingDownload) return;

    downloadPdf(pendingDownload.blob, pendingDownload.filename);
    setResult(`File berhasil diunduh (${formatFileSize(pendingDownload.resultSize)}).`);
    setPendingDownload(null);
  };

  const cancelDownload = () => {
    setPendingDownload(null);
    setResult("Unduhan dibatalkan. File hasil kompresi tidak diunduh.");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/pdf" className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-900">
            <ArrowLeft size={18} aria-hidden="true" />
            Semua alat PDF
          </Link>
          <span className="flex items-center gap-2 text-sm font-bold text-blue-950">
            <FileText size={19} aria-hidden="true" />
            PDF Tools
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/pdf" className="transition hover:text-blue-900">PDF Tools</Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-800">Kompres PDF</span>
        </nav>

        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-900/20">
              <FileText size={30} aria-hidden="true" />
            </span>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-800">Kompres PDF</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Unggah file PDF Anda
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
              Pilih dokumen PDF dan tentukan batas ukuran hasil yang diinginkan.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <label
              htmlFor="pdf-file"
              onDragOver={(event) => {
                event.preventDefault();
                if (!isCompressing) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${
                isDragging
                  ? "border-blue-700 bg-blue-50"
                  : "border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                id="pdf-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="sr-only"
                disabled={isCompressing}
              />
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900">
                <Upload size={25} aria-hidden="true" />
              </span>
              <span className="text-base font-bold text-slate-900">
                Seret dan lepas file PDF di sini
              </span>
              <span className="mt-2 text-sm text-slate-500">atau klik untuk memilih file dari perangkat</span>
              <span className="mt-5 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                Pilih file PDF
              </span>
              <span className="mt-4 text-xs text-slate-400">PDF · Maksimal 100 MB</span>
            </label>

            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            {file && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-900 shadow-sm">
                  <FileText size={22} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatFileSize(file.size)} · PDF</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-label="File siap">
                  <Check size={17} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  aria-label="Hapus file yang dipilih"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="mt-6">
              <label htmlFor="target-mb" className="block text-sm font-semibold text-slate-800">
                Ukuran maksimum hasil (MB)
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="target-mb"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={targetMb}
                  onChange={(event) => setTargetMb(event.target.value)}
                  disabled={isCompressing}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
                <span className="text-sm font-medium text-slate-500">MB</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Target ukuran mungkin tidak tercapai untuk PDF yang sulit dikompres.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCompress()}
              disabled={!file || isCompressing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCompressing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  Mengompres PDF...
                </>
              ) : (
                <>
                  <FileText size={18} aria-hidden="true" />
                  Kompres dan unduh
                </>
              )}
            </button>

            {result && (
              <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                <CheckCircle2 size={18} aria-hidden="true" />
                {result}
              </p>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4">
              <LockKeyhole size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
              <p className="text-sm leading-6 text-slate-600">
                File dikirim ke layanan kompresi untuk diproses dan tidak disimpan setelah proses selesai.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            File PDF yang diunggah dibatasi maksimal 100 MB.
          </p>
        </div>
      </section>

      {pendingDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="compression-confirmation-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <FileText size={24} aria-hidden="true" />
            </div>
            <h2 id="compression-confirmation-title" className="text-xl font-bold text-slate-900">
              Target ukuran belum tercapai
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {pendingDownload.aggressiveAttempted
                ? "Kompresi maksimal sudah dicoba, tetapi batas ukuran masih belum tercapai. Hasil terbaik yang tersedia adalah "
                : "Hasil kompresi biasa belum mencapai target. Hasil terbaik saat ini adalah "}
              <span className="font-bold text-slate-900">{formatFileSize(pendingDownload.resultSize)}</span>,
              sedangkan target Anda{" "}
              <span className="font-bold text-slate-900">{formatFileSize(pendingDownload.targetSize)}</span>.
              {pendingDownload.aggressiveAttempted
                ? " Anda tetap dapat mengunduh hasil ini."
                : " Kompresi maksimal akan mengubah setiap halaman menjadi gambar; teks tidak dapat dicari atau disalin dan kualitas dapat menurun."}
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:flex-wrap">
              <button
                type="button"
                onClick={cancelDownload}
                disabled={isCompressing}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Batalkan
              </button>
              {!pendingDownload.aggressiveAttempted && (
                <button
                  type="button"
                  onClick={() => handleCompress(true)}
                  disabled={isCompressing}
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                >
                  {isCompressing ? "Mengompres maksimal..." : "Kompres maksimal"}
                </button>
              )}
              <button
                type="button"
                onClick={continueDownload}
                disabled={isCompressing}
                className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                Unduh hasil ini
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
