import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { inr, monthLabel } from '../lib/format';
import { ChartTooltip } from './ui';

/**
 * Actual monthly spending (solid), the trend the model fits on when one-offs are excluded (dotted),
 * the forecast (dashed), the running month's spend so far (dot), and income (reference line).
 */
const PredictionGraph = ({ prediction, income, height = 240 }) => {
  const history = prediction.monthly_history || [];
  const complete = history.filter((h) => !h.in_progress);
  const running = history.find((h) => h.in_progress);
  const showBasis = complete.some((h) => Math.round(h.trend_basis ?? h.amount) !== Math.round(h.amount));

  const data = complete.map((h) => ({
    month: monthLabel(h.month),
    actual: h.amount,
    ...(showBasis ? { basis: h.trend_basis } : {}),
  }));
  if (data.length && prediction.next_month) {
    const last = complete[complete.length - 1];
    data[data.length - 1].forecast = last.trend_basis ?? last.amount;
    data.push({
      month: `${monthLabel(prediction.next_month)}${running ? ' (now)' : ''}`,
      forecast: prediction.predicted_expense,
      ...(running && running.month === prediction.next_month ? { soFar: running.amount } : {}),
    });
  }
  const maxY = Math.max(income || 0, ...data.map((d) => Math.max(d.actual || 0, d.forecast || 0, d.soFar || 0))) * 1.15;
  const chartKey = data.map((d) => `${d.month}:${Math.round(d.actual ?? 0)}:${Math.round(d.forecast ?? 0)}:${Math.round(d.soFar ?? 0)}`).join('|');

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart key={chartKey} data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
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
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, maxY]}
            tickFormatter={(v) => inr(v, { compact: true })} />
          <Tooltip content={<ChartTooltip formatter={(v) => inr(v)} />} />
          {income > 0 && (
            <ReferenceLine y={income} stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.7}
              label={{ value: `Income ${inr(income, { compact: true })}`, fill: '#34d399', fontSize: 11, position: 'insideTopRight' }} />
          )}
          <Area type="monotone" dataKey="actual" name="Actual" stroke="#a78bfa" strokeWidth={2.5} fill="url(#gActual)"
            dot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={800} />
          {showBasis && (
            <Line type="monotone" dataKey="basis" name="Trend basis (no one-offs)" stroke="#94a3b8" strokeWidth={1.5}
              strokeDasharray="2 4" dot={false} animationDuration={800} />
          )}
          <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="6 5"
            fill="url(#gForecast)" dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }} animationDuration={800} />
          <Line dataKey="soFar" name="Spent so far" stroke="none" isAnimationActive={false}
            dot={{ r: 6, fill: '#fbbf24', stroke: '#0c0e16', strokeWidth: 2 }} activeDot={{ r: 7 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

/** One-line explanation + the "include one-offs" switch, shared by the dashboard card and the Forecast tab. */
export const ForecastControls = ({ prediction, controls }) => {
  if (!controls) return null;
  const { includeOneOffs, onToggleOneOffs, disabled } = controls;
  const running = prediction.in_progress_month;
  return (
    <div className="mt-3 space-y-2 text-[11px] text-slate-500">
      {running && prediction.month_to_date != null && (
        <p>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" />
          {monthLabel(running)} so far: <span className="text-slate-300">{inr(prediction.month_to_date)}</span> of a forecast {inr(prediction.predicted_expense)}
          {' '}({Math.round((prediction.month_to_date / Math.max(1, prediction.predicted_expense)) * 100)}% used).
        </p>
      )}
      <label className={`flex items-center gap-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
        <input type="checkbox" className="h-3.5 w-3.5 accent-cyan-400" checked={includeOneOffs} disabled={disabled}
          onChange={(e) => onToggleOneOffs(e.target.checked)} />
        <span>
          Include flagged one-off purchases in the forecast
          {!includeOneOffs && prediction.excluded_one_offs > 0 && <> (currently ignoring {inr(prediction.excluded_one_offs)})</>}
        </span>
      </label>
    </div>
  );
};

export default PredictionGraph;
