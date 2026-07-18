import React from 'react';

export const ProgressBar = ({ progress = 0, color = 'teal', size = 'md', animated = false }) => {
  const percent = Math.min(100, Math.max(0, progress));

  let colorStyle = 'from-cyan-400 to-indigo-500';
  if (color === 'emerald') colorStyle = 'from-emerald-400 to-teal-500';
  else if (color === 'rose') colorStyle = 'from-rose-400 to-red-500';
  else if (color === 'amber') colorStyle = 'from-amber-400 to-orange-500';

  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3.5' : 'h-2.5';

  return (
    <div className="w-full space-y-1.5">
      <div className={`w-full bg-slate-950/60 rounded-full ${height} overflow-hidden border border-slate-800/80`}>
        <div 
          className={`h-full bg-gradient-to-r ${colorStyle} rounded-full transition-all duration-500 ${animated ? 'pulse-glow-indicator' : ''}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};
