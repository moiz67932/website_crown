// src/app/admin/errors/page.tsx
import { getSupabase } from "@/lib/supabase";
import { AlertCircle, XCircle, AlertTriangle, Info, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ErrorsPage() {
  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  const { data: errors } = await supa
    .from("errors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const criticalCount = errors?.filter((e: any) => e.severity === 'critical' || e.level === 'error').length || 0;
  const warningCount = errors?.filter((e: any) => e.severity === 'warning' || e.level === 'warn').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Error Logs & Monitoring</h1>
        <p className="text-sm text-slate-600 mt-1">System errors and alerts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Total Errors</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{errors?.length || 0}</div>
            </div>
            <AlertCircle className="text-slate-400" size={32} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Critical</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</div>
            </div>
            <XCircle className="text-red-400" size={32} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Warnings</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">{warningCount}</div>
            </div>
            <AlertTriangle className="text-yellow-400" size={32} />
          </div>
        </div>
      </div>

      {/* Error Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3 text-left font-medium text-slate-900">Severity</th>
                <th className="p-3 text-left font-medium text-slate-900">Message</th>
                <th className="p-3 text-left font-medium text-slate-900">Source</th>
                <th className="p-3 text-left font-medium text-slate-900">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {errors && errors.length > 0 ? (
                errors.map((error: any) => (
                  <tr key={error.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <SeverityBadge severity={error.severity || error.level} />
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900 line-clamp-1">
                        {error.message || error.error_message}
                      </div>
                      {error.stack && (
                        <div className="text-xs text-slate-500 font-mono mt-1 line-clamp-1">
                          {error.stack}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{error.source || error.endpoint || 'N/A'}</td>
                    <td className="p-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(error.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <Info size={48} className="mx-auto text-slate-300 mb-2" />
                    <div className="text-sm font-medium">No errors logged</div>
                    <div className="text-xs text-slate-400 mt-1">System is running smoothly</div>
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

function SeverityBadge({ severity }: { severity?: string }) {
  const config: Record<string, { color: string; label: string; icon: any }> = {
    critical: { color: "bg-red-100 text-red-700", label: "Critical", icon: XCircle },
    error: { color: "bg-red-100 text-red-700", label: "Error", icon: XCircle },
    warning: { color: "bg-yellow-100 text-yellow-700", label: "Warning", icon: AlertTriangle },
    warn: { color: "bg-yellow-100 text-yellow-700", label: "Warning", icon: AlertTriangle },
    info: { color: "bg-blue-100 text-blue-700", label: "Info", icon: Info },
  };
  const { color, label, icon: Icon } = config[severity || 'info'] || config.info;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}
