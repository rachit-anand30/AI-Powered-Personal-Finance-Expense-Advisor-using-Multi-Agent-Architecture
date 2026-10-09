import React from 'react';
import { Lightbulb, AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { inr } from '../lib/format';
import { Card, CardHeader, AgentTag } from './ui';

const PRIORITY = {
  high: { icon: AlertOctagon, text: 'text-rose-300', ring: 'ring-rose-500/25', bg: 'bg-rose-500/[0.06]', bar: 'bg-rose-400' },
  medium: { icon: AlertTriangle, text: 'text-amber-300', ring: 'ring-amber-500/25', bg: 'bg-amber-500/[0.05]', bar: 'bg-amber-400' },
  low: { icon: CheckCircle2, text: 'text-emerald-300', ring: 'ring-emerald-500/25', bg: 'bg-emerald-500/[0.05]', bar: 'bg-emerald-400' },
};

export const RecommendationList = ({ items, columns = 2 }) => (
  <div className={`grid gap-3 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
    {items.map((r, i) => {
      const p = PRIORITY[r.priority] || PRIORITY.low;
      const Icon = p.icon;
      return (
        <div key={i} className={`relative overflow-hidden rounded-xl p-4 ring-1 ${p.bg} ${p.ring} animate-fade-up`} style={{ animationDelay: `${i * 60}ms` }}>
          <span className={`absolute inset-y-0 left-0 w-1 ${p.bar}`} />
          <div className="flex items-start gap-3">
            <Icon size={18} className={`mt-0.5 shrink-0 ${p.text}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-white">{r.title}</h4>
                {r.impact_amount > 0 && <span className={`num text-sm font-semibold ${p.text}`}>{inr(r.impact_amount)}</span>}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{r.description}</p>
              {r.agent && <div className="mt-2"><AgentTag name={`via ${r.agent} agent`} /></div>}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const AIRecommendations = ({ advice, limit = 4, delay = 0, onMore }) => (
  <Card delay={delay}>
    <CardHeader icon={Lightbulb} title="What to do next" subtitle="Ranked by the Advisor agent from every agent's findings" accent="text-amber-300"
      right={onMore && <button onClick={onMore} className="btn-ghost px-3 py-1.5 text-xs">Ask the advisor →</button>} />
    <RecommendationList items={(advice.top_recommendations || []).slice(0, limit)} />
  </Card>
);

export default AIRecommendations;
