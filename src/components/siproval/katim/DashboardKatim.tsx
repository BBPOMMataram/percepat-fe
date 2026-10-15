"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface IndicatorItem {
  row_number: number;
  iksk_id: number;
  label: string;
  sasaran: string;
  target_tahunan: string;
  target_bulan: string;
  realisasi_bulan: string;
  capaian: number;
  status: "tercapai" | "belum";
  arahan: string;
}

interface DashboardMetrics {
  total_assigned_iksks?: number;
  user_iksks?: Array<{ id: number; name: string }>;
  total_arahan_pimpinan?: number;
  data_source?: string;
  counts_iku: Record<
    number,
    {
      tidak_dapat_disimpulkan: number;
      sangat_baik: number;
      baik: number;
      cukup: number;
      total: number;
      persen_tercapai: number;
    }
  >;
  counts_caput: Record<
    number,
    {
      caput_tidak_mencapai_target: number;
      caput_mencapai_target: number;
    }
  >;
  indicators_by_month?: Record<number, IndicatorItem[]>;
  anggaran_data?: Array<{
    bulan: string;
    pagu: number;
    realisasi: number;
    persentase: number;
    sisa_anggaran: number;
  }>;
  npss_data?: Array<{
    bulan: string;
    nilai: number;
    penilaian: string;
  }>;
}

export default function DashboardKatim() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentMonthIdx = new Date().getMonth(); // 0-indexed
  const currentYear = new Date().getFullYear();

  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx + 1); // 1-indexed
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [arahanList, setArahanList] = useState<any[]>([]);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(
    "https://docs.google.com/spreadsheets/d/1olc0eU3cffI-d-dtZVSaw_sFNaW_ggxeX3KR-ElzcZU/edit#gid=180451485"
  );
  const [loadingArahan, setLoadingArahan] = useState<boolean>(true);

  const userName = user?.name || user?.call_name || "Ketua Tim (Katim)";
  const selectedMonthName = MONTHS[selectedMonthIdx - 1] || "Januari";

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("user_id", String(user.id));
        const url = `${baseUrl}/api/katim/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const res = await api.get(url);
        if (res.data?.status === "success" && res.data?.data) {
          setMetrics(res.data.data);
        }
      } catch (err: any) {
        console.error("Gagal memuat metrik dashboard Katim:", err);
        setErrorMsg("Gagal terhubung ke API backend Siproval. Silakan periksa koneksi server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.id]);

  useEffect(() => {
    const fetchArahan = async () => {
      setLoadingArahan(true);
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("user_id", String(user.id));
        queryParams.set("month", selectedMonthName.toUpperCase());
        const res = await api.get(
          `${baseUrl}/api/katim/arahan-pimpinan?${queryParams.toString()}`
        );
        if (res.data?.status === "success" && res.data?.data) {
          setArahanList(res.data.data.arahan_list || []);
          if (res.data.data.spreadsheet_url) {
            setSpreadsheetUrl(res.data.data.spreadsheet_url);
          }
        }
      } catch (err) {
        console.error("Gagal memuat arahan pimpinan di dashboard:", err);
      } finally {
        setLoadingArahan(false);
      }
    };

    if (user?.id) {
      fetchArahan();
    }
  }, [user?.id, selectedMonthName]);

  // IKU stats for selected month
  const currentIku = metrics?.counts_iku?.[selectedMonthIdx] || {
    sangat_baik: 0,
    baik: 0,
    cukup: 0,
    tidak_dapat_disimpulkan: 0,
    total: 0,
    persen_tercapai: 0,
  };

  // Caput stats for selected month
  const currentCaput = metrics?.counts_caput?.[selectedMonthIdx] || {
    caput_tidak_mencapai_target: 0,
    caput_mencapai_target: 0,
  };

  // Real indicators list for this month
  const currentMonthIndicators = metrics?.indicators_by_month?.[selectedMonthIdx] || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner with BBPOM Blue & Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] p-6 text-white shadow-lg lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon icon="solar:user-check-bold" width={15} className="text-emerald-300" />
              PIC / Ketua Tim Kerja
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon icon="solar:database-bold" width={14} className="text-blue-200" />
              Data Riil Google Spreadsheet 2026
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Selamat Datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Pantau ringkasan hasil pengukuran kinerja asli, capaian target indikator tugas Anda,
            serta tindak lanjut arahan Kepala Balai secara real-time.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/google-sheets"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:document-text-bold" width={16} />
              <span>Input Data Google Sheet</span>
            </Link>

            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Icon icon="ri:file-excel-2-fill" width={16} className="text-emerald-300" />
              <span>Buka Dokumen RHPK di Sheets</span>
              <Icon icon="solar:arrow-right-up-linear" width={13} />
            </a>
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 opacity-15">
          <Icon icon="solar:widget-5-bold" width={340} height={340} />
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <Icon icon="solar:danger-triangle-bold" width={20} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Month Filter Selector */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#005baa]">
            <Icon icon="solar:calendar-bold" width={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Periode Pengukuran Bulan:</span>
            <span className="text-[11px] text-slate-500">Data hasil rekapitulasi capaian indikator RHPK</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonthIdx}
            onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
            className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2 text-xs font-bold text-[#005baa] transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m} {currentYear}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards in BBPOM Blue & Green Gradients */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: BBPOM Blue Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                IKSK Tugas Saya
              </span>
              <div className="mt-2 text-3xl font-extrabold text-[#005baa]">
                {loading ? "..." : (metrics?.total_assigned_iksks ?? 0)}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                IKSK terdaftar pada akun Anda
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100/70 text-[#005baa]">
              <Icon icon="solar:document-text-bold" width={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-100/80 flex items-center justify-between text-[11px] text-[#005baa]">
            <span className="font-medium">Total Baris Indikator</span>
            <span className="font-bold">{currentIku.total} Baris</span>
          </div>
        </div>

        {/* Card 2: BBPOM Green Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00a651]">
                Target Terpenuhi
              </span>
              <div className="mt-2 text-3xl font-extrabold text-emerald-700">
                {loading ? "..." : currentCaput.caput_mencapai_target}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Capaian realisasi ≥ 100% ({selectedMonthName})
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-700">
              <Icon icon="solar:check-circle-bold" width={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-[11px] text-emerald-800">
            <span className="font-medium">Persentase Sukses</span>
            <span className="font-bold">{currentIku.persen_tercapai}%</span>
          </div>
        </div>

        {/* Card 3: BBPOM Teal / Cyan Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Perlu Perhatian
              </span>
              <div className="mt-2 text-3xl font-extrabold text-teal-700">
                {loading ? "..." : currentCaput.caput_tidak_mencapai_target}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Di bawah target / belum ada data
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100/70 text-teal-700">
              <Icon icon="solar:danger-triangle-bold" width={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-teal-100/80 flex items-center justify-between text-[11px] text-teal-800">
            <span className="font-medium">Kategori Cukup</span>
            <span className="font-bold">{currentIku.cukup} Indikator</span>
          </div>
        </div>

        {/* Card 4: Soft Amber / Blue Accent Gradient */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-blue-50/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Arahan Pimpinan
              </span>
              <div className="mt-2 text-3xl font-extrabold text-amber-700">
                {loading ? "..." : arahanList.filter((a) => a.has_arahan).length}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Arahan Kepala Balai ({selectedMonthName})
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-700">
              <Icon icon="solar:chat-round-line-bold" width={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-100/80 flex items-center justify-between text-[11px] text-amber-900">
            <span className="font-medium">Total Rekap Tahunan</span>
            <span className="font-bold">{metrics?.total_arahan_pimpinan ?? 0} Arahan</span>
          </div>
        </div>
      </div>

      {/* Leadership Directive Highlights */}
      <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 via-white to-emerald-50/40 p-6 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005baa] text-white shadow-2xs">
              <Icon icon="solar:chat-round-line-bold" width={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Arahan Kepala Balai (Yogi Abaso Mataram)
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#005baa]">
                  Bulan {selectedMonthName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Catatan evaluasi dan instruksi tindak lanjut terhadap IKSK yang Anda pimpin.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs transition hover:bg-emerald-100"
              title="Buka dokumen Google Spreadsheet Rekap Data RHPK di tab baru"
            >
              <Icon icon="ri:file-excel-2-fill" width={15} className="text-emerald-700" />
              <span>Spreadsheet Rekap RHPK</span>
              <Icon icon="solar:arrow-right-up-linear" width={12} className="text-emerald-600" />
            </a>

            <Link
              href="/siproval/katim/arahan-pimpinan"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#005baa] shadow-2xs transition hover:bg-blue-50"
            >
              <span>Riwayat Arahan Lengkap</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>

        <div className="mt-4">
          {loadingArahan ? (
            <div className="flex items-center justify-center py-6 text-xs text-slate-400">
              <Icon icon="solar:restart-linear" width={20} className="animate-spin text-[#005baa] mr-2" />
              <span>Memuat arahan pimpinan...</span>
            </div>
          ) : (() => {
            const withDirectives = arahanList.filter((a) => a.has_arahan);
            if (withDirectives.length > 0) {
              return (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {withDirectives.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-blue-200/90 bg-white p-4 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-900">
                          IKSK #{item.iksk_id}: {item.indikator.length > 50 ? `${item.indikator.substring(0, 50)}...` : item.indikator}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {item.capaian_persen}%
                        </span>
                      </div>
                      <p className="mt-2 text-xs italic font-medium text-slate-800 bg-amber-50/70 p-2.5 rounded-lg border-l-4 border-amber-500">
                        &ldquo;{item.arahan_pimpinan}&rdquo;
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Pemberi: {item.pemberi_arahan}</span>
                        <Link
                          href={`/siproval/google-sheets?iksk_id=${item.iksk_id}`}
                          className="font-semibold text-[#005baa] hover:underline"
                        >
                          Buka di Sheet →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:info-circle-linear" width={16} className="text-slate-400" />
                  <span>
                    Belum ada arahan khusus dari Kepala Balai untuk bulan {selectedMonthName}.
                  </span>
                </div>
                <Link
                  href="/siproval/katim/arahan-pimpinan"
                  className="font-semibold text-[#005baa] hover:underline text-[11px]"
                >
                  Lihat Riwayat Arahan Lengkap
                </Link>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 2 Detail Breakdown Boxes (IKU & Caput) with BBPOM Blue & Green Gradient Accents */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Box 1: IKU Real Distribution */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/80 via-white to-blue-100/50 p-6 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#005baa] px-2.5 py-1 text-xs font-bold text-white">
                IKU
              </span>
              <Icon icon="solar:chart-2-bold" width={22} className="text-[#005baa]" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Distribusi Kategori IKU Tim
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Klasifikasi capaian riil indikator pada bulan <strong>{selectedMonthName}</strong>:
            </p>

            {loading ? (
              <div className="mt-4 flex items-center justify-center py-6 text-slate-400">
                <Icon icon="solar:restart-linear" width={24} className="animate-spin text-[#005baa]" />
              </div>
            ) : (
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                <li className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Sangat Baik (&gt; 100%):
                  </span>
                  <span className="font-bold text-emerald-700">{currentIku.sangat_baik} Indikator</span>
                </li>
                <li className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Baik (= 100%):
                  </span>
                  <span className="font-bold text-blue-700">{currentIku.baik} Indikator</span>
                </li>
                <li className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Cukup (&lt; 100%):
                  </span>
                  <span className="font-bold text-amber-700">{currentIku.cukup} Indikator</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Belum Ada Data / 0:
                  </span>
                  <span className="font-bold text-slate-600">{currentIku.tidak_dapat_disimpulkan} Indikator</span>
                </li>
              </ul>
            )}
          </div>

          <div className="mt-5 border-t border-blue-100 pt-3">
            <Link
              href="/siproval/google-sheets"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#004785]"
            >
              <span>Perbarui Capaian di Google Sheet</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>

        {/* Box 2: Capaian Output (Caput) */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-100/50 p-6 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#00a651] px-2.5 py-1 text-xs font-bold text-white">
                OUTPUT
              </span>
              <Icon icon="solar:box-bold" width={22} className="text-[#00a651]" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Evaluasi Target Output (Caput)
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Pengukuran realisasi s/d bulan <strong>{selectedMonthName}</strong>:
            </p>

            {loading ? (
              <div className="mt-4 flex items-center justify-center py-6 text-slate-400">
                <Icon icon="solar:restart-linear" width={24} className="animate-spin text-[#00a651]" />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/80 border border-emerald-100 p-3 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-800 block">Output Memenuhi Target:</span>
                    <span className="text-[11px] text-slate-500">Realisasi kumulatif sesuai sasaran</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-700">
                    {currentCaput.caput_mencapai_target}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/80 border border-amber-100 p-3 text-xs">
                  <div>
                    <span className="font-semibold text-amber-800 block">Belum Memenuhi Target:</span>
                    <span className="text-[11px] text-slate-500">Perlu akselerasi pelaksanaan</span>
                  </div>
                  <span className="text-xl font-bold text-amber-700">
                    {currentCaput.caput_tidak_mencapai_target}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-emerald-100 pt-3">
            <Link
              href="/siproval/google-sheets"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#00a651] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#008c44]"
            >
              <span>Lihat Detail Pelaksanaan</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Real Indicators Table for This Katim */}
      {currentMonthIndicators.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-emerald-50/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi Data Asli Indikator Tim ({selectedMonthName} 2026)
                </h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#005baa]">
                  {currentMonthIndicators.length} Indikator
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Nilai capaian riil yang tersimpan di Google Spreadsheet RHPK Balai.
              </p>
            </div>

            <Link
              href="/siproval/google-sheets"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005baa] hover:underline"
            >
              <span>Buka Formulir Pengisian</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 w-12 text-center">No</th>
                  <th className="px-4 py-3 min-w-[260px]">Indikator & Sasaran Kegiatan</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Target 2026</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Target {selectedMonthName}</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Realisasi {selectedMonthName}</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">% Capaian</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 min-w-[200px]">Arahan Kepala Balai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentMonthIndicators.map((ind) => {
                  const isTercapai = ind.status === "tercapai";
                  const hasReal = ind.realisasi_bulan && ind.realisasi_bulan !== "#DIV/0!" && ind.realisasi_bulan !== "";

                  return (
                    <tr key={ind.row_number} className="hover:bg-blue-50/30 transition">
                      <td className="px-4 py-3.5 text-center font-bold text-slate-600 align-top">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 font-bold text-blue-700 text-[11px]">
                          {ind.iksk_id}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <div className="font-bold text-slate-900">{ind.label}</div>
                        {ind.sasaran && (
                          <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                            {ind.sasaran}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {ind.target_tahunan || "-"}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {ind.target_bulan || "-"}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {hasReal ? (
                          <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-800 text-[11px]">
                            {ind.realisasi_bulan}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {hasReal && ind.capaian > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isTercapai
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <span>{ind.capaian}%</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                        {isTercapai ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <Icon icon="solar:check-circle-bold" width={14} />
                            Tercapai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <Icon icon="solar:clock-circle-bold" width={14} />
                            Belum
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        {ind.arahan ? (
                          <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                            <span className="font-bold text-amber-800 block text-[10px] uppercase">
                              Arahan:
                            </span>
                            <span className="italic">&ldquo;{ind.arahan}&rdquo;</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum ada arahan</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
