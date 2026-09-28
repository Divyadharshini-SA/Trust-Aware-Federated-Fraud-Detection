import React, { useState } from 'react';
import { ArrowUpDown, Landmark } from 'lucide-react';

export const TrustScoreTable = ({ banks }) => {
  const [sortKey, setSortKey] = useState('current_trust_score');
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedBanks = [...banks].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const getTrustBadge = (score) => {
    let style = 'bg-red-500/10 text-red-600 dark:text-[#FF4D4D] border-red-500/20';
    let label = 'Poor';

    if (score >= 0.95) {
      style = 'bg-emerald-500/10 text-emerald-700 dark:text-[#00FF88] border-emerald-500/20';
      label = 'Excellent';
    } else if (score >= 0.85) {
      style = 'bg-amber-500/10 text-amber-700 dark:text-[#FFB800] border-amber-500/20';
      label = 'Good';
    } else if (score >= 0.70) {
      style = 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      label = 'Fair';
    }

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border font-mono ${style}`}>
        {score.toFixed(3)} ({label})
      </span>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
          Dynamic Bank Trust Rankings
        </h3>
        <span className="text-[9px] text-[#0284C7] dark:text-[#00D4FF] font-mono font-bold bg-[#00D4FF]/10 px-2.5 py-1 rounded-xl border border-[#00D4FF]/20">
          NODE MATRIX
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold text-[10px] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1.5">
                  <span>Bank Shard</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('transaction_count')}>
                <div className="flex items-center gap-1.5">
                  <span>Data Size</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('fraud_count')}>
                <div className="flex items-center gap-1.5">
                  <span>Fraud Shards</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('local_accuracy')}>
                <div className="flex items-center gap-1.5">
                  <span>Local Accuracy</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('current_trust_score')}>
                <div className="flex items-center gap-1.5 justify-end">
                  <span>Consensus Trust</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {sortedBanks.map((bank, index) => {
              const initials = bank.name ? bank.name.substring(0, 2).toUpperCase() : `B${bank.id}`;
              const colors = [
                'bg-sky-500/10 text-sky-700 dark:text-[#00D4FF]', 
                'bg-emerald-500/10 text-emerald-700 dark:text-[#00FF88]', 
                'bg-purple-500/10 text-purple-700 dark:text-[#8B5CF6]'
              ];
              const col = colors[index % colors.length];

              return (
                <tr key={bank.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 font-mono text-xs ${col}`}>
                      {initials}
                    </div>
                    <div>
                      <span className="block text-xs">{bank.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">NODE_PART_0{bank.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono-numbers">
                    {(bank.transaction_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-red-600 dark:text-[#FF4D4D] font-bold font-mono-numbers">
                    {(bank.fraud_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 font-mono-numbers">
                    {((bank.local_accuracy || 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {getTrustBadge(bank.current_trust_score || 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TrustScoreTable;
