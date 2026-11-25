"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

const MONTHS = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

interface ArahanRecord {
  row_number: number;
  iksk_id: number;
  no: number;
  sasaran: string;
  indikator: string;
  iksk_name: string;
  month: string;
  target_tahunan: string;
  target_bulan: string;
  realisasi_bulan: string;
  capaian_persen: number;
  status_capaian: "tercapai" | "belum";
  kendala: string;
  rtl: string;
  arahan_pimpinan: string;
  has_arahan: boolean;
  pemberi_arahan: string;
  sheet_row_url?: string;
}

interface UserIksk {
  id: number;
  name: string;
}

export default function ArahanPimpinanKatim() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();

  const initialIksk = searchParams.get("iksk_id");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedIkskId, setSelectedIkskId] = useState<string>(initialIksk || "");
  const [userIksks, setUserIksks] = useState<UserIksk[]>([]);
  const [arahanList, setArahanList] = useState<ArahanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchArahan = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const queryParams = new URLSearchParams();
      if (user?.id) queryParams.set("user_id", String(user.id));
      if (selectedMonth && selectedMonth !== "ALL") queryParams.set("month", selectedMonth);
      if (selectedIkskId) queryParams.set("iksk_id", selectedIkskId);

      const res = await api.get(
        `${baseUrl}/api/katim/arahan-pimpinan?${queryParams.toString()}`
      );

      if (res.data?.status === "success" && res.data?.data) {
        setUserIksks(res.data.data.iksks || []);
        setArahanList(res.data.data.arahan_list || []);
      }
    } catch (err: any) {
      console.error("Gagal memuat arahan pimpinan:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Gagal memuat daftar arahan pimpinan dari server Siproval."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchArahan();
    }
  }, [user?.id, selectedMonth, selectedIkskId]);

  // Statistik
  const totalAssignedIksks = userIksks.length;
  const recordsWithDirectives = arahanList.filter((a) => a.has_arahan);
  const tercapaiCount = arahanList.filter((a) => a.capaian_persen >= 100).length;
  const belumTercapaiCount = arahanList.filter((a) => a.capaian_persen < 100 && (a.target_bulan || a.realisasi_bulan)).length;

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Arahan Pimpinan untuk IKSK Anda
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Daftar arahan, evaluasi, dan rekomendasi dari Kepala Balai (Yogi Abaso Mataram) berdasarkan rekapitulasi capaian RHPK dan kendala yang Anda laporkan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/siproval/katim/entry-data-rhpk"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            title="Buka lembar pengisian indikator IKSK Anda"
          >
            <span>Form Pengisian IKSK</span>
          </Link>
          <button
            type="button"
            onClick={fetchArahan}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004281] disabled:opacity-50"
          >
            <Icon
              icon="solar:refresh-line-duotone"
              width={15}
              className={loading ? "animate-spin" : ""}
            />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total IKSK Ditugaskan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">IKSK Ditugaskan</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {totalAssignedIksks}
            </span>
            <span className="text-xs text-slate-500">Indikator</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Tercatat pada akun Ketua Tim Anda
          </p>
        </div>

        {/* Card 2: Total Arahan Diterima */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Arahan Pimpinan</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#004281]">
              {recordsWithDirectives.length}
            </span>
            <span className="text-xs text-slate-500">Catatan</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Arahan aktif dari Kepala Balai
          </p>
        </div>

        {/* Card 3: Target Tercapai */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Capaian Tercapai (≥100%)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              {tercapaiCount}
            </span>
            <span className="text-xs text-emerald-600">Bulan</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Memenuhi target kinerja yang ditetapkan
          </p>
        </div>

        {/* Card 4: Perlu Perhatian / Kendala */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Perlu Perhatian (&lt;100%)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">
              {belumTercapaiCount}
            </span>
            <span className="text-xs text-amber-600">Bulan</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Memerlukan akselerasi & tindak lanjut
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        {/* Filter Bulan */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Periode Bulan
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            <option value="ALL">Semua Bulan (Januari - Desember)</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Filter IKSK */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Pilih IKSK / Indikator
          </label>
          <select
            value={selectedIkskId}
            onChange={(e) => setSelectedIkskId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            <option value="">Semua IKSK Ditugaskan ({userIksks.length})</option>
            {userIksks.map((i) => (
              <option key={i.id} value={i.id}>
                IKSK {i.id}: {i.name.length > 60 ? `${i.name.substring(0, 60)}...` : i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Directives List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-3 text-xs font-medium text-slate-500">
              Memuat data arahan pimpinan...
            </p>
          </div>
        ) : arahanList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h3 className="text-sm font-bold text-slate-700">
              Tidak Ada Data Indikator Ditemukan
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              Tidak ada data IKSK terhubung dengan akun Anda pada kriteria filter yang dipilih. Pastikan akun Ketua Tim Anda sudah dipetakan dengan IKSK di sistem.
            </p>
          </div>
        ) : (
          arahanList.map((item, idx) => {
            const hasDirective = item.has_arahan;
            const hasCap = item.capaian_persen > 0;
            const isTercapai = item.capaian_persen >= 100;

            return (
              <div
                key={`${item.iksk_id}-${item.month}-${idx}`}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                  hasDirective
                    ? "border-blue-200"
                    : "border-slate-200"
                }`}
              >
                {/* Item Header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#005baa] text-xs font-bold text-white">
                      {item.iksk_id}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                          {item.month}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {item.indikator}
                        </span>
                      </div>
                      {item.sasaran && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {item.sasaran}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        isTercapai
                          ? "bg-emerald-100 text-emerald-800"
                          : hasCap
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isTercapai ? "Tercapai" : hasCap ? "Belum Tercapai" : "Belum Berjalan"}
                    </span>

                    <Link
                      href={`/siproval/katim/entry-data-rhpk?iksk_id=${item.iksk_id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                      title="Buka form input IKSK ini"
                    >
                      <span>Input di RHPK</span>
                    </Link>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  {/* Performance stats row */}
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-4">
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Target Tahunan
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {item.target_tahunan || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Target {item.month}
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {item.target_bulan || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Realisasi {item.month}
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {item.realisasi_bulan || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Capaian Kinerja
                      </span>
                      <p
                        className={`text-xs font-extrabold ${
                          isTercapai ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {item.capaian_persen}%
                      </p>
                    </div>
                  </div>

                  {/* Kendala & RTL Row */}
                  {(item.kendala || item.rtl) && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700">
                          Kendala Dilaporkan
                        </span>
                        <p className="mt-1.5 text-xs text-slate-600">
                          {item.kendala || "Tidak ada kendala dicatat."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700">
                          Rencana Tindak Lanjut (RTL)
                        </span>
                        <p className="mt-1.5 text-xs text-slate-600">
                          {item.rtl || "Tidak ada RTL dicatat."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Leadership Directive Callout Box */}
                  {hasDirective ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#004281]">
                          Arahan Pimpinan
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {item.pemberi_arahan}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-900 bg-white p-3 rounded-lg border-l-4 border-[#005baa] leading-relaxed">
                        &ldquo;{item.arahan_pimpinan}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
                      <div>
                        <span>Belum ada catatan atau arahan khusus dari Kepala Balai untuk periode ini.</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        Status: Menunggu arahan
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

