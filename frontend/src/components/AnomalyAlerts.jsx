import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { inr } from '../lib/format';
import { Card, CardHeader, RiskBadge } from './ui';

const METHODS = ['Modified Z-score', 'Z-score', 'Isolation Forest'];

const AnomalyAlerts = ({ anomalies, delay = 0 }) => {
  const flagged = anomalies.flagged_transactions || [];
  const clean = flagged.length === 0;

  return (
    <Card delay={delay} className={`h-full ${clean ? '' : 'border-rose-500/25 bg-gradient-to-b from-rose-500/[0.07] to-transparent'}`}>
      <CardHeader
        icon={clean ? ShieldCheck : ShieldAlert}
        accent={clean ? 'text-emerald-300' : 'text-rose-300'}
        title="Fraud & anomaly watch"
        subtitle="3-detector ensemble vote"
        right={<RiskBadge level={anomalies.risk_level} />}
      />

      {clean ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25">
            <ShieldCheck size={28} className="text-emerald-300" />
          </div>
          <p className="text-sm font-medium text-white">All clear</p>
          <p className="mt-1 max-w-[16rem] text-xs text-slate-500">
            Every transaction fits your normal pattern. Rent, EMIs, SIPs and recurring merchants are treated as expected.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {flagged.map((a) => (
            <li key={`${a.date}-${a.description}-${a.amount}`} className="rounded-xl border border-rose-500/20 bg-ink-950/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{a.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{a.date} · {a.category}</p>
                </div>
                <span className="num shrink-0 text-lg font-bold text-rose-300">{inr(a.amount)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
                </span>
                <span><b className="text-white">{a.times_typical}×</b> your typical transaction</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {METHODS.map((m) => {
                  const hit = a.detected_by?.includes(m);
                  return (
                    <div key={m} className={`rounded-lg px-2 py-1.5 text-center text-[10px] leading-tight ring-1 ${hit ? 'bg-rose-500/10 text-rose-200 ring-rose-500/30' : 'bg-white/[0.02] text-slate-600 ring-white/5'}`}>
                      {m}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>Modified z = {a.modified_z_score}</span>
                <span>Confidence {a.confidence}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default AnomalyAlerts;
