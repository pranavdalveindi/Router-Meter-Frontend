"use client";

import React, { createContext, useContext, useState } from "react";

interface DashboardContextType {
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  refreshTrigger: number;
  refreshNow: () => void;
  title: string;
  setTitle: (val: string) => void;
  subtitle: string;
  setSubtitle: (val: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [title, setTitle] = useState("Dashboard");
  const [subtitle, setSubtitle] = useState("");

  const refreshNow = () => setRefreshTrigger(prev => prev + 1);

  return (
    <DashboardContext.Provider value={{ 
      autoRefresh, 
      setAutoRefresh, 
      refreshTrigger, 
      refreshNow,
      title, 
      setTitle, 
      subtitle, 
      setSubtitle 
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
