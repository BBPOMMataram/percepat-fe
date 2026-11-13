import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL_PDF?.trim();
  if (!apiBase) {
    return NextResponse.json(
      { detail: "NEXT_PUBLIC_BACKEND_URL_PDF belum dikonfigurasi." },
      { status: 503 },
    );
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(`${apiBase.replace(/\/+$/, "")}/compress`);
  } catch {
    return NextResponse.json(
      { detail: "Konfigurasi URL API PDF tidak valid." },
      { status: 500 },
    );
  }

  if (upstreamUrl.protocol !== "http:" && upstreamUrl.protocol !== "https:") {
    return NextResponse.json(
      { detail: "URL API PDF harus menggunakan HTTP atau HTTPS." },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { detail: "Permintaan unggah tidak valid." },
      { status: 400 },
    );
  }

  if (!(formData.get("file") instanceof File)) {
    return NextResponse.json(
      { detail: "File PDF wajib disertakan." },
      { status: 400 },
    );
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    const headers = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const contentType = upstreamResponse.headers.get("content-type");
    const contentDisposition = upstreamResponse.headers.get("content-disposition");
    const targetReached = upstreamResponse.headers.get("x-compression-target-reached");
    const resultSize = upstreamResponse.headers.get("x-compression-result-size");
    const targetSize = upstreamResponse.headers.get("x-compression-target-size");

    if (contentType) headers.set("Content-Type", contentType);
    if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
    if (targetReached) headers.set("X-Compression-Target-Reached", targetReached);
    if (resultSize) headers.set("X-Compression-Result-Size", resultSize);
    if (targetSize) headers.set("X-Compression-Target-Size", targetSize);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    });
  } catch (error) {
    console.error("PDF compression API request failed:", error);
    return NextResponse.json(
      { detail: "Tidak dapat terhubung ke layanan kompresi PDF." },
      { status: 502 },
    );
  }
}
