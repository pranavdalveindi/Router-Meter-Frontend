"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Clock, 
  Settings2, 
  Activity,
  ChevronRight,
  BarChart3,
  LayoutDashboard,
  Smartphone,
  Info,
  ArrowLeft,
  Server,
  Monitor,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/components/DashboardProvider';
import { groupEventsIntoSessions, type Session } from '@/lib/sessionUtils';
import { cn } from '@/lib/utils';
import * as d3 from 'd3';

// --- Session Gantt Chart Component ---
const SessionGantt = ({ 
  sessions,
  yField = 'platform'
}: { 
  sessions: Session[],
  yField?: keyof Session
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || sessions.length === 0) return;

    const container = containerRef.current;
    const margin = { top: 60, right: 60, bottom: 40, left: 180 };
    const width = container.clientWidth - margin.left - margin.right;
    const rowHeight = 60;
    
    // Group sessions by Y-axis key (e.g., platform)
    const groups = d3.group(sessions, d => d[yField] as string);
    const yDomain = Array.from(groups.keys());
    
    const height = Math.max(400, yDomain.length * rowHeight) + margin.top + margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const minTime = d3.min(sessions, d => d.startTime) || 0;
    const maxTime = d3.max(sessions, d => d.endTime) || Date.now() / 1000;

    const x = d3.scaleLinear()
      .domain([minTime, maxTime])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(yDomain)
      .range([0, height - margin.top - margin.bottom])
      .padding(0.4);

    // Axes
    const xAxis = d3.axisTop(x)
      .ticks(10)
      .tickFormat(d => {
        const date = new Date((d as number) * 1000);
        return d3.timeFormat("%H:%M:%S")(date);
      });

    svg.append("g")
      .attr("class", "x-axis")
      .call(xAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)"))
      .call(g => g.selectAll(".tick text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", "10px"));

    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(x)
        .ticks(10)
        .tickSize(height - margin.top - margin.bottom)
        .tickFormat(() => "")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.05)"));

    // Rows
    const rows = svg.selectAll(".row")
      .data(yDomain)
      .enter()
      .append("g")
      .attr("class", "row-group");

    // Row backgrounds
    rows.append("rect")
      .attr("x", -margin.left)
      .attr("y", d => y(d)!)
      .attr("width", width + margin.left)
      .attr("height", y.bandwidth())
      .attr("fill", "rgba(255,255,255,0.02)")
      .attr("rx", 12);

    // Row Labels
    rows.append("text")
      .attr("x", -20)
      .attr("y", d => y(d)! + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("fill", "rgba(255,255,255,0.9)")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .text(d => d);

    // Color scale for platforms
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Session bars
    const bars = svg.selectAll(".session-bar")
      .data(sessions)
      .enter()
      .append("rect")
      .attr("class", "session-bar")
      .attr("x", d => x(d.startTime))
      .attr("y", d => y(d[yField] as string)!)
      .attr("width", d => Math.max(10, x(d.endTime) - x(d.startTime)))
      .attr("height", y.bandwidth())
      .attr("fill", d => colorScale(d[yField] as string))
      .attr("rx", y.bandwidth() / 2) // Rounded bars as per image
      .attr("opacity", 0.8)
      .style("pointer-events", "all")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2);
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.8).attr("stroke", "none");
      });

    // Duration text on bars
    svg.selectAll(".duration-label")
      .data(sessions)
      .enter()
      .append("text")
      .attr("x", d => x(d.startTime) + (x(d.endTime) - x(d.startTime)) / 2)
      .attr("y", d => y(d[yField] as string)! + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .text(d => d.duration > 10 ? `${Math.round(d.duration)}s` : "");

  }, [sessions, yField]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto bg-brand-card/30 rounded-[2rem] border border-brand-border p-8 shadow-2xl backdrop-blur-xl">
      <svg ref={svgRef} className="min-w-full"></svg>
    </div>
  );
};

export default function SessionsPage() {
  const { setTitle, setSubtitle, refreshTrigger } = useDashboard();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gapThreshold, setGapThreshold] = useState(120);
  const [view, setView] = useState<'routers' | 'devices' | 'gantt'>('routers');
  const [selectedRouter, setSelectedRouter] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>('all');

  useEffect(() => {
    setTitle("User Sessions");
    setSubtitle("Hierarchical activity tracking from routers to individual device timelines.");
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
    if (timeRange !== 'all') {
      const now = Date.now() / 1000;
      const hours = parseInt(timeRange);
      filteredData = data.filter(d => (now - d.timestamp) <= hours * 3600);
    }
    return groupEventsIntoSessions(filteredData, gapThreshold);
  }, [data, gapThreshold, timeRange]);

  // Hierarchical Data
  const routerGroups = useMemo(() => {
    const groups = d3.group(allSessions, d => d.meterId);
    return Array.from(groups.entries()).map(([meterId, sessions]) => {
      const devices = new Set(sessions.map(s => s.hostname));
      const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        meterId,
        deviceCount: devices.size,
        sessionCount: sessions.length,
        totalDuration: Math.round(totalDuration),
        sessions
      };
    });
  }, [allSessions]);

  const deviceGroups = useMemo(() => {
    if (!selectedRouter) return [];
    const routerSessions = allSessions.filter(s => s.meterId === selectedRouter);
    const groups = d3.group(routerSessions, d => d.hostname);
    return Array.from(groups.entries()).map(([hostname, sessions]) => {
      const platforms = new Set(sessions.map(s => s.platform));
      const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        hostname,
        platformCount: platforms.size,
        sessionCount: sessions.length,
        totalDuration: Math.round(totalDuration),
        sessions
      };
    });
  }, [allSessions, selectedRouter]);

  const ganttSessions = useMemo(() => {
    if (!selectedDevice) return [];
    return allSessions.filter(s => s.hostname === selectedDevice);
  }, [allSessions, selectedDevice]);

  const dynamicLegends = useMemo(() => {
    if (view !== 'gantt' || ganttSessions.length === 0) return [];
    const platforms = Array.from(new Set(ganttSessions.map(s => s.platform)));
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(platforms);
    return platforms.map(p => ({ label: p, color: colorScale(p) as string }));
  }, [view, ganttSessions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <button 
          onClick={() => { setView('routers'); setSelectedRouter(null); setSelectedDevice(null); }}
          className={cn("hover:text-brand-accent transition-colors", view === 'routers' ? "text-brand-accent font-bold" : "text-brand-muted")}
        >
          Routers
        </button>
        {selectedRouter && (
          <>
            <ChevronRight size={14} className="text-brand-muted" />
            <button 
              onClick={() => { setView('devices'); setSelectedDevice(null); }}
              className={cn("hover:text-brand-accent transition-colors", view === 'devices' ? "text-brand-accent font-bold" : "text-brand-muted")}
            >
              {selectedRouter}
            </button>
          </>
        )}
        {selectedDevice && (
          <>
            <ChevronRight size={14} className="text-brand-muted" />
            <span className="text-brand-accent font-bold">{selectedDevice}</span>
          </>
        )}
      </div>

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

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {view === 'routers' && (
          <motion.div 
            key="routers"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {routerGroups.map(router => (
              <button
                key={router.meterId}
                onClick={() => { setSelectedRouter(router.meterId); setView('devices'); }}
                className="group bg-brand-card/40 border border-brand-border rounded-[2rem] p-8 text-left hover:border-brand-accent/50 transition-all hover:shadow-2xl hover:shadow-brand-accent/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Server size={80} className="text-brand-accent" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-accent/10 rounded-xl">
                      <Server className="text-brand-accent h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-lg tracking-tight">{router.meterId}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Devices</p>
                      <p className="text-2xl font-black">{router.deviceCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Sessions</p>
                      <p className="text-2xl font-black">{router.sessionCount}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-brand-border flex items-center justify-between text-brand-accent font-bold text-xs uppercase tracking-widest">
                    <span>View Devices</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'devices' && (
          <motion.div 
            key="devices"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {deviceGroups.map(device => (
              <button
                key={device.hostname}
                onClick={() => { setSelectedDevice(device.hostname); setView('gantt'); }}
                className="group bg-brand-card/40 border border-brand-border rounded-[2rem] p-8 text-left hover:border-brand-accent/50 transition-all hover:shadow-2xl hover:shadow-brand-accent/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Monitor size={80} className="text-brand-accent" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-accent/10 rounded-xl">
                      <Smartphone className="text-brand-accent h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-lg tracking-tight truncate pr-8">{device.hostname}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Platforms</p>
                      <p className="text-2xl font-black">{device.platformCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Sessions</p>
                      <p className="text-2xl font-black">{device.sessionCount}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-brand-border flex items-center justify-between text-brand-accent font-bold text-xs uppercase tracking-widest">
                    <span>View Gantt Chart</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'gantt' && (
          <motion.div 
            key="gantt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('devices')}
                  className="p-3 bg-brand-card border border-brand-border rounded-2xl hover:bg-brand-bg transition-colors"
                >
                  <ArrowLeft size={20} className="text-brand-accent" />
                </button>
                <div>
                  <h3 className="font-bold text-2xl tracking-tight">{selectedDevice}</h3>
                  <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mt-1">Platform Activity Timeline</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 px-6 py-3 bg-brand-card/30 border border-brand-border rounded-2xl backdrop-blur-sm">
                {dynamicLegends.map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <SessionGantt sessions={ganttSessions} yField="platform" />
          </motion.div>
        )}
      </AnimatePresence>

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
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">IP / Hostname</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">MAC Address</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Platform / Category</th>
                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {allSessions.slice().reverse().map((session) => (
                <tr key={session.id} className="hover:bg-brand-accent/5 transition-all group cursor-default">
                  <td className="px-10 py-6">
                    <span className="font-mono text-xs text-brand-muted bg-brand-bg px-2 py-1 rounded border border-brand-border">{session.meterId}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-text group-hover:text-brand-accent transition-colors">{session.hostname}</span>
                      <span className="text-[10px] font-mono text-brand-muted mt-1">{session.ip}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-mono text-brand-muted">{session.mac}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand-text/80">{session.platform}</span>
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-tighter mt-0.5">{session.category}</span>
                      </div>
                    </div>
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

