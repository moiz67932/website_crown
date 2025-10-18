// src/app/api/properties/[listingKey]/media/route.ts
import { NextResponse } from "next/server";
import { getPropertyMediaCached } from "@/lib/db/media-repo";

export const runtime = "nodejs"; // We use pg; ensure Node runtime

export async function GET(
  _req: Request,
  { params }: { params: { listingKey: string } }
) {
  const images = await getPropertyMediaCached(params.listingKey);

  return new NextResponse(
    JSON.stringify({ listingKey: params.listingKey, images }),
    {
      headers: {
        "Content-Type": "application/json",
        // CDN caching: 5 min hard, 1 day SWR
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
