"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  FileSpreadsheet,
  LoaderCircle,
  AlertCircle,
  Database,
} from "lucide-react";

import SidebarSiproval from "@/components/siproval/layout/SidebarSiproval";

type SpreadsheetTab = {
  id: number;
  title: string;
  google_sheet_id?: string | null;
};

type TabsResponse = {
  success: boolean;
  message?: string;
  data?: {
    year: number;
    spreadsheet: {
      name: string;
    };
    tabs: SpreadsheetTab[];
  };
};

export default function BudgetMappingTabsPage() {
  const params = useParams<{ year: string }>();
  const year = params.year;

  const [spreadsheetName, setSpreadsheetName] = useState(
    "Spreadsheet Budget Mapping",
  );
  const [tabs, setTabs] = useState<SpreadsheetTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!year) return;

    const controller = new AbortController();

    async function fetchTabs() {
      setLoading(true);
      setError("");

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL ??
          "http://localhost:8000";

        const response = await fetch(
          `${baseUrl}/api/budget-mapping/${encodeURIComponent(year)}/tabs`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result: TabsResponse = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message ?? "Gagal mengambil daftar tab spreadsheet.",
          );
        }

        setSpreadsheetName(
          result.data.spreadsheet?.name ?? "Spreadsheet Budget Mapping",
        );

        setTabs(result.data.tabs ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchTabs();

    return () => controller.abort();
  }, [year]);

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarSiproval actor="tu" />

      <main className="ml-20 min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/siproval/budget-mapping"
                className="transition hover:text-blue-600"
              >
                Budget Mapping
              </Link>

              <ChevronRight size={16} />

              <span className="font-medium text-slate-700">{year}</span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Budget Mapping {year}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Pilih bulan atau tab yang ingin dikelola.
            </p>
          </div>
        </header>

        {/* Content */}
        <section className="px-8 py-8">
          <div className="mx-auto max-w-6xl">
            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 shrink-0" size={20} />

                <div>
                  <p className="font-semibold">Gagal memuat daftar tab</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Spreadsheet information */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileSpreadsheet size={25} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Sumber Spreadsheet
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {spreadsheetName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Pilih tab spreadsheet yang ingin dikelola.
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit shrink-0 items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {loading ? "Memuat..." : `${tabs.length} tab`}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h3 className="text-base font-bold text-slate-900">
                  Daftar Tab
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Pilih tab untuk melihat rincian data.
                </p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <LoaderCircle
                    className="animate-spin text-blue-600"
                    size={32}
                  />

                  <p className="mt-4 text-sm text-slate-500">
                    Memuat daftar tab spreadsheet...
                  </p>
                </div>
              ) : error ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-slate-500">
                    Data tab belum dapat ditampilkan.
                  </p>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : tabs.length > 0 ? (
                tabs.map((tab, index) => (
                  <Link
                    key={tab.id}
                    href={`/siproval/budget-mapping/${encodeURIComponent(
                      year,
                    )}/tab/${tab.id}`}
                    className="group flex items-center justify-between gap-5 border-b border-slate-100 px-6 py-5 transition last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-blue-600">
                          {tab.title}
                        </h4>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Tab ID: {tab.id}</span>

                          {tab.google_sheet_id && (
                            <>
                              <span>•</span>
                              <span>
                                Google Sheet ID: {tab.google_sheet_id}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex">
                        Lihat Rincian
                      </span>

                      <ChevronRight
                        size={20}
                        className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                      />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <Database size={27} className="text-slate-400" />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    Belum ada tab
                  </h3>

                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                    Belum terdapat tab spreadsheet yang tersedia untuk Budget
                    Mapping.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
