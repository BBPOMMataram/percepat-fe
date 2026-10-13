"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

export default function ArahanPimpinan() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const year = searchParams.get("year") || "2026";
  const month = (searchParams.get("month") || "JANUARI").toUpperCase();
  const tab = searchParams.get("tab") || "1";
  const row = searchParams.get("row") || "10";
  const indikator =
    searchParams.get("indikator") ||
    "Persentase Obat yang Memenuhi Syarat Keamanan dan Mutu";

  const [arahanText, setArahanText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const backUrl = `/siproval/rhpk/${year}/tab/${tab}?month=${encodeURIComponent(
    month,
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!arahanText.trim()) {
      setErrorMsg("Harap masukkan isi arahan atau catatan pimpinan.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const endpoint = baseUrl.endsWith("/api")
        ? `${baseUrl}/kabalai/tambah-catatan`
        : `${baseUrl}/api/kabalai/tambah-catatan`;

      await api.post(endpoint, {
        year,
        month,
        tab,
        row,
        arahan: arahanText,
      });

      setSuccessMsg(
        "Arahan pimpinan berhasil disimpan dan disinkronkan ke Google Sheet!"
      );
      setTimeout(() => {
        router.push(backUrl);
      }, 1500);
    } catch (err: any) {
      console.error("Gagal menyimpan arahan pimpinan:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Gagal menyimpan arahan pimpinan ke server. Pastikan Google Sheet dan server aktif."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header with back navigation */}
      <div className="flex items-center gap-4">
        <Link
          href={backUrl}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-[#005baa]"
        >
          <Icon icon="solar:arrow-left-linear" width={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Tambah Arahan Kepala Balai
          </h1>
          <p className="text-xs text-slate-500">
            Berikan arahan atau instruksi tindak lanjut terhadap capaian indikator kegiatan.
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Icon icon="solar:check-circle-bold" width={20} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <Icon icon="solar:danger-triangle-bold" width={20} className="text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Target & Indicator Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Indikator yang Dievaluasi
          </span>
          <h3 className="mt-1 text-base font-bold text-slate-900">{indikator}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-1">
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="text-xs text-slate-400">Tahun</span>
            <p className="mt-0.5 text-sm font-bold text-slate-800">{year}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <span className="text-xs text-[#005baa]">Periode Bulan</span>
            <p className="mt-0.5 text-sm font-bold text-[#005baa]">{month}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="text-xs text-slate-400">Tab ID</span>
            <p className="mt-0.5 text-sm font-bold text-slate-800">{tab}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="text-xs text-slate-400">Baris Data</span>
            <p className="mt-0.5 text-sm font-bold text-slate-800">Baris {row}</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <label
            htmlFor="arahanInput"
            className="block text-sm font-bold text-slate-800"
          >
            Instruksi / Arahan Pimpinan
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            Tuliskan tindak lanjut, catatan evaluasi, atau target perbaikan yang harus
            dipenuhi PIC kegiatan.
          </p>

          <textarea
            id="arahanInput"
            rows={5}
            value={arahanText}
            onChange={(e) => setArahanText(e.target.value)}
            placeholder="Contoh: Percepat sampling pengujian sampel mikrobiologi pada minggu ke-3 dan laporkan progres sebelum tanggal 25..."
            className="mt-3 w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Link
            href={backUrl}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d] disabled:opacity-50"
          >
            <Icon
              icon={
                submitting
                  ? "solar:refresh-circle-linear"
                  : "solar:check-circle-bold"
              }
              width={16}
              className={submitting ? "animate-spin" : ""}
            />
            {submitting ? "Menyimpan..." : "Simpan Arahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
