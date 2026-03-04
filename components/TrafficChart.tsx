import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface TrafficChartProps {
  data: any[];
}

export const TrafficChart = ({ data }: TrafficChartProps) => (
  <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-semibold text-lg">Traffic History</h3>
      <select className="bg-transparent text-xs text-brand-muted border border-brand-border rounded-lg px-2 py-1 outline-none">
        <option>Last 24 Hours</option>
        <option>Last 7 Days</option>
      </select>
    </div>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-brand-border" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="currentColor" 
            className="text-brand-muted"
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="currentColor" 
            className="text-brand-muted"
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}MB`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--brand-card)', 
              border: '1px solid var(--brand-border)', 
              borderRadius: '12px',
              color: 'var(--brand-text)'
            }}
            itemStyle={{ color: '#0ea5e9' }}
          />
          <Area 
            type="monotone" 
            dataKey="traffic" 
            stroke="#0ea5e9" 
            fillOpacity={1} 
            fill="url(#colorTraffic)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
