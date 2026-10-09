import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, ShieldCheck, Layers, Info } from 'lucide-react';
import { Card, CardHeader, ChartTooltip } from './ui';
import { inr } from '../lib/format';

const BUCKET_COLORS = ['#22d3ee', '#a78bfa', '#60a5fa', '#facc15'];
const PROFILE_STYLE = {
  Conservative: 'from-sky-500/20 to-cyan-500/10 text-sky-200',
  Balanced: 'from-violet-500/20 to-fuchsia-500/10 text-violet-200',
  Aggressive: 'from-amber-500/20 to-rose-500/10 text-amber-200',
};

const InvestmentPlan = ({ plan }) => {
  const buckets = (plan.monthly_plan || []).filter((b) => b.amount > 0);
  const projection = (plan.projection || []).map((p) => ({ name: `${p.years}y`, Invested: p.invested, Value: p.value }));

  return (
    <div className="space-y-5">
      <div className={`glass animate-fade-up bg-gradient-to-br p-6 ${PROFILE_STYLE[plan.risk_profile] || ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">Investment agent · risk profile</p>
            <p className="mt-1 font-display text-3xl font-bold text-white">{plan.risk_profile}</p>
            <p className="mt-1 text-sm text-slate-300">Based on your savings rate and the forecast and fraud risk from the other agents.</p>
          </div>
          <div className="text-right">
            <p className="label">Investable surplus</p>
            <p className="num mt-1 text-3xl font-bold text-white">{inr(plan.investable_surplus)}<span className="text-base font-normal text-slate-400">/mo</span></p>
            <p className="text-xs text-slate-400">Emergency fund target {inr(plan.emergency_fund_target)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <Card delay={60}>
          <CardHeader icon={Layers} title="Monthly split" subtitle="Where each rupee of surplus goes" accent="text-cyan-300" />
          {buckets.length ? (
            <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
              <div className="mx-auto aspect-square w-full max-w-[180px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={buckets} dataKey="amount" nameKey="bucket" innerRadius="62%" outerRadius="90%" paddingAngle={3} cornerRadius={5} stroke="none">
                      {buckets.map((b, i) => <Cell key={b.bucket} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {buckets.map((b, i) => (
                  <li key={b.bucket} className="flex items-center gap-3 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUCKET_COLORS[i % BUCKET_COLORS.length] }} />
                    <span className="flex-1 text-slate-300">{b.bucket}</span>
                    <span className="num font-semibold text-white">{inr(b.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No surplus to invest yet. Fix cash flow first.</p>
          )}
        </Card>

        <Card delay={120}>
          <CardHeader icon={TrendingUp} title="If you keep the SIP going" accent="text-amber-300"
            subtitle={plan.expected_annual_return ? `Illustrative, at ${plan.expected_annual_return}% p.a. expected return` : 'Projection'} />
          {projection.length ? (
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={projection} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => inr(v, { compact: true })} />
                  <Tooltip content={<ChartTooltip formatter={(v) => inr(v)} />} />
                  <Bar dataKey="Invested" fill="#475569" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Value" fill="#facc15" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-400">Projection appears once there is a surplus.</p>}
        </Card>
      </div>

      <Card delay={160}>
        <CardHeader icon={ShieldCheck} title="Your action ladder" subtitle="Protection before returns" accent="text-emerald-300" />
        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {(plan.steps || []).map((s, i) => (
            <li key={i} className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-4">
              <span className="font-mono text-xs text-slate-600">STEP {i + 1}</span>
              <p className="mt-1 text-sm font-semibold text-white">{s.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{s.detail}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500"><Info size={12} /> {plan.disclaimer}</p>
      </Card>
    </div>
  );
};

export default InvestmentPlan;
