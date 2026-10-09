import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { CalendarRange } from 'lucide-react';
import { CATEGORIES, colorFor, inr, monthLabel } from '../lib/format';
import { Card, CardHeader } from './ui';

const MonthTooltip = ({ active, payload, income }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const parts = payload.filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  return (
    <div className="min-w-[13rem] rounded-xl border border-white/10 bg-ink-900/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <span className="font-medium text-slate-300">{row.label}</span>
        <span className="num font-semibold text-white">{inr(row.total)}</span>
      </div>
      {parts.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4 text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />{p.dataKey}</span>
          <span className="text-slate-200">{inr(p.value)}</span>
        </p>
      ))}
      {income > 0 && (
        <p className={`mt-1.5 border-t border-white/10 pt-1.5 ${row.total > income ? 'text-rose-300' : 'text-emerald-300'}`}>
          {row.total > income ? `${inr(row.total - income)} over income` : `${inr(income - row.total)} left from income`}
        </p>
      )}
      <p className="mt-1 text-[10px] text-slate-500">Click to view this month</p>
    </div>
  );
};

/** Actual expenditure for every month, stacked by category. Clicking a bar selects that month. */
const MonthlySpendChart = ({ breakdown = [], income, selected, onSelect, delay = 0 }) => {
  const present = CATEGORIES.filter((c) => breakdown.some((m) => m.by_category[c]));
  const data = breakdown.map((m) => ({
    month: m.month, label: `${monthLabel(m.month)}${m.in_progress ? ' (so far)' : ''}`, total: m.total, ...m.by_category,
  }));
  const maxY = Math.max(income || 0, ...data.map((d) => d.total)) * 1.12;

  return (
    <Card delay={delay}>
      <CardHeader icon={CalendarRange} title="Monthly expenditure" accent="text-rose-300"
        subtitle="Actual spending per month, by category. Investments are not counted as spending." />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart key={data.map((d) => `${d.month}:${Math.round(d.total)}`).join('|')} data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
            onClick={(e) => e?.activePayload?.[0] && onSelect(e.activePayload[0].payload.month)}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, maxY]}
              tickFormatter={(v) => inr(v, { compact: true })} />
            <Tooltip content={<MonthTooltip income={income} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            {income > 0 && (
              <ReferenceLine y={income} stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.7}
                label={{ value: `Income ${inr(income, { compact: true })}`, fill: '#34d399', fontSize: 11, position: 'insideTopRight' }} />
            )}
            {present.map((cat, i) => (
              <Bar key={cat} dataKey={cat} stackId="spend" fill={colorFor(cat)} maxBarSize={56} className="cursor-pointer"
                radius={i === present.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} animationDuration={600}>
                {data.map((d) => (
                  <Cell key={d.month} fillOpacity={!selected || selected === 'avg' || selected === d.month ? 1 : 0.35} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {present.map((c) => (
          <span key={c} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: colorFor(c) }} />{c}
          </span>
        ))}
      </div>
    </Card>
  );
};

export default MonthlySpendChart;
