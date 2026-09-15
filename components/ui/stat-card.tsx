import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden p-5 rounded-2xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md',
        highlight
          ? 'border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-orange-50/60 ring-1 ring-orange-500/20'
          : 'border-stone-200/80 hover:border-stone-300'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">{value}</h4>
          {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className={cn(
            'p-3 rounded-xl flex items-center justify-center transition-colors',
            highlight
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-orange-50 text-orange-600 border border-orange-100'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-semibold px-1.5 py-0.5 rounded-md',
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {trend.value}
          </span>
          <span className="text-stone-400">vs previous period</span>
        </div>
      )}
    </div>
  );
}
