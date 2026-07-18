import React, { useState, useEffect } from 'react';
import { Shield, Bell } from 'lucide-react';

export const TopBar = ({ error }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/40 backdrop-blur-md z-10 shrink-0">
      
      {/* Platform Title */}
      <div className="flex items-center gap-3">
        <div className="bg-[#00D4FF]/10 p-2 rounded-xl text-[#00D4FF] border border-[#00D4FF]/20">
          <Shield size={18} />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-wider text-white uppercase">
            Trust-Aware Federated Fraud Detection
          </h1>
          <span className="text-[9px] text-[#00D4FF] font-mono tracking-widest block uppercase mt-0.5">
            Secured Enterprise Cyber Command
          </span>
        </div>
      </div>

      {/* Clock and dynamic status pills */}
      <div className="flex items-center gap-5">
        
        {/* Connection status pill */}
        <div className="flex items-center gap-2">
          {error ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono border border-[#FF4D4D]/20 bg-[#FF4D4D]/10 text-[#FF4D4D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D4D] animate-ping"></span>
              <span>ALERT MODE</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono border border-[#00FF88]/20 bg-[#00FF88]/10 text-[#00FF88]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] animate-pulse"></span>
              <span>SYSTEM ONLINE</span>
            </span>
          )}
        </div>

        <div className="h-5 w-px bg-white/10"></div>

        {/* Clock */}
        <div className="text-xs font-mono font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
          {time}
        </div>

        {/* Notifications and Profile */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors relative">
            <Bell size={14} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#FF4D4D] rounded-full"></span>
          </button>
          <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#00D4FF] to-[#8B5CF6] text-white text-xs font-black flex items-center justify-center border border-white/10 shadow-md">
            AD
          </div>
        </div>

      </div>
    </header>
  );
};
