import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token"); // contoh pakai JWT di cookie
  const { pathname, search } = req.nextUrl;

  // daftar halaman yang perlu login
  const protectedPaths = [
    "/admin",
    "/profile",
    "/settings",
    "/our-apps",
    "/siap-melayani/pengajuan-pkl/form",
    "/siap-melayani/presensi"
  ];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// halaman mana saja yang dipantau
export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/our-apps/:path*",
    "/settings/:path*",
    "/siap-melayani/pengajuan-pkl/form/:path*",
    "/siap-melayani/presensi/:path*"
  ],
};
