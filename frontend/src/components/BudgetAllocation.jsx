import React from 'react';
import { Scale } from 'lucide-react';
import { inr } from '../lib/format';
import { Card, CardHeader, ProgressBar } from './ui';

const BUCKETS = [
  { key: 'needs', label: 'Needs', hint: 'Rent, bills, health, half of food & transport', color: '#8b5cf6', target: 'needs_budget', actual: 'needs_spent' },
  { key: 'wants', label: 'Wants', hint: 'Shopping, entertainment, the rest of food & travel', color: '#ec4899', target: 'wants_budget', actual: 'wants_spent' },
  { key: 'savings', label: 'Savings', hint: 'Whatever is left after spending', color: '#22d3ee', target: 'savings_budget', actual: 'savings' },
];

const BudgetAllocation = ({ plan, delay = 0 }) => {
  const alloc = plan.budget_allocation || {};
  const actual = plan.actual_allocation || {};

  return (
    <Card delay={delay} className="h-full">
      <CardHeader icon={Scale} title="50 / 30 / 20 check" subtitle="This month vs the ideal split" accent="text-fuchsia-300" />
      <div className="space-y-5">
        {BUCKETS.map((b) => {
          const target = alloc[b.target] || 0;
          const value = actual[b.actual] || 0;
          const isSavings = b.key === 'savings';
          const good = isSavings ? value >= target : value <= target;
          const diff = isSavings ? value - target : target - value;
          return (
            <div key={b.key}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{b.label}</p>
                  <p className="text-[11px] text-slate-500">{b.hint}</p>
                </div>
                <div className="text-right">
                  <p className="num text-sm font-semibold text-white">
                    {inr(value)} <span className="font-normal text-slate-500">/ {inr(target)}</span>
                  </p>
                  <p className={`text-[11px] ${good ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {good ? (isSavings ? `${inr(diff)} ahead` : `${inr(diff)} headroom`) : (isSavings ? `${inr(-diff)} short` : `${inr(-diff)} over`)}
                  </p>
                </div>
              </div>
              <ProgressBar value={Math.max(0, value)} max={Math.max(target, value) * 1.05} color={good ? b.color : '#fb7185'} marker={target} />
            </div>
          );
        })}
      </div>
      {plan.excluded_flagged_amount > 0 && (
        <p className="mt-5 rounded-xl bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400">
          {inr(plan.excluded_flagged_amount)} of flagged charges is set aside until verified.
        </p>
      )}
    </Card>
  );
};

export default BudgetAllocation;
