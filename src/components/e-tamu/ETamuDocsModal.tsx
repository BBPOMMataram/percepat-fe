/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface ETamuDocsModalProps {
    activeModal: "release-note" | "handbook" | null;
    onClose: () => void;
    onSwitchModal: (modal: "release-note" | "handbook") => void;
}

interface ScreenshotSlotProps {
    src: string;
    alt: string;
    caption: string;
}

function ScreenshotSlot({ src, alt, caption }: ScreenshotSlotProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return null;
    }

    return (
        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
            <img
                src={src}
                alt={alt}
                onError={() => setHasError(true)}
                className="w-full max-h-[360px] object-contain bg-slate-900/5"
            />
            <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 font-medium">
                {caption}
            </div>
        </div>
    );
}

export default function ETamuDocsModal({
    activeModal,
    onClose,
    onSwitchModal,
}: ETamuDocsModalProps) {
    const [handbookTab, setHandbookTab] = useState<"user" | "admin">("user");

    if (!activeModal) return null;

    const comparisonRows = [
        {
            aspect: "Arsitektur Sistem",
            v1: "Monolitik Laravel Blade, setiap aksi (simpan/filter) memuat ulang (reload) halaman penuh.",
            v2: "Single Page Application (Next.js) terintegrasi portal SI MANDALIKA + Laravel REST API tanpa reload halaman.",
        },
        {
            aspect: "Autentikasi Admin",
            v1: "Login terpisah menggunakan tabel user lokal E-Tamu.",
            v2: "Terintegrasi dengan Single Sign-On (SSO) Auth-BPOM (Admin modul E-Tamu & Superadmin).",
        },
        {
            aspect: "Validasi Lokasi (Geofencing)",
            v1: "Hanya menghitung jarak di browser (Leaflet.js) tanpa memblokir form atau validasi ulang di server.",
            v2: "Double-Layer Geofencing (Radius ≤ 50m): Pengecekan akurasi GPS rekursif di browser + validasi ulang rumus Haversine di server.",
        },
        {
            aspect: "Kamera Swafoto (Selfie)",
            v1: "Menggunakan webcam.min.js (320×240px), rasio gambar sering terdistorsi pada layar HP portrait.",
            v2: "Native WebRTC + HTML5 Canvas dengan auto aspect-ratio cropping (object-cover hingga 640px), efek mirror, & pilih kamera.",
        },
        {
            aspect: "Formulir & Autofill Tamu",
            v1: "Tampilan gradien lama; autofill hanya berjalan saat keluar dari kolom nama (onchange).",
            v2: "Desain modern & responsif; Autofill Real-Time saat mengetik nama (> 2 huruf) dilengkapi notifikasi toast.",
        },
        {
            aspect: "Survei Kepuasan Layanan",
            v1: "Mengirim form survei dengan redirect/reload halaman penuh.",
            v2: "Popup Modal Interaktif (Tidak Puas, Puas, Sangat Puas) secara instan tanpa reload halaman.",
        },
        {
            aspect: "Grafik Statistik Tahunan",
            v1: "Grafik hanya mengikuti 1 filter tahun/bulan aktif; tidak dapat membandingkan antar tahun.",
            v2: "Grafik Batang Perbandingan Multi-Tahun dengan Checkbox Dropdown (batang tiap keperluan tampil bersebelahan antar tahun).",
        },
        {
            aspect: "Tabel & Foto Tamu (Admin)",
            v1: "Paginasi me-reload halaman; foto tampil besar dan tidak seragam di dalam baris tabel.",
            v2: "Server-side pagination cepat, thumbnail avatar rapi dengan Popup Zoom Foto, serta Download Excel (.xlsx) sesuai filter.",
        },
    ];

    const commitHistory = [
        {
            date: "29 Sep 2026",
            code: "056e636 / eb62da6",
            desc: "Migrasi antarmuka Buku Tamu & Dashboard E-Tamu ke Next.js dalam ekosistem SI MANDALIKA.",
        },
        {
            date: "01 Okt 2026",
            code: "cdefd63",
            desc: "Pembuatan REST API E-Tamu (initDataApi, storeApi dengan validasi jarak Haversine, storeSurveyApi, & getDashboardApi).",
        },
        {
            date: "05 Okt 2026",
            code: "6b2cc69 / 02b609a",
            desc: "Konfigurasi CORS frontend-backend dan otomatisasi CI/CD deployment dengan GitHub Actions.",
        },
        {
            date: "12 Okt 2026",
            code: "8a3fcb1",
            desc: "Penyempurnaan proporsi kamera swafoto WebRTC, geofencing rekursif, serta pemisahan halaman khusus Admin (/admin/e-tamu).",
        },
        {
            date: "14 Okt 2026",
            code: "fab936b / 8e4c603",
            desc: "Penambahan fitur Export Excel (.xlsx) sesuai filter, server-side pagination, dan Popup Zoom Foto Tamu.",
        },
        {
            date: "29 Okt 2026",
            code: "466aaa1 / d110046",
            desc: "Penambahan fitur perbandingan multi-tahun berdampingan per keperluan pada grafik batang dengan Checkbox Dropdown Tahun.",
        },
    ];

    return (
        <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-6 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="bg-[#1e293b] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                            <span className="material-symbols-outlined text-[22px]">
                                {activeModal === "release-note" ? "new_releases" : "menu_book"}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold tracking-wide">
                                    {activeModal === "release-note"
                                        ? "Release Note — E-Tamu v2.0"
                                        : "Handbook / Buku Panduan — E-Tamu v2.0"}
                                </h2>
                                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                    v2.0
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">
                                Balai Besar Pengawas Obat dan Makanan di Mataram
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => onSwitchModal("release-note")}
                                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    activeModal === "release-note"
                                        ? "bg-emerald-600 text-white"
                                        : "text-slate-300 hover:text-white"
                                }`}
                            >
                                Release Note
                            </button>
                            <button
                                type="button"
                                onClick={() => onSwitchModal("handbook")}
                                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    activeModal === "handbook"
                                        ? "bg-emerald-600 text-white"
                                        : "text-slate-300 hover:text-white"
                                }`}
                            >
                                Handbook
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Tutup"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body Modal */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
                    {activeModal === "release-note" ? (
                        <>
                            {/* Ringkasan Eksekutif */}
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                    <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px] text-emerald-600">
                                            verified
                                        </span>
                                        Transformasi E-Tamu v1.0 ke E-Tamu v2.0
                                    </h3>
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                        Periode: 22 Sep – 29 Okt 2026
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <strong>E-Tamu v2.0</strong> merupakan pembaruan menyeluruh dari versi monolitik (v1.0) ke arsitektur modern berbasis <strong>Next.js & Laravel REST API</strong> yang terintegrasi penuh dalam portal <strong>SI MANDALIKA</strong>. Pembaruan ini meningkatkan kecepatan akses tanpa reload halaman, keamanan validasi lokasi GPS berlapis (<em>Double-Layer Geofencing</em>), kualitas swafoto kamera WebRTC, serta fitur perbandingan statistik multi-tahun pada Dashboard Admin.
                                </p>
                            </div>

                            {/* Tabel Perbandingan v1 vs v2 */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-sky-600">
                                        compare_arrows
                                    </span>
                                    Perbandingan Fitur E-Tamu v1.0 vs E-Tamu v2.0
                                </h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                <th className="p-3.5 w-1/4">Aspek / Fitur</th>
                                                <th className="p-3.5 w-[37.5%] text-slate-500">E-Tamu v1.0 (Lama)</th>
                                                <th className="p-3.5 w-[37.5%] text-emerald-700">E-Tamu v2.0 (Baru)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {comparisonRows.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/80">
                                                    <td className="p-3.5 font-bold text-slate-800 align-top">
                                                        {row.aspect}
                                                    </td>
                                                    <td className="p-3.5 text-slate-500 align-top leading-relaxed">
                                                        {row.v1}
                                                    </td>
                                                    <td className="p-3.5 text-slate-800 font-medium align-top leading-relaxed bg-emerald-50/20">
                                                        {row.v2}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Log Commit Pembaruan */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-sky-600">
                                        history
                                    </span>
                                    Riwayat Pembaruan (Sejak 22 September 2026)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {commitHistory.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col gap-1"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-800">{item.date}</span>
                                                <code className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                                                    {item.code}
                                                </code>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                                {item.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Pilihan Tab Handbook: Sisi Pengunjung (User) vs Sisi Admin */}
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setHandbookTab("user")}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        handbookTab === "user"
                                            ? "bg-white text-emerald-700 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                    Panduan Pengunjung (User)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHandbookTab("admin")}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        handbookTab === "admin"
                                            ? "bg-white text-sky-700 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        admin_panel_settings
                                    </span>
                                    Panduan Admin
                                </button>
                            </div>

                            {handbookTab === "user" ? (
                                <div className="space-y-4">
                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                                1
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                Akses Lokasi (GPS) & Informasi Keselamatan K3
                                            </h4>
                                        </div>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-1">
                                            <li>
                                                Buka halaman <strong>E-Tamu</strong> dan klik <strong>Izinkan (Allow)</strong> saat browser meminta akses lokasi GPS. Pengisian buku tamu hanya dapat dilakukan di area kantor BBPOM di Mataram (radius maksimal <strong>50 meter</strong>).
                                            </li>
                                            <li>
                                                Perhatikan informasi <strong>Prosedur Evakuasi Keadaan Darurat (K3)</strong> yang muncul di layar, lalu klik tombol <strong>Tutup (×)</strong> untuk melanjutkan.
                                            </li>
                                        </ul>
                                        <ScreenshotSlot
                                            src="/assets/images/e-tamu-handbook/01-popup-evakuasi.png"
                                            alt="Popup Prosedur Evakuasi K3"
                                            caption="Gambar 1.1 — Popup Prosedur Evakuasi Keadaan Darurat (K3)"
                                        />
                                        <ScreenshotSlot
                                            src="/assets/images/e-tamu-handbook/02-validasi-lokasi.png"
                                            alt="Validasi Lokasi GPS"
                                            caption="Gambar 1.2 — Validasi Izin Lokasi & Radius Kehadiran"
                                        />
                                    </div>

                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                                2
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                Mengambil Swafoto (Selfie) Pengunjung
                                            </h4>
                                        </div>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-1">
                                            <li>
                                                Pada kartu <strong>Swafoto Pengunjung</strong> di sebelah kiri, pilih perangkat kamera melalui dropdown <strong>Pilih Sumber Kamera</strong>.
                                            </li>
                                            <li>
                                                Posisikan wajah tepat di dalam bingkai kamera dan klik tombol <strong>Ambil Foto</strong>.
                                            </li>
                                            <li>
                                                Apabila foto kurang jelas, klik tombol <strong>Foto Ulang</strong> untuk mengambil ulang gambar.
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                                3
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                Mengisi Formulir Data Diri & Autofill Riwayat Tamu
                                            </h4>
                                        </div>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-1">
                                            <li>
                                                Pilih <strong>Layanan / Unit Tujuan</strong> sesuai keperluan kunjungan (jika memilih <em>Lainnya</em>, isi kolom rincian keperluan & pejabat yang dituju).
                                            </li>
                                            <li>
                                                Ketik <strong>Nama Lengkap Tamu</strong>. Jika Anda pernah berkunjung sebelumnya, pilih nama Anda dari daftar saran agar <strong>Nomor HP, Email, Instansi, dan Alamat</strong> terisi otomatis (<em>Autofill</em>).
                                            </li>
                                            <li>
                                                Periksa kembali kelengkapan data, lalu klik tombol <strong>SIMPAN</strong>.
                                            </li>
                                        </ul>
                                        <ScreenshotSlot
                                            src="/assets/images/e-tamu-handbook/03-form-buku-tamu.png"
                                            alt="Formulir Buku Tamu dan Swafoto"
                                            caption="Gambar 1.3 — Halaman Utama Buku Tamu (Swafoto & Formulir Data Diri)"
                                        />
                                    </div>

                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                                4
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                Mengisi Survei Kepuasan Pelayanan
                                            </h4>
                                        </div>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-1">
                                            <li>
                                                Setelah data tersimpan, akan muncul popup penilaian pelayanan.
                                            </li>
                                            <li>
                                                Pilih salah satu tingkat kepuasan (<strong>Tidak Puas</strong>, <strong>Puas</strong>, atau <strong>Sangat Puas</strong>) lalu klik <strong>Kirim Penilaian Pelayanan</strong>.
                                            </li>
                                        </ul>
                                        <ScreenshotSlot
                                            src="/assets/images/e-tamu-handbook/04-popup-survey.png"
                                            alt="Popup Survei Kepuasan"
                                            caption="Gambar 1.4 — Popup Survei Kepuasan Pelayanan"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                                                1
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                Ringkasan Kunjungan & Filter Periode (Tahun / Bulan)
                                            </h4>
                                        </div>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-1">
                                            <li>
                                                Buka halaman Admin E-Tamu (<code>/admin/e-tamu</code>) menggunakan akun Admin E-Tamu atau Superadmin.
                                            </li>
                                            <li>
                                                Kartu <strong>Tamu Hari Ini</strong> menampilkan jumlah tamu yang hadir pada hari berjalan, sedangkan badge <strong>Total Tamu</strong> dan 8 kartu <strong>Total Tamu Berdasarkan Keperluan</strong> menampilkan jumlah tamu sesuai filter <strong>Tahun</strong> dan <strong>Bulan</strong> yang dipilih.
                                            </li>
                                        </ul>
                                        <ScreenshotSlot
                                            src="/assets/images/e-tamu-handbook/05-admin-dashboard-atas.png"
                                            alt="Dashboard Admin Bagian Atas"
                                            caption="Gambar 2.1 — Ringkasan Tamu Hari Ini, Filter Periode, dan Statistik per Keperluan"
                                        />
                                    </div>

                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                                                2
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                Grafik Batang & Perbandingan Multi-Tahun
                                            </h4>
                                        </div>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-1">
                                            <li>
                                                Secara bawaan, bagian <strong>Statistik Tamu Per Tahun</strong> menampilkan grafik batang untuk <strong>tahun berjalan</strong>.
                                            </li>
                                            <li>
                                                Untuk membandingkan dengan tahun lain, klik dropdown <strong>Tahun: ...</strong> di pojok kanan atas grafik, lalu centang tahun yang ingin dibandingkan (atau centang <strong>Semua Tahun</strong>).
                                            </li>
                                            <li>
                                                Batang grafik untuk setiap keperluan layanan akan otomatis ditampilkan <strong>berdampingan</strong> antar tahun yang dipilih.
                                            </li>
                                            <li>
                                                Klik tombol <strong>Download Gambar Bagan</strong> untuk mengunduh grafik dalam format gambar (<code>.png</code>).
                                            </li>
                                        </ul>
                                        <ScreenshotSlot
                                            src="/assets/images/e-tamu-handbook/06-admin-grafik-perbandingan.png"
                                            alt="Grafik Batang Perbandingan Tahun"
                                            caption="Gambar 2.2 — Grafik Batang Statistik Tamu & Dropdown Perbandingan Tahun"
                                        />
                                    </div>

                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                                                3
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                Tabel Data Tamu, Zoom Foto & Unduh Laporan Excel
                                            </h4>
                                        </div>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-1">
                                            <li>
                                                Klik tombol <strong>Download xlsx</strong> di bagian atas tabel untuk mengunduh rekap data tamu dalam format Excel sesuai filter Tahun & Bulan yang aktif.
                                            </li>
                                            <li>
                                                Klik foto profil tamu pada kolom <strong>Foto</strong> untuk memperbesar swafoto tamu melalui <strong>Popup Zoom Gambar</strong>.
                                            </li>
                                            <li>
                                                Gunakan tombol navigasi halaman (<strong>Sebelumnya / Selanjutnya</strong>) di bagian bawah tabel untuk melihat halaman data berikutnya.
                                            </li>
                                        </ul>
                                        <ScreenshotSlot
                                            src="/assets/images/e-tamu-handbook/07-admin-tabel-dan-zoom.png"
                                            alt="Tabel Data Tamu dan Zoom Foto"
                                            caption="Gambar 2.3 — Tabel Data Tamu, Unduh Excel, dan Popup Zoom Foto"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                        E-Tamu v2.0 • SI MANDALIKA BBPOM di Mataram
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

