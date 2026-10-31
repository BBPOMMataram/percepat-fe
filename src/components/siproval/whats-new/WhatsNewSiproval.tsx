"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUser } from "@/features/authSlice";

const plusJakartaSans = {
  className: "font-['Plus_Jakarta_Sans',sans-serif]",
};

interface ComparisonAspect {
  category: string;
  title: string;
  v1: {
    badge: string;
    description: string;
  };
  v2: {
    badge: string;
    description: string;
  };
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

  const comparisonData: ComparisonAspect[] = [
    {
      category: "Arsitektur & Operasional",
      title: "Model Operasional & Penyimpanan Data",
      v1: {
        badge: "Kumpulan Link Eksternal",
        description:
          "Hanya berupa portal kumpulan tautan (links) ke Google Spreadsheet eksternal. Pengguna harus membuka banyak lembar spreadsheet di tab peramban terpisah untuk melihat atau mengedit data.",
      },
      v2: {
        badge: "Full By System (Mandiri)",
        description:
          "Seluruh proses berjalan terintegrasi penuh by system di dalam aplikasi SIPROVAL. Data disimpan otonom di database lokal berkecepatan tinggi tanpa perlu membuka berkas spreadsheet luar.",
      },
    },
    {
      category: "Antarmuka & Pengalaman Pengguna",
      title: "Desain Antarmuka (UI/UX)",
      v1: {
        badge: "UI Tautan Statis",
        description:
          "Halaman web statis sederhana yang hanya menyajikan tombol link keluar. Format data, estetika, dan tata letak tabel bergantung sepenuhnya pada tampilan Google Sheets bawaan.",
      },
      v2: {
        badge: "Modern, Responsif & Terpadu",
        description:
          "Antarmuka modern (Plus Jakarta Sans) yang terpadu dan responsif, dilengkapi kolom beku (sticky columns), filter pencarian instan, visualisasi grafik, dan hierarki visual yang jelas.",
      },
    },
    {
      category: "Pengisian Kinerja Katim",
      title: "Entry & Pengendalian Data RHPK",
      v1: {
        badge: "Manual di Spreadsheet",
        description:
          "Ketua Tim (Katim) harus mencari dokumen dan mengisi langsung pada sheet Google Spreadsheet. Risiko formula terhapus, sel tidak sengaja bergeser, atau tab salah edit sangat tinggi.",
      },
      v2: {
        badge: "By System & Formula Terproteksi",
        description:
          "Form dan tabel data interaktif langsung di dalam sistem. Formula terkunci aman, terdapat penanda warna kolom hak akses yang tegas, dan otomatisasi kolom target serta bulan berjalan.",
      },
    },
    {
      category: "Keamanan & Pengendalian",
      title: "Enkapsulasi Hak Akses (Role-Based Access)",
      v1: {
        badge: "Akses Terbuka Bersama",
        description:
          "Tautan dokumen spreadsheet bersifat global per berkas. Seluruh Katim dan staf memiliki akses pandang ke seluruh lembar kerja tanpa isolasi hak akses per indikator yang ketat.",
      },
      v2: {
        badge: "Terenkapsulasi Sesuai Peran",
        description:
          "Terenkapsulasi ketat sesuai akun login: Katim hanya dapat melihat dan mengedit IKSK yang diampunya saja. Dropdown dokumen otomatis terkunci jika hanya terdapat 1 dokumen acuan.",
      },
    },
    {
      category: "Monitoring Pimpinan",
      title: "Dashboard Eksekutif Kepala Balai",
      v1: {
        badge: "Terpisah & Manual",
        description:
          "Pimpinan harus membuka berkas spreadsheet satu per satu secara manual. Belum ada ringkasan eksekutif atau grafik terpadu untuk pemantauan cepat capaian balai.",
      },
      v2: {
        badge: "Dashboard Terpadu By System",
        description:
          "Dashboard eksekutif lengkap by system: grafik tren target vs realisasi RO dari TU, rekapitulasi capaian indikator, inspeksi rincian IKSK belum tercapai, dan form arahan langsung pimpinan.",
      },
    },
    {
      category: "Penganggaran Tata Usaha",
      title: "Budget Mapping & Realisasi RO",
      v1: {
        badge: "Spreadsheet Terpisah",
        description:
          "Pagu program, budget mapping, dan realisasi anggaran dikelola pada file spreadsheet terpisah melalui link eksternal yang rentan desinkronisasi data antar seksi.",
      },
      v2: {
        badge: "Otomatis & Terintegrasi",
        description:
          "Dikelola langsung by system: fitur manajemen file per tahun, kalkulasi total target dan realisasi per IKSK berdasarkan pagu program secara otomatis, serta grafik real-time.",
      },
    },
    {
      category: "Pelaporan & Evaluasi",
      title: "Penyusunan Berita Acara Evaluasi Internal",
      v1: {
        badge: "Kompilasi Manual",
        description:
          "Data capaian volume RO, realisasi anggaran, kendala, dan RTL harus dikompilasi dan diketik ulang secara manual dari berbagai tab spreadsheet triwulanan.",
      },
      v2: {
        badge: "Otomasi Generator 1-Klik",
        description:
          "Penarikan otomatis data triwulan per indikator (bulan akhir Maret, Juni, September, Desember) lengkap dengan generator ekspor 1-klik ke format resmi PDF, Word (.doc), dan Excel (.xls).",
      },
    },
    {
      category: "Keandalan & Kecepatan",
      title: "Kecepatan Respon & Kuota Akses (API Quota)",
      v1: {
        badge: "Batas 60 Req/Menit API",
        description:
          "Bergantung pada koneksi dan kuota Google Sheets API (60 req/menit). Sering mengalami jeda, batasan kuota (rate-limit), atau freeze saat jam sibuk entry bersamaan.",
      },
      v2: {
        badge: "Cepat < 50ms & Tanpa Kuota",
        description:
          "Bebas batasan kuota pihak ketiga dengan respon kueri database lokal mandiri di bawah 50 ms. Mendukung multi-user entry bersamaan dengan stabilitas tinggi.",
      },
    },
    {
      category: "Akuntabilitas Pelaporan",
      title: "Integritas Dokumen & Jejak Waktu (Audit Trail)",
      v1: {
        badge: "Tanpa Penguncian Otomatis",
        description:
          "Dokumen pelaporan dapat teredit sewaktu-waktu tanpa jejak verifikasi, dan tanggal serta jam unggah berkas pelaporan resmi tidak terekam otomatis di sistem.",
      },
      v2: {
        badge: "Read-Only & Timestamp WITA",
        description:
          "Tabel Realisasi RO terkunci otomatis (Read-Only) untuk melindungi data pelaporan resmi, disertai pencatatan stempel waktu unggah (WITA) otomatis yang akuntabel.",
      },
    },
  ];

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
                className="rounded-lg bg-[#003d73] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#00284d] transition shadow-xs"
              >
                Masuk ke Sistem
              </Link>
            ) : (
              <Link
                href="/login?redirectUrl=/siproval"
                className="rounded-lg bg-[#003d73] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#00284d] transition shadow-xs"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION (Clean & Direct)
      ====================================================================== */}
      <section className="bg-white border-b border-slate-200 pt-12 pb-10 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full mb-4">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Catatan Rilis &bull; Komparasi Pembaruan Sistem
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Perbandingan SIPROVAL Versi 1.0 vs Versi 2.0
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Ikhtisar komprehensif transformasi sistem dari <strong>SIPROVAL Versi 1.0</strong> yang berbasis kumpulan tautan Google Spreadsheet eksternal menjadi <strong>SIPROVAL Versi 2.0</strong> yang sepenuhnya terintegrasi secara mandiri <em>by system</em> dengan antarmuka modern.
          </p>

          {/* Quick Version Reference Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            {/* V1 Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">
                  SIPROVAL Versi 1.0
                </span>
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  Versi Lama
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Kumpulan tautan (links) untuk membuka Google Spreadsheet eksternal.
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Tautan Sistem:</span>
                <a
                  href="https://siproval.bbpommataram.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>siproval.bbpommataram.id</span>
                  <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* V2 Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 transition-all hover:border-blue-300">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#003d73]">
                  SIPROVAL Versi 2.0
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Sistem Saat Ini &bull; By System
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Semua modul berjalan langsung <em>by system</em> dengan antarmuka terintegrasi.
              </p>
              <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Tautan Sistem:</span>
                <Link
                  href="/siproval"
                  className="font-semibold text-[#003d73] hover:text-[#00284d] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>bbpommataram.id/siproval</span>
                  <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          DETAILED COMPARISON TABLE
      ====================================================================== */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Matriks Perbandingan Fitur & Aspek Sistem
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rincian perbandingan teknis, alur operasional, dan pengalaman pengguna antar versi.
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
            {comparisonData.length} Aspek Pembaruan
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
                  <th className="py-4 px-5 w-1/4 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Aspek Pembaruan
                  </th>
                  <th className="py-4 px-5 w-[37.5%] border-l border-slate-200 bg-slate-50/50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          SIPROVAL Versi 1.0
                        </span>
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          Lama
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Kumpulan Link Google Spreadsheet
                      </span>
                      <a
                        href="https://siproval.bbpommataram.id/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>https://siproval.bbpommataram.id/</span>
                        <svg className="size-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </th>
                  <th className="py-4 px-5 w-[37.5%] border-l border-slate-200 bg-blue-50/30">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#003d73] text-sm">
                          SIPROVAL Versi 2.0
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Baru &bull; By System
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-normal">
                        Sistem Terintegrasi Penuh
                      </span>
                      <Link
                        href="/siproval"
                        className="text-[11px] font-semibold text-[#003d73] hover:text-[#00284d] hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>https://bbpommataram.id/siproval</span>
                        <svg className="size-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {comparisonData.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Aspect Column */}
                    <td className="py-4 px-5 align-top">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {item.category}
                      </span>
                      <p className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                        {item.title}
                      </p>
                    </td>

                    {/* V1 Column */}
                    <td className="py-4 px-5 align-top border-l border-slate-100 bg-slate-50/20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                          {item.v1.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.v1.description}
                      </p>
                    </td>

                    {/* V2 Column */}
                    <td className="py-4 px-5 align-top border-l border-slate-100 bg-blue-50/15">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                          {item.v2.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {item.v2.description}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CTA SECTION (Simple Clean Banner)
      ====================================================================== */}
      <section className="bg-slate-900 text-white py-12 px-6 sm:px-10 lg:px-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full mb-3">
            SIPROVAL Versi 2.0
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Mulai Gunakan Sistem Terpadu SIPROVAL
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Akses ruang kerja untuk pemantauan indikator balai, pengisian capaian RHPK, pengelolaan dokumen realisasi RO, dan evaluasi kinerja secara otomatis.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={workspaceUrl}
              className="rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition shadow-sm"
            >
              Masuk ke Ruang Kerja
            </Link>

            <Link
              href="/siproval"
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Kembali ke Beranda
            </Link>

            <a
              href="https://siproval.bbpommataram.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-700/60 bg-transparent px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-600 transition inline-flex items-center gap-1.5"
            >
              <span>Buka Arsip V.1</span>
              <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
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
