"use client";
import { useState, useRef, useEffect } from "react";

export default function NewsletterInline({ city }: { city?: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err" | "loading">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const emailOk = /.+@.+\..+/.test(email);
  const startRef = useRef<number>(Date.now());
  const [hp, setHp] = useState("");

  useEffect(() => { startRef.current = Date.now(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk) return;
    setStatus("loading"); setMsg(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, city, __top: Date.now() - startRef.current, company: hp }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Error");
      setStatus("ok");
      setMsg("Subscribed. Welcome aboard!");
      setEmail("");
      setHp("");
    } catch (e: any) { setStatus("err"); setMsg(e.message); }
  }

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <div className="font-semibold mb-2">Get local market insights</div>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" className="flex-1 border rounded px-3 py-2" required />
        <input value={hp} onChange={e=>setHp(e.target.value)} name="company" className="hidden" aria-hidden="true" />
        <button disabled={!emailOk || status==='loading'} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50">
          {status==='loading' ? 'Joining…' : 'Join Newsletter'}
        </button>
      </form>
      {msg && <div className="text-sm text-slate-600 mt-2">{msg}</div>}
    </div>
  );
}
