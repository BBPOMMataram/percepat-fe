"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import {
  SIPROVAL_EASE,
  SiprovalFadeUp,
  SiprovalLineDraw,
  SiprovalSpotlightCard,
} from "./SiprovalMotion";

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
            }))
          );
          setPenganggaran(
            (data.penganggaran || []).map((item: any) => ({
              ...item,
              category: "penganggaran",
            }))
          );
          setMonitoring(
            (data.monitoring || []).map((item: any) => ({
              ...item,
              category: "monitoring",
            }))
          );
          setLaporan(
            (data.laporan || []).map((item: any) => ({
              ...item,
              category: "laporan",
            }))
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
        (doc.desc && doc.desc.toLowerCase().includes(q))
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
      className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 scroll-mt-14 overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f1f7fe_42%,#e5f0fc_100%)]"
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Animated Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
          <SiprovalFadeUp>
            <p className="text-xs font-bold uppercase tracking-widest text-[#005baa] mb-2">
              Repositori Kinerja Balai
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#001d3d] tracking-[-0.02em] leading-[1.12]">
              Pusat Dokumen &amp; Informasi Kinerja
            </h2>
          </SiprovalFadeUp>

          <SiprovalFadeUp
            delay={0.12}
            className="flex flex-col items-start md:items-end gap-3.5 max-w-md w-full"
          >
            <p className="text-sm sm:text-base text-slate-600 md:text-right leading-relaxed">
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
                  className="w-full px-5 py-2.5 text-xs sm:text-sm rounded-full bg-white/90 focus:bg-white border border-slate-200/90 focus:outline-none focus:border-[#005baa] shadow-2xs text-slate-800 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#005baa] hover:text-[#001d3d]"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </SiprovalFadeUp>
        </div>

        <SiprovalLineDraw className="bg-slate-200/90" />

        {/* Fluid Animated Per-Menu Tabs */}
        <SiprovalFadeUp delay={0.15}>
          <div className="flex items-center gap-2 overflow-x-auto py-7 scrollbar-thin">
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
                  className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 cursor-pointer ${
                    isActive
                      ? "text-white"
                      : "bg-white/80 text-slate-600 hover:text-[#001d3d] hover:bg-white border border-slate-200/70"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="siprovalActiveCategoryPill"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#004c97_0%,#002855_100%)] shadow-md shadow-[#002855]/25"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  {tab.key !== "profil" && (
                    <span
                      className={`relative z-10 px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SiprovalFadeUp>

        {/* Animated Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: SIPROVAL_EASE }}
              className="py-16 text-center bg-white/80 backdrop-blur-xs rounded-[28px] border border-slate-200/80 shadow-xs"
            >
              <p className="text-sm font-medium text-slate-500">
                Memuat dokumen {activeTabMeta.label}...
              </p>
            </motion.div>
          ) : activeTab === "profil" ? (
            /* Profil & Regulasi View */
            <motion.div
              key="profil"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: SIPROVAL_EASE }}
              className="rounded-[28px] border border-slate-200/90 bg-white p-7 sm:p-10 shadow-[0_18px_45px_-15px_rgba(0,29,61,0.08)]"
            >
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
                {[
                  {
                    index: "01",
                    title: "Perencanaan Kinerja",
                    desc: "Penetapan target kinerja, Rencana Strategis (Renstra), Plan of Action (PoA), Definisi Operasional, dan Petunjuk Cascading UPT.",
                  },
                  {
                    index: "02",
                    title: "Penganggaran & Perbendaharaan",
                    desc: "Sinkronisasi alokasi anggaran, pemetaan rincian belanja (budget mapping), dan pelacakan penyerapan dana belanja berkala.",
                  },
                  {
                    index: "03",
                    title: "Monitoring & Evaluasi",
                    desc: "Pencatatan realisasi bulanan RHPK, pemantauan RTL Rekomendasi Lakin, data dukung IKSK, dan integrasi Google Sheets.",
                  },
                  {
                    index: "04",
                    title: "Pelaporan Terintegrasi",
                    desc: "Penyusunan data terverifikasi untuk pelaporan SAKTI, monev Bappenas, BPOM Operational Center (BOC), dan aplikasi SIMETRIS.",
                  },
                ].map((pillar, idx) => (
                  <SiprovalSpotlightCard
                    key={pillar.index}
                    delay={idx * 0.08}
                    spotlightColor="rgba(0, 91, 170, 0.12)"
                    className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-[#005baa]/50 transition-colors"
                  >
                    <div>
                      <span className="block text-[11px] font-extrabold tracking-[0.2em] text-[#005baa] mb-1">
                        {pillar.index}
                      </span>
                      <h4 className="text-base font-bold text-[#001d3d] mb-2">
                        {pillar.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </SiprovalSpotlightCard>
                ))}
              </div>

              {profilContent && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div
                    className="prose prose-sm max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: profilContent }}
                  />
                </div>
              )}
            </motion.div>
          ) : filteredDocuments.length === 0 ? (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: SIPROVAL_EASE }}
              className="bg-white/85 rounded-[28px] border border-slate-200/80 p-12 text-center shadow-xs"
            >
              <p className="text-sm font-semibold text-[#001d3d] mb-1">
                {searchQuery
                  ? `Tidak ditemukan dokumen dengan kata kunci "${searchQuery}"`
                  : `Belum ada dokumen pada menu ${activeTabMeta.label}`}
              </p>
              <p className="text-xs text-slate-500">
                Dokumen yang diunggah melalui sistem akan tampil otomatis pada
                menu ini.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: SIPROVAL_EASE }}
            >
              <div className="flex items-center justify-between text-xs text-slate-600 mb-5 px-1">
                <span>
                  Menampilkan{" "}
                  <strong className="text-[#001d3d]">
                    {filteredDocuments.length}
                  </strong>{" "}
                  dokumen pada kategori{" "}
                  <strong className="text-[#005baa]">
                    {activeTabMeta.label}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {filteredDocuments.map((item, idx) => {
                  const categoryLabel = getCategoryLabel(item.category);
                  const linkMeta = getLinkMeta(item.link);
                  const isLinkActive = linkMeta.type !== "unavailable";

                  return (
                    <SiprovalSpotlightCard
                      key={`${item.category}-${item.id}`}
                      delay={Math.min(idx * 0.04, 0.36)}
                      spotlightColor="rgba(0, 91, 170, 0.10)"
                      className="bg-white rounded-[26px] border border-slate-200/90 hover:border-[#005baa]/60 transition-all duration-500 p-6 sm:p-7 shadow-[0_12px_32px_-12px_rgba(0,29,61,0.08)] hover:shadow-[0_22px_48px_-14px_rgba(0,61,115,0.16)]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <span className="text-[11px] font-bold text-[#005baa] bg-[#005baa]/10 px-3 py-0.5 rounded-full">
                            {categoryLabel}
                          </span>
                          {isLinkActive && (
                            <span className="text-[11px] font-medium text-slate-400">
                              {linkMeta.label}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-[17px] font-bold text-[#001d3d] group-hover:text-[#004c97] transition-colors leading-snug mb-2.5 line-clamp-2">
                          {item.name}
                        </h3>

                        <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed mb-6 line-clamp-2">
                          {item.desc &&
                          item.desc.trim() !== "" &&
                          item.desc !== "-"
                            ? item.desc
                            : "Dokumen rujukan program, evaluasi, dan akuntabilitas kinerja Balai."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        {isLinkActive ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2.5 px-5 rounded-full bg-[#003d73]/8 hover:bg-[#003d73] text-[#002855] hover:text-white text-xs font-bold transition-colors duration-300"
                          >
                            Buka Dokumen
                          </a>
                        ) : (
                          <span className="block w-full text-center px-4 py-2.5 rounded-full bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed">
                            Tautan Belum Tersedia
                          </span>
                        )}
                      </div>
                    </SiprovalSpotlightCard>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
