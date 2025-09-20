// src/components/admin/PostActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PostActions({
  id,
  slug,
  status,
}: {
  id: string;
  slug: string;
  status: "draft" | "published" | "scheduled";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: "published" | "draft" | "scheduled") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Failed");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    const url = `${location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      // quick visual feedback is fine
    });
  }

  return (
    <div className="inline-flex gap-2">
      <Link
        href={`/admin/posts/${id}`}
        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
      >
        Edit
      </Link>
      {status !== "published" ? (
        <button
          disabled={busy}
          onClick={() => setStatus("published")}
          className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-50"
        >
          Publish
        </button>
      ) : (
        <button
          disabled={busy}
          onClick={() => setStatus("draft")}
          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
        >
          Unpublish
        </button>
      )}
      <button onClick={copy} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">
        Copy link
      </button>
    </div>
  );
}
