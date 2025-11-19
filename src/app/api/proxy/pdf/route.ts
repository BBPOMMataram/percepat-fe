import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const filePath = req.nextUrl.searchParams.get("path");
    if (!filePath) {
        return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    // Gabungkan dengan base URL backend
    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI; // misal: https://api.webku.id
    const fullUrl = `${apiBase}/storage/${filePath}`;

    // Ambil file dari backend
    const res = await fetch(fullUrl, {
        headers: {
            // kalau butuh auth token/cookie, kirim di sini
            // Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline", // bisa ganti ke attachment untuk force download
        },
    });
}
