// src/app/admin/leads/page.tsx
import { getSupabase } from "@/lib/supabase";
import { Users, TrendingUp, DollarSign, Target, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  const { data: leads } = await supa
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const totalLeads = leads?.length || 0;
  const avgScore = leads && leads.length > 0 
    ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length)
    : 0;

  const highValueLeads = leads?.filter((l: any) => (l.score || 0) >= 70).length || 0;
  const conversionReady = leads?.filter((l: any) => l.crm_status === 'qualified').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lead Management</h1>
        <p className="text-sm text-slate-600 mt-1">Manage and track all your leads</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Total Leads</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</div>
            </div>
            <Users className="text-primary-400" size={32} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Avg Score</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{avgScore}</div>
            </div>
            <TrendingUp className="text-accent-400" size={32} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">High Value</div>
              <div className="text-2xl font-bold text-success-600 mt-1">{highValueLeads}</div>
            </div>
            <DollarSign className="text-success-400" size={32} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Qualified</div>
              <div className="text-2xl font-bold text-warning-600 mt-1">{conversionReady}</div>
            </div>
            <Target className="text-warning-400" size={32} />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3 text-left font-medium text-slate-900">Lead</th>
                <th className="p-3 text-left font-medium text-slate-900">Contact</th>
                <th className="p-3 text-left font-medium text-slate-900">Location</th>
                <th className="p-3 text-left font-medium text-slate-900">Score</th>
                <th className="p-3 text-left font-medium text-slate-900">Status</th>
                <th className="p-3 text-left font-medium text-slate-900">Assigned</th>
                <th className="p-3 text-left font-medium text-slate-900">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads && leads.length > 0 ? (
                leads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-medium text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </div>
                      {lead.message && (
                        <div className="text-xs text-slate-500 line-clamp-1 mt-1">
                          {lead.message}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Mail size={12} />
                            <span className="text-xs">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone size={12} />
                            <span className="text-xs">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {lead.city || lead.state ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin size={12} />
                          <span className="text-xs">
                            {[lead.city, lead.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="p-3">
                      <StatusBadge status={lead.crm_status} />
                    </td>
                    <td className="p-3">
                      {lead.assigned_agent?.name ? (
                        <div className="text-xs text-slate-700">{lead.assigned_agent.name}</div>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-600">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score?: number }) {
  const value = score || 0;
  let color = "bg-slate-100 text-slate-700";
  if (value >= 70) color = "bg-green-100 text-green-700";
  else if (value >= 40) color = "bg-yellow-100 text-yellow-700";
  else if (value > 0) color = "bg-orange-100 text-orange-700";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {value}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    qualified: "bg-orange-100 text-orange-700",
    converted: "bg-green-100 text-green-700",
  };
  const color = colors[status || ""] || "bg-slate-100 text-slate-700";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status || 'pending'}
    </span>
  );
}
