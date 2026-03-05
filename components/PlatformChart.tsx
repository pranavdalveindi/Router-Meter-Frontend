import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface PlatformChartProps {
  data: any[];
}

export const PlatformChart = ({ data }: PlatformChartProps) => (
  <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm">
    <h3 className="font-semibold text-lg mb-6">Platform Distribution</h3>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="currentColor" 
            className="text-brand-muted"
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            width={80}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              backgroundColor: 'var(--brand-card)', 
              border: '1px solid var(--brand-border)', 
              borderRadius: '12px',
              color: 'var(--brand-text)'
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 space-y-2">
      {data.slice(0, 3).map((stat) => (
        <div key={stat.name} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
            <span className="text-brand-muted">{stat.name}</span>
          </div>
          <span className="font-medium">{stat.count}%</span>
        </div>
      ))}
    </div>
  </div>
);
