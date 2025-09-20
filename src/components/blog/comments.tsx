"use client";
import { useEffect, useState } from "react";

type Comment = { id: string; author_name: string | null; body: string; created_at: string };

export default function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const emailOk = true;

  useEffect(() => {
    let mounted = true;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((j) => mounted && setComments(j.comments || []))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);

    // optimistic add
    const temp: Comment = {
      id: `temp-${Date.now()}`,
      author_name: author.trim() || "Anonymous",
      body: body.trim(),
      created_at: new Date().toISOString(),
    };
    setComments((c) => [temp, ...c]);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, author_name: temp.author_name, body: temp.body }),
      });
      const j = await res.json();
      if (j.ok && j.comment) {
        setComments((c) => [j.comment, ...c.filter((x) => x.id !== temp.id)]);
      }
      setAuthor("");
      setBody("");
    } catch {
      // rollback optimistic on hard failure
      setComments((c) => c.filter((x) => x.id !== temp.id));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Comments</h2>

      {loading ? <div className="text-sm text-slate-500">Loading…</div> : (
        <ul className="space-y-3 mb-6">
          {comments.map((c) => (
            <li key={c.id} className="border rounded p-3 bg-white">
              <div className="text-sm text-slate-600 mb-1">
                {c.author_name || "Anonymous"} • {new Date(c.created_at).toLocaleDateString()}
              </div>
              <div>{c.body}</div>
            </li>
          ))}
          {!comments.length && <div className="text-sm text-slate-500">Be the first to comment.</div>}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-3">
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name (optional)" className="w-full border rounded px-3 py-2" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your comment" className="w-full border rounded px-3 py-2 h-28" required />
  <button disabled={submitting || !body.trim()} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50 hover:cursor-pointer">
          {submitting ? "Sending…" : "Submit Comment"}
        </button>
      </form>
    </div>
  );
}
