"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
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

type IndicatorRow = {
  row_number: number;
  no?: string | number;
  sasaran?: string;
  indikator: string;
  satuan?: string;
  target_tahunan: string | number;
  target_bulan: string | number;
  realisasi_bulan: string | number;
  capaian_persen: number;
  status: "tercapai" | "belum";
  kendala?: string;
  rtl?: string;
  arahan_pimpinan?: string;
  arahan_column?: string;
  pic?: string;
  is_contoh?: boolean;
};

type Props = {
  year?: string;
  tab?: string;
};

export default function RecapTab({ year = "2026", tab = "154" }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const initialMonth = (searchParams.get("month") || "OKTOBER").toUpperCase();

  const [selectedMonth, setSelectedMonth] = useState(
    MONTHS.includes(initialMonth) ? initialMonth : "OKTOBER",
  );
  const [tabTitle, setTabTitle] = useState("A. Capaian RAPK Mataram");
  const [arahanColumn, setArahanColumn] = useState<string>("EM");
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [apiNotice, setApiNotice] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "tercapai" | "belum" | "no_arahan">("all");

  // Modal State untuk Edit Arahan Pimpinan
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorRow | null>(null);
  const [arahanInput, setArahanInput] = useState("");
  const [savingArahan, setSavingArahan] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState("");
  const [modalErrorMsg, setModalErrorMsg] = useState("");

  useEffect(() => {
    async function fetchMonitoringData() {
      setLoading(true);
      setApiNotice("");
      try {
        const query = user?.id ? `&user_id=${user.id}` : "";
        const res = await api.get(
          `${baseUrl}/api/kabalai/rhpk/${year}/tab/${tab}?month=${selectedMonth}${query}`,
        );

        if (res.data) {
          const data = res.data.data || res.data;
          const title = data.sheetTab?.title;
          if (title) setTabTitle(title);

          if (data.arahan_column) {
            setArahanColumn(data.arahan_column);
          }

          const err = data.googleSheetError;
          if (err) setApiNotice(err);

          const indicatorList: IndicatorRow[] =
            Array.isArray(data.indicators) && data.indicators.length > 0
              ? data.indicators
              : Array.isArray(data.rows) && data.rows.length > 0
                ? data.rows
                : [];

          setIndicators(indicatorList);
        } else {
          setIndicators([]);
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setApiNotice(
          e.response?.data?.message || "Gagal memuat rincian rekapitulasi evaluasi RHPK."
        );
        setIndicators([]);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchMonitoringData();
    }
  }, [year, tab, selectedMonth, user?.id]);

  // Filter & Search
  const filteredIndicators = useMemo(() => {
    return indicators.filter((row) => {
      // Saring contoh jika bukan tab contoh atau biarkan jika ada query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInd = (row.indikator || "").toLowerCase().includes(q);
        const matchSas = (row.sasaran || "").toLowerCase().includes(q);
        const matchArahan = (row.arahan_pimpinan || "").toLowerCase().includes(q);
        if (!matchInd && !matchSas && !matchArahan) return false;
      }

      if (filterStatus === "tercapai") return row.status === "tercapai";
      if (filterStatus === "belum") return row.status === "belum";
      if (filterStatus === "no_arahan") return !row.arahan_pimpinan || row.arahan_pimpinan.trim() === "";

      return true;
    });
  }, [indicators, searchQuery, filterStatus]);

  // Statistik KPI
  const nonContohIndicators = useMemo(() => {
    return indicators.filter((i) => !i.is_contoh);
  }, [indicators]);

  const totalIndicators = nonContohIndicators.length > 0 ? nonContohIndicators.length : indicators.length;
  const tercapaiCount = (nonContohIndicators.length > 0 ? nonContohIndicators : indicators).filter(
    (i) => i.status === "tercapai"
  ).length;
  const belumTercapaiCount = totalIndicators - tercapaiCount;
  const arahanFilledCount = (nonContohIndicators.length > 0 ? nonContohIndicators : indicators).filter(
    (i) => i.arahan_pimpinan && i.arahan_pimpinan.trim() !== ""
  ).length;

  // Buka Modal Arahan
  const handleOpenArahanModal = (row: IndicatorRow) => {
    setSelectedIndicator(row);
    setArahanInput(row.arahan_pimpinan || "");
    setModalSuccessMsg("");
    setModalErrorMsg("");
  };

  // Simpan Arahan Langsung ke Google Sheet
  const handleSaveArahan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator) return;

    setSavingArahan(true);
    setModalSuccessMsg("");
    setModalErrorMsg("");

    try {
      const endpoint = `${baseUrl}/api/kabalai/tambah-catatan`;
      const res = await api.post(endpoint, {
        user_id: user?.id,
        year,
        month: selectedMonth,
        tab,
        row: selectedIndicator.row_number,
        column: selectedIndicator.arahan_column || arahanColumn,
        arahan: arahanInput,
      });

      const message =
        res.data?.message ||
        `Arahan pimpinan berhasil disimpan ke database SIPROVAL!`;
      setModalSuccessMsg(message);

      // Perbarui state lokal secara reaktif
      setIndicators((prev) =>
        prev.map((item) =>
          item.row_number === selectedIndicator.row_number
            ? { ...item, arahan_pimpinan: arahanInput }
            : item
        )
      );

      // Tutup modal setelah delay singkat
      setTimeout(() => {
        setSelectedIndicator(null);
      }, 1200);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalErrorMsg(
        e.response?.data?.message || "Gagal menyimpan arahan ke database lokal."
      );
    } finally {
      setSavingArahan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/siproval/monev" className="transition hover:text-[#005baa]">
            Tambah Arahan Pimpinan
          </Link>
          <span>/</span>
          <Link
            href={`/siproval/rhpk/${year}`}
            className="transition hover:text-[#005baa]"
          >
            RHPK {year}
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{tabTitle}</span>
        </div>

        <Link
          href={`/siproval/rhpk/${year}`}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Icon icon="solar:arrow-left-linear" width={16} />
          Kembali ke Daftar Tab
        </Link>
      </div>

      {/* Title & Month Selector Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Rekapitulasi Monitoring RHPK {year}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Data Lokal Mandiri
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{tabTitle}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#005baa]">
              Periode: {selectedMonth}
            </span>
            <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <Icon icon="solar:shield-check-bold" width={15} />
              Kolom Arahan: <span className="font-mono font-bold">{arahanColumn}</span> (Yogi Abaso Mataram - editable)
            </span>
          </div>
        </div>

        {/* Horizontal Month Tabs */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Pilih Periode Bulan Evaluasi:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {MONTHS.map((m) => {
              const active = m === selectedMonth;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-[#005baa] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Indikator
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalIndicators}
              </p>
              <span className="text-xs text-slate-400">Indikator Kinerja</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:chart-square-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mencapai Target
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {tercapaiCount}
              </p>
              <span className="text-xs text-emerald-600">Capaian &ge; 100%</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon icon="solar:check-circle-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Belum Tercapai
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {belumTercapaiCount}
              </p>
              <span className="text-xs text-amber-600">Capaian &lt; 100%</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Icon icon="solar:danger-triangle-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Arahan Diisi
              </p>
              <p className="mt-2 text-2xl font-bold text-[#00a651]">
                {arahanFilledCount}
              </p>
              <span className="text-xs text-slate-400">
                dari {totalIndicators} indikator
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#00a651]">
              <Icon icon="solar:chat-round-check-bold" width={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Notice / Errors */}
      {apiNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <Icon icon="solar:info-circle-bold" width={18} className="text-amber-600 shrink-0" />
          <span>{apiNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
            placeholder="Cari indikator kinerja, sasaran kegiatan, atau arahan..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          {(
            [
              { id: "all", label: "Semua" },
              { id: "tercapai", label: "Tercapai" },
              { id: "belum", label: "Belum Tercapai" },
              { id: "no_arahan", label: "Belum Ada Arahan" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                filterStatus === f.id
                  ? "bg-[#005baa] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Indicators Matrix Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tabel Evaluasi Capaian & Arahan Kepala Balai ({selectedMonth})
            </h2>
            <p className="text-xs text-slate-500">
              Data bersumber dari Database RHPK Mandiri SIPROVAL. Arahan pimpinan akan tersimpan dan langsung terhubung dengan Ketua Tim terkait.

            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Menampilkan {filteredIndicators.length} baris
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat rincian evaluasi RHPK...</p>
          </div>
        ) : filteredIndicators.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Icon icon="solar:document-text-linear" width={32} className="mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada baris data indikator yang cocok</p>
            <p className="mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-72">Indikator Kinerja & Sasaran</th>
                  <th className="py-3 px-3 w-24 text-center">Target {year}</th>
                  <th className="py-3 px-3 w-24 text-center">Target {selectedMonth}</th>
                  <th className="py-3 px-3 w-24 text-center">Realisasi</th>
                  <th className="py-3 px-3 w-24 text-center">% Capaian</th>
                  <th className="py-3 px-3 w-24 text-center">Status</th>
                  <th className="py-3 px-4 min-w-44">Kendala / RTL</th>
                  <th className="py-3 px-4 min-w-64">
                    Arahan Kepala Balai (Kolom {arahanColumn})
                  </th>
                  <th className="py-3 px-3 w-28 text-center sticky right-0 bg-slate-100 shadow-sm">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIndicators.map((row, idx) => {
                  const targetSel = `${row.arahan_column || arahanColumn}${row.row_number}`;
                  return (
                    <tr
                      key={row.row_number}
                      className={`hover:bg-blue-50/30 transition ${
                        row.is_contoh ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-medium text-slate-500">
                        {row.no || idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">{row.indikator}</p>
                          {row.is_contoh && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              CONTOH
                            </span>
                          )}
                        </div>
                        {row.sasaran && (
                          <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                            {row.sasaran}
                          </p>
                        )}
                        <span className="mt-0.5 inline-block text-[10px] font-mono text-slate-400">
                          Baris Sheet: {row.row_number} | Target Sel: {targetSel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {row.target_tahunan || "-"}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {row.target_bulan || "-"}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {row.realisasi_bulan || "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold ${
                            row.capaian_persen >= 100
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {row.capaian_persen}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            row.status === "tercapai"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {row.status === "tercapai" ? "Tercapai" : "Belum Capai"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {row.kendala || row.rtl ? (
                          <div className="space-y-1">
                            {row.kendala && (
                              <p className="text-amber-800">
                                <strong className="font-semibold text-amber-900">Kendala:</strong>{" "}
                                {row.kendala}
                              </p>
                            )}
                            {row.rtl && (
                              <p className="text-blue-800">
                                <strong className="font-semibold text-blue-900">RTL:</strong>{" "}
                                {row.rtl}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Tidak ada kendala</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.arahan_pimpinan ? (
                          <div className="rounded-lg bg-emerald-50/80 border border-emerald-200/80 p-2 text-slate-800">
                            <p className="italic text-xs font-medium">
                              &ldquo;{row.arahan_pimpinan}&rdquo;
                            </p>
                            <span className="mt-1 block text-[10px] text-emerald-700 font-semibold">
                              &bull; Tersimpan di sel {targetSel}
                            </span>
                          </div>
                        ) : (
                          <span className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-400 italic">
                            Belum ada arahan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center sticky right-0 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleOpenArahanModal(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-[#005baa] transition hover:bg-[#005baa] hover:text-white shadow-sm"
                        >
                          <Icon icon="solar:pen-bold" width={14} />
                          <span>{row.arahan_pimpinan ? "Edit" : "Beri Arahan"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Modal untuk Pengisian Arahan Pimpinan */}
      {selectedIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#005baa]">
                    Periode {selectedMonth}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    Kolom {selectedIndicator.arahan_column || arahanColumn} (Yogi Abaso Mataram - editable)
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-slate-900">
                  Pengisian Arahan Kepala Balai
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIndicator(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <Icon icon="solar:close-circle-bold" width={22} />
              </button>
            </div>

            {/* Notification */}
            {modalSuccessMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
                <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600 shrink-0" />
                <span>{modalSuccessMsg}</span>
              </div>
            )}
            {modalErrorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800">
                <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            {/* Indicator Details */}
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-xs">
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Indikator Kinerja:
              </p>
              <p className="text-sm font-bold text-slate-900">
                {selectedIndicator.indikator}
              </p>
              {selectedIndicator.sasaran && (
                <p className="text-slate-500">
                  <strong className="text-slate-700">Sasaran:</strong> {selectedIndicator.sasaran}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400">Target {year}:</span>
                  <p className="font-semibold text-slate-800">{selectedIndicator.target_tahunan}</p>
                </div>
                <div>
                  <span className="text-slate-400">Target {selectedMonth}:</span>
                  <p className="font-semibold text-slate-800">{selectedIndicator.target_bulan}</p>
                </div>
                <div>
                  <span className="text-slate-400">Realisasi:</span>
                  <p className="font-semibold text-slate-800">{selectedIndicator.realisasi_bulan}</p>
                </div>
                <div>
                  <span className="text-slate-400">Capaian:</span>
                  <p
                    className={`font-bold ${
                      selectedIndicator.capaian_persen >= 100
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {selectedIndicator.capaian_persen}%
                  </p>
                </div>
              </div>
              {(selectedIndicator.kendala || selectedIndicator.rtl) && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  {selectedIndicator.kendala && (
                    <p className="text-amber-800">
                      <strong className="text-amber-900">Kendala PIC:</strong> {selectedIndicator.kendala}
                    </p>
                  )}
                  {selectedIndicator.rtl && (
                    <p className="text-blue-800">
                      <strong className="text-blue-900">RTL PIC:</strong> {selectedIndicator.rtl}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveArahan} className="space-y-4">
              <div>
                <label
                  htmlFor="modalArahanInput"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Instruksi / Arahan Kepala Balai (Kolom {selectedIndicator.arahan_column || arahanColumn}
                  {selectedIndicator.row_number}):
                </label>
                <textarea
                  id="modalArahanInput"
                  rows={4}
                  value={arahanInput}
                  onChange={(e) => setArahanInput(e.target.value)}
                  placeholder="Tuliskan arahan tindak lanjut pimpinan yang harus dijalankan tim penanggung jawab kegiatan..."
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link
                  href={`/siproval/arahan-pimpinan?year=${year}&month=${encodeURIComponent(
                    selectedMonth
                  )}&tab=${tab}&row=${selectedIndicator.row_number}&indikator=${encodeURIComponent(
                    selectedIndicator.indikator
                  )}`}
                  className="text-xs text-[#005baa] hover:underline flex items-center gap-1"
                >
                  <Icon icon="solar:maximize-square-linear" width={14} />
                  <span>Buka Form Halaman Penuh</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIndicator(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingArahan}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#004b8d] transition disabled:opacity-50"
                  >
                    <Icon
                      icon={savingArahan ? "solar:refresh-circle-linear" : "solar:check-circle-bold"}
                      width={16}
                      className={savingArahan ? "animate-spin" : ""}
                    />
                    {savingArahan ? "Menyimpan Arahan..." : "Simpan Arahan Pimpinan"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
