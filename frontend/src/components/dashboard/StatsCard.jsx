import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = 'teal' }) => {
  let iconBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 glow-teal';
  if (color === 'emerald') iconBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 glow-emerald';
  else if (color === 'rose') iconBg = 'bg-rose-500/10 text-rose-500 border-rose-500/20 glow-rose';
  else if (color === 'amber') iconBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

  return (
    <GlassCard className="flex items-center justify-between border-slate-800/80">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl border flex items-center justify-center ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">
            {title}
          </span>
          <p className="text-xl font-black text-white mt-1">
            <AnimatedCounter value={value} />
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
            {subtitle}
          </span>
        </div>
      </div>
      
      {trend && (
        <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border self-start ${
          trend.startsWith('↑') || trend.includes('+')
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-slate-800/50 text-slate-400 border-slate-700'
        }`}>
          {trend}
        </div>
      )}
    </GlassCard>
  );
};
