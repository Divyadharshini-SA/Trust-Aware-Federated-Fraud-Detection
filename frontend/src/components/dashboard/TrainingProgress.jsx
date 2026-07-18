import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { Cpu, Clock, Layers } from 'lucide-react';

export const TrainingProgress = ({ isTraining, currentRound, totalRounds, method }) => {
  const percent = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0;
  
  // Calculate simulated remaining time (approx 1 round per second)
  const remainingSeconds = isTraining ? totalRounds - currentRound : 0;

  return (
    <GlassCard className="border-slate-800/80 flex flex-col justify-between h-full min-h-[220px]">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-450 flex items-center space-x-2">
            <Cpu size={14} className="text-indigo-400" />
            <span>Federated Training Shard</span>
          </h3>
          {isTraining ? (
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 pulse-glow-indicator">
              TRAINING IN PROGRESS
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
              STANDBY
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 flex-grow flex flex-col justify-center">
        {isTraining ? (
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Rounds Converged</span>
              <span className="text-white font-bold font-numbers">{currentRound} / {totalRounds}</span>
            </div>
            
            <ProgressBar progress={percent} color="cyan" size="md" animated={true} />

            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
              <div className="bg-slate-950/60 p-2.5 border border-slate-850 rounded-xl flex items-center space-x-2.5">
                <Layers size={14} className="text-indigo-400" />
                <div>
                  <span className="text-[8px] text-slate-500 font-mono block leading-none">METHOD</span>
                  <span className="text-xs font-bold text-white mt-1 block">{method}</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 border border-slate-850 rounded-xl flex items-center space-x-2.5">
                <Clock size={14} className="text-emerald-400 animate-pulse" />
                <div>
                  <span className="text-[8px] text-slate-500 font-mono block leading-none">EST TIME REMAINING</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block font-numbers">
                    {remainingSeconds > 0 ? `${remainingSeconds}s` : '0s'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
            <Layers className="h-6 w-6 text-slate-650" />
            <p>Federated convergence engine is currently idle.</p>
            <p className="text-[10px] text-slate-600 font-mono">Navigate to "Training Monitor" to launch communications.</p>
          </div>
        )}
      </div>

      <div className="text-[9px] text-slate-500 font-mono mt-3">
        Engine Status: {isTraining ? 'Active Sharding' : 'Standby'}
      </div>
    </GlassCard>
  );
};
