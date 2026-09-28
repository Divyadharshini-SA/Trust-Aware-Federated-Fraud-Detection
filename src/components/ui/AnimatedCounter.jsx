import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export const AnimatedCounter = ({ value, duration = 1.2, format = (val) => val }) => {
  const [displayVal, setDisplayVal] = useState('0');

  useEffect(() => {
    const isPercent = value.toString().includes('%');
    const numericTarget = typeof value === 'number' 
      ? value 
      : parseFloat(value.toString().replace(/,/g, '').replace(/%/g, ''));
    
    if (isNaN(numericTarget)) {
      setDisplayVal(value);
      return;
    }

    const controls = animate(0, numericTarget, {
      duration: duration,
      ease: 'easeOut',
      onUpdate(value) {
        if (typeof value === 'number') {
          if (isPercent) {
            setDisplayVal(`${value.toFixed(2)}%`);
          } else if (numericTarget % 1 !== 0) {
            setDisplayVal(value.toFixed(3)); // For trust score averages
          } else {
            setDisplayVal(Math.round(value).toLocaleString());
          }
        }
      }
    });

    return () => controls.stop();
  }, [value, duration]);

  return <span className="font-mono-numbers">{displayVal}</span>;
};
