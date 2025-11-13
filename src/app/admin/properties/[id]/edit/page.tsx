import { use } from "react";
import EditPropertyPageClient from "./EditPropertyPageClient";

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <EditPropertyPageClient id={resolvedParams.id} />;
}

