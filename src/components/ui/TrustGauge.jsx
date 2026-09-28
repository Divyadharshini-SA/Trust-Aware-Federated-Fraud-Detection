import React from 'react';
import { motion } from 'framer-motion';

export const TrustGauge = ({ score = 1.0, size = 48 }) => {
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score * circumference);

  let strokeColor = '#FF5A5A'; 
  let textClass = 'text-red-600 dark:text-cyber-red';
  let badgeLabel = 'Poor';

  if (score >= 0.95) {
    strokeColor = '#00FF9D'; 
    textClass = 'text-emerald-600 dark:text-cyber-green';
    badgeLabel = 'Excellent';
  } else if (score >= 0.85) {
    strokeColor = '#00E5FF'; 
    textClass = 'text-[#0284C7] dark:text-cyber-cyan';
    badgeLabel = 'Good';
  } else if (score >= 0.70) {
    strokeColor = '#FFB547'; 
    textClass = 'text-amber-600 dark:text-cyber-amber';
    badgeLabel = 'Fair';
  }

  return (
    <div className="flex items-center space-x-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Underlay ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-300 dark:stroke-slate-800/80"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-mono-numbers font-black text-slate-900 dark:text-white">
            {score.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="flex flex-col text-left">
        <span className={`text-[10px] font-black font-mono-numbers leading-none ${textClass}`}>{score.toFixed(3)}</span>
        <span className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest leading-none">{badgeLabel}</span>
      </div>
    </div>
  );
};
