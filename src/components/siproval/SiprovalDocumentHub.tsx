"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

const siprovalBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

export interface DocumentItem {
  id: number;
  name: string;
  link: string;
  desc?: string | null;
  category: "perencanaan" | "penganggaran" | "monitoring" | "laporan";
}

type TabKey =
  | "perencanaan"
  | "penganggaran"
  | "monitoring"
  | "laporan"
  | "profil";

interface TabMeta {
  key: TabKey;
  label: string;
  shortLabel: string;
}

const TABS: TabMeta[] = [
  { key: "perencanaan", label: "Perencanaan", shortLabel: "Perencanaan" },
  {
    key: "penganggaran",
    label: "Penganggaran & Perbendaharaan",
    shortLabel: "Penganggaran",
  },
  {
    key: "monitoring",
    label: "Monitoring & Evaluasi",
    shortLabel: "Monev",
  },
  {
    key: "laporan",
    label: "Laporan Kinerja",
    shortLabel: "Laporan",
  },
  {
    key: "profil",
    label: "Profil & Regulasi",
    shortLabel: "Profil",
  },
];

export default function SiprovalDocumentHub() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabKey | null;

  const [activeTab, setActiveTab] = useState<TabKey>("perencanaan");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [perencanaan, setPerencanaan] = useState<DocumentItem[]>([]);
  const [penganggaran, setPenganggaran] = useState<DocumentItem[]>([]);
  const [monitoring, setMonitoring] = useState<DocumentItem[]>([]);
  const [laporan, setLaporan] = useState<DocumentItem[]>([]);
  const [profilContent, setProfilContent] = useState<string | null>(null);
  const [berandaContent, setBerandaContent] = useState<string | null>(null);

  useEffect(() => {
    if (urlTab && TABS.some((t) => t.key === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      setLoading(true);
      try {
        const res = await axios.get(`${siprovalBaseUrl}/api/public-documents`, {
          withCredentials: true,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (isMounted && res.data?.status === "success" && res.data?.data) {
          const data = res.data.data;
          setPerencanaan(
            (data.perencanaan || []).map((item: any) => ({
              ...item,
              category: "perencanaan",
            })),
          );
          setPenganggaran(
            (data.penganggaran || []).map((item: any) => ({
              ...item,
              category: "penganggaran",
            })),
          );
          setMonitoring(
            (data.monitoring || []).map((item: any) => ({
              ...item,
              category: "monitoring",
            })),
          );
          setLaporan(
            (data.laporan || []).map((item: any) => ({
              ...item,
              category: "laporan",
            })),
          );
          setProfilContent(data.profil || null);
          setBerandaContent(data.beranda || null);
        }
      } catch (err) {
        console.warn("Gagal memuat dokumen publik dari backend:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDocuments();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    let pool: DocumentItem[] = [];

    if (activeTab === "perencanaan") {
      pool = perencanaan;
    } else if (activeTab === "penganggaran") {
      pool = penganggaran;
    } else if (activeTab === "monitoring") {
      pool = monitoring;
    } else if (activeTab === "laporan") {
      pool = laporan;
    } else {
      pool = [];
    }

    if (!searchQuery.trim()) {
      return pool;
    }

    const q = searchQuery.toLowerCase().trim();
    return pool.filter(
      (doc) =>
        (doc.name && doc.name.toLowerCase().includes(q)) ||
        (doc.desc && doc.desc.toLowerCase().includes(q)),
    );
  }, [activeTab, perencanaan, penganggaran, monitoring, laporan, searchQuery]);

  const counts: Record<TabKey, number> = {
    perencanaan: perencanaan.length,
    penganggaran: penganggaran.length,
    monitoring: monitoring.length,
    laporan: laporan.length,
    profil: 1,
  };

  const getCategoryLabel = (category: DocumentItem["category"]) => {
    switch (category) {
      case "perencanaan":
        return "Perencanaan";
      case "penganggaran":
        return "Penganggaran";
      case "monitoring":
        return "Monitoring & Evaluasi";
      case "laporan":
        return "Laporan Kinerja";
      default:
        return "Dokumen";
    }
  };

  const isValidUrl = (link?: string | null) => {
    if (!link) return false;
    const trimmed = link.trim();
    return (
      (trimmed.startsWith("http://") || trimmed.startsWith("https://")) &&
      !trimmed.includes("#####")
    );
  };

  const getLinkMeta = (link?: string | null) => {
    if (!link || !isValidUrl(link)) {
      return { type: "unavailable", label: "Tautan Belum Tersedia" };
    }
    if (link.includes("docs.google.com/spreadsheets")) {
      return { type: "spreadsheet", label: "Google Sheets" };
    }
    if (link.includes("drive.google.com")) {
      return { type: "drive", label: "Google Drive" };
    }
    return { type: "external", label: "Tautan Dokumen" };
  };

  const activeTabMeta = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <section
      id="dokumen-kinerja"
      className="w-full bg-white py-20 sm:py-24 px-6 sm:px-10 lg:px-16 scroll-mt-14 border-t border-slate-100"
    >
      <div className="max-w-6xl mx-auto">
        {/* Clean Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#005baa] mb-2">
              Repositori Kinerja Balai
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#001d3d] tracking-tight">
              Pusat Dokumen &amp; Informasi Kinerja
            </h2>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 max-w-md w-full">
            <p className="text-sm text-slate-500 md:text-right leading-relaxed">
              Akses langsung berkas perencanaan kinerja, penganggaran, lembar
              kerja monitoring evaluasi, dan laporan akuntabilitas BBPOM di
              Mataram.
            </p>

            {activeTab !== "profil" && (
              <div className="w-full relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari dokumen ${activeTabMeta.shortLabel}...`}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-full bg-slate-50 focus:bg-white border border-slate-200 focus:outline-none focus:border-[#005baa] text-slate-800 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clean Per-Menu Tabs (No 'Semua Dokumen' tab, no icons) */}
        <div className="flex items-center gap-2 overflow-x-auto py-6 scrollbar-thin">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key];

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#003d73] text-white"
                    : "bg-slate-100 text-slate-600 hover:text-[#001d3d] hover:bg-slate-200/70"
                }`}
              >
                <span>{tab.label}</span>
                {tab.key !== "profil" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-16 text-center bg-slate-50/60 rounded-3xl border border-slate-200/80">
            <p className="text-sm font-medium text-slate-500">
              Memuat dokumen {activeTabMeta.label}...
            </p>
          </div>
        ) : activeTab === "profil" ? (
          /* Profil & Regulasi View */
          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10">
            <div className="pb-6 border-b border-slate-100 mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-[#001d3d] mb-2">
                Sistem Informasi Program &amp; Evaluasi (SIPROVAL)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {berandaContent ||
                  "Siproval adalah Sistem Informasi Program dan Evaluasi terpadu Balai Besar Pengawas Obat dan Makanan di Mataram. Aplikasi ini memuat integrasi perencanaan kinerja, alokasi anggaran, monitoring dan evaluasi capaian indikator, hingga pelaporan kinerja periodik."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h4 className="text-sm font-bold text-[#001d3d] mb-1.5">
                  Perencanaan Kinerja
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Penetapan target kinerja, Rencana Strategis (Renstra), Plan of
                  Action (PoA), Definisi Operasional, dan Petunjuk Cascading
                  UPT.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h4 className="text-sm font-bold text-[#001d3d] mb-1.5">
                  Penganggaran &amp; Perbendaharaan
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Sinkronisasi alokasi anggaran, pemetaan rincian belanja
                  (budget mapping), dan pelacakan penyerapan dana belanja
                  berkala.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h4 className="text-sm font-bold text-[#001d3d] mb-1.5">
                  Monitoring &amp; Evaluasi
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pencatatan realisasi bulanan RHPK, pemantauan RTL Rekomendasi
                  Lakin, data dukung IKSK, dan integrasi Google Sheets.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h4 className="text-sm font-bold text-[#001d3d] mb-1.5">
                  Pelaporan Terintegrasi
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Penyusunan data terverifikasi untuk pelaporan SAKTI, monev
                  Bappenas, BPOM Operational Center (BOC), dan aplikasi
                  SIMETRIS.
                </p>
              </div>
            </div>

            {profilContent && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div
                  className="prose prose-sm max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{ __html: profilContent }}
                />
              </div>
            )}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-slate-50/70 rounded-3xl border border-slate-200/80 p-12 text-center">
            <p className="text-sm font-semibold text-[#001d3d] mb-1">
              {searchQuery
                ? `Tidak ditemukan dokumen dengan kata kunci "${searchQuery}"`
                : `Belum ada dokumen pada menu ${activeTabMeta.label}`}
            </p>
            <p className="text-xs text-slate-500">
              Dokumen yang diunggah melalui sistem akan tampil otomatis pada
              menu ini.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-xs text-slate-500 mb-5 px-1">
              Menampilkan{" "}
              <strong className="text-[#001d3d]">
                {filteredDocuments.length}
              </strong>{" "}
              dokumen
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocuments.map((item) => {
                const categoryLabel = getCategoryLabel(item.category);
                const linkMeta = getLinkMeta(item.link);
                const isLinkActive = linkMeta.type !== "unavailable";

                return (
                  <div
                    key={`${item.category}-${item.id}`}
                    className="bg-white rounded-3xl border border-slate-200 hover:border-[#005baa] transition-all p-6 flex flex-col justify-between shadow-2xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-semibold text-[#005baa] bg-[#005baa]/10 px-2.5 py-0.5 rounded-full">
                          {categoryLabel}
                        </span>
                        {isLinkActive && (
                          <span className="text-[11px] text-slate-400">
                            {linkMeta.label}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#001d3d] leading-snug mb-2 line-clamp-2">
                        {item.name}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-2">
                        {item.desc &&
                        item.desc.trim() !== "" &&
                        item.desc !== "-"
                          ? item.desc
                          : "Dokumen rujukan program, evaluasi, dan akuntabilitas kinerja Balai."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      {isLinkActive ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center px-4 py-2 rounded-full bg-slate-100 hover:bg-[#005baa] text-[#001d3d] hover:text-white text-xs font-semibold transition-colors"
                        >
                          Buka Dokumen
                        </a>
                      ) : (
                        <span className="block w-full text-center px-4 py-2 rounded-full bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed">
                          Tautan Belum Tersedia
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
