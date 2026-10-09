import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, X } from 'lucide-react';
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
import { inr, monthLabel } from './lib/format';

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
  const [toast, setToast] = useState(null);
  const [includeOneOffs, setIncludeOneOffs] = useState(false); // let flagged one-offs shape the forecast
  const oneOffsRef = useRef(false);
  oneOffsRef.current = includeOneOffs;

  const requestId = useRef(0);        // ignore responses that arrive after a newer request
  const debounceTimer = useRef(null);
  const pendingNote = useRef(null);   // what the user just changed, explained once the agents answer
  const resultRef = useRef(null);
  const dataRef = useRef({ transactions, income, savingGoal });
  dataRef.current = { transactions, income, savingGoal };
  resultRef.current = result;

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  /** Turn "the user added/removed X" into a message that shows the effect on the analysis. */
  const explainChange = (note, data) => {
    // Show the change in the month the transaction belongs to: that is what visibly moves on the dashboard
    const monthTotal = (analysis, m) => analysis?.monthly_breakdown?.find((x) => x.month === m)?.total || 0;
    const m = note.txn?.date?.slice(0, 7);
    const spend = m
      ? ` ${monthLabel(m)} spending ${inr(monthTotal(note.beforeAnalysis, m))} → ${inr(monthTotal(data.expense_analysis, m))}.`
      : ` Avg monthly spend ${inr(note.beforeAnalysis?.monthly_total)} → ${inr(data.expense_analysis.monthly_total)}.`;
    if (note.type === 'add') {
      const t = note.txn;
      const match = data.categorized_transactions.find(
        (c) => c.date === t.date && c.description === t.description && Number(c.amount) === Number(t.amount));
      const how = match?.category_source === 'ml' ? ` (ML ${Math.round(match.category_confidence)}%)` : '';
      const flagged = data.anomalies.flagged_transactions.some(
        (a) => a.date === t.date && a.description === t.description && Number(a.amount) === Number(t.amount));
      return {
        tone: flagged ? 'alert' : 'ok',
        text: `Added ${inr(t.amount)} "${t.description}" → ${match?.category || t.category || 'categorised'}${how}.${spend}`
          + (flagged ? ' The Anomaly agent flagged it as unusual.' : ''),
      };
    }
    if (note.type === 'remove') return { tone: 'ok', text: `Removed "${note.txn.description}".${spend}` };
    return { tone: 'ok', text: `All agents re-ran on your updated data.${spend}` };
  };

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
    const myRequest = ++requestId.current;
    clearTimeout(debounceTimer.current);
    setLoading(true);
    setError(null);
    setTransactions(txns);
    setIncome(inc);
    setSavingGoal(goal ?? null);
    setScenarioId(id);
    try {
      const data = await fullAnalysis(txns, inc, goal, query, oneOffsRef.current);
      if (myRequest !== requestId.current) return true;
      if (pendingNote.current) {
        setToast(explainChange(pendingNote.current, data));
        pendingNote.current = null;
      }
      setResult(data);
      setSource('live');
      setBackend((b) => (b.status === 'online' ? b : { status: 'online', info: b.info }));
      return true;
    } catch (err) {
      if (myRequest !== requestId.current) return false;
      pendingNote.current = null;
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
      if (myRequest === requestId.current) setLoading(false);
    }
  }, []);

  /** Any edit on the Transactions tab: update the shared data, then re-run the agents shortly after. */
  const editData = useCallback((changes, note) => {
    const cur = dataRef.current;
    const next = {
      txns: changes.transactions ?? cur.transactions,
      inc: changes.income ?? cur.income,
      goal: 'savingGoal' in changes ? changes.savingGoal : cur.savingGoal,
    };
    setTransactions(next.txns);
    setIncome(next.inc);
    setSavingGoal(next.goal);
    setScenarioId(null);
    if (note) pendingNote.current = { ...note, beforeAnalysis: resultRef.current?.expense_analysis };
    clearTimeout(debounceTimer.current);
    if (!next.txns.length || !(Number(next.inc) > 0)) return;
    debounceTimer.current = setTimeout(() => runAnalysis({ txns: next.txns, inc: next.inc, goal: next.goal }), 500);
  }, [runAnalysis]);

  const loadScenario = useCallback((id, goToDashboard = true) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    runAnalysis({ txns: s.transactions, inc: s.income, goal: s.saving_goal, id: s.id, query: s.query });
    if (goToDashboard) setActiveTab('Dashboard');
  }, [runAnalysis]);

  useEffect(() => {
    pingBackend().finally(() => loadScenario(DEFAULT_SCENARIO, false));
  }, [pingBackend, loadScenario]);

  const toggleOneOffs = (value) => {
    oneOffsRef.current = value;
    setIncludeOneOffs(value);
    const s = SCENARIOS.find((x) => x.id === scenarioId);
    runAnalysis({ txns: transactions, inc: income, goal: savingGoal, id: scenarioId, query: s?.query });
  };
  const forecastControls = { includeOneOffs, onToggleOneOffs: toggleOneOffs, disabled: backend.status !== 'online' };

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
            transactions={transactions}
            income={income}
            savingGoal={savingGoal}
            categorized={result.categorized_transactions}
            flagged={result.anomalies?.flagged_transactions}
            onChange={editData}
            onRerun={() => runAnalysis({ txns: transactions, inc: income, goal: savingGoal })}
            onViewDashboard={() => setActiveTab('Dashboard')}
            loading={loading}
            backendOnline={backend.status === 'online'}
          />
        );
      case 'Budget':
        return <BudgetPlan plan={result.budget_plan} analysis={result.expense_analysis} income={income} />;
      case 'Forecast':
        return <Forecast prediction={result.predictions} income={income} controls={forecastControls} />;
      case 'Invest':
        return <InvestmentPlan plan={result.investment_plan} />;
      case 'Advisor':
        return <AdvisorPage advice={result.advice} ctx={ctx} backendOnline={backend.status === 'online'} />;
      case 'Agents':
        return <AgentPipeline result={result} />;
      case 'Scenarios':
        return <DemoScenarios scenarios={SCENARIOS} activeId={scenarioId} onLoad={(id) => loadScenario(id)} />;
      default:
        return <Dashboard result={result} income={income} ctx={ctx} backendOnline={backend.status === 'online'} onNavigate={setActiveTab} forecastControls={forecastControls} />;
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
          <div key={activeTab}>{renderContent()}</div>
        </div>
      </main>

      {toast && (
        <div className="fixed inset-x-4 z-50 mx-auto flex max-w-lg animate-fade-up items-start gap-3 rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 text-sm text-slate-200 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-6 sm:mx-0"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }} role="status">
          {toast.tone === 'alert'
            ? <ShieldAlert size={18} className="mt-0.5 shrink-0 text-rose-300" />
            : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />}
          <span className="flex-1">{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white" aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default App;
