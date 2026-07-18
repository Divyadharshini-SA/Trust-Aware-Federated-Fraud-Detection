import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => {
  // Check if trend starts with '+' or '↑' or indicates growth
  const isPositive = trend && (trend.includes('+') || trend.includes('↑') || trend.toLowerCase().includes('up'));

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col gap-2 hover:border-[#00D4FF]/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#00D4FF]">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="mt-1">
        <h4 className="text-xl font-mono font-black text-white leading-none">
          {value}
        </h4>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[9px] text-slate-500 font-mono">
          {subtitle}
        </span>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            isPositive 
              ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20' 
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}>
            {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default StatCard;
