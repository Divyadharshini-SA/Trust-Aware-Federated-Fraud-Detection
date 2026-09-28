import React from 'react';
import { GlassCard } from './ui/GlassCard';
import { StatusBadge } from './ui/StatusBadge';
import { ProgressBar } from './ui/ProgressBar';
import { TrustGauge } from './ui/TrustGauge';
import { Landmark, Database, AlertTriangle, ShieldCheck } from 'lucide-react';

export const BankStatus = ({ banks }) => {
  return (
    <div className="space-y-6">
      
      {/* Header panel */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-300">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase">
            Decentralized Bank Shards
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Node partition sizes, local verification accuracy scores, and consolidated dynamic trust weight parameters.
          </p>
        </div>
        <div className="text-[10px] text-sky-700 dark:text-cyan-400 font-mono font-bold bg-sky-50 dark:bg-cyan-950/45 px-3.5 py-1.5 rounded-xl border border-sky-200 dark:border-cyan-800/30 w-fit shadow-sm dark:shadow-none">
          SHARDS ONLINE: {banks.filter(b => b.status === 'online').length} / {banks.length}
        </div>
      </div>

      {/* Grid of Bank status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map((bank, index) => {
          const trustScore = bank.current_trust_score || 0;

          // Visual theme color coding
          const accents = [
            { text: 'text-[#0284C7] dark:text-cyber-cyan', border: 'border-sky-300 dark:border-neon-cyan/20', color: 'cyan' },
            { text: 'text-emerald-600 dark:text-cyber-green', border: 'border-emerald-300 dark:border-neon-green/20', color: 'green' },
            { text: 'text-purple-600 dark:text-cyber-purple', border: 'border-purple-300 dark:border-neon-purple/20', color: 'purple' },
            { text: 'text-amber-600 dark:text-cyber-amber', border: 'border-amber-300 dark:border-neon-amber/20', color: 'amber' },
            { text: 'text-red-600 dark:text-cyber-red', border: 'border-rose-300 dark:border-neon-red/20', color: 'red' }
          ];
          const activeTheme = accents[index % accents.length];

          return (
            <GlassCard 
              key={bank.id} 
              glowColor={activeTheme.color}
              className="flex flex-col justify-between h-full"
            >
              {/* Card Title & Network Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border ${activeTheme.border} ${activeTheme.text} shadow-sm dark:shadow-lg`}>
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{bank.name}</h3>
                    <span className="text-[9px] text-slate-500 font-mono">NODE_PART_0{bank.id}</span>
                  </div>
                </div>
                <StatusBadge status={bank.status} />
              </div>

              {/* Stats Body */}
              <div className="py-5 space-y-5 flex-grow">
                {/* Gauge display */}
                <div className="flex items-center justify-between bg-slate-100/70 dark:bg-slate-950/45 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    Dynamic Shard Trust
                  </span>
                  <TrustGauge score={trustScore} size={42} />
                </div>

                {/* Substats Cards */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center space-x-1.5 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                      <Database size={12} className="text-[#0284C7] dark:text-cyber-cyan" />
                      <span>Data Size</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5 font-mono-numbers">
                      {(bank.transaction_count || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center space-x-1.5 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                      <AlertTriangle size={12} className="text-red-500 dark:text-cyber-red" />
                      <span>Suspicious</span>
                    </div>
                    <p className="text-sm font-black text-red-600 dark:text-cyber-red mt-1.5 font-mono-numbers">
                      {(bank.fraud_count || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Local Accuracy Progress */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    <span>Local Shard Accuracy:</span>
                    <span className="text-slate-900 dark:text-white font-bold font-mono-numbers">{((bank.local_accuracy || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <ProgressBar progress={(bank.local_accuracy || 0) * 100} color="green" size="sm" />
                </div>
              </div>

              {/* Card Footer Sync Info */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-[9px] text-slate-500 font-mono uppercase tracking-widest flex items-center justify-center space-x-1.5">
                <ShieldCheck size={12} className="text-emerald-600 dark:text-cyber-green" />
                <span>PARTITION SYNC SYSLOG OK</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
