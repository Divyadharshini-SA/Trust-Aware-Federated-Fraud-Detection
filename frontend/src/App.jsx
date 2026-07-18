import React, { useState, useEffect } from 'react';
import { api, getWebSocketUrl } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { StatCard } from './components/ui/StatCard';
import { FraudDonutChart } from './components/dashboard/FraudDonutChart';
import { TrustScoreTable } from './components/dashboard/TrustScoreTable';
import { ActivityFeed } from './components/dashboard/ActivityFeed';
import { BankStatus } from './components/BankStatus';
import { TrustDashboard } from './components/TrustDashboard';
import { TrainingMonitor } from './components/TrainingMonitor';
import { FraudPredictor } from './components/FraudPredictor';
import { ModelComparison } from './components/ModelComparison';
import { SettingsPanel } from './components/SettingsPanel';
import { 
  Database, ShieldAlert, Percent, Landmark, Award, Cpu, 
  Activity, RefreshCw, AlertTriangle
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [banks, setBanks] = useState([]);
  const [globalAccuracy, setGlobalAccuracy] = useState(0.0);
  const [isTraining, setIsTraining] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [trainingMethod, setTrainingMethod] = useState('Trust-FL');
  
  // State for loading and error tracking
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Historical round metrics and logs
  const [roundHistory, setRoundHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  // Controller Inputs
  const [roundsInput, setRoundsInput] = useState(10);
  const [methodInput, setMethodInput] = useState('Trust-FL');

  // Load baseline statistics
  const fetchBaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const bankList = await api.listBanks();
      setBanks(bankList || []);

      const history = await api.getGlobalAccuracy();
      setRoundHistory(history || []);
      
      if (history && history.length > 0) {
        const latest = history[history.length - 1];
        setGlobalAccuracy(latest.accuracy);
      }

      const statusData = await api.getTrainingStatus();
      setIsTraining(statusData.status.is_training);
      setCurrentRound(statusData.status.current_round);
      setTotalRounds(statusData.status.total_rounds);
      setTrainingMethod(statusData.status.aggregation_method);
      setLogs(statusData.logs ? [...statusData.logs].reverse() : []);
    } catch (err) {
      console.error("Failed to load initial dataset stats:", err);
      setError("Unable to connect to the backend server. Please verify port 8000 is listening.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  // Set up WebSocket connection for real-time training telemetry
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    let ws;

    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connection_established') {
          setIsTraining(data.status.is_training);
          setCurrentRound(data.status.current_round);
          setTotalRounds(data.status.total_rounds);
          setTrainingMethod(data.status.aggregation_method);
          if (data.banks) {
            setBanks(data.banks);
          }
        } 
        
        else if (data.type === 'training_update') {
          setIsTraining(true);
          setCurrentRound(data.round);
          setTotalRounds(data.total_rounds);
          setTrainingMethod(data.method);
          setGlobalAccuracy(data.accuracy);
          
          if (data.banks) {
            setBanks(data.banks);
          }

          setRoundHistory((prev) => {
            const exists = prev.some(h => h.round === data.round && h.method === data.method);
            if (exists) return prev;
            return [...prev, {
              round: data.round,
              method: data.method,
              accuracy: data.accuracy,
              loss: data.loss,
              precision: data.precision,
              recall: data.recall,
              f1: data.f1,
              auc_roc: data.auc_roc
            }];
          });

          const formattedTime = new Date().toLocaleTimeString();
          setLogs((prev) => [
            ...prev,
            {
              timestamp: formattedTime,
              level: 'INFO',
              message: `Round ${data.round} complete. Accuracy: ${(data.accuracy * 100).toFixed(2)}%, F1: ${(data.f1 * 100).toFixed(2)}%`
            }
          ]);
        } 
        
        else if (data.type === 'training_finished') {
          setIsTraining(false);
          fetchBaseData();
          
          const formattedTime = new Date().toLocaleTimeString();
          setLogs((prev) => [
            ...prev,
            {
              timestamp: formattedTime,
              level: 'INFO',
              message: `Federated training session finished. Global model saved successfully.`
            }
          ]);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket encountered error:", err);
      };

      ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleStartTraining = async (rounds, method) => {
    try {
      await api.trainFederated(rounds, method);
      setIsTraining(true);
      setCurrentRound(0);
      setTotalRounds(rounds);
      setTrainingMethod(method);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to trigger federated training.");
    }
  };

  const handleStopTraining = async () => {
    try {
      await api.stopTraining();
      setIsTraining(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to stop training.");
    }
  };

  const renderWelcomeScreen = () => {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center shadow-2xl space-y-6">
        <div className="h-16 w-16 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Database size={28} className="animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white tracking-wider uppercase">Welcome to Trust-FL Command</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Privacy-preserving credit card fraud detection powered by trust-aware federated learning. 
            To unlock the telemetry matrix, configure and initialize the datasets shard.
          </p>
        </div>
        
        <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 text-left text-xs text-slate-350 space-y-2 leading-relaxed font-mono">
          <span className="font-bold text-[#00D4FF] block uppercase tracking-wider">Initialization Path:</span>
          <div>1. Click the button below to go to the Configuration Shard.</div>
          <div>2. Generate the synthetic IEEE-CIS partitions or load custom CSV.</div>
          <div>3. System nodes will automatically handshake and establish active telemetry.</div>
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          className="bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-xl transition-all inline-flex items-center space-x-2 cursor-pointer shadow-md"
        >
          <span>Initialize Shards & Datasets</span>
        </button>
      </div>
    );
  };

  // Aggregated values
  const totalTransactions = banks.reduce((acc, bank) => acc + (bank.transaction_count || 0), 0);
  const totalFraud = banks.reduce((acc, bank) => acc + (bank.fraud_count || 0), 0);
  const totalNonFraud = totalTransactions - totalFraud;
  const activeBanks = banks.filter(bank => bank.status === 'online').length;
  const fraudPercentage = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;
  const avgTrustScore = banks.length > 0 
    ? banks.reduce((acc, b) => acc + (b.current_trust_score || 0), 0) / banks.length 
    : 0;

  const renderActiveView = () => {
    if (banks.length === 0) {
      if (activeTab === 'settings') {
        return <SettingsPanel banks={banks} onDatasetReload={fetchBaseData} />;
      }
      return renderWelcomeScreen();
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard 
                title="Total Transactions" 
                value={totalTransactions.toLocaleString()} 
                subtitle="Synced feeds" 
                icon={Database} 
                trend="+12.5% round" 
              />
              <StatCard 
                title="Fraud Transactions" 
                value={totalFraud.toLocaleString()} 
                subtitle="Flagged blocks" 
                icon={ShieldAlert} 
                trend="+4.2% up" 
              />
              <StatCard 
                title="Fraud Rate" 
                value={`${fraudPercentage.toFixed(2)}%`} 
                subtitle="Threat ratio" 
                icon={Percent} 
                trend="-0.5% down" 
              />
              <StatCard 
                title="Active Nodes" 
                value={`${activeBanks} / ${banks.length}`} 
                subtitle="Clients online" 
                icon={Landmark} 
              />
              <StatCard 
                title="Global Accuracy" 
                value={`${(globalAccuracy * 100).toFixed(1)}%`} 
                subtitle="Model validation" 
                icon={Activity} 
              />
              <StatCard 
                title="Average Trust" 
                value={avgTrustScore.toFixed(3)} 
                subtitle="Consensus weights" 
                icon={Award} 
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FraudDonutChart totalTransactions={totalTransactions} totalFraud={totalFraud} />
              <ActivityFeed logs={logs} />
            </div>

            {/* Table Section */}
            <div className="w-full">
              <TrustScoreTable banks={banks} />
            </div>
          </div>
        );
      case 'banks':
        return <BankStatus banks={banks} />;
      case 'trust':
        return <TrustDashboard banks={banks} />;
      case 'training':
        return (
          <TrainingMonitor 
            isTraining={isTraining}
            currentRound={currentRound}
            totalRounds={totalRounds}
            method={trainingMethod}
            roundHistory={roundHistory}
            logs={logs}
            onStart={handleStartTraining}
            onStop={handleStopTraining}
            roundsInput={roundsInput}
            setRoundsInput={setRoundsInput}
            methodInput={methodInput}
            setMethodInput={setMethodInput}
          />
        );
      case 'prediction':
        return <FraudPredictor banks={banks} />;
      case 'comparison':
        return <ModelComparison />;
      case 'settings':
        return <SettingsPanel banks={banks} onDatasetReload={fetchBaseData} />;
      default:
        return renderWelcomeScreen();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A1628] text-slate-200 font-sans">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} banks={banks} />

      {/* Main content pane wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <TopBar error={error} />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <RefreshCw className="h-8 w-8 text-[#00D4FF] animate-spin" />
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Compiling sharded telemetry...</span>
            </div>
          ) : error && banks.length === 0 ? (
            <div className="max-w-xl mx-auto my-16 bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 rounded-2xl p-8 text-center shadow-2xl space-y-5">
              <AlertTriangle size={36} className="text-[#FF4D4D] mx-auto animate-bounce" />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Node Offline</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Unable to locate host API on port 8000. Please launch system backend.
              </p>
              <button
                onClick={fetchBaseData}
                className="bg-[#FF4D4D]/20 border border-[#FF4D4D]/35 hover:bg-[#FF4D4D]/35 text-white font-bold py-2.5 px-6 rounded-xl transition-all inline-flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <RefreshCw size={14} />
                <span>Retry handshake</span>
              </button>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
