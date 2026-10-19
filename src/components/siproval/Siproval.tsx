"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import SiprovalDocumentHub from "./SiprovalDocumentHub";
import {
  SIPROVAL_EASE,
  SiprovalFadeUp,
  SiprovalLineDraw,
  SiprovalNavLink,
  SiprovalPillButton,
  SiprovalSpotlightCard,
  SiprovalWordScrub,
} from "./SiprovalMotion";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function Siproval() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Scroll-Linked Hero Parallax
  const watermarkY = useTransform(heroScroll, [0, 1], ["0%", "38%"]);
  const watermarkOpacity = useTransform(heroScroll, [0, 0.85], [1, 0]);
  const ingesY = useTransform(heroScroll, [0, 1], ["0%", "14%"]);
  const heroTextY = useTransform(heroScroll, [0, 1], ["0%", "20%"]);

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

  const groupJabatanId = user?.employee?.group_jabatan_id;
  const isKatimFromTable =
    Array.isArray(user?.katims) && user.katims.length > 0;
  const isKatim = groupJabatanId === 3 || isKatimFromTable;

  const canAccess = (id: string) => {
    if (isPic) return true;
    if (id === "tu") return true;
    if (id === "katim") return isKatim || isPic;
    if (id === "kabalai") return groupJabatanId === 1 || isPic;
    if (id === "pic") return false;
    return false;
  };

  // Nama sapaan singkat dan peran aktif tanpa tanda strip
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : "";
  const shortRole = isPic
    ? "PIC"
    : groupJabatanId === 1
      ? "Kabalai"
      : isKatim
        ? "Katim"
        : groupJabatanId === 2
          ? "Tata Usaha"
          : "Pegawai";

  const roleCards = [
    {
      id: "katim",
      index: "01",
      role: "Ketua Tim (Katim)",
      badge: "PIC IKSK",
      variant: "royal" as const,
      description:
        "Pengisian, sinkronisasi, dan pelaporan capaian IKSK via Google Sheets sesuai penugasan.",
      url: "/siproval/katim",
    },
    {
      id: "kabalai",
      index: "02",
      role: "Kepala Balai (Kabalai)",
      badge: "Pimpinan & Evaluasi",
      variant: "navy" as const,
      description:
        "Monitoring pelaksanaan kegiatan, evaluasi capaian, dan rekapitulasi RHPK.",
      url: "/siproval/monev",
    },
    {
      id: "tu",
      index: "03",
      role: "Bagian Tata Usaha (TU)",
      badge: "Perencanaan & Anggaran",
      variant: "navy" as const,
      description:
        "Pengelolaan alokasi perencanaan anggaran, rincian belanja bulanan, dan pemetaan budget mapping.",
      url: "/siproval/tu",
    },
    {
      id: "pic",
      index: "04",
      role: "PIC (Pengelola Sistem)",
      badge: "Integrasi & Akses",
      variant: "royal" as const,
      description:
        "Pembaruan dokumen spreadsheet, pengaturan periode pengisian, dan manajemen hak akses pengguna.",
      url: "/siproval/admin/sinkronisasi-spreadsheet",
    },
  ];

  return (
    <div
      className={`${plusJakartaSans.className} min-h-screen w-full bg-white text-[#001d3d] flex flex-col justify-between overflow-x-hidden antialiased selection:bg-[#005baa] selection:text-white`}
    >
      {/* Animated Top Header */}
      <motion.header
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{ duration: 0.85, ease: SIPROVAL_EASE }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 px-6 sm:px-10 lg:px-16 ${
          scrolled
            ? "py-3.5 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_8px_30px_rgba(0,29,61,0.06)]"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/siproval" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-2xs transition-transform duration-300 group-hover:scale-105">
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
              <SiprovalNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                className={`text-sm font-medium ${
                  scrolled
                    ? "text-slate-700 hover:text-[#003d73]"
                    : "text-white/90 hover:text-white"
                }`}
              />
            ))}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold transition-colors ${
                  scrolled ? "text-[#001d3d]" : "text-white"
                }`}
              >
                Hai, {firstName}
              </span>
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${
                  scrolled
                    ? "bg-[#005baa]/10 text-[#005baa]"
                    : "bg-white/20 text-white backdrop-blur-xs"
                }`}
              >
                {shortRole}
              </span>
            </div>
          ) : (
            <SiprovalPillButton
              href="#entry-data"
              label="Masuk & Entry Data"
              className={`text-xs font-semibold px-4 py-2 ${
                scrolled ? "bg-[#003d73] text-white" : "bg-white text-[#001d3d]"
              }`}
            />
          )}
        </div>
      </motion.header>

      {/* =====================================================================
          SECTION 1: FULL WELCOME HERO
      ====================================================================== */}
      <section
        id="beranda"
        ref={heroRef}
        className="relative min-h-screen w-full flex items-center pt-28 pb-16 px-6 sm:px-10 lg:px-16 overflow-hidden"
      >
        {/* Smooth Vertical Gradient (BBPOM Navy -> Blue -> White) */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: SIPROVAL_EASE }}
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#001226_0%,#00254d_24%,#003d73_46%,#005baa_64%,#5ca0db_82%,#ffffff_100%)]"
        />

        {/* Parallax Watermark Wordmark */}
        <motion.div
          aria-hidden="true"
          style={{ y: watermarkY, opacity: watermarkOpacity }}
          className="pointer-events-none select-none absolute left-1/2 top-[13vh] -translate-x-1/2 w-full text-center overflow-hidden"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: SIPROVAL_EASE }}
            className="block text-[16vw] font-extrabold uppercase tracking-[-0.04em] leading-none text-white/[0.08]"
          >
            SIPROVAL
          </motion.span>
        </motion.div>

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-center gap-12 pt-6">
          {/* Left Column: Agent Inges */}
          <motion.div
            style={{ y: ingesY }}
            className="lg:col-span-5 flex justify-center order-2 lg:order-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 95, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.15, ease: SIPROVAL_EASE }}
              className="relative w-[220px] sm:w-[260px] lg:w-[290px]"
            >
              <Image
                src="/assets/images/agent-inges.png"
                alt="Agent Inges"
                width={396}
                height={942}
                priority
                className="w-full h-auto object-contain drop-shadow-[0_28px_42px_rgba(0,30,68,0.32)]"
              />
            </motion.div>
          </motion.div>

          {/* Right Column: Clean Editorial Welcome Text */}
          <motion.div
            style={{ y: heroTextY }}
            className="lg:col-span-7 flex flex-col items-start text-left order-1 lg:order-2"
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: SIPROVAL_EASE }}
              className="flex flex-wrap items-center gap-2.5 mb-4"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-blue-100">
                SI MANDALIKA
              </span>
              {user && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/15 text-white backdrop-blur-xs">
                  Hai, {firstName} &bull; {shortRole}
                </span>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.2, ease: SIPROVAL_EASE }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-[-0.025em] leading-[1.12] mb-5"
            >
              SIPROVAL BBPOM di Mataram
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.3, ease: SIPROVAL_EASE }}
              className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl mb-9 font-normal"
            >
              Sistem Informasi Program dan Evaluasi terpadu untuk monitoring,
              evaluasi, anggaran, dan pelaporan kinerja Balai Besar POM di
              Mataram.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.4, ease: SIPROVAL_EASE }}
              className="flex flex-wrap items-center gap-3.5"
            >
              <SiprovalPillButton
                href="#entry-data"
                label="Masuk & Entry Data"
                className="px-7 py-3.5 bg-[#003d73] hover:bg-[#00284d] text-white text-sm font-semibold shadow-lg shadow-[#001d3d]/25"
              />
              <SiprovalPillButton
                href="#dokumen-kinerja"
                label="Dokumen Kinerja"
                className="px-7 py-3.5 bg-white hover:bg-slate-50 text-[#001d3d] text-sm font-semibold shadow-lg shadow-[#001d3d]/15"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          SCROLL-SCRUBBED STATEMENT BRIDGE (Transition Section 1 -> 2)
      ====================================================================== */}
      <SiprovalWordScrub
        badge="Ekosistem Kinerja Terpadu"
        text="Setiap capaian kinerja harus terukur dan terdokumentasi secara akurat. SIPROVAL menyatukan target perencanaan, realisasi anggaran, dan evaluasi bulanan dalam satu ekosistem terpadu."
        highlightWords={[
          "terukur",
          "akurat",
          "siproval",
          "perencanaan",
          "anggaran",
          "evaluasi",
          "terpadu",
        ]}
      />

      {/* =====================================================================
          SECTION 2: MASUK & ENTRY DATA
      ====================================================================== */}
      <section
        id="entry-data"
        className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 scroll-mt-14 overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f4f8fd_50%,#ffffff_100%)]"
      >
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Animated Section Header */}
          <div className="pb-8">
            <SiprovalFadeUp>
              <p className="text-xs font-bold uppercase tracking-widest text-[#005baa] mb-2">
                Ruang Kerja Sistem
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#001d3d] tracking-[-0.02em] leading-[1.12]">
                Masuk &amp; Entry Data
              </h2>
            </SiprovalFadeUp>
          </div>

          <div className="mb-12">
            <SiprovalLineDraw className="bg-slate-200" />
          </div>

          {/* 2x2 Spotlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">
            {roleCards.map((card, idx) => {
              const hasAccess = canAccess(card.id);
              const isRoyal = card.variant === "royal";

              const cardSurfaceClass = hasAccess
                ? isRoyal
                  ? "bg-[linear-gradient(145deg,#00529e_0%,#003d73_55%,#00254d_100%)] text-white border-[#005baa]/40 shadow-[0_22px_50px_-14px_rgba(0,61,115,0.34)]"
                  : "bg-[linear-gradient(145deg,#06152d_0%,#001d3d_55%,#002e5d_100%)] text-white border-white/15 shadow-[0_22px_50px_-14px_rgba(0,24,51,0.38)]"
                : "bg-[linear-gradient(145deg,#ffffff_0%,#f1f6fc_100%)] text-[#001d3d] border-slate-200/90 shadow-[0_14px_34px_-12px_rgba(0,29,61,0.08)]";

              const spotlightColor = hasAccess
                ? isRoyal
                  ? "rgba(120, 198, 255, 0.30)"
                  : "rgba(0, 132, 255, 0.32)"
                : "rgba(0, 91, 170, 0.09)";

              return (
                <SiprovalSpotlightCard
                  key={card.id}
                  delay={idx * 0.1}
                  spotlightColor={spotlightColor}
                  className={`rounded-[28px] border p-7 sm:p-9 transition-shadow duration-500 ${cardSurfaceClass}`}
                >
                  <div>
                    {/* Top Row: Editorial Index, Role Title & Badge */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <span
                          className={`block text-xs font-extrabold tracking-[0.2em] uppercase mb-1.5 ${
                            hasAccess ? "text-sky-300/80" : "text-[#005baa]/60"
                          }`}
                        >
                          {card.index}
                        </span>
                        <h3
                          className={`text-xl sm:text-2xl font-bold tracking-tight ${
                            hasAccess ? "text-white" : "text-[#001d3d]"
                          }`}
                        >
                          {card.role}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                        {!hasAccess && (
                          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-200/80 text-slate-600">
                            Akses Terbatas
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold px-3.5 py-1 rounded-full ${
                            hasAccess
                              ? "bg-white/15 text-white backdrop-blur-xs border border-white/15"
                              : "bg-[#005baa]/10 text-[#005baa]"
                          }`}
                        >
                          {card.badge}
                        </span>
                      </div>
                    </div>

                    {/* Animated Divider Line */}
                    <div className="mb-5">
                      <SiprovalLineDraw
                        delay={0.15 + idx * 0.08}
                        className={hasAccess ? "bg-white/20" : "bg-slate-200"}
                      />
                    </div>

                    <p
                      className={`text-sm sm:text-[15px] leading-relaxed mb-8 ${
                        hasAccess ? "text-blue-50/90" : "text-slate-600"
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>

                  {/* Single Clean Masuk Button */}
                  <div className="pt-1 flex items-center justify-between">
                    {hasAccess ? (
                      <SiprovalPillButton
                        href={card.url}
                        useNextLink={true}
                        label="Masuk"
                        className="px-7 py-3 bg-white text-[#001d3d] hover:bg-sky-50 text-xs sm:text-sm font-bold shadow-md"
                      />
                    ) : (
                      <span
                        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-slate-200/75 text-slate-500 text-xs sm:text-sm font-semibold cursor-not-allowed"
                        title="Akses terbatas untuk peran Anda saat ini"
                      >
                        Masuk
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-semibold tracking-wider uppercase ${
                        hasAccess ? "text-white/50" : "text-slate-400"
                      }`}
                    >
                      {hasAccess ? "Akses Aktif" : "Terkunci"}
                    </span>
                  </div>
                </SiprovalSpotlightCard>
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

      {/* =====================================================================
          DEEP BLUE ARCHITECTURAL FOOTER
      ====================================================================== */}
      <footer className="relative overflow-hidden bg-[linear-gradient(180deg,#002855_0%,#001226_100%)] text-white pt-16 pb-10 px-6 sm:px-10 lg:px-16">
        {/* Subtle Giant Watermark at Bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-1/2 -bottom-[3vw] -translate-x-1/2 w-full text-center overflow-hidden"
        >
          <span className="block text-[15vw] font-extrabold uppercase tracking-[-0.04em] leading-none text-white/[0.04]">
            SIPROVAL
          </span>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10">
            <SiprovalFadeUp>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-white p-1 flex items-center justify-center">
                  <Image
                    src="/assets/images/bpom.webp"
                    alt="Logo BBPOM"
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-base font-extrabold tracking-tight text-white">
                  SIPROVAL &bull; BBPOM di Mataram
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/80 max-w-md leading-relaxed">
                Sistem Informasi Program dan Evaluasi terpadu Balai Besar
                Pengawas Obat dan Makanan di Mataram.
              </p>
            </SiprovalFadeUp>

            <SiprovalFadeUp delay={0.1}>
              <div className="flex flex-wrap items-center gap-6">
                <SiprovalNavLink
                  href="#beranda"
                  label="Beranda"
                  className="text-xs sm:text-sm text-blue-100 hover:text-white"
                />
                <SiprovalNavLink
                  href="#entry-data"
                  label="Masuk & Entry Data"
                  className="text-xs sm:text-sm text-blue-100 hover:text-white"
                />
                <SiprovalNavLink
                  href="#dokumen-kinerja"
                  label="Dokumen Kinerja"
                  className="text-xs sm:text-sm text-blue-100 hover:text-white"
                />
              </div>
            </SiprovalFadeUp>
          </div>

          <SiprovalLineDraw className="bg-white/15" />

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-100/75">
            <span>
              &copy; {new Date().getFullYear()} Balai Besar POM di Mataram.
              Seluruh hak cipta dilindungi.
            </span>

            <SiprovalPillButton
              href="#beranda"
              label="Kembali ke Atas"
              arrowDirection="up"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
