"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings2, 
  Search
} from 'lucide-react';
import { useDashboard } from '@/components/DashboardProvider';
import { groupEventsIntoSessions } from '@/lib/sessionUtils';
import { cn } from '@/lib/utils';

export default function SessionsPage() {
  const { setTitle, setSubtitle, refreshTrigger } = useDashboard();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gapThreshold, setGapThreshold] = useState(120);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>('all');

  useEffect(() => {
    setTitle("User Sessions");
    setSubtitle("Detailed logs of network activity sessions grouped by continuity.");
  }, [setTitle, setSubtitle]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api-router-dev.indirex.io/api/router-event");
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
    if (timeRange !== 'all') {
      const now = Date.now() / 1000;
      const hours = parseInt(timeRange);
      filteredData = data.filter(d => (now - d.timestamp) <= hours * 3600);
    }
    return groupEventsIntoSessions(filteredData, gapThreshold);
  }, [data, gapThreshold, timeRange]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Controls */}
      {/* <div className="bg-brand-card/50 border border-brand-border rounded-[2rem] p-8 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-brand-accent/10 rounded-2xl border border-brand-accent/20">
              <Settings2 className="text-brand-accent h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl tracking-tight">Continuity Parameters</h3>
              <p className="text-xs text-brand-muted mt-1">Fine-tune session detection thresholds.</p>
            </div>
          </div>

          <div className="flex-1 max-w-md space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-brand-muted uppercase tracking-widest">Gap Threshold</label>
              <span className="font-mono text-brand-accent text-lg font-bold">{gapThreshold}s</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="600" 
              step="5"
              value={gapThreshold} 
              onChange={(e) => setGapThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-accent"
            />
          </div>

          <div className="flex items-center gap-2 bg-brand-bg p-1 rounded-xl border border-brand-border">
            {(['1h', '6h', '24h', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all uppercase tracking-wider",
                  timeRange === range 
                    ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" 
                    : "text-brand-muted hover:text-brand-text"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div> */}

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
                className="bg-brand-bg border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-brand-accent outline-none w-64"
              />
            </div>
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
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">IP</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Hostname</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">MAC Address</th>
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
                    <span className="text-xs font-mono text-brand-muted">{session.ip}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="font-bold text-brand-text group-hover:text-brand-accent transition-colors">{session.hostname}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-mono text-brand-muted">{session.mac}</span>
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

