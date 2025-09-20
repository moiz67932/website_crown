// src/components/admin/SyncControls.tsx
"use client";

import { useState } from "react";
import { Play, Pause, Zap, Activity } from "lucide-react";

export default function SyncControls() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function call(action: "start" | "stop" | "trigger" | "test") {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, syncType: "recent" }),
      });
      const j = await res.json();
      setStatus(JSON.stringify(j.data || j, null, 2));
    } finally {
      setLoading(false);
    }
  }

  async function indexStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vector-index");
      const j = await res.json();
      setStatus(JSON.stringify(j.data || j, null, 2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => call("start")} icon={<Play size={14} />}>Start scheduled</Btn>
        <Btn onClick={() => call("stop")} icon={<Pause size={14} />}>Stop</Btn>
        <Btn onClick={() => call("trigger")} icon={<Zap size={14} />}>Sync recent</Btn>
        <Btn onClick={() => call("test")} icon={<Activity size={14} />}>Test API</Btn>
        <Btn onClick={indexStats} icon={<Activity size={14} />}>Index status</Btn>
      </div>
      {status && (
        <pre className="text-xs bg-slate-50 border rounded p-3 max-h-48 overflow-auto">{status}</pre>
      )}
      {loading && <div className="text-xs text-slate-500">Working…</div>}
    </div>
  );
}

function Btn({
  onClick,
  children,
  icon,
}: {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
    >
      {icon}
      {children}
    </button>
  );
}
