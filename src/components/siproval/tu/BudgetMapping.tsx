"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

type BudgetYear = {
  year: number;
};

type ApiResponse = {
  status?: string;
  success?: boolean;
  data?: {
    spreadsheet?: {
      name?: string;
    };
    years?: BudgetYear[] | number[];
  } | BudgetYear[] | number[];
  spreadsheet?: {
    name?: string;
  };
  years?: BudgetYear[] | number[];
  message?: string;
};

function normalizeYears(rawInput: unknown): BudgetYear[] {
  let list: unknown[] = [];

  if (Array.isArray(rawInput)) {
    list = rawInput;
  } else if (rawInput && typeof rawInput === "object") {
    const obj = rawInput as Record<string, unknown>;
    if (Array.isArray(obj.years)) {
      list = obj.years;
    } else if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>;
      if (Array.isArray(dataObj.years)) {
        list = dataObj.years;
      } else if (Array.isArray(obj.data)) {
        list = obj.data;
      }
    }
  }

  const normalized = list
    .map((item) => {
      if (typeof item === "number") return item;
      if (item && typeof item === "object" && "year" in item) {
        return Number((item as { year: unknown }).year);
      }
      return NaN;
    })
    .filter((year) => Number.isInteger(year) && year > 0)
    .map((year) => ({ year }));

  const unique = Array.from(
    new Map(normalized.map((item) => [item.year, item])).values(),
  ).sort((a, b) => b.year - a.year);

  return unique;
}

export default function BudgetMapping() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [years, setYears] = useState<BudgetYear[]>([]);
  const [spreadsheetName, setSpreadsheetName] = useState<string>("Spreadsheet Terintegrasi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchYears() {
      try {
        setLoading(true);
        setError("");

        const query = user?.id ? `?user_id=${user.id}` : "";
        const response = await api.get(`${baseUrl}/api/budget-mapping/years${query}`);

        if (!isMounted) return;

        const raw = response.data;
        const normalized = normalizeYears(raw);
        setYears(normalized);
        setError("");

        const sName = raw?.spreadsheet?.name || raw?.data?.spreadsheet?.name;
        if (sName) {
          setSpreadsheetName(sName);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || "Gagal memuat daftar tahun mapping anggaran.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (user?.id) {
      fetchYears();
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Tahun
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : years.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:calendar-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mapping Anggaran
              </p>
              <p className="mt-2 text-base font-bold text-slate-900">Per Tahun</p>
              <p className="mt-1 text-xs text-slate-500">
                Data alokasi anggaran dan serapan
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon icon="solar:table-bold" width={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sumber Data
              </p>
              <p className="mt-2 text-base font-bold text-slate-900">Google Sheets</p>
              <p className="mt-1 text-xs text-slate-500 truncate max-w-44" title={spreadsheetName}>
                {spreadsheetName}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Icon icon="solar:database-bold" width={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Daftar Tahun Mapping Anggaran
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pilih tahun yang ingin kamu kelola untuk melihat tab dan rincian bulanan.
        </p>
      </div>

      {/* List / Grid of Years */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : error && years.length === 0 ? (
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
      ) : years.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Belum ada tahun mapping anggaran yang terdaftar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {years.map(({ year }) => (
            <Link
              key={year}
              href={`/siproval/budget-mapping/year?year=${year}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-blue-50 px-3 py-1 text-sm font-bold text-[#005baa]">
                  {year}
                </span>
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Tahun Anggaran
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#005baa]">
                  Budget Mapping {year}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Klik untuk membuka rincian tab spreadsheet
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-[#005baa]">
                <span>Buka Rincian</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  className="h-4 w-4 transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
