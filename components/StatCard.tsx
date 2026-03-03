import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend }: StatCardProps) => (
  <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
    <div>
      <p className="text-brand-muted text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-brand-text">{value}</h3>
      {trend && (
        <p className={cn(
          "text-xs mt-2 font-medium",
          trend.startsWith('+') ? "text-emerald-500" : "text-rose-500"
        )}>
          {trend} <span className="text-brand-muted font-normal ml-1">from last hour</span>
        </p>
      )}
    </div>
    <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
      <Icon size={20} />
    </div>
  </div>
);
