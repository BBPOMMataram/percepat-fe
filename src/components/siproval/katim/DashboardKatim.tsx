"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";
import TargetRealisasiTuChart from "@/components/siproval/tu/TargetRealisasiTuChart";
import SimetrisNkoDashboard from "../dashboard/SimetrisNkoDashboard";
import IkskMonitoringSection, { IkskFilter } from "../dashboard/IkskMonitoringSection";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

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

export interface IndicatorItem {
  row_number: number;
  iksk_id: number;
  no_indikator?: number;
  spreadsheet_id?: number | null;
  tab_id?: number | null;
  label: string;
  sasaran: string;
  sasaran_kode?: string;
  sasaran_nama?: string;
  target_tahunan: string;
  target_bulan: string;
  realisasi_bulan: string;
  capaian: number;
  status: "tercapai" | "belum";
  arahan: string;
}

interface IkskItem {
  id: number;
  name: string;
}

interface DashboardMetrics {
  total_assigned_iksks?: number;
  user_iksks?: Array<{ id: number; name: string }>;
  total_arahan_pimpinan?: number;
  data_source?: string;
  counts_iku?: Record<
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
  counts_caput?: Record<
    number,
    {
      caput_tidak_mencapai_target: number;
      caput_mencapai_target: number;
    }
  >;
  indicators_by_month?: Record<number, IndicatorItem[]>;
}

interface KatimStats {
  total_iksk?: number;
  total_iksk_connected?: number;
  iksks?: IkskItem[];
  indicators?: IndicatorItem[];
  total_spreadsheets?: number;
  total_indikator?: number;
  total_catatan?: number;
  total_arahan?: number;
  perlu_evaluasi?: number;
  tercapai?: number;
}

export default function DashboardKatim() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentMonthIdx = new Date().getMonth(); // 0-indexed (e.g. 10 for November)
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTHS[currentMonthIdx] || "NOVEMBER"
  );
  const selectedMonthIdx = MONTHS.indexOf(selectedMonth) + 1;
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [counts, setCounts] = useState({ total: 0, tercapai: 0, belum: 0 });
  const [filterRequest, setFilterRequest] = useState<{ filter: IkskFilter; nonce: number } | null>(null);
  const handleCounts = useCallback((c: { total: number; tercapai: number; belum: number }) => setCounts(c), []);

  const userName = user?.name || user?.call_name || "Ketua Tim (Katim)";
  const selectedMonthTitle =
    selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1).toLowerCase();
  const currentPerluEvaluasi = counts.belum;
  const scrollToTable = (filter: IkskFilter) => setFilterRequest({ filter, nonce: Date.now() });

  // Fetch Katim personal metrics
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("user_id", String(user.id));
        const res = await api.get(
          `${baseUrl}/api/katim/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
        );
        if (res.data?.status === "success" && res.data?.data) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error("Gagal memuat metrik dashboard Katim:", err);
      }
    };

    fetchDashboardMetrics();
  }, [user?.id]);

  // Specific indicators assigned to this Katim
  const myAssignedIndicators =
    metrics?.indicators_by_month?.[selectedMonthIdx] || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner with BBPOM Blue & Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] p-6 text-white shadow-lg lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon
                icon="solar:shield-check-bold"
                width={15}
                className="text-emerald-300"
              />
              Ketua Tim Kerja (Katim)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon
                icon="solar:database-bold"
                width={14}
                className="text-blue-200"
              />
              Data Riil Rekapitulasi RHPK &amp; TU 2026
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Selamat Datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Pantau rekapitulasi capaian indikator kinerja (IKSK), grafik
            realisasi target RO &amp; anggaran TU, serta koordinasikan pengisian
            dan tindak lanjut arahan secara terintegrasi.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/katim/entry-data-rhpk"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:pen-new-square-bold" width={16} />
              <span>Entry Data RHPK</span>
            </Link>
            <button
              type="button"
              onClick={() => scrollToTable("belum")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-400"
            >
              <Icon icon="solar:danger-triangle-bold" width={16} />
              <span>Rincian IKSK Belum Tercapai ({currentPerluEvaluasi})</span>
            </button>
            <Link
              href="/siproval/katim/arahan-pimpinan"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Icon
                icon="solar:chat-round-line-bold"
                width={16}
                className="text-emerald-300"
              />
              <span>Lihat Arahan Pimpinan</span>
            </Link>
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 opacity-15">
          <Icon icon="solar:widget-5-bold" width={340} height={340} />
        </div>
      </div>

      {/* Monitoring capaian IKSK (komponen bersama Dashboard Katim & TU) */}
      <IkskMonitoringSection
        apiPath="/api/katim/form-catatan"
        fallbackApiPath="/api/kabalai/form-catatan"
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        rhpkHref={(id) => `/siproval/katim/entry-data-rhpk?iksk_id=${id}`}
        arahanHref="/siproval/katim/arahan-pimpinan"
        filterRequest={filterRequest}
        onCountsChange={handleCounts}
        middle={
          <>
            {/* Bagian 1: Grafik Target vs Realisasi dari Aktor TU */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#005baa] text-white">
            <Icon icon="solar:chart-square-bold" width={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Monitoring Kinerja &amp; Anggaran Satuan Kerja (Data TU)
            </h2>
            <p className="text-[11px] text-slate-500">
              Grafik target vs realisasi Volume Rincian Output (RO) dan serapan
              Pagu Anggaran BBPOM di Mataram Tahun Anggaran 2026.
            </p>
          </div>
        </div>

        {/* Simetris BPOM Dashboard: NKO, Pagu, Realisasi, Capaian & Kerangka Kerja Logis */}
        <SimetrisNkoDashboard initialYear={currentYear} initialMonth="September" />

        <TargetRealisasiTuChart isKabalaiView={true} />
      </div>
          </>
        }
      />


      {/* Bagian 3: Rekapitulasi Data Asli Indikator Tim (Khusus Tim Katim Saat Ini) */}
      {myAssignedIndicators.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-emerald-50/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi Data Asli Indikator Tim ({selectedMonthTitle}{" "}
                  {currentYear})
                </h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#005baa]">
                  {myAssignedIndicators.length} Indikator Tim
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Nilai capaian riil indikator yang secara spesifik ditugaskan ke
                tim Anda.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Klik tombol{" "}
              <strong className="text-[#005baa] font-bold">
                &quot;Buka IKSK&quot;
              </strong>{" "}
              pada baris terkait untuk langsung membuka formulir pengisian RHPK.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 w-12 text-center">No</th>
                  <th className="px-4 py-3 min-w-[260px]">
                    Indikator & Sasaran Kegiatan
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Target 2026
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Target {selectedMonthTitle}
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Realisasi {selectedMonthTitle}
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    % Capaian
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">
                    Arahan Kepala Balai
                  </th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">
                    Aksi Pengisian RHPK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {myAssignedIndicators.map((ind) => {
                  const isTercapai = ind.status === "tercapai";
                  const hasReal =
                    ind.realisasi_bulan &&
                    ind.realisasi_bulan !== "#DIV/0!" &&
                    ind.realisasi_bulan !== "";

                  return (
                    <tr
                      key={ind.row_number}
                      className="hover:bg-blue-50/30 transition"
                    >
                      <td className="px-4 py-3.5 text-center font-bold text-slate-600 align-top">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          title={`Buka formulir RHPK untuk IKSK #${ind.iksk_id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700 text-xs transition hover:bg-[#005baa] hover:text-white"
                        >
                          {ind.iksk_id}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          className="font-bold text-slate-900 hover:text-[#005baa] transition"
                          title={`Buka formulir RHPK untuk IKSK #${ind.iksk_id}`}
                        >
                          {ind.label}
                        </Link>
                        {ind.sasaran && (
                          <div className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[10px] shrink-0">
                              Sasaran {ind.sasaran_kode || (ind.sasaran.includes(' - ') ? ind.sasaran.split(' - ')[0] : '01')}
                            </span>
                            <span className="line-clamp-2 text-slate-600">
                              {ind.sasaran_nama || (ind.sasaran.includes(' - ') ? ind.sasaran.substring(ind.sasaran.indexOf(' - ') + 3) : ind.sasaran)}
                            </span>
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
                          <span className="text-slate-400 italic text-[11px]">
                            -
                          </span>
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
                            <span className="italic">
                              &ldquo;{ind.arahan}&rdquo;
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada arahan
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center align-top whitespace-nowrap">
                        <Link
                          href={`/siproval/katim/entry-data-rhpk?iksk_id=${ind.iksk_id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90 hover:shadow-sm"
                          title={`Buka formulir RHPK IKSK #${ind.iksk_id}`}
                        >
                          <Icon
                            icon="ri:file-excel-2-fill"
                            width={15}
                            className="text-emerald-300"
                          />
                          <span>Buka IKSK #{ind.iksk_id}</span>
                          <Icon icon="solar:arrow-right-linear" width={13} />
                        </Link>
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
