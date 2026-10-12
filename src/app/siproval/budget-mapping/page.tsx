"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarX,
  ChevronRight,
  Database,
  Table2,
} from "lucide-react";

import SidebarSiproval from "@/components/siproval/layout/SidebarSiproval";

type BudgetYear = {
  year: number;
};

type ApiResponse = {
  success?: boolean;
  data?: BudgetYear[] | number[];
  years?: BudgetYear[] | number[];
  message?: string;
};

function normalizeYears(items: BudgetYear[] | number[]): BudgetYear[] {
  const normalized = items
    .map((item) => (typeof item === "number" ? item : Number(item.year)))
    .filter((year) => Number.isInteger(year) && year > 0)
    .map((year) => ({ year }));

  return Array.from(
    new Map(normalized.map((item) => [item.year, item])).values(),
  ).sort((a, b) => b.year - a.year);
}

export default function BudgetMappingPage() {
  const [years, setYears] = useState<BudgetYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchYears() {
      try {
        setLoading(true);
        setError("");

        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL;

        if (!baseUrl) {
          throw new Error(
            "NEXT_PUBLIC_BACKEND_URL_SIPROVAL belum dikonfigurasi di .env.local.",
          );
        }

        const response = await fetch(
          `${baseUrl.replace(/\/+$/, "")}/api/budget-mapping/years`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil data tahun. HTTP ${response.status}`,
          );
        }

        const result: ApiResponse | BudgetYear[] | number[] =
          await response.json();

        let items: BudgetYear[] | number[];

        if (Array.isArray(result)) {
          items = result;
        } else {
          if (result.success === false) {
            throw new Error(result.message || "Gagal memuat daftar tahun.");
          }

          items = result.data ?? result.years ?? [];
        }

        setYears(normalizeYears(items));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

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

    fetchYears();

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen ml-1 bg-slate-50 font-sans text-slate-800 antialiased">
      {" "}
      <SidebarSiproval actor="tu" />
      <main className="min-h-screen lg:ml-20">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <span className="text-slate-400">SI MANDALIKA</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                  <span className="font-semibold text-[#005baa]">
                    Mapping Anggaran
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Mapping Anggaran
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Pilih tahun untuk melihat data mapping anggaran.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-[#eef6fc] px-4 py-2.5">
                <Database className="h-4 w-4 text-[#005baa]" />
                <span className="text-sm font-semibold text-[#005baa]">
                  {loading ? "Memuat..." : `${years.length} Tahun`}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Tahun
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loading ? "—" : years.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mapping Anggaran
                  </p>
                  <p className="mt-2 text-base font-bold text-slate-900">
                    Per Tahun
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Data mapping anggaran
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Table2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sumber Data
                  </p>
                  <p className="mt-2 text-base font-bold text-slate-900">
                    Google Sheets
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Mapping Anggaran
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Database className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Daftar Tahun Mapping Anggaran
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih tahun yang ingin kamu lihat untuk membuka mapping anggaran.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white px-6 py-10 text-center shadow-sm">
              <h3 className="font-semibold text-red-700">
                Gagal memuat data mapping anggaran
              </h3>
              <p className="mt-2 text-sm text-slate-600">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-[#005baa] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004b8d]"
              >
                Muat Ulang
              </button>
            </div>
          ) : years.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {years.map(({ year }) => (
                <Link
                  key={year}
                  href={`/siproval/budget-mapping/year?year=${year}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] text-[#005baa] transition group-hover:bg-blue-100">
                        <CalendarDays className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Tahun
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900 group-hover:text-[#005baa]">
                          {year}
                        </h3>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-[#005baa]">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                    <span className="text-xs font-semibold text-[#005baa] opacity-0 transition group-hover:opacity-100">
                      Lihat mapping
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <CalendarX className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Belum ada data mapping anggaran
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Belum terdapat data mapping anggaran yang tersedia.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Mapping Anggaran</span>
            <span>
              Sumber:{" "}
              <span className="font-medium text-slate-500">Google Sheets</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
