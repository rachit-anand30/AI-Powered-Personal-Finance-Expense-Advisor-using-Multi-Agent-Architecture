import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionUpload from './components/TransactionUpload';
import BudgetPlan from './components/BudgetPlan';
import PredictionGraph from './components/PredictionGraph';
import AIRecommendations from './components/AIRecommendations';
import DemoScenarios from './components/DemoScenarios';
import { DEMO_TRANSACTIONS, DEMO_INCOME, DEMO_ANALYSIS_RESULT } from './data/demoData';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial load with demo data
    loadDemoScenario(DEMO_TRANSACTIONS, DEMO_INCOME, DEMO_ANALYSIS_RESULT);
  }, []);

  const loadDemoScenario = (txns, inc, result) => {
    setTransactions(txns);
    setIncome(inc);
    setAnalysisResult(result);
  };

  const handleAnalyze = async (newTxns, newIncome) => {
    setIsLoading(true);
    setTransactions(newTxns);
    setIncome(newIncome);
    
    // Simulate API call
    setTimeout(() => {
      setAnalysisResult(DEMO_ANALYSIS_RESULT); // In a real app, call the API here
      setIsLoading(false);
      setActiveTab('Dashboard');
    }, 1500);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        </div>
      );
    }

    if (!analysisResult) {
      return (
        <div className="flex justify-center items-center h-64 text-gray-400">
          No data available. Please upload transactions or load a demo scenario.
        </div>
      );
    }

    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard result={analysisResult} income={income} />;
      case 'Upload':
        return <TransactionUpload onAnalyze={handleAnalyze} initialTransactions={transactions} initialIncome={income} />;
      case 'Budget':
        return <BudgetPlan plan={analysisResult.budget_plan} />;
      case 'Predictions':
        return (
          <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
             <PredictionGraph data={analysisResult.prediction} income={income} />
          </div>
        );
      case 'Advice':
        return (
          <div className="max-w-4xl mx-auto mt-8">
            <AIRecommendations advice={analysisResult.advice} />
          </div>
        );
      case 'Demo':
        return <DemoScenarios onLoadScenario={loadDemoScenario} />;
      default:
        return <Dashboard result={analysisResult} income={income} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-12">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto px-4 mt-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
