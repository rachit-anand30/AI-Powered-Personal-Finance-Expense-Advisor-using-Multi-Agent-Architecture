import React from 'react';
import { Lightbulb, PiggyBank, Activity } from 'lucide-react';
import AskAdvisor from './AskAdvisor';
import { RecommendationList } from './AIRecommendations';
import { Card, CardHeader } from './ui';
import { inr } from '../lib/format';

const AdvisorPage = ({ advice, ctx, backendOnline }) => (
  <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
    <div className="space-y-5">
      <Card>
        <CardHeader icon={Lightbulb} title="Recommendations" subtitle={advice.summary} accent="text-amber-300" />
        <RecommendationList items={advice.top_recommendations || []} columns={1} />
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card delay={80}>
          <CardHeader icon={PiggyBank} title="Savings opportunities" accent="text-cyan-300"
            subtitle={advice.potential_monthly_savings > 0 ? `Up to ${inr(advice.potential_monthly_savings)}/month found in your transactions` : 'Found in your transactions'} />
          {advice.savings_opportunities?.length ? (
            <ul className="space-y-2.5">
              {advice.savings_opportunities.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />{s}</li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Nothing obvious to trim. Nice work.</p>}
        </Card>
        <Card delay={120}>
          <CardHeader icon={Activity} title="Risk outlook" accent="text-rose-300" />
          <p className="text-[13px] leading-relaxed text-slate-300">{advice.risk_assessment}</p>
        </Card>
      </div>
    </div>
    <div className="lg:sticky lg:top-32 lg:self-start">
      <AskAdvisor ctx={ctx} backendOnline={backendOnline} initial={advice.response_to_query} delay={60} />
    </div>
  </div>
);

export default AdvisorPage;
