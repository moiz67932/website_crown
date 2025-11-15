"use client";

import { useState, useEffect } from "react";
import { Building2, Search, Eye, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  property_type: string;
  status: string;
  listing_date: string;
  images?: string[];
}

interface PropertyStats {
  total: number;
  active: number;
  sold: number;
  pending: number;
}

export default function PropertiesManagementPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats>({ total: 0, active: 0, sold: 0, pending: 0 });
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [statusFilter, typeFilter, searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      
      const response = await fetch(`/api/admin/properties?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
        setStats(data.stats || { total: 0, active: 0, sold: 0, pending: 0 });
        setTotalProperties(data.pagination?.totalProperties || 0);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/admin/sync", { method: "POST" });
      if (response.ok) {
        alert("Sync started successfully! Properties will be updated in the background.");
        setTimeout(() => fetchProperties(), 2000);
      } else {
        alert("Failed to start sync");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Error starting sync");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="text-primary-600" size={32} />
            Property Management
          </h1>
          <p className="text-slate-600 mt-1">
            {loading ? 'Loading...' : `Showing ${properties.length} of ${totalProperties.toLocaleString()} properties`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Properties"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Properties" value={stats.total} color="blue" />
        <StatCard 
          title="Active Listings" 
          value={stats.active} 
          subtitle={stats.active === stats.total ? "All" : undefined}
          color="green" 
        />
        <StatCard 
          title="Sold" 
          value={stats.sold} 
          subtitle={stats.sold > 0 ? undefined : "None"}
          color="purple" 
        />
        <StatCard title="Pending" value={stats.pending} color="orange" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by address, city, or ZIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchProperties();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="land">Land</option>
          </select>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-primary-600" size={32} />
            <p className="text-slate-600">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-600">No properties found</p>
            <p className="text-slate-500 text-sm mt-2">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start by syncing properties from Trestle API'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Property</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Beds/Baths</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Sq Ft</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{property.address}</div>
                      <div className="text-sm text-slate-500">
                        {property.city}, {property.state} {property.zipcode}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ${property.price?.toLocaleString() || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {property.bedrooms || 0} / {property.bathrooms || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {property.square_feet?.toLocaleString() || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                        {property.property_type || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={property.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/properties/${property.id}`}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                          title="View"
                        >
                          <Eye size={16} className="text-slate-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  color,
  subtitle 
}: { 
  title: string; 
  value: number; 
  color: string;
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  }[color];

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <div className="text-sm font-medium text-slate-600 mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-3xl font-bold bg-gradient-to-r ${colorClasses} bg-clip-text text-transparent`}>
          {value.toLocaleString()}
        </div>
        {subtitle && (
          <div className="text-sm font-medium text-slate-500">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusLower = status?.toLowerCase() || "";
  const colors = {
    active: "bg-green-100 text-green-700 border-green-200",
    sold: "bg-purple-100 text-purple-700 border-purple-200",
    pending: "bg-orange-100 text-orange-700 border-orange-200",
  }[statusLower] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`px-2 py-1 text-xs font-medium border rounded ${colors}`}>
      {status || "Unknown"}
    </span>
  );
}
