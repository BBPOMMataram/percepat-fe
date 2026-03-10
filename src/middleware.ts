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
  ];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

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
    "/percepat/:path*", // Added to protect all /percepat/* paths except /percepat
  ],
};
