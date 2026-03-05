"use client";

import React, { useEffect } from "react";
import { useDashboard } from "@/components/DashboardProvider";

export default function DomainActivityPage() {
  const { setTitle, setSubtitle } = useDashboard();

  useEffect(() => {
    setTitle("Domain Activity");
    setSubtitle("Analysis of web traffic and domain requests.");
  }, [setTitle, setSubtitle]);

  return (
    <div className="p-8 bg-brand-card rounded-2xl border border-brand-border shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Domain Activity</h2>
      <p className="text-brand-muted">This page will display analysis of domain-level network activity.</p>
    </div>
  );
}
