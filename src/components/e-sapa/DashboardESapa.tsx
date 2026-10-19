"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import dayjs from "@/utils/dayjs";
import api from "@/utils/axios";
import { RootState } from "@/redux/store";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function DashboardESapa() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [dashboardData, setDashboardData] = useState({
    countStToday: 0,
    countStThisMonth: 0,
    countPerjadinToday: 0,
    countPerjadinThisMonth: 0,
  });

  const [recentST, setRecentST] = useState<any[]>([]);
  const [recentPerjadin, setRecentPerjadin] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search filter for recent activities
  const [searchST, setSearchST] = useState("");
  const [searchPerjadin, setSearchPerjadin] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [dashRes, stRes, perjadinRes] = await Promise.all([
          api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/dashboard`),
          api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st?limit=5`),
          api
            .get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/perjadin?limit=5`)
            .catch(() => ({ data: { data: [] } })),
        ]);

        if (dashRes.data && dashRes.data.data) {
          setDashboardData(dashRes.data.data);
        }

        setRecentST(stRes.data?.data || stRes.data || []);
        setRecentPerjadin(perjadinRes.data?.data || perjadinRes.data || []);
      } catch (err) {
        console.error("Gagal mengambil data dashboard E-SAPA:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helper for user info
  const userName = user?.name || "Petugas";
  const userRole = user?.employee?.jabatan || (user as any)?.jabatan || "Petugas Operasional";
  const userFungsi = user?.employee?.fungsi?.name || (user as any)?.fungsi || "BBPOM di Mataram";

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filtered ST
  const filteredST = useMemo(() => {
    if (!searchST.trim()) return recentST;
    const q = searchST.toLowerCase();
    return recentST.filter(
      (item) =>
        (item.nomor_surat || "").toLowerCase().includes(q) ||
        (item.nama_kegiatan || "").toLowerCase().includes(q) ||
        (item.wilayah_tugas || "").toLowerCase().includes(q) ||
        (item.mak_kegiatan || "").toLowerCase().includes(q)
    );
  }, [recentST, searchST]);

  // Filtered Perjadin
  const filteredPerjadin = useMemo(() => {
    if (!searchPerjadin.trim()) return recentPerjadin;
    const q = searchPerjadin.toLowerCase();
    return recentPerjadin.filter((item) => {
      const st = item.list_petugas?.surat_tugas;
      const pet = item.list_petugas?.petugas;
      return (
        (st?.wilayah_tugas || "").toLowerCase().includes(q) ||
        (st?.nama_kegiatan || "").toLowerCase().includes(q) ||
        (pet?.nm_petugas || "").toLowerCase().includes(q)
      );
    });
  }, [recentPerjadin, searchPerjadin]);

  return (
    <div className={`${plusJakartaSans.className} min-h-full w-full bg-[#f8fafc] text-slate-800 p-6 sm:p-8 space-y-7`}>
      <div className="max-w-[1440px] mx-auto space-y-7">

        {/* =====================================================================
            1. MODERN DASHBOARD PAGE HEADER (CLEAN, FOCUSED & PROFESSIONAL)
        ====================================================================== */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 border-b border-slate-200 gap-4">
          <div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat Datang, <span className="text-teal-700">{userName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau surat tugas, kegiatan perjalanan dinas, dan akuntabilitas administrasi anggaran secara real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date & Period Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs">
              <Icon icon="solar:calendar-date-bold" width={16} className="text-teal-600" />
              <span>{dayjs().format("dddd, DD MMMM YYYY")}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-bold">T.A. {dayjs().format("YYYY")}</span>
            </div>

            {/* Primary Action Button */}
            <Link
              href="/e-sapa/surat-tugas"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm shadow-teal-700/20 transition-all active:scale-[0.98]"
            >
              <Icon icon="solar:add-circle-bold" width={17} />
              <span>Buat Surat Tugas Baru</span>
            </Link>
          </div>
        </div>

        {/* =====================================================================
            2. HIGH-SIGNAL KPI METRIC CARDS (CLEAN NUMERICAL CONTRAST)
        ====================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: ST Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ST Hari Ini
                </span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-600/15 flex items-center justify-center shrink-0">
                  <Icon icon="solar:document-add-bold" width={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dashboardData.countStToday}
                </span>
                <span className="text-xs font-medium text-slate-500">berkas diterbitkan</span>
              </div>
            </div>
          </div>

          {/* Card 2: ST Bulan Ini */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ST Bulan Ini
                </span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-600/15 flex items-center justify-center shrink-0">
                  <Icon icon="solar:document-add-bold" width={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dashboardData.countStThisMonth}
                </span>
                <span className="text-xs font-medium text-slate-500">total penugasan</span>
              </div>
            </div>
          </div>

          {/* Card 3: Perjadin Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Perjadin Hari Ini
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/15 flex items-center justify-center shrink-0">
                  <Icon icon="solar:bus-bold" width={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dashboardData.countPerjadinToday}
                </span>
                <span className="text-xs font-medium text-slate-500">perjalanan aktif</span>
              </div>
            </div>
          </div>

          {/* Card 4: Perjadin Bulan Ini */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Perjadin Bulan Ini
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/15 flex items-center justify-center shrink-0">
                  <Icon icon="solar:bus-bold" width={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dashboardData.countPerjadinThisMonth}
                </span>
                <span className="text-xs font-medium text-slate-500">total kegiatan</span>
              </div>
            </div>
          </div>

        </div>

        {/* =====================================================================
            3. MAIN CONTENT: DATA TABLES (SURAT TUGAS & PERJADIN) & QUICK ACTIONS
        ====================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* Left Column (8 cols): Data Tables */}
          <div className="lg:col-span-8 flex flex-col gap-7">
            
            {/* Table 1: Surat Tugas Terbaru */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
              
              {/* Card Header with Search & Link */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 ring-1 ring-teal-600/10">
                    <Icon icon="solar:document-text-bold" width={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Surat Tugas Terbaru
                    </h3>
                    <p className="text-xs text-slate-500">
                      5 berkas penugasan dinas yang terakhir kali diterbitkan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-48">
                    <input
                      type="text"
                      value={searchST}
                      onChange={(e) => setSearchST(e.target.value)}
                      placeholder="Cari ST / wilayah..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:outline-none focus:border-teal-600 text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                    <Icon
                      icon="solar:magnifer-linear"
                      width={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    {searchST && (
                      <button
                        type="button"
                        onClick={() => setSearchST("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  <Link
                    href="/e-sapa/surat-tugas"
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 shrink-0 transition-colors"
                  >
                    <span>Lihat Semua</span>
                    <Icon icon="solar:arrow-right-linear" width={14} />
                  </Link>
                </div>
              </div>

              {/* High-density Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">No. Surat Tugas</th>
                      <th className="px-5 py-3.5">Nama Kegiatan &amp; Lokasi</th>
                      <th className="px-5 py-3.5">Pelaksanaan</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                          <span className="loading loading-spinner loading-md text-teal-600"></span>
                          <p className="mt-2 text-xs font-medium">Memuat data surat tugas...</p>
                        </td>
                      </tr>
                    ) : filteredST.length > 0 ? (
                      filteredST.slice(0, 5).map((item: any) => {
                        const tglDari = dayjs(item.tanggal_dari).format("DD MMM YYYY");
                        const tglSampai = dayjs(item.tanggal_sampai).format("DD MMM YYYY");
                        const tglTugas = tglDari === tglSampai ? tglDari : `${tglDari} - ${tglSampai}`;

                        return (
                          <tr key={`st-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 font-mono">
                                {item.nomor_surat || "-"}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                MAK: {item.mak_kegiatan || "-"}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-800 max-w-[280px] truncate" title={item.nama_kegiatan}>
                                {item.nama_kegiatan || "-"}
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                                <Icon icon="solar:map-point-bold" width={13} className="shrink-0" />
                                <span className="truncate max-w-[260px]">{item.wilayah_tugas || "-"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70">
                                <Icon icon="solar:calendar-linear" width={13} className="text-slate-400" />
                                {tglTugas}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <Link
                                href="/e-sapa/surat-tugas"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-700 hover:text-white transition-colors"
                              >
                                <span>Kelola</span>
                                <Icon icon="solar:arrow-right-linear" width={13} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic text-xs">
                          {searchST ? `Tidak ada hasil pencarian untuk "${searchST}"` : "Belum ada berkas Surat Tugas yang terdaftar."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 text-xs text-slate-500">
                <span>Menampilkan {filteredST.slice(0, 5).length} data terbaru</span>
                <Link
                  href="/e-sapa/surat-tugas"
                  className="font-bold text-teal-700 hover:text-teal-800 transition-colors"
                >
                  Buka Manajemen Surat Tugas &rarr;
                </Link>
              </div>
            </div>

            {/* Table 2: Perjalanan Dinas Terbaru */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
              
              {/* Card Header with Search & Link */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 ring-1 ring-indigo-600/10">
                    <Icon icon="solar:bus-bold" width={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Perjalanan Dinas Lapangan Terbaru
                    </h3>
                    <p className="text-xs text-slate-500">
                      Monitoring penugasan dan perjalanan dinas lapangan terkini
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-48">
                    <input
                      type="text"
                      value={searchPerjadin}
                      onChange={(e) => setSearchPerjadin(e.target.value)}
                      placeholder="Cari lokasi / petugas..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                    <Icon
                      icon="solar:magnifer-linear"
                      width={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    {searchPerjadin && (
                      <button
                        type="button"
                        onClick={() => setSearchPerjadin("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  <Link
                    href="/e-sapa/perjadin"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 shrink-0 transition-colors"
                  >
                    <span>Lihat Semua</span>
                    <Icon icon="solar:arrow-right-linear" width={14} />
                  </Link>
                </div>
              </div>

              {/* High-density Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Wilayah Tujuan</th>
                      <th className="px-5 py-3.5">Kegiatan Terkait</th>
                      <th className="px-5 py-3.5">Petugas Utama</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                          <span className="loading loading-spinner loading-md text-indigo-600"></span>
                          <p className="mt-2 text-xs font-medium">Memuat data perjalanan dinas...</p>
                        </td>
                      </tr>
                    ) : filteredPerjadin.length > 0 ? (
                      filteredPerjadin.slice(0, 5).map((item: any, idx: number) => {
                        const st = item.list_petugas?.surat_tugas;
                        const pet = item.list_petugas?.petugas;
                        const wilayah = st?.wilayah_tugas || "Lokasi Lapangan";
                        const kegiatan = st?.nama_kegiatan || "Kegiatan Perjadin";
                        const namaPetugas = pet?.nm_petugas || "Petugas Lapangan";

                        let tglPelaksanaan = "-";
                        if (st?.tanggal_dari && st?.tanggal_sampai) {
                          const tDari = dayjs(st.tanggal_dari).format("DD MMM YYYY");
                          const tSampai = dayjs(st.tanggal_sampai).format("DD MMM YYYY");
                          tglPelaksanaan = tDari === tSampai ? tDari : `${tDari} - ${tSampai}`;
                        }

                        return (
                          <tr key={`perjadin-${item.id || idx}`} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900">{wilayah}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                                <Icon icon="solar:calendar-linear" width={13} />
                                {tglPelaksanaan}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-800 max-w-[280px] truncate" title={kegiatan}>
                                {kegiatan}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                  {getInitials(namaPetugas)}
                                </div>
                                <span className="font-bold text-slate-800 truncate max-w-[170px]" title={namaPetugas}>
                                  {namaPetugas}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <Link
                                href="/e-sapa/perjadin"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-700 hover:text-white transition-colors"
                              >
                                <span>Kelola</span>
                                <Icon icon="solar:arrow-right-linear" width={13} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic text-xs">
                          {searchPerjadin ? `Tidak ada hasil pencarian untuk "${searchPerjadin}"` : "Belum ada catatan perjalanan dinas."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 text-xs text-slate-500">
                <span>Menampilkan {filteredPerjadin.slice(0, 5).length} data terbaru</span>
                <Link
                  href="/e-sapa/perjadin"
                  className="font-bold text-indigo-700 hover:text-indigo-800 transition-colors"
                >
                  Buka Manajemen Perjalanan Dinas &rarr;
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column (4 cols): Quick Operational Shortcuts & Workflow Guide */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Aksi Cepat Operasional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pintasan praktis untuk memulai alur administrasi penugasan
                </p>
              </div>

              <div className="flex flex-col gap-3">
                
                {/* 1. Buat Surat Tugas */}
                <Link
                  href="/e-sapa/surat-tugas"
                  className="group p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-teal-500 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3.5 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 ring-1 ring-teal-600/15 group-hover:scale-105 group-hover:bg-teal-700 group-hover:text-white transition-all">
                    <Icon icon="solar:document-add-bold" width={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      Buat Surat Tugas Baru
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Input ST baru &amp; tetapkan petugas tim
                    </p>
                  </div>
                  <Icon
                    icon="solar:arrow-right-linear"
                    width={18}
                    className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all"
                  />
                </Link>

                {/* 2. Kelola Perjadin */}
                <Link
                  href="/e-sapa/perjadin"
                  className="group p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-indigo-500 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3.5 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 ring-1 ring-indigo-600/15 group-hover:scale-105 group-hover:bg-indigo-700 group-hover:text-white transition-all">
                    <Icon icon="solar:bus-bold" width={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Data Perjalanan Dinas
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Catat rincian transportasi &amp; biaya akomodasi
                    </p>
                  </div>
                  <Icon
                    icon="solar:arrow-right-linear"
                    width={18}
                    className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                  />
                </Link>

                {/* 3. Kwitansi Keuangan */}
                <div
                  className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center gap-3.5 opacity-60 select-none cursor-not-allowed"
                  title="Modul Kwitansi sedang dalam tahap pengembangan"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <Icon icon="solar:bill-list-bold" width={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-700">Kwitansi Keuangan</h4>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        Segera
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">Pembuatan tanda terima pencairan</p>
                  </div>
                  <Icon icon="solar:lock-bold" width={16} className="text-slate-400" />
                </div>

                {/* 4. SPD */}
                <div
                  className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center gap-3.5 opacity-60 select-none cursor-not-allowed"
                  title="Modul SPD sedang dalam tahap pengembangan"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <Icon icon="solar:diploma-verified-bold" width={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-700">Surat Perjadin (SPD)</h4>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        Segera
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">Format baku lembar SPD resmi</p>
                  </div>
                  <Icon icon="solar:lock-bold" width={16} className="text-slate-400" />
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}