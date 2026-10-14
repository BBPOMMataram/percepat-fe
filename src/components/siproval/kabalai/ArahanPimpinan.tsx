"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

export default function ArahanPimpinan() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  const year = searchParams.get("year") || "2026";
  const month = (searchParams.get("month") || "JANUARI").toUpperCase();
  const tab = searchParams.get("tab") || "154";
  const row = searchParams.get("row") || "11";
  const indikator =
    searchParams.get("indikator") ||
    "Persentase sampel Sediaan Farmasi berisiko yang ditindaklanjuti sesuai ketentuan";

  const [arahanText, setArahanText] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [tabTitle, setTabTitle] = useState("");
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const backUrl = `/siproval/rhpk/${year}/tab/${tab}?month=${encodeURIComponent(
    month,
  )}`;

  useEffect(() => {
    async function loadCurrentData() {
      try {
        setLoadingCurrent(true);
        const query = user?.id ? `&user_id=${user.id}` : "";
        const res = await api.get(
          `${baseUrl}/api/kabalai/tambah-catatan?year=${year}&month=${encodeURIComponent(
            month,
          )}&tab=${tab}&row=${row}&indikator=${encodeURIComponent(indikator)}${query}`,
        );
        const data = res.data?.data || res.data;
        if (data) {
          if (data.current_arahan) {
            setArahanText(data.current_arahan);
          }
          if (data.column) {
            setTargetColumn(data.column);
          }
          if (data.sheetTab?.title) {
            setTabTitle(data.sheetTab.title);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data arahan dari server:", err);
      } finally {
        setLoadingCurrent(false);
      }
    }

    if (user?.id) {
      loadCurrentData();
    }
  }, [year, month, tab, row, indikator, user?.id]);

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
      const endpoint = `${baseUrl}/api/kabalai/tambah-catatan`;

      const res = await api.post(endpoint, {
        user_id: user?.id,
        year,
        month,
        tab,
        row,
        column: targetColumn,
        arahan: arahanText,
      });

      const message =
        res.data?.message ||
        `Arahan pimpinan berhasil disimpan ke Google Sheet pada kolom ${targetColumn || "arahan"}${row}!`;
      setSuccessMsg(message);
      setTimeout(() => {
        router.push(backUrl);
      }, 1500);
    } catch (err: unknown) {
      console.error("Gagal menyimpan arahan pimpinan:", err);
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message ||
          "Gagal menyimpan arahan pimpinan ke Google Sheet. Pastikan server dan sheet aktif."
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
            Form Arahan Kepala Balai (Yogi Abaso Mataram)
          </h1>
          <p className="text-xs text-slate-500">
            Input instruksi tindak lanjut langsung tersimpan ke kolom Arahan Pimpinan di Google Sheet.
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Icon icon="solar:check-circle-bold" width={20} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <Icon icon="solar:danger-triangle-bold" width={20} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Target & Indicator Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Indikator yang Dievaluasi
            </span>
            <h3 className="mt-1 text-base font-bold text-slate-900">{indikator}</h3>
          </div>
          {tabTitle && (
            <span className="w-fit rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Tab: {tabTitle}
            </span>
          )}
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
            <span className="text-xs text-slate-400">Baris Sheet</span>
            <p className="mt-0.5 text-sm font-bold text-slate-800">Baris {row}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <span className="text-xs text-emerald-700">Target Sel Sheet</span>
            <p className="mt-0.5 text-sm font-bold text-emerald-800">
              {targetColumn ? `${targetColumn}${row}` : "Memuat..."}
            </p>
          </div>
        </div>

        {targetColumn && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Icon icon="solar:shield-check-bold" width={16} className="text-emerald-600 shrink-0" />
            <span>
              Kolom Sheet <strong className="text-slate-900 font-mono">{targetColumn}</strong> ditandai di bawah tabel untuk PIC: <strong className="text-slate-900">Yogi Abaso Mataram</strong> (<span className="text-emerald-700 font-semibold">editable</span>).
            </span>
          </div>
        )}
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="arahanInput"
              className="block text-sm font-bold text-slate-800"
            >
              Instruksi / Arahan Kepala Balai
            </label>
            {loadingCurrent && (
              <span className="text-xs text-slate-400 italic">
                Memeriksa data sheet...
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Tuliskan tindak lanjut, catatan evaluasi, atau perbaikan yang harus dipenuhi oleh PIC kegiatan pada periode {month}.
          </p>

          <textarea
            id="arahanInput"
            rows={5}
            value={arahanText}
            onChange={(e) => setArahanText(e.target.value)}
            placeholder="Contoh: Percepat target sampling pengujian mikrobiologi pada minggu ke-3 dan laporkan progres sebelum tanggal 25..."
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
            {submitting ? "Menyimpan ke Sheet..." : "Simpan Arahan ke Google Sheet"}
          </button>
        </div>
      </form>
    </div>
  );
}
