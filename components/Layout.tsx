"use client";

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
  setAutoRefresh?: (val: boolean) => void;
  title: string;
  subtitle: string;
}

export const Layout = ({ children, autoRefresh = false, setAutoRefresh, title, subtitle }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg text-brand-text transition-colors duration-300">

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-brand-muted text-sm mt-1">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {setAutoRefresh && (
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
            )}
            <ThemeToggle />
          </div>
        </header>

        <div className="px-8 pb-12 mt-8">
          {children}
        </div>
      </main>
    </div>
  );
};
