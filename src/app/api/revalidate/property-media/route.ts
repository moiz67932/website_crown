// src/app/api/revalidate/property-media/route.ts
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { secret, listingKey } = await req.json();
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!listingKey) {
    return NextResponse.json({ ok: false, error: "listingKey-required" }, { status: 400 });
  }

  revalidateTag(`property:${listingKey}`);
  return NextResponse.json({ ok: true, revalidated: [`property:${listingKey}`] });
}
