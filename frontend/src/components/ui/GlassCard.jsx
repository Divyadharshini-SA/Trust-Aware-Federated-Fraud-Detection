import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className = '', hoverEffect = true, glowColor = '', borderGradient = false }) => {
  let borderClass = 'border-slate-800/80';
  let shadowClass = '';

  if (glowColor === 'cyan') {
    borderClass = 'border-neon-cyan/40';
    shadowClass = 'shadow-neon-cyan';
  } else if (glowColor === 'green') {
    borderClass = 'border-neon-green/40';
    shadowClass = 'shadow-neon-green';
  } else if (glowColor === 'red') {
    borderClass = 'border-neon-red/40';
    shadowClass = 'shadow-neon-red';
  } else if (glowColor === 'purple') {
    borderClass = 'border-neon-purple/40';
    shadowClass = 'shadow-neon-purple';
  }

  const baseStyle = borderGradient 
    ? 'gradient-border-futuristic' 
    : 'glass-panel rounded-2xl border';

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -5, scale: 1.01, borderColor: 'rgba(0, 229, 255, 0.45)' } : {}}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`p-5 transition-colors duration-300 ${baseStyle} ${borderClass} ${shadowClass} ${className}`}
    >
      {children}
    </motion.div>
  );
};
