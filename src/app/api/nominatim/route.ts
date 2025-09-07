import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response(JSON.stringify({ error: "Missing url" }), { status: 400 });
  }

  const resp = await fetch(url, {
    headers: { "User-Agent": "my-next-app/1.0 (me@example.com)" }, // Nominatim requires UA
  });

  const data = await resp.text();
  return new Response(data, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
