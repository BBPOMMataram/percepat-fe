import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const rawPath = req.nextUrl.searchParams.get("path");
    if (!rawPath) {
        return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
    }

    const cleanPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
    const authUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";
    const authBase = authUrl.endsWith("/") ? authUrl.slice(0, -1) : authUrl;

    const targetUrl = cleanPath.startsWith("storage/")
        ? `${authBase}/${cleanPath}`
        : `${authBase}/storage/${cleanPath}`;

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            return NextResponse.json(
                { error: `File not found on auth server (status: ${response.status})` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "image/png";
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch signature" },
            { status: 500 }
        );
    }
}
