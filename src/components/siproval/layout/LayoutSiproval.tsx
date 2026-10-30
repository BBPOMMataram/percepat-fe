"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";

export default function LayoutSiproval({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  const router = useRouter();
  const pathname = usePathname();

  // Panggil getUser untuk mengecek sesi aktif saat Siproval diakses
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // Logika Pengalihan (Route Guard & Otorisasi Aktor)
  useEffect(() => {
    const isPublicPage =
      pathname === "/siproval" ||
      pathname?.startsWith("/siproval/whats-new") ||
      pathname?.startsWith("/whats-new");

    // Jika di halaman publik luar sistem (Landing & What's New), jangan paksa redirect
    if (isPublicPage) {
      return;
    }

    // Jika loading selesai dan user tidak ada, arahkan ke login
    if (loading === false && !user) {
      router.push(`/login?redirectUrl=${pathname}`);
      return;
    }

    if (loading === false && user) {
      const allowedPicEmails = [
        "fatimah.wulandari@pom.go.id",
        "fatimah.wulandari03@gmail.com",
        "hilmi.khairan@pom.go.id",
        "nanang.setyadi@pom.go.id",
      ];
      const allowedPicNames = [
        "fatimah tri wulandari",
        "fatimah t. wulandari",
        "hilmi khairan",
        "nanang setyadi santoso",
      ];
      const allowedTuIds = [
        "019ab8b3-2885-7125-857c-ee07c4febdc0", // Fatimah Tri Wulandari
        "019ab8b3-493b-71d8-abd5-01c8ebcaf50e", // Fatimah T. Wulandari
        "019ab8b3-2fca-71ee-ba81-e33f70548c10", // Hilmi Khairan
        "019ab8b3-1fb0-73ef-af89-ad09ef30f76f", // Nanang Setyadi Santoso
        "019ab8b3-3a1c-73e0-ad51-4e07c7a343cc", // Syamsul Hady
      ];
      const allowedTuEmails = [
        "fatimah.wulandari@pom.go.id",
        "fatimah.wulandari03@gmail.com",
        "hilmi.khairan@pom.go.id",
        "nanang.setyadi@pom.go.id",
        "syamsul.hady@pom.go.id",
        "syamsul.hadi@pom.go.id",
      ];
      const allowedTuNames = [
        "fatimah tri wulandari",
        "fatimah t. wulandari",
        "hilmi khairan",
        "nanang setyadi santoso",
        "syamsul hady",
        "syamsul hadi",
      ];

      const userId = String(user.id || "")
        .toLowerCase()
        .trim();
      const userEmail = (user.email || "").toLowerCase().trim();
      const userNameClean = (user.name || "").toLowerCase().trim();

      const isExplicitTuUser =
        allowedTuIds.includes(userId) ||
        allowedTuEmails.includes(userEmail) ||
        allowedTuNames.includes(userNameClean) ||
        userNameClean.includes("syamsul hady") ||
        userNameClean.includes("syamsul hadi") ||
        userEmail.includes("syamsul.hady") ||
        userEmail.includes("syamsul.hadi");

      const groupJabatanId = user.employee?.group_jabatan_id;
      const isKatimFromTable =
        Array.isArray(user.katims) && user.katims.length > 0;
      const isKatim = groupJabatanId === 3 || isKatimFromTable;

      const hasFungsiTu =
        !isKatim &&
        (Number(user.employee?.fungsi_id) === 1 ||
          (user.employee?.fungsi?.name || "").toLowerCase().trim() ===
            "tata usaha");

      const hasTuAccess = isExplicitTuUser || hasFungsiTu;

      const isSuperadmin =
        user.role?.level === "superadmin" ||
        allowedPicEmails.includes(userEmail) ||
        allowedPicNames.includes(userNameClean) ||
        (user.role?.level === "admin" &&
          Array.isArray(user.sites) &&
          user.sites.some(
            (s: { id?: number; name?: string }) =>
              Number(s?.id) === 3 ||
              s?.name?.toLowerCase().includes("siproval"),
          ));

      // Di landing portal /siproval dan What's New tetap diizinkan
      if (isPublicPage) {
        return;
      }

      // Rute fitur TU (Dashboard TU, Realisasi RO, Budget Mapping, Laporan Evaluasi)
      // Hanya dapat diakses oleh user dengan fungsi Tata Usaha yang diizinkan (Fatimah, Hilmi, Nanang)
      const isTuPath =
        pathname.startsWith("/siproval/tu") ||
        pathname.startsWith("/siproval/budget-mapping");

      if (isTuPath && !hasTuAccess) {
        if (isKatim) {
          router.push("/siproval/katim");
        } else if (groupJabatanId === 1) {
          router.push("/siproval/monev");
        } else if (isSuperadmin) {
          router.push("/siproval");
        } else {
          router.push("/unauthorized");
        }
        return;
      }

      // Jika bukan superadmin / PIC Siproval, batasi akses berdasarkan group_jabatan & tabel katims
      if (!isSuperadmin) {
        // Katim (group_jabatan_id == 3 atau terdaftar di tabel katims)
        if (isKatim) {
          const isAllowed =
            pathname.startsWith("/siproval/katim") ||
            pathname.startsWith("/siproval/google-sheets") ||
            (hasTuAccess && isTuPath);
          if (!isAllowed) {
            router.push("/siproval/katim");
          }
        }
        // Kabalai (group_jabatan_id == 1)
        else if (groupJabatanId === 1) {
          const isAllowed =
            pathname.startsWith("/siproval/monev") ||
            pathname.startsWith("/siproval/show-monev") ||
            pathname.startsWith("/siproval/catatan") ||
            pathname.startsWith("/siproval/rhpk") ||
            pathname.startsWith("/siproval/arahan-pimpinan") ||
            (hasTuAccess && isTuPath);
          if (!isAllowed) {
            router.push("/siproval/monev");
          }
        }
        // User dengan akses TU
        else if (hasTuAccess) {
          const isAllowed = isTuPath || pathname === "/siproval";
          if (!isAllowed) {
            router.push("/siproval/tu");
          }
        }
        // Staf (4), OS (5), dll yang tidak memiliki akses
        else {
          router.push("/unauthorized");
        }
      }
    }
  }, [user, loading, router, pathname]);

  // Tampilkan loading spinner selama proses pengecekan atau jika user kosong
  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <span className="loading loading-spinner loading-lg text-emerald-600"></span>
      </div>
    );
  }

  // Jika user ada (sudah login), render halaman Siproval
  return <div className="min-h-screen font-sans">{children}</div>;
}
