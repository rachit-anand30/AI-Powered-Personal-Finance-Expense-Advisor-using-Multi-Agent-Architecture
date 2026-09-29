import React from 'react';
import { Activity } from 'lucide-react';

const Header = ({ activeTab, setActiveTab }) => {
  const tabs = ['Dashboard', 'Upload', 'Budget', 'Predictions', 'Advice', 'Demo'];

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg mr-3">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                AI Finance Advisor
              </h1>
              <p className="text-xs text-gray-400">Multi-Agent AI System • Foundation of AI Case Study</p>
            </div>
          </div>
          
          <nav className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
