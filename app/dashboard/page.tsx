"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Smartphone,
  Globe,
  Layers,
  ListChecks
} from 'lucide-react';

// Modular Components
import { StatCard } from '@/components/StatCard';
import { TrafficChart } from '@/components/TrafficChart';
import { PlatformChart } from '@/components/PlatformChart';
import { DataTable, type RowData } from '@/components/DataTable';
import { findValue } from '@/lib/dataUtils';
import { useDashboard } from '@/components/DashboardProvider';

// --- Mock Data (Fallback) ---

const MOCK_TABLE_DATA: RowData[] = [
  { id: 1, deviceId: 'Router00003', timestamp: 1740933701, type: 10, details: { domain_activity: { platform: 'Windows', category: 'OTHER', event: 'connected', hostname: 'DESKTOP-OCOPN N4', mac: 'F8:5E:A0:DD:98:01', source_ip_v4: '192.168.3.109' } } },
  { id: 2, deviceId: 'Router00008', timestamp: 1740919478, type: 10, details: { domain_activity: { platform: 'Android', category: 'STREAMING', event: 'active', hostname: 'Pixel-7-Pro', mac: 'A4:5E:B0:CC:12:34', source_ip_v4: '192.168.1.10' } } },
  { id: 3, deviceId: 'Router00001', timestamp: 1740893400, type: 10, details: { domain_activity: { platform: 'iOS', category: 'SOCIAL', event: 'connected', hostname: 'iPhone-15', mac: 'C1:22:D3:E4:F5:66', source_ip_v4: '192.168.0.5' } } },
  { id: 4, deviceId: 'Router00005', timestamp: 1740924922, type: 10, details: { domain_activity: { platform: 'Linux', category: 'DEVELOPMENT', event: 'active', hostname: 'Workstation-01', mac: 'E2:44:A1:B2:C3:D4', source_ip_v4: '192.168.1.55' } } },
];

const CHART_DATA = [
  { time: '00:00', traffic: 120 },
  { time: '04:00', traffic: 80 },
  { time: '08:00', traffic: 450 },
  { time: '12:00', traffic: 890 },
  { time: '16:00', traffic: 670 },
  { time: '20:00', traffic: 980 },
  { time: '23:59', traffic: 340 },
];

export default function DashboardPage() {
  // User's data fetching logic
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const { autoRefresh, refreshTrigger, setTitle, setSubtitle } = useDashboard();
  const [refreshInterval] = useState<number>(5);

  useEffect(() => {
    setTitle("Network Activity");
    setSubtitle("Real-time monitoring of connected devices and traffic.");
  }, [setTitle, setSubtitle]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api-router-dev.indirex.io/dashboard", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const fetchedData: RowData[] = await response.json();
      setData(fetchedData);
    } catch (err: any) {
      console.warn("API fetch failed, using mock data:", err.message);
      setData(MOCK_TABLE_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchData, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalEvents = data.length;
    
    const activeDevices = data.filter(item => {
      const event = findValue(item.details, "event");
      return event === "connected" || event === "active";
    }).length;

    const uniqueIPs = new Set(
      data.map(item => findValue(item.details, ["source_ip_v4", "ip", "ip_v4"]))
          .filter(Boolean)
    ).size;

    const uniquePlatforms = new Set(
      data.map(item => findValue(item.details, "platform"))
          .filter(Boolean)
    ).size;

    return {
      totalEvents,
      activeDevices,
      uniqueIPs,
      uniquePlatforms
    };
  }, [data]);

  // Calculate platform distribution from real data
  const platformStats = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const platform = findValue(item.details, "platform") || "Unknown";
      counts[platform] = (counts[platform] || 0) + 1;
    });
    
    const total = data.length || 1;
    const colors = ['#0ea5e9', '#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#8b5cf6'];
    
    return Object.entries(counts).map(([name, count], index) => ({
      name,
      count: Math.round((count / total) * 100),
      color: colors[index % colors.length]
    })).sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Connections" 
          value={stats.activeDevices.toString()} 
          icon={Smartphone} 
          trend={stats.activeDevices > 0 ? "+1" : "0"} 
        />
        <StatCard 
          title="Total Event Logs" 
          value={stats.totalEvents.toString()} 
          icon={ListChecks} 
          trend={stats.totalEvents > 0 ? `+${stats.totalEvents}` : "0"} 
        />
        <StatCard 
          title="Unique Source IPs" 
          value={stats.uniqueIPs.toString()} 
          icon={Globe} 
        />
        <StatCard 
          title="Detected Platforms" 
          value={stats.uniquePlatforms.toString()} 
          icon={Layers} 
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* <div className="lg:col-span-2">
          <TrafficChart data={CHART_DATA} />
        </div>
        <div>
          <PlatformChart data={platformStats} />
        </div> */}
      </div>

      {/* Data Table */}
      <DataTable data={data} />
    </div>
  );
}
