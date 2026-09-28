import React from 'react';

export const StatusBadge = ({ status }) => {
  let badgeStyle = 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-500 border-slate-300 dark:border-slate-700';
  let dotStyle = 'bg-slate-500 dark:bg-slate-600';
  let label = 'OFFLINE';

  if (status === 'online') {
    badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 glow-emerald';
    dotStyle = 'bg-emerald-500 dark:bg-emerald-400 animate-pulse';
    label = 'ONLINE';
  } else if (status === 'training' || status === 'syncing') {
    badgeStyle = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20 glow-teal';
    dotStyle = 'bg-cyan-500 dark:bg-cyan-400 animate-ping';
    label = status.toUpperCase();
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center w-fit font-mono tracking-wider ${badgeStyle}`}>
      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${dotStyle}`}></span>
      <span>{label}</span>
    </span>
  );
};
