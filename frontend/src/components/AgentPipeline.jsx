import React from 'react';
import { Workflow, Tags, ShieldAlert, Target, LineChart, TrendingUp, Sparkles, ArrowRight, Terminal, Database, MessagesSquare } from 'lucide-react';
import { Card, CardHeader } from './ui';

export const AGENT_META = {
  'Expense Analyzer': { icon: Tags, color: '#fb923c', algo: 'TF-IDF + Logistic Regression (NLP), keyword fallback', member: 'TM1' },
  'Anomaly Detection': { icon: ShieldAlert, color: '#fb7185', algo: 'Modified Z-score · Z-score · Isolation Forest vote', member: 'TM1' },
  'Budget Planner': { icon: Target, color: '#a78bfa', algo: '50/30/20 rule + greedy best-first search over cuts', member: 'TM2' },
  Prediction: { icon: LineChart, color: '#22d3ee', algo: 'Linear Regression (R² confidence) / Moving Average', member: 'TM2' },
  Investment: { icon: TrendingUp, color: '#facc15', algo: 'Rule-based priority ladder + SIP future value', member: 'TM3' },
  Advisor: { icon: Sparkles, color: '#34d399', algo: 'Intent detection + entity extraction + NLG templates', member: 'TM3' },
};

/** Compact horizontal chain, used on the dashboard. */
export const PipelineStrip = ({ trace = [], onOpen }) => (
  <button onClick={onOpen} className="glass glass-hover group w-full p-4 text-left animate-fade-up">
    <div className="mb-3 flex items-center justify-between">
      <span className="label flex items-center gap-2"><Workflow size={13} className="text-violet-300" /> Multi-agent pipeline</span>
      <span className="text-xs text-slate-500 group-hover:text-slate-300">
        {trace.reduce((s, t) => s + t.duration_ms, 0).toFixed(0)} ms total · view trace →
      </span>
    </div>
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
      <span className="chip shrink-0 bg-white/[0.05] px-2.5 py-1 text-slate-300 ring-1 ring-white/10">Coordinator</span>
      {trace.map((t) => {
        const meta = AGENT_META[t.agent] || {};
        const Icon = meta.icon || Workflow;
        return (
          <React.Fragment key={t.agent}>
            <ArrowRight size={12} className="shrink-0 text-slate-600" />
            <span className="chip shrink-0 gap-1.5 px-2.5 py-1 ring-1 ring-white/10" style={{ background: `${meta.color}14`, color: meta.color }}>
              <Icon size={12} /> {t.agent}
              <span className="font-mono text-[10px] text-slate-500">{t.duration_ms.toFixed(1)}ms</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  </button>
);

const AgentPipeline = ({ result }) => {
  const trace = result.trace || [];
  const messages = result.messages || [];
  const maxMs = Math.max(1, ...trace.map((t) => t.duration_ms));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader icon={Workflow} title="How the agents worked together"
          subtitle="Coordinator dispatches six specialist agents over a shared blackboard. Each reads earlier results and hands findings forward." />
        <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,380px)]">
          <ol className="relative space-y-3">
            <span className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-violet-500/40 via-cyan-500/30 to-emerald-500/40" />
            {trace.map((t, i) => {
              const meta = AGENT_META[t.agent] || {};
              const Icon = meta.icon || Workflow;
              return (
                <li key={t.agent} className="relative flex gap-4 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-white/10"
                    style={{ background: `${meta.color}1f`, color: meta.color, boxShadow: `0 0 20px -6px ${meta.color}` }}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-ink-950/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-sm font-semibold text-white">
                        <span className="mr-2 font-mono text-xs text-slate-600">0{i + 1}</span>{t.agent} Agent
                        <span className="ml-2 text-[11px] font-normal text-slate-500">{meta.member}</span>
                      </p>
                      <span className="font-mono text-[11px] text-slate-500">{t.duration_ms.toFixed(2)} ms</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{meta.algo}</p>
                    <p className="mt-2 text-[13px] text-slate-300">{t.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Database size={11} className="text-slate-600" />
                      {t.reads.map((r) => (
                        <span key={r} className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">{r}</span>
                      ))}
                      <ArrowRight size={11} className="text-slate-600" />
                      <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `${meta.color}1a`, color: meta.color }}>{t.writes}</span>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.04]">
                      <div className="h-full rounded-full" style={{ width: `${(t.duration_ms / maxMs) * 100}%`, background: meta.color }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="space-y-5">
            <div className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-4">
              <p className="label mb-3 flex items-center gap-2"><MessagesSquare size={13} className="text-cyan-300" /> Message bus · {messages.length} hand-offs</p>
              <ul className="space-y-2.5">
                {messages.map((m, i) => (
                  <li key={i} className="animate-fade-up text-xs" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium" style={{ color: AGENT_META[m.from]?.color }}>{m.from}</span>
                      <ArrowRight size={11} className="text-slate-600" />
                      <span className="font-medium" style={{ color: AGENT_META[m.to]?.color }}>{m.to}</span>
                    </div>
                    <p className="mt-0.5 text-slate-400">{m.content}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4">
              <p className="label mb-3 flex items-center gap-2"><Terminal size={13} className="text-emerald-300" /> Coordinator log</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-200/80">
                {(result.logs || []).join('\n')}
              </pre>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AgentPipeline;
