"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Home,
  Users,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface OverviewStats {
  properties: {
    total: number;
    active: number;
    sold: number;
    pending: number;
    trend?: number;
  };
  blog: {
    total: number;
    published: number;
    draft: number;
    views: number;
    trend?: number;
  };
  landing: {
    total: number;
    published: number;
    views: number;
    trend?: number;
  };
  leads: {
    total: number;
    thisMonth: number;
    converted: number;
    trend?: number;
  };
  traffic: {
    totalViews: number;
    uniqueVisitors: number;
    avgSessionTime: number;
    bounceRate: number;
  };
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch REAL data from API
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to zero values if API fails
      setStats({
        properties: { total: 0, active: 0, sold: 0, pending: 0 },
        blog: { total: 0, published: 0, draft: 0, views: 0 },
        landing: { total: 0, published: 0, views: 0 },
        leads: { total: 0, thisMonth: 0, converted: 0 },
        traffic: { totalViews: 0, uniqueVisitors: 0, avgSessionTime: 0, bounceRate: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/admin/recent-activity");
      if (response.ok) {
        const data = await response.json();
        setActivities(data || []);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      setActivities([]);
    }
  };

  // Helper function to format time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  };

  // Helper function to get icon component
  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case "building":
        return <Building2 size={16} />;
      case "fileText":
        return <FileText size={16} />;
      case "home":
        return <Home size={16} />;
      case "users":
        return <Users size={16} />;
      default:
        return <Building2 size={16} />;
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-600 mt-1">Welcome to Crown Coastal Admin Dashboard</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatCard
          title="Total Properties"
          value={stats.properties.total}
          change={stats.properties.trend !== undefined ? stats.properties.trend : null}
          icon={<Building2 size={24} />}
          color="blue"
          link="/admin/properties"
        />
        <QuickStatCard
          title="Blog Posts"
          value={stats.blog.published}
          change={stats.blog.trend !== undefined ? stats.blog.trend : null}
          icon={<FileText size={24} />}
          color="green"
          link="/admin/posts"
        />
        <QuickStatCard
          title="Landing Pages"
          value={stats.landing.published}
          change={stats.landing.trend !== undefined ? stats.landing.trend : null}
          icon={<Home size={24} />}
          color="purple"
          link="/admin/landing"
        />
        <QuickStatCard
          title="New Leads"
          value={stats.leads.thisMonth}
          change={stats.leads.trend !== undefined ? stats.leads.trend : null}
          icon={<Users size={24} />}
          color="orange"
          link="/admin/leads"
        />
      </div>

      {/* Main Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties Overview */}
        <StatsCard title="Properties Overview" icon={<Building2 size={20} />}>
          <div className="space-y-3">
            <StatRow label="Total Properties" value={stats.properties.total} color="blue" />
            <StatRow label="Active Listings" value={stats.properties.active} color="green" />
            <StatRow label="Sold" value={stats.properties.sold} color="purple" />
            <StatRow label="Pending" value={stats.properties.pending} color="orange" />
          </div>
          <Link
            href="/admin/properties"
            className="block mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Manage Properties →
          </Link>
        </StatsCard>

        {/* Blog Overview */}
        <StatsCard title="Blog Overview" icon={<FileText size={20} />}>
          <div className="space-y-3">
            <StatRow label="Total Posts" value={stats.blog.total} color="blue" />
            <StatRow label="Published" value={stats.blog.published} color="green" />
            <StatRow label="Draft" value={stats.blog.draft} color="orange" />
            <StatRow label="Total Views" value={stats.blog.views.toLocaleString()} color="purple" />
          </div>
          <Link
            href="/admin/posts"
            className="block mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Manage Posts →
          </Link>
        </StatsCard>

        {/* Landing Pages Overview */}
        <StatsCard title="Landing Pages" icon={<Home size={20} />}>
          <div className="space-y-3">
            <StatRow label="Total Pages" value={stats.landing.total} color="blue" />
            <StatRow label="Published" value={stats.landing.published} color="green" />
            <StatRow label="Total Views" value={stats.landing.views.toLocaleString()} color="purple" />
          </div>
          <Link
            href="/admin/landing"
            className="block mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Manage Landing Pages →
          </Link>
        </StatsCard>

        {/* Traffic Overview */}
        <StatsCard title="Traffic Overview" icon={<TrendingUp size={20} />}>
          <div className="space-y-3">
            <StatRow label="Total Views" value={stats.traffic.totalViews.toLocaleString()} color="blue" />
            <StatRow
              label="Unique Visitors"
              value={stats.traffic.uniqueVisitors.toLocaleString()}
              color="green"
            />
            <StatRow
              label="Avg. Session Time"
              value={`${Math.floor(stats.traffic.avgSessionTime / 60)}:${(
                stats.traffic.avgSessionTime % 60
              )
                .toString()
                .padStart(2, "0")}`}
              color="purple"
            />
            <StatRow label="Bounce Rate" value={`${stats.traffic.bounceRate}%`} color="orange" />
          </div>
          <Link
            href="/admin/analytics"
            className="block mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View Analytics →
          </Link>
        </StatsCard>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <ActivityItem
                key={index}
                title={activity.title}
                description={activity.description}
                time={timeAgo(activity.time)}
                icon={getActivityIcon(activity.icon)}
              />
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Sync Properties"
          description="Update properties from Trestle API"
          link="/admin/properties"
          color="blue"
        />
        <QuickActionCard
          title="Create Blog Post"
          description="Write a new blog post"
          link="/admin/posts/new"
          color="green"
        />
        <QuickActionCard
          title="Bulk Operations"
          description="Perform bulk actions"
          link="/admin/bulk"
          color="purple"
        />
      </div>
    </div>
  );
}

function QuickStatCard({
  title,
  value,
  change,
  icon,
  color,
  link,
}: {
  title: string;
  value: number;
  change: number | null;
  icon: React.ReactNode;
  color: string;
  link: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  }[color];

  // Format the change text
  const formatChange = (changeValue: number | null) => {
    if (changeValue === null || changeValue === undefined) return null;
    
    // For landing pages, show absolute number
    if (title === "Landing Pages") {
      return changeValue > 0 ? `+${changeValue}` : changeValue === 0 ? '0' : `${changeValue}`;
    }
    
    // For others, show percentage
    const sign = changeValue > 0 ? '+' : '';
    return `${sign}${changeValue}%`;
  };

  const changeText = formatChange(change);
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;
  const changeColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-500';

  return (
    <Link href={link}>
      <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br ${colorClasses} rounded-lg text-white`}>{icon}</div>
          {changeText !== null && (
            <span className={`text-sm font-medium ${changeColor}`}>{changeText}</span>
          )}
        </div>
        <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
        <div className="text-sm text-slate-600 mt-1">{title}</div>
      </div>
    </Link>
  );
}

function StatsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary-600">{icon}</span>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  }[color];

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`font-semibold ${colorClasses}`}>{value}</span>
    </div>
  );
}

function ActivityItem({
  title,
  description,
  time,
  icon,
}: {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition">
      <div className="p-2 bg-primary-50 rounded-lg text-primary-600">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-slate-900">{title}</div>
        <div className="text-sm text-slate-600">{description}</div>
      </div>
      <span className="text-xs text-slate-500">{time}</span>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  link,
  color,
}: {
  title: string;
  description: string;
  link: string;
  color: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
  }[color];

  return (
    <Link href={link}>
      <div
        className={`bg-gradient-to-br ${colorClasses} rounded-xl p-6 text-white shadow-md hover:shadow-lg transition cursor-pointer`}
      >
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </Link>
  );
}
