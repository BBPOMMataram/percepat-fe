"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

interface IndicatorRhpk {
  row_number: number;
  iksk_id: number;
  no: number;
  sasaran: string;
  indikator: string;
  iksk_name: string;
  satuan: string;
  month: string;
  target_tahunan: string;
  target_bulan: string;
  realisasi_bulan: string;
  capaian_persen: number;
  status_capaian: "tercapai" | "belum";
  kendala: string;
  rekomendasi: string;
  rtl: string;
  arahan_pimpinan: string;
  columns: {
    target: string;
    real: string;
    kendala: string;
    rekomendasi: string;
    rtl: string;
    arahan: string;
  };
  sheet_row_url?: string;
}

interface UserIksk {
  id: number;
  name: string;
}

interface RhpkData {
  user_id: string;
  iksks: UserIksk[];
  months: string[];
  selected_month: string;
  selected_month_idx: number;
  is_month_locked: boolean;
  spreadsheet: {
    id: number;
    name: string;
    spreadsheet_id: string;
    url: string;
  };
  sheet_tab: {
    id: number;
    title: string;
    google_sheet_id: number;
  };
  indicators: IndicatorRhpk[];
  stats: {
    total_assigned_iksks: number;
    total_indicators: number;
    tercapai_count: number;
    belum_tercapai_count: number;
  };
  googleSheetError?: string | null;
}

export default function RhpkKatim() {
  const { user } = useSelector((state: RootState) => state.auth);

  const currentMonthIdx = new Date().getMonth(); // 0-indexed
  const defaultMonthName = MONTHS[currentMonthIdx] || "JANUARI";

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthName);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rhpkData, setRhpkData] = useState<RhpkData | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "tercapai" | "belum">("all");
  const [selectedIkskFilter, setSelectedIkskFilter] = useState<string>("all");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<IndicatorRhpk | null>(null);
  const [formData, setFormData] = useState({
    target_bulan: "",
    realisasi: "",
    kendala: "",
    rekomendasi: "",
    rtl: "",
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const queryParams = new URLSearchParams();
      if (user?.id) queryParams.set("user_id", String(user.id));
      queryParams.set("month", selectedMonth);
      queryParams.set("year", "2026");

      const res = await api.get(`${baseUrl}/api/katim/rhpk?${queryParams.toString()}`);
      if (res.data?.status === "success" && res.data?.data) {
        setRhpkData(res.data.data);
      } else {
        setErrorMsg(res.data?.message || "Gagal memuat data RHPK.");
      }
    } catch (err: any) {
      console.error("Gagal memuat data RHPK:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Gagal terhubung ke API backend Siproval. Silakan periksa koneksi server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, selectedMonth]);

  const openEditModal = (item: IndicatorRhpk) => {
    setEditingItem(item);
    setFormData({
      target_bulan: item.target_bulan || "",
      realisasi: item.realisasi_bulan && item.realisasi_bulan !== "#DIV/0!" ? item.realisasi_bulan : "",
      kendala: item.kendala || "",
      rekomendasi: item.rekomendasi || "",
      rtl: item.rtl || "",
    });
    setModalSuccessMsg(null);
    setModalErrorMsg(null);
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setModalSuccessMsg(null);
    setModalErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSaving(true);
    setModalSuccessMsg(null);
    setModalErrorMsg(null);

    try {
      const payload: Record<string, any> = {
        row: editingItem.row_number,
        month: selectedMonth,
        year: 2026,
        tab: rhpkData?.sheet_tab?.id || 154,
        target_bulan: formData.target_bulan,
        realisasi: formData.realisasi,
        kendala: formData.kendala,
        rekomendasi: formData.rekomendasi,
        rtl: formData.rtl,
      };
      if (user?.id) payload.user_id = String(user.id);

      const res = await api.post(`${baseUrl}/api/katim/rhpk/update`, payload);

      if (res.data?.status === "success") {
        setModalSuccessMsg("Data RHPK berhasil disimpan ke Google Sheets!");
        // Update local state directly
        if (rhpkData) {
          const updatedIndicators = rhpkData.indicators.map((ind) => {
            if (ind.row_number === editingItem.row_number) {
              const capPercent =
                parseFloat(formData.target_bulan) > 0
                  ? Math.round(
                      (parseFloat(formData.realisasi.replace(",", ".")) /
                        parseFloat(formData.target_bulan.replace(",", "."))) *
                        100
                    )
                  : ind.capaian_persen;
              return {
                ...ind,
                target_bulan: formData.target_bulan,
                realisasi_bulan: formData.realisasi,
                kendala: formData.kendala,
                rekomendasi: formData.rekomendasi,
                rtl: formData.rtl,
                capaian_persen: isNaN(capPercent) ? ind.capaian_persen : capPercent,
                status_capaian: (!isNaN(capPercent) && capPercent >= 100) ? ("tercapai" as const) : ("belum" as const),
              };
            }
            return ind;
          });
          setRhpkData({ ...rhpkData, indicators: updatedIndicators });
        }
        setTimeout(() => {
          closeEditModal();
        }, 1200);
      } else {
        setModalErrorMsg(res.data?.message || "Gagal menyimpan data ke Google Sheets.");
      }
    } catch (err: any) {
      console.error("Error updating RHPK:", err);
      setModalErrorMsg(
        err.response?.data?.message || "Terjadi kesalahan saat menyimpan data ke server."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Indicators
  const filteredIndicators = (rhpkData?.indicators || []).filter((item) => {
    // Search filter
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.indikator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sasaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.iksk_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.no).includes(searchQuery.trim());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || item.status_capaian === statusFilter;

    // IKSK ID filter
    const matchesIksk =
      selectedIkskFilter === "all" || String(item.iksk_id) === selectedIkskFilter;

    return matchesSearch && matchesStatus && matchesIksk;
  });

  const isLocked = rhpkData?.is_month_locked ?? false;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005baa] via-[#006ec7] to-[#0086e6] p-6 text-white shadow-md lg:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon icon="solar:shield-check-bold" width={14} className="text-emerald-300" />
              Khusus IKSK Tugas Anda
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-900/40 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon icon="solar:calendar-bold" width={14} className="text-blue-200" />
              Tahun 2026 • Tab {rhpkData?.sheet_tab?.title || "A. Capaian RAPK Mataram"}
            </span>
            {isLocked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/80 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                <Icon icon="solar:lock-bold" width={13} />
                Bulan Terkunci
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                <Icon icon="solar:lock-unlocked-bold" width={13} />
                Bulan Terbuka
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Pengisian Rekapitulasi Data RHPK
          </h1>

          <p className="text-sm text-blue-100 leading-relaxed">
            Halaman ini khusus menampilkan baris indikator kinerja (IKSK) yang ditugaskan kepada Anda.
            Silakan pilih bulan pengisian di bawah untuk memperbarui target, realisasi, kendala, rekomendasi,
            dan tindak lanjut langsung ke dokumen Google Spreadsheet RHPK.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {rhpkData?.spreadsheet?.url && (
              <a
                href={rhpkData.spreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
              >
                <Icon icon="ri:file-excel-2-fill" width={16} className="text-emerald-600" />
                <span>Buka Dokumen di Google Sheets</span>
                <Icon icon="solar:arrow-right-up-linear" width={13} />
              </a>
            )}

            <Link
              href="/siproval/katim/arahan-pimpinan"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Icon icon="solar:chat-round-line-bold" width={15} className="text-amber-300" />
              <span>Lihat Arahan Kepala Balai</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 right-20 h-48 w-48 rounded-full bg-blue-400/20 blur-xl" />
      </div>

      {/* Month Navigation Pills */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="mb-2 flex items-center justify-between px-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pilih Periode Bulan Pengisian:
          </span>
          <span className="text-xs font-medium text-slate-400">
            Aktif: <strong className="text-blue-600">{selectedMonth} 2026</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MONTHS.map((m, idx) => {
            const isActive = selectedMonth === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`group flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#005baa] text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{m}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">IKSK Saya</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon icon="solar:document-text-bold" width={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {rhpkData?.stats?.total_assigned_iksks ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">IKSK ditugaskan ke akun Anda</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Baris Indikator</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon icon="solar:list-check-bold" width={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {rhpkData?.stats?.total_indicators ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Baris terdaftar di RHPK Tab 154</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Tercapai (≥ 100%)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon icon="solar:check-circle-bold" width={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {rhpkData?.stats?.tercapai_count ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/70">Realisasi memenuhi target</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Belum Tercapai</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Icon icon="solar:clock-circle-bold" width={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {rhpkData?.stats?.belum_tercapai_count ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-amber-700/70">Di bawah target / belum ada input</p>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Icon
            icon="solar:magnifer-linear"
            width={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari indikator kinerja, sasaran, atau no IKSK..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Status Capaian */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("tercapai")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                statusFilter === "tercapai"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-emerald-700"
              }`}
            >
              Tercapai
            </button>
            <button
              onClick={() => setStatusFilter("belum")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                statusFilter === "belum"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-amber-700"
              }`}
            >
              Belum
            </button>
          </div>

          {/* Filter per IKSK if user has multiple IKSKs */}
          {rhpkData?.iksks && rhpkData.iksks.length > 1 && (
            <select
              value={selectedIkskFilter}
              onChange={(e) => setSelectedIkskFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Semua IKSK Anda</option>
              {rhpkData.iksks.map((iksk) => (
                <option key={iksk.id} value={String(iksk.id)}>
                  IKSK #{iksk.id}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Muat ulang data dari Google Sheet"
          >
            <Icon icon="solar:restart-linear" width={15} className={loading ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
          <Icon icon="solar:restart-circle-bold" width={48} className="animate-spin text-blue-600" />
          <h3 className="mt-4 text-base font-bold text-slate-800">Menghubungkan ke Google Spreadsheet RHPK</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Memuat baris indikator khusus untuk IKSK Anda untuk bulan {selectedMonth}...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 shadow-2xs">
          <Icon icon="solar:danger-triangle-bold" width={36} className="mx-auto text-rose-500" />
          <h3 className="mt-2 text-sm font-bold">Terjadi Kendala</h3>
          <p className="mt-1 text-xs">{errorMsg}</p>
          <button
            onClick={fetchData}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
          >
            <Icon icon="solar:restart-linear" width={14} />
            Coba Lagi
          </button>
        </div>
      ) : filteredIndicators.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon icon="solar:document-medicine-bold" width={32} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            Tidak Ada Indikator yang Sesuai
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? "Tidak ditemukan indikator yang cocok dengan kata kunci pencarian Anda."
              : rhpkData?.iksks?.length === 0
              ? "Akun Anda belum terdaftar sebagai Ketua Tim (Katim) pada IKSK manapun di sistem."
              : `Belum ada baris data indikator RHPK yang terdaftar untuk penugasan IKSK Anda.`}
          </p>
        </div>
      ) : (
        /* Table of Indicators */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5 w-12 text-center">No</th>
                  <th className="px-4 py-3.5 min-w-[260px]">Indikator & Sasaran Kegiatan</th>
                  <th className="px-3 py-3.5 text-center whitespace-nowrap">Target 2026</th>
                  <th className="px-3 py-3.5 text-center whitespace-nowrap">Target {selectedMonth}</th>
                  <th className="px-3 py-3.5 text-center whitespace-nowrap">Realisasi {selectedMonth}</th>
                  <th className="px-3 py-3.5 text-center whitespace-nowrap">% Capaian</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Kendala & Rekomendasi</th>
                  <th className="px-4 py-3.5 min-w-[180px]">RTL</th>
                  <th className="px-4 py-3.5 min-w-[220px]">Arahan Pimpinan</th>
                  <th className="px-4 py-3.5 text-center sticky right-0 bg-slate-50/95 backdrop-blur-xs shadow-l">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredIndicators.map((item) => {
                  const hasReal = item.realisasi_bulan && item.realisasi_bulan !== "#DIV/0!" && item.realisasi_bulan !== "";
                  const cap = item.capaian_persen;
                  const isTercapai = cap >= 100;

                  return (
                    <tr
                      key={item.row_number}
                      className="group transition hover:bg-blue-50/40"
                    >
                      {/* No / IKSK ID */}
                      <td className="px-4 py-4 text-center align-top">
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700 text-xs">
                          {item.no}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          Brs {item.row_number}
                        </div>
                      </td>

                      {/* Indikator & Sasaran */}
                      <td className="px-4 py-4 align-top">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                          {item.indikator}
                        </div>
                        {item.sasaran && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-400">Sasaran:</span>
                            <span>{item.sasaran}</span>
                          </div>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            IKSK #{item.iksk_id}
                          </span>
                          {item.sheet_row_url && (
                            <a
                              href={item.sheet_row_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
                              title="Buka baris ini langsung di Google Sheets"
                            >
                              <span>Lihat di Sheets</span>
                              <Icon icon="solar:arrow-right-up-linear" width={11} />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Target Tahunan 2026 */}
                      <td className="px-3 py-4 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {item.target_tahunan || "-"}
                      </td>

                      {/* Target Bulanan */}
                      <td className="px-3 py-4 text-center align-top font-semibold text-slate-800 whitespace-nowrap">
                        {item.target_bulan ? (
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-xs">
                            {item.target_bulan}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum diset</span>
                        )}
                      </td>

                      {/* Realisasi Bulanan */}
                      <td className="px-3 py-4 text-center align-top whitespace-nowrap">
                        {hasReal ? (
                          <span className="inline-block rounded-md bg-blue-50 px-2 py-1 font-mono font-bold text-blue-800 text-xs">
                            {item.realisasi_bulan}
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400 italic">
                            Kosong
                          </span>
                        )}
                      </td>

                      {/* % Capaian */}
                      <td className="px-3 py-4 text-center align-top whitespace-nowrap">
                        {hasReal && cap > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                              isTercapai
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <Icon
                              icon={
                                isTercapai
                                  ? "solar:check-circle-bold"
                                  : "solar:danger-triangle-bold"
                              }
                              width={13}
                            />
                            <span>{cap}%</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Kendala & Rekomendasi */}
                      <td className="px-4 py-4 align-top space-y-1.5">
                        {item.kendala ? (
                          <div className="rounded-lg bg-amber-50/70 p-2 text-[11px] text-amber-900 border border-amber-100">
                            <span className="font-bold text-amber-800 block text-[10px] uppercase">
                              Kendala:
                            </span>
                            <span className="line-clamp-3">{item.kendala}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tidak ada kendala</span>
                        )}

                        {item.rekomendasi && (
                          <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700 border border-slate-200">
                            <span className="font-bold text-slate-600 block text-[10px] uppercase">
                              Rekomendasi:
                            </span>
                            <span className="line-clamp-2">{item.rekomendasi}</span>
                          </div>
                        )}
                      </td>

                      {/* RTL */}
                      <td className="px-4 py-4 align-top">
                        {item.rtl ? (
                          <div className="rounded-lg bg-blue-50/60 p-2 text-[11px] text-blue-900 border border-blue-100">
                            <span className="line-clamp-3">{item.rtl}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Arahan Pimpinan (Read-Only) */}
                      <td className="px-4 py-4 align-top">
                        {item.arahan_pimpinan ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs shadow-2xs">
                            <div className="flex items-center gap-1 font-bold text-amber-800 text-[11px] mb-1">
                              <Icon icon="solar:chat-round-line-bold" width={13} className="text-amber-600" />
                              <span>Arahan Kepala Balai:</span>
                            </div>
                            <p className="text-amber-950 text-[11px] leading-relaxed italic">
                              "{item.arahan_pimpinan}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum ada arahan</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-4 text-center align-top sticky right-0 bg-white/95 backdrop-blur-xs shadow-l group-hover:bg-blue-50/80">
                        <button
                          onClick={() => openEditModal(item)}
                          disabled={isLocked}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs transition ${
                            isLocked
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : "bg-[#005baa] text-white hover:bg-blue-700 hover:shadow-sm"
                          }`}
                          title={isLocked ? "Bulan ini dikunci oleh admin" : "Input / Edit Data RHPK"}
                        >
                          <Icon icon="solar:pen-new-square-bold" width={14} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Data Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
              <div>
                <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  IKSK #{editingItem.iksk_id} • Baris #{editingItem.row_number}
                </span>
                <h3 className="mt-1.5 text-base font-bold text-slate-900">
                  Input / Perbarui Data RHPK
                </h3>
                <p className="text-xs text-slate-500">
                  Periode Bulan: <strong className="text-blue-700">{selectedMonth} 2026</strong>
                </p>
              </div>

              <button
                onClick={closeEditModal}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Indicator Name Banner */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Indikator Kinerja:
                </span>
                <p className="mt-0.5 text-xs font-semibold text-slate-900">
                  {editingItem.indikator}
                </p>
                {editingItem.sasaran && (
                  <p className="mt-1 text-[11px] text-slate-600">
                    <span className="font-semibold">Sasaran: </span>
                    {editingItem.sasaran}
                  </p>
                )}
              </div>

              {/* Success / Error Messages */}
              {modalSuccessMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600 shrink-0" />
                  <span>{modalSuccessMsg}</span>
                </div>
              )}
              {modalErrorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                  <Icon icon="solar:danger-triangle-bold" width={18} className="text-rose-600 shrink-0" />
                  <span>{modalErrorMsg}</span>
                </div>
              )}

              {/* Number Inputs Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Kumulatif {selectedMonth} (Kolom {editingItem.columns.target})
                  </label>
                  <input
                    type="text"
                    value={formData.target_bulan}
                    onChange={(e) => setFormData({ ...formData, target_bulan: e.target.value })}
                    placeholder="Contoh: 100,00"
                    disabled={isSaving || isLocked}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Target tahunan: {editingItem.target_tahunan || "-"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Realisasi s.d {selectedMonth} (Kolom {editingItem.columns.real})
                  </label>
                  <input
                    type="text"
                    value={formData.realisasi}
                    onChange={(e) => setFormData({ ...formData, realisasi: e.target.value })}
                    placeholder="Contoh: 85,50"
                    disabled={isSaving || isLocked}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono font-bold text-blue-700 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Nilai riil capaian bulan ini
                  </span>
                </div>
              </div>

              {/* Textarea Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kendala yang Dihadapi (Kolom {editingItem.columns.kendala})
                </label>
                <textarea
                  rows={2}
                  value={formData.kendala}
                  onChange={(e) => setFormData({ ...formData, kendala: e.target.value })}
                  placeholder="Tuliskan kendala teknis atau kendala lapangan jika ada..."
                  disabled={isSaving || isLocked}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rekomendasi (Kolom {editingItem.columns.rekomendasi})
                </label>
                <textarea
                  rows={2}
                  value={formData.rekomendasi}
                  onChange={(e) => setFormData({ ...formData, rekomendasi: e.target.value })}
                  placeholder="Rekomendasi perbaikan atau tindak lanjut awal..."
                  disabled={isSaving || isLocked}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rencana Tindak Lanjut / RTL (Kolom {editingItem.columns.rtl})
                </label>
                <textarea
                  rows={2}
                  value={formData.rtl}
                  onChange={(e) => setFormData({ ...formData, rtl: e.target.value })}
                  placeholder="Rencana tindak lanjut dan langkah konkret tim..."
                  disabled={isSaving || isLocked}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Arahan Pimpinan Reference Box (Read-Only) */}
              {editingItem.arahan_pimpinan && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-800 text-[11px] mb-1">
                    <Icon icon="solar:chat-round-line-bold" width={14} className="text-amber-600" />
                    Arahan Kepala Balai (Kolom {editingItem.columns.arahan}):
                  </span>
                  <p className="text-amber-950 italic">
                    "{editingItem.arahan_pimpinan}"
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving || isLocked}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Icon icon="solar:restart-linear" width={15} className="animate-spin" />
                      <span>Menyimpan ke Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:diskette-bold" width={15} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

