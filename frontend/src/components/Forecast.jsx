import React from 'react';
import { LineChart as LineIcon, TrendingUp, TrendingDown, Minus, Gauge, CalendarClock, Wallet } from 'lucide-react';
import PredictionGraph, { ForecastControls } from './PredictionGraph';
import { Card, CardHeader, Empty, RiskBadge } from './ui';
import { inr, monthLabel } from '../lib/format';

const TREND = {
  Increasing: { icon: TrendingUp, text: 'text-rose-300', label: 'Trending up' },
  Decreasing: { icon: TrendingDown, text: 'text-emerald-300', label: 'Trending down' },
  Stable: { icon: Minus, text: 'text-slate-300', label: 'Stable' },
};

const Forecast = ({ prediction, income, controls }) => {
  if (!prediction.monthly_history?.length) {
    return <Card><Empty icon={LineIcon} title="Nothing to forecast yet">Add at least one month of transactions.</Empty></Card>;
  }
  const trend = TREND[prediction.trend_direction] || TREND.Stable;
  const TrendIcon = trend.icon;
  const tiles = [
    { icon: CalendarClock, label: `Forecast for ${monthLabel(prediction.next_month)}`, value: inr(prediction.predicted_expense), accent: 'text-cyan-300' },
    { icon: Wallet, label: 'Predicted savings', value: inr(prediction.predicted_savings), accent: prediction.predicted_savings < 0 ? 'text-rose-300' : 'text-emerald-300' },
    { icon: Gauge, label: 'Model confidence', value: `${Math.round(prediction.confidence)}%`, accent: 'text-violet-300' },
    { icon: TrendIcon, label: 'Direction', value: trend.label, accent: trend.text },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.label} className="glass animate-fade-up p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="label flex items-center gap-1.5"><t.icon size={13} className={t.accent} /> {t.label}</span>
            <p className={`num mt-3 text-2xl font-bold ${t.accent}`}>{t.value}</p>
          </div>
        ))}
      </div>
      <Card delay={120}>
        <CardHeader icon={LineIcon} title="Monthly spending, actual vs forecast" accent="text-cyan-300"
          subtitle={`${prediction.prediction_method} on ${prediction.monthly_history.length} month(s) of history`}
          right={<RiskBadge level={prediction.risk_level} />} />
        <PredictionGraph prediction={prediction} income={income} height={340} />
        <ForecastControls prediction={prediction} controls={controls} />
        <div className="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-2">
          <p className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
            <b className="text-slate-200">Model choice:</b> 3+ months → least-squares Linear Regression, with confidence based on R² (fit quality).
            Fewer months → Moving Average, with lower confidence.
          </p>
          <p className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
            <b className="text-slate-200">Agent hand-off:</b> {prediction.excluded_one_offs > 0
              ? `the Anomaly agent asked us to ignore ${inr(prediction.excluded_one_offs)} of one-off flagged charges, so they don't skew the trend.`
              : 'the Anomaly agent found no one-off charges to exclude. Investment transfers are never counted as spending.'}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Forecast;
