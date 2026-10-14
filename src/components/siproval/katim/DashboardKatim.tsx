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

interface DashboardMetrics {
  counts_iku: Record<
    number,
    {
      tidak_dapat_disimpulkan: number;
      sangat_baik: number;
      baik: number;
      cukup: number;
    }
  >;
  counts_caput: Record<
    number,
    {
      caput_tidak_mencapai_target: number;
    }
  >;
  anggaran_data: Array<{
    bulan: string;
    pagu: number;
    realisasi: number;
    persentase: number;
    sisa_anggaran: number;
  }>;
  npss_data: Array<{
    bulan: string;
    nilai: number;
    penilaian: string;
  }>;
}

export default function DashboardKatim() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx + 1); // 1-indexed
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [arahanList, setArahanList] = useState<any[]>([]);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(
    "https://docs.google.com/spreadsheets/d/1KXN2ukZTcDUZ-9kfc3BbM-qi3VumvcHUSELK91nGqnU/edit#gid=180451485"
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
  };

  // Caput stats for selected month
  const currentCaput = metrics?.counts_caput?.[selectedMonthIdx] || {
    caput_tidak_mencapai_target: 0,
  };

  // Anggaran stats for selected month
  const currentAnggaran = metrics?.anggaran_data?.find(
    (a) =>
      a.bulan?.toLowerCase() === selectedMonthName.toLowerCase() ||
      a.bulan === String(selectedMonthIdx)
  ) || null;

  // NPSS stats for selected month
  const currentNpss = metrics?.npss_data?.find(
    (n) =>
      n.bulan?.toLowerCase() === selectedMonthName.toLowerCase() ||
      n.bulan === String(selectedMonthIdx)
  ) || null;

  return (
    <div className="space-y-8">
      {/* Banner Katim */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005baa] to-[#007cdb] p-6 text-white shadow-md lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Icon icon="solar:user-check-bold" width={16} /> PIC / Ketua Tim Kerja
          </span>
          <h1 className="mt-3 text-2xl font-bold lg:text-3xl">
            Selamat Datang, {userName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base">
            Pantau dan lakukan pengisian realisasi kinerja kegiatan tim Anda secara berkala
            pada dokumen Google Sheets yang terhubung di SIPROVAL.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/google-sheets"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:document-text-bold" width={18} />
              Input Data Google Sheet
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-15">
          <Icon icon="solar:widget-5-bold" width={320} height={320} />
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          <Icon icon="solar:danger-triangle-bold" width={20} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Month Filter Selector for Metrics */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Icon icon="solar:calendar-bold" className="text-[#005baa]" width={20} />
          <span className="font-semibold">Pilih Periode Pengukuran Bulan:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonthIdx}
            onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m} {currentYear}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leadership Directive Highlights */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Icon icon="solar:chat-round-line-bold" width={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Arahan & Evaluasi Pimpinan (Kepala Balai)
                </h3>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {selectedMonthName} {currentYear}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Catatan evaluasi dan rekomendasi Kepala Balai terhadap IKSK yang Anda pimpin.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs transition hover:bg-emerald-100 hover:border-emerald-400"
              title="Buka dokumen Google Spreadsheet Rekap Data RHPK di tab baru"
            >
              <Icon icon="ri:file-excel-2-fill" width={15} className="text-emerald-700" />
              <span>Spreadsheet Rekap RHPK</span>
              <Icon icon="solar:arrow-right-up-linear" width={12} className="text-emerald-600" />
            </a>

            <Link
              href="/siproval/katim/arahan-pimpinan"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-2xs transition hover:bg-indigo-50"
            >
              <span>Buka Semua Arahan</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>

        <div className="mt-4">
          {loadingArahan ? (
            <div className="flex items-center justify-center py-6 text-xs text-slate-400">
              <Icon icon="solar:refresh-circle-bold" width={20} className="animate-spin text-indigo-600 mr-2" />
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
                      className="rounded-xl border border-indigo-200/90 bg-white p-4 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-800">
                          IKSK {item.iksk_id}: {item.indikator.length > 50 ? `${item.indikator.substring(0, 50)}...` : item.indikator}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {item.capaian_persen}%
                        </span>
                      </div>
                      <p className="mt-2 text-xs italic font-medium text-slate-800 bg-indigo-50/60 p-2.5 rounded-lg border-l-4 border-indigo-600">
                        &ldquo;{item.arahan_pimpinan}&rdquo;
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Pemberi: {item.pemberi_arahan}</span>
                        <Link
                          href={`/siproval/google-sheets?iksk_id=${item.iksk_id}`}
                          className="font-semibold text-indigo-600 hover:underline"
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
                  className="font-semibold text-indigo-600 hover:underline text-[11px]"
                >
                  Lihat Riwayat Arahan Lengkap
                </Link>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4 Metric Boxes (IKU, Output/Caput, Anggaran, NPSS) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* Box 1: IKU */}
        <div className="flex flex-col justify-between rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100/60 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-cyan-600 px-2.5 py-1 text-xs font-bold text-white">
                IKU
              </span>
              <Icon icon="solar:chart-2-bold" width={22} className="text-cyan-700" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              Indikator Kinerja Utama
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Capaian pada bulan <strong>{selectedMonthName}</strong>:
            </p>

            {loading ? (
              <div className="mt-4 flex items-center justify-center py-6 text-slate-400">
                <Icon icon="solar:refresh-circle-bold" width={24} className="animate-spin text-cyan-600" />
              </div>
            ) : (
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center justify-between border-b border-cyan-200/50 pb-1">
                  <span>Sangat Baik:</span>
                  <span className="font-bold text-emerald-700">{currentIku.sangat_baik} IKU</span>
                </li>
                <li className="flex items-center justify-between border-b border-cyan-200/50 pb-1">
                  <span>Baik:</span>
                  <span className="font-bold text-blue-700">{currentIku.baik} IKU</span>
                </li>
                <li className="flex items-center justify-between border-b border-cyan-200/50 pb-1">
                  <span>Cukup:</span>
                  <span className="font-bold text-amber-700">{currentIku.cukup} IKU</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Tidak Disimpulkan:</span>
                  <span className="font-bold text-slate-600">{currentIku.tidak_dapat_disimpulkan} IKU</span>
                </li>
              </ul>
            )}
          </div>

          <div className="mt-5 border-t border-cyan-200 pt-3">
            <Link
              href="/siproval/google-sheets"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800"
            >
              <span>Perbarui Capaian</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>

        {/* Box 2: OUTPUT / CAPUT */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/60 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white">
                OUTPUT
              </span>
              <Icon icon="solar:box-bold" width={22} className="text-amber-700" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              Capaian Output (Caput)
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Pengukuran realisasi s/d <strong>{selectedMonthName}</strong>:
            </p>

            {loading ? (
              <div className="mt-4 flex items-center justify-center py-6 text-slate-400">
                <Icon icon="solar:refresh-circle-bold" width={24} className="animate-spin text-amber-600" />
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-amber-200/50 bg-white/70 p-3 text-xs text-slate-700">
                <p>
                  Terdapat{" "}
                  <strong className="text-amber-700">
                    {currentCaput.caput_tidak_mencapai_target} RO
                  </strong>{" "}
                  yang tidak mencapai target realisasi SAKTI.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-amber-200 pt-3">
            <Link
              href="/siproval/google-sheets"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-800"
            >
              <span>Lihat Detail Output</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>

        {/* Box 3: ANGGARAN */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/60 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#005baa] px-2.5 py-1 text-xs font-bold text-white">
                ANGGARAN
              </span>
              <Icon icon="solar:wallet-money-bold" width={22} className="text-[#005baa]" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              Serapan Anggaran
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Pagu vs Realisasi belanja {selectedMonthName}:
            </p>

            {loading ? (
              <div className="mt-4 flex items-center justify-center py-6 text-slate-400">
                <Icon icon="solar:refresh-circle-bold" width={24} className="animate-spin text-[#005baa]" />
              </div>
            ) : currentAnggaran ? (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Persentase Serapan:</span>
                  <span className="text-[#005baa]">{currentAnggaran.persentase || 0}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                  <div
                    className="h-full rounded-full bg-[#005baa]"
                    style={{ width: `${Math.min(currentAnggaran.persentase || 0, 100)}%` }}
                  />
                </div>
                <p className="text-right text-[11px] text-slate-500">
                  Realisasi: Rp {Number(currentAnggaran.realisasi || 0).toLocaleString("id-ID")}
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-blue-100 bg-white/70 p-3 text-xs text-slate-500">
                Belum ada data anggaran tercatat untuk bulan ini.
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-blue-200 pt-3">
            <Link
              href="/siproval/budget-mapping"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#004b8d]"
            >
              <span>Detail Budget</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>

        {/* Box 4: NPSS */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                NPSS
              </span>
              <Icon icon="solar:star-fall-bold" width={22} className="text-emerald-700" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              Nilai Kinerja Publik
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Indeks kepuasan bulan {selectedMonthName}:
            </p>

            {loading ? (
              <div className="mt-4 flex items-center justify-center py-6 text-slate-400">
                <Icon icon="solar:refresh-circle-bold" width={24} className="animate-spin text-emerald-600" />
              </div>
            ) : currentNpss ? (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-700">
                    {currentNpss.nilai}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">/ 100</span>
                </div>
                <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-800">
                  ★ Kategori: {currentNpss.penilaian || "Cukup"}
                </span>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-emerald-100 bg-white/70 p-3 text-xs text-slate-500">
                Belum ada penilaian NPSS tercatat untuk bulan ini.
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-emerald-200 pt-3">
            <Link
              href="/siproval/google-sheets"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
            >
              <span>Laporan Lengkap</span>
              <Icon icon="solar:arrow-right-linear" width={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
