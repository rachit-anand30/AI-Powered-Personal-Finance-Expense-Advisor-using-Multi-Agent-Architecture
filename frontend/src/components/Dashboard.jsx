import React from 'react';
import FinancialSummary from './FinancialSummary';
import ExpenseChart from './ExpenseChart';
import AnomalyAlerts from './AnomalyAlerts';
import BudgetAllocation from './BudgetAllocation';
import PredictionGraph from './PredictionGraph';
import AIRecommendations from './AIRecommendations';

const Dashboard = ({ result, income }) => {
  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <FinancialSummary 
        income={income}
        expenses={result.expense_analysis.total_expenses}
        healthScore={result.expense_analysis.budget_health_score}
      />

      {/* Row 2: Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <ExpenseChart categories={result.expense_analysis.categories} />
        </div>
        <div className="lg:col-span-1 bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg overflow-hidden flex flex-col">
          <AnomalyAlerts alerts={result.anomaly_detection.anomalies} />
        </div>
      </div>

      {/* Row 3: Budget and Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <BudgetAllocation plan={result.budget_plan} />
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <PredictionGraph data={result.prediction} income={income} />
        </div>
      </div>

      {/* Row 4: AI Recommendations */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
        <AIRecommendations advice={result.advice} />
      </div>
    </div>
  );
};

export default Dashboard;
