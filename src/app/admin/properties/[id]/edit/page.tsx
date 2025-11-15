import { use } from "react";
import EditPropertyPageClient from "./EditPropertyPageClient";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <EditPropertyPageClient id={resolvedParams.id} />;
}

