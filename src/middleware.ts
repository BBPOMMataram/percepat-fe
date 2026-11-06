import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { pathname, search } = req.nextUrl;

  // ini untuk logika tambahan jika diperlukan nanti
  const protectedPaths = [
    "/admin",
    "/profile",
    "/settings",
    "/our-apps",
    "/siap-melayani/pengajuan-pkl/form",
    "/siap-melayani/presensi",
    "/simako/form-keluar",
    "/simako/dashboard",
    "/sismora",
    "/siproval",
  ];

  const isSiprovalWhatsNew = pathname.startsWith("/siproval/whats-new");

  const isProtected =
    protectedPaths.some((path) => pathname.startsWith(path)) &&
    !isSiprovalWhatsNew;

  if (!isProtected) return NextResponse.next();

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // ✅ Verifikasi token pakai jose (bisa di Edge)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // set role to some pages
    if (pathname.startsWith("/admin") && payload.role !== "superadmin" && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // SIPROVAL role-based authorization
    if (
      pathname.startsWith("/siproval") &&
      pathname !== "/siproval" &&
      !isSiprovalWhatsNew
    ) {
      const isSuperadmin =
        payload.role === "superadmin" ||
        payload.email === "hilmi.khairan@pom.go.id" ||
        (payload.role === "admin" &&
          Array.isArray(payload.sites) &&
          payload.sites.some(
            (s: { id?: number; name?: string }) =>
              Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval")
          ));
      const isBasukiKatim =
        payload.sub === "019ab8b3-4a06-7007-8337-2794c43cea4f" ||
        String(payload.email || "").toLowerCase() === "al.el.dul79@gmail.com" ||
        String(payload.name || "").toLowerCase().trim() === "basuki murdi hartono";
      const isKatimClaim = Boolean((payload as any).is_katim);
      const groupJabatanId =
        isBasukiKatim || isKatimClaim
          ? 3
          : payload.group_jabatan_id !== undefined && payload.group_jabatan_id !== null
          ? Number(payload.group_jabatan_id)
          : null;

      // Whitelist user Tata Usaha (TU)
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

      const userId = String(payload.sub || "").toLowerCase().trim();
      const userEmail = String(payload.email || "").toLowerCase().trim();
      const userNameClean = String(payload.name || "").toLowerCase().trim();

      const isExplicitTuUser =
        allowedTuIds.includes(userId) ||
        allowedTuEmails.includes(userEmail) ||
        allowedTuNames.includes(userNameClean) ||
        userNameClean.includes("syamsul hady") ||
        userNameClean.includes("syamsul hadi") ||
        userEmail.includes("syamsul.hady") ||
        userEmail.includes("syamsul.hadi");

      const hasFungsiTu =
        groupJabatanId !== 1 &&
        (Number((payload as any).fungsi_id) === 1 ||
          String((payload as any).fungsi || "").toLowerCase().includes("tata usaha"));

      const isTuUser =
        groupJabatanId !== 1 &&
        (groupJabatanId === 2 || isExplicitTuUser || hasFungsiTu);

      if (!isSuperadmin && groupJabatanId !== null) {
        // Rute Realisasi RO TU terbuka untuk semua aktor (TU, Kabalai, Katim) sesuai kebutuhan pengisian
        const isRealisasiRoPath = pathname.startsWith("/siproval/tu/realisasi-ro");

        const isKatimPath =
          pathname.startsWith("/siproval/katim") ||
          pathname.startsWith("/siproval/google-sheets");

        if (groupJabatanId === 3) {
          // Katim: boleh akses fitur katim dan realisasi-ro
          const allowed = isKatimPath || isRealisasiRoPath;
          if (!allowed) {
            return NextResponse.redirect(new URL("/siproval/katim", req.url));
          }
        } else if (groupJabatanId === 1) {
          // Kabalai: boleh akses fitur kabalai dan realisasi-ro
          const allowed =
            pathname.startsWith("/siproval/monev") ||
            pathname.startsWith("/siproval/show-monev") ||
            pathname.startsWith("/siproval/catatan") ||
            pathname.startsWith("/siproval/rhpk") ||
            pathname.startsWith("/siproval/arahan-pimpinan") ||
            pathname.startsWith("/siproval/kabalai") ||
            pathname.startsWith("/siproval/katim/entry-data-rhpk") ||
            isRealisasiRoPath;
          if (!allowed) {
            return NextResponse.redirect(new URL("/siproval/catatan", req.url));
          }
        } else if (isTuUser) {
          // TU: boleh akses seluruh fitur TU dan budget-mapping
          const allowed =
            pathname.startsWith("/siproval/tu") ||
            pathname.startsWith("/siproval/budget-mapping") ||
            pathname === "/siproval";
          if (!allowed) {
            return NextResponse.redirect(new URL("/siproval/tu", req.url));
          }
        } else {
          // Staf (4), OS (5), atau pegawai yang baru ditugaskan sebagai Katim.
          // Izinkan akses rute Katim agar divalidasi langsung oleh LayoutSiproval / backend API.
          if (!isRealisasiRoPath && !isKatimPath) {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
          }
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.log("Invalid token:", error);
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/our-apps/:path*",
    "/settings/:path*",
    "/siap-melayani/pengajuan-pkl/form/:path*",
    "/siap-melayani/presensi/:path*",
    "/percepat-new/:path*", // Added to protect all /percepat/* paths except /percepat
    "/simako/:path*",
    "/sismora",
    "/sismora/:path*",
    "/siproval/:path*",
  ],
};
