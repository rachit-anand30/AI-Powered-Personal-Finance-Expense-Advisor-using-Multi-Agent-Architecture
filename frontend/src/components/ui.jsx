import React from 'react';
import { RISK_STYLES } from '../lib/format';

export const Card = ({ className = '', children, delay = 0, ...rest }) => (
  <section
    className={`glass p-5 sm:p-6 animate-fade-up ${className}`}
    style={{ animationDelay: `${delay}ms` }}
    {...rest}
  >
    {children}
  </section>
);

export const CardHeader = ({ icon: Icon, title, subtitle, right, accent = 'text-violet-300' }) => (
  <div className="mb-5 flex items-start justify-between gap-3">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-white/10 ${accent}`}>
          <Icon size={18} />
        </div>
      )}
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-sub mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

export const RiskBadge = ({ level = 'Low', label }) => {
  const s = RISK_STYLES[level] || RISK_STYLES.Low;
  return (
    <span className={`chip ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label || `${level} risk`}
    </span>
  );
};

export const AgentTag = ({ name }) => (
  <span className="chip bg-white/[0.04] text-slate-400 ring-1 ring-white/10">{name}</span>
);

export const ProgressBar = ({ value, max, color = '#8b5cf6', marker }) => {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
      />
      {marker != null && max > 0 && (
        <div className="absolute top-0 h-full w-0.5 bg-white/70" style={{ left: `${Math.min(100, (marker / max) * 100)}%` }} />
      )}
    </div>
  );
};

export const Empty = ({ icon: Icon, title, children }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    {Icon && (
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-slate-500 ring-1 ring-white/10">
        <Icon size={22} />
      </div>
    )}
    <p className="text-sm font-medium text-slate-300">{title}</p>
    {children && <p className="mt-1 max-w-xs text-xs text-slate-500">{children}</p>}
  </div>
);

export const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label && <p className="mb-1 font-medium text-slate-300">{label}</p>}
      {payload.filter((p) => p.value != null).map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2 text-slate-400">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <span className="font-medium text-white">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};
