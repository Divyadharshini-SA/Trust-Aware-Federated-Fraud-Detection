import React, { useState, useEffect } from 'react';
import { Shield, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const TopBar = ({ error }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md z-10 shrink-0 transition-colors duration-300 shadow-sm dark:shadow-none">
      
      {/* Platform Title */}
      <div className="flex items-center gap-3">
        <div className="bg-[#00D4FF]/10 p-2 rounded-xl text-[#0088CC] dark:text-[#00D4FF] border border-[#00D4FF]/20 shadow-sm dark:shadow-none">
          <Shield size={18} />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
            Trust-Aware Federated Fraud Detection
          </h1>
          <span className="text-[9px] text-[#0077B6] dark:text-[#00D4FF] font-mono tracking-widest block uppercase mt-0.5 font-bold">
            Secured Enterprise Cyber Command
          </span>
        </div>
      </div>

      {/* Clock and dynamic status pills */}
      <div className="flex items-center gap-4">
        
        {/* Connection status pill */}
        <div className="flex items-center gap-2">
          {error ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono border border-red-500/30 bg-red-500/10 text-red-600 dark:text-[#FF4D4D]">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-[#FF4D4D] animate-ping"></span>
              <span>ALERT MODE</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-[#00FF88]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-[#00FF88] animate-pulse"></span>
              <span>SYSTEM ONLINE</span>
            </span>
          )}
        </div>

        <div className="h-5 w-px bg-slate-300 dark:bg-white/10"></div>

        {/* Clock */}
        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-3 py-1 rounded-xl shadow-inner dark:shadow-none">
          {time}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all duration-200 text-xs font-semibold shadow-sm dark:shadow-none"
        >
          {isDark ? (
            <>
              <Sun size={15} className="text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-indigo-600" />
              <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700">Dark</span>
            </>
          )}
        </button>

        {/* Notifications and Profile */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors relative shadow-sm dark:shadow-none">
            <Bell size={14} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#00D4FF] to-[#8B5CF6] text-white text-xs font-black flex items-center justify-center border border-white/20 shadow-md">
            AD
          </div>
        </div>

      </div>
    </header>
  );
};
