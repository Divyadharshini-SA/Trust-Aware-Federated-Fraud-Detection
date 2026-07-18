import React, { useRef, useEffect } from 'react';
import { Terminal, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const ActivityFeed = ({ logs = [] }) => {
  const feedEndRef = useRef(null);

  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Fallback default system messages if logs is empty
  const activeLogs = logs.length > 0 ? logs : [
    { timestamp: '18:30:12', level: 'INFO', message: 'Federated security sharding network active.' },
    { timestamp: '18:31:05', level: 'INFO', message: 'Sync handshake established with Apex Bank Node.' },
    { timestamp: '18:32:00', level: 'WARNING', message: 'Minor communication delay on Credit Union Node.' }
  ];

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between h-[280px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Terminal size={14} className="text-[#00D4FF]" />
          <span>Real-Time Activity Feed</span>
        </h3>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] animate-ping"></span>
          <span className="text-[8px] font-mono text-[#00FF88] uppercase font-bold">STREAM</span>
        </span>
      </div>

      <div className="flex-1 bg-slate-950/60 border border-white/5 rounded-xl p-3 overflow-y-auto max-h-44 font-mono text-[10px] space-y-2.5 text-slate-300 scrollbar">
        {activeLogs.map((log, idx) => {
          let lineStyle = 'border-l border-white/5 pl-2.5';
          let levelIcon = <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />;
          let msgColor = 'text-slate-300';
          
          if (log.level === 'ERROR') {
            lineStyle = 'border-l-2 border-[#FF4D4D] pl-2.5 bg-[#FF4D4D]/5';
            levelIcon = <AlertTriangle size={12} className="text-[#FF4D4D] mt-0.5 shrink-0" />;
            msgColor = 'text-[#FF4D4D] font-semibold';
          } else if (log.level === 'WARNING') {
            lineStyle = 'border-l-2 border-[#FFB800] pl-2.5 bg-[#FFB800]/5';
            levelIcon = <AlertTriangle size={12} className="text-[#FFB800] mt-0.5 shrink-0 animate-pulse" />;
            msgColor = 'text-[#FFB800] font-semibold';
          } else if (log.message.includes('complete') || log.message.includes('success')) {
            lineStyle = 'border-l-2 border-[#00FF88] pl-2.5';
            levelIcon = <CheckCircle2 size={12} className="text-[#00FF88] mt-0.5 shrink-0" />;
            msgColor = 'text-[#00FF88] font-bold';
          }

          return (
            <div key={idx} className={`flex items-start gap-2 leading-relaxed transition-all duration-300 ${lineStyle}`}>
              {levelIcon}
              <div className="flex-grow">
                <span className="text-slate-500 font-mono-numbers">[{log.timestamp}]</span>{' '}
                <span className={msgColor}>{log.message}</span>
              </div>
            </div>
          );
        })}
        <div ref={feedEndRef} />
      </div>

      <div className="text-[9px] text-slate-650 font-mono mt-3 text-right">
        Secure WebSocket Tunnel: ws://127.0.0.1:8000/ws
      </div>
    </div>
  );
};
export default ActivityFeed;
