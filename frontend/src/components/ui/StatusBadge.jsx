import React from 'react';

export const StatusBadge = ({ status }) => {
  let badgeStyle = 'bg-slate-800/40 text-slate-500 border-slate-700';
  let dotStyle = 'bg-slate-600';
  let label = 'OFFLINE';

  if (status === 'online') {
    badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 glow-emerald';
    dotStyle = 'bg-emerald-400 animate-pulse';
    label = 'ONLINE';
  } else if (status === 'training' || status === 'syncing') {
    badgeStyle = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 glow-teal';
    dotStyle = 'bg-cyan-400 animate-ping';
    label = status.toUpperCase();
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center w-fit font-mono tracking-wider ${badgeStyle}`}>
      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${dotStyle}`}></span>
      <span>{label}</span>
    </span>
  );
};
