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
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(
    "https://docs.google.com/spreadsheets/d/1KXN2ukZTcDUZ-9kfc3BbM-qi3VumvcHUSELK91nGqnU/edit#gid=180451485"
  );
  const [spreadsheetName, setSpreadsheetName] = useState<string>("REKAP DATA RHPK 2026 Mataram");
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
        if (res.data.data.spreadsheet_url) {
          setSpreadsheetUrl(res.data.data.spreadsheet_url);
        }
        if (res.data.data.spreadsheet_name) {
          setSpreadsheetName(res.data.data.spreadsheet_name);
        }
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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              <Icon icon="solar:chat-round-line-bold" width={14} />
              Evaluasi & Tindak Lanjut Pimpinan
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#005baa]">
              <Icon icon="solar:user-bold" width={14} />
              {user?.name || "Ketua Tim"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Arahan Pimpinan untuk IKSK Anda
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Daftar arahan, evaluasi, dan rekomendasi dari Kepala Balai (Yogi Abaso Mataram) berdasarkan rekapitulasi capaian RHPK dan kendala yang Anda laporkan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-400"
            title={`Buka dokumen Google Spreadsheet ${spreadsheetName} di tab baru untuk melihat rincian lengkap`}
          >
            <Icon icon="ri:file-excel-2-fill" width={16} className="text-emerald-700" />
            <span>Lihat Spreadsheet Rekap RHPK</span>
            <Icon icon="solar:arrow-right-up-linear" width={13} className="text-emerald-600" />
          </a>

          <Link
            href="/siproval/katim/entry-data-rhpk"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            title="Buka lembar pengisian indikator IKSK Anda"
          >
            <Icon icon="solar:document-text-bold" width={16} className="text-[#005baa]" />
            <span>Form Pengisian IKSK</span>
          </Link>
          <button
            type="button"
            onClick={fetchArahan}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <Icon
              icon={loading ? "solar:refresh-circle-linear" : "solar:refresh-line-duotone"}
              width={16}
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
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:checklist-minimalistic-bold" width={18} />
            </span>
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
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800">Arahan Pimpinan</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Icon icon="solar:chat-round-line-bold" width={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-900">
              {recordsWithDirectives.length}
            </span>
            <span className="text-xs font-semibold text-indigo-700">Catatan</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-700/80">
            Arahan aktif dari Kepala Balai
          </p>
        </div>

        {/* Card 3: Target Tercapai */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Capaian Tercapai (≥100%)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon icon="solar:check-circle-bold" width={18} />
            </span>
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
        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Perlu Perhatian (&lt;100%)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Icon icon="solar:danger-triangle-bold" width={18} />
            </span>
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition focus:border-indigo-600 focus:bg-white focus:outline-none"
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition focus:border-indigo-600 focus:bg-white focus:outline-none"
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
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-3 text-xs font-medium text-slate-500">
              Memuat data arahan pimpinan dari Google Sheet...
            </p>
          </div>
        ) : arahanList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Icon icon="solar:chat-round-line-linear" width={48} className="mx-auto text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-700">
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
                    ? "border-indigo-200 ring-1 ring-indigo-200/50"
                    : "border-slate-200"
                }`}
              >
                {/* Item Header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-xs">
                      {item.iksk_id}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
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
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        isTercapai
                          ? "bg-emerald-100 text-emerald-800"
                          : hasCap
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon
                        icon={isTercapai ? "solar:check-circle-bold" : "solar:clock-circle-bold"}
                        width={12}
                      />
                      {isTercapai ? "Tercapai" : hasCap ? "Belum Tercapai" : "Belum Berjalan"}
                    </span>

                    {/* Quick link ke baris Google Sheet Rekap RHPK */}
                    <a
                      href={item.sheet_row_url || `${spreadsheetUrl}&range=A${item.row_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 hover:border-emerald-300"
                      title={`Buka baris ${item.row_number} pada Google Spreadsheet Rekap Data RHPK`}
                    >
                      <Icon icon="ri:file-excel-2-fill" width={13} className="text-emerald-700" />
                      <span>Rincian Rekap (Brs {item.row_number})</span>
                      <Icon icon="solar:arrow-right-up-linear" width={11} className="text-emerald-600" />
                    </a>

                    <Link
                      href={`/siproval/katim/entry-data-rhpk?iksk_id=${item.iksk_id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                      title="Buka form input IKSK ini di Google Sheet"
                    >
                      <Icon icon="solar:pen-new-square-bold" width={13} className="text-[#005baa]" />
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
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Icon icon="solar:danger-triangle-bold" width={14} className="text-amber-600" />
                          Kendala Dilaporkan
                        </span>
                        <p className="mt-1.5 text-xs text-slate-600">
                          {item.kendala || "Tidak ada kendala dicatat."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Icon icon="solar:refresh-circle-bold" width={14} className="text-blue-600" />
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
                    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-white p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:shield-check-bold" width={18} className="text-indigo-600" />
                          <span className="font-bold text-indigo-900">
                            Arahan Pimpinan:
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-700">
                          {item.pemberi_arahan}
                        </span>
                      </div>
                      <p className="mt-2 text-xs italic font-medium text-slate-900 bg-white/90 p-3 rounded-lg border-l-4 border-indigo-600 shadow-2xs leading-relaxed">
                        &ldquo;{item.arahan_pimpinan}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:chat-round-line-linear" width={16} className="text-slate-400" />
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

