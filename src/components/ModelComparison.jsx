import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, RefreshCw, Sparkles } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { useTheme } from '../context/ThemeContext';

export const ModelComparison = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getAllMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load comparison metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Format Recharts data
  const chartData = [];
  if (metrics) {
    const keys = ['accuracy', 'precision', 'recall', 'f1', 'auc_roc'];
    const names = {
      accuracy: 'Accuracy',
      precision: 'Precision',
      recall: 'Recall',
      f1: 'F1-Score',
      auc_roc: 'AUC-ROC',
    };

    keys.forEach((k) => {
      const item = { name: names[k] };
      if (metrics.centralized_xgboost) {
        item['Centralized XGBoost'] = Number((metrics.centralized_xgboost[k] * 100).toFixed(1));
      }
      if (metrics.centralized_mlp) {
        item['Centralized MLP'] = Number((metrics.centralized_mlp[k] * 100).toFixed(1));
      }
      if (metrics.fedavg) {
        item['FedAvg MLP'] = Number((metrics.fedavg[k] * 100).toFixed(1));
      }
      if (metrics.trust_fl) {
        item['Trust-FL MLP'] = Number((metrics.trust_fl[k] * 100).toFixed(1));
      }
      chartData.push(item);
    });
  }

  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
    borderRadius: '12px',
    color: isDark ? '#fff' : '#0F172A',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };

  const renderMetricCard = (title, key, data, colorClass, borderClass, highlight = false) => {
    if (!data) {
      return (
        <GlassCard className="flex flex-col justify-between min-h-[260px] opacity-40">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">{title}</h3>
            <span className="text-[9px] font-mono text-slate-500 block">NOT YET COMPILED</span>
          </div>
          <div className="text-center text-[10px] italic text-slate-500 font-mono">No telemetry data logged.</div>
        </GlassCard>
      );
    }

    return (
      <GlassCard 
        glowColor={highlight ? 'cyan' : ''}
        className={`flex flex-col justify-between min-h-[260px] relative ${
          highlight 
            ? 'border-sky-400/60 dark:border-cyan-400/40 shadow-md dark:shadow-neon-cyan ring-1 ring-sky-500/20 dark:ring-cyan-500/20' 
            : 'border-slate-200 dark:border-slate-800/80'
        }`}
      >
        {highlight && (
          <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-[#00D4FF] to-indigo-500 text-white text-[8px] font-black font-mono px-2.5 py-0.5 rounded-full border border-cyan-400/40 shadow-lg glow-teal">
            PLATFORM DEPLOYED (BEST)
          </span>
        )}

        <div className="space-y-4">
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${colorClass}`}>{title}</h3>
            <span className="text-[8px] text-slate-500 font-mono block">SHARD EVALUATION</span>
          </div>

          <div className="space-y-2 font-mono text-[10px] text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span>ACCURACY:</span>
              <span className="text-slate-900 dark:text-white font-bold font-mono-numbers">{(data.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>PRECISION:</span>
              <span className="text-slate-600 dark:text-slate-400 font-mono-numbers">{(data.precision * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>RECALL:</span>
              <span className="text-slate-600 dark:text-slate-400 font-mono-numbers">{(data.recall * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>F1 SCORE:</span>
              <span className="text-slate-900 dark:text-white font-semibold font-mono-numbers">{(data.f1 * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-850 pt-1.5 mt-1 text-[#0284C7] dark:text-cyber-cyan font-bold">
              <span>AUC-ROC:</span>
              <span className="font-mono-numbers">{(data.auc_roc * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-slate-500 font-mono border-t border-slate-200 dark:border-slate-850 pt-2 flex items-center justify-between">
          <span>{highlight ? 'Secure FL Weights' : 'Standard Baseline'}</span>
          {highlight && <Sparkles size={11} className="text-sky-500 dark:text-cyan-400" />}
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3 transition-colors duration-300">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Benchmark Matrix</h1>
          <p className="text-xs text-slate-600 dark:text-slate-500">Benchmark validation performance of Centralized XGBoost vs Centralized Neural Networks vs Federated architectures.</p>
        </div>
        
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="self-start sm:self-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-[#0284C7] dark:text-cyber-cyan border border-slate-300 dark:border-slate-800 hover:border-sky-500/40 dark:hover:border-cyan-500/40 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer shadow-sm dark:shadow-none"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Benchmarks</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel border-slate-200 dark:border-slate-850 py-12 text-center text-slate-500 text-xs font-mono">
          Loading metrics benchmarks...
        </div>
      ) : metrics ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Three comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderMetricCard(
              "Centralized baseline MLP", 
              "centralized_mlp", 
              metrics.centralized_mlp || metrics.centralized_xgboost, 
              "text-emerald-600 dark:text-cyber-green", 
              "border-emerald-500/20"
            )}
            
            {renderMetricCard(
              "Federated FedAvg", 
              "fedavg", 
              metrics.fedavg, 
              "text-slate-600 dark:text-slate-400", 
              "border-slate-200 dark:border-slate-800"
            )}
            
            {renderMetricCard(
              "Federated Trust-FL", 
              "trust_fl", 
              metrics.trust_fl, 
              "text-[#0284C7] dark:text-cyber-cyan", 
              "border-sky-500/20 dark:border-neon-cyan/20",
              true
            )}
          </div>

          {/* Recharts Bar Chart */}
          {chartData.length > 0 && (
            <GlassCard glowColor="cyan">
              <div className="flex items-center space-x-2.5 mb-5">
                <BarChart3 className="h-5 w-5 text-[#0284C7] dark:text-cyber-cyan" />
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Visual Benchmark Comparison (%)
                </h2>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)"} />
                    <XAxis dataKey="name" stroke={isDark ? "#64748b" : "#475569"} fontSize={9} />
                    <YAxis domain={[70, 100]} stroke={isDark ? "#64748b" : "#475569"} fontSize={9} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#fff' : '#0F172A' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9, color: isDark ? '#94a3b8' : '#475569' }} />
                    <Bar dataKey="Centralized XGBoost" fill="#00FF9D" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Centralized MLP" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="FedAvg MLP" fill="#64748b" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Trust-FL MLP" fill="#00E5FF" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}
        </div>
      ) : (
        <GlassCard className="border-slate-300 dark:border-slate-850 py-12 text-center text-slate-500 text-xs font-mono border-dashed">
          No baseline parameters saved. Sync benchmarks to evaluate model accuracy comparisons.
        </GlassCard>
      )}
    </div>
  );
};
