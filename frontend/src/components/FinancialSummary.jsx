import React from 'react';
import { IndianRupee, TrendingDown, PiggyBank, Activity } from 'lucide-react';

const FinancialSummary = ({ income, expenses, healthScore }) => {
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Income Card */}
      <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-l-green-500 border border-gray-700 shadow-md flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Monthly Income</p>
          <h3 className="text-2xl font-bold text-white">₹{income.toLocaleString()}</h3>
        </div>
        <div className="bg-green-500/20 p-3 rounded-full">
          <IndianRupee className="text-green-500" size={24} />
        </div>
      </div>

      {/* Expenses Card */}
      <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-l-red-500 border border-gray-700 shadow-md flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Total Expenses</p>
          <h3 className="text-2xl font-bold text-white">₹{expenses.toLocaleString()}</h3>
        </div>
        <div className="bg-red-500/20 p-3 rounded-full">
          <TrendingDown className="text-red-500" size={24} />
        </div>
      </div>

      {/* Savings Card */}
      <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-l-blue-500 border border-gray-700 shadow-md flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Savings</p>
          <div className="flex items-baseline">
            <h3 className={`text-2xl font-bold ${savings >= 0 ? 'text-white' : 'text-red-400'}`}>
              ₹{savings.toLocaleString()}
            </h3>
            <span className="ml-2 text-sm text-gray-400">({savingsRate}%)</span>
          </div>
        </div>
        <div className="bg-blue-500/20 p-3 rounded-full">
          <PiggyBank className="text-blue-500" size={24} />
        </div>
      </div>

      {/* Health Score Card */}
      <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-l-purple-500 border border-gray-700 shadow-md flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Budget Health</p>
          <div className="flex items-baseline">
            <h3 className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
              {healthScore}/100
            </h3>
          </div>
        </div>
        <div className="bg-purple-500/20 p-3 rounded-full">
          <Activity className="text-purple-500" size={24} />
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
