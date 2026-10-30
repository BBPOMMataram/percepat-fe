"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { getUser, logout } from "@/features/authSlice";
import { showAlert } from "@/features/alertSlice";
import { Icon } from "@iconify/react";
import { RootState } from "@/redux/store";
import SiprovalDocumentHub from "./SiprovalDocumentHub";
import {
  SIPROVAL_EASE,
  SiprovalFadeUp,
  SiprovalLineDraw,
  SiprovalNavLink,
  SiprovalPillButton,
  SiprovalWordScrub,
} from "./SiprovalMotion";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

interface AvailableRole {
  id: string;
  role: string;
  badge: string;
  url: string;
  icon: string;
  desc: string;
}

export default function Siproval() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
      dispatch(
        showAlert({
          type: "success",
          message: "Anda telah berhasil keluar dari akun SIPROVAL.",
          description: "Sesi telah diakhiri. Silakan login kembali jika diperlukan.",
        })
      );
    } catch {
      // jika ada error, tetap redirect ke login
    } finally {
      window.location.href = "/login?redirectUrl=/siproval";
    }
  };

  // Dropdown states for multi-role users
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [heroDropdownOpen, setHeroDropdownOpen] = useState(false);

  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const heroDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(event.target as Node)
      ) {
        setHeaderDropdownOpen(false);
      }
      if (
        heroDropdownRef.current &&
        !heroDropdownRef.current.contains(event.target as Node)
      ) {
        setHeroDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    "fatimah t. wulandari",
  ];
  const allowedTuIds = [
    "019ab8b3-2885-7125-857c-ee07c4febdc0", // Fatimah Tri Wulandari
    "019ab8b3-493b-71d8-abd5-01c8ebcaf50e", // Fatimah T. Wulandari
    "019ab8b3-2fca-71ee-ba81-e33f70548c10", // Hilmi Khairan
    "019ab8b3-1fb0-73ef-af89-ad09ef30f76f", // Nanang Setyadi Santoso
    "019ab8b3-3a1c-73e0-ad51-4e07c7a343cc", // Syamsul Hady
  ];
  const allowedTuEmails = [
    "hilmi.khairan@pom.go.id",
    "nanang.setyadi@pom.go.id",
    "fatimah.wulandari@pom.go.id",
    "fatimah.wulandari03@gmail.com",
    "syamsul.hady@pom.go.id",
    "syamsul.hadi@pom.go.id",
  ];
  const allowedTuNames = [
    "hilmi khairan",
    "nanang setyadi santoso",
    "fatimah tri wulandari",
    "fatimah t. wulandari",
    "syamsul hady",
    "syamsul hadi",
  ];

  const userId = String(user?.id || "")
    .toLowerCase()
    .trim();
  const userEmail = (user?.email || "").toLowerCase().trim();
  const userNameClean = (user?.name || "").toLowerCase().trim();

  const isExplicitTuUser =
    allowedTuIds.includes(userId) ||
    allowedTuEmails.includes(userEmail) ||
    allowedTuNames.includes(userNameClean) ||
    userNameClean.includes("syamsul hady") ||
    userNameClean.includes("syamsul hadi") ||
    userEmail.includes("syamsul.hady") ||
    userEmail.includes("syamsul.hadi");

  const groupJabatanId = user?.employee?.group_jabatan_id;
  const isKatimFromTable =
    Array.isArray(user?.katims) && user.katims.length > 0;
  const isKatim = groupJabatanId === 3 || isKatimFromTable;

  const hasFungsiTu =
    !isKatim &&
    (Number(user?.employee?.fungsi_id) === 1 ||
      (user?.employee?.fungsi?.name || "").toLowerCase().trim() ===
        "tata usaha");

  const hasTuAccess = isExplicitTuUser || hasFungsiTu;

  const isPicAdmin =
    user?.role?.level === "superadmin" ||
    (user?.role?.level === "admin" &&
      Array.isArray(user?.sites) &&
      user.sites.some(
        (s: { id?: number; name?: string }) =>
          Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval"),
      )) ||
    userEmail === "hilmi.khairan@pom.go.id";

  // Nama sapaan singkat dan peran aktif
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : "";
  const shortRole = isPicAdmin
    ? "PIC"
    : groupJabatanId === 1
      ? "Kabalai"
      : hasTuAccess
        ? "Tata Usaha"
        : isKatim
          ? "Katim"
          : "Pegawai";

  // Hitung daftar ruang kerja yang dapat diakses oleh user ini
  const getAvailableRoles = (): AvailableRole[] => {
    if (!user) return [];

    const roles: AvailableRole[] = [];

    // Jika PIC / Admin Siproval
    if (isPicAdmin) {
      roles.push({
        id: "pic",
        role: "PIC (Pengelola Sistem)",
        badge: "Admin",
        url: "/siproval/admin/sinkronisasi-spreadsheet",
        icon: "solar:settings-bold",
        desc: "Sinkronisasi spreadsheet & permission",
      });
    }

    // Jika memiliki akses TU
    if (hasTuAccess) {
      roles.push({
        id: "tu",
        role: "Bagian Tata Usaha (TU)",
        badge: "Tata Usaha",
        url: "/siproval/tu",
        icon: "solar:pie-chart-2-bold",
        desc: "Realisasi RO & budget mapping",
      });
    }

    // Jika memiliki peran Katim
    if (isKatim) {
      roles.push({
        id: "katim",
        role: "Ketua Tim (Katim)",
        badge: "PIC IKSK",
        url: "/siproval/katim",
        icon: "solar:widget-5-bold",
        desc: "Pengisian capaian IKSK tim",
      });
    }

    // Jika Kepala Balai
    if (groupJabatanId === 1) {
      roles.push({
        id: "kabalai",
        role: "Kepala Balai (Kabalai)",
        badge: "Pimpinan",
        url: "/siproval/catatan",
        icon: "solar:widget-5-bold",
        desc: "Dashboard capaian & rekap RHPK",
      });
    }

    // Jika belum ada role terdaftar sama sekali (staf umum)
    if (roles.length === 0) {
      roles.push({
        id: "default",
        role: "Portal SIPROVAL",
        badge: "Pegawai",
        url: "/siproval/katim",
        icon: "solar:login-2-bold",
        desc: "Masuk ke halaman operasional",
      });
    }

    return roles;
  };

  const availableRoles = getAvailableRoles();
  const hasMultipleRoles = availableRoles.length > 1;
  const singleRoleUrl = availableRoles[0]?.url || "/siproval/katim";

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

          <nav className="hidden md:flex items-center gap-7">
            <SiprovalNavLink
              href="#beranda"
              label="Beranda"
              className={`text-sm font-medium ${
                scrolled
                  ? "text-slate-700 hover:text-[#003d73]"
                  : "text-white/90 hover:text-white"
              }`}
            />
            <SiprovalNavLink
              href="#dokumen-kinerja"
              label="Dokumen Kinerja"
              className={`text-sm font-medium ${
                scrolled
                  ? "text-slate-700 hover:text-[#003d73]"
                  : "text-white/90 hover:text-white"
              }`}
            />
            <Link
              href="/siproval/whats-new"
              className={`group inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-300 ${
                scrolled
                  ? "text-[#005baa] hover:text-[#003d73]"
                  : "text-white hover:text-blue-100"
              }`}
            >
              <span>What&apos;s New</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase transition-colors shadow-2xs ${
                  scrolled
                    ? "bg-blue-100 text-[#005baa] group-hover:bg-[#005baa] group-hover:text-white"
                    : "bg-white/20 text-white backdrop-blur-xs group-hover:bg-white group-hover:text-[#005baa]"
                }`}
              >
                V.2
              </span>
            </Link>
          </nav>

          {user ? (
            <div className="flex items-center gap-3">
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

              {/* Header Button: Jika Single Role -> Link Langsung, Jika Multi-Role -> Hover/Click Dropdown */}
              {hasMultipleRoles ? (
                <div
                  ref={headerDropdownRef}
                  className="relative"
                  onMouseEnter={() => setHeaderDropdownOpen(true)}
                  onMouseLeave={() => setHeaderDropdownOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setHeaderDropdownOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all duration-200 ${
                      scrolled
                        ? "bg-[#003d73] text-white hover:bg-[#00284d]"
                        : "bg-white text-[#001d3d] hover:bg-slate-100"
                    }`}
                  >
                    <span>Masuk ke Sistem</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      width={14}
                      className={`transition-transform duration-200 ${
                        headerDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {headerDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200/90 z-50 text-slate-800"
                      >
                        <div className="px-3 py-2 border-b border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Pilih Ruang Kerja
                          </p>
                          <p className="text-xs text-slate-500">
                            Akses peran yang tersedia untuk Anda
                          </p>
                        </div>
                        <div className="py-1 space-y-1">
                          {availableRoles.map((roleItem) => (
                            <Link
                              key={roleItem.id}
                              href={roleItem.url}
                              onClick={() => setHeaderDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#005baa] group-hover:bg-[#005baa] group-hover:text-white transition-colors">
                                <Icon icon={roleItem.icon} width={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#005baa] truncate">
                                    {roleItem.role}
                                  </p>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {roleItem.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {roleItem.desc}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="pt-1 mt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                              <Icon icon="solar:logout-2-bold" width={16} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold">Keluar Akun</p>
                              <p className="text-[11px] text-slate-400">Akhiri sesi login SIPROVAL</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <SiprovalPillButton
                  href={singleRoleUrl}
                  useNextLink={true}
                  label="Masuk ke Sistem"
                  className={`text-xs font-semibold px-4 py-2 ${
                    scrolled
                      ? "bg-[#003d73] text-white"
                      : "bg-white text-[#001d3d]"
                  }`}
                />
              )}

              {/* Tombol Logout Header */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Keluar dari akun SIPROVAL"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-all duration-200 ${
                  scrolled
                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300"
                    : "border-white/30 bg-white/10 text-white hover:bg-red-600 hover:border-red-600 hover:text-white backdrop-blur-xs"
                }`}
              >
                <Icon icon="solar:logout-2-bold" width={15} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <SiprovalPillButton
              href="/login?redirectUrl=/siproval"
              useNextLink={true}
              label="Masuk"
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
              SIPROVAL BBPOM di Mataram 2.0
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
              {/* Hero Masuk Button: Jika Multi-Role -> Dropdown, jika Single Role -> Direct Link */}
              {hasMultipleRoles ? (
                <div
                  ref={heroDropdownRef}
                  className="relative"
                  onMouseEnter={() => setHeroDropdownOpen(true)}
                  onMouseLeave={() => setHeroDropdownOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setHeroDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#003d73] hover:bg-[#00284d] text-white text-sm font-semibold rounded-full shadow-lg shadow-[#001d3d]/25 transition-all duration-200 active:scale-[0.98]"
                  >
                    <span>Masuk ke Sistem</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      width={16}
                      className={`transition-transform duration-200 ${
                        heroDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {heroDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-white p-2.5 shadow-2xl border border-slate-200/90 z-50 text-slate-800"
                      >
                        <div className="px-3.5 py-2.5 border-b border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Pilih Ruang Kerja Operasional
                          </p>
                          <p className="text-xs text-slate-500">
                            Silakan pilih modul peran yang ingin dibuka:
                          </p>
                        </div>
                        <div className="py-1.5 space-y-1">
                          {availableRoles.map((roleItem) => (
                            <Link
                              key={roleItem.id}
                              href={roleItem.url}
                              onClick={() => setHeroDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#005baa] group-hover:bg-[#005baa] group-hover:text-white transition-colors shrink-0">
                                <Icon icon={roleItem.icon} width={20} />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#005baa] truncate">
                                    {roleItem.role}
                                  </p>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                    {roleItem.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {roleItem.desc}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="pt-1.5 mt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0">
                              <Icon icon="solar:logout-2-bold" width={18} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold">Keluar Akun</p>
                              <p className="text-[11px] text-slate-400">Akhiri sesi login SIPROVAL</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <SiprovalPillButton
                  href={user ? singleRoleUrl : "/login?redirectUrl=/siproval"}
                  useNextLink={true}
                  label="Masuk ke Sistem"
                  className="px-7 py-3.5 bg-[#003d73] hover:bg-[#00284d] text-white text-sm font-semibold shadow-lg shadow-[#001d3d]/25"
                />
              )}

              <SiprovalPillButton
                href="/buku_handbook_siproval.pdf"
                download="buku_handbook_siproval.pdf"
                external={true}
                label="Unduh Buku Panduan"
                arrowDirection="download"
                className="px-7 py-3.5 bg-white hover:bg-slate-50 text-[#001d3d] text-sm font-semibold shadow-lg shadow-[#001d3d]/15"
              />

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-full border border-red-200 shadow-lg shadow-red-500/10 transition-all duration-200 active:scale-[0.98]"
                >
                  <Icon icon="solar:logout-2-bold" width={17} />
                  <span>Keluar</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          SCROLL-SCRUBBED STATEMENT BRIDGE (Transition to Dokumen Kinerja)
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
          REPOSITORI KINERJA BALAI (Pusat Dokumen & Informasi Kinerja)
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
                  href="#dokumen-kinerja"
                  label="Dokumen Kinerja"
                  className="text-xs sm:text-sm text-blue-100 hover:text-white"
                />
                <Link
                  href="/siproval/whats-new"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-100 hover:text-white font-medium"
                >
                  <span>What&apos;s New</span>
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    V.2
                  </span>
                </Link>
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
