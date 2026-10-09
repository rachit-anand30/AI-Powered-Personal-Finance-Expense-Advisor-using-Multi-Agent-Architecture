import axios from 'axios';

// Override with VITE_API_URL in frontend/.env when the backend runs elsewhere
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

const USER_ID = 'demo_user';

/** Shape the UI's transaction list into the backend's TransactionBatch. */
const toBatch = (transactions, income) => ({
  user_id: USER_ID,
  monthly_income: Number(income) || 0,
  transactions: transactions.map(({ date, description, amount, category }) => ({
    date,
    description,
    amount: Number(amount),
    ...(category ? { category } : {}),
  })),
});

/** Turn axios errors into one readable message. */
export const describeError = (error) => {
  if (!error.response) return 'Backend is offline. Start it with: uvicorn backend.main:app --reload';
  const detail = error.response.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.slice(-2).join(' → ')}: ${d.msg}`).join('; ');
  }
  if (detail?.error) return detail.error;
  return typeof detail === 'string' ? detail : `Request failed (${error.response.status})`;
};

export const isOffline = (error) => !error.response;

export const checkHealth = async () => (await api.get('/', { timeout: 4000 })).data;

/** Master endpoint: every agent through the coordinator. */
export const fullAnalysis = async (transactions, income, savingGoal, query) =>
  (await api.post('/full_analysis', {
    batch: toBatch(transactions, income),
    user_query: query || null,
    saving_goal: savingGoal ? Number(savingGoal) : null,
  })).data;

/** Ask the Advisor agent a natural-language question. */
export const getFinancialAdvice = async (transactions, income, savingGoal, query) =>
  (await api.post('/get_financial_advice', {
    batch: toBatch(transactions, income),
    user_query: query,
    saving_goal: savingGoal ? Number(savingGoal) : null,
  })).data;

export const uploadCsv = async (file, income) => {
  const form = new FormData();
  form.append('file', file);
  form.append('user_id', USER_ID);
  form.append('monthly_income', String(Number(income) || 0));
  return (await api.post('/upload_csv', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

export const classifyDescriptions = async (descriptions) => (await api.post('/classify', descriptions)).data;
