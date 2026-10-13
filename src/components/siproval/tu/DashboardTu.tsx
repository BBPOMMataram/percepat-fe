"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

export default function DashboardTu() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#014083] to-[#005baa] p-6 text-white shadow-md lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Icon icon="solar:shield-check-bold" width={16} /> Bagian Tata Usaha
          </span>
          <h1 className="mt-3 text-2xl font-bold lg:text-3xl">
            Sistem Pemetaan Anggaran & Realisasi (SIPROVAL)
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base">
            Kelola perencanaan alokasi anggaran, pemetaan bulanan, dan pemantauan
            kegiatan belanja BBPOM di Mataram tahun anggaran {currentYear}.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/budget-mapping"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#014083] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:pie-chart-2-bold" width={18} />
              Buka Mapping Anggaran
            </Link>
            <Link
              href={`/siproval/budget-mapping/year?year=${currentYear}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Icon icon="solar:calendar-bold" width={18} />
              Tahun {currentYear}
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-15">
          <Icon icon="solar:pie-chart-3-bold" width={320} height={320} />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tahun Anggaran
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{currentYear}</p>
              <span className="mt-1 inline-block text-xs text-emerald-600 font-medium">
                ● Aktif Berjalan
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:calendar-date-bold" width={26} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status Integrasi
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Terhubung</p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Google Sheets API v4
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#00a651]">
              <Icon icon="solar:link-circle-bold" width={26} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mode Input
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Bulanan</p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Januari s/d Desember
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Icon icon="solar:table-bold" width={26} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Otoritas Akses
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Tata Usaha</p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Read & Write Budget
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Icon icon="solar:user-id-bold" width={26} />
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Menu Pengelolaan Anggaran</h2>
        <p className="text-sm text-slate-500">
          Akses langsung ke modul pemetaan anggaran dan tabel rincian kegiatan.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Link
            href="/siproval/budget-mapping"
            className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
                <Icon icon="solar:layers-bold" width={26} />
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#005baa] group-hover:underline">
                Buka Menu <Icon icon="solar:arrow-right-linear" width={16} />
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#005baa]">
              Daftar Tahun Budget Mapping
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Pilih tahun anggaran yang tersedia untuk melihat seluruh tab dan alokasi
              perencanaan belanja program.
            </p>
          </Link>

          <Link
            href={`/siproval/budget-mapping/year?year=${currentYear}`}
            className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#00a651]">
                <Icon icon="solar:document-medicine-bold" width={26} />
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#00a651] group-hover:underline">
                Kelola Tab <Icon icon="solar:arrow-right-linear" width={16} />
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#00a651]">
              Tab Spreadsheet Anggaran {currentYear}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Kelola tab-tab rincian anggaran bulanan dan perbarui data sel secara langsung
              ke Google Sheets.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
