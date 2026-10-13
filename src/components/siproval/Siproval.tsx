"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

export default function Siproval() {
  const roleCards = [
    {
      role: "Ketua Tim (Katim)",
      badge: "PIC IKSK",
      badgeColor: "bg-blue-100 text-blue-700",
      icon: "solar:document-text-bold",
      iconBg: "from-blue-600 to-indigo-600",
      description: "Pengisian, sinkronisasi, dan pelaporan capaian IKSK via Google Sheets.",
      links: [
        { label: "Dashboard Katim", url: "/siproval/katim" },
        { label: "Data Google Sheet", url: "/siproval/google-sheets" },
      ],
    },
    {
      role: "Kepala Balai (Kabalai)",
      badge: "Pimpinan & Evaluasi",
      badgeColor: "bg-emerald-100 text-emerald-700",
      icon: "solar:chart-square-bold",
      iconBg: "from-emerald-600 to-teal-600",
      description: "Monitoring pelaksanaan kegiatan, rekapitulasi RHPK, dan pemberian arahan pimpinan.",
      links: [
        { label: "Data RHPK (Monev)", url: "/siproval/monev" },
        { label: "Catatan Monev", url: "/siproval/catatan" },
        { label: "Tambah Arahan", url: "/siproval/arahan-pimpinan" },
        { label: "Rekap RHPK 2026", url: "/siproval/rhpk/2026" },
      ],
    },
    {
      role: "Tata Usaha (TU)",
      badge: "Penganggaran",
      badgeColor: "bg-amber-100 text-amber-700",
      icon: "solar:pie-chart-2-bold",
      iconBg: "from-amber-600 to-orange-600",
      description: "Pemetaan anggaran belanja, rekapitulasi bulanan, dan pengawasan realisasi anggaran.",
      links: [
        { label: "Dashboard TU", url: "/siproval/tu" },
        { label: "Budget Mapping 2026", url: "/siproval/budget-mapping" },
      ],
    },
    {
      role: "Superadmin",
      badge: "Integrasi & Akses",
      badgeColor: "bg-purple-100 text-purple-700",
      icon: "solar:settings-bold",
      iconBg: "from-purple-600 to-violet-600",
      description: "Sinkronisasi dokumen spreadsheet, pengelolaan tab, dan manajemen hak akses pengguna.",
      links: [
        { label: "Sinkronisasi Spreadsheet", url: "/siproval/admin/sinkronisasi-spreadsheet" },
        { label: "Sinkronisasi Tab", url: "/siproval/admin/sinkronisasi-tab" },
        { label: "Hak Akses / Permission", url: "/siproval/admin/permission" },
      ],
    },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/40 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#005baa] to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
            <Icon icon="solar:chart-2-bold" width={42} height={42} />
          </div>

          <span className="inline-flex items-center gap-2 bg-blue-100 text-[#005baa] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
            <Icon icon="solar:shield-check-bold" width={16} height={16} />
            SI MANDALIKA &bull; SIPROVAL
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            SIPROVAL <span className="text-[#005baa]">BBPOM</span> di Mataram
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Sistem Informasi Program dan Evaluasi terpadu untuk monitoring, evaluasi, anggaran, dan pelaporan kinerja Balai Besar POM di Mataram.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {roleCards.map((card) => (
            <div
              key={card.role}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-white shadow-sm`}>
                    <Icon icon={card.icon} width={26} height={26} />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{card.role}</h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">{card.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                {card.links.map((link) => (
                  <Link
                    key={link.url}
                    href={link.url}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#005baa] border border-slate-200 hover:border-blue-200 text-xs font-semibold transition-colors"
                  >
                    <span>{link.label}</span>
                    <Icon icon="solar:arrow-right-linear" width={14} height={14} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200/60 mt-auto">
        &copy; {new Date().getFullYear()} Balai Besar Pengawas Obat dan Makanan di Mataram &mdash; Dilindungi Hak Cipta
      </footer>
    </section>
  );
}