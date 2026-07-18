import React from 'react';
import { 
  LayoutDashboard, 
  Landmark, 
  ShieldCheck, 
  Activity, 
  Radar, 
  BarChart3, 
  Settings,
  ShieldAlert
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, banks }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'banks', label: 'Bank Nodes', icon: Landmark },
    { id: 'trust', label: 'Trust Scores', icon: ShieldCheck },
    { id: 'training', label: 'Training Monitor', icon: Activity },
    { id: 'prediction', label: 'Fraud Predictor', icon: Radar },
    { id: 'comparison', label: 'Benchmarks', icon: BarChart3 },
    { id: 'settings', label: 'Configuration', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/50 backdrop-blur-md border-r border-white/10 flex flex-col h-full z-20">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="bg-[#00D4FF]/10 p-2 rounded-xl text-[#00D4FF] border border-[#00D4FF]/20 shadow-[0_0_10px_rgba(0,212,255,0.15)]">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest text-white uppercase leading-none">TRUST-FL</h2>
          <span className="text-[9px] text-[#00D4FF] font-mono tracking-widest uppercase block mt-1">SHARD CONTROL</span>
        </div>
      </div>

      {/* Nav Link Items */}
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isDisabled = banks.length === 0 && item.id !== 'settings';

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && setActiveTab(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 shadow-[0_0_12px_rgba(0,212,255,0.1)]' 
                  : isDisabled
                  ? 'text-slate-650 cursor-not-allowed opacity-30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#00D4FF]' : 'text-slate-400'} />
              <span>{item.label}</span>
              
              {isDisabled && (
                <span className="ml-auto text-[8px] font-mono bg-white/5 text-slate-500 px-1 py-0.5 rounded border border-white/10">
                  LOCK
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* CS footer */}
      <div className="p-4 border-t border-white/10 text-center">
        <span className="text-[9px] text-slate-500 font-mono tracking-widest block uppercase">DEPT OF CS | SEM 7</span>
      </div>
    </aside>
  );
};
