import { use } from "react";
import EditLandingPageClient from "./EditLandingPageClient";

export default function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <EditLandingPageClient id={resolvedParams.id} />;
}
