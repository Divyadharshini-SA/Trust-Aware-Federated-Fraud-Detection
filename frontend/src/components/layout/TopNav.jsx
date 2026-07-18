import React, { useState, useEffect } from 'react';
import { Shield, Bell, Moon, Sun, ChevronDown, Radio, Activity, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TopNav = ({ error, theme, toggleTheme }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const intv = setInterval(() => {
      setLatency(prev => Math.max(5, Math.min(30, prev + Math.floor(Math.random() * 5) - 2)));
    }, 4000);
    return () => clearInterval(intv);
  }, []);

  return (
    <header className="h-16 glass-panel border-b px-6 flex items-center justify-between shrink-0 relative z-40">
      
      {/* Brand logo & platform title */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-cyan-400 to-purple-600 p-2.5 rounded-xl text-white shadow-neon-cyan flex items-center justify-center border border-white/10">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center space-x-1.5">
            <span>TRUST-FL COMMAND</span>
            <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal">
              SHARDED
            </span>
          </h1>
          <span className="text-[9px] text-slate-450 uppercase font-mono tracking-widest block">
            Trust-Aware Federated Fraud Detection Dashboard
          </span>
        </div>
      </div>

      {/* Control console elements */}
      <div className="flex items-center space-x-5">
        
        {/* Connection Diagnostics */}
        <div className="hidden lg:flex items-center space-x-4 text-[10px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>SHARD PING:</span>
            <span className="text-cyan-400 font-bold">{latency}ms</span>
          </div>

          <div className="h-3 w-px bg-slate-800"></div>

          <div className="flex items-center space-x-2">
            <span>STATUS:</span>
            {error ? (
              <span className="px-2.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-455 font-bold flex items-center space-x-1 glow-rose">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>🔴 ALERT MODE</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-450 font-bold flex items-center space-x-1 glow-emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>🟢 SYSTEM ONLINE</span>
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-800"></div>

        {/* Real-time Clock */}
        <div className="hidden sm:block text-xs font-mono font-bold text-slate-200 bg-slate-950/60 border border-slate-850 px-3.5 py-1.5 rounded-xl">
          {time}
        </div>

        {/* Theme Switch */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-850 hover:border-cyan-500/40 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-400" />}
        </button>

        {/* Alerts Bell */}
        <div className="relative">
          <button 
            onClick={() => { setBellOpen(!bellOpen); setUserOpen(false); }}
            className="p-2 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-850 hover:border-cyan-500/40 text-slate-400 hover:text-white cursor-pointer transition-colors relative"
          >
            <Bell size={15} />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center animate-bounce">
              2
            </span>
          </button>
          
          <AnimatePresence>
            {bellOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 space-y-2.5"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-1">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Telemetry Alerts</span>
                  <span className="text-[8px] text-cyan-400 font-mono">2 NEW</span>
                </div>
                <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-950/10 text-[10px] flex items-start space-x-2">
                  <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-rose-455 font-bold">Spike Detected on Shard 4</p>
                    <p className="text-slate-400">Suspicious activities crossed 3.75% threshold.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/10 text-[10px] flex items-start space-x-2">
                  <Radio size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-cyan-400 font-bold">Consolidated Node Sync</p>
                    <p className="text-slate-400">Trust scores successfully recalibrated.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Card */}
        <div className="relative">
          <button 
            onClick={() => { setUserOpen(!userOpen); setBellOpen(false); }}
            className="flex items-center space-x-2 bg-slate-950/50 hover:bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl cursor-pointer hover:border-cyan-500/40 transition-colors"
          >
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-500 text-white font-black text-xs flex items-center justify-center">
              AD
            </div>
            <ChevronDown size={12} className="text-slate-500" />
          </button>
        </div>

      </div>
    </header>
  );
};
