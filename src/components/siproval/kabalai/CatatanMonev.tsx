"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

type SpreadsheetItem = {
  id: number;
  name: string;
  spreadsheet_id: string;
  is_active: number;
  updated_at?: string;
};

export default function CatatanMonev() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCatatan, setTotalCatatan] = useState(12);

  useEffect(() => {
    async function fetchSpreadsheets() {
      try {
        setLoading(true);
        const res = await api.get(`${baseUrl}/api/kabalai/form-catatan`);

        if (res.data) {
          const data = res.data;
          const list: SpreadsheetItem[] = Array.isArray(data)
            ? data
            : Array.isArray(data.spreadsheets)
              ? data.spreadsheets
              : Array.isArray(data.data)
                ? data.data
                : [];
          setSpreadsheets(list);
          if (data.stats?.total_catatan !== undefined) {
            setTotalCatatan(data.stats.total_catatan);
          }
        } else {
          setSpreadsheets([]);
        }
      } catch {
        setSpreadsheets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSpreadsheets();
  }, []);

  const userName = user?.name || user?.call_name || "Kepala Balai";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">
          Selamat datang, <span className="text-[#005baa]">{userName}</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Pantau laporan realisasi indikator kinerja kegiatan dan berikan arahan langsung
          kepada tim penanggung jawab (PIC) terkait.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/siproval/rhpk/2026"
            className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d]"
          >
            <Icon icon="solar:chart-2-bold" width={16} />
            Buka Rekap RHPK 2026
          </Link>
          <Link
            href="/siproval/monev"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-[#005baa]"
          >
            <Icon icon="solar:calendar-date-bold" width={16} />
            Pilih Tahun Lain
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Laporan Terhubung
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : spreadsheets.length}
            </p>
            <span className="mt-1 inline-block text-xs text-slate-400">Dokumen Spreadsheet</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#005baa]">
            <Icon icon="solar:documents-bold" width={26} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Perlu Evaluasi
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">3</p>
            <span className="mt-1 inline-block text-xs text-slate-400">Target belum tercapai</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Icon icon="solar:danger-triangle-bold" width={26} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Arahan Diberikan
            </p>
            <p className="mt-2 text-3xl font-bold text-[#00a651]">{totalCatatan}</p>
            <span className="mt-1 inline-block text-xs text-slate-400">Catatan tindak lanjut tersimpan</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#00a651]">
            <Icon icon="solar:chat-round-check-bold" width={26} />
          </div>
        </div>
      </div>

      {/* Spreadsheet List Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4.5 bg-slate-50/50">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Daftar Spreadsheet Monitoring
              </h2>
              <p className="text-xs text-slate-500">
                Dokumen Google Spreadsheet yang disinkronisasi ke SIPROVAL untuk evaluasi.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Sinkronisasi Otomatis
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
            <p className="mt-2 text-xs text-slate-500">Memuat data spreadsheet...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {spreadsheets.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                    <Icon icon="solar:file-spreadsheet-bold" width={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-400 font-mono">
                      ID: {item.spreadsheet_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Aktif
                  </span>

                  <Link
                    href={`/siproval/rhpk/2026`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#005baa]"
                  >
                    <span>Evaluasi Laporan</span>
                    <Icon icon="solar:arrow-right-linear" width={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
