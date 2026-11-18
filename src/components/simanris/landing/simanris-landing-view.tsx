"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Layers,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import { getUser } from "@/features/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import { simanrisApi, setSimanrisActorHeaders } from "../lib/simanrisApi";
import type { MasterOptionsData, OverviewData } from "../types";

// ============================================================================
// MOTION CURVES & ANIMATION HELPERS (Fluid & Modern)
// ============================================================================
const EASE_SNAPPY = [0.16, 1, 0.3, 1] as const;

function AnimatedNumber({ value }: { value: number }) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 1000;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, shouldReduceMotion]);

  return <span>{displayValue}</span>;
}

// 4 Modern & Action-Oriented Stages of SIMANRIS
const WORKFLOW_STAGES = [
  {
    num: "01",
    tag: "PETAKAN RISIKO",
    title: "Tangkap Risiko Sejak Dini",
    subtitle: "Identifikasi potensi hambatan di 5 unit kerja sebelum mengganggu target",
    desc: "Inventarisasi potensi masalah secara menyeluruh di Tata Usaha, Pemeriksaan, Penindakan, Pengujian, dan Infokom. Lengkap dengan perumusan akar penyebab (root cause), dampak ke sasaran IKU, serta penanggung jawab (risk owner) yang jelas.",
    pills: ["5 Unit Operasional", "Root Cause Analysis", "Owner Jelas"],
    statHighlight: "160 Risiko Terpetakan",
    icon: Layers,
    accentColor: "#004281",
  },
  {
    num: "02",
    tag: "HITUNG SKOR 5×5",
    title: "Kalkulasi Matriks Otomatis",
    subtitle: "Penilaian level kemungkinan & dampak instan tanpa hitung manual",
    desc: "Sistem otomatis mengalikan kemungkinan (1–5) dan dampak (1–5) untuk memetakan level inheren. Langsung menyaring dan mengisolasi risiko merah (skor ≥ 16) yang wajib segera dibuatkan rencana tindak pengendalian.",
    pills: ["Matriks 5 × 5", "Filter Skor ≥ 16", "Zona Merah Terisolasi"],
    statHighlight: "41 Risiko Inheren Tinggi",
    icon: ShieldAlert,
    accentColor: "#E11D48",
  },
  {
    num: "03",
    tag: "UJI & BUKTI FISIK",
    title: "Aksi Pengendalian Nyata",
    subtitle: "Bukan sekadar klaim. Lampirkan bukti nyata di lapangan",
    desc: "Unit kerja mencatat realisasi pengendalian langsung dengan menempelkan tautan dokumen atau mengunggah berkas PDF, Excel, dan Foto hasil pengujian. Setiap perubahan tercatat atas nama pengguna yang bertugas secara transparan.",
    pills: ["Link & Upload Berkas", "Format PDF / Excel / Foto", "User Tracked"],
    statHighlight: "Bukti Fisik & Tautan Terverifikasi",
    icon: ClipboardCheck,
    accentColor: "#0284C7",
  },
  {
    num: "04",
    tag: "PANTAU & LAPOR",
    title: "Evaluasi Semesteran & Residual",
    subtitle: "Pantau penurunan risiko dan siap lapor pimpinan kapan saja",
    desc: "Pantau pergeseran level risiko dari inheren ke residual setelah tindakan mitigasi dijalankan. Bandingkan tren antar-semester (S1 vs S2) dan unduh data akuntabilitas kinerja yang siap diserahkan ke pimpinan instansi dan inspektorat.",
    pills: ["Penurunan Residual", "Tren Semester S1 & S2", "Siap Audit"],
    statHighlight: "Evaluasi Semester II 2026 Aktif",
    icon: BarChart3,
    accentColor: "#059669",
  },
];

export function SimanrisLandingView() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const shouldReduceMotion = useReducedMotion();

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [masterOptions, setMasterOptions] = useState<MasterOptionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Scroll Target Refs for Parallax & Progressive Flow
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const workflowRef = useRef<HTMLElement>(null);

  // Global Page Scroll Progress
  const { scrollYProgress } = useScroll();

  // Hero Section Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroWatermarkY = useTransform(
    heroScroll,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["0%", "28%"]
  );
  const heroVisualY = useTransform(
    heroScroll,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["0%", "14%"]
  );
  const heroContentOpacity = useTransform(
    heroScroll,
    [0, 0.85],
    [1, 0.25]
  );

  // Section 2 Progressive Flow Line Height
  const { scrollYProgress: stagesScroll } = useScroll({
    target: workflowRef,
    offset: ["start 70%", "end 80%"],
  });
  const flowLineHeight = useTransform(
    stagesScroll,
    [0, 1],
    shouldReduceMotion ? ["100%", "100%"] : ["0%", "100%"]
  );

  // Load authenticated user info for actor headers & header chip
  useEffect(() => {
    if (!user) {
      void dispatch(getUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      setSimanrisActorHeaders({
        id: user.id ?? null,
        name: user.name ?? null,
        email: user.email ?? null,
      });
    }
  }, [user]);

  // Fetch live overview and master options
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, masterData] = await Promise.all([
        simanrisApi.getOverview({}),
        simanrisApi.getMasterOptions().catch(() => null),
      ]);
      setOverview(ovData);
      if (masterData) setMasterOptions(masterData);
    } catch (err) {
      console.error("Gagal memuat data ringkasan SIMANRIS:", err);
      setError("Gagal menyinkronkan data ringkasan real-time dari server SIMANRIS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const userDisplayName = user?.name || user?.email || "Pengguna Terotentikasi";

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#004281] selection:text-white overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* =========================================================================
          TOP SCROLL PROGRESS INDICATOR
      ========================================================================= */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#004281] via-[#005baa] to-[#38bdf8] z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* =========================================================================
          TOP NAVBAR (Crisp Light Theme Glass)
      ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all shadow-2xs">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Emblem */}
          <Link
            href="/simanris"
            className="group flex items-center gap-3 transition-opacity hover:opacity-95"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 border border-slate-200/90 shadow-2xs group-hover:border-[#004281]/40 transition-colors">
              <Image
                src="/assets/images/bpom_without_label.webp"
                alt="Logo BBPOM di Mataram"
                width={34}
                height={34}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#004281] font-['Montserrat',sans-serif]">
                  SIMANRIS
                </span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-[#004281] border border-blue-200/70 uppercase tracking-wider font-['Montserrat',sans-serif]">
                  BBPOM Mataram
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                Risk Management Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-600">
            <a
              href="#beranda"
              className="text-[#004281] font-bold hover:text-[#005baa] transition-colors"
            >
              Beranda
            </a>
            <a
              href="#alur"
              className="hover:text-[#004281] transition-colors"
            >
              Cara Kerja
            </a>
            <a
              href="#ringkasan"
              className="hover:text-[#004281] transition-colors"
            >
              Live Data
            </a>
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <span>Portal Percepat</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </nav>

          {/* Right Area: User Chip & CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100/90 border border-slate-200 px-3 py-1.5 text-xs text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-[#004281]" />
              <span className="max-w-[130px] lg:max-w-[180px] truncate font-medium text-slate-800">
                {userDisplayName}
              </span>
            </div>

            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            >
              <Link
                href="/simanris/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004281] to-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#004281]/25 hover:shadow-lg hover:shadow-[#004281]/35 transition-all font-['Montserrat',sans-serif]"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Masuk Dashboard</span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/simanris/dashboard"
              className="rounded-lg bg-[#004281] px-3 py-1.5 text-xs font-bold text-white font-['Montserrat',sans-serif]"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Buka menu navigasi"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-slate-200 bg-white px-4 py-3 md:hidden space-y-2 text-xs"
            >
              <a
                href="#beranda"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50"
              >
                Beranda
              </a>
              <a
                href="#alur"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50"
              >
                Cara Kerja
              </a>
              <a
                href="#ringkasan"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50"
              >
                Live Data
              </a>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 truncate">{userDisplayName}</span>
                <Link
                  href="/simanris/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-bold text-[#004281] font-['Montserrat',sans-serif]"
                >
                  Buka Dashboard →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* =========================================================================
            SECTION 1 — BERANDA / HERO (BRIGHT, MODERN, NON-BUREAUCRATIC)
        ========================================================================= */}
        <section
          id="beranda"
          ref={heroRef}
          className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 border-b border-slate-200/80 bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/60 to-white"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,66,129,0.08)_0%,rgba(248,250,252,0)_70%)] blur-3xl" />

          {/* Parallax Background Typography Watermark */}
          <motion.div
            aria-hidden="true"
            style={{ y: heroWatermarkY }}
            className="pointer-events-none select-none absolute left-1/2 top-[10%] -translate-x-1/2 w-full text-center overflow-hidden z-0"
          >
            <span className="block text-[16vw] font-black tracking-[-0.05em] leading-none text-slate-900/[0.03] uppercase font-['Montserrat',sans-serif]">
              SIMANRIS
            </span>
          </motion.div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-center">
              {/* Left Column: Punchy Headline & Value Prop */}
              <motion.div
                style={{ opacity: heroContentOpacity }}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: EASE_SNAPPY }}
                className="lg:col-span-7 space-y-6"
              >
                {/* Modern Pill Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold tracking-wide text-[#004281] font-['Montserrat',sans-serif] shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004281] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004281]" />
                  </span>
                  <span>BBPOM DI MATARAM // RISK PLATFORM</span>
                </div>

                {/* Primary Headline in Montserrat */}
                <div className="space-y-1">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-5xl leading-[1.12] font-['Montserrat',sans-serif]">
                    Kelola & Kendalikan <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004281] via-[#005baa] to-[#0284c7]">
                      Risiko Organisasi
                    </span>{" "}
                    Lebih Cepat.
                  </h1>
                </div>

                {/* Clear, Human Description in Plus Jakarta Sans */}
                <p className="max-w-xl text-base text-slate-600 sm:text-lg leading-relaxed font-normal">
                  Satu sistem untuk mengidentifikasi masalah, kalkulasi matriks 5×5 secara otomatis,
                  uji mitigasi dengan data dukung nyata, dan pantau penurunan risiko tanpa proses berbelit-belit.
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3.5 sm:gap-4">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Link
                      href="/simanris/dashboard"
                      className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#004281] to-[#005baa] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all font-['Montserrat',sans-serif]"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <a
                      href="#alur"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 font-['Montserrat',sans-serif]"
                    >
                      <span>Lihat Cara Kerja</span>
                      <ArrowDown className="w-4 h-4 text-slate-400" />
                    </a>
                  </motion.div>
                </div>

                {/* Micro Key Feature Badges */}
                <div className="pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#004281] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 font-['Montserrat',sans-serif]">Standar SAPA APIP</div>
                      <div className="text-slate-500 text-[11px]">Format Workbook Terverifikasi</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#004281] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 font-['Montserrat',sans-serif]">Matriks 5 × 5 Otomatis</div>
                      <div className="text-slate-500 text-[11px]">Filter Risiko Tinggi (Skor ≥ 16)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ClipboardCheck className="w-4 h-4 text-[#004281] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 font-['Montserrat',sans-serif]">Bukti & Jejak Rekam</div>
                      <div className="text-slate-500 text-[11px]">Tautan & Unggah Berkas Nyata</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Si Inges Mascot with Futuristic Risk Telemetry & Chart Assets */}
              <motion.div
                style={{ y: heroVisualY }}
                initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.15, ease: EASE_SNAPPY }}
                className="lg:col-span-5 relative flex items-center justify-center min-h-[460px] sm:min-h-[520px]"
              >
                {/* Ambient Lighting Halo */}
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] rounded-full bg-[radial-gradient(circle,rgba(0,66,129,0.12)_0%,transparent_70%)] blur-2xl z-0" />

                {/* Concentric Orbit / Radar Rings (Subtle, Clean Light Theme) */}
                <svg
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] text-[#004281]/15 z-0"
                  viewBox="0 0 400 400"
                  fill="none"
                >
                  <circle cx="200" cy="200" r="185" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
                  <circle cx="200" cy="200" r="135" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
                  <circle cx="200" cy="200" r="85" stroke="currentColor" strokeWidth="1" opacity="0.35" />
                  <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="0.8" opacity="0.25" strokeDasharray="3 3" />
                  <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.8" opacity="0.25" strokeDasharray="3 3" />
                </svg>

                {/* Subtle Holographic Mini-Chart Asset behind her tablet */}
                <div className="pointer-events-none absolute right-4 sm:right-8 top-16 z-0 opacity-80">
                  <svg className="w-36 h-20 text-[#004281]/40" viewBox="0 0 140 80" fill="none">
                    <path
                      d="M10 65 L40 45 L75 55 L105 25 L135 35"
                      stroke="#005baa"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 65 L40 45 L75 55 L105 25 L135 35 L135 80 L10 80 Z"
                      fill="url(#ingesChartGradLight)"
                      opacity="0.15"
                    />
                    <circle cx="105" cy="25" r="3.5" fill="#005baa" />
                    <defs>
                      <linearGradient id="ingesChartGradLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#005baa" />
                        <stop offset="100%" stopColor="#004281" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Floating Telemetry Badge 1: Risiko Inheren Tinggi (Top Left) */}
                <motion.div
                  animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-2 sm:left-2 top-10 z-20 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-white/95 px-3.5 py-2 shadow-xl backdrop-blur-md"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                  </span>
                  <div className="text-left font-['Montserrat',sans-serif]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Prioritas Tinggi
                    </div>
                    <div className="text-xs font-black text-rose-600">
                      {overview ? <AnimatedNumber value={overview.inherent_high} /> : 41} Risiko (≥ 16)
                    </div>
                  </div>
                </motion.div>

                {/* Floating Telemetry Badge 2: Dataset Aktif (Bottom Right) */}
                <motion.div
                  animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  className="absolute -right-2 sm:right-2 bottom-16 z-20 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-white/95 px-3.5 py-2 shadow-xl backdrop-blur-md"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#004281]">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left font-['Montserrat',sans-serif]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      SAPA APIP 2026
                    </div>
                    <div className="text-xs font-black text-[#004281]">
                      {overview?.period?.period_name || "Semester II"} // Live
                    </div>
                  </div>
                </motion.div>

                {/* Floating Badge 3: 5 Unit Kerja (Bottom Left) */}
                <motion.div
                  animate={shouldReduceMotion ? {} : { y: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  className="absolute left-2 sm:left-6 bottom-4 z-20 hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md text-[11px] font-['Montserrat',sans-serif]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-800 font-bold">5 Unit Kerja</span>
                  <span className="text-slate-500">100% Aktif</span>
                </motion.div>

                {/* Si Inges Character Render */}
                <motion.div
                  animate={shouldReduceMotion ? {} : { y: [-6, 6, -6] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <Image
                    src="/assets/images/agent-inges.png"
                    alt="Mascot Si Inges BBPOM di Mataram"
                    width={396}
                    height={942}
                    priority
                    className="w-auto h-[380px] sm:h-[450px] lg:h-[490px] object-contain drop-shadow-[0_20px_40px_rgba(0,66,129,0.2)] select-none pointer-events-none"
                  />
                  {/* Pedestal Shadow under sandals */}
                  <div className="w-48 sm:w-56 h-4 rounded-full bg-gradient-to-r from-transparent via-[#004281]/15 to-transparent blur-md -mt-2 z-0" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2 — CARA KERJA SIMANRIS (CONNECTED VERTICAL FLOW - LIGHT THEME)
        ========================================================================= */}
        <section
          id="alur"
          ref={workflowRef}
          className="relative py-24 sm:py-32 bg-white border-b border-slate-200/80"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute top-1/3 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,66,129,0.05)_0%,transparent_70%)] blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Tag & Heading */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE_SNAPPY }}
              className="max-w-3xl space-y-3 mb-16 lg:mb-24"
            >
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#004281] font-['Montserrat',sans-serif]">
                <span>[ 02 // CARA KERJA SIMANRIS ]</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight font-['Montserrat',sans-serif]">
                Empat Langkah Sederhana: Dari Pemetaan Sampai Aksi
              </h2>
              <p className="text-base text-slate-600 sm:text-lg leading-relaxed">
                Bukan sekadar formalitas dokumen. SIMANRIS memastikan setiap risiko tertangani
                dengan bukti autentik dan dapat dipertanggungjawabkan kapan pun dibutuhkan.
              </p>
            </motion.div>

            {/* Vertically Connected Flow Architecture */}
            <div className="relative">
              {/* Central/Left Connecting Spine */}
              <div className="hidden lg:block absolute left-8 top-6 bottom-6 w-[2px] bg-slate-200">
                <motion.div
                  style={{ height: flowLineHeight }}
                  className="w-full bg-gradient-to-b from-[#004281] via-[#005baa] to-[#38bdf8] shadow-[0_0_8px_rgba(0,91,170,0.4)]"
                />
              </div>

              {/* Sequential Stages List */}
              <div className="space-y-10 lg:space-y-14">
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const IconComponent = stage.icon;
                  return (
                    <motion.div
                      key={stage.num}
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.6, delay: idx * 0.1, ease: EASE_SNAPPY }}
                      className="relative lg:pl-24"
                    >
                      {/* Node Bullet on Spine (Desktop Only) */}
                      <div className="hidden lg:flex absolute left-4.5 top-8 -translate-x-1/2 h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-[#004281] text-[11px] font-bold text-[#004281] shadow-md z-10 font-['Montserrat',sans-serif]">
                        {stage.num}
                      </div>

                      {/* Editorial Card Surface in Crisp Light Theme */}
                      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-8 hover:bg-white hover:border-[#004281]/40 hover:shadow-xl transition-all duration-300 shadow-sm group">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                          <div className="space-y-3 max-w-3xl">
                            {/* Tag & Stat Header */}
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#004281] font-['Montserrat',sans-serif]">
                                TAHAP {stage.num} // {stage.tag}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span className="text-xs font-semibold text-slate-500">
                                {stage.statHighlight}
                              </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#004281] transition-colors font-['Montserrat',sans-serif]">
                              {stage.title}
                            </h3>

                            <p className="text-xs sm:text-sm font-medium text-[#005baa]">
                              {stage.subtitle}
                            </p>

                            <p className="text-sm text-slate-600 leading-relaxed pt-1">
                              {stage.desc}
                            </p>

                            {/* Metadata Badges */}
                            <div className="pt-3 flex flex-wrap gap-2">
                              {stage.pills.map((pill) => (
                                <span
                                  key={pill}
                                  className="rounded-lg bg-white border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs font-['Montserrat',sans-serif]"
                                >
                                  {pill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Stage Icon Container */}
                          <div className="shrink-0 flex items-center lg:flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-[#004281] shadow-inner group-hover:bg-[#004281] group-hover:text-white transition-colors">
                              <IconComponent className="w-6 h-6" />
                            </div>

                            <span className="text-3xl font-black text-slate-300 font-['Montserrat',sans-serif] group-hover:text-blue-200 transition-colors mt-2">
                              {stage.num}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3 — DATA SUMMARY / LIVE RISK ENGINE (LIGHT THEME)
        ========================================================================= */}
        <section
          id="ringkasan"
          className="relative py-24 sm:py-32 bg-slate-50/70 border-b border-slate-200/80"
        >
          {/* Ambient Lighting Gradient */}
          <div className="pointer-events-none absolute bottom-10 left-10 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,66,129,0.06)_0%,transparent_70%)] blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header Data Summary */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE_SNAPPY }}
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#004281] font-['Montserrat',sans-serif]">
                  <span>[ 03 // LIVE DATA ENGINE ]</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl font-['Montserrat',sans-serif]">
                  Data Riil Manajemen Risiko Hari Ini
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Angka aktual yang tersinkronisasi otomatis dengan workbook SAPA APIP terpublikasi
                  di database internal SIMANRIS BBPOM di Mataram.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs font-['Montserrat',sans-serif]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Segarkan Data</span>
                </button>

                <Link
                  href="/simanris/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004281] to-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#004281]/20 hover:shadow-lg font-['Montserrat',sans-serif]"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka Dashboard</span>
                </Link>
              </div>
            </motion.div>

            {/* Error Banner if API fails */}
            {error && (
              <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-rose-900 font-['Montserrat',sans-serif]">Koneksi API SIMANRIS Terkendala</div>
                  <div>{error} Silakan klik tombol 'Segarkan Data' untuk mencoba ulang.</div>
                </div>
                <button
                  type="button"
                  onClick={fetchData}
                  className="font-bold underline text-rose-900 ml-2"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Asymmetrical Metric Composition in Crisp Light Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Primary Large Typographic Metric (60% Desktop) */}
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE_SNAPPY }}
                className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="font-bold tracking-wider uppercase text-[#004281] font-['Montserrat',sans-serif]">
                      TOTAL PERISTIWA RISIKO TERDAFTAR
                    </span>
                    <FileText className="w-4 h-4 text-[#004281]" />
                  </div>

                  {loading ? (
                    <div className="h-20 w-48 animate-pulse rounded bg-slate-100 my-2" />
                  ) : (
                    <div className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 font-['Montserrat',sans-serif] leading-none my-2">
                      <AnimatedNumber value={overview?.total_records ?? 0} />
                    </div>
                  )}

                  <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
                    Peristiwa risiko aktif dari kompilasi seluruh unit kerja yang tercatat pada
                    workbook manajemen risiko BBPOM di Mataram.
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="truncate max-w-[280px]">
                    File: {overview?.batch?.file_name || "Workbook Semester 2"}
                  </span>
                  <span className="text-[#004281] font-bold flex items-center gap-1.5 font-['Montserrat',sans-serif]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Terverifikasi di Database</span>
                  </span>
                </div>
              </motion.div>

              {/* Supporting Metrics Column (40% Desktop) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Metric Card 2: Risiko Inheren Tinggi */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1, ease: EASE_SNAPPY }}
                  className="rounded-2xl border border-rose-200 bg-white p-6 shadow-md hover:border-rose-400 transition-colors flex-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-rose-600 uppercase tracking-wider font-['Montserrat',sans-serif]">
                        Risiko Inheren Tinggi (≥ 16)
                      </span>
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    </div>

                    {loading ? (
                      <div className="h-10 w-24 animate-pulse rounded bg-slate-100 my-1" />
                    ) : (
                      <div className="text-4xl sm:text-5xl font-black text-rose-600 font-['Montserrat',sans-serif] tracking-tight">
                        <AnimatedNumber value={overview?.inherent_high ?? 0} />
                      </div>
                    )}

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      Risiko prioritas utama yang wajib menjalani pengujian efektivitas pengendalian
                      serta dilengkapi dokumen pendukung.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Wajib Uji Petik</span>
                    <Link
                      href="/simanris/entry-pengujian"
                      className="font-bold text-[#004281] hover:text-[#005baa] flex items-center gap-1 font-['Montserrat',sans-serif]"
                    >
                      <span>Uji Pengendalian</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>

                {/* Metric Card 3: Fungsi & Periode */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2, ease: EASE_SNAPPY }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md hover:border-[#004281]/40 transition-colors flex-1 flex flex-col justify-between"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 font-['Montserrat',sans-serif]">
                        Unit Kerja
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-slate-900 font-['Montserrat',sans-serif]">
                        <AnimatedNumber
                          value={overview?.functions_count || masterOptions?.functions?.length || 5}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        TU, Pem, Pen, Peng, Inf
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 font-['Montserrat',sans-serif]">
                        Periode Aktif
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-[#004281] tracking-tight truncate font-['Montserrat',sans-serif]">
                        {overview?.period?.period_name || "2026 — S2"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Tahun Anggaran 2026
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Kompilasi Seluruh Fungsi</span>
                    <span className="text-[#004281] font-bold font-['Montserrat',sans-serif]">100% Terpetakan</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Seamless Transition Action Bar into Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE_SNAPPY }}
              className="mt-8 rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
            >
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 font-['Montserrat',sans-serif]">
                  Siap mengeksplorasi matriks risiko dan visualisasi sebaran?
                </div>
                <p className="text-xs text-slate-600">
                  Akses matriks heatmap 5×5, grafik tren risiko residual, perbandingan kategori, dan daftar register lengkap.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/simanris/data-risiko"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-['Montserrat',sans-serif]"
                >
                  Daftar Risiko Lengkap
                </Link>
                <Link
                  href="/simanris/dashboard"
                  className="rounded-xl bg-gradient-to-r from-[#004281] to-[#005baa] px-5 py-2.5 text-xs font-bold text-white hover:shadow-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#004281]/25 font-['Montserrat',sans-serif]"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka Dashboard Operasional</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          INSTITUTIONAL FOOTER (Grounding Dark Contrast / Slate 900)
      ========================================================================= */}
      <footer className="border-t border-slate-800 bg-[#0F172A] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
            {/* Identity Column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 border border-white/10 shadow-sm">
                  <Image
                    src="/assets/images/bpom_without_label.webp"
                    alt="Logo BBPOM di Mataram"
                    width={36}
                    height={36}
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div>
                  <div className="text-base font-extrabold tracking-tight text-white leading-tight font-['Montserrat',sans-serif]">
                    SIMANRIS
                  </div>
                  <div className="text-[11px] text-blue-300 font-['Montserrat',sans-serif]">
                    Sistem Informasi Manajemen Risiko
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                Sistem informasi internal Balai Besar Pengawas Obat dan Makanan di Mataram untuk
                penyelenggaraan manajemen risiko terintegrasi, transparan, dan akuntabel guna mendukung
                pengawasan obat dan makanan yang optimal di Provinsi Nusa Tenggara Barat.
              </p>

              <div className="pt-2 text-[11px] text-slate-400">
                Bagian dari Ekosistem Layanan Terpadu <span className="font-bold text-white font-['Montserrat',sans-serif]">PERCEPAT</span>
              </div>
            </div>

            {/* Address & Contact Column */}
            <div className="md:col-span-4 space-y-3 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300 font-['Montserrat',sans-serif]">
                Kantor & Kontak Resmi
              </div>
              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    Jl. Cendrawasih No. 8, Karang Taliwang, Kec. Cakranegara, Kota Mataram, Nusa Tenggara Barat 83239
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>(0370) 621926</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>bpom_mataram@pom.go.id</span>
                </div>
              </div>
            </div>

            {/* Navigation Fast Links */}
            <div className="md:col-span-3 space-y-3 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300 font-['Montserrat',sans-serif]">
                Navigasi SIMANRIS
              </div>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link
                    href="/simanris/dashboard"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                    <span>Dashboard Operasional</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/simanris/data-excel"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                    <span>Data Excel & Riwayat</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/simanris/data-risiko"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                    <span>Daftar Seluruh Risiko</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/simanris/entry-pengujian"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                    <span>Entry Data Pengujian</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                    <span>Kembali ke Portal Percepat</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © 2026 Balai Besar Pengawas Obat dan Makanan di Mataram. Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-['Montserrat',sans-serif]">
              <span>SIMANRIS v2.4</span>
              <span>•</span>
              <span>SAPA APIP Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
