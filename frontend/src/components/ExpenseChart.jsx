import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
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

const ExpenseChart = ({ analysis, delay = 0 }) => {
  const months = Math.max(1, analysis.months_covered || 1);
  const data = Object.entries(analysis.category_wise_spending || {})
    .map(([name, total]) => ({ name, value: total / months, share: analysis.spending_percentages?.[name] || 0 }))
    .sort((a, b) => b.value - a.value);
  const [active, setActive] = useState(0);
  const current = data[active] || data[0];
  const alerts = new Set(analysis.overspending_alerts || []);

  return (
    <Card delay={delay} className="h-full">
      <CardHeader icon={PieIcon} title="Where the money goes" subtitle="Average per month · categorised by the ML classifier" />
      {data.length === 0 ? (
        <Empty icon={PieIcon} title="No spending yet">Add transactions to see your category breakdown.</Empty>
      ) : (
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,240px)_1fr]">
          <div className="relative mx-auto aspect-square w-full max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius="66%" outerRadius="88%" paddingAngle={2} cornerRadius={6}
                  stroke="none" activeIndex={active} activeShape={ActiveSlice} onMouseEnter={(_, i) => setActive(i)}
                  animationDuration={800}>
                  {data.map((d) => <Cell key={d.name} fill={colorFor(d.name)} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {current && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] text-slate-500">{current.name}</span>
                <span className="num text-xl font-bold text-white">{inr(current.value)}</span>
                <span className="text-[11px] text-slate-500">{pct(current.share, 1)}</span>
              </div>
            )}
          </div>
          <ul className="space-y-1.5">
            {data.map((d, i) => (
              <li key={d.name}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${i === active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorFor(d.name) }} />
                  <span className="flex-1 text-sm text-slate-300">
                    {d.name}
                    {alerts.has(d.name) && <span className="chip ml-2 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20">high</span>}
                  </span>
                  <span className="hidden w-24 sm:block">
                    <span className="block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <span className="block h-full rounded-full" style={{ width: `${d.share}%`, background: colorFor(d.name) }} />
                    </span>
                  </span>
                  <span className="num w-20 text-right text-sm font-semibold text-white">{inr(d.value)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default ExpenseChart;
