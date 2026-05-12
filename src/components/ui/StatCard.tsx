import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'primary' | 'mint' | 'warm' | 'lilac';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  containerStyle?: React.CSSProperties;
  iconContainerStyle?: React.CSSProperties;
  iconStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  valueStyle?: React.CSSProperties;
}

export const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  variant = 'primary', 
  trend, 
  className,
  containerStyle,
  iconContainerStyle,
  iconStyle,
  labelStyle,
  valueStyle
}: StatCardProps) => {
  const iconColors = {
    primary: 'bg-primary/10 text-primary',
    mint: 'bg-accent-mint/20 text-accent-mint-dark', // Need to make sure mint-dark or similar is used or just ink
    warm: 'bg-accent-warm/10 text-accent-warm',
    lilac: 'bg-accent-lilac/10 text-accent-lilac',
  };

  // Heuristic for dark text colors on light variants if needed
  const textColors = {
    primary: 'text-primary',
    mint: 'text-emerald-600',
    warm: 'text-accent-warm',
    lilac: 'text-accent-lilac',
  };

  return (
    <Card 
      className={cn('flex flex-col gap-1', className)} 
      padding="sm"
      style={containerStyle}
    >
      <div className="flex items-center justify-between transition-transform group-hover:scale-105">
        <div 
          className={cn('p-3 rounded-2xl', iconColors[variant])}
          style={iconContainerStyle}
        >
          {Icon && <Icon className="w-6 h-6" style={iconStyle} />}
        </div>
        {trend && (
          <div className={cn(
            "text-xs font-black px-2 py-1 rounded-lg",
            trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p 
          className="text-[10px] font-black text-ink-muted uppercase tracking-widest"
          style={labelStyle}
        >
          {label}
        </p>
        <p 
          className={cn("text-3xl font-black mt-1 tabular-nums", textColors[variant])}
          style={valueStyle}
        >
          {value}
        </p>
      </div>
    </Card>
  );
};
