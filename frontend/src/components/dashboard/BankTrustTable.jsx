import React from 'react';
import { TrustGauge } from '../ui/TrustGauge';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { GlassCard } from '../ui/GlassCard';
import { ArrowUpRight } from 'lucide-react';

export const BankTrustTable = ({ banks }) => {
  // Find maximum data size to scale mini-bar charts
  const maxTxCount = Math.max(...banks.map(b => b.transaction_count || 1));

  return (
    <GlassCard className="border-slate-800/80 h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-450">
          Bank Node Trust Rankings
        </h3>
        <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/45 px-2 py-0.5 rounded border border-cyan-800/30">
          SECURE SHARDS
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/20">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-450 border-b border-slate-850 font-bold text-[10px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Bank Node Shard</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Partition Size</th>
              <th className="px-5 py-3.5">Suspicious</th>
              <th className="px-5 py-3.5">Local Accuracy</th>
              <th className="px-5 py-3.5 text-right">Trust score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {banks.map((bank, index) => {
              const txPercent = ((bank.transaction_count || 0) / maxTxCount) * 100;
              const initials = bank.name ? bank.name.substring(0, 2).toUpperCase() : `B${bank.id}`;

              // Assign unique gradient matching index
              const gradients = [
                'from-cyan-500 to-blue-600',
                'from-emerald-400 to-teal-500',
                'from-indigo-500 to-purple-600',
                'from-amber-400 to-orange-500',
                'from-rose-450 to-red-650'
              ];
              const grad = gradients[index % gradients.length];

              return (
                <tr key={bank.id} className="hover:bg-slate-900/40 transition-colors group">
                  
                  {/* Name and Avatar */}
                  <td className="px-5 py-3.5 font-bold text-white flex items-center space-x-3.5">
                    <div className={`h-8 w-8 rounded-xl bg-gradient-to-tr ${grad} text-white font-extrabold text-xs flex items-center justify-center border border-white/10 shadow-md`}>
                      {initials}
                    </div>
                    <div>
                      <span className="group-hover:text-cyan-400 transition-colors block text-xs">{bank.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">NODE_PARTITION_0{bank.id}</span>
                    </div>
                  </td>

                  {/* Status Indicator */}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={bank.status} />
                  </td>

                  {/* Data size with mini horizontal bar chart */}
                  <td className="px-5 py-3.5 font-medium">
                    <div className="space-y-1">
                      <span className="font-numbers text-slate-200">
                        {(bank.transaction_count || 0).toLocaleString()}
                      </span>
                      <div className="w-24 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div className={`h-full bg-gradient-to-r ${grad}`} style={{ width: `${txPercent}%` }}></div>
                      </div>
                    </div>
                  </td>

                  {/* Suspicious Transactions with Arrow Trend */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-1.5 text-rose-450 font-bold font-numbers">
                      <span>{(bank.fraud_count || 0).toLocaleString()}</span>
                      <ArrowUpRight size={12} className="opacity-60" />
                    </div>
                  </td>

                  {/* Local Accuracy Progress Bar */}
                  <td className="px-5 py-3.5">
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-[10px] font-numbers text-slate-350">
                        <span>{((bank.local_accuracy || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <ProgressBar progress={(bank.local_accuracy || 0) * 100} color="emerald" size="sm" />
                    </div>
                  </td>

                  {/* Radial Gauge Trust Score */}
                  <td className="px-5 py-3.5 text-right flex justify-end">
                    <TrustGauge score={bank.current_trust_score || 0} size={38} />
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};
