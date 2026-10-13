"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

export default function ShowMonev() {
  const currentYear = new Date().getFullYear();

  const years = [
    {
      year: 2027,
      label: "Tahun 2027",
      short: "27",
      desc: "Data belum tersedia",
      active: false,
    },
    {
      year: 2026,
      label: "Tahun 2026",
      short: "26",
      desc: "Rekap Data RHPK 2026 Mataram",
      active: true,
      href: "/siproval/rhpk/2026",
    },
    {
      year: 2025,
      label: "Tahun 2025",
      short: "25",
      desc: "Rekap Data RHPK 2025 Mataram (Arsip)",
      active: true,
      href: "/siproval/rhpk/2025",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:clipboard-list-bold" width={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Data Monitoring & Evaluasi (RHPK)
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Rekapitulasi Rencana Hasil Pelaksanaan Kegiatan Kepala Balai
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-[#005baa]">
            <Icon icon="solar:calendar-bold" width={16} />
            Tahun Berjalan: {currentYear}
          </div>
        </div>
      </div>

      {/* Card list of years */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4.5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#005baa]">
              <Icon icon="solar:calendar-date-bold" width={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Data RHPK Per Tahun
              </h2>
              <p className="text-xs text-slate-500">
                Pilih tahun RHPK yang ingin dilihat atau dievaluasi.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {years.map((item) => (
            <div
              key={item.year}
              className="flex items-center justify-between px-6 py-5 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    item.active
                      ? "bg-blue-50 font-bold text-[#005baa]"
                      : "bg-slate-100 font-semibold text-slate-400"
                  }`}
                >
                  <span className="text-sm">{item.short}</span>
                </div>

                <div>
                  <p
                    className={`font-semibold ${
                      item.active ? "text-slate-800" : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>

              {item.active ? (
                <Link
                  href={item.href || `/siproval/rhpk/${item.year}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004b8d]"
                >
                  <span>Lihat RHPK</span>
                  <Icon icon="solar:arrow-right-linear" width={16} />
                </Link>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400">
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
