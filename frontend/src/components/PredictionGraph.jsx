import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { inr, monthLabel } from '../lib/format';
import { ChartTooltip } from './ui';

/** History as a solid area, forecast as a dashed continuation, income as a reference line. */
const PredictionGraph = ({ prediction, income, height = 240 }) => {
  const history = prediction.monthly_history || [];
  const data = history.map((h) => ({ month: monthLabel(h.month), actual: h.amount }));
  if (data.length && prediction.next_month) {
    data[data.length - 1].forecast = data[data.length - 1].actual;
    data.push({ month: monthLabel(prediction.next_month), forecast: prediction.predicted_expense });
  }
  const maxY = Math.max(income || 0, ...data.map((d) => Math.max(d.actual || 0, d.forecast || 0))) * 1.15;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, maxY]}
            tickFormatter={(v) => inr(v, { compact: true })} />
          <Tooltip content={<ChartTooltip formatter={(v) => inr(v)} />} />
          {income > 0 && (
            <ReferenceLine y={income} stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.7}
              label={{ value: `Income ${inr(income, { compact: true })}`, fill: '#34d399', fontSize: 11, position: 'insideTopRight' }} />
          )}
          <Area type="monotone" dataKey="actual" name="Actual" stroke="#a78bfa" strokeWidth={2.5} fill="url(#gActual)"
            dot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={900} />
          <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="6 5"
            fill="url(#gForecast)" dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }} animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionGraph;
