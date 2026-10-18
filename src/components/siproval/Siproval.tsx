"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import SiprovalDocumentHub from "./SiprovalDocumentHub";

export default function Siproval() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 32);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval"),
      ));

  const isBasukiKatim =
    String(user?.id) === "019ab8b3-4a06-7007-8337-2794c43cea4f" ||
    userEmail === "al.el.dul79@gmail.com" ||
    userNameClean === "basuki murdi hartono";
  const groupJabatanId = isBasukiKatim ? 3 : user?.employee?.group_jabatan_id;

  const canAccess = (id: string) => {
    if (isPic) return true;
    if (id === "tu") return groupJabatanId === 2 || isPic;
    if (id === "katim") return groupJabatanId === 3 || isPic;
    if (id === "kabalai") return groupJabatanId === 1 || isPic;
    if (id === "pic") return false;
    return false;
  };

  // Nama sapaan singkat + peran saat ini (contoh: "Hai, Yogi — Kabalai")
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : "";
  const shortRole = isPic
    ? "PIC"
    : groupJabatanId === 1
      ? "Kabalai"
      : groupJabatanId === 2
        ? "Tata Usaha"
        : groupJabatanId === 3
          ? "Katim"
          : "Pegawai";

  const roleCards = [
    {
      id: "katim",
      role: "Ketua Tim (Katim)",
      badge: "PIC IKSK",
      description:
        "Pengisian, sinkronisasi, dan pelaporan capaian IKSK via Google Sheets sesuai penugasan.",
      links: [
        { label: "Dashboard Katim", url: "/siproval/katim" },
        { label: "Data Google Sheet", url: "/siproval/google-sheets" },
      ],
    },
    {
      id: "kabalai",
      role: "Kepala Balai (Kabalai)",
      badge: "Pimpinan & Evaluasi",
      description:
        "Monitoring pelaksanaan kegiatan, evaluasi capaian, dan rekapitulasi RHPK.",
      links: [
        { label: "Data RHPK (Monev)", url: "/siproval/monev" },
        { label: "Catatan Monev", url: "/siproval/catatan" },
        { label: "Rekap RHPK 2026", url: "/siproval/rhpk/2026" },
      ],
    },
    {
      id: "tu",
      role: "Bagian Tata Usaha (TU)",
      badge: "Perencanaan & Anggaran",
      description:
        "Pengelolaan alokasi perencanaan anggaran, rincian belanja bulanan, dan pemetaan budget mapping.",
      links: [
        { label: "Dashboard Tata Usaha", url: "/siproval/tu" },
        { label: "Realisasi RO 2026", url: "/siproval/tu/realisasi-ro" },
        {
          label: "Budget Mapping 2026",
          url: "/siproval/budget-mapping/year?year=2026",
        },
        { label: "Daftar Tahun Anggaran", url: "/siproval/budget-mapping" },
      ],
    },
    {
      id: "pic",
      role: "PIC (Pengelola Sistem)",
      badge: "Integrasi & Akses",
      description:
        "Pembaruan dokumen spreadsheet, pengaturan periode pengisian, dan manajemen hak akses pengguna.",
      links: [
        {
          label: "Pembaruan Spreadsheet",
          url: "/siproval/admin/sinkronisasi-spreadsheet",
        },
        {
          label: "Otorisasi & Kunci Bulan",
          url: "/siproval/admin/permission",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-[#001d3d] flex flex-col justify-between overflow-x-hidden selection:bg-[#005baa] selection:text-white">
      {/* Minimalist Top Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 px-6 sm:px-10 lg:px-16 ${
          scrolled
            ? "py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/siproval" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-2xs">
              <Image
                src="/assets/images/bpom.webp"
                alt="Logo BBPOM"
                width={36}
                height={36}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <span
              className={`text-sm font-bold tracking-tight transition-colors ${
                scrolled ? "text-[#001d3d]" : "text-white"
              }`}
            >
              SIPROVAL
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Beranda", href: "#beranda" },
              { label: "Masuk & Entry Data", href: "#entry-data" },
              { label: "Dokumen Kinerja", href: "#dokumen-kinerja" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-slate-600 hover:text-[#003d73]"
                    : "text-white/85 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {user ? (
            <span
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${
                scrolled
                  ? "bg-slate-100 text-[#003d73]"
                  : "bg-white/15 text-white backdrop-blur-xs"
              }`}
            >
              Hai, {firstName} &mdash; {shortRole}
            </span>
          ) : (
            <a
              href="#entry-data"
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                scrolled ? "bg-[#003d73] text-white" : "bg-white text-[#001d3d]"
              }`}
            >
              Masuk &amp; Entry Data
            </a>
          )}
        </div>
      </header>

      {/* =====================================================================
          SECTION 1: FULL WELCOME HERO (Kyntra Clean Layout)
      ====================================================================== */}
      <section
        id="beranda"
        className="relative min-h-screen w-full flex items-center pt-28 pb-16 px-6 sm:px-10 lg:px-16 overflow-hidden"
      >
        {/* Kyntra Smooth Vertical Gradient (BBPOM Navy -> Blue -> White) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#001226_0%,#00254d_24%,#003d73_46%,#005baa_64%,#5ca0db_82%,#ffffff_100%)]"
        />

        {/* Subtle Watermark Wordmark */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-1/2 top-[14vh] -translate-x-1/2 w-full text-center overflow-hidden"
        >
          <span className="block text-[16vw] font-black uppercase tracking-[-0.04em] leading-none text-white/[0.07]">
            SIPROVAL
          </span>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-center gap-12 pt-6">
          {/* Left Column: Agent Inges (Clean without box/card, just like Kyntra mockup) */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <div className="relative w-[220px] sm:w-[260px] lg:w-[290px]">
              <Image
                src="/assets/images/agent-inges.png"
                alt="Agent Inges"
                width={396}
                height={942}
                priority
                className="w-full h-auto object-contain drop-shadow-[0_24px_36px_rgba(0,30,68,0.28)]"
              />
            </div>
          </div>

          {/* Right Column: Clean Editorial Welcome Text */}
          <div className="lg:col-span-7 flex flex-col items-start text-left order-1 lg:order-2">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-100 mb-3">
              SI MANDALIKA &bull;{" "}
              {user ? `Hai, ${firstName} — ${shortRole}` : "SIPROVAL"}
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-white tracking-[-0.02em] leading-[1.12] mb-5">
              SIPROVAL BBPOM di Mataram
            </h1>

            <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl mb-9 font-normal">
              Sistem Informasi Program dan Evaluasi terpadu untuk monitoring,
              evaluasi, anggaran, dan pelaporan kinerja Balai Besar POM di
              Mataram.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#entry-data"
                className="px-7 py-3.5 rounded-full bg-[#003d73] hover:bg-[#00284d] text-white text-sm font-semibold transition-all shadow-md"
              >
                Masuk &amp; Entry Data
              </a>
              <a
                href="#dokumen-kinerja"
                className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#001d3d] text-sm font-semibold transition-all shadow-md"
              >
                Dokumen Kinerja
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: MASUK & ENTRY DATA (Clean, Uniform 2x2 Grid Cards)
      ====================================================================== */}
      <section
        id="entry-data"
        className="w-full bg-white py-20 sm:py-24 px-6 sm:px-10 lg:px-16 scroll-mt-14"
      >
        <div className="max-w-6xl mx-auto">
          {/* Clean Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-slate-200 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#005baa] mb-2">
                Ruang Kerja Sistem
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#001d3d] tracking-tight">
                Masuk &amp; Entry Data
              </h2>
            </div>
            <p className="text-sm text-slate-500 max-w-md md:text-right leading-relaxed">
              Pilih menu operasional di bawah ini untuk melakukan pengisian data
              capaian, pemantauan evaluasi, maupun pengelolaan anggaran.
            </p>
          </div>

          {/* Neat 2x2 Grid of Cards (No icons, clean lines) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roleCards.map((card) => {
              const hasAccess = canAccess(card.id);

              return (
                <div
                  key={card.id}
                  className={`rounded-3xl border p-7 sm:p-8 flex flex-col justify-between transition-all ${
                    hasAccess
                      ? "bg-white border-slate-200 hover:border-[#005baa] shadow-xs hover:shadow-md"
                      : "bg-slate-50/70 border-slate-200/70"
                  }`}
                >
                  <div>
                    {/* Top Row: Role Title & Badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3
                        className={`text-lg sm:text-xl font-bold tracking-tight ${
                          hasAccess ? "text-[#001d3d]" : "text-slate-500"
                        }`}
                      >
                        {card.role}
                      </h3>

                      <div className="flex items-center gap-2 shrink-0">
                        {!hasAccess && (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                            Akses Terbatas
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-semibold px-3 py-0.5 rounded-full ${
                            hasAccess
                              ? "bg-[#005baa]/10 text-[#005baa]"
                              : "bg-slate-200/60 text-slate-500"
                          }`}
                        >
                          {card.badge}
                        </span>
                      </div>
                    </div>

                    <div className="h-px w-full bg-slate-100 mb-4" />

                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {card.description}
                    </p>
                  </div>

                  {/* Clean Action Buttons */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {card.links.map((link) =>
                      hasAccess ? (
                        <Link
                          key={link.url}
                          href={link.url}
                          className="px-4 py-2 rounded-full bg-slate-100 hover:bg-[#005baa] text-[#001d3d] hover:text-white text-xs font-semibold transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span
                          key={link.url}
                          className="px-4 py-2 rounded-full bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed"
                          title="Akses terbatas untuk peran Anda saat ini"
                        >
                          {link.label}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: REPOSITORI KINERJA BALAI (Pusat Dokumen & Informasi Kinerja)
      ====================================================================== */}
      <Suspense fallback={null}>
        <SiprovalDocumentHub />
      </Suspense>

      {/* Clean Minimal Footer */}
      <footer className="bg-slate-50 text-slate-500 py-8 px-6 sm:px-10 lg:px-16 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="font-semibold text-[#001d3d]">
            SIPROVAL &mdash; Balai Besar POM di Mataram
          </span>
          <span>
            &copy; {new Date().getFullYear()} BBPOM di Mataram. Seluruh hak
            cipta dilindungi.
          </span>
        </div>
      </footer>
    </div>
  );
}
