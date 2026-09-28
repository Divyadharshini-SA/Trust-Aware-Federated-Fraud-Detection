import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export const FraudDonutChart = ({ totalTransactions, totalFraud }) => {
  const { isDark } = useTheme();
  const totalNonFraud = totalTransactions - totalFraud;
  const data = [
    { name: 'Legitimate', value: totalNonFraud > 0 ? totalNonFraud : 100 },
    { name: 'Fraudulent', value: totalFraud },
  ];

  const COLORS = ['#00FF88', '#FF4D4D']; // Accent Green, Danger Red

  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between h-[280px] shadow-sm dark:shadow-none transition-colors duration-300">
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3">
          Fraud Shard Distribution
        </h3>
      </div>

      <div className="h-44 relative flex items-center justify-center">
        {totalTransactions > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF', 
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0', 
                    borderRadius: '12px',
                    color: isDark ? '#fff' : '#0F172A',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ color: isDark ? '#fff' : '#0F172A' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={32} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: 10, fontFamily: 'Inter', color: isDark ? '#94a3b8' : '#475569' }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center percentage label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-8px]">
              <span className="text-lg font-mono font-black text-slate-900 dark:text-white">
                {totalTransactions > 0 ? ((totalFraud / totalTransactions) * 100).toFixed(1) : '0'}%
              </span>
              <span className="text-[7px] text-slate-500 font-mono uppercase tracking-widest font-semibold">
                Threat index
              </span>
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-xs italic font-mono flex items-center justify-center h-full">
            Awaiting dataset partitions
          </div>
        )}
      </div>

      <div className="text-center text-[9px] text-slate-500 font-mono">
        Aggregated active bank nodes telemetry.
      </div>
    </div>
  );
};
export default FraudDonutChart;
