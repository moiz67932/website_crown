// /src/app/properties/[slug]/[id]/page.tsx
import PropertyDetailPageClient from "./PropertyDetailPage.client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; slug?: string }>;
}) {
  const resolved = await params;
  return <PropertyDetailPageClient id={resolved.id} />;
}
