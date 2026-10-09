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

/** KPI row for one period (a single month or the multi-month average). */
const StatCards = ({ income, view, investedMonthly, risk }) => {
  const { spend, savings, rate, health } = view;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={Wallet} label="Monthly income" accent="text-emerald-300" delay={0}
        value={<AnimatedINR value={income} />}
        foot={investedMonthly > 0 ? `${inr(investedMonthly)}/mo already invested` : 'Take-home pay'} />
      <Stat icon={CreditCard} label={view.isAvg ? 'Avg monthly spend (full months)' : `Spent in ${view.label}`} accent="text-rose-300" delay={60}
        value={<span className={spend > income && income > 0 ? 'text-rose-300' : ''}><AnimatedINR value={spend} /></span>}
        foot={view.isAvg
          ? `Average of ${view.monthCount} month${view.monthCount === 1 ? '' : 's'}`
          : <>{view.count} transaction{view.count === 1 ? '' : 's'}{view.avgSpend != null && view.monthCount > 1 && (
              <> · <span className={spend > view.avgSpend ? 'text-rose-300' : 'text-emerald-300'}>
                {spend > view.avgSpend ? '▲' : '▼'} {inr(Math.abs(spend - view.avgSpend))}</span> vs avg</>)}</>} />
      <Stat icon={PiggyBank} label={view.isAvg ? 'Avg monthly savings' : `Saved in ${view.label}`} accent="text-cyan-300" delay={120}
        value={<span className={savings < 0 ? 'text-rose-300' : ''}><AnimatedINR value={savings} /></span>}
        foot={
          <span className="flex items-center gap-2">
            <span className={rate >= 20 ? 'text-emerald-300' : rate >= 0 ? 'text-amber-300' : 'text-rose-300'}>{pct(rate, 1)} of income</span>
            · target 20%
          </span>
        } />
      <div className="glass glass-hover animate-fade-up flex items-center gap-4 p-5" style={{ animationDelay: '180ms' }}>
        <HealthGauge score={health || 0} />
        <div className="min-w-0">
          <span className="label">Budget health · {view.isAvg ? 'avg' : view.label}</span>
          <p className="mt-1 text-sm font-medium text-white">
            {health >= 80 ? 'Excellent' : health >= 50 ? 'Needs attention' : 'Critical'}
          </p>
          <div className="mt-2"><RiskBadge level={risk} label={`${risk} risk`} /></div>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
