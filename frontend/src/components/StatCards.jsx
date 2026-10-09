import React from 'react';
import { Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { inr, pct, scoreColor, useCountUp } from '../lib/format';
import { RiskBadge } from './ui';

const AnimatedINR = ({ value }) => <>{inr(useCountUp(value))}</>;

const HealthGauge = ({ score }) => {
  const animated = useCountUp(score);
  const r = 34;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270° gauge
  const color = scoreColor(score);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-[225deg]">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"
          strokeDasharray={`${c * arc} ${c}`} strokeLinecap="round" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${(c * arc * animated) / 100} ${c}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-2xl font-bold text-white">{Math.round(animated)}</span>
        <span className="text-[10px] text-slate-500">/ 100</span>
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, foot, accent, delay }) => (
  <div className="glass glass-hover animate-fade-up p-5" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between">
      <span className="label">{label}</span>
      <span className={`grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-white/10 ${accent}`}>
        <Icon size={15} />
      </span>
    </div>
    <div className="num mt-3 text-[26px] font-bold leading-none text-white">{value}</div>
    <div className="mt-2 text-xs text-slate-500">{foot}</div>
  </div>
);

const StatCards = ({ income, analysis, budget, risk }) => {
  const spend = analysis.monthly_total || 0;
  const savings = budget.actual_allocation?.savings ?? income - spend;
  const rate = budget.savings_rate ?? 0;
  const months = analysis.months_covered || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={Wallet} label="Monthly income" accent="text-emerald-300" delay={0}
        value={<AnimatedINR value={income} />}
        foot={analysis.investments_total > 0 ? `${inr(analysis.investments_total / Math.max(months, 1))}/mo already invested` : 'Take-home pay'} />
      <Stat icon={CreditCard} label="Avg monthly spend" accent="text-rose-300" delay={60}
        value={<AnimatedINR value={spend} />}
        foot={months ? `${months} month${months > 1 ? 's' : ''} analysed · ${inr(analysis.daily_average)}/day` : 'No transactions yet'} />
      <Stat icon={PiggyBank} label="Monthly savings" accent="text-cyan-300" delay={120}
        value={<span className={savings < 0 ? 'text-rose-300' : ''}><AnimatedINR value={savings} /></span>}
        foot={
          <span className="flex items-center gap-2">
            <span className={rate >= 20 ? 'text-emerald-300' : rate >= 0 ? 'text-amber-300' : 'text-rose-300'}>{pct(rate, 1)} of income</span>
            · target 20%
          </span>
        } />
      <div className="glass glass-hover animate-fade-up flex items-center gap-4 p-5" style={{ animationDelay: '180ms' }}>
        <HealthGauge score={budget.budget_health_score || 0} />
        <div className="min-w-0">
          <span className="label">Budget health</span>
          <p className="mt-1 text-sm font-medium text-white">
            {budget.budget_health_score >= 80 ? 'Excellent' : budget.budget_health_score >= 50 ? 'Needs attention' : 'Critical'}
          </p>
          <div className="mt-2"><RiskBadge level={risk} label={`Overall ${risk.toLowerCase()} risk`} /></div>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
