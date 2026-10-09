import React, { useMemo, useState } from 'react';
import { Sparkles, LineChart as LineIcon, CalendarDays } from 'lucide-react';
import StatCards from './StatCards';
import ExpenseChart from './ExpenseChart';
import MonthlySpendChart from './MonthlySpendChart';
import AnomalyAlerts from './AnomalyAlerts';
import BudgetAllocation from './BudgetAllocation';
import PredictionGraph, { ForecastControls } from './PredictionGraph';
import AIRecommendations from './AIRecommendations';
import AskAdvisor from './AskAdvisor';
import { PipelineStrip } from './AgentPipeline';
import { Card, CardHeader, RiskBadge } from './ui';
import { inr, monthLabel } from '../lib/format';

/** Build the numbers every dashboard card shows for one period: a calendar month or the average. */
const buildView = (period, analysis, budget) => {
  const months = analysis.monthly_breakdown || [];
  const monthCount = Math.max(1, analysis.months_covered || months.length || 1);
  const month = months.find((m) => m.month === period);
  const score = (budget.monthly_scores || []).find((m) => m.month === period);
  if (month && score) {
    return {
      isAvg: false,
      label: `${monthLabel(period)}${month.in_progress ? ' (so far)' : ''}`,
      spend: month.total,
      count: month.transaction_count,
      byCategory: month.by_category,
      top: month.top_expenses,
      savings: score.savings,
      rate: score.savings_rate,
      health: score.budget_health_score,
      risk: score.risk_level,
      actual: { needs_spent: score.needs_spent, wants_spent: score.wants_spent, savings: score.savings },
      avgSpend: analysis.monthly_total,
      monthCount,
    };
  }
  return {
    isAvg: true,
    label: `${monthCount}-month average`,
    spend: analysis.monthly_total,
    byCategory: Object.fromEntries(Object.entries(analysis.category_wise_spending || {}).map(([c, v]) => [c, v / monthCount])),
    top: analysis.top_expenses || {},
    savings: budget.actual_allocation?.savings ?? 0,
    rate: budget.savings_rate ?? 0,
    health: budget.budget_health_score,
    risk: budget.risk_level,
    actual: budget.actual_allocation,
    monthCount,
  };
};

const periodLabel = (m, runningMonth) => (m === 'avg' ? 'Average' : `${monthLabel(m)}${m === runningMonth ? ' · so far' : ''}`);

const PeriodPicker = ({ months, value, onChange, runningMonth }) => (
  <div className="glass flex flex-wrap items-center gap-2 px-3 py-2.5 animate-fade-up">
    <span className="label flex items-center gap-1.5 pl-1 pr-2"><CalendarDays size={13} className="text-violet-300" /> Viewing</span>
    <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
      {months.map((m) => (
        <button key={m} type="button" onClick={() => onChange(m)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${value === m ? 'bg-violet-500/20 text-white ring-1 ring-violet-500/40' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}>
          {periodLabel(m, runningMonth)}
        </button>
      ))}
      {months.length > 1 && (
        <button type="button" onClick={() => onChange('avg')}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${value === 'avg' ? 'bg-violet-500/20 text-white ring-1 ring-violet-500/40' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}>
          Average
        </button>
      )}
    </div>
  </div>
);

const Dashboard = ({ result, income, ctx, backendOnline, onNavigate, forecastControls }) => {
  const { expense_analysis: analysis, anomalies, budget_plan: budget, predictions, advice } = result;
  const months = (analysis.monthly_breakdown || []).map((m) => m.month);
  const latest = months[months.length - 1];
  const [picked, setPicked] = useState(null);
  const period = picked && (picked === 'avg' || months.includes(picked)) ? picked : (latest || 'avg');
  const view = useMemo(() => buildView(period, analysis, budget), [period, analysis, budget]);

  const alert = anomalies.flagged_transactions?.length > 0;
  const runningMonth = analysis.in_progress_month;
  const periodOptions = [...months, ...(months.length > 1 ? ['avg'] : [])].map((m) => ({ value: m, label: periodLabel(m, runningMonth) }));
  const investedMonthly = (analysis.investments_total || 0) / Math.max(1, analysis.months_covered || 1);

  return (
    <div className="space-y-5">
      {/* AI summary hero */}
      <div className={`relative overflow-hidden rounded-2xl p-[1px] animate-fade-up ${alert ? 'bg-gradient-to-r from-rose-500/60 via-fuchsia-500/40 to-violet-500/40' : 'bg-gradient-to-r from-violet-500/50 via-fuchsia-500/30 to-cyan-500/50'}`}>
        <div className="relative rounded-2xl bg-ink-900/90 px-5 py-5 backdrop-blur-xl sm:px-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${alert ? 'bg-rose-500/15 text-rose-300 animate-pulse-ring' : 'bg-violet-500/15 text-violet-200'}`}>
              <Sparkles size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="label mb-1">AI summary · all months</p>
              <p className="text-[15px] leading-relaxed text-slate-100">{advice.summary}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:max-w-[15rem] md:justify-end">
              <RiskBadge level={budget.risk_level} label={`Budget: ${budget.risk_level}`} />
              <RiskBadge level={anomalies.risk_level} label={`Fraud: ${anomalies.risk_level}`} />
              <RiskBadge level={predictions.risk_level} label={`Forecast: ${predictions.risk_level}`} />
            </div>
          </div>
        </div>
      </div>

      {months.length > 0 && <PeriodPicker months={months} value={period} onChange={setPicked} runningMonth={runningMonth} />}

      <StatCards income={income} view={view} investedMonthly={investedMonthly} risk={view.risk} />

      <PipelineStrip trace={result.trace} onOpen={() => onNavigate('Agents')} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlySpendChart breakdown={analysis.monthly_breakdown} income={income} selected={period} onSelect={setPicked} delay={60} />
        </div>
        <AnomalyAlerts anomalies={anomalies} delay={120} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ExpenseChart byCategory={view.byCategory} top={view.top} periodLabel={view.label}
            alerts={view.isAvg ? analysis.overspending_alerts : []} delay={60}
            periods={periodOptions} period={period} onPeriodChange={setPicked} />
        </div>
        <div className="lg:col-span-2">
          <BudgetAllocation plan={budget} actual={view.actual} periodLabel={view.label} delay={120} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3"><AIRecommendations advice={advice} delay={60} onMore={() => onNavigate('Advisor')} /></div>
        <div className="lg:col-span-2">
          <Card delay={120} className="h-full">
            <CardHeader icon={LineIcon} title="Spending forecast" accent="text-cyan-300"
              subtitle={`${predictions.prediction_method} · ${Math.round(predictions.confidence)}% confidence`}
              right={predictions.next_month && (
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">{monthLabel(predictions.next_month)}</p>
                  <p className="num text-lg font-bold text-cyan-300">{inr(predictions.predicted_expense)}</p>
                </div>
              )} />
            <PredictionGraph prediction={predictions} income={income} height={220} />
            <ForecastControls prediction={predictions} controls={forecastControls} />
          </Card>
        </div>
      </div>

      <AskAdvisor ctx={ctx} backendOnline={backendOnline} initial={advice.response_to_query} compact delay={60} />
    </div>
  );
};

export default Dashboard;
