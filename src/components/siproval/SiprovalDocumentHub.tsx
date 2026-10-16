"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
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

type TabKey = "all" | "perencanaan" | "penganggaran" | "monitoring" | "laporan" | "profil";

interface TabMeta {
  key: TabKey;
  label: string;
  shortLabel: string;
}

const TABS: TabMeta[] = [
  { key: "all", label: "Semua Dokumen", shortLabel: "Semua" },
  { key: "perencanaan", label: "Perencanaan", shortLabel: "Perencanaan" },
  { key: "penganggaran", label: "Penganggaran & Perbendaharaan", shortLabel: "Penganggaran" },
  { key: "monitoring", label: "Monitoring & Evaluasi", shortLabel: "Monev" },
  { key: "laporan", label: "Laporan Kinerja", shortLabel: "Laporan" },
  { key: "profil", label: "Profil & Regulasi", shortLabel: "Profil" },
];

export default function SiprovalDocumentHub() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabKey | null;

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [perencanaan, setPerencanaan] = useState<DocumentItem[]>([]);
  const [penganggaran, setPenganggaran] = useState<DocumentItem[]>([]);
  const [monitoring, setMonitoring] = useState<DocumentItem[]>([]);
  const [laporan, setLaporan] = useState<DocumentItem[]>([]);
  const [profilContent, setProfilContent] = useState<string | null>(null);
  const [berandaContent, setBerandaContent] = useState<string | null>(null);

  // Sync tab from URL if present
  useEffect(() => {
    if (urlTab && TABS.some((t) => t.key === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Fetch documents from backend
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

  // Combine all items
  const allDocuments = useMemo(() => {
    return [...perencanaan, ...penganggaran, ...monitoring, ...laporan];
  }, [perencanaan, penganggaran, monitoring, laporan]);

  // Filter items based on activeTab and searchQuery
  const filteredDocuments = useMemo(() => {
    let pool: DocumentItem[] = [];

    if (activeTab === "all") {
      pool = allDocuments;
    } else if (activeTab === "perencanaan") {
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
  }, [activeTab, allDocuments, perencanaan, penganggaran, monitoring, laporan, searchQuery]);

  // Counts for tab badges
  const counts: Record<TabKey, number> = {
    all: allDocuments.length,
    perencanaan: perencanaan.length,
    penganggaran: penganggaran.length,
    monitoring: monitoring.length,
    laporan: laporan.length,
    profil: 1,
  };

  const getCategoryBadge = (category: DocumentItem["category"]) => {
    switch (category) {
      case "perencanaan":
        return {
          label: "Perencanaan",
          className: "bg-blue-50 text-[#005baa] border-blue-200/80",
        };
      case "penganggaran":
        return {
          label: "Penganggaran",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        };
      case "monitoring":
        return {
          label: "Monev Kinerja",
          className: "bg-emerald-50 text-[#00a651] border-emerald-200/80",
        };
      case "laporan":
        return {
          label: "Laporan Kinerja",
          className: "bg-teal-50 text-teal-800 border-teal-200/80",
        };
      default:
        return {
          label: "Dokumen",
          className: "bg-slate-50 text-slate-700 border-slate-200",
        };
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

  return (
    <section id="dokumen-kinerja" className="w-full pt-8 pb-12 scroll-mt-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#005baa] border border-blue-200/60 mb-2">
            <span>Repositori Kinerja Balai</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pusat Dokumen & Informasi Kinerja
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Akses langsung berkas perencanaan kinerja, penganggaran, lembar kerja monitoring evaluasi, dan laporan akuntabilitas BBPOM di Mataram.
          </p>
        </div>

        {/* Quick Search Bar */}
        {activeTab !== "profil" && (
          <div className="w-full md:w-72 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dokumen kinerja..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005baa]/20 focus:border-[#005baa] text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Icon icon="solar:magnifer-linear" width={14} height={14} />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <Icon icon="solar:close-circle-bold" width={14} height={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#003d73] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-[#003d73] hover:bg-slate-50 border border-slate-200/80"
              }`}
            >
              <span>{tab.label}</span>
              {tab.key !== "profil" && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
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

      {/* Content Area */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="inline-block w-8 h-8 border-3 border-slate-200 border-t-[#005baa] rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-slate-500">
            Memuat dokumen kinerja...
          </p>
        </div>
      ) : activeTab === "profil" ? (
        /* Profil & Regulasi View */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header info */}
            <div className="border-b border-slate-100 pb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00a651] border border-emerald-200/60 mb-3">
                Tentang Sistem
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Sistem Informasi Program & Evaluasi (SIPROVAL)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {berandaContent ||
                  "Siproval adalah Sistem Informasi Program dan Evaluasi terpadu Balai Besar Pengawas Obat dan Makanan di Mataram. Aplikasi ini memuat integrasi perencanaan kinerja, alokasi anggaran, monitoring dan evaluasi capaian indikator, hingga pelaporan kinerja periodik."}
              </p>
            </div>

            {/* 4 Pillars Grid */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
                4 Pilar Pengelolaan Kinerja SIPROVAL
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#005baa] text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">Perencanaan Kinerja</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Penetapan target kinerja, Rencana Strategis (Renstra), Plan of Action (PoA), Definisi Operasional, dan Petunjuk Cascading UPT.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">Penganggaran & Perbendaharaan</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sinkronisasi alokasi anggaran, pemetaan rincian belanja (budget mapping), dan pelacakan penyerapan dana belanja berkala.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#00a651] text-white flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">Monitoring & Evaluasi</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pencatatan realisasi bulanan RHPK, pemantauan RTL Rekomendasi Lakin, data dukung IKSK, dan integrasi Google Sheets.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">Pelaporan Terintegrasi</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Penyusunan data terverifikasi untuk pelaporan SAKTI, monev Bappenas, BPOM Operational Center (BOC), dan aplikasi SIMETRIS.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Profile Content if present */}
            {profilContent && (
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Informasi Balai
                </h4>
                <div
                  className="prose prose-sm max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{ __html: profilContent }}
                />
              </div>
            )}
          </div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {searchQuery
              ? `Tidak ditemukan dokumen yang cocok dengan kata kunci "${searchQuery}"`
              : "Belum ada dokumen yang tersedia untuk kategori ini"}
          </p>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian yang lain atau beralih ke tab 'Semua Dokumen'."
              : "Dokumen yang diunggah melalui sistem akan tampil otomatis di bagian ini."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        /* Documents Grid */
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredDocuments.length}</strong> dokumen
            </span>
            {searchQuery && (
              <span>
                Hasil pencarian untuk: &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((item) => {
              const categoryBadge = getCategoryBadge(item.category);
              const linkMeta = getLinkMeta(item.link);
              const isLinkActive = linkMeta.type !== "unavailable";

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  className="bg-white rounded-xl border border-slate-200/80 hover:border-[#005baa]/50 hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${categoryBadge.className}`}
                      >
                        {categoryBadge.label}
                      </span>

                      {isLinkActive && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {linkMeta.label}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {item.desc && item.desc.trim() !== "" && item.desc !== "-"
                        ? item.desc
                        : "Dokumen rujukan program, evaluasi, dan akuntabilitas kinerja Balai."}
                    </p>
                  </div>

                  {/* Action Link Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isLinkActive ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-[#005baa] text-slate-700 hover:text-white border border-slate-200 hover:border-[#005baa] text-xs font-semibold transition-all group"
                      >
                        <span>Buka Dokumen</span>
                        <Icon
                          icon="solar:arrow-right-up-linear"
                          width={14}
                          height={14}
                          className="text-slate-400 group-hover:text-white transition-colors"
                        />
                      </a>
                    ) : (
                      <span className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200/60 text-xs font-medium cursor-not-allowed">
                        <span>Tautan Belum Tersedia</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

