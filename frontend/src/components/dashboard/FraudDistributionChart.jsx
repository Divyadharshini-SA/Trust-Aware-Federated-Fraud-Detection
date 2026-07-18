import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GlassCard } from '../ui/GlassCard';

export const FraudDistributionChart = ({ totalTransactions, totalFraud, totalNonFraud }) => {
  const pieData = [
    { name: 'Legitimate', value: totalNonFraud },
    { name: 'Fraudulent', value: totalFraud },
  ];

  const fraudRate = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;

  return (
    <GlassCard className="border-slate-800/80 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-450 mb-4">
          Fraud Distribution
        </h3>
      </div>

      <div className="h-60 flex items-center justify-center relative my-2">
        {totalTransactions > 0 ? (
          <>
            {/* Custom SVG Gradients definition */}
            <svg className="absolute w-0 h-0">
              <defs>
                <linearGradient id="legitGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00FF88" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
                <linearGradient id="fraudGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF4D4D" />
                  <stop offset="100%" stopColor="#FF6B6B" />
                </linearGradient>
              </defs>
            </svg>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={6}
                  dataKey="value"
                  animationDuration={1500}
                >
                  <Cell fill="url(#legitGrad)" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 136, 0.25))' }} />
                  <Cell fill="url(#fraudGrad)" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 77, 77, 0.25))' }} />
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'Roboto Mono'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: 10, fontFamily: 'Inter', color: '#94a3b8' }} 
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Score Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
              <span className="text-2xl font-black text-white font-numbers glow-rose">
                {fraudRate.toFixed(2)}%
              </span>
              <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-semibold">
                Fraud Rate
              </span>
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-xs italic">No transaction partitions synced</div>
        )}
      </div>

      <div className="text-center text-[10px] text-slate-500 font-mono">
        Aggregated partitioned transaction streams.
      </div>
    </GlassCard>
  );
};
