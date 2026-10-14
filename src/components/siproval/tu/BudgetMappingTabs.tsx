"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

type SpreadsheetTab = {
  id: number;
  title: string;
  google_sheet_id?: string | number | null;
  is_active?: number;
};

type TabsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    year?: number;
    spreadsheet?: {
      name?: string;
    };
    tabs?: SpreadsheetTab[];
  };
  tabs?: SpreadsheetTab[];
};

export default function BudgetMappingTabs() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const year = searchParams.get("year") || "2026";

  const [spreadsheetName, setSpreadsheetName] = useState("Spreadsheet Budget Mapping");
  const [tabs, setTabs] = useState<SpreadsheetTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchTabs() {
      setLoading(true);
      setError("");

      try {
        const query = user?.id ? `?user_id=${user.id}` : "";
        const response = await api.get(
          `${baseUrl}/api/budget-mapping/${year}/tabs${query}`
        );

        if (!isMounted) return;

        const raw = response.data;

        const sName = raw?.spreadsheet?.name || raw?.data?.spreadsheet?.name;
        if (sName) {
          setSpreadsheetName(sName);
        }

        let tabList: SpreadsheetTab[] = [];
        if (Array.isArray(raw)) {
          tabList = raw;
        } else if (Array.isArray(raw?.tabs)) {
          tabList = raw.tabs;
        } else if (Array.isArray(raw?.data?.tabs)) {
          tabList = raw.data.tabs;
        } else if (Array.isArray(raw?.data)) {
          tabList = raw.data;
        }

        setTabs(tabList);
        setError("");
      } catch (err: unknown) {
        if (!isMounted) return;
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || "Gagal memuat tab anggaran dari server.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (user?.id) {
      fetchTabs();
    }
    return () => {
      isMounted = false;
    };
  }, [year, user?.id]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabs;
    return tabs.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [tabs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Navigation & breadcrumb header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/siproval/budget-mapping"
            className="transition hover:text-[#005baa]"
          >
            Budget Mapping
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Tahun {year}</span>
        </div>

        <Link
          href="/siproval/budget-mapping"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Icon icon="solar:arrow-left-linear" width={16} />
          Kembali ke Daftar Tahun
        </Link>
      </div>

      {/* Spreadsheet info banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sumber Spreadsheet
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {spreadsheetName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih tab Google Sheet berikut untuk melihat atau memperbarui data rincian
              anggaran.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-[#005baa]">
            <Icon icon="solar:layers-bold" width={16} />
            {tabs.length} Tab Tersedia
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-5">
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              width={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama tab (contoh: JANUARI, ANGGARAN)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#005baa] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tab List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Daftar Tab Anggaran</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Klik pada salah satu tab untuk membuka tabel editor.
          </p>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error && tabs.length === 0 ? (
          <div className="p-8 text-center text-sm text-red-600">
            {error}
          </div>
        ) : filteredTabs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Icon icon="solar:folder-open-linear" width={24} />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">
              Tab tidak ditemukan
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Tidak ada tab yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTabs.map((tab, index) => (
              <Link
                key={tab.id}
                href={`/siproval/budget-mapping/year/tab?year=${encodeURIComponent(
                  year,
                )}&tab=${encodeURIComponent(String(tab.id))}`}
                className="group flex items-center justify-between gap-4 px-6 py-4.5 transition hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#005baa] transition group-hover:bg-[#005baa] group-hover:text-white">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-[#005baa]">
                      {tab.title}
                    </h4>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>Tab ID: {tab.id}</span>
                      {tab.google_sheet_id !== undefined && (
                        <>
                          <span>•</span>
                          <span>Sheet ID: {String(tab.google_sheet_id)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex group-hover:bg-blue-100 group-hover:text-[#005baa]">
                    Buka Editor
                  </span>
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#005baa]"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
