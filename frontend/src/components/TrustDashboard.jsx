import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { api } from '../services/api';
import { Landmark, TrendingUp, Cpu, Award, ShieldAlert, Sparkles } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

export const TrustDashboard = ({ banks }) => {
  const [selectedBankId, setSelectedBankId] = useState(1);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (banks.length === 0) return;
      setLoading(true);
      try {
        const data = await api.getBankTrustScore(selectedBankId);
        setHistory(data.history || []);
      } catch (err) {
        console.error("Failed to load trust history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedBankId, banks]);

  // Selected bank object
  const selectedBank = banks.find(b => b.id === selectedBankId);

  // Trust ranking bar chart data
  const barChartData = banks.map(b => ({
    name: b.name.replace(" Bank", "").replace(" Credit Union", "").replace(" Trust", "").replace(" Financial", "").replace(" Bancorp", ""),
    Trust: b.current_trust_score,
  }));

  // Selected bank radar chart calculations
  const latestMetric = history.length > 0 ? history[history.length - 1] : null;
  const radarData = [
    { subject: 'Validation Acc (40%)', A: selectedBank ? (selectedBank.local_accuracy || 0.8) * 100 : 80, fullMark: 100 },
    { subject: 'Consistency (30%)', A: latestMetric ? (latestMetric.consistency || 0.9) * 100 : 90, fullMark: 100 },
    { subject: 'Reliability (30%)', A: latestMetric ? (latestMetric.reliability || 0.95) * 100 : 95, fullMark: 100 },
  ];

  // Recharts color palettes
  const BAR_COLORS = ['#00E5FF', '#00FF9D', '#8B5CF6', '#FFB547', '#FF5A5A'];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">Trust Score Matrix</h1>
        <p className="text-xs text-slate-500">Visualization of dynamic reliability weighting based on accuracy, consistency, and connection metrics.</p>
      </div>

      {/* Overview Rankings & Radar Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Bar chart Rankings */}
        <div className="lg:col-span-1">
          <GlassCard glowColor="cyan" className="flex flex-col justify-between h-full">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-455 mb-4">
                Node Trust Rankings
              </h2>
            </div>
            
            <div className="h-60 flex items-center justify-center relative">
              {banks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis domain={[0, 1]} stroke="#64748b" fontSize={9} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="Trust" fill="#00E5FF" radius={[5, 5, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs italic">No bank shards verified</div>
              )}
            </div>

            <div className="bg-slate-950/65 p-3.5 rounded-2xl border border-slate-850 mt-4 text-[10px] space-y-1.5 text-slate-400 font-mono">
              <div className="text-[9px] font-bold uppercase tracking-wider text-cyber-cyan mb-1">Telemetry Breakdown Weights</div>
              <div className="flex justify-between">
                <span>Validation Accuracy (Weight):</span>
                <span className="text-white font-bold font-mono-numbers">40%</span>
              </div>
              <div className="flex justify-between">
                <span>Update Consistency (Weight):</span>
                <span className="text-white font-bold font-mono-numbers">30%</span>
              </div>
              <div className="flex justify-between">
                <span>Connection Reliability (Weight):</span>
                <span className="text-white font-bold font-numbers font-mono-numbers">30%</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Center Column: selected bank radar composition */}
        <div className="lg:col-span-1">
          <GlassCard glowColor="purple" className="flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-455">
                Factor Decomposition
              </h2>
              <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-800/30 px-2 py-0.5 rounded font-mono">
                RADAR
              </span>
            </div>

            <div className="h-60 flex items-center justify-center relative">
              {selectedBank ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                    <Radar 
                      name={selectedBank.name} 
                      dataKey="A" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.25} 
                      style={{ filter: 'drop-shadow(0 0 4px #8B5CF6)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs italic">Awaiting selection</div>
              )}
            </div>

            <div className="text-center text-[9px] text-slate-550 font-mono">
              Consensus weights factor decomposition vectors.
            </div>
          </GlassCard>
        </div>

        {/* Right Column: details and selectors */}
        <div className="lg:col-span-1">
          <GlassCard glowColor="green" className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-455">
                Node Diagnostics
              </h2>
              <div className="flex items-center space-x-1 bg-slate-950 border border-slate-850 rounded-xl px-2 py-1">
                <Landmark size={12} className="text-slate-500" />
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(Number(e.target.value))}
                  className="bg-transparent text-cyber-green font-bold text-[10px] outline-none cursor-pointer"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-950 text-white">{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 flex-grow flex flex-col justify-center">
              {selectedBank ? (
                <div className="space-y-3.5">
                  <div className="bg-slate-950/65 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award size={14} className="text-cyber-green" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Accuracy score:</span>
                    </div>
                    <span className="text-xs text-white font-mono font-bold font-mono-numbers">
                      {(selectedBank.local_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-slate-950/65 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu size={14} className="text-cyber-cyan" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consistency rating:</span>
                    </div>
                    <span className="text-xs text-white font-mono font-bold font-mono-numbers">
                      {latestMetric ? latestMetric.consistency.toFixed(3) : '1.000'}
                    </span>
                  </div>

                  <div className="bg-slate-950/65 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp size={14} className="text-cyber-amber" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reliability index:</span>
                    </div>
                    <span className="text-xs text-white font-mono font-bold font-mono-numbers">
                      {latestMetric ? latestMetric.reliability.toFixed(3) : '1.000'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs italic text-center">No node select logs</div>
              )}
            </div>

            <div className="text-center text-[9px] text-slate-500 font-mono border-t border-slate-850 pt-3 flex items-center justify-center space-x-1">
              <Sparkles size={12} className="text-cyber-green" />
              <span>Real-time consensus calibration active</span>
            </div>
          </GlassCard>
        </div>

      </div>

      {/* Historical Trust Trend Line Chart */}
      <GlassCard glowColor="cyan" className="w-full">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-455 mb-4">
          Historical Parameter Evolution Trend
        </h2>
        <div className="h-64 w-full relative">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                <XAxis dataKey="round" stroke="#64748b" fontSize={9} />
                <YAxis domain={[0, 1]} stroke="#64748b" fontSize={9} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy (40%)" stroke="#00FF9D" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="consistency" name="Consistency (30%)" stroke="#00E5FF" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="reliability" name="Reliability (30%)" stroke="#FFB547" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="trust_score" name="Global Trust Score" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-550 text-xs italic border border-dashed border-slate-800 rounded-2xl">
              No historical trends logged. Run training rounds to populate.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
