import { NextRequest, NextResponse } from "next/server";

/**
 * Development-only bridge used to exercise the Field Mode flow locally.
 * It adds the server-held ingest key without exposing it to browser code.
 * Production manual entry must use authenticated, role-based server handling.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Field Mode cloud write belum tersedia di produksi. Autentikasi petugas diperlukan." },
      { status: 403 },
    );
  }

  const ingestKey = process.env.JERNIH_INGEST_API_KEY;
  if (!ingestKey) {
    return NextResponse.json({ error: "Server belum dikonfigurasi untuk ingest." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const upstreamResponse = await fetch(new URL("/api/readings", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-jernih-ingest-key": ingestKey,
    },
    body: JSON.stringify(body),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
