"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import { RootState } from "@/redux/store";

type CategoryFilter =
  | "all"
  | "performa"
  | "kabalai"
  | "katim"
  | "tu"
  | "design";

interface FeatureCard {
  id: string;
  category: "performa" | "kabalai" | "katim" | "tu" | "design";
  categoryLabel: string;
  categoryColor: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
  };
  versionBadge: string;
  title: string;
  summary: string;
  highlights: string[];
  roleTarget: string;
  visualType: "architecture" | "kabalai_dash" | "katim_entry" | "tu_report" | "ro_lock" | "design_system";
}

export default function WhatsNewSiproval() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  const isSuperadmin =
    user?.role === "superadmin" ||
    user?.email === "hilmi.khairan@pom.go.id" ||
    (user?.role === "admin" &&
      Array.isArray(user?.sites) &&
      user.sites.some(
        (s: { id?: number; name?: string }) =>
          Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval")
      ));

  const isBasukiKatim =
    user?.sub === "019ab8b3-4a06-7007-8337-2794c43cea4f" ||
    String(user?.email || "").toLowerCase() === "al.el.dul79@gmail.com" ||
    String(user?.name || "").toLowerCase().trim() === "basuki murdi hartono";

  const groupJabatanId = isBasukiKatim
    ? 3
    : user?.group_jabatan_id !== undefined && user?.group_jabatan_id !== null
    ? Number(user.group_jabatan_id)
    : null;

  let workspaceUrl = "/login?redirectUrl=/siproval";
  if (user) {
    if (isSuperadmin) workspaceUrl = "/siproval/tu";
    else if (groupJabatanId === 1) workspaceUrl = "/siproval/catatan";
    else if (groupJabatanId === 2) workspaceUrl = "/siproval/tu";
    else workspaceUrl = "/siproval/katim";
  }
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const categories: { id: CategoryFilter; label: string; icon: string }[] = [
    { id: "all", label: "Semua Pembaruan", icon: "solar:widget-5-bold" },
    { id: "performa", label: "⚡ Performa & Database", icon: "solar:bolt-bold" },
    { id: "kabalai", label: "📊 Dashboard Pimpinan", icon: "solar:chart-2-bold" },
    { id: "katim", label: "🎯 Entry RHPK Katim", icon: "solar:pen-new-square-bold" },
    { id: "tu", label: "📑 Evaluasi & Berita Acara", icon: "solar:printer-bold" },
    { id: "design", label: "🎨 UI/UX & Design System", icon: "solar:palette-bold" },
  ];

  const featureCards: FeatureCard[] = [
    {
      id: "performa-database",
      category: "performa",
      categoryLabel: "Arsitektur & Performa Data",
      categoryColor: {
        bg: "bg-blue-50/70",
        text: "text-[#005baa]",
        border: "border-blue-200",
        badgeBg: "bg-blue-100/80 text-[#003d73]",
      },
      versionBadge: "Inovasi Inti V.2",
      title: "Database Mandiri RHPK: Kecepatan Kilat Tanpa Batasan Kuota API Google",
      summary:
        "Seluruh ekosistem data RHPK kini berjalan secara otonom di database lokal SIPROVAL. Tidak ada lagi hambatan error kuota Google Sheets API (60 req/min), proses freeze saat jam sibuk entry, atau kendala jaringan eksternal.",
      highlights: [
        "Waktu respon query di bawah 50 milidetik",
        "Dukungan multi-user entry bersamaan tanpa batas kuota",
        "Skema tabel lokal mandiri (local_rhpk_*) terstruktur",
        "Backup otomatis dan pemulihan data instan",
      ],
      roleTarget: "Semua Aktor Sistem",
      visualType: "architecture",
    },
    {
      id: "kabalai-dashboard",
      category: "kabalai",
      categoryLabel: "Kepemimpinan & Pengawasan",
      categoryColor: {
        bg: "bg-indigo-50/70",
        text: "text-indigo-700",
        border: "border-indigo-200",
        badgeBg: "bg-indigo-100/80 text-indigo-900",
      },
      versionBadge: "Fitur Unggulan V.2",
      title: "Dashboard Eksekutif Kepala Balai dengan Integrasi Grafik & Arahan Terpusat",
      summary:
        "Kepala Balai disajikan pemantauan 360 derajat yang menggabungkan grafik target realisasi Tata Usaha, rekapitulasi capaian indikator, hingga kemampuan interaktif untuk langsung menginspeksi rincian IKSK yang belum tercapai.",
      highlights: [
        "Grafik tren target vs realisasi RO terintegrasi langsung dari TU",
        "Interaksi klik kartu KPI untuk lompat ke rincian IKSK belum tercapai",
        "Form pemberian arahan pimpinan langsung tersimpan ke baris data indikator",
        "Tinjauan komprehensif tanpa perlu membuka puluhan tab spreadsheet",
      ],
      roleTarget: "Kepala Balai (Kabalai)",
      visualType: "kabalai_dash",
    },
    {
      id: "katim-encapsulation",
      category: "katim",
      categoryLabel: "Entry Data & Keamanan Akses",
      categoryColor: {
        bg: "bg-emerald-50/70",
        text: "text-emerald-700",
        border: "border-emerald-200",
        badgeBg: "bg-emerald-100/80 text-emerald-900",
      },
      versionBadge: "Pembaruan Akses V.2",
      title: "Enkapsulasi IKSK Katim & Seleksi Dokumen Cerdas",
      summary:
        "Ketua Tim (Katim) kini terlindungi dengan enkapsulasi data: hanya dokumen dan IKSK yang diampunya saja yang muncul. Jika satu IKSK hanya memiliki satu dokumen acuan, dropdown otomatis dimatikan sehingga alur kerja bebas dari kesalahan.",
      highlights: [
        "Penyaringan otomatis dokumen hanya untuk IKSK yang diampu Katim",
        "Smart Document Switcher: otomatis nonaktif jika hanya ada 1 dokumen",
        "Penanda kolom hak akses 'Editable' yang jelas dan kontras",
        "Dukungan auto-generate kolom & 12 bulan untuk tab tanpa konfigurasi",
      ],
      roleTarget: "Ketua Tim (Katim / PIC IKSK)",
      visualType: "katim_entry",
    },
    {
      id: "tu-laporan-evaluasi",
      category: "tu",
      categoryLabel: "Pelaporan Evaluasi Internal",
      categoryColor: {
        bg: "bg-amber-50/70",
        text: "text-amber-800",
        border: "border-amber-200",
        badgeBg: "bg-amber-100/80 text-amber-950",
      },
      versionBadge: "Generator Baru V.2",
      title: "Ekspor Berita Acara Evaluasi Internal Triwulan Terpadu",
      summary:
        "Tata Usaha kini memiliki generator Berita Acara terpadu yang menyatukan Bagian 1 (Volume RO & Realisasi Anggaran) dan Bagian 2 (Matriks Rekomendasi, Kendala, RTL, serta Manajemen Risiko) dalam satu format resmi siap cetak.",
      highlights: [
        "Ekspor 1-klik ke format PDF resmi, Word (.doc), dan Excel (.xls)",
        "Fitur unggah Cover resmi dengan pengaturan judul otomatis",
        "Lampiran dinamis terintegrasi yang mendukung berkas PDF dan foto/gambar",
        "Manajemen dan hapus berkas lampiran dengan pratinjau instan",
      ],
      roleTarget: "Subbagian Tata Usaha (TU)",
      visualType: "tu_report",
    },
    {
      id: "ro-official-lock",
      category: "tu",
      categoryLabel: "Integritas & Audit Data",
      categoryColor: {
        bg: "bg-teal-50/70",
        text: "text-teal-700",
        border: "border-teal-200",
        badgeBg: "bg-teal-100/80 text-teal-900",
      },
      versionBadge: "Standar Validasi V.2",
      title: "Penguncian Dokumen Resmi & Audit Trail Waktu Unggah Realisasi RO",
      summary:
        "Berkas Realisasi RO yang diunggah Tata Usaha diperlakukan sebagai dokumen final resmi. Tabel dikunci otomatis dari pengeditan tidak disengaja, serta tanggal dan waktu unggah dicatat secara akurat ke dalam sistem.",
      highlights: [
        "Mode baca terkunci resmi (Read-Only) untuk keperluan pelaporan evaluasi",
        "Pencatatan tanggal dan jam unggah berkas (WITA) otomatis di sistem",
        "Badge resmi 'Dokumen Resmi Terkunci' pada tabel dan kartu tahun",
        "Pemisahan alur input operasional dengan arsip data fix pelaporan",
      ],
      roleTarget: "Tata Usaha & Tim Evaluasi",
      visualType: "ro_lock",
    },
    {
      id: "design-system-v2",
      category: "design",
      categoryLabel: "Desain & Pengalaman Pengguna",
      categoryColor: {
        bg: "bg-violet-50/70",
        text: "text-violet-700",
        border: "border-violet-200",
        badgeBg: "bg-violet-100/80 text-violet-900",
      },
      versionBadge: "Desain Baru V.2",
      title: "Antarmuka Modern BBPOM dengan Frozen Sticky Columns",
      summary:
        "SIPROVAL V.2 mengadopsi Design System baru yang modern dengan palet resmi BBPOM Blue & Emerald Green. Dilengkapi kolom beku (sticky headers & columns) pada tabel besar agar membaca data tetap nyaman di layar mana pun.",
      highlights: [
        "Frozen columns pada tabel RO & RHPK (Kode RO, Nama RO, Target beku di kiri)",
        "Tipografi tajam dan nyaman dibaca berbasis Plus Jakarta Sans",
        "Animasi transisi halus dan responsif menggunakan Framer Motion",
        "Pilihan multi-peran (multi-role switcher) langsung dari navigasi atas",
      ],
      roleTarget: "Seluruh Pengguna SIPROVAL",
      visualType: "design_system",
    },
  ];

  const filteredCards =
    activeCategory === "all"
      ? featureCards
      : featureCards.filter((card) => card.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#fcfdff] text-[#001d3d] selection:bg-[#005baa] selection:text-white antialiased">
      {/* =====================================================================
          TOP STICKY NAVBAR (Minimal Google Chrome Style)
      ====================================================================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-6 sm:px-10 lg:px-16 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/siproval"
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200/70">
                <Image
                  src="/assets/images/bpom.webp"
                  alt="Logo BBPOM"
                  width={34}
                  height={34}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-extrabold tracking-tight text-[#001d3d]">
                  SIPROVAL
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  BBPOM di Mataram
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-slate-300 mx-1" />

            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-xs font-bold text-[#005baa]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#005baa] animate-pulse" />
              <span>What&apos;s New V.2</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/siproval"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#005baa] px-3 py-1.5 rounded-lg transition"
            >
              <Icon icon="solar:arrow-left-linear" width={16} />
              <span className="hidden sm:inline">Kembali ke Portal</span>
            </Link>

            {user ? (
              <Link
                href={workspaceUrl}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#004b8d] transition"
              >
                <span>Masuk ke Sistem</span>
                <Icon icon="solar:alt-arrow-right-linear" width={14} />
              </Link>
            ) : (
              <Link
                href="/login?redirectUrl=/siproval"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#004b8d] transition"
              >
                <span>Masuk</span>
                <Icon icon="solar:login-2-bold" width={14} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION (Google Chrome "See What's New" Inspired)
      ====================================================================== */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-12 px-6 sm:px-10 lg:px-16 border-b border-slate-100 bg-gradient-to-b from-blue-50/50 via-white to-white">
        {/* Soft Background Radial Blurs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-r from-blue-200/30 via-emerald-200/20 to-indigo-200/30 blur-3xl rounded-full"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200/90 bg-white px-3.5 py-1.5 shadow-2xs text-xs font-bold text-[#005baa] mb-5"
          >
            <Icon icon="solar:sparkles-bold" width={16} className="text-amber-500" />
            <span>Rilis Resmi &bull; SIPROVAL Versi 2.0 (Oktober 2026)</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.18]"
          >
            Yang Baru di{" "}
            <span className="bg-gradient-to-r from-[#003d73] via-[#005baa] to-[#00a651] bg-clip-text text-transparent">
              SIPROVAL 2.0
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Evolusi menyeluruh untuk meningkatkan keandalan monitoring program,
            evaluasi kinerja, dan pelaporan internal BBPOM di Mataram. Kini hadir
            dengan arsitektur database lokal mandiri berkecepatan tinggi, integrasi
            dashboard eksekutif, dan generator berita acara terpadu.
          </motion.p>

          {/* Quick Metrics Strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xs p-3.5 shadow-2xs text-left">
              <div className="flex items-center gap-1.5 text-[#005baa]">
                <Icon icon="solar:bolt-bold" width={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Kecepatan
                </span>
              </div>
              <p className="mt-1 text-lg font-extrabold text-slate-900">&lt; 50 ms</p>
              <p className="text-[11px] text-slate-500">Query lokal tanpa limit</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xs p-3.5 shadow-2xs text-left">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Icon icon="solar:shield-check-bold" width={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Akses Katim
                </span>
              </div>
              <p className="mt-1 text-lg font-extrabold text-slate-900">100% Aman</p>
              <p className="text-[11px] text-slate-500">IKSK binaan terenkapsulasi</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xs p-3.5 shadow-2xs text-left">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <Icon icon="solar:chart-2-bold" width={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pimpinan
                </span>
              </div>
              <p className="mt-1 text-lg font-extrabold text-slate-900">360&deg; Monev</p>
              <p className="text-[11px] text-slate-500">Grafik & rincian indikator</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xs p-3.5 shadow-2xs text-left">
              <div className="flex items-center gap-1.5 text-amber-600">
                <Icon icon="solar:printer-bold" width={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Berita Acara
                </span>
              </div>
              <p className="mt-1 text-lg font-extrabold text-slate-900">1-Klik</p>
              <p className="text-[11px] text-slate-500">Ekspor PDF, Cover & Lampiran</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          FILTER TABS SECTION (Google Chrome Horizontal Pill Bar)
      ====================================================================== */}
      <section className="sticky top-[57px] z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-10 lg:px-16 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#005baa] text-white shadow-xs scale-[1.02]"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  <Icon icon={cat.icon} width={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-slate-400 shrink-0 hidden md:inline">
            Menampilkan {filteredCards.length} Fitur Baru
          </span>
        </div>
      </section>

      {/* =====================================================================
          FEATURE CARDS GRID (Google Chrome See What's New Visual Cards)
      ====================================================================== */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
              >
                <div>
                  {/* Top Meta Pill Header */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${card.categoryColor.bg} ${card.categoryColor.text} ${card.categoryColor.border}`}
                    >
                      <span>{card.categoryLabel}</span>
                    </span>

                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {card.versionBadge}
                    </span>
                  </div>

                  {/* Card Title & Headline */}
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#005baa] transition-colors leading-snug">
                    {card.title}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {card.summary}
                  </p>

                  {/* PURE HTML/CSS VISUAL PREVIEW WIDGET (No Images Needed!) */}
                  <div className="my-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 overflow-hidden">
                    {card.visualType === "architecture" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Icon icon="solar:server-bold" width={15} className="text-[#005baa]" />
                            Infrastruktur SIPROVAL V.2
                          </span>
                          <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px]">
                            Aktif & Stabil
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-xl border border-red-200 bg-red-50/60 p-2.5">
                            <p className="font-bold text-red-800">Versi Lama (V.1)</p>
                            <p className="text-slate-500 mt-1">Google Sheets API Quota limit</p>
                            <p className="text-red-600 font-semibold mt-1">Rentan timeout</p>
                          </div>
                          <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-2.5">
                            <p className="font-bold text-emerald-800 flex items-center gap-1">
                              <Icon icon="solar:check-circle-bold" width={12} />
                              Versi 2.0 (Baru)
                            </p>
                            <p className="text-slate-600 mt-1">MySQL Dedicated Cache</p>
                            <p className="text-emerald-700 font-bold mt-1">&lt; 50ms tanpa limit</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {card.visualType === "kabalai_dash" && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Icon icon="solar:widget-5-bold" width={15} className="text-indigo-600" />
                            Ringkasan Capaian Indikator Balai
                          </span>
                          <span className="font-mono text-xs font-extrabold text-[#005baa]">
                            82.4% Tercapai
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#005baa] to-emerald-500"
                            style={{ width: "82.4%" }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                          <span>28 IKSK Tercapai</span>
                          <span className="text-amber-600 font-bold cursor-pointer hover:underline">
                            6 IKSK Perlu Evaluasi &rarr;
                          </span>
                        </div>
                      </div>
                    )}

                    {card.visualType === "katim_entry" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
                          <span className="font-bold text-slate-700">Enkapsulasi IKSK Terpilih:</span>
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            IKSK 1 (Katim Farmasi)
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 truncate max-w-[200px]">
                            1. Persentase Sampel Berisiko...
                          </span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Editable
                          </span>
                        </div>
                      </div>
                    )}

                    {card.visualType === "tu_report" && (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-700 font-bold">
                          <span>Struktur Berita Acara Triwulanan:</span>
                          <span className="text-[#005baa] text-[11px] font-bold">Lengkap 4 Bagian</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-semibold text-slate-600">
                          <div className="rounded-lg bg-white p-2 border border-slate-200 shadow-2xs">
                            Cover Resmi
                          </div>
                          <div className="rounded-lg bg-white p-2 border border-slate-200 shadow-2xs">
                            Volume RO
                          </div>
                          <div className="rounded-lg bg-white p-2 border border-slate-200 shadow-2xs">
                            Anggaran
                          </div>
                          <div className="rounded-lg bg-emerald-50 text-emerald-800 p-2 border border-emerald-200 font-bold shadow-2xs">
                            Matriks & Lampiran
                          </div>
                        </div>
                      </div>
                    )}

                    {card.visualType === "ro_lock" && (
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                            <Icon icon="solar:lock-bold" width={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Dokumen Fix Terkunci</p>
                            <p className="text-[10px] text-slate-500">Realisasi_RO_2026.xlsx</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-right">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Timestamp</p>
                          <p className="text-[11px] font-bold text-[#005baa]">26 Okt 2026 &bull; WITA</p>
                        </div>
                      </div>
                    )}

                    {card.visualType === "design_system" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>BBPOM Mataram Palette & Frozen Layout</span>
                          <span className="text-violet-700 text-[11px]">Sticky Columns</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-6 flex-1 rounded-md bg-[#003d73] text-white text-[10px] font-bold flex items-center justify-center">
                            Navy
                          </span>
                          <span className="h-6 flex-1 rounded-md bg-[#005baa] text-white text-[10px] font-bold flex items-center justify-center">
                            Blue
                          </span>
                          <span className="h-6 flex-1 rounded-md bg-[#00a651] text-white text-[10px] font-bold flex items-center justify-center">
                            Emerald
                          </span>
                          <span className="h-6 flex-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center border border-slate-300">
                            Clean Slate
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Keunggulan Fitur:
                    </p>
                    <ul className="space-y-1.5">
                      {card.highlights.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-600 leading-normal"
                        >
                          <Icon
                            icon="solar:check-circle-bold"
                            width={15}
                            className="text-[#00a651] shrink-0 mt-0.5"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Peruntukan:{" "}
                    <strong className="text-slate-700">{card.roleTarget}</strong>
                  </span>

                  <span className="font-bold text-[#005baa] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Pelajari Fitur &rarr;
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* =====================================================================
          COMPARISON TABLE SECTION (V.1 vs V.2)
      ====================================================================== */}
      <section className="bg-slate-50/80 border-y border-slate-200/80 py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#005baa]">
              Matriks Transformasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Perbandingan SIPROVAL V.1 vs V.2
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Lihat bagaimana pembaruan sistem memberikan peningkatan nyata pada
              kecepatan, keamanan, dan efisiensi kerja Anda.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Aspek Kemampuan</th>
                    <th className="py-3.5 px-5 text-slate-500">SIPROVAL V.1 (Lama)</th>
                    <th className="py-3.5 px-5 text-[#005baa] bg-blue-50/50 font-extrabold">
                      SIPROVAL V.2 (Terkini)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-bold text-slate-900">
                      Sumber & Kecepatan Data
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      Tergantung Google Sheets API, batas 60 request/menit
                    </td>
                    <td className="py-3 px-5 font-semibold text-emerald-700 bg-blue-50/20">
                      Database Mandiri Lokal, query cepat &lt; 50ms tanpa limit
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-bold text-slate-900">
                      Hak Akses & Enkapsulasi Katim
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      Melihat seluruh daftar sheet dokumen secara terbuka
                    </td>
                    <td className="py-3 px-5 font-semibold text-emerald-700 bg-blue-50/20">
                      Terenkapsulasi ketat sesuai IKSK yang diampu Katim
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-bold text-slate-900">
                      Dashboard Kepala Balai
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      Terpisah-pisah dan belum terintegrasi dengan grafik TU
                    </td>
                    <td className="py-3 px-5 font-semibold text-emerald-700 bg-blue-50/20">
                      Dashboard 360&deg; lengkap grafik RO, capaian, & arahan
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-bold text-slate-900">
                      Berita Acara Evaluasi Internal
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      Penyusunan matriks kendala & anggaran manual
                    </td>
                    <td className="py-3 px-5 font-semibold text-emerald-700 bg-blue-50/20">
                      1-Klik Generate Berita Acara (RO, Anggaran, Cover & Lampiran PDF)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-bold text-slate-900">
                      Integritas Dokumen Realisasi RO
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      Bisa teredit bebas tanpa rekaman audit unggah resmi
                    </td>
                    <td className="py-3 px-5 font-semibold text-emerald-700 bg-blue-50/20">
                      Terkunci otomatis (Read-Only) & timestamp unggah tercatat resmi
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-bold text-slate-900">
                      Desain Tabel & Navigasi
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      Header hilang saat di-scroll ke samping atau bawah
                    </td>
                    <td className="py-3 px-5 font-semibold text-emerald-700 bg-blue-50/20">
                      Sticky Frozen Columns (Kode RO, Nama RO, Target terkunci di kiri)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BOTTOM CALL TO ACTION (CTA)
      ====================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#00254d] via-[#003d73] to-[#005baa] text-white py-16 px-6 sm:px-10 lg:px-16 text-center">
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-blue-100 backdrop-blur-xs mb-4">
            <Icon icon="solar:star-circle-bold" width={16} />
            Mulai Pengalaman Baru
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Siap Mengoptimalkan Kinerja Anda di SIPROVAL 2.0?
          </h2>

          <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Masuk sekarang untuk merasakan kemudahan entry data kinerja,
            pemantauan dashboard real-time, dan pelaporan evaluasi otomatis.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={workspaceUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-[#001d3d] shadow-lg hover:bg-slate-100 transition duration-200"
            >
              <span>Buka Ruang Kerja SIPROVAL</span>
              <Icon icon="solar:arrow-right-linear" width={16} />
            </Link>

            <Link
              href="/siproval"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-xs px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition duration-200"
            >
              <span>Kembali ke Beranda Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER
      ====================================================================== */}
      <footer className="bg-[#001226] text-white py-8 px-6 sm:px-10 lg:px-16 text-xs text-blue-100/70 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/images/bpom.webp"
              alt="Logo BBPOM"
              width={22}
              height={22}
              className="object-contain"
            />
            <span className="font-bold text-white">
              SIPROVAL &bull; Balai Besar Pengawas Obat dan Makanan di Mataram
            </span>
          </div>

          <p>&copy; {new Date().getFullYear()} BBPOM di Mataram. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

