import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { getFinancialAdvice, describeError } from '../api/financeApi';
import { Card, CardHeader } from './ui';

const SUGGESTIONS = [
  'How can I save more?',
  'Can I afford a ₹30,000 phone?',
  'How can I save on food?',
  'Is there anything suspicious?',
  'What will I spend next month?',
  'Where should I invest?',
];

const AskAdvisor = ({ ctx, backendOnline, initial, compact = false, delay = 0 }) => {
  const [messages, setMessages] = useState(() =>
    initial ? [{ role: 'user', text: initial.query }, { role: 'bot', text: initial.answer, intent: initial.intent }] : []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const ask = async (question) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    if (!backendOnline) {
      setMessages((m) => [...m, { role: 'bot', text: 'I need the backend running to answer new questions. Start it with `uvicorn backend.main:app --reload`.', error: true }]);
      return;
    }
    setBusy(true);
    try {
      const advice = await getFinancialAdvice(ctx.transactions, ctx.income, ctx.savingGoal, q);
      const r = advice.response_to_query;
      setMessages((m) => [...m, { role: 'bot', text: r.answer, intent: r.intent, entities: r.entities }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'bot', text: describeError(err), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card delay={delay} className="flex h-full flex-col">
      <CardHeader icon={Sparkles} title="Ask the advisor" subtitle="Natural-language questions about your money" accent="text-emerald-300" />
      <div ref={scroller} className={`-mx-1 flex-1 space-y-3 overflow-y-auto px-1 ${compact ? 'max-h-64 min-h-[10rem]' : 'max-h-[28rem] min-h-[16rem]'}`}>
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">Try one of the questions below, or type your own.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 animate-fade-up ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${m.role === 'user' ? 'bg-violet-500/20 text-violet-200' : 'bg-emerald-500/15 text-emerald-300'}`}>
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              m.role === 'user' ? 'rounded-tr-sm bg-violet-600/80 text-white'
                : m.error ? 'rounded-tl-sm bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/20'
                : 'rounded-tl-sm bg-white/[0.05] text-slate-200 ring-1 ring-white/10'}`}>
              {m.text}
              {m.intent && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">intent: {m.intent}</span>
                  {m.entities?.amount && <span className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">amount: {m.entities.amount}</span>}
                  {m.entities?.category && <span className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">category: {m.entities.category}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300"><Bot size={14} /></div>
            <div className="flex items-center gap-1 rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
              {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 120}ms` }} />)}
            </div>
          </div>
        )}
      </div>

      <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400 transition-colors hover:border-violet-500/40 hover:text-white">
            {s}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="mt-3 flex gap-2">
        <input className="input" placeholder="e.g. Can I afford a 25k laptop?" value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" disabled={!input.trim() || busy} className="btn-primary px-3.5" aria-label="Send"><Send size={16} /></button>
      </form>
    </Card>
  );
};

export default AskAdvisor;
