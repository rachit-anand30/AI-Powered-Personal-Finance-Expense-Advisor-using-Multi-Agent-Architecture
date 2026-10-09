import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { PieChart as PieIcon, Receipt } from 'lucide-react';
import { colorFor, inr, pct } from '../lib/format';
import { Card, CardHeader, Empty } from './ui';

const ActiveSlice = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 6}
      startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={6}
      style={{ filter: `drop-shadow(0 0 10px ${fill}66)` }} />
  );
};

const TopList = ({ items = [], color, compact }) => (
  <ol className={compact ? 'space-y-1' : 'space-y-1.5'}>
    {items.map((t, i) => (
      <li key={`${t.date}-${t.description}-${i}`} className="flex items-center gap-2.5 text-xs">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-[10px] font-semibold"
          style={{ background: `${color}22`, color }}>{i + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-slate-200">{t.description}</span>
          {!compact && <span className="font-mono text-[10px] text-slate-500">{t.date}</span>}
        </span>
        <span className="num shrink-0 font-semibold text-white">{inr(t.amount)}</span>
      </li>
    ))}
  </ol>
);

const SliceTooltip = ({ active, payload, top, total }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="w-60 rounded-xl border border-white/10 bg-ink-900/95 p-3 shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-white">
          <span className="h-2 w-2 rounded-full" style={{ background: colorFor(d.name) }} />{d.name}
        </span>
        <span className="text-[11px] text-slate-400">{inr(d.value)} · {pct((d.value / total) * 100)}</span>
      </div>
      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Top expenses</p>
      <TopList items={top[d.name]} color={colorFor(d.name)} compact />
    </div>
  );
};

/**
 * Category donut for one period. Hovering a slice or a legend row shows that category's
 * three largest transactions.
 */
const ExpenseChart = ({ byCategory = {}, top = {}, periodLabel, alerts = [], delay = 0, periods = [], period, onPeriodChange }) => {
  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = data.reduce((s, d) => s + d.value, 0);
  const [activeName, setActiveName] = useState(null);
  const activeIndex = Math.max(0, data.findIndex((d) => d.name === activeName));
  const current = data[activeIndex];
  const alertSet = new Set(alerts);

  return (
    <Card delay={delay} className="h-full">
      <CardHeader icon={PieIcon} title="Where the money goes" subtitle={`${periodLabel} · hover a category to see its top 3 expenses`}
        right={periods.length > 1 && onPeriodChange && (
          <select value={period} onChange={(e) => onPeriodChange(e.target.value)} aria-label="Period"
            className="rounded-lg border border-white/10 bg-ink-950/70 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500/60">
            {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        )} />
      {data.length === 0 ? (
        <Empty icon={PieIcon} title="No spending in this period">Add transactions to see your category breakdown.</Empty>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,230px)_1fr]">
          <div>
            <div className="relative mx-auto aspect-square w-full max-w-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart key={data.map((d) => `${d.name}:${Math.round(d.value)}`).join('|')}>
                  <Pie data={data} dataKey="value" innerRadius="66%" outerRadius="88%" paddingAngle={2} cornerRadius={6}
                    stroke="none" activeIndex={activeIndex} activeShape={ActiveSlice}
                    onMouseEnter={(d) => setActiveName(d.name)} animationDuration={700}>
                    {data.map((d) => <Cell key={d.name} fill={colorFor(d.name)} />)}
                  </Pie>
                  <Tooltip content={<SliceTooltip top={top} total={total} />} wrapperStyle={{ zIndex: 20 }} />
                </PieChart>
              </ResponsiveContainer>
              {current && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-500">{current.name}</span>
                  <span className="num text-xl font-bold text-white">{inr(current.value)}</span>
                  <span className="text-[11px] text-slate-500">{pct((current.value / total) * 100, 1)} of {inr(total, { compact: true })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <ul className="space-y-1">
              {data.map((d) => (
                <li key={d.name}>
                  <button type="button" onMouseEnter={() => setActiveName(d.name)} onFocus={() => setActiveName(d.name)}
                    onClick={() => setActiveName(d.name)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left transition-colors ${d.name === current?.name ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorFor(d.name) }} />
                    <span className="flex-1 text-sm text-slate-300">
                      {d.name}
                      {alertSet.has(d.name) && <span className="chip ml-2 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20">high</span>}
                    </span>
                    <span className="hidden w-20 sm:block">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <span className="block h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: colorFor(d.name) }} />
                      </span>
                    </span>
                    <span className="num w-20 text-right text-sm font-semibold text-white">{inr(d.value)}</span>
                  </button>
                </li>
              ))}
            </ul>

            {current && (
              <div className="rounded-xl border border-white/[0.06] bg-ink-950/50 p-3.5">
                <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <Receipt size={12} style={{ color: colorFor(current.name) }} /> Top expenses · {current.name}
                </p>
                <TopList items={top[current.name]} color={colorFor(current.name)} />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ExpenseChart;
