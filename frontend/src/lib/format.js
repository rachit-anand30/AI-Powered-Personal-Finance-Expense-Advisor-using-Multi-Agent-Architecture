import { useEffect, useRef, useState } from 'react';

export const CATEGORIES = ['Bills', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Healthcare', 'Education', 'Investments', 'Others'];

export const CATEGORY_COLORS = {
  Bills: '#8b5cf6',
  Food: '#fb923c',
  Transport: '#22d3ee',
  Shopping: '#ec4899',
  Entertainment: '#a3e635',
  Healthcare: '#34d399',
  Education: '#60a5fa',
  Investments: '#facc15',
  Others: '#94a3b8',
};

export const colorFor = (category) => CATEGORY_COLORS[category] || '#94a3b8';

export const inr = (value, { compact = false, sign = false } = {}) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  let body;
  if (compact && abs >= 100000) body = `${(abs / 100000).toFixed(abs >= 1000000 ? 0 : 1)}L`;
  else if (compact && abs >= 1000) body = `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  else body = Math.round(abs).toLocaleString('en-IN');
  const prefix = n < 0 ? '−' : sign && n > 0 ? '+' : '';
  return `${prefix}₹${body}`;
};

export const pct = (value, digits = 0) => `${(Number(value) || 0).toFixed(digits)}%`;

export const monthLabel = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' }) + ` '${String(y).slice(2)}`;
};

export const RISK_STYLES = {
  Low: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },
  Medium: { text: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', dot: 'bg-amber-400' },
  High: { text: 'text-rose-300', bg: 'bg-rose-500/10', ring: 'ring-rose-500/30', dot: 'bg-rose-400' },
};

const RISK_ORDER = { Low: 0, Medium: 1, High: 2 };
export const worstRisk = (...levels) =>
  levels.filter(Boolean).reduce((worst, l) => (RISK_ORDER[l] > RISK_ORDER[worst] ? l : worst), 'Low');

export const scoreColor = (score) => (score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#fb7185');

/** Animate a number from its previous value to the new one. */
export const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(initial + (target - initial) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = target;
    };
  }, [target, duration]);
  return value;
};
