import axios from 'axios';
import { DEMO_ANALYSIS_RESULT } from '../data/demoData';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadAndAnalyze = async (transactions, income) => {
  try {
    const response = await api.post('/analyze', { transactions, income });
    return response.data;
  } catch (error) {
    console.error('API Error, returning demo data:', error);
    return DEMO_ANALYSIS_RESULT;
  }
};

export const createBudget = async (transactions, income, savingGoal) => {
  try {
    const response = await api.post('/budget', { transactions, income, savingGoal });
    return response.data;
  } catch (error) {
    console.error('API Error, returning demo data:', error);
    return DEMO_ANALYSIS_RESULT.budget_plan;
  }
};

export const predictExpenses = async (transactions, income) => {
  try {
    const response = await api.post('/predict', { transactions, income });
    return response.data;
  } catch (error) {
    console.error('API Error, returning demo data:', error);
    return DEMO_ANALYSIS_RESULT.prediction;
  }
};

export const getFinancialAdvice = async (data, query) => {
  try {
    const response = await api.post('/advice', { data, query });
    return response.data;
  } catch (error) {
    console.error('API Error, returning demo data:', error);
    return DEMO_ANALYSIS_RESULT.advice;
  }
};

export const fullAnalysis = async (transactions, income, savingGoal, query) => {
  try {
    const response = await api.post('/full-analysis', { transactions, income, savingGoal, query });
    return response.data;
  } catch (error) {
    console.error('API Error, returning demo data:', error);
    return DEMO_ANALYSIS_RESULT;
  }
};
