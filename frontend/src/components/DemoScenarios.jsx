import React from 'react';
import { Play, User, AlertTriangle, ShieldAlert, LineChart } from 'lucide-react';
import { DEMO_TRANSACTIONS, DEMO_INCOME, DEMO_ANALYSIS_RESULT } from '../data/demoData';

const DemoScenarios = ({ onLoadScenario }) => {
  
  const scenarios = [
    {
      id: 'normal',
      title: 'Normal User Profile',
      description: 'Healthy spending habits, sticking close to budget limits with regular savings.',
      icon: User,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      action: () => {
        // Clone demo data and remove anomaly
        const txns = DEMO_TRANSACTIONS.filter(t => t.amount < 70000);
        const result = JSON.parse(JSON.stringify(DEMO_ANALYSIS_RESULT));
        result.anomaly_detection.anomalies = [];
        result.expense_analysis.budget_health_score = 85;
        result.expense_analysis.total_expenses = 50050; // Adjusted
        result.advice.recommendations = result.advice.recommendations.filter(r => r.urgency !== 'red');
        result.advice.summary = "Your financial health is excellent. You are following the 50/30/20 rule well.";
        onLoadScenario(txns, DEMO_INCOME, result);
      }
    },
    {
      id: 'overspending',
      title: 'Overspending Detection',
      description: 'User consistently exceeding the 50% "Needs" limit due to high rent and food costs.',
      icon: AlertTriangle,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      action: () => {
        const txns = DEMO_TRANSACTIONS.filter(t => t.amount < 70000); // Remove the 75k anomaly
        const result = JSON.parse(JSON.stringify(DEMO_ANALYSIS_RESULT));
        result.anomaly_detection.anomalies = [];
        result.expense_analysis.budget_health_score = 55;
        result.advice.recommendations = result.advice.recommendations.filter(r => r.urgency !== 'red');
        result.advice.summary = "You are spending too much on 'Needs'. Consider reviewing your housing and food expenses.";
        onLoadScenario(txns, DEMO_INCOME, result);
      }
    },
    {
      id: 'fraud',
      title: 'Fraud / Anomaly Detection',
      description: 'Sudden high-value transaction outside normal spending patterns (Default Demo).',
      icon: ShieldAlert,
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      action: () => {
        onLoadScenario(DEMO_TRANSACTIONS, DEMO_INCOME, DEMO_ANALYSIS_RESULT);
      }
    },
    {
      id: 'prediction',
      title: 'Expense Prediction',
      description: 'Shows rising trend in expenses over 6 months, predicting budget breach next month.',
      icon: LineChart,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      action: () => {
        const result = JSON.parse(JSON.stringify(DEMO_ANALYSIS_RESULT));
        result.prediction.historical = [
          { month: 'Jun', amount: 35000 },
          { month: 'Jul', amount: 38000 },
          { month: 'Aug', amount: 42000 },
          { month: 'Sep', amount: 45000 },
          { month: 'Oct', amount: 48000 },
          { month: 'Nov', amount: 52000 }
        ];
        result.prediction.next_month_prediction = 56000;
        result.prediction.trend = 'increasing';
        onLoadScenario(DEMO_TRANSACTIONS, DEMO_INCOME, result);
      }
    }
  ];

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-4">Try Pre-built AI Scenarios</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Experience how the multi-agent AI system responds to different financial behaviors and events. 
          Click on any scenario below to load the data instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <div 
              key={scenario.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-500 transition-all cursor-pointer group flex flex-col h-full"
              onClick={scenario.action}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg border ${scenario.color}`}>
                  <Icon size={24} />
                </div>
                <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={16} className="ml-0.5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{scenario.title}</h3>
              <p className="text-sm text-gray-400 flex-grow">{scenario.description}</p>
              
              <div className="mt-6 pt-4 border-t border-gray-700">
                <span className="text-sm font-medium text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                  Load Scenario <Play size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DemoScenarios;
