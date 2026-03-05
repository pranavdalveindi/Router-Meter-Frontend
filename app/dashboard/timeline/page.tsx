"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Settings2, 
  ChevronRight,
  ArrowLeft,
  Server,
  Monitor,
  Smartphone,
  BarChartHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/components/DashboardProvider';
import { groupEventsIntoSessions, type Session } from '@/lib/sessionUtils';
import { cn } from '@/lib/utils';
import * as d3 from 'd3';

// --- Reusable Gantt Chart Component ---
const GanttChart = ({ 
  sessions,
  yField,
  colorField,
  onBarClick,
  title
}: { 
  sessions: Session[],
  yField: keyof Session,
  colorField: keyof Session,
  onBarClick?: (session: Session) => void,
  title: string
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || sessions.length === 0) return;

    const container = containerRef.current;
    const margin = { top: 60, right: 60, bottom: 40, left: 180 };
    const width = container.clientWidth - margin.left - margin.right;
    const rowHeight = 60;
    
    const groups = d3.group(sessions, d => d[yField] as string);
    const yDomain = Array.from(groups.keys());
    
    const height = Math.max(400, yDomain.length * rowHeight) + margin.top + margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const minTime = d3.min(sessions, d => d.startTime) || 0;
    const maxTime = d3.max(sessions, d => d.endTime) || Date.now() / 1000;

    const x = d3.scaleLinear()
      .domain([minTime, maxTime])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(yDomain)
      .range([0, height - margin.top - margin.bottom])
      .padding(0.4);

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

    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(x)
        .ticks(10)
        .tickSize(height - margin.top - margin.bottom)
        .tickFormat(() => "")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.05)"));

    const rows = svg.selectAll(".row")
      .data(yDomain)
      .enter()
      .append("g")
      .attr("class", "row-group");

    rows.append("rect")
      .attr("x", -margin.left)
      .attr("y", d => y(d)!)
      .attr("width", width + margin.left)
      .attr("height", y.bandwidth())
      .attr("fill", "rgba(255,255,255,0.02)")
      .attr("rx", 12);

    rows.append("text")
      .attr("x", -20)
      .attr("y", d => y(d)! + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("fill", "rgba(255,255,255,0.9)")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .text(d => d);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const bars = svg.selectAll(".session-bar")
      .data(sessions)
      .enter()
      .append("rect")
      .attr("class", "session-bar")
      .attr("x", d => x(d.startTime))
      .attr("y", d => y(d[yField] as string)!)
      .attr("width", d => Math.max(10, x(d.endTime) - x(d.startTime)))
      .attr("height", y.bandwidth())
      .attr("fill", d => colorScale(d[colorField] as string))
      .attr("rx", y.bandwidth() / 2)
      .attr("opacity", 0.8)
      .style("cursor", onBarClick ? "pointer" : "default")
      .style("pointer-events", "all")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2);
        
        // Tooltip logic
        const tooltip = d3.select("body").append("div")
          .attr("class", "gantt-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "8px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .html(`<strong>${d[colorField]}</strong><br/>Duration: ${Math.round(d.duration)}s`);
          
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 10) + "px");
      })
      .on("mousemove", function(event) {
        d3.select(".gantt-tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.8).attr("stroke", "none");
        d3.selectAll(".gantt-tooltip").remove();
      })
      .on("click", (event, d) => {
        if (onBarClick) onBarClick(d);
      });

  }, [sessions, yField, colorField, onBarClick]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-brand-muted uppercase tracking-[0.2em]">{title}</h4>
      <div ref={containerRef} className="w-full overflow-x-auto bg-brand-card/30 rounded-[2rem] border border-brand-border p-8 shadow-2xl backdrop-blur-xl">
        <svg ref={svgRef} className="min-w-full"></svg>
      </div>
    </div>
  );
};

export default function TimelinePage() {
  const { setTitle, setSubtitle, refreshTrigger } = useDashboard();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gapThreshold, setGapThreshold] = useState(120);
  const [view, setView] = useState<'routers' | 'router-gantt' | 'device-gantt'>('routers');
  const [selectedRouter, setSelectedRouter] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>('all');

  useEffect(() => {
    setTitle("Activity Timeline");
    setSubtitle("Visualizing network activity across routers, devices, and platforms.");
  }, [setTitle, setSubtitle]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api-router-dev.indirex.io/api/router-event");
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const fetchedData = await response.json();
      setData(fetchedData);
    } catch (err: any) {
      console.warn("API fetch failed");
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

  const routerGroups = useMemo(() => {
    const groups = d3.group(allSessions, d => d.meterId);
    return Array.from(groups.entries()).map(([meterId, sessions]) => {
      const devices = new Set(sessions.map(s => s.hostname));
      return {
        meterId,
        deviceCount: devices.size,
        sessionCount: sessions.length,
        sessions
      };
    });
  }, [allSessions]);

  const routerSessions = useMemo(() => {
    if (!selectedRouter) return [];
    return allSessions.filter(s => s.meterId === selectedRouter);
  }, [allSessions, selectedRouter]);

  const deviceSessions = useMemo(() => {
    if (!selectedDevice || !selectedCategory) return [];
    return allSessions.filter(s => s.hostname === selectedDevice && s.category === selectedCategory);
  }, [allSessions, selectedDevice, selectedCategory]);

  const platformLeaderboard = useMemo(() => {
    const groups = d3.group(allSessions, d => d.platform);
    const platformColors: Record<string, string> = {
      'Windows': '#0078D4',
      'Android': '#3DDC84',
      'iOS': '#FA2D48',
      'macOS': '#999999',
      'Linux': '#FCC624',
      'YouTube': '#FF0000',
      'Netflix': '#E50914',
      'Facebook': '#1877F2',
      'Instagram': '#E4405F',
      'WhatsApp': '#25D366',
      'Twitter': '#1DA1F2',
      'TikTok': '#000000',
      'Spotify': '#1DB954',
    };

    return Array.from(groups.entries())
      .map(([platform, sessions]) => ({
        platform,
        duration: sessions.reduce((acc, s) => acc + s.duration, 0),
        color: platformColors[platform] || d3.interpolateRainbow(Math.random())
      }))
      .sort((a, b) => b.duration - a.duration);
  }, [allSessions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <button 
          onClick={() => { setView('routers'); setSelectedRouter(null); setSelectedDevice(null); setSelectedCategory(null); }}
          className={cn("hover:text-brand-accent transition-colors", view === 'routers' ? "text-brand-accent font-bold" : "text-brand-muted")}
        >
          Routers
        </button>
        {selectedRouter && (
          <>
            <ChevronRight size={14} className="text-brand-muted" />
            <button 
              onClick={() => { setView('router-gantt'); setSelectedDevice(null); setSelectedCategory(null); }}
              className={cn("hover:text-brand-accent transition-colors", view === 'router-gantt' ? "text-brand-accent font-bold" : "text-brand-muted")}
            >
              {selectedRouter}
            </button>
          </>
        )}
        {selectedDevice && (
          <>
            <ChevronRight size={14} className="text-brand-muted" />
            <span className="text-brand-accent font-bold">{selectedDevice} ({selectedCategory})</span>
          </>
        )}
      </div>

      {/* Platform Leaderboard */}
      <div className="bg-brand-card/50 border border-brand-border rounded-[2rem] p-8 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand-accent/10 rounded-2xl border border-brand-accent/20">
                <BarChartHorizontal className="text-brand-accent h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl tracking-tight">Platform Leaderboard</h3>
                <p className="text-xs text-brand-muted mt-1">Most watched platforms by total duration.</p>
              </div>
            </div>
            
            {/* Top Platform Highlight */}
            {platformLeaderboard.length > 0 && (
              <div className="p-6 bg-brand-accent/5 border border-brand-accent/10 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <BarChartHorizontal size={120} className="text-brand-accent" />
                </div>
                <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-2">Dominant Platform</p>
                <h4 className="text-3xl font-black tracking-tighter text-brand-text">{platformLeaderboard[0].platform}</h4>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-2xl font-mono font-bold text-brand-accent">{Math.round(platformLeaderboard[0].duration / 60)}</span>
                  <span className="text-xs text-brand-muted font-bold uppercase mb-1">Minutes Total</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Usage Distribution</span>
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

            <div className="space-y-4">
              {platformLeaderboard.slice(0, 5).map((item, idx) => {
                const maxDuration = platformLeaderboard[0].duration;
                const percentage = (item.duration / maxDuration) * 100;
                
                return (
                  <div key={item.platform} className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-brand-muted font-bold">0{idx + 1}</span>
                        <span className="text-xs font-bold text-brand-text/90 uppercase tracking-wider">{item.platform}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-brand-muted">{Math.round(item.duration)}s</span>
                    </div>
                    <div className="h-3 bg-brand-bg rounded-full overflow-hidden border border-brand-border/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full shadow-lg"
                        style={{ 
                          backgroundColor: item.color,
                          boxShadow: `0 0 15px ${item.color}33`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {platformLeaderboard.length === 0 && (
                <div className="h-40 flex items-center justify-center border border-dashed border-brand-border rounded-3xl">
                  <p className="text-xs text-brand-muted italic">No activity data available for this range.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                onClick={() => { setSelectedRouter(router.meterId); setView('router-gantt'); }}
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
                    <span>View Device Timeline</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'router-gantt' && (
          <motion.div 
            key="router-gantt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('routers')}
                className="p-3 bg-brand-card border border-brand-border rounded-2xl hover:bg-brand-bg transition-colors"
              >
                <ArrowLeft size={20} className="text-brand-accent" />
              </button>
              <div>
                <h3 className="font-bold text-2xl tracking-tight">{selectedRouter} - Device Activity</h3>
                <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mt-1">Click a category bar to drill down into platform details.</p>
              </div>
            </div>

            <GanttChart 
              sessions={routerSessions} 
              yField="hostname" 
              colorField="category"
              title="Devices x Category Timeline"
              onBarClick={(s) => {
                setSelectedDevice(s.hostname);
                setSelectedCategory(s.category);
                setView('device-gantt');
              }}
            />
          </motion.div>
        )}

        {view === 'device-gantt' && (
          <motion.div 
            key="device-gantt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('router-gantt')}
                className="p-3 bg-brand-card border border-brand-border rounded-2xl hover:bg-brand-bg transition-colors"
              >
                <ArrowLeft size={20} className="text-brand-accent" />
              </button>
              <div>
                <h3 className="font-bold text-2xl tracking-tight">{selectedDevice} - {selectedCategory}</h3>
                <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mt-1">Platform usage breakdown for the selected category.</p>
              </div>
            </div>

            <GanttChart 
              sessions={deviceSessions} 
              yField="platform" 
              colorField="platform"
              title="Platform Usage Timeline"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
