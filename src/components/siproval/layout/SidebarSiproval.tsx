"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export type Actor = "katim" | "kabalai" | "tu" | "superadmin";

export type SiprovalMenuItem = {
  name: string;
  headerTitle?: string;
  description?: string;
  icon: string;
  url: string;
  active: string;
};

export const menus: Record<Actor, SiprovalMenuItem[]> = {
  katim: [
    {
      name: "Dashboard",
      headerTitle: "Dashboard Ketua Tim",
      description: "Monitoring capaian dan realisasi kegiatan tim",
      icon: "solar:widget-5-bold",
      url: "/siproval/katim",
      active: "/siproval/katim",
    },
    {
      name: "Entry Data RHPK",
      description: "Pengisian angka target dan data capaian kegiatan bulanan tim",
      icon: "solar:pen-new-square-bold",
      url: "/siproval/katim/entry-data-rhpk",
      active: "/siproval/katim/entry-data-rhpk",
    },
    {
      name: "Rekap RHPK",
      description: "Pantau dan kelola target, realisasi, kendala, serta data pendukung RHPK Balai",
      icon: "solar:clipboard-check-bold",
      url: "/siproval/katim/rekap-rhpk",
      active: "/siproval/katim/rekap-rhpk",
    },
    {
      name: "Arahan Pimpinan",
      description: "Daftar arahan dan evaluasi Kepala Balai untuk tim Anda",
      icon: "solar:chat-round-line-bold",
      url: "/siproval/katim/arahan-pimpinan",
      active: "/siproval/katim/arahan-pimpinan",
    },
    {
      name: "Anggota Tim IKSK",
      description: "Daftar staf dan pelaksana yang bertugas pada IKSK Anda",
      icon: "solar:users-group-two-rounded-bold",
      url: "/siproval/katim/anggota",
      active: "/siproval/katim/anggota",
    },
  ],

  kabalai: [
    {
      name: "Dashboard",
      headerTitle: "Catatan Monev & Evaluasi",
      description: "Monitoring, evaluasi, dan review laporan IKSK",
      icon: "solar:widget-5-bold",
      url: "/siproval/catatan",
      active: "/siproval/catatan",
    },
    {
      name: "Monitoring & Evaluasi",
      description: "Rekapitulasi Rencana Hasil Pelaksanaan Kegiatan per tahun",
      icon: "solar:chart-2-bold",
      url: "/siproval/monev",
      active: "/siproval/monev",
    },
    {
      name: "RHPK (Read-Only)",
      description: "Peninjauan seluruh lembar kerja IKSK 1 s.d. 28 dalam mode baca terlindungi",
      icon: "solar:folder-with-files-bold",
      url: "/siproval/rhpk/entry-data",
      active: "/siproval/rhpk/entry-data",
    },
  ],
  tu: [
    {
      name: "Dashboard TU",
      description: "Pengelolaan anggaran dan pemetaan program kerja",
      icon: "solar:widget-5-bold",
      url: "/siproval/tu",
      active: "/siproval/tu",
    },
    {
      name: "Realisasi RO",
      description: "Pemantauan target tahunan, bulanan, realisasi, dan capaian Rincian Output",
      icon: "solar:document-medicine-bold",
      url: "/siproval/tu/realisasi-ro",
      active: "/siproval/tu/realisasi-ro",
    },
    {
      name: "Rekap RHPK",
      description: "Pantau dan kelola target, realisasi, kendala, serta data pendukung RHPK Balai",
      icon: "solar:document-text-bold",
      url: "/siproval/tu/rhpk",
      active: "/siproval/tu/rhpk",
    },
    {
      name: "Tabel Konversi NKO",
      description: "Perhitungan dan konversi Nilai Kinerja Organisasi (NKO)",
      icon: "solar:calculator-bold",
      url: "/siproval/tu/konversi-nko",
      active: "/siproval/tu/konversi-nko",
    },
    {
      name: "Budget Mapping",
      description: "Pemetaan alokasi anggaran dan realisasi bulanan",
      icon: "solar:pie-chart-2-bold",
      url: "/siproval/budget-mapping",
      active: "/siproval/budget-mapping",
    },
    {
      name: "Rekapitulasi Anggaran",
      description: "Ringkasan pagu dan realisasi anggaran per fungsi dan kegiatan",
      icon: "solar:chart-square-bold",
      url: "/siproval/tu/rekapitulasi-anggaran",
      active: "/siproval/tu/rekapitulasi-anggaran",
    },
    {
      name: "Matriks Rekomendasi",
      description: "Pemantauan tindak lanjut rekomendasi evaluasi triwulanan",
      icon: "solar:clipboard-list-bold",
      url: "/siproval/tu/matriks-rekomendasi?quarter=TW2",
      active: "/siproval/tu/matriks-rekomendasi",
    },
    {
      name: "Eksport Laporan",
      description: "Berita Acara Evaluasi Internal gabungan Volume (Realisasi RO) dan Anggaran (Budget Mapping)",
      icon: "solar:printer-bold",
      url: "/siproval/tu/laporan-evaluasi?quarter=TW2",
      active: "/siproval/tu/laporan-evaluasi",
    },
  ],
  superadmin: [
    {
      name: "Entry Data RHPK",
      headerTitle: "Entry Data RHPK (PIC / Admin)",
      description: "Pengisian angka target dan data capaian kegiatan bulanan seluruh IKSK",
      icon: "solar:pen-new-square-bold",
      url: "/siproval/admin/entry-data-rhpk",
      active: "/siproval/admin/entry-data-rhpk",
    },
    {
      name: "Kelola Akses RHPK",
      description: "Pengaturan hak akses dan penugasan IKSK untuk Ketua Tim",
      icon: "solar:document-medicine-bold",
      url: "/siproval/admin/kelola-akses-rhpk",
      active: "/siproval/admin/kelola-akses-rhpk",
    },
    {
      name: "Otorisasi & Kunci Bulan",
      description: "Manajemen otorisasi dan penguncian periode pengisian bulanan",
      icon: "solar:lock-keyhole-bold",
      url: "/siproval/admin/permission",
      active: "/siproval/admin/permission",
    },
    {
      name: "Kelola User",
      description: "Manajemen akun pengguna dan hak akses aplikasi SIPROVAL",
      icon: "solar:users-group-rounded-bold",
      url: "/siproval/admin/kelola-user",
      active: "/siproval/admin/kelola-user",
    },
    {
      name: "Kelola IKSK",
      description: "Manajemen daftar Indikator Kinerja Sasaran Kegiatan (IKSK)",
      icon: "solar:list-check-bold",
      url: "/siproval/admin/kelola-iksk",
      active: "/siproval/admin/kelola-iksk",
    },
  ],
};

const additionalRouteMeta: Array<{
  active: string;
  title: string;
  description: string;
}> = [
  {
    active: "/siproval/pic/entry-data-rhpk",
    title: "Entry Data RHPK (PIC / Admin)",
    description: "Pengisian angka target dan data capaian kegiatan bulanan seluruh IKSK",
  },
  {
    active: "/siproval/katim/rhpk",
    title: "Pengisian Data RHPK",
    description: "Pengisian capaian realisasi, target bulanan, kendala, dan tindak lanjut RHPK",
  },
  {
    active: "/siproval/kabalai/rhpk",
    title: "RHPK (Read-Only)",
    description: "Peninjauan seluruh lembar kerja IKSK 1 s.d. 28 dalam mode baca terlindungi",
  },
  {
    active: "/siproval/show-monev",
    title: "Monitoring & Evaluasi",
    description: "Rekapitulasi Rencana Hasil Pelaksanaan Kegiatan per tahun",
  },
  {
    active: "/siproval/arahan-pimpinan",
    title: "Arahan Pimpinan",
    description: "Formulir penambahan arahan dan evaluasi Kepala Balai",
  },
  {
    active: "/siproval/rhpk",
    title: "Rekapitulasi RHPK",
    description: "Data pemantauan dan evaluasi tab RHPK",
  },
  {
    active: "/siproval/tu/budget-mapping",
    title: "Budget Mapping",
    description: "Pemetaan alokasi anggaran dan realisasi bulanan",
  },
  {
    active: "/siproval/rekapitulasi-anggaran",
    title: "Rekapitulasi Anggaran",
    description: "Ringkasan pagu dan realisasi anggaran per fungsi dan kegiatan",
  },
  {
    active: "/siproval/google-sheets",
    title: "Data Realisasi Google Sheet",
    description: "Pengisian dan pelaporan data capaian IKSK",
  },
  {
    active: "/siproval/admin/sinkronisasi-spreadsheet",
    title: "Sinkronisasi Spreadsheet",
    description: "Integrasi dokumen Google Spreadsheet ke sistem SIPROVAL",
  },
  {
    active: "/siproval/admin/sinkronisasi-tab",
    title: "Sinkronisasi Tab",
    description: "Pengelolaan tab dan konfigurasi pembacaan data spreadsheet",
  },
  {
    active: "/siproval/profil",
    title: "Profil Pengguna",
    description: "Informasi akun dan pengaturan profil pengguna",
  },
];

export function resolveSiprovalPageMeta(pathname: string): {
  title: string;
  description: string;
} {
  const cleanPath = (pathname || "").split("?")[0].replace(/\/+$/, "") || "/siproval";

  const allCandidates: Array<{
    active: string;
    title: string;
    description: string;
  }> = [
    ...Object.values(menus)
      .flat()
      .map((item) => ({
        active: item.active.replace(/\/+$/, ""),
        title: item.headerTitle || item.name,
        description:
          item.description ||
          "Sistem Informasi Program dan Evaluasi BBPOM di Mataram",
      })),
    ...additionalRouteMeta,
  ];

  // Urutkan berdasarkan panjang path terpanjang (paling spesifik) agar sub-menu cocok terlebih dahulu
  allCandidates.sort((a, b) => b.active.length - a.active.length);

  const exactMatch = allCandidates.find((c) => cleanPath === c.active);
  if (exactMatch) {
    return { title: exactMatch.title, description: exactMatch.description };
  }

  // Untuk dashboard root per aktor (/siproval/tu/dashboard -> /siproval/tu)
  if (cleanPath === "/siproval/tu/dashboard") {
    const tuDash = menus.tu[0];
    return {
      title: tuDash.headerTitle || tuDash.name,
      description: tuDash.description || "",
    };
  }

  const prefixMatch = allCandidates.find((c) =>
    cleanPath.startsWith(`${c.active}/`),
  );
  if (prefixMatch) {
    return { title: prefixMatch.title, description: prefixMatch.description };
  }

  return {
    title: "Dashboard SIPROVAL",
    description: "Sistem Informasi Program dan Evaluasi BBPOM di Mataram",
  };
}

type Props = {
  actor?: Actor;
};

export default function SidebarSiproval({ actor }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

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

  const userIdLower = String(user?.id || "")
    .toLowerCase()
    .trim();
  const userNameLower = (user?.name || "").toLowerCase().trim();
  const userEmailLower = (user?.email || "").toLowerCase().trim();

  const isExplicitTuUser =
    allowedTuIds.includes(userIdLower) ||
    allowedTuEmails.includes(userEmailLower) ||
    allowedTuNames.includes(userNameLower) ||
    userNameLower.includes("syamsul hady") ||
    userNameLower.includes("syamsul hadi") ||
    userEmailLower.includes("syamsul.hady") ||
    userEmailLower.includes("syamsul.hadi");

  const groupJabatanId = user?.employee?.group_jabatan_id;
  const isKabalai = groupJabatanId === 1;
  const isKatimFromTable =
    Array.isArray(user?.katims) && user.katims.length > 0;
  const isKatim = groupJabatanId === 3 || isKatimFromTable;

  const hasFungsiTu =
    !isKatim &&
    !isKabalai &&
    (Number(user?.employee?.fungsi_id) === 1 ||
      (user?.employee?.fungsi?.name || "").toLowerCase().trim() ===
        "tata usaha");

  const hasTuAccess = !isKabalai && (isExplicitTuUser || hasFungsiTu);

  let resolvedActor: Actor = actor || "katim";
  if (!actor) {
    const isPic =
      user?.role?.level === "superadmin" ||
      picEmails.includes(userEmailLower) ||
      picNames.some((n) => userNameLower.includes(n)) ||
      (user?.role?.level === "admin" &&
        Array.isArray(user?.sites) &&
        user.sites.some(
          (s: { id?: number; name?: string }) =>
            Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval"),
        ));

    if (
      hasTuAccess &&
      (pathname.startsWith("/siproval/tu") ||
        pathname.startsWith("/siproval/budget-mapping"))
    ) {
      resolvedActor = "tu";
    } else if (isPic) {
      if (
        pathname.startsWith("/siproval/monev") ||
        pathname.startsWith("/siproval/show-monev") ||
        pathname.startsWith("/siproval/catatan") ||
        pathname.startsWith("/siproval/arahan-pimpinan") ||
        (pathname.startsWith("/siproval/rhpk") && !pathname.startsWith("/siproval/rhpk/entry-data"))
      ) {
        resolvedActor = "kabalai";
      } else if (
        pathname === "/siproval/katim" ||
        pathname.startsWith("/siproval/katim/anggota") ||
        pathname.startsWith("/siproval/katim/arahan-pimpinan")
      ) {
        resolvedActor = "katim";
      } else {
        resolvedActor = "superadmin";
      }
    } else if (groupJabatanId === 1) {
      resolvedActor = "kabalai";
    } else if (isKatim) {
      resolvedActor = "katim";
    } else if (hasTuAccess) {
      resolvedActor = "tu";
    } else {
      if (pathname.startsWith("/siproval/admin")) {
        resolvedActor = "superadmin";
      } else if (
        pathname.startsWith("/siproval/monev") ||
        pathname.startsWith("/siproval/show-monev") ||
        pathname.startsWith("/siproval/catatan") ||
        pathname.startsWith("/siproval/arahan-pimpinan") ||
        pathname.startsWith("/siproval/rhpk") ||
        pathname.startsWith("/siproval/kabalai")
      ) {
        resolvedActor = "kabalai";
      } else {
        resolvedActor = "katim";
      }
    }
  }

  const actorMenus = menus[resolvedActor] ?? [];

  const isMenuActive = (activePath: string) => {
    if (activePath === "/siproval/rhpk/entry-data" || activePath === "/siproval/kabalai/rhpk") {
      return (
        pathname === "/siproval/kabalai/rhpk" ||
        pathname.startsWith("/siproval/kabalai/rhpk") ||
        pathname === "/siproval/katim/entry-data-rhpk" ||
        pathname.startsWith("/siproval/katim/entry-data-rhpk")
      );
    }
    if (activePath === "/siproval/monev") {
      return (
        pathname === "/siproval/monev" ||
        pathname.startsWith("/siproval/monev/") ||
        pathname.startsWith("/siproval/rhpk")
      );
    }
    if (
      activePath === "/siproval/tu" ||
      activePath === "/siproval/budget-mapping"
    ) {
      return pathname === activePath || pathname === `${activePath}/dashboard`;
    }
    return pathname === activePath || pathname.startsWith(`${activePath}/`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka menu"
        className="fixed left-4 top-4 z-40 rounded-lg bg-[#014083] p-2 text-white lg:hidden"
      >
        <Icon icon="solar:hamburger-menu-bold" width={24} />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 xl:w-72 flex-col bg-[#014083] p-4 sm:p-5 xl:p-6 text-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/assets/images/bpom_without_label.webp"
            width={40}
            height={40}
            alt="Logo BBPOM"
            className="h-10 w-10 object-contain"
          />

          <div className="leading-tight">
            <p className="text-lg font-bold">SI MANDALIKA</p>
            <p className="text-xs uppercase tracking-widest text-white/60">
              SIPROVAL
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
            Aktor
          </p>
          <p className="mt-1 text-sm font-semibold">
            {resolvedActor === "kabalai"
              ? "Kepala Balai"
              : resolvedActor === "katim"
                ? "Ketua Tim (Katim)"
                : resolvedActor === "tu"
                  ? "Bagian Tata Usaha (TU)"
                  : "PIC (Pengelola Sistem)"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          <div>
            <p className="mb-2.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Menu Utama
            </p>

            <ul className="space-y-1.5">
              {actorMenus.length > 0 ? (
                actorMenus.map((menu) => {
                  const active = isMenuActive(menu.active);

                  return (
                    <li key={menu.url}>
                      <Link
                        href={menu.url}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${
                          active
                            ? "bg-white/15 text-white font-semibold"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon icon={menu.icon} width={22} height={22} />
                        <span className="text-sm font-medium">{menu.name}</span>
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-xl bg-white/5 px-4 py-3 text-xs text-white/50">
                  Belum ada menu untuk aktor ini.
                </li>
              )}
            </ul>
          </div>

        </div>

        <div className="mt-auto pt-4 border-t border-white/10">
          <Link
            href="/siproval"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon icon="solar:arrow-left-bold" width={20} height={20} />
            <span className="text-sm font-medium">Portal SIPROVAL</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
