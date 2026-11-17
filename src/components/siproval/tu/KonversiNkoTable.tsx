"use client";

import { Fragment, useEffect, useState, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import api from "@/utils/api";
import { getNkoPredikat, getSakipCategory } from "@/utils/sakipCategory";

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
  const [editPagu, setEditPagu] = useState<string>("0");
  const [editRealisasi, setEditRealisasi] = useState<string>("0");
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

  // Badge capaian IK sesuai kategori Pedoman SAKIP BPOM (lihat utils/sakipCategory)
  const renderCapaianBadge = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400">-</span>;
    }
    const cat = getSakipCategory(val);
    return (
      <span
        title={`${cat.label} (${cat.range})`}
        className={`inline-flex items-center justify-center min-w-[64px] rounded-md px-2 py-0.5 text-xs font-bold ${cat.className}`}
      >
        {val.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* Header Page — selaras dengan Design System SIPROVAL / BPOM */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/siproval/tu" className="hover:text-[#005baa] transition">
              Tata Usaha
            </Link>
            <Icon icon="solar:alt-arrow-right-linear" width={13} className="text-slate-400" />
            <span className="font-semibold text-[#005baa]">Konversi NKO</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Tabel Konversi Nilai Kinerja Organisasi (NKO)
            </h1>
            <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#005baa]">
              Peraturan Ka BPOM No. 676/2025
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pengukuran capaian kinerja 28 IKU dan 8 Sasaran Kegiatan dengan formula normalisasi (&le; 110%), koreksi akuntabilitas, dan rata-rata berkala.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Secondary Action: Sinkronisasi dari RHPK */}
          <button
            type="button"
            onClick={handleSyncRhpk}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#004b8d] disabled:opacity-50"
          >
            <Icon icon="solar:refresh-circle-bold" className={`text-base ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Menyinkronkan..." : "Sinkronkan RHPK"}</span>
          </button>

          {/* Secondary Action: Upload Excel */}
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Icon icon="solar:upload-track-2-bold" className={`text-base text-emerald-600 ${uploading ? "animate-bounce" : ""}`} />
            <span>{uploading ? "Mengunggah..." : "Unggah Excel"}</span>
          </button>

          {/* Utility Action: Pengaturan Anggaran */}
          <button
            type="button"
            onClick={() => setShowAnggaranModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Icon icon="solar:wallet-money-bold" className="text-base text-[#005baa]" />
            <span>Set Anggaran</span>
          </button>

          {/* Utility Navigation: Realisasi RO */}
          <Link
            href="/siproval/tu/realisasi-ro"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <Icon icon="solar:arrow-left-linear" className="text-sm" />
            <span>Realisasi RO</span>
          </Link>
        </div>
      </div>

      {/* Alert Notifikasi */}
      {notice && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon={notice.type === "success" ? "solar:check-circle-bold" : "solar:danger-triangle-bold"}
              className="text-lg shrink-0"
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

      {/* Ringkasan NKO 12 Bulan (Cards Horizontal) */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2.5 min-w-max">
          {displayedMonths.map((mNum) => {
            const sum = summaries[mNum];
            const mName = monthNames[mNum] || `Bulan ${mNum}`;
            const score = sum ? Number(sum.nko_score) : 0;
            const predikat = sum?.predikat_nko || "Belum Ada Data";
            const activeCount = sum?.total_active_iku || 0;
            const isSelected = viewMonth === mNum;

            return (
              <button
                key={mNum}
                type="button"
                onClick={() => setViewMonth(viewMonth === mNum ? 0 : mNum)}
                className={`min-w-[162px] rounded-xl p-3.5 border text-left transition ${
                  isSelected
                    ? "bg-blue-50/70 border-[#005baa] ring-1 ring-[#005baa]/20 shadow-xs"
                    : "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                  <span className={isSelected ? "text-[#005baa]" : "text-slate-700"}>
                    {mName.toUpperCase()}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      (sum?.total_active_iku ?? 0) > 0
                        ? getNkoPredikat(score).className
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {predikat}
                  </span>
                </div>
                <div className="mt-1.5 text-xl font-extrabold text-slate-900 tracking-tight">
                  {score > 0 ? `${score.toFixed(2)}%` : "-"}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>IKU Aktif:</span>
                  <span className="font-semibold text-slate-700">{activeCount} / 28</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kartu Utama: Toolbar Filter + Tabel Konversi Utama */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs border border-slate-200">
        {/* Toolbar Filter & Kontrol */}
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Pilih Tahun */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Tahun:</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-[#005baa] focus:border-[#005baa] focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tampilan Bulan */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Periode Bulan:</label>
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-700 focus:border-[#005baa] focus:outline-none"
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
          <div className="relative min-w-[260px]">
            <Icon
              icon="solar:magnifer-linear"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <input
              type="text"
              placeholder="Cari kode IKU, indikator, atau sasaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#005baa] focus:outline-none"
            />
          </div>
        </div>

        {/* Tabel Konversi Utama (Sticky Kolom Kiri Solid & Z-Index Terstruktur) */}
        <div className="overflow-x-auto max-h-[74vh] relative">
          <table
            className={`w-full border-collapse text-left text-xs table-fixed ${
              displayedMonths.length > 1 ? "min-w-[5920px]" : "min-w-[1120px]"
            }`}
          >
            <colgroup>
              {/* 4 Sticky Left Columns: 48 + 230 + 52 + 310 = 640px */}
              <col style={{ width: "48px" }} />
              <col style={{ width: "230px" }} />
              <col style={{ width: "52px" }} />
              <col style={{ width: "310px" }} />
              {/* 5 Columns per Displayed Month: 84 + 84 + 92 + 104 + 96 = 460px */}
              {displayedMonths.map((mNum) => (
                <Fragment key={`colgroup_${mNum}`}>
                  <col style={{ width: "84px" }} />
                  <col style={{ width: "84px" }} />
                  <col style={{ width: "92px" }} />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "96px" }} />
                </Fragment>
              ))}
            </colgroup>

            {/* Header Bertingkat */}
            <thead className="sticky top-0 z-30 bg-[#004281] text-white">
              {/* Row 1: Header Bulan */}
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 top-0 z-40 bg-[#004281] w-[48px] min-w-[48px] max-w-[48px] py-3 px-2 text-center border-r border-b border-white/15 font-bold"
                >
                  NO
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[48px] top-0 z-40 bg-[#004281] w-[230px] min-w-[230px] max-w-[230px] py-3 px-3 border-r border-b border-white/15 font-bold"
                >
                  SASARAN KEGIATAN
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[278px] top-0 z-40 bg-[#004281] w-[52px] min-w-[52px] max-w-[52px] py-3 px-2 text-center border-r border-b border-white/15 font-bold"
                >
                  IKU
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[330px] top-0 z-40 bg-[#004281] w-[310px] min-w-[310px] max-w-[310px] py-3 px-3 border-r-2 border-b border-white/25 shadow-[4px_0_10px_-2px_rgba(15,23,42,0.22)] font-bold"
                >
                  INDIKATOR KINERJA
                </th>

                {/* Kolom per Bulan */}
                {displayedMonths.map((mNum, idx) => (
                  <th
                    key={`h_month_${mNum}`}
                    colSpan={5}
                    className={`py-2.5 px-3 text-center border-r border-b border-white/15 font-extrabold uppercase tracking-wider ${
                      idx % 2 === 0 ? "bg-[#005baa]" : "bg-[#004281]"
                    }`}
                  >
                    {monthNames[mNum] || `Bulan ${mNum}`}
                  </th>
                ))}
              </tr>

              {/* Row 2: Sub-kolom per Bulan */}
              <tr>
                {displayedMonths.map((mNum) => (
                  <Fragment key={`h_sub_${mNum}`}>
                    <th className="py-2 px-2 text-center border-r border-b border-white/15 text-[11px] font-semibold bg-[#00376b]">
                      TARGET
                    </th>
                    <th className="py-2 px-2 text-center border-r border-b border-white/15 text-[11px] font-semibold bg-[#00376b]">
                      REALISASI
                    </th>
                    <th className="py-2 px-2 text-center border-r border-b border-white/15 text-[11px] font-semibold bg-[#00376b]">
                      % CAPAIAN
                    </th>
                    <th className="py-2 px-2 text-center border-r border-b border-white/15 text-[11px] font-bold bg-[#004c94] text-amber-200">
                      NORMALISASI
                    </th>
                    <th className="py-2 px-2 text-center border-r border-b border-white/15 text-[11px] font-semibold bg-[#00376b]">
                      KATEGORI
                    </th>
                  </Fragment>
                ))}
              </tr>

              {/* Row 3: Baris Ringkasan NKO Organisasi */}
              <tr className="bg-[#f0f7ff] text-slate-900 font-bold text-[11px] border-b-2 border-slate-300">
                <td
                  colSpan={4}
                  className="sticky left-0 z-40 bg-[#e6f0fa] py-2.5 px-4 uppercase text-left text-[#004281] font-extrabold border-r-2 border-slate-300 shadow-[4px_0_10px_-2px_rgba(15,23,42,0.12)]"
                >
                  Nilai Kinerja Organisasi (NKO) &amp; Rata-rata Normalisasi
                </td>
                {displayedMonths.map((mNum) => {
                  const s = summaries[mNum];
                  const score = s ? Number(s.nko_score) : 0;
                  const predikat = s?.predikat_nko || "-";
                  return (
                    <Fragment key={`h_sum_${mNum}`}>
                      <td colSpan={2} className="py-2 px-2 text-center border-r border-slate-200 text-slate-600 font-semibold bg-[#f0f7ff]">
                        Rata-rata:
                      </td>
                      <td colSpan={2} className="py-2 px-2 text-center border-r border-slate-200 text-[#005baa] font-extrabold text-xs bg-[#f0f7ff]">
                        {score > 0 ? `${score.toFixed(2)}%` : "-"}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-300 text-slate-700 font-bold text-[10px] bg-[#f0f7ff]">
                        {predikat}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            </thead>

            {/* Isi Baris 28 IKU */}
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={4 + displayedMonths.length * 5}
                    className="py-16 text-center text-slate-500"
                  >
                    <Icon icon="solar:refresh-circle-bold" className="mx-auto mb-2 text-3xl animate-spin text-[#005baa]" />
                    Memuat data tabel konversi NKO...
                  </td>
                </tr>
              ) : filteredIkus.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + displayedMonths.length * 5}
                    className="py-12 text-center text-slate-500 font-medium"
                  >
                    Tidak ada indikator yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredIkus.map((ik, rowIdx) => {
                  const isEven = rowIdx % 2 === 1;
                  // Background 100% solid (tanpa alpha/opacity) agar sel yang di-scroll di belakangnya tidak tembus
                  const rowBgClass = isEven ? "bg-[#f8fafc]" : "bg-white";
                  const stickyCellBgClass = isEven
                    ? "bg-[#f8fafc] group-hover:bg-[#f1f5f9]"
                    : "bg-white group-hover:bg-[#f1f5f9]";

                  return (
                    <tr
                      key={ik.iku_no}
                      className={`group transition-colors hover:bg-[#f1f5f9] ${rowBgClass}`}
                    >
                      {/* Sticky Kolom Kiri — Lebar & Left Offset Presisi + Background Solid + Z-20 */}
                      <td
                        className={`sticky left-0 z-20 ${stickyCellBgClass} w-[48px] min-w-[48px] max-w-[48px] py-2.5 px-2 text-center font-bold text-slate-500 border-r border-slate-200 align-top`}
                      >
                        {ik.ss_no}
                      </td>
                      <td
                        className={`sticky left-[48px] z-20 ${stickyCellBgClass} w-[230px] min-w-[230px] max-w-[230px] py-2.5 px-3 text-slate-700 font-medium leading-snug border-r border-slate-200 align-top break-words`}
                      >
                        {ik.ss_name}
                      </td>
                      <td
                        className={`sticky left-[278px] z-20 ${stickyCellBgClass} w-[52px] min-w-[52px] max-w-[52px] py-2.5 px-2 text-center font-extrabold text-[#005baa] border-r border-slate-200 align-top`}
                      >
                        {ik.iku_no}
                      </td>
                      <td
                        className={`sticky left-[330px] z-20 ${stickyCellBgClass} w-[310px] min-w-[310px] max-w-[310px] py-2.5 px-3 text-slate-800 font-semibold leading-snug border-r-2 border-slate-300 shadow-[4px_0_10px_-2px_rgba(15,23,42,0.12)] align-top break-words`}
                      >
                        {ik.iku_name}
                        {ik.is_annual_target && (
                          <span className="ml-1.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
                            Tahunan
                          </span>
                        )}
                      </td>

                      {/* Kolom per Bulan (z-0 berada di bawah kolom sticky z-20) */}
                      {displayedMonths.map((mNum) => {
                        const mData = ik.months?.[mNum];
                        const target = mData?.target ?? "-";
                        const real = mData?.realisasi ?? "-";
                        const kat = mData?.kategori_iku || "-";

                        return (
                          <Fragment key={`cell_${ik.iku_no}_${mNum}`}>
                            {/* Target */}
                            <td className="relative z-0 py-2.5 px-2 text-center font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap align-top">
                              {target}
                            </td>
                            {/* Realisasi */}
                            <td className="relative z-0 py-2.5 px-2 text-center font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap align-top">
                              {real}
                            </td>
                            {/* % Capaian */}
                            <td className="relative z-0 py-2.5 px-2 text-center border-r border-slate-200 whitespace-nowrap align-top">
                              {renderCapaianBadge(mData?.capaian)}
                            </td>
                            {/* Normalisasi (Maks 110%) */}
                            <td className="relative z-0 py-2.5 px-2 text-center border-r border-slate-200 whitespace-nowrap align-top">
                              {renderCapaianBadge(mData?.capaian_dinormalisasi)}
                            </td>
                            {/* Kategori IKU */}
                            <td className="relative z-0 py-2.5 px-2 text-center border-r border-slate-300 whitespace-nowrap text-[11px] text-slate-600 align-top">
                              {kat}
                            </td>
                          </Fragment>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon icon="solar:wallet-money-bold" className="text-[#005baa] text-xl" />
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:bg-white focus:outline-none"
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-[#005baa] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
                <div className="flex justify-between font-bold">
                  <span>Persentase Capaian Belanja:</span>
                  <span className="text-[#005baa]">
                    {Number(editPagu) > 0
                      ? `${((Number(editRealisasi) / Number(editPagu)) * 100).toFixed(2)}%`
                      : "0.00%"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAnggaranModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAnggaran}
                  className="rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#004b8d] disabled:opacity-50"
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

