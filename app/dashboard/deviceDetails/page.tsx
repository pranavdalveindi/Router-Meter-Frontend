"use client";

import React, { useEffect } from "react";
import { useDashboard } from "@/components/DashboardProvider";

export default function DeviceDetailsPage() {
  const { setTitle, setSubtitle } = useDashboard();

  useEffect(() => {
    setTitle("Device Details");
    setSubtitle("Detailed information about connected devices.");
  }, [setTitle, setSubtitle]);

  return (
    <div className="p-8 bg-brand-card rounded-2xl border border-brand-border shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Device Details</h2>
      <p className="text-brand-muted">This page will display detailed information for a specific device.</p>
    </div>
  );
}
