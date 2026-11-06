"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

type RhpkTab = {
  id: number | string;
  title: string;
  google_sheet_id?: string | number | null;
  is_active?: number;
};

type Props = {
  year?: string;
};

export default function RhpkList({ year = "2026" }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabs, setTabs] = useState<RhpkTab[]>([]);
  const [spreadsheetName, setSpreadsheetName] = useState("REKAP DATA RHPK 2026 Mataram");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchRhpkTabs() {
      setLoading(true);
      try {
        const query = user?.id ? `?user_id=${user.id}` : "";
        const res = await api.get(`${baseUrl}/api/kabalai/rhpk/${year}${query}`);

        if (res.data) {
          const data = res.data;
          const spName = data.spreadsheet?.name || data.data?.spreadsheet?.name;
          if (spName) setSpreadsheetName(spName);

          const tabList = Array.isArray(data.tabs)
            ? data.tabs
            : Array.isArray(data.data?.tabs)
              ? data.data.tabs
              : Array.isArray(data)
                ? data
                : [];
          setTabs(tabList);
        } else {
          setTabs([]);
        }
      } catch {
        setTabs([]);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchRhpkTabs();
    }
  }, [year, user?.id]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabs;
    return tabs.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [tabs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/siproval/monev" className="transition hover:text-[#005baa]">
            Tambah Arahan Pimpinan
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">RHPK {year}</span>
        </div>

        <Link
          href="/siproval/monev"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Icon icon="solar:arrow-left-linear" width={16} />
          Pilih Tahun Lain
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tahun
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{year}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:calendar-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Tab
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : tabs.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#00a651]">
              <Icon icon="solar:documents-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sumber Data
              </p>
              <p className="mt-2 text-base font-bold text-emerald-700">Database Lokal Mandiri</p>
              <p className="mt-0.5 text-xs text-slate-500">Excel Lokal Tanpa API</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Icon icon="solar:database-bold" width={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Listing Header & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Tab RHPK</h2>
            <p className="text-xs text-slate-500">
              Pilih tab indikator yang ingin kamu evaluasi untuk membuka lembar rekapitulasi.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              width={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tab RHPK..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Tab List */}
        <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
              <p className="mt-2 text-xs text-slate-500">Memuat tab RHPK...</p>
            </div>
          ) : filteredTabs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada tab yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredTabs.map((tab, idx) => {
              const isCapaianRapk =
                tab.title.toLowerCase().includes("capaian rapk") ||
                tab.id === 58 ||
                tab.id === 154;

              return (
                <Link
                  key={tab.id}
                  href={`/siproval/rhpk/${year}/tab/${tab.id}`}
                  className={`group flex items-center justify-between gap-4 p-4.5 transition ${
                    isCapaianRapk
                      ? "bg-amber-50/60 hover:bg-amber-100/50 border-l-4 border-amber-500"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                        isCapaianRapk
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "bg-blue-50 text-[#005baa] group-hover:bg-[#005baa] group-hover:text-white"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-bold transition ${
                            isCapaianRapk
                              ? "text-amber-950 group-hover:text-amber-900"
                              : "text-slate-800 group-hover:text-[#005baa]"
                          }`}
                        >
                          {tab.title}
                        </h4>
                        {isCapaianRapk && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-950 shadow-2xs">
                            <Icon icon="solar:chat-square-call-bold" width={13} />
                            Tambahkan Arahan Pimpinan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isCapaianRapk
                          ? "Lembar Evaluasi Capaian RAPK & Kolom Input Arahan Kepala Balai (Yogi Abaso Mataram)"
                          : `Lembar Kerja RHPK • Tab ID: ${tab.id}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-2xs transition ${
                        isCapaianRapk
                          ? "bg-[#005baa] text-white hover:bg-[#004887]"
                          : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-[#005baa]"
                      }`}
                    >
                      {isCapaianRapk ? (
                        <>
                          <Icon icon="solar:pen-new-square-bold" width={14} />
                          <span>Beri Arahan Pimpinan</span>
                        </>
                      ) : (
                        <span>Buka Rekap</span>
                      )}
                    </span>
                    <Icon
                      icon="solar:arrow-right-linear"
                      className={`h-4 w-4 transition group-hover:translate-x-1 ${
                        isCapaianRapk ? "text-amber-700" : "text-slate-400 group-hover:text-[#005baa]"
                      }`}
                    />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
