"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUser } from "@/features/authSlice";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

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
    (user as any)?.role === "superadmin" ||
    (user as any)?.email === "hilmi.khairan@pom.go.id" ||
    ((user as any)?.role === "admin" &&
      Array.isArray((user as any)?.sites) &&
      (user as any).sites.some(
        (s: { id?: number; name?: string }) =>
          Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval")
      ));

  const isBasukiKatim =
    (user as any)?.sub === "019ab8b3-4a06-7007-8337-2794c43cea4f" ||
    String((user as any)?.email || "").toLowerCase() === "al.el.dul79@gmail.com" ||
    String((user as any)?.name || "").toLowerCase().trim() === "basuki murdi hartono";

  const groupJabatanId = isBasukiKatim
    ? 3
    : (user as any)?.group_jabatan_id !== undefined && (user as any)?.group_jabatan_id !== null
    ? Number((user as any).group_jabatan_id)
    : null;

  let workspaceUrl = "/login?redirectUrl=/siproval";
  if (user) {
    if (isSuperadmin) workspaceUrl = "/siproval/tu";
    else if (groupJabatanId === 1) workspaceUrl = "/siproval/catatan";
    else if (groupJabatanId === 2) workspaceUrl = "/siproval/tu";
    else workspaceUrl = "/siproval/katim";
  }

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "Semua Pembaruan" },
    { id: "performa", label: "Performa & Database" },
    { id: "kabalai", label: "Dashboard Pimpinan" },
    { id: "katim", label: "Entry RHPK Katim" },
    { id: "tu", label: "Evaluasi & Berita Acara" },
    { id: "design", label: "Antarmuka & Desain" },
  ];

  const featureCards: FeatureCard[] = [
    {
      id: "performa-database",
      category: "performa",
      categoryLabel: "Arsitektur Data",
      versionBadge: "Inovasi Inti",
      title: "Database Mandiri RHPK: Kecepatan Respon Tanpa Batasan Kuota API",
      summary:
        "Seluruh ekosistem data RHPK berjalan secara otonom di database lokal SIPROVAL. Menghilangkan kendala batas kuota API Google Sheets, mencegah freeze saat jam sibuk entry, dan meningkatkan stabilitas sistem.",
      highlights: [
        "Waktu respon query di bawah 50 milidetik",
        "Dukungan multi-user entry secara bersamaan",
        "Skema penyimpanan data lokal terstruktur",
        "Mekanisme pencadangan dan pemulihan data instan",
      ],
      roleTarget: "Semua Pengguna",
      visualType: "architecture",
    },
    {
      id: "kabalai-dashboard",
      category: "kabalai",
      categoryLabel: "Kepemimpinan & Evaluasi",
      versionBadge: "Fitur Pimpinan",
      title: "Dashboard Eksekutif Kepala Balai dengan Integrasi Grafik & Arahan Terpusat",
      summary:
        "Pemantauan komprehensif yang mengintegrasikan grafik target-realisasi Tata Usaha, rekapitulasi capaian indikator kinerja, serta inspeksi rincian IKSK yang belum tercapai dalam satu halaman.",
      highlights: [
        "Grafik tren target vs realisasi RO terintegrasi dari TU",
        "Interaksi klik kartu KPI untuk rincian IKSK belum tercapai",
        "Form pemberian arahan pimpinan langsung ke baris data",
        "Tinjauan komprehensif tanpa membuka banyak berkas spreadsheet",
      ],
      roleTarget: "Kepala Balai",
      visualType: "kabalai_dash",
    },
    {
      id: "katim-encapsulation",
      category: "katim",
      categoryLabel: "Entry & Hak Akses",
      versionBadge: "Pembaruan Alur Kerja",
      title: "Enkapsulasi IKSK Katim & Seleksi Dokumen Otomatis",
      summary:
        "Ketua Tim (Katim) kini terlindungi dengan enkapsulasi data: hanya dokumen dan IKSK yang diampunya saja yang ditampilkan. Dropdown dokumen otomatis terkunci jika hanya terdapat satu dokumen acuan.",
      highlights: [
        "Penyaringan otomatis dokumen sesuai IKSK binaan",
        "Pemilihan dokumen cerdas (nonaktif jika hanya 1 dokumen)",
        "Penanda kolom hak akses yang tegas dan mudah dibaca",
        "Otomasi kolom 12 bulan pada tab tanpa konfigurasi manual",
      ],
      roleTarget: "Ketua Tim & PIC",
      visualType: "katim_entry",
    },
    {
      id: "tu-laporan-evaluasi",
      category: "tu",
      categoryLabel: "Pelaporan Evaluasi",
      versionBadge: "Generator Dokumen",
      title: "Penyusunan Berita Acara Evaluasi Internal Triwulan Terpadu",
      summary:
        "Generator Berita Acara terpadu untuk Tata Usaha yang menyatukan Capaian Volume RO, Realisasi Anggaran, Matriks Rekomendasi, Kendala, RTL, serta Manajemen Risiko dalam format resmi siap cetak.",
      highlights: [
        "Ekspor terpadu ke format PDF resmi, Word (.doc), dan Excel (.xls)",
        "Pengaturan Cover resmi dengan penomoran dokumen otomatis",
        "Dukungan lampiran dinamis berkas PDF dan foto dokumentasi",
        "Manajemen berkas lampiran dengan pratinjau langsung",
      ],
      roleTarget: "Subbagian Tata Usaha",
      visualType: "tu_report",
    },
    {
      id: "ro-official-lock",
      category: "tu",
      categoryLabel: "Validasi & Audit",
      versionBadge: "Integritas Data",
      title: "Penguncian Dokumen Resmi & Audit Trail Waktu Unggah Realisasi RO",
      summary:
        "Berkas Realisasi RO yang diunggah Tata Usaha diperlakukan sebagai dokumen pelaporan resmi. Tabel dikunci dari pengeditan tidak disengaja dan waktu unggah dicatat secara akurat ke dalam sistem.",
      highlights: [
        "Mode baca terkunci (Read-Only) untuk keperluan pelaporan resmi",
        "Pencatatan tanggal dan jam unggah berkas (WITA) otomatis",
        "Label status dokumen resmi pada tabel dan kartu tahun",
        "Pemisahan data operasional harian dengan arsip pelaporan",
      ],
      roleTarget: "Tata Usaha & Tim Evaluasi",
      visualType: "ro_lock",
    },
    {
      id: "design-system-v2",
      category: "design",
      categoryLabel: "Antarmuka Pengguna",
      versionBadge: "Pembaruan Desain",
      title: "Antarmuka Bersih BBPOM dengan Kolom Beku (Sticky Columns)",
      summary:
        "SIPROVAL V.2 menerapkan tipografi Plus Jakarta Sans yang jernih, palet warna institusional yang tenang, dan kolom beku (sticky headers & columns) pada tabel data besar agar membaca data tetap presisi.",
      highlights: [
        "Kolom beku pada tabel RO & RHPK (Kode, Nama, Target tetap terlihat)",
        "Tipografi Plus Jakarta Sans yang nyaman untuk tabel numerik",
        "Struktur kartu ringkas dengan hierarki visual terarah",
        "Akses peran cepat melalui navigasi atas",
      ],
      roleTarget: "Seluruh Pengguna",
      visualType: "design_system",
    },
  ];

  const filteredCards =
    activeCategory === "all"
      ? featureCards
      : featureCards.filter((card) => card.category === activeCategory);

  return (
    <div
      className={`${plusJakartaSans.className} min-h-screen bg-slate-50/50 text-slate-800 selection:bg-slate-800 selection:text-white antialiased`}
    >
      {/* =====================================================================
          TOP HEADER
      ====================================================================== */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 sm:px-10 lg:px-16 py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/siproval"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <div className="h-8 w-8 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-200">
                <Image
                  src="/assets/images/bpom.webp"
                  alt="Logo BBPOM"
                  width={30}
                  height={30}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold tracking-tight text-slate-900 leading-none">
                  SIPROVAL
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  BBPOM di Mataram
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-3.5 w-px bg-slate-200 mx-1" />

            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Pembaruan Versi 2.0
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/siproval"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded transition"
            >
              Kembali ke Beranda
            </Link>

            {user ? (
              <Link
                href={workspaceUrl}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Masuk ke Sistem
              </Link>
            ) : (
              <Link
                href="/login?redirectUrl=/siproval"
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION (Simple & Clean)
      ====================================================================== */}
      <section className="bg-white border-b border-slate-200 pt-12 pb-10 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full mb-4">
            Catatan Rilis Resmi &bull; Oktober 2026
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Pembaruan Sistem SIPROVAL 2.0
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Ringkasan pembaruan arsitektur database lokal mandiri, integrasi dashboard
            eksekutif Kepala Balai, enkapsulasi hak akses Ketua Tim, dan otomasi
            penyusunan Berita Acara Evaluasi di Balai Besar POM di Mataram.
          </p>

          {/* Simple Metrics Strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto text-left">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Kecepatan Respon
              </span>
              <p className="mt-0.5 text-base font-bold text-slate-900">&lt; 50 ms</p>
              <p className="text-[11px] text-slate-500">Database lokal mandiri</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Akses Katim
              </span>
              <p className="mt-0.5 text-base font-bold text-slate-900">Terenkapsulasi</p>
              <p className="text-[11px] text-slate-500">Fokus IKSK yang diampu</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Dashboard Pimpinan
              </span>
              <p className="mt-0.5 text-base font-bold text-slate-900">Terpadu</p>
              <p className="text-[11px] text-slate-500">Grafik RO & rincian arahan</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Berita Acara
              </span>
              <p className="mt-0.5 text-base font-bold text-slate-900">Otomatis</p>
              <p className="text-[11px] text-slate-500">Ekspor PDF, Word & Excel</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FILTER TABS SECTION (Clean Text Pills)
      ====================================================================== */}
      <section className="sticky top-[53px] z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-10 lg:px-16 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-slate-400 shrink-0 hidden md:inline">
            {filteredCards.length} fitur
          </span>
        </div>
      </section>

      {/* =====================================================================
          FEATURE CARDS GRID (Simple & Clear)
      ====================================================================== */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div>
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {card.categoryLabel}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {card.versionBadge}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {card.title}
                  </h2>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {card.summary}
                  </p>

                  {/* Minimalist HTML UI Structure Preview */}
                  <div className="my-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
                    {card.visualType === "architecture" && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-[11px]">
                          <span className="font-semibold text-slate-700">
                            Komparasi Keandalan Arsitektur
                          </span>
                          <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                            Lokal Mandiri
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded border border-slate-200 bg-white p-2">
                            <p className="font-medium text-slate-500">Versi 1.0 (Lama)</p>
                            <p className="text-slate-600 mt-0.5">Batas 60 req/menit API</p>
                          </div>
                          <div className="rounded border border-emerald-200 bg-emerald-50/50 p-2">
                            <p className="font-semibold text-emerald-800">Versi 2.0 (Baru)</p>
                            <p className="text-emerald-700 mt-0.5">Responsif &lt; 50ms</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {card.visualType === "kabalai_dash" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">
                            Ringkasan Capaian Indikator Balai
                          </span>
                          <span className="font-semibold text-slate-900">82.4% Tercapai</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-800" style={{ width: "82.4%" }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span>28 IKSK Tercapai</span>
                          <span className="font-medium text-slate-700">6 Perlu Evaluasi</span>
                        </div>
                      </div>
                    )}

                    {card.visualType === "katim_entry" && (
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                          <span className="text-slate-500">Penyaringan Akses:</span>
                          <span className="font-semibold text-slate-800">IKSK Binaan Katim</span>
                        </div>
                        <div className="rounded bg-white p-2 border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-700 truncate max-w-[200px]">
                            1. Persentase Sampel Berisiko...
                          </span>
                          <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            Dapat Diedit
                          </span>
                        </div>
                      </div>
                    )}

                    {card.visualType === "tu_report" && (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-slate-600 font-medium">
                          <span>Format Berita Acara Triwulan</span>
                          <span className="text-slate-900 font-semibold">4 Bagian Resmi</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-center text-[10px] text-slate-600">
                          <div className="rounded bg-white p-1.5 border border-slate-200">Cover</div>
                          <div className="rounded bg-white p-1.5 border border-slate-200">Volume RO</div>
                          <div className="rounded bg-white p-1.5 border border-slate-200">Anggaran</div>
                          <div className="rounded bg-white p-1.5 border border-slate-200 font-medium">Matriks</div>
                        </div>
                      </div>
                    )}

                    {card.visualType === "ro_lock" && (
                      <div className="flex items-center justify-between text-[11px]">
                        <div>
                          <p className="font-semibold text-slate-800">Dokumen Realisasi RO</p>
                          <p className="text-[10px] text-slate-500">Status: Read-Only (Terkunci)</p>
                        </div>
                        <div className="rounded bg-white border border-slate-200 px-2.5 py-1 text-right">
                          <p className="text-[9px] uppercase font-medium text-slate-400">Tercatat</p>
                          <p className="text-[10px] font-semibold text-slate-700">WITA &bull; Resmi</p>
                        </div>
                      </div>
                    )}

                    {card.visualType === "design_system" && (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span>Tipografi & Tata Letak Tabel</span>
                          <span className="text-slate-500 text-[10px]">Kolom Terkunci</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                          <div className="rounded bg-slate-900 text-white p-1">Plus Jakarta Sans</div>
                          <div className="rounded bg-slate-100 border border-slate-200 text-slate-700 p-1">Sticky Columns</div>
                          <div className="rounded bg-slate-100 border border-slate-200 text-slate-700 p-1">Kontras Seimbang</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Highlights List */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rincian Pembaruan
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {card.highlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold shrink-0">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Sasaran: <strong className="text-slate-700 font-semibold">{card.roleTarget}</strong>
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
                    Versi 2.0
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* =====================================================================
          COMPARISON TABLE (Clean & Minimal)
      ====================================================================== */}
      <section className="bg-white border-y border-slate-200 py-12 px-6 sm:px-10 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-left mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Perbandingan Kemampuan SIPROVAL V.1 dan V.2
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ikhtisar peningkatan teknis dan operasional antar versi sistem.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-3 px-4 w-1/3">Aspek</th>
                    <th className="py-3 px-4 text-slate-500 w-1/3">SIPROVAL Versi 1.0</th>
                    <th className="py-3 px-4 text-slate-900 bg-slate-100/60 font-bold w-1/3">
                      SIPROVAL Versi 2.0
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Penyimpanan & Kecepatan Data
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Tergantung Google Sheets API (kuota 60 req/menit)
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 bg-slate-50/50">
                      Database lokal mandiri, query cepat &lt; 50ms tanpa kuota
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Hak Akses & Lingkup Katim
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Seluruh daftar berkas sheet terbuka
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 bg-slate-50/50">
                      Terenkapsulasi ketat sesuai IKSK binaan Ketua Tim
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Dashboard Kepala Balai
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Terpisah dan belum terintegrasi grafik TU
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 bg-slate-50/50">
                      Dashboard terpadu dengan grafik RO, capaian, dan form arahan
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Berita Acara Evaluasi
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Penyusunan matriks kendala dan anggaran terpisah
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 bg-slate-50/50">
                      Ekspor otomatis 1-klik (RO, Anggaran, Cover, dan Lampiran)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Integritas Dokumen Realisasi RO
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Dapat teredit tanpa jejak waktu unggah resmi
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 bg-slate-50/50">
                      Terkunci otomatis (Read-Only) dan timestamp unggah tercatat
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Tata Letak Tabel Besar
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Header dan kolom identitas bergeser saat di-scroll
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 bg-slate-50/50">
                      Sticky Columns (Kode, Nama, dan Target terkunci di kiri)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CTA SECTION (Simple Clean Banner)
      ====================================================================== */}
      <section className="bg-slate-900 text-white py-12 px-6 sm:px-10 lg:px-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Akses Ruang Kerja SIPROVAL 2.0
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Masuk ke sistem untuk memulai pemantauan berkas, entry capaian kinerja,
            dan evaluasi program kerja terpadu.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={workspaceUrl}
              className="rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              Masuk ke Ruang Kerja
            </Link>

            <Link
              href="/siproval"
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER
      ====================================================================== */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 sm:px-10 lg:px-16 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/images/bpom.webp"
              alt="Logo BBPOM"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className="font-semibold text-slate-700">
              SIPROVAL &bull; Balai Besar Pengawas Obat dan Makanan di Mataram
            </span>
          </div>

          <p>&copy; {new Date().getFullYear()} BBPOM di Mataram.</p>
        </div>
      </footer>
    </div>
  );
}
