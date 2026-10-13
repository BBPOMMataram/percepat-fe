"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

type IndicatorRow = {
  row_number: number;
  indikator: string;
  satuan: string;
  target_tahunan: string | number;
  target_bulan: string | number;
  realisasi_bulan: string | number;
  capaian_persen: number;
  status: "tercapai" | "belum";
  arahan_pimpinan?: string;
  pic: string;
};

type Props = {
  year?: string;
  tab?: string;
};

export default function RecapTab({ year = "2026", tab = "1" }: Props) {
  const searchParams = useSearchParams();
  const initialMonth = (searchParams.get("month") || "JANUARI").toUpperCase();

  const [selectedMonth, setSelectedMonth] = useState(
    MONTHS.includes(initialMonth) ? initialMonth : "JANUARI",
  );
  const [tabTitle, setTabTitle] = useState("Rekap RHPK");
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [apiNotice, setApiNotice] = useState<string>("");

  useEffect(() => {
    async function fetchMonitoringData() {
      setLoading(true);
      setApiNotice("");
      try {
        const res = await api.get(
          `${baseUrl}/api/kabalai/rhpk/${year}/tab/${tab}?month=${selectedMonth}`,
        );

        if (res.data) {
          const data = res.data;
          const title = data.sheetTab?.title || data.data?.sheetTab?.title;
          if (title) setTabTitle(title);

          const err = data.googleSheetError || data.data?.googleSheetError;
          if (err) setApiNotice(err);

          const rows = data.rows || data.data?.rows;
          const dataRows = data.dataRows || data.data?.dataRows;

          if (Array.isArray(rows) && rows.length > 0) {
            setIndicators(rows);
          } else if (Array.isArray(dataRows) && dataRows.length > 0) {
            const mapped: IndicatorRow[] = dataRows.map((r: string[], idx: number) => {
              const capVal = parseFloat(String(r[5] || "0").replace("%", "")) || 0;
              return {
                row_number: idx + 10,
                indikator: r[1] || `Indikator ${idx + 1}`,
                satuan: r[2] || "-",
                target_tahunan: r[3] || 0,
                target_bulan: r[4] || 0,
                realisasi_bulan: r[5] || 0,
                capaian_persen: capVal,
                status: capVal >= 100 ? "tercapai" : "belum",
                arahan_pimpinan: r[8] || "",
                pic: r[7] || "-",
              };
            });
            setIndicators(mapped);
          } else {
            setIndicators([]);
          }
        } else {
          setIndicators([]);
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setApiNotice(
          e.response?.data?.message || "Gagal memuat rincian rekapitulasi dari server."
        );
        setIndicators([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMonitoringData();
  }, [year, tab, selectedMonth]);

  const totalIndicators = indicators.length;
  const tercapaiCount = indicators.filter((i) => i.status === "tercapai").length;
  const belumTercapaiCount = totalIndicators - tercapaiCount;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/siproval/monev" className="transition hover:text-[#005baa]">
            Monev
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rekapitulasi Monitoring RHPK {year}
            </span>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{tabTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#005baa]">
              Periode: {selectedMonth}
            </span>
          </div>
        </div>

        {/* Horizontal Month Tabs */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Pilih Periode Bulan:
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Indikator
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalIndicators}
              </p>
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
                Belum Mencapai Target
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {belumTercapaiCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Icon icon="solar:danger-triangle-bold" width={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Indicators Matrix Table */}
      {apiNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <Icon icon="solar:info-circle-bold" width={18} className="text-amber-600 shrink-0" />
          <span>{apiNotice}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">
            Tabel Evaluasi Capaian & Arahan Kepala Balai ({selectedMonth})
          </h2>
          <p className="text-xs text-slate-500">
            Klik tombol &quot;Beri Arahan&quot; pada baris indikator untuk memberikan instruksi pimpinan.
          </p>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat rincian evaluasi...</p>
          </div>
        ) : indicators.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Icon icon="solar:document-text-linear" width={32} className="mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Belum ada baris data indikator</p>
            <p className="mt-1">Data capaian belum tersedia untuk tab ini pada periode {selectedMonth}.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-56">Indikator Kinerja</th>
                  <th className="py-3 px-4 w-24 text-center">Target {year}</th>
                  <th className="py-3 px-4 w-24 text-center">Target {selectedMonth}</th>
                  <th className="py-3 px-4 w-24 text-center">Realisasi</th>
                  <th className="py-3 px-4 w-24 text-center">Capaian</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 min-w-64">Arahan Kepala Balai</th>
                  <th className="py-3 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {indicators.map((row, idx) => (
                  <tr key={row.row_number} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{row.indikator}</p>
                      <span className="text-xs text-slate-400">PIC: {row.pic}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {row.target_tahunan} {row.satuan}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {row.target_bulan} {row.satuan}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {row.realisasi_bulan} {row.satuan}
                    </td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.status === "tercapai"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.status === "tercapai" ? "Tercapai" : "Belum Capai"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic">
                      {row.arahan_pimpinan ? (
                        <span>&ldquo;{row.arahan_pimpinan}&rdquo;</span>
                      ) : (
                        <span className="text-slate-400">Belum ada arahan</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/siproval/arahan-pimpinan?year=${year}&month=${encodeURIComponent(
                          selectedMonth,
                        )}&tab=${tab}&row=${row.row_number}&indikator=${encodeURIComponent(
                          row.indikator,
                        )}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-[#005baa] transition hover:bg-[#005baa] hover:text-white"
                      >
                        <Icon icon="solar:pen-bold" width={14} />
                        <span>Arahan</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
