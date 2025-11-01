// src/app/api/properties/[listingKey]/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPropertyMediaCached } from "../../../../../lib/db/media-repo";

export const runtime = "nodejs"; // We use pg; ensure Node runtime

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingKey: string }> }
) {
  const { listingKey } = await params;
  const images = await getPropertyMediaCached(listingKey);

  return new NextResponse(
  JSON.stringify({ listingKey, images }),
    {
      headers: {
        "Content-Type": "application/json",
        // CDN caching: 5 min hard, 1 day SWR
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
