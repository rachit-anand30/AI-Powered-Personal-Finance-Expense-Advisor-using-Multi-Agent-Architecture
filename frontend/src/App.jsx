import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionUpload from './components/TransactionUpload';
import BudgetPlan from './components/BudgetPlan';
import Forecast from './components/Forecast';
import InvestmentPlan from './components/InvestmentPlan';
import AdvisorPage from './components/AdvisorPage';
import AgentPipeline from './components/AgentPipeline';
import DemoScenarios from './components/DemoScenarios';
import { checkHealth, describeError, fullAnalysis, isOffline } from './api/financeApi';
import SCENARIOS from './data/scenarios.json';
import SNAPSHOTS from './data/snapshots.json';

const DEFAULT_SCENARIO = 'fraud';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO);
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState(0);
  const [savingGoal, setSavingGoal] = useState(null);
  const [result, setResult] = useState(null);
  const [source, setSource] = useState(null); // 'live' | 'snapshot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backend, setBackend] = useState({ status: 'checking', info: null });

  const pingBackend = useCallback(async () => {
    try {
      const info = await checkHealth();
      setBackend({ status: 'online', info });
      return true;
    } catch {
      setBackend({ status: 'offline', info: null });
      return false;
    }
  }, []);

  const runAnalysis = useCallback(async ({ txns, inc, goal, id = null, query }) => {
    setLoading(true);
    setError(null);
    setTransactions(txns);
    setIncome(inc);
    setSavingGoal(goal ?? null);
    setScenarioId(id);
    try {
      const data = await fullAnalysis(txns, inc, goal, query);
      setResult(data);
      setSource('live');
      setBackend((b) => (b.status === 'online' ? b : { status: 'online', info: b.info }));
      return true;
    } catch (err) {
      if (isOffline(err)) {
        setBackend({ status: 'offline', info: null });
        if (id && SNAPSHOTS[id]) {
          setResult(SNAPSHOTS[id]);
          setSource('snapshot');
          return true;
        }
      }
      setError(describeError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadScenario = useCallback((id, goToDashboard = true) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    runAnalysis({ txns: s.transactions, inc: s.income, goal: s.saving_goal, id: s.id, query: s.query });
    if (goToDashboard) setActiveTab('Dashboard');
  }, [runAnalysis]);

  useEffect(() => {
    pingBackend().finally(() => loadScenario(DEFAULT_SCENARIO, false));
  }, [pingBackend, loadScenario]);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const ctx = { transactions, income, savingGoal };

  const renderContent = () => {
    if (!result) {
      return (
        <div className="grid gap-5 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
          <div className="skeleton h-80 lg:col-span-3" />
          <div className="skeleton h-80" />
        </div>
      );
    }
    switch (activeTab) {
      case 'Transactions':
        return (
          <TransactionUpload
            key={scenarioId || 'custom'}
            initialTransactions={transactions}
            categorized={result.categorized_transactions}
            initialIncome={income}
            initialGoal={savingGoal}
            onAnalyze={async (txns, inc, goal) => {
              if (await runAnalysis({ txns, inc, goal })) setActiveTab('Dashboard');
            }}
            loading={loading}
          />
        );
      case 'Budget':
        return <BudgetPlan plan={result.budget_plan} analysis={result.expense_analysis} income={income} />;
      case 'Forecast':
        return <Forecast prediction={result.predictions} income={income} />;
      case 'Invest':
        return <InvestmentPlan plan={result.investment_plan} />;
      case 'Advisor':
        return <AdvisorPage advice={result.advice} ctx={ctx} backendOnline={backend.status === 'online'} />;
      case 'Agents':
        return <AgentPipeline result={result} />;
      case 'Scenarios':
        return <DemoScenarios scenarios={SCENARIOS} activeId={scenarioId} onLoad={(id) => loadScenario(id)} />;
      default:
        return <Dashboard result={result} income={income} ctx={ctx} backendOnline={backend.status === 'online'} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backend={backend}
        source={source}
        scenario={scenario}
        onRetry={async () => {
          if (await pingBackend()) {
            if (scenarioId) loadScenario(scenarioId, false);
            else runAnalysis({ txns: transactions, inc: income, goal: savingGoal });
          }
        }}
      />

      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        {source === 'snapshot' && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200 animate-fade-up">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="flex-1">
              Backend offline: showing a saved snapshot of this scenario's real agent output. Start the API to analyse your own data.
            </span>
            <code className="rounded-lg bg-black/30 px-2 py-1 font-mono text-xs text-amber-100">uvicorn backend.main:app --reload</code>
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200 animate-fade-up">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-300 hover:text-white" aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}
        <div className="relative">
          {loading && result && (
            <div className="pointer-events-none absolute -top-3 right-0 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/90 px-3 py-1.5 text-xs text-slate-300 shadow-lg">
              <RefreshCw size={12} className="animate-spin text-violet-300" /> Agents working…
            </div>
          )}
          <div key={activeTab + (source || '') + (scenarioId || 'custom')}>{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}

export default App;
