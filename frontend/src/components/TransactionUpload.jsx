import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Brain, FileJson, FileSpreadsheet, PenLine, UploadCloud, Sparkles, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { uploadCsv, describeError } from '../api/financeApi';
import { CATEGORIES, colorFor, inr } from '../lib/format';
import { Card, CardHeader } from './ui';

const MODES = [
  { id: 'manual', label: 'Manual', icon: PenLine },
  { id: 'csv', label: 'CSV file', icon: FileSpreadsheet },
  { id: 'json', label: 'JSON', icon: FileJson },
];

const today = () => {
  const d = new Date(); // local date, not UTC
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const keyOf = (t) => `${t.date}|${t.description}|${Number(t.amount)}`;

const SourceBadge = ({ info, userCategory }) => {
  if (userCategory) return <span className="chip bg-white/[0.04] text-slate-400 ring-1 ring-white/10">you</span>;
  if (!info) return <span className="chip bg-white/[0.04] text-slate-500 ring-1 ring-white/10">analysing…</span>;
  if (info.category_source === 'ml') {
    return <span className="chip bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/25"><Brain size={10} /> ML {Math.round(info.category_confidence)}%</span>;
  }
  if (info.category_source === 'rules') return <span className="chip bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/25">rule</span>;
  return <span className="chip bg-white/[0.04] text-slate-400 ring-1 ring-white/10">default</span>;
};

/**
 * Controlled editor for the shared transaction list. Every change goes straight to App via
 * onChange(), which re-runs all agents, so the dashboard always reflects what is listed here.
 */
const TransactionUpload = ({ transactions, income, savingGoal, categorized = [], flagged = [], onChange, onRerun,
  onViewDashboard, loading, backendOnline }) => {
  const [mode, setMode] = useState('manual');
  const [jsonInput, setJsonInput] = useState(() => JSON.stringify(transactions, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [csvStatus, setCsvStatus] = useState(null);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState(() => ({ date: today(), description: '', amount: '', category: '' }));
  const [highlight, setHighlight] = useState(null);
  const fileRef = useRef(null);
  const tableRef = useRef(null);
  const editingJson = useRef(false);

  // Keep the JSON view in sync with edits made elsewhere (manual entry, delete, CSV, scenario load)
  useEffect(() => {
    if (editingJson.current) {
      editingJson.current = false;
      return;
    }
    setJsonInput(JSON.stringify(transactions, null, 2));
    setJsonError(null);
  }, [transactions]);

  // ML labels and fraud flags from the latest analysis, matched back onto rows
  const labels = useMemo(() => new Map(categorized.map((t) => [keyOf(t), t])), [categorized]);
  const flaggedKeys = useMemo(() => new Set(flagged.map(keyOf)), [flagged]);

  // Newest first, keeping each row's index in the underlying list for deletion
  const rows = useMemo(
    () => transactions.map((t, i) => ({ t, i })).sort((a, b) => (b.t.date || '').localeCompare(a.t.date || '') || b.i - a.i),
    [transactions],
  );

  const add = (e) => {
    e.preventDefault();
    const amount = Number(String(form.amount).replace(/,/g, ''));
    if (!form.description.trim()) return setFormError('Add a description, e.g. "Swiggy" or "Electricity bill".');
    if (!(amount > 0)) return setFormError('Amount must be a number greater than 0.');
    if (!form.date) return setFormError('Pick a date.');
    setFormError(null);
    const txn = { date: form.date, description: form.description.trim(), amount, ...(form.category ? { category: form.category } : {}) };
    onChange({ transactions: [...transactions, txn] }, { type: 'add', txn });
    setHighlight(keyOf(txn));
    setForm({ ...form, description: '', amount: '' });
    tableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = (index) => {
    const txn = transactions[index];
    onChange({ transactions: transactions.filter((_, j) => j !== index) }, { type: 'remove', txn });
  };

  const onJson = (val) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Expected an array of transactions');
      const bad = parsed.findIndex((t) => !t || !t.date || !t.description || !(Number(t.amount) > 0));
      if (bad >= 0) throw new Error(`Item ${bad + 1} needs a date, a description and an amount > 0`);
      setJsonError(null);
      editingJson.current = true;
      onChange({ transactions: parsed.map((t) => ({ ...t, amount: Number(t.amount) })) }, { type: 'bulk' });
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const onCsv = async (file) => {
    if (!file) return;
    setCsvStatus({ text: `Uploading ${file.name}…` });
    try {
      const res = await uploadCsv(file, income);
      onChange({
        transactions: res.transactions.map(({ date, description, amount, category }) => ({ date, description, amount, ...(category ? { category } : {}) })),
      }, { type: 'bulk' });
      setCsvStatus({ text: `${res.message}${res.skipped_rows.length ? ` · skipped ${res.skipped_rows.length} bad row(s): ${res.skipped_rows.slice(0, 2).join('; ')}` : ''}` });
    } catch (err) {
      setCsvStatus({ error: true, text: describeError(err) });
    }
  };

  const total = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const blocker = !backendOnline ? 'Backend is offline: changes are saved here, but the agents can\'t run until you start it (uvicorn backend.main:app --reload).'
    : !(Number(income) > 0) ? 'Enter your monthly income so the agents can analyse your transactions.'
    : transactions.length === 0 ? 'Add at least one transaction to run the agents.'
    : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader icon={Sparkles} title="Your profile" subtitle="Used by every agent. Changes apply automatically." />
          <div className="space-y-4">
            <label className="block">
              <span className="label">Monthly income (₹)</span>
              <input type="number" min="0" className="input mt-1.5" value={income || ''} placeholder="e.g. 60000"
                onChange={(e) => onChange({ income: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="label">Monthly savings goal (₹, optional)</span>
              <input type="number" min="0" className="input mt-1.5" placeholder="Defaults to 20% of income" value={savingGoal ?? ''}
                onChange={(e) => onChange({ savingGoal: e.target.value === '' ? null : Number(e.target.value) })} />
            </label>
          </div>
        </Card>

        <Card delay={60}>
          <div className="mb-4 flex rounded-xl bg-ink-950/60 p-1 ring-1 ring-white/[0.06]">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setMode(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${mode === id ? 'bg-white/[0.08] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {mode === 'manual' && (
            <form onSubmit={add} className="space-y-3" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label">Date</span>
                  <input type="date" className="input mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </label>
                <label className="block">
                  <span className="label">Amount (₹)</span>
                  <input inputMode="decimal" placeholder="e.g. 2500" className="input mt-1" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </label>
              </div>
              <label className="block">
                <span className="label">Description</span>
                <input placeholder="e.g. Zomato dinner, UBER *TRIP, Electricity bill" className="input mt-1" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Category</span>
                <select className="input mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Let the ML model decide</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              {formError && <p className="text-xs text-rose-300">{formError}</p>}
              <button type="submit" className="btn-primary w-full"><Plus size={15} /> Add transaction</button>
              <p className="text-[11px] text-slate-500">Dated today by default. The current month shows as "so far" on the dashboard until it ends.</p>
            </form>
          )}

          {mode === 'csv' && (
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center transition-colors hover:border-violet-500/50 hover:bg-violet-500/[0.04]">
                <UploadCloud size={26} className="text-violet-300" />
                <span className="text-sm font-medium text-white">Choose a bank-statement CSV</span>
                <span className="text-xs text-slate-500">Columns: date, description, amount, plus an optional category. Replaces the current list.</span>
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { onCsv(e.target.files?.[0]); e.target.value = ''; }} />
              {csvStatus && <p className={`mt-3 text-xs ${csvStatus.error ? 'text-rose-300' : 'text-slate-400'}`}>{csvStatus.text}</p>}
            </div>
          )}

          {mode === 'json' && (
            <div>
              <textarea value={jsonInput} onChange={(e) => onJson(e.target.value)} spellCheck={false}
                className="input h-64 resize-y font-mono text-xs text-emerald-300" />
              {jsonError
                ? <p className="mt-2 text-xs text-rose-300">{jsonError}</p>
                : <p className="mt-2 text-[11px] text-slate-500">Valid JSON is applied automatically.</p>}
            </div>
          )}
        </Card>
      </div>

      <Card delay={100} className="flex flex-col">
        <CardHeader icon={Brain} title={`Transactions (${transactions.length})`}
          subtitle={`Total ${inr(total)} · newest first · categories from the TF-IDF + Logistic Regression model`}
          right={
            <div className="flex items-center gap-2">
              <button type="button" onClick={onRerun} disabled={!!blocker || loading} className="btn-ghost px-3 py-1.5 text-xs" title="Run all agents again">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Re-run
              </button>
              <button type="button" onClick={onViewDashboard} className="btn-ghost px-3 py-1.5 text-xs">Dashboard <ArrowRight size={13} /></button>
            </div>
          } />

        <div className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs ring-1 ${
          blocker ? 'bg-amber-500/[0.07] text-amber-200 ring-amber-500/20'
            : loading ? 'bg-violet-500/[0.07] text-violet-200 ring-violet-500/20'
            : 'bg-emerald-500/[0.06] text-emerald-200 ring-emerald-500/20'}`}>
          {blocker ? <AlertTriangle size={14} /> : loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {blocker || (loading ? 'Agents are re-analysing your data…' : 'Dashboard is up to date with this list.')}
        </div>

        <div className="-mx-5 flex-1 overflow-x-auto sm:-mx-6">
          <div ref={tableRef} className="max-h-[34rem] overflow-y-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-ink-900/95 text-[11px] uppercase tracking-wider text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-5 py-2.5 font-medium sm:px-6">Date</th>
                  <th className="px-3 py-2.5 font-medium">Description</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 sm:px-6"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center text-sm text-slate-500">No transactions yet. Add one, or load a scenario.</td></tr>
                )}
                {rows.map(({ t, i }) => {
                  const k = keyOf(t);
                  const info = labels.get(k);
                  const category = t.category || info?.category;
                  const isNew = k === highlight;
                  const isFlagged = flaggedKeys.has(k);
                  return (
                    <tr key={`${k}-${i}`} className={`group border-t border-white/[0.04] transition-colors ${isNew ? 'bg-violet-500/[0.12]' : 'hover:bg-white/[0.02]'}`}>
                      <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-slate-500 sm:px-6">{t.date}</td>
                      <td className="max-w-[16rem] px-3 py-2.5 text-slate-200">
                        <span className="flex items-center gap-2">
                          <span className="truncate">{t.description}</span>
                          {isNew && <span className="chip shrink-0 bg-violet-500/20 text-violet-200">new</span>}
                          {isFlagged && <span className="chip shrink-0 bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25">flagged</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {category && (
                            <span className="chip ring-1 ring-white/10" style={{ background: `${colorFor(category)}1a`, color: colorFor(category) }}>{category}</span>
                          )}
                          <SourceBadge info={info} userCategory={t.category && !info?.category_confidence ? t.category : null} />
                        </div>
                      </td>
                      <td className="num whitespace-nowrap px-3 py-2.5 text-right font-medium text-white">{inr(t.amount)}</td>
                      <td className="px-5 py-2.5 text-right sm:px-6">
                        <button type="button" onClick={() => remove(i)} aria-label={`Remove ${t.description}`}
                          className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TransactionUpload;
