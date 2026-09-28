import React, { useState } from 'react';
import { api, API_BASE } from '../services/api';
import { Upload, Database, Settings, ShieldCheck, AlertCircle, RefreshCw, Sun, Moon } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { useTheme } from '../context/ThemeContext';

export const SettingsPanel = ({ banks, onDatasetReload }) => {
  const [file, setFile] = useState(null);
  const [numBanks, setNumBanks] = useState(5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { theme, toggleTheme, isDark } = useTheme();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleInitializeDataset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.uploadDataset(file || undefined, numBanks);
      setMessage({
        type: 'success',
        text: file 
          ? `Dataset "${file.name}" uploaded and split into ${numBanks} non-IID shards successfully.`
          : `IEEE-CIS credit card fraud dataset generated and split into ${numBanks} non-IID bank shards.`
      });
      onDatasetReload();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || "Failed to initialize dataset partition shards."
      });
    } finally {
      setLoading(false);
    }
  };

  const [resetLoading, setResetLoading] = useState(false);

  const handleResetTrust = async () => {
    setResetLoading(true);
    setMessage(null);
    try {
      await api.resetTrustScores();
      setMessage({
        type: 'success',
        text: 'All bank trust scores reset back to initial 1.000!'
      });
      onDatasetReload();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to reset bank trust scores.'
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors duration-300">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Configuration Matrix</h1>
        <p className="text-xs text-slate-600 dark:text-slate-500">Configure bank node instances, generate transaction partitions, and inspect SMOTE oversampling ratios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dataset Loader Card */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard glowColor="purple" className="flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-5 flex items-center space-x-2">
                <Database className="h-5 w-5 text-purple-600 dark:text-cyber-purple" />
                <span>Dataset Loader Shard</span>
              </h2>

              <form onSubmit={handleInitializeDataset} className="space-y-4">
                {/* File Picker */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Upload custom CSV (Optional)</label>
                  <div className="border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-6 w-6 text-slate-400 dark:text-slate-505 mx-auto mb-2" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {file ? file.name : "Click or drag CSV file here"}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Defaults to synthetic IEEE-CIS template if blank.</p>
                  </div>
                </div>

                {/* Bank Clients Counts */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Simulated Bank Clients (Non-IID)</label>
                  <select
                    value={numBanks}
                    onChange={(e) => setNumBanks(Number(e.target.value))}
                    disabled={loading}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-purple-500 transition-colors cursor-pointer shadow-sm dark:shadow-none"
                  >
                    <option value="3" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">3 Banks Nodes</option>
                    <option value="4" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">4 Banks Nodes</option>
                    <option value="5" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">5 Banks Nodes</option>
                  </select>
                </div>

                {/* Status report */}
                {message && (
                  <div className={`p-3.5 rounded-xl border text-[11px] flex items-start space-x-2 leading-relaxed ${
                    message.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-cyber-green glow-emerald' 
                      : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-cyber-red glow-rose'
                  }`}>
                    {message.type === 'success' ? (
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-cyber-green shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4.5 w-4.5 text-red-500 dark:text-cyber-red shrink-0 mt-0.5" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg glow-purple"
                >
                  {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span className="uppercase text-xs tracking-wider">{loading ? "Re-partitioning..." : "Initialize Dataset"}</span>
                </button>
              </form>
            </div>

            <div className="bg-slate-100/80 dark:bg-slate-950/65 p-3.5 rounded-xl border border-slate-200 dark:border-slate-855 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-mono space-y-1">
              <span className="text-[9px] font-bold text-purple-600 dark:text-cyber-purple uppercase tracking-widest block mb-1">Preprocessing Telemetry</span>
              <div>1. Clean missing values (Median/Mode replacement)</div>
              <div>2. Feature encodes (ProductCD, card4, card6, Email)</div>
              <div>3. Normalize metrics (StandardScaler on numeric values)</div>
              <div>4. Non-IID Split (Card1 sorted index slicing)</div>
              <div>5. Local Oversampling (SMOTE balanced per Bank node)</div>
            </div>
          </GlassCard>

          {/* Reset Trust Scores Card */}
          <GlassCard glowColor="emerald">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-cyber-green" />
              <span>Trust Reset Control</span>
            </h2>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Reset all bank trust scores back to initial state (1.000) and wipe previous round history metrics.
            </p>
            <button
              onClick={handleResetTrust}
              disabled={resetLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md glow-emerald"
            >
              {resetLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span className="uppercase text-xs tracking-wider">{resetLoading ? "Resetting..." : "Reset Trust Scores (1.000)"}</span>
            </button>
          </GlassCard>

          {/* Theme Preference Card */}
          <GlassCard glowColor="cyan">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-4 flex items-center space-x-2">
              <Settings className="h-4 w-4 text-[#0284C7] dark:text-cyber-cyan" />
              <span>Interface Theme Preferences</span>
            </h2>
            <div className="flex items-center justify-between p-3 bg-slate-100/80 dark:bg-slate-950/65 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                {isDark ? (
                  <Moon className="h-5 w-5 text-indigo-400" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Active Mode</div>
                  <div className="text-[9px] text-slate-500 font-mono">{isDark ? "Dark Cyber Command" : "Light Enterprise Slate"}</div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-[#0284C7] dark:hover:border-cyber-cyan text-slate-800 dark:text-white text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Toggle {isDark ? "Light" : "Dark"}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* SMOTE Report Card */}
        <div className="lg:col-span-2">
          <GlassCard glowColor="cyan" className="flex flex-col h-full">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-4 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-[#0284C7] dark:text-cyber-cyan" />
              <span>SMOTE Balance Visualizations</span>
            </h2>

            {banks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[460px] pr-1 scrollbar">
                {banks.map((bank) => (
                  <div 
                    key={bank.id} 
                    className="bg-slate-100/70 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-850 rounded-xl p-3.5 hover:border-slate-300 dark:hover:border-slate-800 transition-colors flex flex-col justify-between shadow-sm dark:shadow-none"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{bank.name}</span>
                        <span className="text-[9px] text-[#0284C7] dark:text-cyber-cyan font-mono">NODE_PART_0{bank.id}</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-600 dark:text-slate-400 mt-2.5 bg-white dark:bg-slate-900/60 p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl">
                        <div>
                          <div className="text-slate-500 uppercase font-bold leading-none mb-1">Original Ratio</div>
                          <div className="font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                            Legit: <span className="text-slate-900 dark:text-white">{(bank.transaction_count - bank.fraud_count).toLocaleString()}</span><br />
                            Fraud: <span className="text-red-600 dark:text-cyber-red font-bold">{bank.fraud_count.toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 uppercase font-bold leading-none mb-1">SMOTE Balanced</div>
                          <div className="font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                            Legit: <span className="text-slate-900 dark:text-white">{(bank.transaction_count - bank.fraud_count).toLocaleString()}</span><br />
                            Fraud: <span className="text-emerald-600 dark:text-cyber-green font-bold">{(bank.transaction_count - bank.fraud_count).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* SMOTE distribution visual image */}
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-850 aspect-[3/2] flex items-center justify-center bg-slate-50 dark:bg-slate-900/80">
                      <img 
                        src={`${API_BASE}/static/bank_${bank.id}_smote.png`}
                        alt={`${bank.name} SMOTE distribution`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          if (parent) {
                            const text = document.createElement('span');
                            text.className = 'text-[9px] text-slate-500 italic p-3 text-center font-mono';
                            text.innerText = 'SMOTE distribution telemetry sync...';
                            parent.appendChild(text);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-500 text-xs font-mono border border-dashed border-slate-300 dark:border-slate-800 rounded-xl py-12">
                Awaiting dataset shards. Initialize dataset to visualize SMOTE dimensions.
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
};
