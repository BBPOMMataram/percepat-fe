"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

export default function DashboardTu() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      {/* Welcome banner with BBPOM Blue & Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] p-6 text-white shadow-lg lg:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon icon="solar:shield-check-bold" width={15} className="text-emerald-300" />
              Bagian Tata Usaha (TU)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Icon icon="solar:database-bold" width={14} className="text-blue-200" />
              Data Riil Maping Anggaran 2026
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold lg:text-3xl text-white">
            Sistem Pemetaan Anggaran & Realisasi (SIPROVAL)
          </h1>
          <p className="mt-2 text-sm text-blue-100 lg:text-base leading-relaxed">
            Kelola perencanaan alokasi anggaran, pemetaan bulanan, dan pemantauan
            kegiatan belanja BBPOM di Mataram tahun anggaran {currentYear}.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/siproval/tu/realisasi-ro"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#005baa] shadow-sm transition hover:bg-blue-50"
            >
              <Icon icon="solar:document-medicine-bold" width={16} />
              Buka Realisasi RO (Live)
            </Link>
            <Link
              href="/siproval/budget-mapping"
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <Icon icon="solar:pie-chart-2-bold" width={16} />
              Budget Mapping
            </Link>
            <Link
              href="/siproval/tu/laporan-evaluasi?month=APRIL"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <Icon icon="solar:printer-bold" width={16} />
              Eksport Laporan (Bulan April)
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-15">
          <Icon icon="solar:pie-chart-3-bold" width={320} height={320} />
        </div>
      </div>

      {/* Metric Cards with BBPOM Blue & Green Gradients */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: BBPOM Navy/Blue */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#005baa]">
                Tahun Anggaran
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{currentYear}</p>
              <span className="mt-1 inline-block text-xs text-emerald-600 font-semibold">
                ● Aktif Berjalan
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-[#005baa]">
              <Icon icon="solar:calendar-date-bold" width={24} />
            </div>
          </div>
        </div>

        {/* Card 2: BBPOM Green */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#00a651]">
                Tab Alokasi Anggaran
              </p>
              <p className="mt-2 text-3xl font-bold text-[#00a651]">8 Tab</p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Maping Anggaran {currentYear}
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#00a651]">
              <Icon icon="solar:document-medicine-bold" width={24} />
            </div>
          </div>
        </div>

        {/* Card 3: Teal / Cyan */}
        <div className="flex flex-col justify-between rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-100/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488]">
                Status Integrasi
              </p>
              <p className="mt-2 text-2xl font-bold text-teal-800">Terhubung</p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Google Sheets API v4
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-[#0d9488]">
              <Icon icon="solar:link-circle-bold" width={24} />
            </div>
          </div>
        </div>

        {/* Card 4: Soft Amber / Blue */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-blue-50/50 p-5 shadow-2xs transition hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Otoritas Akses
              </p>
              <p className="mt-2 text-2xl font-bold text-[#005baa]">Tata Usaha</p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Read & Write Pemetaan
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Icon icon="solar:user-id-bold" width={24} />
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

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/siproval/tu/realisasi-ro"
            className="group block rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#005baa] text-white shadow-sm">
                <Icon icon="solar:document-medicine-bold" width={26} />
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#005baa] group-hover:underline">
                Buka Menu <Icon icon="solar:arrow-right-linear" width={16} />
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#005baa]">
              Realisasi RO (Tab 155)
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Pantau target tahunan, target bulanan, realisasi, capaian serta perbarui data langsung ke Google Sheets.
            </p>
          </Link>

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

          <Link
            href="/siproval/tu/laporan-evaluasi?month=APRIL"
            className="group block rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00a651] text-white shadow-sm">
                <Icon icon="solar:printer-bold" width={26} />
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#00a651] group-hover:underline">
                Eksport <Icon icon="solar:arrow-right-linear" width={16} />
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#00a651]">
              Eksport Laporan Evaluasi
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Cetak atau unduh Berita Acara Evaluasi Internal (Bulan April 2026) gabungan Volume RO &amp; Anggaran.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
