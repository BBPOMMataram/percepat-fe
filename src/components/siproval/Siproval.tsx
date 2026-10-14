"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function Siproval() {
  const { user } = useSelector((state: RootState) => state.auth);

  const picEmails = [
    "hilmi.khairan@pom.go.id",
    "nanang.setyadi@pom.go.id",
    "fatimah.wulandari@pom.go.id",
    "fatimah.wulandari03@gmail.com",
  ];
  const picNames = [
    "hilmi khairan",
    "nanang setyadi santoso",
    "fatimah tri wulandari",
  ];

  const userEmail = (user?.email || "").toLowerCase();
  const userNameClean = (user?.name || "").toLowerCase().trim();

  const isPic =
    user?.role?.level === "superadmin" ||
    picEmails.includes(userEmail) ||
    picNames.includes(userNameClean) ||
    (user?.role?.level === "admin" &&
      Array.isArray(user?.sites) &&
      user.sites.some(
        (s: { id?: number; name?: string }) =>
          Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval")
      ));

  const groupJabatanId = user?.employee?.group_jabatan_id;

  const canAccess = (id: string) => {
    if (isPic) return true;
    if (id === "katim") return groupJabatanId === 3;
    if (id === "kabalai") return groupJabatanId === 1;
    if (id === "pic") return false;
    return false;
  };

  const roleCards = [
    {
      id: "katim",
      role: "Ketua Tim (Katim)",
      badge: "PIC IKSK",
      badgeColor: "bg-blue-100 text-blue-700",
      icon: "solar:document-text-bold",
      iconBg: "from-blue-600 to-indigo-600",
      description: "Pengisian, sinkronisasi, dan pelaporan capaian IKSK via Google Sheets sesuai penugasan.",
      links: [
        { label: "Dashboard Katim", url: "/siproval/katim" },
        { label: "Data Google Sheet", url: "/siproval/google-sheets" },
        { label: "Edit Rekap RHPK", url: "/siproval/katim/rhpk" },
      ],
    },
    {
      id: "kabalai",
      role: "Kepala Balai (Kabalai)",
      badge: "Pimpinan & Evaluasi",
      badgeColor: "bg-emerald-100 text-emerald-700",
      icon: "solar:chart-square-bold",
      iconBg: "from-emerald-600 to-teal-600",
      description: "Monitoring pelaksanaan kegiatan, evaluasi capaian, dan rekapitulasi RHPK.",
      links: [
        { label: "Data RHPK (Monev)", url: "/siproval/monev" },
        { label: "Catatan Monev", url: "/siproval/catatan" },
        { label: "Rekap RHPK 2026", url: "/siproval/rhpk/2026" },
      ],
    },
    {
      id: "pic",
      role: "PIC (Pengelola Sistem)",
      badge: "Integrasi & Akses",
      badgeColor: "bg-purple-100 text-purple-700",
      icon: "solar:settings-bold",
      iconBg: "from-purple-600 to-violet-600",
      description: "Pembaruan dokumen spreadsheet, pengaturan periode pengisian, dan manajemen hak akses pengguna.",
      links: [
        { label: "Pembaruan Spreadsheet", url: "/siproval/admin/sinkronisasi-spreadsheet" },
        { label: "Otorisasi & Kunci Bulan", url: "/siproval/admin/permission" },
      ],
    },
  ];

  const userActorTitle = isPic
    ? "PIC SIPROVAL"
    : groupJabatanId === 1
    ? "Kepala Balai (Kabalai)"
    : groupJabatanId === 3
    ? "Ketua Tim (Katim)"
    : "Pegawai BBPOM di Mataram";

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/40 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <Image
              src="/assets/images/bpom.webp"
              alt="Logo BBPOM"
              width={140}
              height={140}
              priority
              className="h-24 sm:h-28 w-auto object-contain drop-shadow-md transition-transform hover:scale-105"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 bg-blue-100 text-[#005baa] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              <Icon icon="solar:shield-check-bold" width={16} height={16} />
              SI MANDALIKA &bull; SIPROVAL
            </span>
            {user && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                <Icon icon="solar:user-bold" width={14} height={14} />
                {user.name} ({userActorTitle})
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            SIPROVAL <span className="text-[#005baa]">BBPOM</span> di Mataram
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Sistem Informasi Program dan Evaluasi terpadu untuk monitoring, evaluasi, anggaran, dan pelaporan kinerja Balai Besar POM di Mataram.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {roleCards.map((card) => {
            const hasAccess = canAccess(card.id);

            return (
              <div
                key={card.id}
                className={`rounded-2xl border transition-all flex flex-col justify-between p-6 ${
                  hasAccess
                    ? "bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-200"
                    : "bg-slate-50/70 border-slate-200/60 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-white shadow-sm`}
                    >
                      <Icon icon={card.icon} width={26} height={26} />
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasAccess && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Akses Terbatas
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${card.badgeColor}`}
                      >
                        {card.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">{card.role}</h3>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed">{card.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {card.links.map((link) =>
                    hasAccess ? (
                      <Link
                        key={link.url}
                        href={link.url}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#005baa] border border-slate-200 hover:border-blue-200 text-xs font-semibold transition-colors"
                      >
                        <span>{link.label}</span>
                        <Icon icon="solar:arrow-right-linear" width={14} height={14} />
                      </Link>
                    ) : (
                      <span
                        key={link.url}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-200/50 text-xs font-medium cursor-not-allowed"
                        title="Anda tidak memiliki izin untuk fitur ini"
                      >
                        <span>{link.label}</span>
                        <Icon icon="solar:lock-bold" width={12} height={12} />
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200/60 mt-auto">
        &copy; {new Date().getFullYear()} Balai Besar Pengawas Obat dan Makanan di Mataram &mdash; Dilindungi Hak Cipta
      </footer>
    </section>
  );
}