"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardProvider, useDashboard } from '@/components/DashboardProvider';

function DashboardHeader() {
  const { autoRefresh, setAutoRefresh, refreshNow, title, subtitle } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    refreshNow();
    // Simulate a brief loading state for UX
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="sticky top-0 z-10 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border px-8 py-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-brand-muted text-sm mt-1">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-brand-card border border-brand-border p-1 rounded-2xl shadow-sm">
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-brand-text hover:bg-brand-bg transition-all disabled:opacity-50"
            title="Refresh Data Now"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </button>
          
          <div className="w-px h-4 bg-brand-border mx-1" />

          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              autoRefresh 
                ? "bg-brand-accent/10 text-brand-accent" 
                : "text-brand-muted hover:text-brand-text"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              autoRefresh ? "bg-brand-accent animate-pulse" : "bg-brand-muted"
            )} />
            Auto-Refresh: {autoRefresh ? "On" : "Off"}
          </button>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg text-brand-text">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      <main className="flex-1 overflow-y-auto relative">
        <DashboardHeader />
        <div className="px-8 pb-12 mt-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </DashboardProvider>
  );
}
