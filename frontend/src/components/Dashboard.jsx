import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { 
  Database, ShieldAlert, Percent, Landmark, Award, Cpu, 
  Activity as HeartbeatIcon, Wifi, Radio, Bell, Shield, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { AnimatedCounter } from './ui/AnimatedCounter';
import { FraudDistributionChart } from './dashboard/FraudDistributionChart';
import { BankTrustTable } from './dashboard/BankTrustTable';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { TrainingProgress } from './dashboard/TrainingProgress';

// Helper component for KPI Cards with inline sparkline charts
const KPICard = ({ title, value, subtitle, icon: Icon, trend, trendUp, data = [], color = 'cyan' }) => {
  let glowStyle = 'cyan';
  let borderClass = 'border-neon-cyan/25';
  let textClass = 'text-cyber-cyan';
  let lineStroke = '#00E5FF';

  if (color === 'green') {
    glowStyle = 'green';
    borderClass = 'border-neon-green/25';
    textClass = 'text-cyber-green';
    lineStroke = '#00FF9D';
  } else if (color === 'red') {
    glowStyle = 'red';
    borderClass = 'border-neon-red/25';
    textClass = 'text-cyber-red';
    lineStroke = '#FF5A5A';
  } else if (color === 'amber') {
    glowStyle = 'amber';
    borderClass = 'border-neon-amber/25';
    textClass = 'text-cyber-amber';
    lineStroke = '#FFB547';
  } else if (color === 'purple') {
    glowStyle = 'purple';
    borderClass = 'border-neon-purple/25';
    textClass = 'text-cyber-purple';
    lineStroke = '#8B5CF6';
  }

  return (
    <GlassCard glowColor={glowStyle} className="relative overflow-hidden flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">
            {title}
          </span>
          <h4 className="text-xl font-black text-white mt-1">
            <AnimatedCounter value={value} />
          </h4>
        </div>
        <div className={`p-2 rounded-xl bg-slate-900/80 border ${borderClass} ${textClass} shadow-lg`}>
          <Icon size={16} />
        </div>
      </div>

      <div className="flex items-end justify-between mt-4">
        <div className="space-y-1">
          {trend && (
            <div className={`flex items-center space-x-1 text-[9px] font-mono font-bold ${trendUp ? 'text-cyber-green' : 'text-slate-400'}`}>
              {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              <span>{trend}</span>
            </div>
          )}
          <span className="text-[8px] text-slate-500 font-mono block">
            {subtitle}
          </span>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="w-16 h-8 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke={lineStroke} 
                strokeWidth={1.5} 
                dot={false} 
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlassCard>
  );
};

export const Dashboard = ({ 
  banks = [], 
  globalAccuracy = 0, 
  logs = [], 
  isTraining = false, 
  currentRound = 0, 
  totalRounds = 0, 
  method = 'Trust-FL' 
}) => {
  // Aggregate statistics
  const totalTransactions = banks.reduce((acc, bank) => acc + (bank.transaction_count || 0), 0);
  const totalFraud = banks.reduce((acc, bank) => acc + (bank.fraud_count || 0), 0);
  const totalNonFraud = totalTransactions - totalFraud;
  const activeBanks = banks.filter(bank => bank.status === 'online').length;

  const fraudPercentage = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;
  
  const avgTrustScore = banks.length > 0 
    ? banks.reduce((acc, b) => acc + (b.current_trust_score || 0), 0) / banks.length 
    : 0;

  // Static/historical preview streams for sparklines
  const sparkData1 = [{ val: 10 }, { val: 30 }, { val: 15 }, { val: 45 }, { val: 32 }, { val: 60 }, { val: 55 }];
  const sparkData2 = [{ val: 5 }, { val: 12 }, { val: 8 }, { val: 20 }, { val: 15 }, { val: 28 }, { val: 35 }];
  const sparkData3 = [{ val: 2.1 }, { val: 3.5 }, { val: 1.8 }, { val: 4.2 }, { val: 2.9 }, { val: 3.7 }, { val: 3.75 }];
  const sparkData4 = [{ val: 2 }, { val: 3 }, { val: 4 }, { val: 4 }, { val: 5 }, { val: 5 }, { val: 5 }];
  const sparkData5 = [{ val: 80 }, { val: 88 }, { val: 92 }, { val: 90 }, { val: 95 }, { val: 97 }, { val: globalAccuracy * 100 || 98.2 }];
  const sparkData6 = [{ val: 0.8 }, { val: 0.85 }, { val: 0.9 }, { val: 0.88 }, { val: 0.92 }, { val: 0.96 }, { val: avgTrustScore || 0.98 }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* ======================================================
          CENTER COLUMN & LEFT MAIN VIEWPORTS (lg:col-span-3)
          ====================================================== */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Command Matrix Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-black text-white tracking-widest uppercase">
              Financial Security Control Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Futuristic sharded machine learning partitions and weight validations.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/45 px-3 py-1 rounded-full border border-cyan-800/30 glow-teal">
            <Radio size={12} className="animate-pulse" />
            <span>Telemetry online</span>
          </div>
        </div>

        {/* 6 Premium KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard 
            title="Total Transactions" 
            value={totalTransactions} 
            subtitle="Synced record pipelines" 
            icon={Database} 
            trend="+12.5% ↑ last round" 
            trendUp={true}
            data={sparkData1}
            color="cyan"
          />
          <KPICard 
            title="Fraud Transactions" 
            value={totalFraud} 
            subtitle="Flagged suspicious threat blocks" 
            icon={ShieldAlert} 
            trend="+4.2% ↑ threat increase" 
            trendUp={true}
            data={sparkData2}
            color="red"
          />
          <KPICard 
            title="Fraud Rate" 
            value={fraudPercentage} 
            subtitle="Platform target threshold < 5%" 
            icon={Percent} 
            trend="-0.85% ↓ drift decrease" 
            trendUp={false}
            data={sparkData3}
            color="amber"
          />
          <KPICard 
            title="Active Bank Nodes" 
            value={`${activeBanks}/${banks.length}`} 
            subtitle="Decentralized storage arrays" 
            icon={Landmark} 
            trend="All nodes operational" 
            trendUp={true}
            data={sparkData4}
            color="purple"
          />
          <KPICard 
            title="Global Accuracy" 
            value={globalAccuracy * 100} 
            subtitle="Consolidated validation score" 
            icon={ActivityFeed} 
            trend="+1.2% ↑ training loop" 
            trendUp={true}
            data={sparkData5}
            color="green"
          />
          <KPICard 
            title="Average Trust Score" 
            value={avgTrustScore} 
            subtitle="Reliability index average" 
            icon={Award} 
            trend="Steady consensus weights" 
            trendUp={true}
            data={sparkData6}
            color="green"
          />
        </div>

        {/* Training Telemetry & Fraud distribution donut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrainingProgress 
            isTraining={isTraining} 
            currentRound={currentRound} 
            totalRounds={totalRounds} 
            method={method} 
          />
          <FraudDistributionChart 
            totalTransactions={totalTransactions} 
            totalFraud={totalFraud} 
            totalNonFraud={totalNonFraud} 
          />
        </div>

        {/* Detailed Bank node ranks */}
        <div className="w-full">
          <BankTrustTable banks={banks} />
        </div>
      </div>

      {/* ======================================================
          RIGHT PANEL: Alert feeds & monitors (lg:col-span-1)
          ====================================================== */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* System Health Shard */}
        <GlassCard glowColor="purple" className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-455 flex items-center space-x-2">
              <HeartbeatIcon size={14} className="text-purple-400" />
              <span>Core Health Monitor</span>
            </h3>
            <span className="h-1.5 w-1.5 rounded-full bg-cyber-green animate-ping"></span>
          </div>

          <div className="space-y-3 font-mono text-[10px] text-slate-350">
            <div className="flex justify-between items-center">
              <span>CPU UTILITY:</span>
              <span className="text-white font-bold font-mono-numbers">14.8%</span>
            </div>
            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full" style={{ width: '14.8%' }}></div>
            </div>

            <div className="flex justify-between items-center pt-1.5">
              <span>RAM ALLOCATION:</span>
              <span className="text-white font-bold font-mono-numbers">2.4 GB / 8 GB</span>
            </div>
            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full" style={{ width: '30%' }}></div>
            </div>

            <div className="flex justify-between items-center pt-1.5">
              <span>SHARD SECURITY SYNC:</span>
              <span className="text-cyber-green font-bold uppercase">SECURED</span>
            </div>
          </div>
        </GlassCard>

        {/* WebSocket Pipeline Status */}
        <GlassCard glowColor="cyan" className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-455 flex items-center space-x-2">
              <Wifi size={14} className="text-cyber-cyan" />
              <span>WS Telemetry Status</span>
            </h3>
            <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/30 font-bold font-mono">
              PIPE_01
            </span>
          </div>
          
          <div className="space-y-3 font-mono text-[10px] text-slate-350">
            <div className="flex justify-between">
              <span>WEBSOCKET LINK:</span>
              <span className="text-cyan-400 font-bold">CONNECTED</span>
            </div>
            <div className="flex justify-between">
              <span>CONVERGENCE SPEED:</span>
              <span className="text-white font-mono-numbers">1.0s / round</span>
            </div>
          </div>
        </GlassCard>

        {/* Real-time event console */}
        <ActivityFeed logs={logs} />
      </div>

    </div>
  );
};
