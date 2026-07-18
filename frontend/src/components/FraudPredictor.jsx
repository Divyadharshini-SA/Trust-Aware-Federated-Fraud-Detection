import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, ShieldAlert, FileText, Send, Sparkles, AlertCircle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { ProgressBar } from './ui/ProgressBar';

export const FraudPredictor = ({ banks }) => {
  const [modelType, setModelType] = useState('trust-fl');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Form states with default clean template values
  const [formData, setFormData] = useState({
    TransactionDT: 86400 * 5,
    TransactionAmt: 150.0,
    ProductCD: 'W',
    card1: 15000,
    card4: 'visa',
    card6: 'debit',
    P_emaildomain: 'gmail.com',
    C1: 1,
    C2: 1,
    C13: 5,
    D1: 10,
    D2: 5,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['TransactionDT', 'TransactionAmt', 'card1', 'C1', 'C2', 'C13', 'D1', 'D2'].includes(name)
        ? Number(value)
        : value
    }));
  };

  const autofillTemplate = (type) => {
    if (type === 'legit') {
      setFormData({
        TransactionDT: 90000,
        TransactionAmt: 45.50,
        ProductCD: 'W',
        card1: 3500,
        card4: 'visa',
        card6: 'debit',
        P_emaildomain: 'gmail.com',
        C1: 1,
        C2: 1,
        C13: 2,
        D1: 5,
        D2: 3,
      });
    } else {
      setFormData({
        TransactionDT: 120500,
        TransactionAmt: 850.0,
        ProductCD: 'C',
        card1: 11500,
        card4: 'mastercard',
        card6: 'credit',
        P_emaildomain: 'anonymous.com',
        C1: 12,
        C2: 15,
        C13: 65,
        D1: 220,
        D2: 180,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.predictFraud(formData, modelType);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Inference failed. Ensure centralized baseline models or federated models have been trained.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">Inference Threat Engine</h1>
        <p className="text-xs text-slate-500">Inject transactions into the neural engine framework to test threat scores in real time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          <GlassCard glowColor="cyan" className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-455">
                Features Shard compiler
              </h2>
              <div className="flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => autofillTemplate('legit')}
                  className="bg-cyber-green/10 hover:bg-cyber-green/20 text-cyber-green text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-cyber-green/20 cursor-pointer transition-colors"
                >
                  Legitimate Shard
                </button>
                <button
                  type="button"
                  onClick={() => autofillTemplate('fraud')}
                  className="bg-cyber-red/10 hover:bg-cyber-red/20 text-cyber-red text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-cyber-red/20 cursor-pointer transition-colors"
                >
                  Fraudulent Threat
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Transaction Amt ($)</label>
                <input
                  type="number"
                  step="any"
                  name="TransactionAmt"
                  value={formData.TransactionAmt}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:border-cyber-cyan outline-none transition-colors font-mono-numbers"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Product Code</label>
                <select
                  name="ProductCD"
                  value={formData.ProductCD}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-cyber-cyan outline-none transition-colors cursor-pointer"
                >
                  <option value="W">W (Web)</option>
                  <option value="H">H (Home)</option>
                  <option value="C">C (Cash/Crypto)</option>
                  <option value="S">S (Store)</option>
                  <option value="R">R (Retail)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">card1 (Issuer Shard)</label>
                <input
                  type="number"
                  name="card1"
                  value={formData.card1}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:border-cyber-cyan outline-none transition-colors font-mono-numbers"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Card Network</label>
                <select
                  name="card4"
                  value={formData.card4}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-cyber-cyan outline-none transition-colors cursor-pointer"
                >
                  <option value="visa">Visa Network</option>
                  <option value="mastercard">MasterCard Network</option>
                  <option value="american express">Amex Network</option>
                  <option value="discover">Discover Network</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Card Type</label>
                <select
                  name="card6"
                  value={formData.card6}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-cyber-cyan outline-none transition-colors cursor-pointer"
                >
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Domain</label>
                <select
                  name="P_emaildomain"
                  value={formData.P_emaildomain}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-cyber-cyan outline-none transition-colors cursor-pointer"
                >
                  <option value="gmail.com">gmail.com</option>
                  <option value="yahoo.com">yahoo.com</option>
                  <option value="outlook.com">outlook.com</option>
                  <option value="anonymous.com">anonymous.com</option>
                  <option value="aol.com">aol.com</option>
                  <option value="Unknown">Unknown/Empty</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">C1 Velocity Count</label>
                <input
                  type="number"
                  name="C1"
                  value={formData.C1}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:border-cyber-cyan outline-none transition-colors font-mono-numbers"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">C13 Frequency Count</label>
                <input
                  type="number"
                  name="C13"
                  value={formData.C13}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:border-cyber-cyan outline-none transition-colors font-mono-numbers"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">D1 Delta Time</label>
                <input
                  type="number"
                  name="D1"
                  value={formData.D1}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:border-cyber-cyan outline-none transition-colors font-mono-numbers"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-850 gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Classifier:</span>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-cyber-cyan font-bold rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-slate-600 transition-colors cursor-pointer"
                >
                  <option value="trust-fl">Trust-FL model</option>
                  <option value="fedavg">FedAvg model</option>
                  <option value="mlp_centralized">Centralized MLP</option>
                  <option value="xgboost">Centralized XGBoost</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyber-cyan to-indigo-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all glow-teal cursor-pointer shadow-md"
              >
                <Send className="h-4 w-4" />
                <span className="uppercase text-xs tracking-wider">{loading ? "Compiling..." : "Run Inference"}</span>
              </button>
            </div>
          </GlassCard>
        </form>

        {/* Prediction Results Column */}
        <div className="lg:col-span-1">
          <GlassCard glowColor="purple" className="flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-455 mb-4">Inference Output</h2>
            </div>
            
            <div className="flex-grow flex flex-col justify-center py-6">
              {error && (
                <div className="bg-cyber-red/10 border border-cyber-red/20 rounded-2xl p-4 text-cyber-red text-xs text-center flex items-center space-x-2 glow-rose">
                  <AlertCircle size={18} className="text-cyber-red shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!result && !error && (
                <div className="text-slate-500 text-xs text-center flex flex-col items-center justify-center space-y-3.5">
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-slate-500">
                    <FileText size={24} />
                  </div>
                  <p className="leading-relaxed">Compile features on the left to review threat classifications.</p>
                </div>
              )}

              {result && (
                <div className="space-y-6 text-center animate-fade-in">
                  <div className="flex justify-center">
                    {result.is_fraud === 1 ? (
                      <div className="p-4 rounded-full bg-cyber-red/10 border border-cyber-red/20 text-cyber-red animate-pulse glow-rose">
                        <ShieldAlert size={36} />
                      </div>
                    ) : (
                      <div className="p-4 rounded-full bg-cyber-green/10 border border-cyber-green/20 text-cyber-green glow-emerald">
                        <ShieldCheck size={36} />
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Threat Evaluation</span>
                    <div className={`text-2xl font-black mt-1 uppercase ${result.is_fraud === 1 ? 'text-cyber-red' : 'text-cyber-green'}`}>
                      {result.prediction}
                    </div>
                  </div>

                  <div className="bg-slate-950/65 p-4 rounded-2xl border border-slate-850 space-y-3 font-mono text-[10px] text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500">EVAL CLASSIFIER:</span>
                      <span className="text-white font-bold uppercase">{result.model_type}</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-slate-500">
                        <span>FRAUD INDEX:</span>
                        <span className="text-white font-bold font-mono-numbers">{result.probability.toFixed(1)}%</span>
                      </div>
                      <ProgressBar progress={result.probability} color={result.is_fraud === 1 ? 'rose' : 'emerald'} size="sm" />
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-slate-500">
                        <span>CONFIDENCE RATE:</span>
                        <span className="text-white font-bold font-mono-numbers">{result.confidence.toFixed(1)}%</span>
                      </div>
                      <ProgressBar progress={result.confidence} color="cyan" size="sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center text-[9px] text-slate-500 font-mono flex items-center justify-center space-x-1 border-t border-slate-850 pt-3 mt-4">
              <Sparkles size={12} className="text-cyber-purple" />
              <span>Real-time Secure Local Processing</span>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};
