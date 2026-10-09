import React from 'react';
import { LayoutDashboard, Receipt, Target, LineChart, TrendingUp, Sparkles, Workflow, PlayCircle, RefreshCw } from 'lucide-react';

const TABS = [
  { id: 'Dashboard', icon: LayoutDashboard },
  { id: 'Transactions', icon: Receipt },
  { id: 'Budget', icon: Target },
  { id: 'Forecast', icon: LineChart },
  { id: 'Invest', icon: TrendingUp },
  { id: 'Advisor', icon: Sparkles },
  { id: 'Agents', icon: Workflow },
  { id: 'Scenarios', icon: PlayCircle },
];

const StatusPill = ({ backend, source, onRetry }) => {
  if (backend.status === 'checking') {
    return <span className="chip bg-white/5 text-slate-400 ring-1 ring-white/10">Connecting…</span>;
  }
  if (backend.status === 'online') {
    const ml = backend.info?.ml_classifier;
    return (
      <span
        className="chip bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25"
        title={ml?.ready ? `ML classifier: ${ml.holdout_accuracy}% accuracy on unseen merchants` : undefined}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live · {backend.info?.agents?.length || 7} agents
      </span>
    );
  }
  return (
    <button onClick={onRetry} className="chip bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/25 hover:bg-amber-500/20">
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      {source === 'snapshot' ? 'Offline · snapshot' : 'Offline'}
      <RefreshCw size={11} />
    </button>
  );
};

const Header = ({ activeTab, setActiveTab, backend, source, scenario, onRetry }) => (
  <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-900/50">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16l5-5 4 4 7-8" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-bold tracking-tight text-white sm:text-xl">
            AI Finance <span className="gradient-text">Advisor</span>
          </h1>
          <p className="truncate text-[11px] text-slate-500">
            {scenario ? <>Scenario: <span className="text-slate-300">{scenario.title}</span> · {scenario.persona}</> : 'Your data · custom analysis'}
          </p>
        </div>
      </div>
      <StatusPill backend={backend} source={source} onRetry={onRetry} />
    </div>

    <nav className="no-scrollbar mx-auto mt-3 flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
      {TABS.map(({ id, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1.5 text-sm font-medium transition-colors ${
              active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={15} className={active ? 'text-violet-300' : ''} />
            {id}
            {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" />}
          </button>
        );
      })}
    </nav>
  </header>
);

export default Header;
