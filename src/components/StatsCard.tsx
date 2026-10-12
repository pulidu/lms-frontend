import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
  bgClass?: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  colorClass = 'text-sky-600',
  bgClass = 'bg-sky-50',
  subtitle,
}) => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-100/60 shadow-sm flex items-start justify-between transition-all hover:translate-y-[-2px] hover:shadow-md">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
        </div>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass} shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
};

export default StatsCard;
