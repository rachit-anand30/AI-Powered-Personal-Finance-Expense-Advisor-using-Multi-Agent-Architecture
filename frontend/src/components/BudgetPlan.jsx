import React from 'react';
import { Target, Route, AlertTriangle, Lightbulb, Scissors } from 'lucide-react';
import BudgetAllocation from './BudgetAllocation';
import { Card, CardHeader, Empty, RiskBadge } from './ui';
import { colorFor, inr, pct } from '../lib/format';

const BudgetPlan = ({ plan, analysis }) => {
  const months = Math.max(1, analysis.months_covered || 1);
  const rows = Object.entries(analysis.category_wise_spending || {})
    .map(([cat, total]) => {
      let current = total / months;
      if (plan.excluded_flagged_amount && plan.recommended_budget[cat] != null) {
        // show the same baseline the planner used
        current = Math.min(current, plan.recommended_budget[cat] + (plan.optimization?.cuts?.[cat] || 0));
      }
      return { cat, current, limit: plan.recommended_budget[cat] ?? current, cut: plan.optimization?.cuts?.[cat] || 0 };
    })
    .sort((a, b) => b.current - a.current);
  const opt = plan.optimization || {};

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <BudgetAllocation plan={plan} />
        <Card delay={60}>
          <CardHeader icon={Target} title="Category limits" subtitle="Current monthly spend → recommended limit" accent="text-violet-300"
            right={<RiskBadge level={plan.risk_level} />} />
          {rows.length === 0 ? (
            <Empty icon={Target} title="No spending to plan yet" />
          ) : (
            <div className="space-y-3.5">
              {rows.map((r) => {
                const max = Math.max(...rows.map((x) => x.current)) || 1;
                return (
                  <div key={r.cat}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-300">
                        <span className="h-2 w-2 rounded-full" style={{ background: colorFor(r.cat) }} />{r.cat}
                        {r.cut > 0 && <span className="chip bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20"><Scissors size={10} /> {inr(r.cut)}</span>}
                      </span>
                      <span className="num text-slate-400">
                        {r.cut > 0 ? <><span className="text-slate-500 line-through">{inr(r.current)}</span> <span className="font-semibold text-white">{inr(r.limit)}</span></>
                          : <span className="font-semibold text-white">{inr(r.current)}</span>}
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="absolute inset-y-0 left-0 rounded-full opacity-30" style={{ width: `${(r.current / max) * 100}%`, background: colorFor(r.cat) }} />
                      <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700" style={{ width: `${(r.limit / max) * 100}%`, background: colorFor(r.cat) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card delay={80} className="lg:col-span-1">
          <CardHeader icon={Route} title="Cut-optimisation search" subtitle={opt.strategy} accent="text-cyan-300" />
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Savings gap', inr(Math.max(0, (plan.budget_allocation?.savings_budget || 0) - (plan.actual_allocation?.savings || 0)))],
              ['Cuts found', inr(opt.total_saved)],
              ['Nodes expanded', opt.nodes_expanded],
              ['Goal reached', opt.goal_reached ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                <dt className="text-[11px] text-slate-500">{k}</dt>
                <dd className="num mt-1 text-lg font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Each step cuts 5% from one category. The priority queue always expands the cut with the lowest
            <span className="text-slate-300"> pain per rupee</span>: essentials like rent are weighted high, and
            cutting the same category again costs more, so cuts spread out instead of wiping one category to zero.
          </p>
        </Card>

        <Card delay={120}>
          <CardHeader icon={AlertTriangle} title="Warnings" subtitle={`Savings rate ${pct(plan.savings_rate, 1)}`} accent="text-amber-300" />
          {plan.warnings?.length ? (
            <ul className="space-y-2.5">
              {plan.warnings.map((w, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{w}
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No warnings">You are inside every 50/30/20 limit.</Empty>
          )}
        </Card>

        <Card delay={160}>
          <CardHeader icon={Lightbulb} title="Targeted tips" subtitle="Chosen for your worst categories" accent="text-emerald-300" />
          <ul className="space-y-2.5">
            {plan.tips?.map((t, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default BudgetPlan;
