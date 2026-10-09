import React, { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Brain, FileJson, FileSpreadsheet, PenLine, UploadCloud, Sparkles } from 'lucide-react';
import { uploadCsv, describeError } from '../api/financeApi';
import { CATEGORIES, colorFor, inr } from '../lib/format';
import { Card, CardHeader } from './ui';

const MODES = [
  { id: 'manual', label: 'Manual', icon: PenLine },
  { id: 'csv', label: 'CSV file', icon: FileSpreadsheet },
  { id: 'json', label: 'JSON', icon: FileJson },
];

const today = () => new Date().toISOString().slice(0, 10);
const keyOf = (t) => `${t.date}|${t.description}|${Number(t.amount)}`;

const SourceBadge = ({ info, userCategory }) => {
  if (userCategory) return <span className="chip bg-white/[0.04] text-slate-400 ring-1 ring-white/10">you</span>;
  if (!info) return <span className="chip bg-white/[0.04] text-slate-500 ring-1 ring-white/10">pending</span>;
  if (info.category_source === 'ml') {
    return <span className="chip bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/25"><Brain size={10} /> ML {Math.round(info.category_confidence)}%</span>;
  }
  if (info.category_source === 'rules') return <span className="chip bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/25">rule</span>;
  return <span className="chip bg-white/[0.04] text-slate-400 ring-1 ring-white/10">default</span>;
};

const TransactionUpload = ({ onAnalyze, initialTransactions = [], categorized = [], initialIncome = 0, initialGoal = null, loading }) => {
  const [mode, setMode] = useState('manual');
  const [transactions, setTransactions] = useState(initialTransactions);
  const [income, setIncome] = useState(initialIncome);
  const [goal, setGoal] = useState(initialGoal ?? '');
  const [jsonInput, setJsonInput] = useState(JSON.stringify(initialTransactions, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [csvStatus, setCsvStatus] = useState(null);
  const [form, setForm] = useState({ date: today(), description: '', amount: '', category: '' });
  const fileRef = useRef(null);

  // ML labels returned by the last analysis, matched back onto rows
  const labels = useMemo(() => new Map(categorized.map((t) => [keyOf(t), t])), [categorized]);

  const update = (next) => {
    setTransactions(next);
    setJsonInput(JSON.stringify(next, null, 2));
  };

  const add = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !(Number(form.amount) > 0)) return;
    update([...transactions, { date: form.date, description: form.description.trim(), amount: Number(form.amount), ...(form.category ? { category: form.category } : {}) }]);
    setForm({ ...form, description: '', amount: '' });
  };

  const onJson = (val) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Expected an array of transactions');
      setTransactions(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const onCsv = async (file) => {
    if (!file) return;
    setCsvStatus({ busy: true, text: `Uploading ${file.name}…` });
    try {
      const res = await uploadCsv(file, income);
      update(res.transactions.map(({ date, description, amount, category }) => ({ date, description, amount, ...(category ? { category } : {}) })));
      setCsvStatus({ text: `${res.message}${res.skipped_rows.length ? ` · skipped ${res.skipped_rows.length} bad row(s)` : ''}` });
    } catch (err) {
      setCsvStatus({ error: true, text: describeError(err) });
    }
  };

  const total = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const canAnalyze = transactions.length > 0 && Number(income) > 0 && !jsonError && !loading;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader icon={Sparkles} title="Your profile" subtitle="Used by every agent" />
          <div className="space-y-4">
            <label className="block">
              <span className="label">Monthly income (₹)</span>
              <input type="number" min="0" className="input mt-1.5" value={income} onChange={(e) => setIncome(Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="label">Monthly savings goal (₹, optional)</span>
              <input type="number" min="0" className="input mt-1.5" placeholder="Defaults to 20% of income" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </label>
          </div>
        </Card>

        <Card delay={60}>
          <div className="mb-4 flex rounded-xl bg-ink-950/60 p-1 ring-1 ring-white/[0.06]">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMode(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${mode === id ? 'bg-white/[0.08] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {mode === 'manual' && (
            <form onSubmit={add} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <input type="number" min="1" step="any" required placeholder="Amount ₹" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <input required placeholder="Description, e.g. SWIGGY*ORDER 8812" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Category: let the ML model decide</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="btn-ghost w-full"><Plus size={15} /> Add transaction</button>
            </form>
          )}

          {mode === 'csv' && (
            <div>
              <button onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center transition-colors hover:border-violet-500/50 hover:bg-violet-500/[0.04]">
                <UploadCloud size={26} className="text-violet-300" />
                <span className="text-sm font-medium text-white">Choose a bank-statement CSV</span>
                <span className="text-xs text-slate-500">Columns: date, description, amount, plus an optional category</span>
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onCsv(e.target.files?.[0])} />
              {csvStatus && <p className={`mt-3 text-xs ${csvStatus.error ? 'text-rose-300' : 'text-slate-400'}`}>{csvStatus.text}</p>}
            </div>
          )}

          {mode === 'json' && (
            <div>
              <textarea value={jsonInput} onChange={(e) => onJson(e.target.value)} spellCheck={false}
                className="input h-64 resize-y font-mono text-xs text-emerald-300" />
              {jsonError && <p className="mt-2 text-xs text-rose-300">{jsonError}</p>}
            </div>
          )}
        </Card>
      </div>

      <Card delay={100} className="flex flex-col">
        <CardHeader icon={Brain} title={`Transactions (${transactions.length})`}
          subtitle={`Total ${inr(total)}. Categories come from the TF-IDF + Logistic Regression model after analysis.`}
          right={<button onClick={() => onAnalyze(transactions, income, goal === '' ? null : Number(goal))} disabled={!canAnalyze} className="btn-primary">
            <Sparkles size={15} /> {loading ? 'Analysing…' : 'Run all agents'}
          </button>} />
        <div className="-mx-5 flex-1 overflow-x-auto sm:-mx-6">
          <div className="max-h-[34rem] overflow-y-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-ink-900/95 text-[11px] uppercase tracking-wider text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-5 py-2.5 font-medium sm:px-6">Date</th>
                  <th className="px-3 py-2.5 font-medium">Description</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 sm:px-6" />
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center text-sm text-slate-500">No transactions yet. Add some, or load a scenario.</td></tr>
                )}
                {transactions.map((t, i) => {
                  const info = labels.get(keyOf(t));
                  const category = t.category || info?.category;
                  return (
                    <tr key={i} className="group border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-slate-500 sm:px-6">{t.date}</td>
                      <td className="max-w-[16rem] truncate px-3 py-2.5 text-slate-200">{t.description}</td>
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
                        <button onClick={() => update(transactions.filter((_, j) => j !== i))} aria-label="Remove"
                          className="text-slate-600 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100">
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
