import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className = '', hoverEffect = true, glowColor = '', borderGradient = false }) => {
  let borderClass = 'border-slate-200/90 dark:border-slate-800/80';
  let shadowClass = 'shadow-sm dark:shadow-none';

  if (glowColor === 'cyan') {
    borderClass = 'border-sky-300 dark:border-neon-cyan/40';
    shadowClass = 'shadow-sm dark:shadow-neon-cyan';
  } else if (glowColor === 'green') {
    borderClass = 'border-emerald-300 dark:border-neon-green/40';
    shadowClass = 'shadow-sm dark:shadow-neon-green';
  } else if (glowColor === 'red') {
    borderClass = 'border-rose-300 dark:border-neon-red/40';
    shadowClass = 'shadow-sm dark:shadow-neon-red';
  } else if (glowColor === 'purple') {
    borderClass = 'border-purple-300 dark:border-neon-purple/40';
    shadowClass = 'shadow-sm dark:shadow-neon-purple';
  }

  const baseStyle = borderGradient 
    ? 'gradient-border-futuristic' 
    : 'glass-panel rounded-2xl border';

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -3, scale: 1.005 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`p-5 transition-colors duration-300 ${baseStyle} ${borderClass} ${shadowClass} ${className}`}
    >
      {children}
    </motion.div>
  );
};
