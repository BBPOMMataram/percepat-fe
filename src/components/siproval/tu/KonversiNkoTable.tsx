"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

interface MonthData {
  month: number;
  month_name: string;
  target: string | null;
  realisasi: string | null;
  capaian: number | null;
  capaian_dinormalisasi: number | null;
  kategori_iku: string | null;
  nilai_sasaran: number | null;
  kategori_sasaran: string | null;
  is_active: boolean;
}

interface IkuItem {
  iku_no: number;
  iku_name: string;
  ss_no: number;
  ss_name: string;
  is_annual_target: boolean;
  months: Record<number, MonthData>;
}

interface SasaranGroup {
  ss_no: number;
  ss_name: string;
  iku_list: number[];
}

interface MonthlySummaryItem {
  month: number;
  month_name: string;
  nko_score: number;
  predikat_nko: string;
  total_active_iku: number;
  total_tercapai: number;
  pagu_anggaran: number;
  realisasi_anggaran: number;
  capaian_anggaran: number;
}

export default function KonversiNkoTable() {
  const [year, setYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([2026]);
  const [ikus, setIkus] = useState<IkuItem[]>([]);
  const [sasaranGroups, setSasaranGroups] = useState<SasaranGroup[]>([]);
  const [summaries, setSummaries] = useState<Record<number, MonthlySummaryItem>>({});
  const [monthNames, setMonthNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filter tampilan bulan: 0 = Semua Bulan (12 Bulan), 1..12 = Bulan tertentu
  const [viewMonth, setViewMonth] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal edit anggaran
  const [showAnggaranModal, setShowAnggaranModal] = useState<boolean>(false);
  const [editPagu, setEditPagu] = useState<string>("159124921000");
  const [editRealisasi, setEditRealisasi] = useState<string>("75582856775");
  const [savingAnggaran, setSavingAnggaran] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNkoData = async (targetYear: number) => {
    try {
      setLoading(true);
      setNotice(null);
      const res = await api.get(`${baseUrl}/api/tu/nko?year=${targetYear}`);
      if (res.data?.data) {
        const d = res.data.data;
        setIkus(d.ikus || []);
        setSasaranGroups(d.sasaran_groups || []);
        setSummaries(d.monthly_summaries || {});
        setMonthNames(d.month_names || {});
        if (d.available_years) setAvailableYears(d.available_years);
        if (d.year_info?.pagu_anggaran) setEditPagu(String(d.year_info.pagu_anggaran));
        if (d.year_info?.realisasi_anggaran) setEditRealisasi(String(d.year_info.realisasi_anggaran));
      }
    } catch (err: any) {
      console.error("Gagal memuat data konversi NKO:", err);
      setNotice({
        type: "error",
        message: err?.response?.data?.message || "Gagal memuat data konversi NKO dari server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNkoData(year);
  }, [year]);

  const handleSyncRhpk = async () => {
    try {
      setSyncing(true);
      setNotice(null);
      const res = await api.post(`${baseUrl}/api/tu/nko/sync`, { year });
      setNotice({
        type: "success",
        message: res.data?.message || "Sinkronisasi data NKO dari RHPK berhasil diperbarui.",
      });
      await fetchNkoData(year);
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.response?.data?.message || "Gagal melakukan sinkronisasi NKO.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", String(year));

    try {
      setUploading(true);
      setNotice(null);
      const res = await api.post(`${baseUrl}/api/tu/nko/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNotice({
        type: "success",
        message: res.data?.message || "File Excel berhasil diunggah dan seluruh data NKO diperbarui.",
      });
      await fetchNkoData(year);
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.response?.data?.message || "Gagal mengunggah file Excel.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAnggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAnggaran(true);
      await api.post(`${baseUrl}/api/tu/nko/update-anggaran`, {
        year,
        pagu: parseFloat(editPagu),
        realisasi: parseFloat(editRealisasi),
      });
      setShowAnggaranModal(false);
      setNotice({
        type: "success",
        message: "Pagu dan realisasi anggaran berhasil diperbarui.",
      });
      await fetchNkoData(year);
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.response?.data?.message || "Gagal menyimpan perubahan anggaran.",
      });
    } finally {
      setSavingAnggaran(false);
    }
  };

  const displayedMonths = useMemo(() => {
    if (viewMonth === 0) {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    return [viewMonth];
  }, [viewMonth]);

  const filteredIkus = useMemo(() => {
    if (!searchQuery.trim()) return ikus;
    const q = searchQuery.toLowerCase();
    return ikus.filter(
      (ik) =>
        ik.iku_name.toLowerCase().includes(q) ||
        ik.ss_name.toLowerCase().includes(q) ||
        String(ik.iku_no).includes(q)
    );
  }, [ikus, searchQuery]);

  const getCapaianColor = (val: number | null) => {
    if (val === null) return "text-slate-400";
    if (val > 100) return "text-cyan-600 font-bold";
    if (val >= 100) return "text-emerald-600 font-bold";
    if (val >= 80) return "text-lime-600 font-bold";
    if (val >= 60) return "text-amber-600 font-bold";
    return "text-rose-600 font-bold";
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Page */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
              Tata Usaha (TU)
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              Peraturan Ka BPOM No. 676/2025
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Tabel Konversi Nilai Kinerja Organisasi (NKO)
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Pengukuran capaian kinerja 28 IKU dan 8 Sasaran Kegiatan dengan formula normalisasi $\le$ 110%, koreksi akuntabilitas, dan rata-rata berkala bulanan/triwulanan/tahunan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol kembali ke Realisasi RO */}
          <Link
            href="/siproval/tu/realisasi-ro"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <Icon icon="solar:arrow-left-bold" className="text-base" />
            Realisasi RO
          </Link>

          {/* Tombol Pengaturan Anggaran */}
          <button
            type="button"
            onClick={() => setShowAnggaranModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <Icon icon="solar:wallet-money-bold" className="text-base" />
            Set Anggaran
          </button>

          {/* Tombol Upload Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Icon icon="solar:upload-track-bold" className={`text-base ${uploading ? "animate-bounce" : ""}`} />
            {uploading ? "Mengunggah..." : "Unggah Excel"}
          </button>

          {/* Tombol Sinkronisasi dari RHPK */}
          <button
            type="button"
            onClick={handleSyncRhpk}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-cyan-700 disabled:opacity-50"
          >
            <Icon icon="solar:refresh-circle-bold" className={`text-base ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Menyinkronkan..." : "Sinkronkan RHPK"}
          </button>
        </div>
      </div>

      {/* Alert Notifikasi */}
      {notice && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon={notice.type === "success" ? "solar:check-circle-bold" : "solar:danger-triangle-bold"}
              className="text-lg flex-shrink-0"
            />
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
          >
            <Icon icon="solar:close-circle-bold" className="text-base" />
          </button>
        </div>
      )}

      {/* Toolbar Filter & Kontrol */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pilih Tahun */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-600">Tahun:</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tampilan Bulan */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-600">Tampilan Kolom:</label>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value={0}>Semua Bulan (12 Bulan)</option>
              {Object.entries(monthNames).map(([num, name]) => (
                <option key={num} value={num}>
                  Bulan {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pencarian */}
        <div className="relative min-w-[240px]">
          <Icon
            icon="solar:magnifer-linear"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
          <input
            type="text"
            placeholder="Cari indikator atau sasaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Ringkasan NKO 12 Bulan (Cards Horizontal) */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {displayedMonths.map((mNum) => {
            const sum = summaries[mNum];
            const mName = monthNames[mNum] || `Bulan ${mNum}`;
            const score = sum ? Number(sum.nko_score) : 0;
            const predikat = sum?.predikat_nko || "Belum Ada Data";
            const activeCount = sum?.total_active_iku || 0;

            const isSeptember = mNum === 9;

            return (
              <div
                key={mNum}
                className={`min-w-[170px] rounded-2xl p-4 border transition-all ${
                  isSeptember
                    ? "bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-300 shadow-sm"
                    : "bg-white border-slate-100 shadow-sm hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isSeptember ? "text-cyan-700" : "text-slate-600"}>
                    {mName.toUpperCase()}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                      score > 100
                        ? "bg-cyan-100 text-cyan-800"
                        : score >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {predikat}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-800 tracking-tight">
                  {score > 0 ? `${score.toFixed(2)}%` : "-"}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>IKU Aktif:</span>
                  <span className="font-bold text-slate-700">{activeCount} / 28</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Konversi Utama (Sticky 12 Bulan) */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full border-collapse text-left text-xs">
            {/* Header Bertingkat */}
            <thead className="sticky top-0 z-30 bg-[#1a2b49] text-white shadow-md">
              {/* Row 1: Header Bulan */}
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-40 bg-[#1a2b49] w-12 py-3 px-2 text-center border-r border-b border-white/20"
                >
                  NO
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-12 z-40 bg-[#1a2b49] min-w-[220px] max-w-[260px] py-3 px-3 border-r border-b border-white/20"
                >
                  SASARAN KEGIATAN
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[308px] z-40 bg-[#1a2b49] w-14 py-3 px-2 text-center border-r border-b border-white/20"
                >
                  IKU
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[364px] z-40 bg-[#1a2b49] min-w-[280px] max-w-[340px] py-3 px-3 border-r border-b border-white/20 shadow-r"
                >
                  INDIKATOR KINERJA
                </th>

                {/* Kolom per Bulan */}
                {displayedMonths.map((mNum) => (
                  <th
                    key={mNum}
                    colSpan={5}
                    className="py-2.5 px-3 text-center border-r border-b border-white/20 font-extrabold uppercase tracking-wider bg-slate-800/90"
                  >
                    {monthNames[mNum] || `Bulan ${mNum}`}
                  </th>
                ))}
              </tr>

              {/* Row 2: Sub-kolom per Bulan */}
              <tr>
                {displayedMonths.map((mNum) => (
                  <div key={mNum} style={{ display: "contents" }}>
                    <th className="w-20 py-2 px-2 text-center border-r border-b border-white/20 text-[11px] font-semibold bg-slate-900/60">
                      TARGET
                    </th>
                    <th className="w-20 py-2 px-2 text-center border-r border-b border-white/20 text-[11px] font-semibold bg-slate-900/60">
                      REALISASI
                    </th>
                    <th className="w-24 py-2 px-2 text-center border-r border-b border-white/20 text-[11px] font-semibold bg-slate-900/60">
                      % CAPAIAN
                    </th>
                    <th className="w-28 py-2 px-2 text-center border-r border-b border-white/20 text-[11px] font-semibold bg-cyan-900/70 text-cyan-200">
                      NORMALISASI
                    </th>
                    <th className="w-24 py-2 px-2 text-center border-r border-b border-white/20 text-[11px] font-semibold bg-slate-900/60">
                      KATEGORI
                    </th>
                  </div>
                ))}
              </tr>

              {/* Row 3: Baris Ringkasan NKO Organisasi (Row 4 Excel) */}
              <tr className="bg-cyan-900/90 text-white font-extrabold text-[11px] tracking-wide border-b-2 border-cyan-400">
                <td
                  colSpan={4}
                  className="sticky left-0 z-40 bg-cyan-900 py-2.5 px-4 uppercase text-left border-r border-cyan-700 shadow-r"
                >
                  Nilai Kinerja Organisasi (NKO) & Rata-rata Normalisasi
                </td>
                {displayedMonths.map((mNum) => {
                  const s = summaries[mNum];
                  const score = s ? Number(s.nko_score) : 0;
                  const predikat = s?.predikat_nko || "-";
                  return (
                    <div key={mNum} style={{ display: "contents" }}>
                      <td colSpan={2} className="py-2.5 px-2 text-center border-r border-cyan-700 text-cyan-200">
                        Rata-rata:
                      </td>
                      <td colSpan={2} className="py-2.5 px-2 text-center border-r border-cyan-700 text-white font-black text-xs">
                        {score > 0 ? `${score.toFixed(2)}%` : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-cyan-700 text-cyan-200 text-[10px]">
                        {predikat}
                      </td>
                    </div>
                  );
                })}
              </tr>
            </thead>

            {/* Isi Baris 28 IKU */}
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4 + displayedMonths.length * 5}
                    className="py-16 text-center text-slate-400"
                  >
                    <Icon icon="solar:refresh-circle-bold" className="mx-auto mb-2 text-3xl animate-spin text-cyan-600" />
                    Memuat data tabel konversi NKO...
                  </td>
                </tr>
              ) : filteredIkus.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + displayedMonths.length * 5}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    Tidak ada indikator yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredIkus.map((ik, rowIdx) => {
                  const isEven = rowIdx % 2 === 1;
                  return (
                    <tr
                      key={ik.iku_no}
                      className={`transition-colors hover:bg-slate-50 ${
                        isEven ? "bg-slate-50/40" : "bg-white"
                      }`}
                    >
                      {/* Sticky Kolom Kiri */}
                      <td className="sticky left-0 z-20 bg-inherit py-2.5 px-2 text-center font-bold text-slate-500 border-r border-slate-100">
                        {ik.ss_no}
                      </td>
                      <td className="sticky left-12 z-20 bg-inherit py-2.5 px-3 text-slate-700 font-medium leading-tight border-r border-slate-100">
                        {ik.ss_name}
                      </td>
                      <td className="sticky left-[308px] z-20 bg-inherit py-2.5 px-2 text-center font-black text-slate-800 border-r border-slate-100">
                        {ik.iku_no}
                      </td>
                      <td className="sticky left-[364px] z-20 bg-inherit py-2.5 px-3 text-slate-800 font-semibold leading-tight border-r border-slate-100 shadow-r">
                        {ik.iku_name}
                        {ik.is_annual_target && (
                          <span className="ml-1.5 inline-block rounded bg-amber-50 px-1 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200">
                            Tahunan
                          </span>
                        )}
                      </td>

                      {/* Kolom per Bulan */}
                      {displayedMonths.map((mNum) => {
                        const mData = ik.months?.[mNum];
                        const target = mData?.target ?? "-";
                        const real = mData?.realisasi ?? "-";
                        const cap = mData?.capaian !== null && mData?.capaian !== undefined ? `${mData.capaian.toFixed(2)}%` : "-";
                        const norm = mData?.capaian_dinormalisasi !== null && mData?.capaian_dinormalisasi !== undefined ? `${mData.capaian_dinormalisasi.toFixed(2)}%` : "-";
                        const kat = mData?.kategori_iku || "-";
                        const isActive = mData?.is_active ?? false;

                        return (
                          <div key={mNum} style={{ display: "contents" }}>
                            {/* Target */}
                            <td className="py-2 px-2 text-center font-medium text-slate-700 border-r border-slate-100 whitespace-nowrap">
                              {target}
                            </td>
                            {/* Realisasi */}
                            <td className="py-2 px-2 text-center font-medium text-slate-700 border-r border-slate-100 whitespace-nowrap">
                              {real}
                            </td>
                            {/* % Capaian */}
                            <td
                              className={`py-2 px-2 text-center border-r border-slate-100 whitespace-nowrap ${getCapaianColor(
                                mData?.capaian ?? null
                              )}`}
                            >
                              {cap}
                            </td>
                            {/* Normalisasi (Maks 110%) */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 whitespace-nowrap font-bold bg-cyan-50/20 text-cyan-800">
                              {norm}
                            </td>
                            {/* Kategori IKU */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 whitespace-nowrap text-[11px] text-slate-600">
                              {kat}
                            </td>
                          </div>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Pagu dan Realisasi Anggaran */}
      {showAnggaranModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Icon icon="solar:wallet-money-bold" className="text-cyan-600 text-xl" />
                Pengaturan Anggaran DIPA {year}
              </h3>
              <button
                type="button"
                onClick={() => setShowAnggaranModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <Icon icon="solar:close-circle-bold" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveAnggaran} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Pagu Anggaran (Rp)</label>
                <input
                  type="number"
                  step="any"
                  value={editPagu}
                  onChange={(e) => setEditPagu(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Realisasi Anggaran (Rp)</label>
                <input
                  type="number"
                  step="any"
                  value={editRealisasi}
                  onChange={(e) => setEditRealisasi(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex justify-between font-bold">
                  <span>Persentase Capaian Belanja:</span>
                  <span className="text-cyan-700">
                    {Number(editPagu) > 0
                      ? `${((Number(editRealisasi) / Number(editPagu)) * 100).toFixed(2)}%`
                      : "0.00%"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnggaranModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAnggaran}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
                >
                  {savingAnggaran ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

