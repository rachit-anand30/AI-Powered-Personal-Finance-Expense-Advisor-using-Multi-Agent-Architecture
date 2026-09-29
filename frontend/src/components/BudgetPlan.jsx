import React from 'react';
import { Target, CheckCircle2, ChevronRight } from 'lucide-react';

const BudgetPlan = ({ plan }) => {
  if (!plan) return <div className="text-gray-400 text-center mt-10">No budget plan available.</div>;

  const { rule_50_30_20, actual, limits, saving_tips } = plan;

  const renderProgressBar = (label, budgeted, spent, colorClass) => {
    const percentage = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
    const isOver = spent > budgeted;
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h4 className="font-semibold text-white">{label}</h4>
            <p className="text-xs text-gray-400">Target: {label.includes('Needs') ? '50%' : label.includes('Wants') ? '30%' : '20%'}</p>
          </div>
          <div className="text-right">
            <span className={`font-bold ${isOver ? 'text-red-400' : 'text-white'}`}>₹{spent.toLocaleString()}</span>
            <span className="text-gray-500 text-sm mx-1">/</span>
            <span className="text-gray-400 text-sm">₹{budgeted.toLocaleString()}</span>
          </div>
        </div>
        <div className="h-4 w-full bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${isOver ? 'bg-red-500' : colorClass} transition-all duration-1000`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {isOver && <p className="text-xs text-red-400 mt-1 mt-1 flex items-center gap-1"><AlertCircle size={12}/> Exceeded target by ₹{(spent - budgeted).toLocaleString()}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 50-30-20 Rule Progress */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
            <Target className="text-purple-500" size={24} />
            <h2 className="text-xl font-bold text-white">50/30/20 Rule Analysis</h2>
          </div>
          
          {rule_50_30_20 && actual ? (
            <>
              {renderProgressBar('Needs (Housing, Food, Utilities)', rule_50_30_20.needs, actual.needs, 'bg-blue-500')}
              {renderProgressBar('Wants (Entertainment, Shopping)', rule_50_30_20.wants, actual.wants, 'bg-purple-500')}
              {renderProgressBar('Savings (Investments, Emergency)', rule_50_30_20.savings, actual.savings, 'bg-green-500')}
            </>
          ) : (
            <p className="text-gray-400 text-sm">Data incomplete for 50/30/20 analysis.</p>
          )}
        </div>

        {/* Suggested Category Limits */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Recommended Limits</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {limits && Object.entries(limits).map(([category, limit], idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                <span className="text-gray-300 font-medium">{category}</span>
                <span className="text-white font-bold bg-gray-800 px-3 py-1 rounded">₹{limit.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saving Tips */}
      {saving_tips && saving_tips.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-500" /> Actionable Tips
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {saving_tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-gray-900 p-4 rounded-lg border border-gray-700">
                <ChevronRight className="text-purple-500 shrink-0 mt-0.5" size={18} />
                <span className="text-gray-300 text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Add missing icon
import { AlertCircle } from 'lucide-react';

export default BudgetPlan;
