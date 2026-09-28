import React, { useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Square, Terminal, Cpu } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { ProgressBar } from './ui/ProgressBar';
import { useTheme } from '../context/ThemeContext';

export const TrainingMonitor = ({
  isTraining,
  currentRound,
  totalRounds,
  method,
  roundHistory,
  logs,
  onStart,
  onStop,
  roundsInput,
  setRoundsInput,
  methodInput,
  setMethodInput,
}) => {
  const terminalEndRef = useRef(null);
  const { isDark } = useTheme();

  // Group round history
  const groupedDataMap = {};
  roundHistory.forEach((h) => {
    const r = h.round;
    if (!groupedDataMap[r]) {
      groupedDataMap[r] = { round: r };
    }
    if (h.method === 'FedAvg') {
      groupedDataMap[r]['FedAvg Accuracy'] = h.accuracy * 100;
      groupedDataMap[r]['FedAvg Loss'] = h.loss;
    } else if (h.method === 'Trust-FL') {
      groupedDataMap[r]['Trust-FL Accuracy'] = h.accuracy * 100;
      groupedDataMap[r]['Trust-FL Loss'] = h.loss;
    }
  });

  const chartData = Object.values(groupedDataMap).sort((a, b) => a.round - b.round);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const progressPercent = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0;
  const remainingSeconds = isTraining ? totalRounds - currentRound : 0;

  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
    borderRadius: '12px',
    color: isDark ? '#fff' : '#0F172A',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors duration-300">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Federated Convergence Monitor</h1>
        <p className="text-xs text-slate-600 dark:text-slate-500">Launch sharded model parameter consolidations, adjust learning rates, and trace weight drift dynamics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Command panel */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard glowColor="purple" className="flex flex-col justify-between h-full space-y-6 min-h-[380px]">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-5 flex items-center space-x-2">
                <Cpu size={14} className="text-purple-600 dark:text-cyber-purple" />
                <span>Training Controller</span>
              </h2>

              <div className="space-y-4">
                {/* Aggregation Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Aggregation Protocol</label>
                  <select
                    value={methodInput}
                    onChange={(e) => setMethodInput(e.target.value)}
                    disabled={isTraining}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm dark:shadow-none"
                  >
                    <option value="Trust-FL" className="bg-white dark:bg-slate-950">Trust-FL (Dynamic Weighting)</option>
                    <option value="FedAvg" className="bg-white dark:bg-slate-950">FedAvg (Uniform Averaging)</option>
                  </select>
                </div>

                {/* Rounds Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Communication Rounds</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={roundsInput}
                    onChange={(e) => setRoundsInput(Number(e.target.value))}
                    disabled={isTraining}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono-numbers shadow-sm dark:shadow-none"
                  />
                </div>
              </div>
            </div>

            {/* Current Active Telemetry */}
            {isTraining && (
              <div className="bg-slate-100/70 dark:bg-slate-950/65 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  <span>Rounds Progress</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono-numbers">{currentRound} / {totalRounds}</span>
                </div>
                <ProgressBar progress={progressPercent} color="purple" size="sm" animated={true} />
                
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono pt-1">
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm dark:shadow-none">
                    <span className="text-[8px] text-slate-500 block leading-none">SHARD METHOD</span>
                    <span className="text-purple-600 dark:text-cyber-purple font-bold mt-1 block">{method}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm dark:shadow-none">
                    <span className="text-[8px] text-slate-500 block leading-none">EST REMAINING</span>
                    <span className="text-emerald-600 dark:text-cyber-green font-bold mt-1 block font-mono-numbers">{remainingSeconds}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Control Actions */}
            <div className="pt-2">
              {!isTraining ? (
                <button
                  onClick={() => onStart(roundsInput, methodInput)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all glow-purple cursor-pointer shadow-md"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span className="uppercase text-xs tracking-wider">Launch Convergence</span>
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all glow-red cursor-pointer shadow-md"
                >
                  <Square className="h-4 w-4 fill-white" />
                  <span className="uppercase text-xs tracking-wider">Halt Learning Shard</span>
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Columns: charts & events */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Accuracy Plot */}
          <GlassCard glowColor="cyan">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-4">
              Model Accuracy Curves (%)
            </h2>
            <div className="h-60 w-full relative">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)"} />
                    <XAxis dataKey="round" stroke={isDark ? "#64748b" : "#475569"} fontSize={9} />
                    <YAxis domain={[70, 100]} stroke={isDark ? "#64748b" : "#475569"} fontSize={9} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#fff' : '#0F172A' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9, color: isDark ? '#94a3b8' : '#475569' }} />
                    <Line type="monotone" dataKey="Trust-FL Accuracy" name="Trust-FL Accuracy" stroke="#00E5FF" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="FedAvg Accuracy" name="FedAvg Accuracy" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs italic border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                  Awaiting learning round initialization...
                </div>
              )}
            </div>
          </GlassCard>

          {/* Loss Curve Plot */}
          <GlassCard glowColor="red">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-4">
              Model Loss Evolution
            </h2>
            <div className="h-60 w-full relative">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)"} />
                    <XAxis dataKey="round" stroke={isDark ? "#64748b" : "#475569"} fontSize={9} />
                    <YAxis stroke={isDark ? "#64748b" : "#475569"} fontSize={9} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#fff' : '#0F172A' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9, color: isDark ? '#94a3b8' : '#475569' }} />
                    <Line type="monotone" dataKey="Trust-FL Loss" name="Trust-FL Loss" stroke="#FF5A5A" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="FedAvg Loss" name="FedAvg Loss" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs italic border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                  Awaiting loss data...
                </div>
              )}
            </div>
          </GlassCard>

          {/* Console */}
          <div className="bg-white/80 dark:bg-[#0A1628]/65 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col h-60">
            <div className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/60 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                <Terminal className="h-4 w-4 text-purple-600 dark:text-cyber-purple" />
                <span>Simulation Event Console</span>
              </div>
              <div className="flex space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-[10px] text-slate-700 dark:text-slate-300 space-y-1.5 flex-grow scrollbar bg-slate-900 text-slate-200 dark:bg-transparent">
              {logs.length > 0 ? (
                logs.map((log, idx) => {
                  let color = 'text-slate-300';
                  if (log.level === 'WARNING') color = 'text-amber-400 dark:text-cyber-amber';
                  if (log.level === 'ERROR') color = 'text-red-400 dark:text-cyber-red';
                  if (log.message.includes('complete')) color = 'text-emerald-400 dark:text-cyber-green';

                  return (
                    <div key={idx} className={`leading-relaxed border-l-2 pl-2 ${
                      log.level === 'ERROR' ? 'border-red-500 bg-red-950/20' : log.level === 'WARNING' ? 'border-amber-500 bg-amber-950/20' : 'border-slate-700'
                    }`}>
                      <span className="text-slate-400 font-mono-numbers">[{log.timestamp}]</span>{' '}
                      <span className={color}>{log.message}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-500 italic">Terminal logs inactive. Initialize convergence...</div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
