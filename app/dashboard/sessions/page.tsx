"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings2, 
  Search,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import { useDashboard } from '@/components/DashboardProvider';
import { groupEventsIntoSessions } from '@/lib/sessionUtils';
import { cn } from '@/lib/utils';
import DatePicker from 'react-datepicker';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';

export default function SessionsPage() {
  const { setTitle, setSubtitle, refreshTrigger } = useDashboard();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gapThreshold, setGapThreshold] = useState(120);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New filters
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedRouter, setSelectedRouter] = useState<string>('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');

  useEffect(() => {
    setTitle("User Sessions");
    setSubtitle("Detailed logs of network activity sessions grouped by continuity.");
  }, [setTitle, setSubtitle]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:4000/api/router-event");
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const fetchedData = await response.json();
      setData(fetchedData);
    } catch (err: any) {
      console.warn("API fetch failed, using mock data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const allSessions = useMemo(() => {
    let filteredData = data;
    
    // Time filtering
    if (timeRange === 'custom' && startDate && endDate) {
      const startTs = startDate.getTime() / 1000;
      const endTs = endDate.getTime() / 1000;
      filteredData = data.filter(d => d.timestamp >= startTs && d.timestamp <= endTs);
    } else if (timeRange !== 'all' && timeRange !== 'custom') {
      const now = Date.now() / 1000;
      const hours = parseInt(timeRange);
      filteredData = data.filter(d => (now - d.timestamp) <= hours * 3600);
    }
    
    const sessions = groupEventsIntoSessions(filteredData, gapThreshold);
    
    // Field filtering
    return sessions.filter(s => {
      const matchesSearch = !searchTerm || [
        s.hostname, s.meterId, s.platform, s.category, s.hhid, s.member, s.deviceType
      ].some(val => val.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesMember = selectedMember === 'all' || s.member === selectedMember;
      const matchesRouter = selectedRouter === 'all' || s.meterId === selectedRouter;
      const matchesDeviceType = selectedDeviceType === 'all' || s.deviceType === selectedDeviceType;
      
      return matchesSearch && matchesMember && matchesRouter && matchesDeviceType;
    });
  }, [data, gapThreshold, timeRange, startDate, endDate, searchTerm, selectedMember, selectedRouter, selectedDeviceType]);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const sessions = groupEventsIntoSessions(data, gapThreshold);
    return {
      members: ['all', ...Array.from(new Set(sessions.map(s => s.member)))],
      routers: ['all', ...Array.from(new Set(sessions.map(s => s.meterId)))],
      deviceTypes: ['all', ...Array.from(new Set(sessions.map(s => s.deviceType)))]
    };
  }, [data, gapThreshold]);

  const handleExport = () => {
    if (allSessions.length === 0) return;

    const headers = [
      "Router ID", "HHID", "Member", "Device Type", "Hostname", "Platform", "Category", "Start Time", "End Time", "Duration (s)"
    ];

    const rows = allSessions.map(s => [
      s.meterId,
      s.hhid,
      s.member,
      s.deviceType,
      s.hostname,
      s.platform,
      s.category,
      new Date(s.startTime * 1000).toLocaleString(),
      new Date(s.endTime * 1000).toLocaleString(),
      s.duration
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sessions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Filter Controls */}
      <div className="bg-brand-card/50 border border-brand-border rounded-[2rem] p-8 shadow-xl backdrop-blur-md space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-brand-accent/10 rounded-2xl border border-brand-accent/20">
              <Filter className="text-brand-accent h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl tracking-tight">Session Filters</h3>
              <p className="text-xs text-brand-muted mt-1">Refine logs by member, router, type, or time.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Time Presets */}
            <div className="flex items-center gap-2 bg-brand-bg p-1 rounded-xl border border-brand-border">
              {(['1h', '6h', '24h', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => { setTimeRange(range); setStartDate(null); setEndDate(null); }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all uppercase tracking-wider",
                    timeRange === range && !startDate
                      ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" 
                      : "text-brand-muted hover:text-brand-text"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Custom Date Picker */}
            <div className="flex items-center gap-3 bg-brand-bg/80 p-2 px-4 rounded-xl border border-brand-border shadow-inner">
              <Calendar size={14} className="text-brand-accent" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  const [start, end] = update;
                  setStartDate(start);
                  setEndDate(end);
                  if (start) setTimeRange('custom');
                }}
                isClearable={true}
                placeholderText="Custom Range"
                className="bg-transparent text-xs text-brand-text font-bold outline-none cursor-pointer w-40"
                dateFormat="MMM d, yyyy"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Member Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest px-1">Member</label>
            <select 
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
            >
              {filterOptions.members.map(m => (
                <option key={m} value={m}>{m === 'all' ? 'All Members' : m}</option>
              ))}
            </select>
          </div>

          {/* Router Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest px-1">Router</label>
            <select 
              value={selectedRouter}
              onChange={(e) => setSelectedRouter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
            >
              {filterOptions.routers.map(r => (
                <option key={r} value={r}>{r === 'all' ? 'All Routers' : r}</option>
              ))}
            </select>
          </div>

          {/* Device Type Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest px-1">Device Type</label>
            <select 
              value={selectedDeviceType}
              onChange={(e) => setSelectedDeviceType(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
            >
              {filterOptions.deviceTypes.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-brand-card/40 border border-brand-border rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="px-10 py-8 border-b border-brand-border flex items-center justify-between bg-brand-bg/20">
          <div>
            <h3 className="font-bold text-xl tracking-tight">Session Activity Logs</h3>
            <p className="text-xs text-brand-muted mt-1 font-medium italic">Detailed breakdown of all detected network sessions.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search sessions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-brand-accent outline-none w-64"
              />
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-2 bg-brand-accent text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-brand-accent/30 transition-all active:scale-95"
            >
              <Download size={14} />
              Export CSV
            </button>
            <div className="px-4 py-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl">
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">{allSessions.length} Total Sessions</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-brand-bg/40 text-brand-muted border-b border-brand-border">
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Router ID</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">HHID</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Member</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Device Type</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Hostname</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Platform</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Category</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Start Time</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">End Time</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Total Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {allSessions.slice().reverse().map((session) => (
                <tr key={session.id} className="hover:bg-brand-accent/5 transition-all group cursor-default">
                  <td className="px-10 py-6">
                    <span className="font-mono text-xs text-brand-muted bg-brand-bg px-2 py-1 rounded border border-brand-border">{session.meterId}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-mono text-brand-muted">{session.hhid}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="font-bold text-brand-text group-hover:text-brand-accent transition-colors">{session.member}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{session.deviceType}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-bold text-brand-text/80">{session.hostname}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-bold text-brand-text/80">{session.platform}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-tighter">{session.category}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-mono text-brand-text/70">{new Date(session.startTime * 1000).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-mono text-brand-text/70">{new Date(session.endTime * 1000).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className="inline-block px-4 py-1.5 bg-brand-bg border border-brand-border rounded-xl font-mono text-xs font-bold text-brand-accent shadow-sm">
                      {session.duration}s
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

