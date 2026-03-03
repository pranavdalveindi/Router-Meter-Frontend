"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [autoRefresh, setAutoRefresh] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Network Activity</h1>
            <p className="text-brand-muted text-sm mt-1">Real-time monitoring of connected devices and traffic.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm",
                  autoRefresh 
                    ? "bg-brand-accent text-white shadow-brand-accent/20" 
                    : "bg-brand-card border border-brand-border text-brand-muted hover:text-brand-text"
                )}
              >
                <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
                Refresh: {autoRefresh ? "On" : "Off"}
              </button>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="px-8 pb-12 mt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
