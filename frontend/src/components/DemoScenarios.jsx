import React from 'react';
import { HeartPulse, ShieldAlert, AlertTriangle, TrendingUp, Play, Check } from 'lucide-react';
import { inr } from '../lib/format';

const STYLE = {
  normal: { icon: HeartPulse, grad: 'from-emerald-500/25 to-cyan-500/5', text: 'text-emerald-300', expect: 'No alerts · health 100 · invest the surplus' },
  fraud: { icon: ShieldAlert, grad: 'from-rose-500/25 to-fuchsia-500/5', text: 'text-rose-300', expect: '₹75k charge flagged by all 3 detectors' },
  warning: { icon: AlertTriangle, grad: 'from-amber-500/25 to-orange-500/5', text: 'text-amber-300', expect: 'High risk · search finds the gentlest cuts' },
  prediction: { icon: TrendingUp, grad: 'from-violet-500/25 to-sky-500/5', text: 'text-violet-300', expect: 'Regression forecast nears income → High risk' },
};

const DemoScenarios = ({ scenarios, activeId, onLoad }) => (
  <div>
    <div className="mx-auto mb-8 max-w-2xl text-center animate-fade-up">
      <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">See the agents <span className="gradient-text">react</span></h2>
      <p className="mt-3 text-sm text-slate-400">
        Each scenario sends a realistic statement through the live multi-agent pipeline. Nothing is pre-scripted: every number comes from the agents.
      </p>
    </div>
    <div className="grid gap-5 md:grid-cols-2">
      {scenarios.map((s, i) => {
        const st = STYLE[s.id] || STYLE.normal;
        const Icon = st.icon;
        const months = new Set(s.transactions.map((t) => t.date.slice(0, 7))).size;
        const total = s.transactions.reduce((a, t) => a + t.amount, 0);
        const active = s.id === activeId;
        return (
          <button key={s.id} onClick={() => onLoad(s.id)}
            className={`glass glass-hover group relative overflow-hidden p-6 text-left animate-fade-up ${active ? 'ring-1 ring-violet-500/50' : ''}`}
            style={{ animationDelay: `${i * 70}ms` }}>
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100 ${st.grad}`} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-black/30 ring-1 ring-white/10 ${st.text}`}><Icon size={20} /></div>
                {active
                  ? <span className="chip bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30"><Check size={11} /> Loaded</span>
                  : <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white opacity-0 transition-all group-hover:opacity-100"><Play size={14} className="ml-0.5" /></span>}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">{s.title}</h3>
              <p className="text-xs text-slate-400">{s.persona}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{s.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
                <span className="chip bg-black/30 text-slate-300 ring-1 ring-white/10">Income {inr(s.income)}</span>
                <span className="chip bg-black/30 text-slate-300 ring-1 ring-white/10">{s.transactions.length} txns · {months} mo</span>
                <span className="chip bg-black/30 text-slate-300 ring-1 ring-white/10">{inr(total, { compact: true })} total</span>
              </div>
              <p className={`mt-4 text-xs font-medium ${st.text}`}>Expect: {st.expect}</p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default DemoScenarios;
