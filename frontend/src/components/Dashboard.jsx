import React from 'react';
import { Sparkles, LineChart as LineIcon } from 'lucide-react';
import StatCards from './StatCards';
import ExpenseChart from './ExpenseChart';
import AnomalyAlerts from './AnomalyAlerts';
import BudgetAllocation from './BudgetAllocation';
import PredictionGraph from './PredictionGraph';
import AIRecommendations from './AIRecommendations';
import AskAdvisor from './AskAdvisor';
import { PipelineStrip } from './AgentPipeline';
import { Card, CardHeader, RiskBadge } from './ui';
import { inr, monthLabel, worstRisk } from '../lib/format';

const Dashboard = ({ result, income, ctx, backendOnline, onNavigate }) => {
  const { expense_analysis: analysis, anomalies, budget_plan: budget, predictions, advice } = result;
  const overall = worstRisk(analysis.risk_level, anomalies.risk_level, budget.risk_level, predictions.risk_level);
  const alert = anomalies.flagged_transactions?.length > 0;

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
              <p className="label mb-1">AI summary</p>
              <p className="text-[15px] leading-relaxed text-slate-100">{advice.summary}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:max-w-[15rem] md:justify-end">
              <RiskBadge level={analysis.risk_level} label={`Spending: ${analysis.risk_level}`} />
              <RiskBadge level={anomalies.risk_level} label={`Fraud: ${anomalies.risk_level}`} />
              <RiskBadge level={predictions.risk_level} label={`Forecast: ${predictions.risk_level}`} />
            </div>
          </div>
        </div>
      </div>

      <StatCards income={income} analysis={analysis} budget={budget} risk={overall} />

      <PipelineStrip trace={result.trace} onOpen={() => onNavigate('Agents')} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><ExpenseChart analysis={analysis} delay={60} /></div>
        <AnomalyAlerts anomalies={anomalies} delay={120} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <BudgetAllocation plan={budget} delay={60} />
        <Card delay={120}>
          <CardHeader icon={LineIcon} title="Spending forecast" accent="text-cyan-300"
            subtitle={`${predictions.prediction_method} · ${Math.round(predictions.confidence)}% confidence`}
            right={predictions.next_month && (
              <div className="text-right">
                <p className="text-[11px] text-slate-500">{monthLabel(predictions.next_month)}</p>
                <p className="num text-lg font-bold text-cyan-300">{inr(predictions.predicted_expense)}</p>
              </div>
            )} />
          <PredictionGraph prediction={predictions} income={income} height={220} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3"><AIRecommendations advice={advice} delay={60} onMore={() => onNavigate('Advisor')} /></div>
        <div className="lg:col-span-2">
          <AskAdvisor ctx={ctx} backendOnline={backendOnline} initial={advice.response_to_query} compact delay={120} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
