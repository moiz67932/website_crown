import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) return new NextResponse("Missing url", { status: 400 });
    if (!/^https?:\/\//i.test(url)) return new NextResponse("Invalid url", { status: 400 });

    const upstream = await fetch(url, { next: { revalidate: 60 } });
    if (!upstream.ok || !upstream.body) return new NextResponse("", { status: 502 });

    const headers = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    const cl = upstream.headers.get("content-length");
    if (cl) headers.set("content-length", cl);
    headers.set("cache-control", "public, max-age=600, s-maxage=600, stale-while-revalidate=300");

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err) {
    console.error("/api/media error", err);
    return new NextResponse("", { status: 500 });
  }
}
